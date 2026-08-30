-- Hard server-side budget for paid realtime avatar rendering.
-- Billing is tracked from generated PCM duration plus a conservative per-utterance
-- streaming overhead. Public clients never access these tables directly.

create table if not exists public.ai_avatar_usage (
  entitlement_id uuid not null references public.access_entitlements(id) on delete cascade,
  case_id text not null check (case_id ~ '^[A-Za-z0-9_:-]{3,160}$'),
  consumed_ms bigint not null default 0 check (consumed_ms >= 0),
  utterances integer not null default 0 check (utterances >= 0),
  first_used_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entitlement_id, case_id)
);

create table if not exists public.ai_avatar_usage_events (
  session_id text primary key check (length(session_id) between 8 and 160),
  entitlement_id uuid not null references public.access_entitlements(id) on delete cascade,
  case_id text not null check (case_id ~ '^[A-Za-z0-9_:-]{3,160}$'),
  charge_ms integer not null check (charge_ms > 0),
  allowed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_avatar_usage_events_entitlement_case_idx
  on public.ai_avatar_usage_events (entitlement_id, case_id, created_at desc);

alter table public.ai_avatar_usage enable row level security;
alter table public.ai_avatar_usage_events enable row level security;
revoke all on table public.ai_avatar_usage from anon, authenticated;
revoke all on table public.ai_avatar_usage_events from anon, authenticated;

create or replace function public.claim_ai_avatar_usage(
  p_session_id text,
  p_entitlement_id uuid,
  p_case_id text,
  p_charge_ms integer,
  p_limit_ms integer
)
returns table (
  allowed boolean,
  duplicate boolean,
  consumed_ms bigint,
  remaining_ms bigint,
  utterances integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer := 0;
  v_consumed bigint := 0;
  v_utterances integer := 0;
begin
  if p_session_id is null or length(p_session_id) < 8 or length(p_session_id) > 160
     or p_case_id !~ '^[A-Za-z0-9_:-]{3,160}$'
     or p_charge_ms <= 0 or p_limit_ms <= 0 or p_charge_ms > p_limit_ms then
    return query select false, false, 0::bigint, greatest(coalesce(p_limit_ms, 0), 0)::bigint, 0;
    return;
  end if;

  insert into public.ai_avatar_usage_events (
    session_id, entitlement_id, case_id, charge_ms, allowed
  ) values (
    p_session_id, p_entitlement_id, p_case_id, p_charge_ms, false
  ) on conflict (session_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted = 0 then
    select u.consumed_ms, u.utterances
      into v_consumed, v_utterances
      from public.ai_avatar_usage u
      where u.entitlement_id = p_entitlement_id and u.case_id = p_case_id;
    return query select false, true, coalesce(v_consumed, 0), greatest(p_limit_ms::bigint - coalesce(v_consumed, 0), 0::bigint), coalesce(v_utterances, 0);
    return;
  end if;

  insert into public.ai_avatar_usage as u (
    entitlement_id, case_id, consumed_ms, utterances
  ) values (
    p_entitlement_id, p_case_id, p_charge_ms, 1
  )
  on conflict (entitlement_id, case_id) do update
    set consumed_ms = u.consumed_ms + excluded.consumed_ms,
        utterances = u.utterances + 1,
        updated_at = now()
    where u.consumed_ms + excluded.consumed_ms <= p_limit_ms
  returning ai_avatar_usage.consumed_ms, ai_avatar_usage.utterances
    into v_consumed, v_utterances;

  if found then
    update public.ai_avatar_usage_events
      set allowed = true
      where session_id = p_session_id;
    return query select true, false, v_consumed, greatest(p_limit_ms::bigint - v_consumed, 0::bigint), v_utterances;
    return;
  end if;

  select u.consumed_ms, u.utterances
    into v_consumed, v_utterances
    from public.ai_avatar_usage u
    where u.entitlement_id = p_entitlement_id and u.case_id = p_case_id;
  return query select false, false, coalesce(v_consumed, 0), greatest(p_limit_ms::bigint - coalesce(v_consumed, 0), 0::bigint), coalesce(v_utterances, 0);
end;
$$;

revoke all on function public.claim_ai_avatar_usage(text, uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_ai_avatar_usage(text, uuid, text, integer, integer) to service_role;

comment on table public.ai_avatar_usage is
  'Server-only cumulative LiveAvatar budget per paid entitlement and case.';
comment on table public.ai_avatar_usage_events is
  'Server-only one-shot LiveAvatar speech claims keyed by LiveAvatar session id.';
