# Mystery Logic — восстановление утверждённого дизайна Moreno v0.5

**2026-11-19 · Workstream: Moreno restore approved v0.5 design.**

## Решение пользователя
Пользователь однозначно подтвердил: исторический дизайн v0.5 — это «та самая нормальная версия». Отверг чужие сгенерированные визуальные референсы, английские макеты, новый редизайн и накопление декоративных слоёв. Сохранять именно v0.5, не подменять его `reference-v10`.

## Проверенные первоисточники
- GitHub исторический коммит v0.5 `22e53f463dd76d476815fc93d6d7515e1d21f0f4`:
  - `realnye-dela/pozharnaya-lestnica-1991/index.html` blob `7f4a06517d4594bda15422f032b077bcfe078731`;
  - `assets/real-case-moreno-sandbox.css` blob `21441e17f47cb181cc99898a72fb4a78de4e3300`;
  - `assets/real-case-moreno-ai-v5.js` blob `0bd420f04c2f1d37f6af02e42494b57e4cabe2c8`.
- `CURRENT_RELEASE.json`: canonical LIVE baseline `MysteryLogic-FINAL-BASE-2026-09-25.zip`, SHA-256 `a510891c3d68dcef723e5ff2f88789a8ad164ee3e777ac95db21b5544e407185`. The actual bytes were verified. Baseline contains exact `sandbox.css` and historical `ai-v5.js` (same Git blob SHA).
- Live site may drift beyond canonical baseline; **GitHub main is not LIVE**.

## Выполнено (отдельная draft-ветка, не LIVE)
Branch `feature/moreno-restore-v05-visual-20261119`
- Premium page `realnye-dela/pozharnaya-lestnica-1991-premium/index.html`: restored original `ml-brand-strip` header from v0.5; restored two-column `sandbox.css` styling; removed 19 accumulated Moreno design CSS links, leaving functional v6/16/17/18 CSS plus one small compatible stylesheet; omitted visual overlay modules `intro-v20.js`, `reference-v11.js`, `reference-v13.js` that rewrote onboarding, evidence or status. **No changes to gameplay engine** `real-case-moreno-ai-v6.js`, AI router v23, semantic backend, inference, canon, payment, auth, sessions or final modules. Modern reference modules 16–19 and final-v25 remain.
- Added `assets/real-case-moreno-v05-compat.css`: only compatibility corrections: prevent sticky composer covering the first instruction at short viewports; accessible full text, mobile wrapping; promo hides only on this page.
- Added `assets/real-case-moreno-v05-brief.js`: opening factual context remains available after acceptance in native collapsible details styled in original v0.5. Initial state expanded before first action; collapses after first, retains manual toggle while continuing. No clue recommendation, no new facts.
- Added source contract in `tests/real-case-moreno-v05-restored-visual-contract.mjs`.
- SEO canonical/title/description/OG from current Premium page retained; no index change.

## Локальный QA (mock API, Chromium)
At 1366x900 and 390x844: initial acceptance PASS, v0.5 2-column/1-column responsive layout PASS, earned scene evidence stored/displayed in real working folder PASS, unclear action -> clarification without new evidence PASS, no JS exceptions, no horizontal overflow.
Initial preview revealed sticky composer covering `ДЕЛО У ВАС` at short viewport; explicitly fixed with document-flow composer. Re-tested desktop/mobile.
Persistent briefing: expanded at initial desk, auto-fold after first action, manual reopen and retention on following command PASS both sizes.
Mock hypothesis -> existing v25 final gate -> opening reconstruction form PASS both sizes, no JS errors.
Local preview is an internal QA tool, not a deliverable or a validated LIVE build.
Screenshots from actual local Chromium (not generated images) saved under `/mnt/data/moreno_v05_modern_preview/screenshots/`.

## Release boundary
- **NOT READY / NOT LIVE**. Current deployed Beget files not directly accessible and may differ from GitHub main/canonical baseline.
- No real backend full-flow interrogation or actual final submission was run. Actual iPad/iPhone Safari NOT RUN.
- CASE_RELEASE_GATE, DELIVERY_SELF_QA_CANON and Cognitive Gate not fully executed. No approval for replacement of live page after reviewing a Beget-safe preview.
- No ZIP must be described as final or LIVE-ready.
- PR #383 (newer v26 styling repair) is superseded for visual direction; do not merge alongside v0.5 restoration.

## Next precise step
1. Obtain current LIVE files from Beget: `realnye-dela/pozharnaya-lestnica-1991-premium/index.html` and `assets/real-case-moreno-sandbox.css`. Cross-check hashes and existing active scripts/asset query versions.
2. Rebase the minimal edit on exact LIVE rather than replacing site tree from GitHub. Confirm interface at desktop and mobile, especially initial case acceptance, briefing, filled journal, evidence, character memory and final reconstruction.
3. Run real AI/backend non-destructive E2E, retained state on refresh, incorrect/unknown commands, final gate and actual reveal; complete required Release Gate.
4. Request owner sign-off on the genuine v0.5-inspired screens. Only then prepare targeted deploy patch and verify mysterylogic.com; no CURRENT_RELEASE rewrite until canonical promotion conditions.
