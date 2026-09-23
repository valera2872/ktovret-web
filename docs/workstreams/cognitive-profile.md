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
