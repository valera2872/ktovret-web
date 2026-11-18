# Mystery Logic — Last Aria final-screen freeze (2026-11-18)

## Scope and status
- Production incident for paid Partner case `special:last-aria`.
- **Access containment completed.** T-Bank refund was already reflected in production as `payment_orders.status=refunded`; associated entitlement has `status=refunded` and `revoked_at` set.
- Both rooms created by the refunded customer's browser key have now been set to `duel_rooms.status=revoked`, and this was verified by a subsequent SELECT. Their exact identifiers and payment details are intentionally omitted from this public checkpoint.
- **Frontend hotfix prepared but NOT DEPLOYED.** Neither a GitHub commit nor a draft PR is evidence of current LIVE.

## Verified root cause
The final screen contains `.casearia-proof-board > p`. Two observers write **different** values into `textContent`:
- `assets/case-aria-investigator-v16.js`: `polish()` document-wide `MutationObserver`;
- `assets/case-aria-first-buyer-recovery.js`: `patchProofCopy()` root-subtree `MutationObserver`.

Each `textContent` replacement changes the child text node, triggering `childList` callbacks. As each observer undoes the other's change, this produces an unbounded mutation/microtask loop. Locally reproduced on the 2026-09-25 canonical baseline: with the recovery module loaded, the stage-3 → final click freezes. Without it, the final screen opens. This explains the observed browser hang; 403 API responses are a separate failure mode and were not proven causal for this freeze.

## Fix in GitHub draft PR #382
Branch: `hotfix/last-aria-final-observer-loop-20261118`.
- One guard in `assets/case-aria-first-buyer-recovery.js`: `if (window.MLAriaInvestigatorV16) return;` at the start of `patchProofCopy()`, preserving its fallback if v16 is missing.
- Regression contract: `tests/last-aria-final-observer-contract.mjs`.

## Local QA
- Node VM observer conflict/fallback contract: PASS.
- Browser Chromium, 889×1270 and 1366×900: stage 3 → final opens: PASS.
- Wrong final attempt feedback: PASS.
- Accepted final → partner waiting: PASS.
- Browser console errors: none in these mock-server tests.
- Production full end-to-end, iPad/iPhone Safari, server-controlled multi-user completion, page refresh and final full Release Gate: **NOT RUN**.

## Release source and blockers
`CURRENT_RELEASE.json` identifies mandatory canonical baseline:
`MysteryLogic-FINAL-BASE-2026-09-25.zip` SHA-256
`a510891c3d68dcef723e5ff2f88789a8ad164ee3e777ac95db21b5544e407185`.
This exact archive was materialized and verified.
The relevant recovery JS file is byte-identical between canonical baseline and current GitHub main. Current Beget LIVE is known to have drift and was not directly retrievable in this environment (site fetch inaccessible). Must not substitute GitHub main for LIVE or deploy a full repository snapshot.

## Exact next action
1. Obtain current LIVE site files from Beget, particularly `assets/case-aria-first-buyer-recovery.js` and the corresponding `index.html` script references; verify whether the two competing observers remain deployed.
2. Apply an exact one-file fix on that LIVE tree, with cache invalidation of the single script reference if necessary; preview responsive screens.
3. Run guest/creator, refresh, wrong retry, right answer, final synchronization, purchase/return and revoked-room checks in a nonproduction setup.
4. Complete applicable CASE_RELEASE_GATE and DELIVERY_SELF_QA_CANON checks. No unknown/failed Gate should be represented as release-ready.
5. After approval, deploy, verify mysterylogic.com, capture approved LIVE base, then update CURRENT_RELEASE.
