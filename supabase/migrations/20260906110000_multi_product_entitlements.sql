-- Mystery Logic / Who Lied — multi-product ownership.
-- One browser-held opaque token may own Volume I, Volume II, or both.
-- Existing Volume I customers bought the historical 85-case package. Preserve that
-- access with a private legacy entitlement before the catalog is split into 50 + 50.

alter table public.access_entitlements
  drop constraint if exists access_entitlements_token_hash_key;

create unique index if not exists access_entitlements_token_product_uidx
  on public.access_entitlements (token_hash, product_id);

insert into public.access_entitlements (
  token_hash,
  product_id,
  status,
  payment_provider,
  payment_reference,
  customer_email_hash,
  starts_at,
  expires_at,
  revoked_at,
  metadata,
  created_at,
  updated_at
)
select
  token_hash,
  'legacy_volume_all',
  status,
  payment_provider,
  payment_reference,
  customer_email_hash,
  starts_at,
  expires_at,
  revoked_at,
  coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'source', 'grandfathered_volume1',
    'grandfathered_at', now(),
    'grandfathered_from_product_id', 'volume1'
  ),
  created_at,
  now()
from public.access_entitlements
where product_id = 'volume1'
  and status = 'active'
  and revoked_at is null
on conflict (token_hash, product_id) do nothing;

comment on table public.access_entitlements is
  'Server-only entitlements. A token may own multiple products; uniqueness is token_hash + product_id. legacy_volume_all preserves access bought before the 50+50 volume split.';
