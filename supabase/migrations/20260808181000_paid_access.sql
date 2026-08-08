-- Mystery Logic 1.10 — protected paid-case storage and bearer entitlements.
-- Public browser clients must never read these tables directly.

create table if not exists public.paid_case_payloads (
  case_id text primary key,
  product_id text not null default 'volume1',
  language text not null default 'ru',
  status text not null default 'published' check (status in ('draft','published','retired')),
  payload jsonb not null,
  payload_version integer not null default 1 check (payload_version > 0),
  updated_at timestamptz not null default now()
);

create index if not exists paid_case_payloads_product_status_idx
  on public.paid_case_payloads (product_id, status);

create table if not exists public.access_entitlements (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  product_id text not null,
  status text not null default 'active' check (status in ('active','revoked','refunded','expired')),
  payment_provider text,
  payment_reference text,
  customer_email_hash text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists access_entitlements_lookup_idx
  on public.access_entitlements (token_hash, product_id, status);
create index if not exists access_entitlements_payment_idx
  on public.access_entitlements (payment_provider, payment_reference);

alter table public.paid_case_payloads enable row level security;
alter table public.access_entitlements enable row level security;

-- Intentionally no SELECT/INSERT/UPDATE policies for anon/authenticated roles.
-- The Edge Function uses the service-role key after validating the opaque bearer token.
revoke all on table public.paid_case_payloads from anon, authenticated;
revoke all on table public.access_entitlements from anon, authenticated;

comment on table public.paid_case_payloads is
  'Server-only game payloads for paid Mystery Logic cases. Never expose through public static build.';
comment on table public.access_entitlements is
  'Server-only entitlements. token_hash is SHA-256 of the one-time issued opaque access token.';
