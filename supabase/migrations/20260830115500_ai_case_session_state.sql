-- Server-authoritative investigation state for data-driven paid AI cases.
-- Browser state is a cache/display concern only; unlocks and confession progress
-- are persisted here and are never accepted as authoritative client claims.

create table if not exists public.ai_case_sessions (
  session_key text primary key check (session_key ~ '^[0-9a-f]{64}$'),
  case_id text not null references public.ai_case_canon(case_id) on delete cascade,
  entitlement_id uuid not null references public.access_entitlements(id) on delete cascade,
  state jsonb not null default '{"successful_turns":0,"question_counts":{},"evidence_ids":[],"note_ids":[],"stages":{}}'::jsonb
    check (jsonb_typeof(state) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_success_at timestamptz,
  unique (case_id, entitlement_id, session_key)
);

create index if not exists ai_case_sessions_entitlement_case_idx
  on public.ai_case_sessions (entitlement_id, case_id, updated_at desc);

alter table public.ai_case_sessions enable row level security;
revoke all on table public.ai_case_sessions from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_case_sessions to service_role;

comment on table public.ai_case_sessions is
  'Server-only authoritative evidence/note/question/stage state for paid AI detective sessions.';
