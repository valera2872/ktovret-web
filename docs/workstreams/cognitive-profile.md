# Mystery Logic — IQ детектива + Досье — checkpoint v13

Дата: 2026-09-23
Статус: **APPROVED NEXT BASE / FRONTEND FINAL CANDIDATE / NOT YET CANONICAL LIVE**

## Решение пользователя
Пользователь принял исправленный premium-визуал и затем явно распорядился зафиксировать весь согласованный IQ/Dossier пакет в финальной полной сборке, чтобы другие чаты при последующих изменениях не возвращались к старой версии.

## Канонический LIVE до promotion
`CURRENT_RELEASE.json` всё ещё указывает:
- release_id: `live-2026-09-22`
- baseline: `MysteryLogic-LIVE-2026-09-22.zip`
- SHA-256: `46f83620c451b55cd6dcc7de1d48db49021683b1b3ae152594022c8182c9b0ab`

Это значение НЕ обновлять до фактического deploy нового frontend, проверки `mysterylogic.com` и подтверждения владельца.

## Approved next full build
Полная сборка для следующего production шага и для дальнейших параллельных изменений:
- `MysteryLogic-FINAL-CANDIDATE-IQ-2026-09-23.zip`
- files: 686
- SHA-256: `af1429e444b8cab0c1a4bd398b4398a7a5e43c647163fb5b6ce475fc76afe644`
- root structure: PASS, wrapper folder отсутствует
- ZIP integrity: PASS

### Lineage
1. canonical production release `live-2026-09-22`;
2. production Dossier/IQ36 layer `MysteryLogic-PRODUCTION-DOSSIER-IQ36-2026-09-22.zip` (contains Dossier/IQ support assets and sitewide integration);
3. approved final IQ patch `MysteryLogic-IQ-DETECTIVE-APPROVED-PATCH-2026-09-23.zip`, SHA-256 `fd48c84eac88b1355ff16e7162f912f91ba08776ca2c734ef1e82f0424d448a9`.

Relative to the Dossier/IQ36 production layer, final candidate changes only:
- NEW `assets/detective-iq.js`
- MOD `assets/detective-iq-data.mjs`
- MOD `assets/detective-iq.mjs`
- MOD `assets/dossier-v2.js`
- MOD `dossier/index.html`
- MOD `iq-detektiva/index.html`

No files were removed.

## IQ content freeze
Public name: **IQ детектива**.
Route: `/iq-detektiva/`.
36 tasks, 6 skills × 6, 3 rounds × 12.
Frontend version: `cognitive_v3`.

Accepted review changes are frozen in this candidate, including:
- #6 replaced;
- #13 strengthened without solution hints;
- #14 Anna/Boris/Vera truth consistency;
- #21 simplified wording/visual;
- #23 graphical one-property-change task;
- #24 three boxes / exactly one true inscription;
- #25 symmetric-difference visual;
- #26 indicator logic;
- #27 modular arithmetic / answer 57;
- #29 new visual analogy;
- #31 Russian alphabet with explicit `Ё не используется`;
- #32 9 coins / two weighings;
- #34 3D orthographic projections;
- #35 accepted premium 3×3 matrix visual;
- #36 four independent systems final task.

## Visual freeze
Approved by user after overflow correction.
Requirements preserved:
- restrained navy/gold premium assessment style;
- actual SVG/CSS graphics, not textual pseudo-visuals;
- figures stay inside cards;
- responsive SVG sizing and mobile layout;
- #34 3D cubes/projections;
- #35 graphical matrix;
- #36 source cards;
- desktop/mobile preview accepted.

## Result screen
After completion visitor sees:
- total /36;
- six scale scores;
- summary of strongest/hardest groups;
- full answer review;
- correct / wrong / skipped status;
- user's answer and correct answer;
- compact desktop table and mobile-friendly cards.
Correctness is not disclosed during the test.

## Backend source of truth
Production Supabase project: `mystery-logic` (`orknvuwknvsedjgqcfwc`).
`cognitive-result`: **ACTIVE v6**.

Compatibility:
- `cognitive_v2` preserved with previous answer key/hash for old cached attempts;
- `cognitive_v3` added for the approved new 36-task set;
- v3 itemSetHash: `e3a9a092fa070f5bc52e4938bb3320f0fb752ca41d9042a47da4fb71727d6afa`.

Current v3 correct indices by position:
`0,2,2,0,0,0, 0,0,3,0,3,0, 2,1,2,0,0,0, 0,0,1,1,0,0, 0,1,1,1,2,2, 2,2,1,0,0,2`.

## QA completed
- exact canonical LIVE-2026-09-22 SHA rechecked: PASS;
- final patch SHA rechecked: PASS;
- final full candidate ZIP integrity: PASS;
- JS/MJS syntax: PASS for detective IQ and dossier files;
- required IQ/Dossier support assets present: PASS;
- `/iq-detektiva/` local refs missing: 0;
- `/dossier/` local refs missing: 0;
- full candidate root `index.html`: present;
- final candidate includes 686 files.

## Continuity directive for other chats
For any further Dossier / IQ / nearby site changes **before this release is promoted**, do NOT rebuild from an older Dossier/IQ ZIP or from `main` alone. Use `MysteryLogic-FINAL-CANDIDATE-IQ-2026-09-23.zip` as the approved next-base layer, while still checking `CURRENT_RELEASE.json` and current LIVE for unrelated/concurrent production changes before deployment.

After this candidate is actually uploaded and verified on `mysterylogic.com`, owner confirmation must be obtained. Then:
1. save the verified full site as the new canonical LIVE baseline;
2. update `CURRENT_RELEASE.json` to that exact ZIP/hash;
3. from that moment all chats use the new CURRENT_RELEASE as production source of truth.

## Exact next step
Upload the approved frontend package/full candidate, verify LIVE desktop/mobile + scoring/save/Dossier, obtain owner confirmation, then promote canonical baseline and CURRENT_RELEASE.


## Continuity promotion — 2026-09-23
Owner explicitly instructed to promote the approved full build immediately as the base for subsequent chats.

CURRENT_RELEASE now points to:
- release_id: `approved-base-2026-09-23-iq`
- status: `approved_current_base_pending_live_verification`
- baseline: `/Mystery Logic/Production/MysteryLogic-LIVE-2026-09-23.zip`
- Library id: `libfile_40fc44411a9481918305239c3f6845e3`
- size: 7,657,569 bytes
- files: 686
- SHA-256: `af1429e444b8cab0c1a4bd398b4398a7a5e43c647163fb5b6ce475fc76afe644`

This is the base other chats must use for subsequent modifications.
Live browser verification remains pending; before any deployment, compare against current `mysterylogic.com` for concurrent changes. After verification, clear the pending flag and record the release as normal LIVE.

## S1 rotation hotfix — 2026-09-25

### Trigger
Owner found a visual logic error in S1 on the current IQ page: after a 90° clockwise rotation the geometry of option A was correct, but the orange marker was drawn in the wrong square.

### Source of truth used
Before editing, `CURRENT_RELEASE.json` on `main` was re-read. Exact approved baseline:
- release_id: `approved-base-2026-09-23-iq`
- baseline: `MysteryLogic-LIVE-2026-09-23.zip`
- Library id: `libfile_40fc44411a9481918305239c3f6845e3`
- files: 686
- SHA-256: `af1429e444b8cab0c1a4bd398b4398a7a5e43c647163fb5b6ce475fc76afe644`

The Library baseline was materialized again and the SHA-256 matched exactly before the patch.

### Logic correction
S1 source cells are `(0,0),(1,0),(1,1),(1,2)`; marker is `(1,2)`.
For a normalized 90° clockwise rotation the result is:
- cells: `(0,1),(1,1),(2,1),(2,0)`
- marker: `(0,1)`

Therefore option A remains the correct answer, but its marker changes from `[2,0]` to `[0,1]`.

No answer key, `cognitive_v3` version, itemSetHash, scoring backend or Supabase change is required.

### Changed production paths
Only:
- `assets/detective-iq.js`
- `assets/detective-iq.mjs`
- `iq-detektiva/index.html`

The HTML change only updates the cache-buster for `detective-iq.js` to `20260925-iq-s1-fix1`.

### QA
- exact baseline SHA check: PASS
- S1 geometry calculation: PASS
- correct answer still A / index 0: PASS
- JS syntax: PASS
- MJS syntax: PASS
- desktop visual preview: PASS
- mobile visual preview: PASS
- full-tree diff against baseline: exactly 3 files changed
- ZIP integrity: PASS

### Built artifacts
Minimal production patch:
- `MysteryLogic-PATCH-IQ-S1-2026-09-25.zip`
- 3 files
- SHA-256: `478d0df17368568df70db95e30f6617dc21ec4d2140f57097252cf463a069900`

Full candidate rebuilt from the exact approved baseline plus only this hotfix:
- `MysteryLogic-FULL-CANDIDATE-IQ-S1-FIX-2026-09-25.zip`
- 686 files
- SHA-256: `abc8272863003ac1ce25ce4ad6dea09300509b68527d83969c544c8f51cc29a1`

### Continuity / production boundary
For any subsequent IQ/Dossier work before another approved base supersedes this one, preserve this S1 correction and do not reconstruct from an older IQ package.

This hotfix is **not claimed LIVE yet**. `CURRENT_RELEASE.json` is intentionally unchanged until:
`deploy -> verify mysterylogic.com -> owner confirmation -> save verified full LIVE baseline -> update CURRENT_RELEASE.json`.

Exact next step: upload the 3-file production patch to the site root, verify S1 on desktop/mobile and confirm; only then promote the verified full build as the next canonical LIVE baseline.



## S1 replaced entirely — 2026-09-25

### Owner decision
The previous S1 hotfix is superseded. After repeated visual ambiguity with the L-shaped figure and orange marker, the owner decided to stop repairing that task and replace S1 entirely.

Do **not** restore the old L-shaped S1 or its marker-position fixes in future builds.

### New S1
Prompt:
`Стрелку поворачивают на 90° по часовой стрелке. Куда она будет направлена?`

Visual:
- source arrow points UP;
- operation: 90° clockwise;
- A: RIGHT — correct;
- B: DOWN;
- C: LEFT;
- D: UP.

Visible answer labels:
- A `Вправо`
- B `Вниз`
- C `Влево`
- D `Вверх`

Correct answer remains index `0 / A`, so the production scoring key does not change.

### Source / scope
Built from the exact `CURRENT_RELEASE.json` approved baseline:
- release_id: `approved-base-2026-09-23-iq`
- baseline: `MysteryLogic-LIVE-2026-09-23.zip`
- SHA-256: `af1429e444b8cab0c1a4bd398b4398a7a5e43c647163fb5b6ce475fc76afe644`

Changed production paths:
- `assets/detective-iq.js`
- `assets/detective-iq.mjs`
- `assets/detective-iq-data.mjs`
- `iq-detektiva/index.html`

Cache-buster: `detective-iq.js?v=20260925-iq-s1-replacement1`.

### QA / artifacts
- baseline SHA rechecked: PASS
- JS syntax: PASS
- MJS syntax: PASS
- full-tree diff: exactly 4 files
- visual logic: UP + 90° clockwise = RIGHT (A)
- patch ZIP integrity: PASS
- full candidate ZIP integrity: PASS

Minimal patch:
- `MysteryLogic-PATCH-IQ-S1-REPLACEMENT-2026-09-25.zip`
- SHA-256: `e2685eaa89773de3c0c432e753e0468f00eb972244fbece47acda3ead91d0790`

Full candidate:
- `MysteryLogic-FULL-CANDIDATE-IQ-S1-REPLACEMENT-2026-09-25.zip`
- SHA-256: `70d06812dcdce8db94441cd7368075c821b9c9717cc038051fb99435690d049b`

### Production boundary
This replacement candidate is not canonical LIVE until:
`deploy -> verify mysterylogic.com -> owner confirmation -> save verified full LIVE baseline -> update CURRENT_RELEASE.json`.


## S1 multistep replacement promoted to LIVE — 2026-09-25

### Supersedes previous S1 notes
The earlier single-step arrow replacement and all older L-shape/marker fixes are superseded.

Canonical S1 now is:
- start direction: UP;
- step 1: 90° clockwise;
- step 2: 180° counter-clockwise;
- step 3: 360° clockwise;
- final direction: LEFT;
- correct answer: A / index 0.

Prompt:
`Стрелку последовательно поворачивают: 90° по часовой стрелке, затем 180° против часовой стрелки, затем 360° по часовой стрелке. Куда она будет направлена?`

Visible answer labels:
- A: `Влево`
- B: `Вправо`
- C: `Вниз`
- D: `Вверх`

### Visual
Final version uses the cleaner premium layout approved for deployment:
- start arrow card;
- three separate rotation cards;
- four directional answer cards;
- cache-buster `20260925-iq-s1-multistep-pretty1`.

### Files
Changed production paths:
- `assets/detective-iq.js`
- `assets/detective-iq.mjs`
- `assets/detective-iq-data.mjs`
- `iq-detektiva/index.html`

Backend/scoring/`cognitive_v3`/Supabase were not changed because the correct index remains `0 / A`.

### QA / artifacts
Built from exact prior approved baseline `MysteryLogic-LIVE-2026-09-23.zip`
SHA-256 `af1429e444b8cab0c1a4bd398b4398a7a5e43c647163fb5b6ce475fc76afe644`.

Minimal patch:
- `MysteryLogic-PATCH-IQ-S1-MULTISTEP-PRETTY-2026-09-25.zip`
- SHA-256: `7d985b530eebff007e9eaaef589bd61fe0bc03f0774d8708531c6f81445efbe3`

Full promoted baseline:
- `MysteryLogic-LIVE-2026-09-25.zip`
- Library: `/Mystery Logic/Production/MysteryLogic-LIVE-2026-09-25.zip`
- Library id: `libfile_8c8f0efe4e2481919fe78f0e60d7b966`
- files: 686
- size: 7,558,894 bytes
- SHA-256: `a510891c3d68dcef723e5ff2f88789a8ad164ee3e777ac95db21b5544e407185`

### LIVE confirmation
Owner confirmed production result on 2026-09-25: `готово, исправили.`

Assistant-side direct fetch of mysterylogic.com was unavailable in this session, so the final live visual verification was performed by the owner in the browser. Owner confirmation is the release gate evidence for this promotion.

### Source of truth
`CURRENT_RELEASE.json` is advanced to:
- release_id: `live-2026-09-25-iq-s1-multistep`
- baseline: `MysteryLogic-LIVE-2026-09-25.zip`
- live_verification_pending: `false`

All subsequent Mystery Logic production work must use this baseline unless a newer CURRENT_RELEASE supersedes it.
