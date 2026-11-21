# Mystery Logic / Moreno — единый кандидат v0.5 + современный движок

Дата: 2026-11-22. Статус: **INTEGRATED QA / NOT READY / NOT LIVE**.

## Источники и решение
- Пользователь утвердил настоящий визуальный стиль исторической v0.5, но полный откат старого JS/AI v1 признан непригодным (см. закрытый QA PR #386).
- Точная версия страницы выгружена владельцем с Beget (2026-11-19): `realnye-dela/pozharnaya-lestnica-1991-premium/index.html`, SHA-256 `254a8808f0252cca29eb26a5868fa65b2c0670ea37a88d2885d76fd2fc9f50ea`. 53 Morena assets в отдельном пользовательском ZIP + оригинальные sitewide menu and funnel assets. **Не предполагать, что GitHub main = LIVE**.
- `CURRENT_RELEASE.json` указывает на canonical baseline `MysteryLogic-FINAL-BASE-2026-09-25.zip`, SHA-256 `a510891c3d68dcef723e5ff2f88789a8ad164ee3e777ac95db21b5544e407185`. Проверен архив и CRC, использован как база для неподанных общих ресурсов.
- Задача: вернуть двухколоночный оригинал `real-case-moreno-sandbox.css` (Git blob `21441e17f47cb181cc99898a72fb4a78de4e3300`) без изменения game engine, текущих customer sessions, оплаты и внешнего SEO.

## Что объединено (draft branch; не развернуто)
Branch `feature/moreno-v05-modern-integrated-20261122`, основанная на отдельной визуальной работе #384 с включённой независимой backend-правкой #385.
- `realnye-dela/pozharnaya-lestnica-1991-premium/index.html`: **заменён на сохранённый на основе exact Beget-export HTML** (исходник SHA выше, минимальный декларативный HTML-патч). Сохранены HTML метаданные/canonical, legal footer, Яндекс.Метрика, общесайтовые меню, typography-polish, logic, conversion and funnel analytics. Включены оригинальный `sandbox.css`, modern v6 core, v23 AI router, functional v16/v17/v18/v19 scripts and v25 final. Убраны только 19 наложенных Moreno-specific CSS links и три визуальных overlay scripts.
- `assets/real-case-moreno-v05-compat.css`: косметическая совместимость (не перекрывать вводом первые инструкции, разметка улик, mobile/typography/sitewide menu); `assets/real-case-moreno-v05-brief.js`: первоначальные обстоятельства сохраняются после принятия.
- `supabase/functions/ai-moreno-investigator-v8/index.ts`: безопасная маршрутизация косвенных просьб переключить свидетеля со встроенными guards для еще не открытых персонажей. Файл из #385 перенесён в ветку, **продолжает лежать только в GitHub**; production Supabase не менялся. `v9` из GitHub main не переносить: он не совпадает с нынешним production.
- `tests/real-case-moreno-v8-witness-switch-contract.mjs`, `tests/real-case-moreno-v05-beget-integrated-contract.mjs`, и исправленные проверки v0.5 в workflow.

## Сверка и локальный QA
- Из exact LIVE source + 53 case assets + 3 current sitewide assets + verified canonical baseline собрана изолированная папка `/mnt/data/moreno_release_work/site_candidate/`. Нет отсутствующих внутренних CSS/JS (15 CSS / 16 JS).
- Проверены source integrity и неизменённые backend-relevant JS. Вычислен SHA-256 HTML кандидата `2ca15b0db5e7589095db13f13af70f7cc619ebe077a9325079c503f9324fe8af` после финального rebuild с новым v05 query; кешируемая версия CSS не влияет на механику.
- QA Playwright Chromium на 1366×900, 768×1024, 390×844, с полным набором точных встроенных CSS/JS и **mocked network**, без production requests: accept, initial brief, first evidence, ambiguous command without new evidence, people/witness discovery, evidence folder, localStorage restore in new context, witness switch, zero JS errors, zero horizontal overflow — PASS.
- Late-game seeded browser test Chromium 1366 и 390: ввод версии → gate v25 → final form → evidence selection → submit → v6 reveal + v25 summary PASS при **mocked API**. Это тест интерфейса, а не реального серверного признания правильности.
- Existing PR #385 isolated Edge v8 contract test PASS в GitHub Actions ранее; новые integrated CI checks требуют подтверждения в последнем commit, нельзя объявлять green заранее.
- Production `ai-moreno-investigator-v8` ACTIVE version 8, без патча. Публичный v23 smoke с текущим сервером возвращает ошибочное `ask_witness(boyfriend)` вместо `start_interview(second_floor_witness)`, то есть live backend full gate FAIL.

## Отдельный серьёзный блокер Premium SECURITY GATE
- В `assets/real-case-moreno-ai-v6.js` исторически уже публично находятся полный HTML reveal, подозреваемый в правильной версии и условия допуска финала; это **не серверный private canon**. Это предшествующий UI-патчу дефект. UI v0.5 не устраняет его, и нельзя маскировать тем, что некоторые smoke tests успешны.
- Для полноценного Premium G7 (commerce/security boundary) и G3 (spoiler-hunter) нужен отдельный согласованный server-authoritative final/canon архитектурный патч, затем E2E and adversarial QA. Не переносить секреты/высказывания в frontend. Не мержить это без одобрения.
- Native Safari browser QA, real production AI full-session E2E, checkout/payment/entitlement verification, CASE_RELEASE_GATE G0–G9, DELIVERY_SELF_QA_CANON and Cognitive Gate не завершены.
- **NOT READY.** Нельзя давать ZIP как production-ready, нельзя считать PR commit = LIVE. Backend/HTML/site не деплоились, платёжные модули и CURRENT_RELEASE.json не менялись.

## Ближайший точный план
1. Проверить integrated CI и устранить отдельно условия приватного GitHub checkout; реальный v23 test не отключать до устранения backend.
2. Получить прямое approval владельца на минимальный production Edge v8 patch (это мгновенно действует для игроков) и отдельно на server-side private canon/final authority, либо отложить Premium релиз.
3. Только после реального E2E server+browser, spoiler-hunter, renew session, payment security, Safari, manual G0–G9 PASS произвести clean-room ZIP test из точного Beget-aligned diff и согласованный deploy.
