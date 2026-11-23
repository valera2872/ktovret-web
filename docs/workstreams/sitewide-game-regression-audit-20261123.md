# Mystery Logic — Sitewide Games Regression Audit (2026-11-23)

Status: **L0 Observe / L1 Propose; production unchanged, NO site deployment, NO Supabase mutations.** Owner asked whether two Moreno failures imply regressions in other games; independent LIVE and game-engine audit performed before altering anything.

## Source, scope and current baseline
- Current `CURRENT_RELEASE.json` in GitHub still points at owner-confirmed `MysteryLogic-FINAL-BASE-2026-09-25.zip`, SHA `a510891c3d68dcef723e5ff2f88789a8ad164ee3e777ac95db21b5544e407185`. **This is not equivalent to 2026-11-23 LIVE**, which contains Beget-only and manually patched assets.
- Verified issued Moreno ZIP (2026-11-22, SHA `96267f...`) contains only 3 Moreno files. 2026-11-23 image hotfix ZIP (SHA `13f9045...`) contains only 5 Moreno files. No shared site files, unrelated case engine, commerce, entitlements, SEO, global analytics or CSS/JS were in either archive.
- Audit QA branch `audit/live-games-readonly-20261123`, Draft PR #392: https://github.com/valera2872/ktovret-web/pull/392. Do NOT merge while unrelated production drift exists. No user identifiers gathered; browser POST blocked.
- Full generated detailed report in user conversation attachment `MysteryLogic-audit-games-2026-11-23.md`; GitHub Actions artifacts contain raw audit evidence.

## LIVE evidence (actual Beget, not GitHub main)
- Independent LIVE HTTP/crawl: GitHub run `45119560904` SUCCESS; **45 HTML pages HTTP 200, 192 same-origin assets good, 28 Chromium desktop/mobile renders**. 0 broken images, 0 JS exceptions, 0 horizontal overflow. Initial render and resources only, not full paid E2E.
- FULL short-case catalog: GitHub run `45120527565` SUCCESS; **100 published case metadata records (15 Free, 85 Premium), 200 unique primary/SEO/legacy URLs tested, 200 HTTP 200, 0 missing titles**.
- Critical asset parity run `45120003867` SUCCESS: 119 LIVE CSS/JS assets; **91 GitHub main byte identical, 21 Beget-only, 7 divergent**. Differences are not inherently bugs. A green GitHub main CI is not evidence of identical LIVE.
- In particular Last Aria dynamically loaded runtime and content assets differ from main; never upload main over these live files blindly.

## Game behavior and release test results
- CI `45119949249` attempted 16 independently runnable source/browser regression tests bypassing broken private checkout: **15 PASS**: Last Aria source canon/counter-theories/backend, 10 Mini Solo cases, 10 Paid Solo contract, Solo 407 source+browser, Partner 23:17 source/counter-theory/playtest, Partner 407 source/materials/counter-theories/playtest.
- The remaining Last Aria `tools/last-aria-browser-smoke.mjs` test failed on *GitHub main* spoiler-neutral introduction copy. Do not classify as LIVE failure; main’s `case-aria.js` is stale/different.
- Critical real-live replica check: run `45120762952` SUCCESS after overlaying **10 exactly downloaded Beget LIVE assets** into ephemeral GitHub checkout. Original strict Last Aria 10-screen browser test PASS: owner postpurchase cover, room-create mock, creator/guest 3 packets each, final form and reveal. Backends mocked; no paid end-to-end claim.
- Existing live server smoke from independent workflows: `23:17` run `45072245402` PASS live room contract, `407 Partner` run `45072245384` PASS live room contract, generic two-player LIVE gate `45072245381` PASS; solo 407/paid final-feedback contracts PASS.
- Previously recent web/Last Aria/SEO/production bundle/visual CI failures occur at **Checkout private mobile content** before testing. This is an infrastructure coverage gap; requires repairing GitHub credentials, not blindly changing game code.

## Important unverified high-value paths (NOT assumed PASS)
- Real `Последняя ария` **paid entitlement → two actual browser roles → distributed investigation → session persistence/refresh → final/reveal**. Strict browser test with mocked backend is strong but insufficient.
- `Тихая ночь`, Paid Solo Tome, Premium AI purchase→access→game→final; cannot test without paid QA entitlement / permission to create QA sessions or real charge. Avoid changing production auth/payment.
- The 100 short cases all load, but **not all 100 were individually solved to reveal**.
- Safari/iPhone hardware, recovery from interrupted network, all real phrasing permutations in AI case require separate E2E.
- Funnel data can include QA/CI/test traffic. Do not infer causality, conversions, or real-user errors from gross events.

## Recommendation / next controlled steps
1. Keep current LIVE untouched. Re-run read-only smoke and browser checks before and after every future deploy, with hard failures on critical 404 / broken assets / missing images / JavaScript exceptions and comparisons to *actual* LIVE SHA.
2. Restore private mobile checkout CI authorization; only then use main/CI to freeze supported game delivery. Continue to distinguish LIVE from GitHub.
3. With separate owner approval for production QA data actions, provision **test-only entitlement** (not payment, no customer data) and run real paid multi-device end-to-end for Last Aria, Quiet Night, Solo Tome; negative/refund/retry and persistence.
4. Capture new whole LIVE Beget snapshot, verify with owner and update `CURRENT_RELEASE.json` only after the explicit promotion gate. Never replace LIVE from a GitHub main dump or an Actions artifact.
5. Update this workstream after real paid E2E and future deployment verifications.

**Overall conclusion:** No confirmed mass cross-game page/asset regression attributable to the Moreno ZIPs. One genuine systemic gap: CI's private-source checkout and incomplete mirror of LIVE. Full paid end-to-end remains UNKNOWN, not PASS.
