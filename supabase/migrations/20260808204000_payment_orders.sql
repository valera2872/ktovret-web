-- Mystery Logic 1.11 — payment orchestration for volume1.
-- Browser never receives database credentials and plaintext access tokens are never stored.

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  product_id text not null default 'volume1',
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  client_request_id uuid not null unique,
  amount_value numeric(12,2) not null check (amount_value > 0),
  currency text not null default 'RUB',
  status text not null default 'creating' check (status in ('creating','pending','paid','canceled','refunded','failed')),
  yookassa_payment_id text unique,
  confirmation_url text,
  return_url text not null,
  source_origin text,
  case_id text,
  customer_email_hash text,
  entitlement_id uuid references public.access_entitlements(id) on delete set null,
  failure_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  canceled_at timestamptz,
  refunded_at timestamptz
);

create index if not exists payment_orders_token_idx
  on public.payment_orders (token_hash, created_at desc);
create index if not exists payment_orders_payment_idx
  on public.payment_orders (yookassa_payment_id);
create index if not exists payment_orders_status_idx
  on public.payment_orders (product_id, status, created_at desc);

alter table public.payment_orders enable row level security;
revoke all on table public.payment_orders from anon, authenticated;

comment on table public.payment_orders is
  'Server-only YooKassa checkout state. token_hash links a browser-held opaque token to a payment without storing the plaintext token.';
