-- Cover the payment_orders -> access_entitlements foreign key for refund/revocation maintenance.
create index if not exists payment_orders_entitlement_idx
  on public.payment_orders (entitlement_id)
  where entitlement_id is not null;
