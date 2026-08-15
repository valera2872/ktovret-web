# T-Bank payment integration

## Runtime secrets

Store these only in Supabase project secrets; never commit values:

- `TBANK_TERMINAL_KEY`
- `TBANK_PASSWORD`
- `VOLUME1_PRICE_RUB`
- optional `VOLUME1_DESCRIPTION`

The public checkout flag remains disabled until a full DEMO payment passes end to end.

## Flow

`browser/app -> create-checkout -> T-Bank Init -> PaymentURL -> T-Bank -> tbank-webhook/GetState -> access_entitlements -> case-access`

The same server-side payment rail is designed to work for the website and the Android app. Mobile clients must open the returned `PaymentURL` using the T-Bank-supported browser container and must never call T-Bank API methods with merchant credentials from the device.

## TLS

Outbound T-Bank requests use a dedicated Deno HTTP client that adds the official Russian Trusted CA certificates to the runtime's normal public trust roots. This does not change the TLS configuration of `mysterylogic.com` and does not affect future Paddle requests.

## Security invariants

- Merchant password stays server-side.
- T-Bank API requests are signed with the documented SHA-256 token algorithm.
- Browser/app cannot choose the price.
- Incoming notifications are token-verified and final states are re-read through authenticated `GetState` before granting or revoking access.
- Payment ID, order ID and amount are cross-checked before entitlement changes.
- Public checkout stays disabled until DEMO E2E succeeds.

## Before enabling checkout

1. Add DEMO credentials to Supabase secrets.
2. Set a test `VOLUME1_PRICE_RUB`.
3. Complete T-Bank's successful-payment test using its test card.
4. Verify `payment_orders` becomes `paid` and an active `access_entitlements` row is created.
5. Test cancel/failure and refund behavior.
6. Configure fiscal receipt parameters separately; do not guess taxation/VAT/payment-subject values.
7. Replace DEMO credentials with production credentials.
8. Update user-facing checkout copy and only then enable the public checkout flag.
