-- Mystery Logic Solo Engine 2.0 — server-authoritative case packages and persistent sessions.
--
-- Design constraints:
-- 1. Complete solo definitions (including correct deductions/reconstruction) never leave service-role storage.
-- 2. Demo progress exists before purchase, so a solo session can start without an entitlement.
-- 3. Entitlement expiry/revocation must never delete semantic investigation progress.
-- 4. The same session can later bind to a paid/Club entitlement and continue without reset.

create table if not exists public.solo_case_definitions (
  case_id text primary key references public.paid_case_payloads(case_id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','published','retired')),
  classification text not null default 'PRIVATE_CANON_DRAFT'
    check (classification in ('PRIVATE_CANON_DRAFT','PRIVATE_CANON_PRODUCTION','PRIVATE_CANON_BURNED_DRAFT','PRIVATE_CANON_ARCHIVED')),
  production_eligible boolean not null default false,
  schema_version integer not null default 1 check (schema_version > 0),
  canon_release text not null default '0.0.0'
    check (canon_release ~ '^[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9._-]+)?$'),
  definition jsonb not null check (jsonb_typeof(definition) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    production_eligible = false
    or (
      status = 'published'
      and classification = 'PRIVATE_CANON_PRODUCTION'
      and canon_release !~ '-'
    )
  )
);

create index if not exists solo_case_definitions_runtime_idx
  on public.solo_case_definitions (status, production_eligible, classification, updated_at desc);

create table if not exists public.solo_case_sessions (
  session_key text primary key check (session_key ~ '^[0-9a-f]{64}$'),
  case_id text not null references public.paid_case_payloads(case_id) on delete cascade,
  entitlement_id uuid references public.access_entitlements(id) on delete set null,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_success_at timestamptz,
  completed_at timestamptz
);

create unique index if not exists solo_case_sessions_entitlement_case_uidx
  on public.solo_case_sessions (case_id, entitlement_id)
  where entitlement_id is not null;

create index if not exists solo_case_sessions_case_updated_idx
  on public.solo_case_sessions (case_id, updated_at desc);

alter table public.solo_case_definitions enable row level security;
alter table public.solo_case_sessions enable row level security;

revoke all on table public.solo_case_definitions from public, anon, authenticated;
revoke all on table public.solo_case_sessions from public, anon, authenticated;

grant select, insert, update, delete on table public.solo_case_definitions to service_role;
grant select, insert, update, delete on table public.solo_case_sessions to service_role;

comment on table public.solo_case_definitions is
  'Server-only complete Solo Engine 2.0 packages. May contain correct answers, private rules and reconstruction truth; never return this JSON wholesale to a client.';
comment on table public.solo_case_sessions is
  'Server-authoritative Solo Engine 2.0 semantic progress. Demo sessions may have no entitlement; entitlement expiry never deletes state.';
comment on column public.solo_case_sessions.session_key is
  'SHA-256 of an opaque client session token. The raw token is never stored.';
comment on column public.solo_case_sessions.entitlement_id is
  'Optional currently-bound entitlement. Null is valid for demo; ON DELETE SET NULL preserves investigation progress.';
