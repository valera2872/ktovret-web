# Mystery Logic — Production audit / final candidate

Date: 2026-09-28

## Current LIVE truth
- release_id: `canonical-live-2026-09-25`
- canonical Library ZIP: `/Mystery Logic/Production/MysteryLogic-FINAL-BASE-2026-09-25.zip`
- SHA-256: `a510891c3d68dcef723e5ff2f88789a8ad164ee3e777ac95db21b5544e407185`
- files: 686

## Frozen owner-approved next build
- status: `prepared_not_live`
- Library ZIP: `/Mystery Logic/Production/MysteryLogic-FINAL-CANDIDATE-2026-09-28.zip`
- Library id: `libfile_7dbf75b2df4c8191b9077ed140c431c2`
- SHA-256: `39189cd1ac78734b6f2a8217c9c051773e4f03acb15ca3e379aad4a82bf51960`
- size: 7,611,072 bytes
- files: 686
- exact site diff: 50 changed existing files, 0 added, 0 removed
- manifest: `/Mystery Logic/Production/MysteryLogic-FINAL-CANDIDATE-2026-09-28-MANIFEST.md`

All chats continuing the approved pending release must use this exact candidate and must not reconstruct it from GitHub main, older ZIPs, or partial patches.


## Cross-chat recovery rule

The owner-approved pending candidate is the mandatory working build for any sibling chat continuing this unreleased audit/fix package.

A sibling chat must not say "ZIP is not visible" merely because it is absent from conversation attachments. It must first resolve `CURRENT_RELEASE.json`, then search/list the personal Library using:

- path: `/Mystery Logic/Production/MysteryLogic-FINAL-CANDIDATE-2026-09-28.zip`
- Library id: `libfile_7dbf75b2df4c8191b9077ed140c431c2`
- SHA-256: `39189cd1ac78734b6f2a8217c9c051773e4f03acb15ca3e379aad4a82bf51960`
- size: `7,611,072 bytes`
- files: `686`

If bytes are required, materialize the exact Library item returned by search/list and verify the SHA before use. The canonical LIVE baseline remains separate until promotion.

## Included scope
- premium Solo Investigations hub `/detektivnye-igry-dlya-odnogo/rassledovaniya/`: premium split hero retained; unrelated narrative photography removed; hero and all 10 cards now use premise-specific abstract evidence graphics built in CSS; laptop-safe nav switches to existing hamburger at <=1380px; responsive desktop/mobile QA PASS;
- header CTA clarification: static `Открыть досье` CTA renamed to `Начать дело` on 21 pages; target remains the first free case, while the actual `Досье` nav item remains `/dossier/`;
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

## LIVE drift note
- Owner screenshot on 2026-09-28 shows the prior premium Solo Investigations page already present on mysterylogic.com.
- That confirms at least this page drifted beyond the canonical 2026-09-25 baseline, but it does not prove the full pending candidate tree is LIVE.
- The new 2026-09-28 candidate (truthful abstract visuals + laptop-safe navigation) is not yet verified LIVE.

## Static deployment boundary
The 2026-09-28 final candidate is not yet verified LIVE. GitHub Actions currently lacks `BEGET_HOST`, `BEGET_USER`, `BEGET_PASSWORD`; controlled deploy attempts stopped before backup/rsync, so no static files were changed by those attempts.

Promotion remains:
`deploy -> verify mysterylogic.com -> owner confirmation -> save verified full LIVE baseline -> update CURRENT_RELEASE.json`.

## Remaining independent audit items
- co-op 407 completion persistence;
- Last Aria real-pair completion persistence;
- Volume I 061/062/063/064/066 empty answer-stage instruction optionality;
- residual invalid_event monitoring after funnel-event v10.
