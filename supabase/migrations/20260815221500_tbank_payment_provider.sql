alter table public.payment_orders
  add column if not exists payment_provider text not null default 'tbank',
  add column if not exists provider_payment_id text,
  add column if not exists provider_status text;

update public.payment_orders
set payment_provider = 'yookassa',
    provider_payment_id = coalesce(provider_payment_id, yookassa_payment_id)
where yookassa_payment_id is not null;

create unique index if not exists payment_orders_provider_payment_uidx
  on public.payment_orders (payment_provider, provider_payment_id)
  where provider_payment_id is not null;

comment on table public.payment_orders is
  'Server-only payment checkout state shared by T-Bank and future payment providers. token_hash links a browser-held opaque token to a payment without storing the plaintext token.';
comment on column public.payment_orders.payment_provider is
  'Payment rail identifier such as tbank, yookassa, or paddle.';
comment on column public.payment_orders.provider_payment_id is
  'Provider-side payment identifier; unique within payment_provider.';
comment on column public.payment_orders.provider_status is
  'Last verified or notified provider-native payment status.';
