-- Mystery Logic release hotfix: the same browser token may own more than one product.
-- Production already uses a shared opaque browser token for Who Lied and Solo Investigations,
-- so uniqueness must be token_hash + product_id rather than token_hash alone.

alter table public.access_entitlements
  drop constraint if exists access_entitlements_token_hash_key;

create unique index if not exists access_entitlements_token_product_uidx
  on public.access_entitlements (token_hash, product_id);

comment on table public.access_entitlements is
  'Server-only entitlements. A browser token may own multiple products; uniqueness is token_hash + product_id.';
