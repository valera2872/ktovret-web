# Mystery Logic paid access backend (1.11)

This directory contains the server-only boundary for the 85 paid cases and the YooKassa payment orchestration layer.

## Security model

- GitHub Pages contains only locked metadata pages for premium cases.
- Full premium game payloads are exported to `.secure-backend/` and must never be committed or uploaded to Pages.
- The browser stores one cryptographically random opaque access token.
- PostgreSQL stores only the SHA-256 hash of that token.
- `case-access` validates the bearer token with the server-side service role and returns one paid case only after an active `volume1` entitlement is found.
- `payment_orders`, `paid_case_payloads`, and `access_entitlements` have RLS enabled and no anon/authenticated policies.
- YooKassa `shopId`, secret key and the product price are Edge Function secrets/env only. They must never be placed in `assets/`, HTML or browser JavaScript.
- Incoming YooKassa notification bodies are not trusted: `yookassa-webhook` re-reads the payment from the authenticated YooKassa API before changing entitlement state.

## Provisioning order

1. Use the dedicated Supabase project `mystery-logic`.
2. Apply `migrations/20260808181000_paid_access.sql`.
3. Apply `migrations/20260808204000_payment_orders.sql`.
4. Ensure exactly 85 premium payloads exist in `paid_case_payloads`.
5. Deploy `case-access`, `create-checkout`, `payment-status` and `yookassa-webhook`.
6. Keep JWT verification disabled only for these custom-auth endpoints: they implement opaque bearer/CORS/provider verification themselves.
7. Set `ALLOWED_ORIGINS` to the real site and staging origins.

## YooKassa server configuration

Set these as Supabase Edge Function secrets/environment variables. Never commit their values:

- `YOOKASSA_SHOP_ID` — shop identifier from YooKassa.
- `YOOKASSA_SECRET_KEY` — API secret from YooKassa.
- `VOLUME1_PRICE_RUB` — authoritative server-side price, for example `199.00` only after the actual price is approved.
- `VOLUME1_DESCRIPTION` — optional payment description.
- `YOOKASSA_RECEIPT_MODE` — `disabled` or `yookassa` according to the merchant's fiscal receipt setup.

If `YOOKASSA_RECEIPT_MODE=yookassa`, also set the values confirmed for the merchant's tax/fiscal configuration:

- `YOOKASSA_VAT_CODE`
- `YOOKASSA_PAYMENT_MODE`
- `YOOKASSA_PAYMENT_SUBJECT`

Do not guess these fiscal values in code.

## HTTP notifications in YooKassa

For HTTP Basic Auth integrations, configure notifications in the YooKassa merchant dashboard.

Notification URL:

`https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/yookassa-webhook`

Enable at minimum:

- `payment.succeeded`
- `payment.canceled`
- `refund.succeeded`

The webhook answers HTTP 200 after verified processing. On transient YooKassa API/database failures it intentionally returns a non-200 response so the provider can retry.

## Browser purchase flow

1. User opens a locked premium case.
2. Browser generates a 256-bit opaque token and stores it locally before payment.
3. `create-checkout` stores only its SHA-256 hash, fixes the amount from server env and creates a YooKassa redirect payment with an idempotency key.
4. YooKassa redirects the user back to the same case with `payment_return=1&order_id=...`.
5. `yookassa-webhook` normally activates the entitlement after a verified `payment.succeeded` notification.
6. If the webhook is delayed, `payment-status` re-reads the payment from YooKassa and activates the same entitlement.
7. The existing `case-access` endpoint now accepts the browser-held token and serves any of the 85 `volume1` cases.
8. A verified full refund changes the entitlement to `refunded`, closing access.

## Public rollout switch

`assets/paid-access-config.js` contains `checkoutEnabled:false` while the merchant credentials, price and fiscal receipt configuration are not yet verified.

Only after all of those are configured and a real/test YooKassa payment passes end-to-end should this flag be changed to `true` and deployed.
