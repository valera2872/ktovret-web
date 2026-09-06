-- Mystery Logic / Who Lied — multi-product ownership.
-- One browser-held opaque token may own Volume I, Volume II, or both.
-- Existing volume1 rows remain valid; no entitlement is deleted or rewritten.

alter table public.access_entitlements
  drop constraint if exists access_entitlements_token_hash_key;

create unique index if not exists access_entitlements_token_product_uidx
  on public.access_entitlements (token_hash, product_id);

comment on table public.access_entitlements is
  'Server-only entitlements. A token may own multiple products; uniqueness is token_hash + product_id.';
