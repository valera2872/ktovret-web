# Mystery Logic AI premium tiers

Canonical initial commercial split for premium AI investigations.

| Tier | Customer price | Experience |
| --- | ---: | --- |
| `text` | €4.90 | Full case, free-text AI interrogation, all evidence, finale, cipher/meta reward. No realtime avatar stream. |
| `live` | €9.90 | Everything in `text`, plus realtime speaking suspects, voice/lip-sync and stage-driven visual reactions. |
| `text -> live` upgrade | €5.00 | Upgrade the same case entitlement; case state and progress remain the same. |

## Entitlement contract

`access_entitlements.metadata.experience_tier` is `text` or `live`.

- Missing/unknown tier defaults to `text` for backward compatibility.
- `live` includes all `text` rights.
- Realtime avatar session creation must be server-gated to `live`; hiding a button in the browser is not sufficient.
- A reward/free entitlement may explicitly grant `live` by setting the same metadata field.
- Case-scoped entitlements may use `metadata.case_id` or `metadata.allowed_case_ids`; volume/bundle entitlements can omit those fields.

## Cost guardrail

Target avatar cost: <= €1.50 per completed live playthrough. €2.00 is acceptable; above €2.50 should trigger optimisation. Avatar sessions should exist only while interrogation video is actually needed, never for the whole case duration.
