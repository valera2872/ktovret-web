# Mystery Logic paid access backend (1.10)

This directory contains the server-only boundary for the 85 paid cases.

## Security model

- GitHub Pages contains only locked metadata pages for premium cases.
- Full premium game payloads are exported to `.secure-backend/` and must never be committed or uploaded to Pages.
- The browser stores one opaque access token after purchase.
- PostgreSQL stores only the SHA-256 hash of that token.
- `case-access` validates the bearer token with the server-side service role and returns one paid case only after an active `volume1` entitlement is found.
- `paid_case_payloads` and `access_entitlements` have RLS enabled and no anon/authenticated policies.
- `SUPABASE_SERVICE_ROLE_KEY` must never be placed in `assets/`, HTML, GitHub Pages variables, or browser JavaScript.

## Provisioning order

1. Create a dedicated Supabase project for Mystery Logic. Do not reuse another product's project.
2. Apply `migrations/20260808181000_paid_access.sql`.
3. Export the private payload bundle from the pinned mobile source:

   `node tools/export-paid-backend.mjs --source ../mobile-source --out .secure-backend/paid-case-payloads.json`

4. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the local/admin environment and upload:

   `node tools/push-paid-backend.mjs --file .secure-backend/paid-case-payloads.json`

5. Deploy `functions/case-access`. It intentionally uses custom opaque bearer authentication, so Supabase JWT verification must be disabled for this function; the function itself validates the token hash before any case lookup.
6. Set `ALLOWED_ORIGINS` for the real site origin and staging origin.
7. Put the deployed function URL into `assets/paid-access-config.js`. Until `endpoint` is non-empty, the public UI keeps showing `Полный том · скоро` and the gateway stays dormant.

## Not part of 1.10

Payment creation, YooKassa webhook verification, entitlement issuance/recovery, refunds, and purchase restoration are the next layer. They must write entitlements only after a verified provider event.
