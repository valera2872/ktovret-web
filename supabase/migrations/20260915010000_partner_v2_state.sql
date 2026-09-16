-- Partner V2 state is isolated from existing 23:17, 407 and Last Aria flows.
-- Existing duel room tables remain the source of room membership and player identity.

alter table public.duel_rooms
  drop constraint if exists duel_rooms_case_path_format;

alter table public.duel_rooms
  add constraint duel_rooms_case_path_format check (
    case_path ~ '^/ru/cases/[a-z0-9-]+/$'
    or case_path ~ '^/detektivnye-igry-dlya-dvoih/[a-z0-9-]+/$'
  );

create table if not exists public.partner_v2_room_state (
  room_id uuid primary key references public.duel_rooms(id) on delete cascade,
  case_id text not null,
  case_version integer not null default 1 check (case_version between 1 and 100000),
  chapter integer not null default 1 check (chapter between 1 and 20),
  revision bigint not null default 1 check (revision >= 1),
  shared_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_v2_player_state (
  room_id uuid not null references public.duel_rooms(id) on delete cascade,
  player_id uuid not null references public.duel_room_players(id) on delete cascade,
  role text not null check (role in ('creator', 'guest')),
  revision bigint not null default 1 check (revision >= 1),
  private_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (room_id, role),
  unique (room_id, player_id)
);

create index if not exists partner_v2_player_state_player_idx
  on public.partner_v2_player_state(player_id);

alter table public.partner_v2_room_state enable row level security;
alter table public.partner_v2_player_state enable row level security;

revoke all on table public.partner_v2_room_state from anon, authenticated;
revoke all on table public.partner_v2_player_state from anon, authenticated;

grant all on table public.partner_v2_room_state to service_role;
grant all on table public.partner_v2_player_state to service_role;

-- Atomic P0 checkpoint. It records a player's first hypothesis, then unlocks
-- chapter 2 only after both roles have submitted. The revision protects two
-- simultaneous browser mutations from overwriting each other.
create or replace function public.partner_v2_submit_initial_hypothesis(
  p_room_id uuid,
  p_player_id uuid,
  p_role text,
  p_value text,
  p_expected_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state public.partner_v2_room_state%rowtype;
  v_private jsonb;
  v_other_submitted boolean;
  v_next_chapter integer;
begin
  if p_role not in ('creator', 'guest') then
    return jsonb_build_object('ok', false, 'error', 'invalid_role');
  end if;

  if p_value not in ('before_departure', 'while_moving', 'during_stop', 'after_arrival', 'insufficient') then
    return jsonb_build_object('ok', false, 'error', 'invalid_hypothesis');
  end if;

  select * into v_state
  from public.partner_v2_room_state
  where room_id = p_room_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'partner_state_missing');
  end if;

  if v_state.revision <> p_expected_revision then
    return jsonb_build_object(
      'ok', false,
      'error', 'state_conflict',
      'currentRevision', v_state.revision
    );
  end if;

  select private_state into v_private
  from public.partner_v2_player_state
  where room_id = p_room_id and player_id = p_player_id and role = p_role
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'player_state_missing');
  end if;

  -- Idempotent repeat of the same answer does not advance revision again.
  if coalesce(v_private->>'firstHypothesis', '') = p_value then
    return jsonb_build_object(
      'ok', true,
      'revision', v_state.revision,
      'chapter', v_state.chapter,
      'idempotent', true
    );
  end if;

  update public.partner_v2_player_state
  set private_state = jsonb_set(private_state, '{firstHypothesis}', to_jsonb(p_value), true),
      revision = revision + 1,
      updated_at = now()
  where room_id = p_room_id and player_id = p_player_id and role = p_role;

  select exists (
    select 1
    from public.partner_v2_player_state
    where room_id = p_room_id
      and role <> p_role
      and coalesce(private_state->>'firstHypothesis', '') <> ''
  ) into v_other_submitted;

  v_next_chapter := case when v_other_submitted then greatest(v_state.chapter, 2) else v_state.chapter end;

  update public.partner_v2_room_state
  set chapter = v_next_chapter,
      revision = revision + 1,
      shared_state = case
        when v_other_submitted then jsonb_set(shared_state, '{initialHypothesesComplete}', 'true'::jsonb, true)
        else shared_state
      end,
      updated_at = now()
  where room_id = p_room_id
  returning * into v_state;

  return jsonb_build_object(
    'ok', true,
    'revision', v_state.revision,
    'chapter', v_state.chapter,
    'initialHypothesesComplete', coalesce((v_state.shared_state->>'initialHypothesesComplete')::boolean, false)
  );
end;
$$;

revoke all on function public.partner_v2_submit_initial_hypothesis(uuid, uuid, text, text, bigint) from public, anon, authenticated;
grant execute on function public.partner_v2_submit_initial_hypothesis(uuid, uuid, text, text, bigint) to service_role;
