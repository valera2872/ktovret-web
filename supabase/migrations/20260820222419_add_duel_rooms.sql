-- Isolated two-player room state. Browser roles have no direct table access;
-- all room operations go through the duel-room Edge Function. The room stores
-- only participation/performance metadata, never case answers or protected payloads.
-- Active rooms expire after seven days.
create table if not exists public.duel_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  case_id text not null,
  case_title text not null,
  case_path text not null,
  creator_key_hash text not null,
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  constraint duel_rooms_code_format check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  constraint duel_rooms_case_id_format check (case_id ~ '^[A-Za-z0-9_:-]{3,160}$'),
  constraint duel_rooms_case_path_format check (case_path ~ '^/ru/cases/[a-z0-9-]+/$'),
  constraint duel_rooms_title_length check (char_length(case_title) between 1 and 120)
);

create index if not exists duel_rooms_creator_created_idx
  on public.duel_rooms (creator_key_hash, created_at desc);
create index if not exists duel_rooms_expires_idx
  on public.duel_rooms (expires_at)
  where status = 'active';

create table if not exists public.duel_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.duel_rooms(id) on delete cascade,
  role text not null check (role in ('creator','guest')),
  player_key_hash text not null,
  player_name text not null,
  joined_at timestamptz not null default now(),
  started_at timestamptz,
  elapsed_seconds integer check (elapsed_seconds between 1 and 21600),
  hints_used integer check (hints_used between 0 and 10),
  attempts integer check (attempts between 1 and 20),
  first_answer_correct boolean,
  completed_at timestamptz,
  constraint duel_room_players_name_length check (char_length(player_name) between 1 and 32),
  unique (room_id, role),
  unique (room_id, player_key_hash),
  constraint duel_room_players_completion_consistency check (
    (completed_at is null and elapsed_seconds is null and hints_used is null and attempts is null and first_answer_correct is null)
    or
    (completed_at is not null and elapsed_seconds is not null and hints_used is not null and attempts is not null and first_answer_correct is not null)
  )
);

create index if not exists duel_room_players_room_idx
  on public.duel_room_players (room_id, role);

alter table public.duel_rooms enable row level security;
alter table public.duel_room_players enable row level security;

revoke all on table public.duel_rooms from anon, authenticated;
revoke all on table public.duel_room_players from anon, authenticated;

grant all on table public.duel_rooms to service_role;
grant all on table public.duel_room_players to service_role;
