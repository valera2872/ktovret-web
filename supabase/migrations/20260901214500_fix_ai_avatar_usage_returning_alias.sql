-- Fix PostgreSQL target-table alias use in the LiveAvatar budget claim RPC.
-- The INSERT aliases ai_avatar_usage as `u`; RETURNING must use that alias.

create or replace function public.claim_ai_avatar_usage(
  p_session_id text,
  p_utterance_id text,
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
     or p_utterance_id is null or length(p_utterance_id) < 16 or length(p_utterance_id) > 80
     or p_case_id !~ '^[A-Za-z0-9_:-]{3,160}$'
     or p_charge_ms <= 0 or p_limit_ms <= 0 or p_charge_ms > p_limit_ms then
    return query select false, false, 0::bigint, greatest(coalesce(p_limit_ms, 0), 0)::bigint, 0;
    return;
  end if;

  insert into public.ai_avatar_usage_events (
    session_id, utterance_id, entitlement_id, case_id, charge_ms, allowed
  ) values (
    p_session_id, p_utterance_id, p_entitlement_id, p_case_id, p_charge_ms, false
  ) on conflict (session_id, utterance_id) do nothing;
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
  returning u.consumed_ms, u.utterances
    into v_consumed, v_utterances;

  if found then
    update public.ai_avatar_usage_events
      set allowed = true
      where session_id = p_session_id and utterance_id = p_utterance_id;
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

revoke all on function public.claim_ai_avatar_usage(text, text, uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.claim_ai_avatar_usage(text, text, uuid, text, integer, integer) to service_role;
