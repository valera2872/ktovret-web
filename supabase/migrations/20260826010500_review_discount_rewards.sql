create table if not exists public.case_reviews (
  id uuid primary key default gen_random_uuid(),
  case_id text not null check (char_length(case_id) between 3 and 160),
  reviewer_key_hash text not null check (reviewer_key_hash ~ '^[a-f0-9]{64}$'),
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(btrim(comment)) between 20 and 2000),
  difficulty text null check (difficulty is null or difficulty in ('too_easy', 'just_right', 'too_hard')),
  display_name text null check (display_name is null or char_length(btrim(display_name)) between 1 and 80),
  publication_consent boolean not null default false,
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, reviewer_key_hash)
);

create index if not exists case_reviews_moderation_idx
  on public.case_reviews (moderation_status, created_at desc);

alter table public.case_reviews enable row level security;
revoke all on table public.case_reviews from public, anon, authenticated;

create table if not exists public.review_discount_rewards (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.case_reviews(id) on delete cascade,
  reviewer_key_hash text not null unique check (reviewer_key_hash ~ '^[a-f0-9]{64}$'),
  product_id text not null default 'last_aria' check (product_id = 'last_aria'),
  code text not null unique check (code ~ '^ML-[A-HJ-NP-Z2-9]{4}(-[A-HJ-NP-Z2-9]{4}){3}$'),
  discount_value numeric(10,2) not null default 50.00 check (discount_value = 50.00),
  discounted_price numeric(10,2) not null default 249.00 check (discounted_price = 249.00),
  expires_at timestamptz not null,
  reserved_order_id uuid null,
  reserved_at timestamptz null,
  claimed_email_hash text null check (claimed_email_hash is null or claimed_email_hash ~ '^[a-f0-9]{64}$'),
  used_order_id uuid null references public.payment_orders(id) on delete set null,
  used_at timestamptz null,
  created_at timestamptz not null default now(),
  check ((reserved_order_id is null and reserved_at is null) or (reserved_order_id is not null and reserved_at is not null)),
  check ((used_order_id is null and used_at is null) or (used_order_id is not null and used_at is not null))
);

create unique index if not exists review_discount_claimed_email_idx
  on public.review_discount_rewards (claimed_email_hash)
  where claimed_email_hash is not null;

create index if not exists review_discount_expiry_idx
  on public.review_discount_rewards (expires_at)
  where used_at is null;

alter table public.review_discount_rewards enable row level security;
revoke all on table public.review_discount_rewards from public, anon, authenticated;
