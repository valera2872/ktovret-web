create table if not exists public.ai_detective_sessions (
  session_id text primary key,
  visitor_hash text not null,
  last_network_hash text not null,
  successful_turns integer not null default 0 check (successful_turns >= 0),
  reserved_turns integer not null default 0 check (reserved_turns >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_success_at timestamptz,
  completed_at timestamptz
);

create table if not exists public.ai_detective_daily_quota (
  quota_day date not null,
  quota_kind text not null check (quota_kind in ('visitor','network')),
  quota_key text not null,
  successful_turns integer not null default 0 check (successful_turns >= 0),
  reserved_turns integer not null default 0 check (reserved_turns >= 0),
  updated_at timestamptz not null default now(),
  primary key (quota_day, quota_kind, quota_key)
);

create table if not exists public.ai_detective_daily_budget (
  quota_day date primary key,
  spent_usd numeric(14,8) not null default 0 check (spent_usd >= 0),
  reserved_usd numeric(14,8) not null default 0 check (reserved_usd >= 0),
  successful_calls integer not null default 0 check (successful_calls >= 0),
  input_tokens bigint not null default 0 check (input_tokens >= 0),
  cached_input_tokens bigint not null default 0 check (cached_input_tokens >= 0),
  output_tokens bigint not null default 0 check (output_tokens >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_detective_ai_calls (
  claim_id uuid primary key default gen_random_uuid(),
  quota_day date not null,
  session_id text not null,
  visitor_hash text not null,
  network_hash text not null,
  status text not null default 'claimed' check (status in ('claimed','completed','failed','expired')),
  reserve_usd numeric(14,8) not null default 0,
  actual_usd numeric(14,8),
  input_tokens bigint,
  cached_input_tokens bigint,
  output_tokens bigint,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_detective_calls_session_recent_idx on public.ai_detective_ai_calls (session_id, created_at desc);
create index if not exists ai_detective_calls_network_recent_idx on public.ai_detective_ai_calls (network_hash, created_at desc);
create index if not exists ai_detective_calls_status_created_idx on public.ai_detective_ai_calls (status, created_at);

revoke all on public.ai_detective_sessions from public, anon, authenticated;
revoke all on public.ai_detective_daily_quota from public, anon, authenticated;
revoke all on public.ai_detective_daily_budget from public, anon, authenticated;
revoke all on public.ai_detective_ai_calls from public, anon, authenticated;

create or replace function public.ai_detective_claim_turn(
  p_session_id text,
  p_visitor_hash text,
  p_network_hash text,
  p_reserve_usd numeric default 0.005,
  p_session_limit integer default 14,
  p_visitor_daily_limit integer default 30,
  p_network_daily_limit integer default 120,
  p_daily_budget_usd numeric default 0.50,
  p_session_rpm integer default 6,
  p_network_rpm integer default 30
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (timezone('utc', now()))::date;
  v_session public.ai_detective_sessions%rowtype;
  v_visitor public.ai_detective_daily_quota%rowtype;
  v_network public.ai_detective_daily_quota%rowtype;
  v_budget public.ai_detective_daily_budget%rowtype;
  v_claim uuid;
  v_count integer;
  v_stale public.ai_detective_ai_calls%rowtype;
begin
  perform pg_advisory_xact_lock(820260828);

  if p_session_id is null or length(p_session_id) < 8 or length(p_session_id) > 96 then
    return jsonb_build_object('ok',false,'code','invalid_session');
  end if;
  if p_visitor_hash is null or length(p_visitor_hash) < 32 or p_network_hash is null or length(p_network_hash) < 32 then
    return jsonb_build_object('ok',false,'code','invalid_visitor');
  end if;

  for v_stale in
    select * from public.ai_detective_ai_calls
    where status='claimed' and created_at < now() - interval '5 minutes'
    for update
  loop
    update public.ai_detective_sessions
      set reserved_turns=greatest(0,reserved_turns-1), updated_at=now()
      where session_id=v_stale.session_id;
    update public.ai_detective_daily_quota
      set reserved_turns=greatest(0,reserved_turns-1), updated_at=now()
      where quota_day=v_stale.quota_day and quota_kind='visitor' and quota_key=v_stale.visitor_hash;
    update public.ai_detective_daily_quota
      set reserved_turns=greatest(0,reserved_turns-1), updated_at=now()
      where quota_day=v_stale.quota_day and quota_kind='network' and quota_key=v_stale.network_hash;
    update public.ai_detective_daily_budget
      set reserved_usd=greatest(0,reserved_usd-v_stale.reserve_usd), updated_at=now()
      where quota_day=v_stale.quota_day;
    update public.ai_detective_ai_calls set status='expired', completed_at=now() where claim_id=v_stale.claim_id;
  end loop;

  insert into public.ai_detective_daily_budget(quota_day) values(v_day)
    on conflict (quota_day) do nothing;
  select * into v_budget from public.ai_detective_daily_budget where quota_day=v_day for update;

  insert into public.ai_detective_sessions(session_id,visitor_hash,last_network_hash)
    values(p_session_id,p_visitor_hash,p_network_hash)
    on conflict (session_id) do nothing;
  select * into v_session from public.ai_detective_sessions where session_id=p_session_id for update;
  if v_session.visitor_hash <> p_visitor_hash then
    return jsonb_build_object('ok',false,'code','session_owner_mismatch');
  end if;
  update public.ai_detective_sessions set last_network_hash=p_network_hash, updated_at=now() where session_id=p_session_id;

  insert into public.ai_detective_daily_quota(quota_day,quota_kind,quota_key)
    values(v_day,'visitor',p_visitor_hash)
    on conflict (quota_day,quota_kind,quota_key) do nothing;
  select * into v_visitor from public.ai_detective_daily_quota
    where quota_day=v_day and quota_kind='visitor' and quota_key=p_visitor_hash for update;

  insert into public.ai_detective_daily_quota(quota_day,quota_kind,quota_key)
    values(v_day,'network',p_network_hash)
    on conflict (quota_day,quota_kind,quota_key) do nothing;
  select * into v_network from public.ai_detective_daily_quota
    where quota_day=v_day and quota_kind='network' and quota_key=p_network_hash for update;

  if v_session.successful_turns + v_session.reserved_turns >= p_session_limit then
    return jsonb_build_object('ok',false,'code','session_limit','remaining',0);
  end if;
  if v_visitor.successful_turns + v_visitor.reserved_turns >= p_visitor_daily_limit then
    return jsonb_build_object('ok',false,'code','visitor_daily_limit','remaining',0);
  end if;
  if v_network.successful_turns + v_network.reserved_turns >= p_network_daily_limit then
    return jsonb_build_object('ok',false,'code','network_daily_limit','remaining',0);
  end if;
  if v_budget.spent_usd + v_budget.reserved_usd + p_reserve_usd > p_daily_budget_usd then
    return jsonb_build_object('ok',false,'code','daily_budget','remaining_usd',greatest(0,p_daily_budget_usd-v_budget.spent_usd-v_budget.reserved_usd));
  end if;

  select count(*) into v_count from public.ai_detective_ai_calls
    where session_id=p_session_id and created_at >= now()-interval '1 minute';
  if v_count >= p_session_rpm then
    return jsonb_build_object('ok',false,'code','session_rate_limit','retry_after_seconds',60);
  end if;
  select count(*) into v_count from public.ai_detective_ai_calls
    where network_hash=p_network_hash and created_at >= now()-interval '1 minute';
  if v_count >= p_network_rpm then
    return jsonb_build_object('ok',false,'code','network_rate_limit','retry_after_seconds',60);
  end if;

  update public.ai_detective_sessions set reserved_turns=reserved_turns+1, updated_at=now() where session_id=p_session_id;
  update public.ai_detective_daily_quota set reserved_turns=reserved_turns+1, updated_at=now()
    where quota_day=v_day and quota_kind='visitor' and quota_key=p_visitor_hash;
  update public.ai_detective_daily_quota set reserved_turns=reserved_turns+1, updated_at=now()
    where quota_day=v_day and quota_kind='network' and quota_key=p_network_hash;
  update public.ai_detective_daily_budget set reserved_usd=reserved_usd+p_reserve_usd, updated_at=now() where quota_day=v_day;

  insert into public.ai_detective_ai_calls(quota_day,session_id,visitor_hash,network_hash,reserve_usd)
    values(v_day,p_session_id,p_visitor_hash,p_network_hash,p_reserve_usd)
    returning claim_id into v_claim;

  return jsonb_build_object(
    'ok',true,
    'claim_id',v_claim,
    'session_remaining',p_session_limit-(v_session.successful_turns+v_session.reserved_turns+1),
    'visitor_remaining_today',p_visitor_daily_limit-(v_visitor.successful_turns+v_visitor.reserved_turns+1),
    'budget_remaining_usd',greatest(0,p_daily_budget_usd-(v_budget.spent_usd+v_budget.reserved_usd+p_reserve_usd))
  );
end;
$$;

create or replace function public.ai_detective_complete_turn(
  p_claim_id uuid,
  p_actual_usd numeric,
  p_input_tokens bigint,
  p_cached_input_tokens bigint,
  p_output_tokens bigint
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call public.ai_detective_ai_calls%rowtype;
begin
  perform pg_advisory_xact_lock(820260828);
  select * into v_call from public.ai_detective_ai_calls where claim_id=p_claim_id for update;
  if not found then return jsonb_build_object('ok',false,'code','claim_not_found'); end if;
  if v_call.status='completed' then return jsonb_build_object('ok',true,'code','already_completed'); end if;
  if v_call.status<>'claimed' then return jsonb_build_object('ok',false,'code','claim_not_active'); end if;

  update public.ai_detective_sessions
    set reserved_turns=greatest(0,reserved_turns-1), successful_turns=successful_turns+1,
        last_success_at=now(), updated_at=now()
    where session_id=v_call.session_id;
  update public.ai_detective_daily_quota
    set reserved_turns=greatest(0,reserved_turns-1), successful_turns=successful_turns+1, updated_at=now()
    where quota_day=v_call.quota_day and quota_kind='visitor' and quota_key=v_call.visitor_hash;
  update public.ai_detective_daily_quota
    set reserved_turns=greatest(0,reserved_turns-1), successful_turns=successful_turns+1, updated_at=now()
    where quota_day=v_call.quota_day and quota_kind='network' and quota_key=v_call.network_hash;
  update public.ai_detective_daily_budget
    set reserved_usd=greatest(0,reserved_usd-v_call.reserve_usd),
        spent_usd=spent_usd+greatest(0,p_actual_usd),
        successful_calls=successful_calls+1,
        input_tokens=input_tokens+greatest(0,p_input_tokens),
        cached_input_tokens=cached_input_tokens+greatest(0,p_cached_input_tokens),
        output_tokens=output_tokens+greatest(0,p_output_tokens),
        updated_at=now()
    where quota_day=v_call.quota_day;
  update public.ai_detective_ai_calls
    set status='completed', actual_usd=greatest(0,p_actual_usd),
        input_tokens=greatest(0,p_input_tokens), cached_input_tokens=greatest(0,p_cached_input_tokens),
        output_tokens=greatest(0,p_output_tokens), completed_at=now()
    where claim_id=p_claim_id;
  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.ai_detective_release_turn(p_claim_id uuid) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_call public.ai_detective_ai_calls%rowtype;
begin
  perform pg_advisory_xact_lock(820260828);
  select * into v_call from public.ai_detective_ai_calls where claim_id=p_claim_id for update;
  if not found then return jsonb_build_object('ok',false,'code','claim_not_found'); end if;
  if v_call.status<>'claimed' then return jsonb_build_object('ok',true,'code','already_released'); end if;
  update public.ai_detective_sessions set reserved_turns=greatest(0,reserved_turns-1), updated_at=now() where session_id=v_call.session_id;
  update public.ai_detective_daily_quota set reserved_turns=greatest(0,reserved_turns-1), updated_at=now()
    where quota_day=v_call.quota_day and quota_kind='visitor' and quota_key=v_call.visitor_hash;
  update public.ai_detective_daily_quota set reserved_turns=greatest(0,reserved_turns-1), updated_at=now()
    where quota_day=v_call.quota_day and quota_kind='network' and quota_key=v_call.network_hash;
  update public.ai_detective_daily_budget set reserved_usd=greatest(0,reserved_usd-v_call.reserve_usd), updated_at=now() where quota_day=v_call.quota_day;
  update public.ai_detective_ai_calls set status='failed', completed_at=now() where claim_id=v_call.claim_id;
  return jsonb_build_object('ok',true);
end;
$$;

revoke all on function public.ai_detective_claim_turn(text,text,text,numeric,integer,integer,integer,numeric,integer,integer) from public, anon, authenticated;
revoke all on function public.ai_detective_complete_turn(uuid,numeric,bigint,bigint,bigint) from public, anon, authenticated;
revoke all on function public.ai_detective_release_turn(uuid) from public, anon, authenticated;
grant execute on function public.ai_detective_claim_turn(text,text,text,numeric,integer,integer,integer,numeric,integer,integer) to service_role;
grant execute on function public.ai_detective_complete_turn(uuid,numeric,bigint,bigint,bigint) to service_role;
grant execute on function public.ai_detective_release_turn(uuid) to service_role;
