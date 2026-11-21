# Mystery Logic · Moreno — полный откат к исторической v0.5 (проверка 2026-11-22)

**Scope:** восстановить именно историческую игру v0.5 по просьбе владельца, без изменения Supabase и без публикации на LIVE.

## Источники
- Исторический GitHub коммит `22e53f463dd76d476815fc93d6d7515e1d21f0f4`; оригинальный `assets/real-case-moreno-ai-v5.js` Git blob SHA `0bd420f04c2f1d37f6af02e42494b57e4cabe2c8`. Файл из canonical baseline имеет **точно тот же** Git blob SHA, UTF-8 bytes 28271. `real-case-moreno-sandbox.css` точно оригинальный Git blob `21441e17f47cb181cc99898a72fb4a78de4e3300`.
- `CURRENT_RELEASE.json`: `MysteryLogic-FINAL-BASE-2026-09-25.zip`, SHA-256 `a510891c3d68dcef723e5ff2f88789a8ad164ee3e777ac95db21b5544e407185` (verified).
- Из Beget пользователем 2026-11-19 предоставлен LIVE candidate page `realnye-dela/pozharnaya-lestnica-1991-premium/index.html` SHA-256 `254a8808f0252cca29eb26a5868fa65b2c0670ea37a88d2885d76fd2fc9f50ea` и 53 Moreno assets + menu and funnel assets. HTML актуален на дату выгрузки; **возможен дальнейший LIVE drift**.
- Production Supabase strictly `orknvuwknvsedjgqcfwc`, `ai-moreno-investigator-v1` ACTIVE version 6, Verify JWT **true**. Исторический браузерный движок v0.5 обращается непосредственно к **v1**, а не v8/v9/v11.

## Реальная несовместимость, выявлена и исправлена в изолированной копии
- Оригинальный `ai-v5.js` не посылает обязательный `visitor_id`; production v1 требует `visitorOk(visitor)` после status и возвращает 400 `invalid_visitor`. Без патча игровой клиент молча уходит в fallback.
- Новый изолированный файл `assets/real-case-moreno-ai-v05-rollback.js` = **точная историческая v0.5 + 533 байта**: постоянный анонимный visitor ID в localStorage, один дополнительный поле `visitor_id` в body AI request. Git file download through QA-only Action artifact, SHA-256 `cb1c0bda255150ba2aedb845902e08364a8648db559daeda6bc29708392eba22`. Другие функции и канон не изменены.
- Тестовая Beget LIVE-aligned копия HTML `/mnt/data/moreno_rollback_work/candidate_site/realnye-dela/pozharnaya-lestnica-1991-premium/index.html`, SHA-256 `c3a745e55ab36606b24ec378918e1790bc707f08196c8c518d0410e4b51cad39`. Убраны 19 накопленных Moreno CSS и 12 Moreno JS, возвращены `sandbox.css`, историческая шапка; сохранены общесайтовые стили, menu, legal, analytics, SEO/canonical/index. Добавлен только scoped compat CSS `real-case-moreno-v05-rollback-compat.css` SHA-256 `1c66274fa8d590884f8d509e2caf37f4375724407878f11285d17729ad896a6e`.

## QA уже выполнен
- Browser Chromium Playwright с exact source and LIVE HTML, desktop 1366, tablet 768, mobile 390. 17-turn mock-server end-to-end: accept → inspect → people → locate witness → interview boyfriend → interview witness → ballistics → trajectory → weapon/motive/alibi → evidence compare → working theory → submit → reveal. LocalStorage restore in clean tab after middle game. **PASS on 3 viewport sizes**, no JS errors, horizontal overflow 0, visitor and session IDs stable. These are **mock AI responses**.
- GitHub Actions PR #386: isolated real server v1 smoke (status/interpret/interrogate) **PASS**; this is production read/write budget test with isolated fake visitor session, no customer data or Supabase function mutation.
- Full v1 API 17-step sequence is separately being checked by CI (isolated fake session with RPM safeguards), result to record.
- No site or database/backend production mutations done.

## HARD RELEASE BLOCKER (not a cosmetic issue)
- Historical v0.5 frontend embeds **complete Premium final reveal**, true answer, conditional win predicate `submitCase`, evidence graph and text of unrevealed facts in publicly served JavaScript. This directly violates product private-canon rule (Premium culprit, hidden evidence, correct theory, unlock graph and terminal reply server-side only). A user can read source or alter localStorage to bypass investigation and reveal the answer.
- Thus even if client functions and old v1 backend work, **the exact historical engine cannot be deployed as a secure Premium game**. It was historically a public experimental game on `/realnye-dela/pozharnaya-lestnica-1991/`, not a safe drop-in for the premium URL.
- Additionally: modern v6 progress is stored under a different localStorage key and won't be automatically resumed in v0.5, despite preserving the bytes in storage. Avoid claiming backward-compatible session recovery.
- Actual LIVE parity beyond uploaded files not confirmed, Safari NOT RUN, CASE_RELEASE_GATE / DELIVERY_SELF_QA_CANON / Cognitive Gate FAIL/NOT RUN.
- **Release status NOT READY. Do NOT label any ZIP final, do NOT deploy, do NOT replace production `CURRENT_RELEASE.json`.** Do not issue the candidate archive as working production game.

## Safe path forward
Keep approved v0.5 **visual design** and current production-friendly backend/public state architecture, correct known v8 switch issue with separately approved tested backend migration, or design a server-side authoritative classic engine; preserve source and game mechanics as far as possible. Do not hide public spoiler by minification/encryption or remove functional finale. Need explicit owner approval before changing LIVE backend/security.

## Real server full-path result — FINAL DIAGNOSIS
- GitHub Actions run `44951675133`, job `136990768936` executed historical v0.5 full route against real production `ai-moreno-investigator-v1` in an isolated CI session, with stable visitor and RPM spacing.
- Step 1 inspect_scene PASS, 2 identify_people PASS, 3 locate_witnesses PASS, 4 start_interview(boyfriend) PASS, 5 interrogate boyfriend topic=sequence PASS, 6 start_interview(second_floor_witness) PASS, 7 interrogate second_floor_witness topic=observation PASS, 8 forensic_ballistics PASS, 9 forensic_trajectory PASS, 10 check_weapon(boyfriend) PASS, 11 check_motive(boyfriend) PASS, 12 check_alibi(boyfriend) PASS.
- **Step 13 compare_description FAIL**: live API returned `intent=identify_people` even though this action already existed in completed. Source inspection establishes a deterministic architecture mismatch: `ai-moreno-investigator-v1` INTENTS and the LLM routing instructions **do not include `compare_description`**; `ai-v5.js` has `case 'compare_description'` as an evidence-unlocking operation. Thus this clue cannot be reached through the normal real v1 router, irrespective of phrasing.
- This is a failure in a central investigation mechanic, not a visual issue or a mere model-flakiness assumption. **Real E2E FAIL, no release.**
- Separate HARD Premium blocker remains: original client contains spoiler/reveal, truth predicate, unlock logic, and complete unrevealed evidence; needs server-side private canon, not client code obfuscation. Historic opening also links directly to an official arrest announcement that can spoil the resolution.
- Gate: source integrity PASS; mock browser E2E PASS; live backend smoke PASS; **live full investigation FAIL**; private canon **FAIL**; modern session migration **UNKNOWN**; Safari **NOT RUN**; therefore **NOT READY**.
- No ready ZIP has been issued, no production backend/site changes made. Draft QA PR #386 is NOT a release branch.
