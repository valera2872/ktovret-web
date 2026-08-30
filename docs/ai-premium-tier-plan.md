# Mystery Logic AI premium tiers

Canonical initial commercial split for premium AI investigations.

| Offer code | Customer-facing name | Customer price | Experience |
| --- | --- | ---: | --- |
| `text` | Расследование | €4.90 | Full case, free-text AI interrogation, all evidence, finale, cipher/meta reward. No realtime avatar stream. |
| `live` | Живое расследование | €9.90 | Everything in `text`, plus realtime speaking suspects, voice/lip-sync and stage-driven visual reactions. |
| `upgrade_live` | Добавить живой режим | €5.00 | Upgrade the same case entitlement; case state and progress remain the same. |

Customer-facing Live explanation: **«Подозреваемые смотрят на вас и отвечают голосом в реальном времени».** Do not market this as a “video version”.

## Server-owned offer contract

The browser may request only one of the canonical offer codes: `text`, `live`, `upgrade_live`. It must never be allowed to choose the authoritative amount, granted tier or entitlement scope.

`supabase/functions/_shared/ai-commerce.ts` owns the canonical offer/tier mapping and the post-payment entitlement semantics:

- `text` creates a case-scoped entitlement with `experience_tier: text`.
- `live` creates the same kind of entitlement with `experience_tier: live`.
- `upgrade_live` requires an existing active Text entitlement for the same case and updates that exact entitlement to `live`; no second game entitlement is created, so the browser-held access token and saved case progress remain unchanged.
- Replayed payment finalization is idempotent by order id.
- A different upgrade order cannot sell Live again when the entitlement is already Live.
- Refunding the €5 upgrade downgrades the entitlement back to Text while preserving the purchased investigation.
- Refunding the initial Text or Live purchase revokes that purchased entitlement.

Payment-provider adapters must verify their own signed/authoritative payment state before calling the shared grant/refund functions. The existing `volume1` T-Bank/YooKassa finalizers are intentionally separate and must not be repurposed by accepting an arbitrary amount or tier from the browser.

The prices above are the canonical customer proposition. A payment adapter must explicitly define the currency/amount actually supported by that payment rail; it must not silently pretend a RUB charge is a EUR charge or vice versa.

## Entitlement contract

`access_entitlements.metadata.experience_tier` is `text` or `live`.

- Missing/unknown tier defaults to `text` for backward compatibility.
- `live` includes all `text` rights.
- Realtime avatar session creation must be server-gated to `live`; hiding a button in the browser is not sufficient.
- A reward/free entitlement may explicitly grant `live` by setting the same metadata field.
- Case-scoped entitlements may use `metadata.case_id` or `metadata.allowed_case_ids`; volume/bundle entitlements can omit those fields.
- Purchase history is retained in metadata for support/audit without ever storing the plaintext browser access token.

## Cost guardrail

Target avatar cost: <= €1.50 per completed live playthrough. €2.00 is acceptable; above €2.50 should trigger optimisation.

The default hard allowance is **15 minutes of billable avatar time per entitlement + case**. Metering uses actual 24 kHz PCM speech duration plus a conservative 5-second connection/streaming overhead per spoken reply. The allowance is claimed atomically server-side and each LiveAvatar session can authorize only one speech payload. When the allowance is exhausted, the investigation must continue in text mode rather than blocking the case.

Avatar sessions should exist only while a suspect is actually delivering an answer, never while the player is reading, thinking or typing.
