# Workstream: puzzles-q38-q49

Date: 2026-09-21
Status: **STAGING REDESIGN / AWAITING OWNER VISUAL ACCEPTANCE / NOT PRODUCTION**

## Goal
Add a new batch of 12 original Mystery Logic quick puzzles (Q38–Q49) with broader mechanics and less repetition than Q01–Q37.

## Content
Difficulty curve:
- 3 easy
- 5 medium
- 3 hard
- 1 very hard

Visual puzzles:
- Q38 Three rhythms
- Q40 Robot route
- Q43 Five rooms
- Q44 Disappearing lines
- Q48 Cube in corridor
- Q49 One weighing

Mechanics added:
- parallel pattern cycles
- formal implication
- spatial navigation
- square-difference sequence
- physical trace evidence
- graph/Hamiltonian route
- XOR-like line composition
- hypothesis falsification
- negative evidence
- causal reconstruction
- cube orientation
- information-encoding weighing strategy

## Production baseline
CURRENT_RELEASE:
- release_id: live-2026-09-20
- canonical LIVE ZIP: MysteryLogic-LIVE-2026-09-20.zip
- SHA-256: afeee57f1f0431b2762d5a8159b933c01ae88369f1d7f814b187452066ee9015

The redesign was derived from the exact LIVE /golovolomki-onlayn/ markup and CSS language, not from GitHub main's stale generator header.

## Staging branch
`staging/puzzles-q38-q49`

Current reviewed snapshot:
`38f5ea7c6c3157c2d1a4cb318fcd602e08162258`

Files:
- admin/puzzles-q38-q49-preview/index.html
- assets/puzzles-q38-q49-preview.css
- assets/puzzles-q38-q49-preview.mjs
- assets/puzzles-q38-q49-preview-data.mjs
- tests/puzzles-q38-q49-preview.test.mjs
- .github/workflows/puzzles-q38-q49-staging.yml

## Design decision
The first staging design was rejected by owner as too rough and not aligned with the site template. The owner then supplied a screenshot and explicitly stated that this screenshot is the current on-site visual reference; that screenshot is now the source of truth for card composition.

Current redesign:
- keeps the Mystery Logic site header/navigation context
- uses the owner-supplied on-site card composition as the visual source of truth
- three-column visual-first cards on desktop
- every Q38–Q49 card now has a top visual/illustration, not only the six diagram-heavy puzzles
- exact schematic visuals for Q38/Q40/Q43/Q44/Q48/Q49
- subject illustrations for Q39/Q41/Q42/Q45/Q46/Q47
- number/mechanic/title/short premise/time/difficulty/CTA below the visual
- individual puzzle view remains interactive with choices, hint, validation and explanation
- no visible Puzzle Lab / TEST DOMAIN product framing

## QA
Latest branch validation:
- run 35643376436 — SUCCESS
- 12/12 content contract
- difficulty distribution 3/5/3/1
- 12 visual-first catalog cards
- six exact diagram-heavy visuals
- Q40 deterministic movement checked
- Q43 unique valid A→E route checked by enumeration
- Q48 cube orientation checked
- Q49 eight distinct non-zero weighing deviations checked
- no Telegram content
- noindex staging boundary

Combined GitHub Pages staging deploy:
- main workflow commit: ad0ab33966a54e8c74ba46ad3741c88a195b5538
- run 35649921280 — SUCCESS
- staging URL: https://valera2872.github.io/ktovret-web/admin/puzzles-q38-q49-preview/

## Latest owner feedback / fix
Owner approved the visual direction as much closer to the site reference, then reported:
- card descriptions were incomplete
- clicking “Решить онлайн” did nothing

Root cause of click bug:
- runtime used `$('[data-open]', grid).forEach(...)` instead of `$`, so JS threw after catalog render and no click handlers were installed.

Fix:
- catalog now renders the full puzzle `prompt` rather than abbreviated summaries
- CTA is a real button with `data-solve`
- explicit `$('[data-solve]', grid).forEach(...)` listener opens the puzzle
- cache-bust advanced to `20260921d`
- regression tests lock the CTA and full prompt contract
- validation run 35649874821 — SUCCESS
- deploy run 35649921280 — SUCCESS

## Production boundary
NOT touched:
- Beget LIVE
- CURRENT_RELEASE.json
- canonical LIVE ZIP
- Supabase
- production analytics
- production puzzle catalog/editorial queue

## Pending
1. Owner visual review of redesigned staging page.
2. Real desktop/mobile visual smoke after owner accepts direction.
3. If accepted: convert Q38–Q49 into editorial source objects/batch.
4. Decide which new puzzles enter /golovolomki-onlayn/ featured quick-start.
5. Only after approval: prepare production patch from exact LIVE baseline.


## Self-answer mechanics — 2026-09-21
Owner identified a core UX problem: visible A/B/C/D answers let users solve by option elimination instead of reasoning.

Decision:
- default flow is now self-answer first
- hint is optional and changes result mode to `hint`
- answer choices are hidden behind explicit `Показать варианты`
- opening the solution changes result mode to `solution`
- successful results persist locally as `clean / hint / options / solution`

Per-puzzle answer interaction:
- Q38: build final card from direction + dot corner + stroke count
- Q39: free-form conclusion
- Q40: choose final grid cell + facing direction
- Q41: numeric input
- Q42: free-form evidential conclusion
- Q43: construct route by clicking rooms
- Q44: toggle the lines that remain
- Q45: directly select cards K/M/4/7 to turn over
- Q46: free-form negative-evidence conclusion
- Q47: free-form causal reconstruction
- Q48: numeric input
- Q49: enter counts for boxes A/B/C/D; any four distinct positive integers are accepted because they uniquely encode box + sign of deviation

Staging QA:
- branch validation run 35654196096 — SUCCESS
- combined deploy commit: 6ad446c946766c51be07651741a83be0d0e16d09
- combined deploy run 35654239709 — SUCCESS
- deployed artifact digest: sha256:dc8e14c12207f45e69669f9536f1c8c57ea222ad74b221606bb69f26d151f5a2
- public URL unchanged: https://valera2872.github.io/ktovret-web/admin/puzzles-q38-q49-preview/

QA limitation:
- exact artifact structure and JS syntax validated locally
- automated Chromium screenshot remains unavailable in the current container due headless/DBus hang
- public GitHub Pages URL could not be fetched from the tool environment due network restrictions
- owner browser review is still required for final visual acceptance

Production remains untouched.


## Interaction regression audit — 2026-09-21
Owner reported Q43 route builder did not work.

Root cause:
- grouped controls in multiple answer widgets used `$()` (querySelector) followed by `.forEach`, so handlers were never attached.
- affected Q38, Q40, Q43, Q44, Q45, Q49 and fallback options.
- text inputs Q39/Q42/Q46/Q47 and numeric inputs Q41/Q48 were not affected by this selector bug.

Fix:
- all grouped controls now use `$$()` / querySelectorAll.
- accidental `$$$()` introduced during repair was caught before deployment and removed.
- Q42 free-answer validator now accepts Cyrillic А/Б as well as Latin A/B and natural Russian wording such as «чистый лист был под запиской».
- regression tests explicitly forbid grouped `$().forEach` selector patterns and `$$$()`.

QA:
- branch validation run 35655767724 — SUCCESS
- combined staging deploy commit: 15667cfb47e524c71194d38aa0c42389ede29a3a
- combined staging deploy run 35655814383 — SUCCESS
- production untouched.


## Structured-answer + visual polish — 2026-09-22
Owner approved proceeding with:
1. replacing fragile free-text mechanics for Q39/Q42/Q46/Q47;
2. polishing all 12 visuals toward the on-site reference.

Implemented:
- new pure answer model: `assets/puzzles-q38-q49-answer-model.mjs`
- Q39: complete `X не ____` instead of prose parser
- Q42: build sheet stack top→bottom
- Q46: enter exact count of complete cycles
- Q47: choose physical folded/unfolded sheet state
- Q38/Q40/Q43/Q44/Q45/Q49 retain their native interactive controls
- Q41/Q48 retain numeric inputs
- fallback A/B/C/D remains hidden behind explicit `Показать варианты`
- all 12 detail pages now have a visual; non-diagram puzzles reuse the cinematic evidence scene
- card art gained darker evidence-table framing, warm local light, vignette, shadow, subtle grid/grain and Mystery Logic evidence label
- catalog proof updated from “6 visual” to “12 with visual”
- cache-bust advanced to `20260922a`

QA:
- pure answer model tests all 12 correct states => accepted
- control wrong states for all 12 => rejected
- Q49 arbitrary valid strategy `1,3,5,8` verified as 8 unique signed deviations
- branch validation run 35662544215 — SUCCESS
- staging deploy commit: 9f9ef56308c5c4fb757d94ff6dd54e0216772c86
- staging deploy run 35662593958 — SUCCESS
- staging artifact digest: sha256:b7e5205e30347d7a5209ca469de46038c61779fff5a32db6b955aabc49d0ac3d
- GitHub Pages digest: sha256:401f159f0bf9dc551ee641caabea7c38363744e815d0523df35547bd8fec4fe8
- public URL unchanged: https://valera2872.github.io/ktovret-web/admin/puzzles-q38-q49-preview/

Production boundary remains intact:
- Beget LIVE untouched
- CURRENT_RELEASE untouched
- Supabase untouched
- production analytics untouched
- production puzzle catalog/editorial queue untouched

Pending:
1. owner visual/play review of the polished staging;
2. if approved, convert Q38–Q49 into real editorial batch;
3. choose 6–8 strongest tasks for /golovolomki-onlayn/ showcase;
4. desktop/mobile visual smoke before any production patch.


## Editorial packaging — 2026-09-22
Staging branch: `staging/puzzles-q38-q49`

Prepared and validated:
- `tools/import-mobile/logic-audience-chunk-6.mjs` — Q38–Q49 source objects
- `tools/import-mobile/logic-audience-data.mjs` — staging corpus Q01–Q49
- editorial preview total raised 37 → 49 on staging
- release validator total raised 37 → 49 on staging
- `answerMode` + `answerSpec` stored in each new source object so self-answer mechanics are part of the fingerprinted editorial content
- `tests/puzzles-q38-q49-editorial-chunk.test.mjs` locks preview/source parity, 49 unique IDs/slugs/fingerprints and Q49 generalized strategy semantics
- editorial admin staging code auto-switches pending view to Quick when matchsticks are empty and displays self-answer mode/spec
- guarded insert-only seed prepared at `docs/workstreams/puzzles-q38-q49-editorial-seed.sql`; NOT applied

Production Supabase read-only verification:
- project: mystery-logic / orknvuwknvsedjgqcfwc
- current Quick rows: 37
- approved Quick: 32
- rejected Quick: 5
- Q38–Q49 rows: 0 at time of check
- existing Q01–Q37 decisions must remain untouched

Safety contract for seed:
- abort unless exactly 37 existing Quick rows
- abort if any Q38–Q49 already exist
- insert exactly 12 new rows as pending
- no update/reset of Q01–Q37 moderation state

QA:
- 49-task source/editorial validation run 35691401614 — SUCCESS
- editorial-admin readiness validation run 35691640525 — SUCCESS
- public staging preview deploy run 35691469620 — SUCCESS
- public staging URL unchanged: https://valera2872.github.io/ktovret-web/admin/puzzles-q38-q49-preview/

Showcase candidate:
Q38, Q40, Q42, Q43, Q44, Q45, Q47, Q49.
Full-catalog only for now:
Q39, Q41, Q46, Q48.

Exact next step:
- requires explicit owner approval because it writes production Supabase content:
  apply the guarded Q38–Q49 editorial seed only;
- then owner reviews all 12 as pending in /admin/puzzles/;
- only approved exact fingerprints become eligible for later public build;
- no production deploy, CURRENT_RELEASE update, SEO change, or LIVE catalog change at this stage.


## Production editorial queue seeded — 2026-09-22
Explicit owner approval received to write Q38–Q49 into production editorial content queue.

Production project:
- Supabase: mystery-logic
- project ref: orknvuwknvsedjgqcfwc

Applied:
- guarded insert-only seed from staging file `docs/workstreams/puzzles-q38-q49-editorial-seed.sql`
- inserted exactly Q38–Q49
- all 12 inserted with `kind='quick'`
- all 12 inserted with `moderation_status='pending'`
- all 12 have `answerMode` and `answerSpec`
- `published_before_gate=false`
- no existing Q01–Q37 row was updated

Post-write verification:
- Quick total: 49
- approved: 32
- rejected: 5
- pending: 12
- Q38–Q49 existing: 12
- Q38–Q49 status: pending

Important continuity:
- DO NOT run the seed again.
- Production LIVE website, CURRENT_RELEASE, schema/RLS, Edge Functions and analytics were not changed.
- Current production /admin/puzzles/ frontend still uses the existing matchstick-first default; owner should select “Обычные Quick” to review Q38–Q49 until the separate admin UX patch is explicitly approved/deployed.
- Staging admin improvement exists only on `staging/puzzles-q38-q49`.
- Source chunk 6 is still staging-only; do not expose Q38–Q49 publicly until owner moderation and later source/publish approval.


## Editorial admin visuals staging — 2026-09-22
Owner reported that Q38–Q49 appeared in production /admin/puzzles/ without images.

Cause:
- production editorial admin only had a visual renderer for matchstick puzzles;
- Q38–Q49 visual SVGs existed only in the dedicated staging preview runtime.

Implemented on staging:
- `assets/puzzle-q38-q49-visuals.js` — visual renderer for all Q38–Q49
- `assets/puzzle-q38-q49-visuals.css` — editorial visual styling
- `assets/puzzle-admin.js` renders the visual block from `puzzle_id`
- `admin/puzzles/index.html` loads the renderer and styling
- staging admin still reads the real production editorial queue using the existing moderator key
- no Supabase content/schema/RLS/Edge Function changes

QA:
- Q38–Q49 visual renderer branch run 35695516566 — SUCCESS
- combined staging admin deploy run 35695562095 — SUCCESS
- staging admin URL: https://valera2872.github.io/ktovret-web/admin/puzzles/

Production LIVE admin remains unchanged pending owner visual approval.


## Final approved public assembly preview — 2026-09-22
Owner requested final beautiful assembly excluding tasks not approved by owner.

Authoritative current moderation snapshot used:
Approved new: Q38, Q40, Q41, Q43, Q44, Q45, Q49.
Rejected new: Q39, Q42, Q46, Q47, Q48.

Baseline:
- exact LIVE archive from CURRENT_RELEASE:
  /Mystery Logic/Production/MysteryLogic-LIVE-2026-09-20.zip
- SHA-256 verified:
  afeee57f1f0431b2762d5a8159b933c01ae88369f1d7f814b187452066ee9015

Final preview assembly created locally from that exact LIVE baseline:
- adds 7 approved new visual/self-answer Quick pages
- rejected new tasks are not present as pages or links
- main /golovolomki-onlayn/ gets a 7-card approved “Новая серия”
- brain collection becomes 38
- math collection becomes 20
- adult Quick becomes 14
- public Quick total becomes 39
- new puzzle pages use self-answer first; A/B/C/D fallback is hidden behind explicit “Показать варианты”
- existing legacy Quick implementation remains untouched

New production-candidate files:
- assets/logic-quick-v2.css
- assets/logic-quick-v2.js
- golovolomki/tri-ritma/index.html
- golovolomki/marshrut-robota/index.html
- golovolomki/kvadraty-mezhdu-chislami/index.html
- golovolomki/pyat-komnat/index.html
- golovolomki/ischezayushchie-linii/index.html
- golovolomki/kakie-kartochki-perevernut/index.html
- golovolomki/odno-vzveshivanie/index.html

Modified production-candidate files:
- golovolomki-onlayn/index.html
- igry-dlya-mozga/index.html
- matematicheskie-golovolomki/index.html
- zagadki-na-logiku-dlya-vzroslyh/index.html

QA:
- rejected new slugs/pages: zero
- seven approved visual cards present on main/brain/adult
- Q41+Q49 present in math
- options hidden by default on all seven
- legacy data-quick-puzzle handler is not attached to new pages
- logic-quick-v2.js syntax passes
- desktop static render visually inspected for main, Q43 and Q49
- native headless Chromium mobile screenshot is blocked by current container/browser policy; do not claim mobile visual QA complete
- self-contained responsive previews generated for owner review

Production boundary:
- no LIVE deploy
- no CURRENT_RELEASE change
- no ZIP yet (preview approval required first)
- no Supabase mutation during final assembly step


## Upload-ready production patch — 2026-09-22
Owner approved preparing the ZIP after final preview.

Patch:
- file: MysteryLogic-PATCH-approved-puzzles-2026-09-22.zip
- SHA-256: 9c41018ca8069d0a4948044d4376c76af7b53c51ee3b9ace631f796efdf92ccb
- entries: 13
- paths are relative to website root; extract over current LIVE files

Exact LIVE base used:
- MysteryLogic-LIVE-2026-09-20.zip
- SHA-256 afeee57f1f0431b2762d5a8159b933c01ae88369f1d7f814b187452066ee9015

Included new approved tasks:
Q38, Q40, Q41, Q43, Q44, Q45, Q49.

Excluded rejected tasks:
Q39, Q42, Q46, Q47, Q48.

Files in patch:
- assets/logic-quick-v2.css
- assets/logic-quick-v2.js
- golovolomki-onlayn/index.html
- igry-dlya-mozga/index.html
- matematicheskie-golovolomki/index.html
- zagadki-na-logiku-dlya-vzroslyh/index.html
- 7 approved golovolomki/<slug>/index.html pages

Final patch QA:
- merged over an untouched copy of exact LIVE baseline: PASS
- 7 approved pages exist and use data-mlq-puzzle only
- old data-quick-puzzle handler absent from new pages
- answer options hidden by default
- Q49 fallback correct-option consistency: PASS
- rejected page/slugs absent from patch: PASS
- node --check assets/logic-quick-v2.js: PASS
- Telegram URLs in patch: zero
- archive entries: 13

Not deployed by ChatGPT in this step.
CURRENT_RELEASE remains live-2026-09-20 until actual deploy + mysterylogic.com verification + owner confirmation.
