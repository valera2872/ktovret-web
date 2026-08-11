create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  case_id text not null,
  case_title text not null,
  case_path text not null,
  challenger_name text not null default 'Следователь',
  challenger_elapsed_seconds integer not null check (challenger_elapsed_seconds between 1 and 21600),
  challenger_hints_used integer not null default 0 check (challenger_hints_used between 0 and 10),
  challenger_attempts integer not null default 1 check (challenger_attempts between 1 and 20),
  challenger_first_answer_correct boolean not null default false,
  creator_key_hash text not null,
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  constraint challenges_code_format check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  constraint challenges_case_id_format check (case_id ~ '^[A-Za-z0-9_:-]{3,160}$'),
  constraint challenges_case_path_format check (case_path ~ '^/(delo|ru/cases)/[a-z0-9-]+/$'),
  constraint challenges_name_length check (char_length(challenger_name) between 1 and 32),
  constraint challenges_title_length check (char_length(case_title) between 1 and 120)
);

create index if not exists challenges_creator_key_created_idx
  on public.challenges (creator_key_hash, created_at desc);
create index if not exists challenges_expires_idx
  on public.challenges (expires_at)
  where status = 'active';

create table if not exists public.challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  player_key_hash text not null,
  elapsed_seconds integer not null check (elapsed_seconds between 1 and 21600),
  hints_used integer not null default 0 check (hints_used between 0 and 10),
  attempts integer not null default 1 check (attempts between 1 and 20),
  first_answer_correct boolean not null default false,
  completed_at timestamptz not null default now(),
  unique (challenge_id, player_key_hash)
);

create index if not exists challenge_attempts_challenge_completed_idx
  on public.challenge_attempts (challenge_id, completed_at desc);

alter table public.challenges enable row level security;
alter table public.challenge_attempts enable row level security;

revoke all on table public.challenges from anon, authenticated;
revoke all on table public.challenge_attempts from anon, authenticated;

grant all on table public.challenges to service_role;
grant all on table public.challenge_attempts to service_role;
