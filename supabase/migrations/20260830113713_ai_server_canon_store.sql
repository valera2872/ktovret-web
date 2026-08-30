-- Server-only canonical truth for paid AI detective cases.
-- The browser receives paid_case_payloads through case-access; culprit truth,
-- suspect knowledge boundaries and progression rules stay in this private store.

create table if not exists public.ai_case_canon (
  case_id text primary key references public.paid_case_payloads(case_id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','published','retired')),
  canon_version integer not null default 1 check (canon_version > 0),
  canon jsonb not null check (jsonb_typeof(canon) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_case_canon enable row level security;
revoke all on table public.ai_case_canon from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_case_canon to service_role;

comment on table public.ai_case_canon is
  'Server-only canonical truth and interrogation rules for paid AI detective cases. Never returned to the browser.';
comment on column public.ai_case_canon.canon is
  'Private culprit facts, suspect knowledge boundaries, unlock rules, confession/theory gates, and other server-only case logic.';
