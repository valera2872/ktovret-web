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

## 2026-11-19 — Архивы с текущего Beget предоставлены пользователем
- `(4).zip` содержит вложенный `archive_2056_2217.zip`: **53** файла `real-case-moreno-*`, CRC PASS, внешний ZIP SHA-256 `821d438c31ca16afe0a71fd6189cb8a3d4f8ed36029f56ebb06d87055a37ea7c`.
- `(3).zip` содержит страницу `realnye-dela/pozharnaya-lestnica-1991-premium/index.html` и две соседние HTML-страницы; CRC PASS, внешний ZIP SHA-256 `4fba012f8e74b8525f581d9614e5f055c2b4061eefd7484e95eaab987a947bbc`.
- Точный live HTML SHA-256: `254a8808f0252cca29eb26a5868fa65b2c0670ea37a88d2885d76fd2fc9f50ea`.
- Совпадение с историческим v0.5: `assets/real-case-moreno-sandbox.css` Git blob `21441e17f47cb181cc99898a72fb4a78de4e3300`; текущий game engine `assets/real-case-moreno-ai-v6.js` Git blob `e0af5d69b498c409b686443e31f1a03403ffe259`. Все проверено побайтно.
- В текущем Beget HTML присутствуют дополнительные, отсутствующие в GitHub main общесайтовые подключения: legal/typography/interface/logic-sitewide, analytics, `sitewide-menu-20261010-v3`. **Нельзя использовать HTML PR #384 напрямую для Beget** — он основан на GitHub main и не содержит LIVE additions.
- Отдельный локальный кандидат создан из точных LIVE-байтов, а не GitHub: `/mnt/data/moreno_live_audit/test_site/`. Сохранены все старые общесайтовые CSS/JS, SEO/canonical, analytics и платежный контур; заменены только стиль оформления и визуальные модули дела. Кандидат HTML SHA256 `8adc84252570f696a2d592f57c4d6f39aa799f38f3ed4bb1d9f13c19f7a65af9`.
- Встроенный Chromium тест на LIVE-базе, 1366×900 и 390×844 (mock AI): acceptance, preserved first brief, inspect_scene, real evidence text, no false completed status on clarify, brief collapsible preference, hypothesis save, mobile overflow/JS errors — PASS. Отдельно: seeded completed progress → финальная форма → submit → reveal + final summary — PASS desktop/mobile с mock API.
- Обнаружена дополнительная визуальная коллизия с `assets/typography-polish.css`, уменьшающим v0.5 заголовок через generic `main h1 !important`. Исправлено **только в отдельном совместимом CSS** case-scoped восстановлением исходного масштаба.
- При offline QA отсутствуют три не входивших в переданные ZIP sitewide assets: `sitewide-menu-20261010-v3.css`, `sitewide-menu-20261010-v3.js`, `funnel-analytics-20261010-v2.js`. Их ссылки сохранены в LIVE-кандидате; реальное влияние меню и аналитики не проверено. Реальный ИИ backend, Safari и полная проверка production-финала по-прежнему **NOT RUN**.
- По этой причине **Release Gate NOT READY**; ZIP как готовая игра не выдан, production не менялся.

## Local QA final follow-up (2026-11-19)
- Case-scoped typography fix tested against supplied Beget HTML + canonical common assets at desktop 1366 and mobile 390: title size restored to original v0.5, no horizontal overflow, no JS page errors.
- Independent seeded late-game mock test: saved evidence → final gate displayed → final reconstruction form opened → multi-evidence selection → valid reconstruction submitted → real current frontend v6 engine entered reveal and v25 printed final player summary. PASS in Chromium desktop and mobile, using **mocked network responses** only.
- A local **NOT READY** preview archive was created from exact Beget LIVE page + 2 new compatibility assets; zip SHA-256 `b08fac53d14aa5a3f7324abc5b27353c1cd7051273fb9c4766019d3916cc98b4`; clean-room unpack, CRC, file SHA equality and node --check PASS. **Must NOT be distributed as production-ready.**
- Still blocked: current live `sitewide-menu-20261010-v3.js/.css` and `funnel-analytics-20261010-v2.js` were not provided; true end-to-end with real AI/backend and Safari not executed. Release Gate NOT READY.
- Prepared Beget-aligned HTML is *not committed to PR #384* yet: PR HTML is based on GitHub main and omits deployed sitewide includes. Never merge/deploy PR's HTML as a substitute for exact provided LIVE. Sitewide includes are retained in the local Beget-aligned candidate.
