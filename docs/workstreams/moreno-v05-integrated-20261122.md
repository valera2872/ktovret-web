# Moreno v0.5 modern restoration — 2026-11-22

Status: **NOT READY for a Premium production ZIP**. This workstream records verified outcomes and unresolved release gates; do not present it as a completed game. No Beget deployment made.

## Inputs and source of truth
- Owner approved the **original visual appearance** of v0.5. Engine should remain v6 and newer AI/reaction/memory/final enhancements, not legacy v5 client (its final canon is public and its v1 backend is incompatible).
- CURRENT_RELEASE.json canonical baseline: `MysteryLogic-FINAL-BASE-2026-09-25.zip`, SHA-256 `a510891c3d68dcef723e5ff2f88789a8ad164ee3e777ac95db21b5544e407185`.
- Owner-provided Beget HTML uploaded 2026-11-19 (premium page), SHA-256 `254a8808f0252cca29eb26a5868fa65b2c0670ea37a88d2885d76fd2fc9f50ea`, plus 53 Moreno assets and 3 sitewide menu/funnel files. All 53 Moreno asset files matched the canonical extracted base exactly.
- The site LIVE may have drifted after 2026-11-19: Beget snapshot is the verified candidate base but cannot be treated as guaranteed current LIVE without fresh fetch.
- Production Supabase project strictly `orknvuwknvsedjgqcfwc` / mystery-logic. Current v8 was byte-identical to GitHub main before correction; v9 source differs from main and was not touched.

## Production backend action — 2026-11-22
- Scope approved by owner's instruction to execute integration; only `ai-moreno-investigator-v8` Edge Function updated, no schema/auth/RLS/payment/payment entitlements/other Edge Functions.
- **v8 version 8 → 9 → 10 → 11** (three controlled code-only deployments): closed source matching prior at each step, verify_jwt remains **false**, public origin and client marker unchanged.
- Main defect fixed: `мне нужен тот сосед, который жил этажом ниже. хочу с ним поговорить` no longer consumed as a question for active `boyfriend`.
- Further actual live CI regressions fixed: polite request `можно пригласить приемную мать Patricia для разговора`, role-first request for daughters, and explicit `пригласите специалиста по оружию и пуле` must route to investigative experts, not current witness.
- Updated source in Draft PR #388 `fix/moreno-ai-interview-cases-20261122`: `supabase/functions/ai-moreno-investigator-v8/index.ts`, Node isolated contract test, and Moreno CI workflow step.
- GitHub Actions `Real case Moreno vertical slice` run **45003845081** retried after deployment: **SUCCESS**, includes isolated v8 contract PASS, live v0.17–v0.23 routed interrogation/semantic tests PASS, live v0.25 final submission smoke PASS, visual source tests PASS.
- Project owner had previously closed PR #384 and #385 unmerged; do not treat either as deployment. PR #388 remains draft / unmerged. **LIVE backend differs from GitHub main** until source synchronization.

## Frontend restoration candidate and QA
- Candidate prepared locally only at `/mnt/data/moreno_integrated_20261122/work/site` from exact canonical site base + verified Beget 53 assets + uploaded sitewide CSS/JS/analytics, overlaying the historically approved **v0.5 CSS, minimal visual compatibility CSS and persistent intro briefing** from a LIVE-aligned preview candidate. Does NOT use legacy v5 game engine.
- Applied premium HTML, `assets/real-case-moreno-v05-compat.css`, `assets/real-case-moreno-v05-brief.js` only; all other game engine, router, memory, final scripts were original.
- Browser QA: Chromium 1366×900, 768×1024, 390×844 with all **31 current CSS/JS resources** inlined for sandbox execution and authenticated-response-shaped mocked AI backend. 19 investigation turns and 11 evidence flags: accept → scene → people → locate witness → interview mother → interview boyfriend → interview second-floor witness → ballistics → trajectory → weapon → relationships → alibi → witness description → own theory → final reconstruction form → choose suspect, material and limits → submit → reveal. State restored across a second page parse from localStorage shim. No page JS errors and no horizontal overflow. **PASS in mocks only**, screenshots in local QA folder.
- Browser network policy blocks localhost, file:// and public host navigation even when routed, hence local browser test uses self-contained inline source and a test-only localStorage shim. Do not call this actual HTTP/real-backend E2E.
- No actual Beget production files changed or ZIP delivered.

## Mandatory Release Gates
- **Cognitive/Fair-play FAIL:** Modern `real-case-moreno-ai-v6.js` still contains publicly served full Premium solution string and accepted-suspect predicate; reveal and success check are performed in client-side code using user-editable `localStorage`. User could read hidden answer or forge state without investigation. Server v11 final submission returns operations, not an authoritative secure reveal. Opening direct source link also reveals arrest prematurely.
- **Genuine full browser+real backend E2E NOT RUN:** Actual real AI route smoke tests pass separately, mock browser full play passes, but no single clean-room real-browser + live-AI complete run. Safari NOT RUN.
- **Payment/entitlement and production revalidation NOT RUN**, 2026-11-19 Beget snapshot may not equal current LIVE.
- Full CASE_RELEASE_GATE, DELIVERY_SELF_QA_CANON and Cognitive Gate cannot be marked PASS. Status **NOT READY**. No ready ZIP is allowed by project instructions; partial preview archive should not be offered unless owner expressly asks for an intermediate artifact.

## Next executable steps
1. Fix private-canon boundary with a server-authoritative final/reveal and persistible tamper-resistant session flow; maintain guest-first and save across refresh. Do not merely obfuscate or hide the answer client-side.
2. Revalidate current live Beget HTML and assets, preserve global menu, metadata, analytics, SEO and payment/entitlement; stage only the minimum compatible changes.
3. Run actual E2E with real AI across investigation and endgame in clean environment, including negative and misuse cases, Safari desktop/mobile, cognitive roles and release gates.
4. Only after all gates PASS and owner's visual approval: create a minimal release ZIP, unpack that exact ZIP into clean directory and re-run end-to-end, then owner deploys to Beget; verify LIVE and update CURRENT_RELEASE only after owner confirmation.
