# Mystery Logic — Production audit / final candidate

Date: 2026-09-25

## Current LIVE truth
- release_id: `canonical-live-2026-09-25`
- canonical Library ZIP: `/Mystery Logic/Production/MysteryLogic-FINAL-BASE-2026-09-25.zip`
- SHA-256: `a510891c3d68dcef723e5ff2f88789a8ad164ee3e777ac95db21b5544e407185`
- files: 686

## Frozen owner-approved next build
- status: `prepared_not_live`
- Library ZIP: `/Mystery Logic/Production/MysteryLogic-FINAL-CANDIDATE-2026-09-25.zip`
- Library id: `libfile_7dbf75b2df4c8191b9077ed140c431c2`
- SHA-256: `2ed4629af73ba39760ea20824e9cb6a10b755c995f61b31dfe09ca8f0ea4fa2a`
- size: 7,660,549 bytes
- files: 686
- exact site diff: 19 changed existing files, 0 added, 0 removed
- manifest: `/Mystery Logic/Production/MysteryLogic-FINAL-CANDIDATE-2026-09-25-MANIFEST.md`

All chats continuing the approved pending release must use this exact candidate and must not reconstruct it from GitHub main, older ZIPs, or partial patches.

## Included scope
- structural social-proof placement fix on the two-player hub so the two choice cards remain aligned;
- corrected public social-proof backend pagination;
- Mini hub and completion monetization path: Solo Volume I 10 cases / 99 ₽, secondary Who Lied +85 / 199 ₽;
- stale 10 -> 15 free Who Lied text correction;
- full Who Lied -> Tom I internal analytics chain and zero-preserving admin funnel;
- admin analytics pagination instead of the misleading latest-5000 truncation;
- Dossier / AI popup banner explicitly unchanged.

## Supabase production state already active
Project: `orknvuwknvsedjgqcfwc`
- `funnel-event` v10 ACTIVE, verify_jwt=false
- `review-moderation` v7 ACTIVE, verify_jwt=false
- `social-proof` v10 ACTIVE, verify_jwt=false

No schema/RLS/auth/payment/entitlement changes were made.

## Static deployment boundary
The final candidate is not LIVE yet. GitHub Actions currently lacks `BEGET_HOST`, `BEGET_USER`, `BEGET_PASSWORD`; controlled deploy attempts stopped before backup/rsync, so no static files were changed by those attempts.

Promotion remains:
`deploy -> verify mysterylogic.com -> owner confirmation -> save verified full LIVE baseline -> update CURRENT_RELEASE.json`.

## Remaining independent audit items
- co-op 407 completion persistence;
- Last Aria real-pair completion persistence;
- Volume I 061/062/063/064/066 empty answer-stage instruction optionality;
- residual invalid_event monitoring after funnel-event v10.
