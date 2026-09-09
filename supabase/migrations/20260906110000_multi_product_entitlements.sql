-- Mystery Logic / Who Lied — multi-product ownership.
-- One browser-held opaque token may own Volume I, Volume II, or both.
-- Existing Volume I customers bought the historical 85-case package. Preserve that
-- access with a private legacy entitlement before the catalog is split into 50 + 50.
-- New orders carrying offer_version=2026-09-06 must never be grandfathered.

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
  ae.token_hash,
  'legacy_volume_all',
  ae.status,
  ae.payment_provider,
  ae.payment_reference,
  ae.customer_email_hash,
  ae.starts_at,
  ae.expires_at,
  ae.revoked_at,
  coalesce(ae.metadata, '{}'::jsonb) || jsonb_build_object(
    'source', 'grandfathered_volume1',
    'grandfathered_at', now(),
    'grandfathered_from_product_id', 'volume1'
  ),
  ae.created_at,
  now()
from public.access_entitlements ae
left join public.payment_orders po
  on po.id::text = coalesce(ae.metadata->>'order_id', '')
where ae.product_id = 'volume1'
  and ae.status = 'active'
  and ae.revoked_at is null
  and coalesce(po.offer_version, '') <> '2026-09-06'
on conflict (token_hash, product_id) do nothing;

comment on table public.access_entitlements is
  'Server-only entitlements. A token may own multiple products; uniqueness is token_hash + product_id. legacy_volume_all preserves access bought before the 50+50 volume split.';
