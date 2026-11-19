# Mystery Logic — Moreno / «Пожарная лестница» — ремонт UX 2026-11-19

## Статус
**Local/browser QA PASS for scoped UI fix; deployment NOT READY.**
Production `mysterylogic.com` не изменяли. Зафиксировано разрешение пользователя «исправляй» на починку; отдельного одобрения выпуска после LIVE-сверки пока нет.

## Источники
- `CURRENT_RELEASE.json` → canonical baseline `MysteryLogic-FINAL-BASE-2026-09-25.zip`.
- SHA-256 baseline: `a510891c3d68dcef723e5ff2f88789a8ad164ee3e777ac95db21b5544e407185` — проверен.
- Текущий GitHub `main` используется только как кодовая база для draft PR, **не** как доказательство LIVE.
- Прямое скачивание текущих LIVE-файлов сайта из среды недоступно; пользователь предоставил реальный скриншот текущей страницы с перекрытиями и неверными ответами.
- LIVE может расходиться с canonical baseline и GitHub main.

## Причины, подтверждённые анализом исходников и браузерными тестами
1. `assets/real-case-moreno-reference-v11.js` в `buildFolder` удалял все исходные карточки улик, заменяя их неинтерактивными краткими категориями.
2. Тот же файл маркировал каждый `.v6-item` статусом «✓ Завершено» независимо от `kind`, включая `system` и `limit`.
3. `assets/real-case-moreno-reference-v13.js` объявлял каждый пакет результатом «Выполнено N действий» и «материалы сохранены», включая ошибочные / требующие уточнения; также показывал неподтверждённый статус «ИИ-помощник активен».
4. Поздние CSS-слои обрезали полный текст доказательств и перекрывали хедер. Статические иллюстрации присваивались даже ошибкам.
5. Общий промоблок перекрывал кнопку «Принять дело» на viewport 390px; локально воспроизведена невозможность нажать CTA обычным кликом.

## Изменено только в draft branch
`fix/moreno-investigation-ux-20261119`
- `assets/real-case-moreno-reference-v11.js`: оставить нативные доказательства движка на месте; не вводить фальшивые статусы.
- `assets/real-case-moreno-reference-v13.js`: нейтральный журнал вместо заявлений об успешном действии; нет декоративных «улик» для `system/limit/dead`; правдивый статический текст про свободный ввод.
- `assets/real-case-moreno-production-v26.css`: видимость полного текста улик, адаптивные отступы, компактные диагностические сообщения, скрытие sitewide промоблока **только** на странице Moreno.
- `tests/real-case-moreno-ux-contract.mjs`: защита от возврата трёх регрессий.

Не изменены: `real-case-moreno-ai-v6.js`, AI router/server functions, Supabase schema/RLS/payment/entitlement, state key `ml-realcase-moreno-ai-v6`, private canon, финал.

## QA выполнено на локальной копии canonical baseline
- Chromium статические сценарии 1366×900, 768×1024, 390×844: нет JS errors и горизонтального overflow.
- На исходнике: 0 исходных карточек, 3 декоративные категории; неверные «Завершено» в диагностике — воспроизведено.
- На фиксе: 5 реальных карточек с полными текстами, 0 декоративных суррогатов; на `system/limit` нет «Завершено».
- E2E с **mock server only** на 1366 и 390: открыть дело → запрос «осмотреть место происшествия» → настоящая карточка осмотра → неопределённое поручение → уточнение без добавления улики, no JS errors: PASS.
- На baseline мобильный промоблок блокировал `Принять дело`; после CSS исправления click PASS.
- Node source contract: PASS.

## Release Gate
- Source diff/UI unit and Chromium mock flow: PASS.
- Current Beget LIVE-byte/hash verification: **UNKNOWN**.
- Production iPhone/iPad Safari and full real backend AI interrogation: **NOT RUN**.
- Actual final reconstruction end-to-end on real server: **NOT RUN**.
- Full CASE_RELEASE_GATE, DELIVERY_SELF_QA_CANON, Cognitive Gate: **NOT RUN**.
- Therefore: **NOT READY FOR LIVE DEPLOY; no final ZIP**.

## Следующий шаг
1. Получить из текущего Beget четыре файла: `realnye-dela/pozharnaya-lestnica-1991-premium/index.html`, `assets/real-case-moreno-reference-v11.js`, `assets/real-case-moreno-reference-v13.js`, `assets/real-case-moreno-production-v26.css`.
2. Проверить действующие SCRIPT/CSS ссылки и SHA-256 против известных исходников; перенести узкие изменения без перезаписи текущего LIVE; обновить версии asset URLs для bust cache.
3. Preview согласование desktop/mobile, затем реальный безоплатный E2E с AI, восстановление прогресса, финал, relevant Gate.
4. После разрешения владельца выпустить минимальный ZIP; только deploy + проверка LIVE + подтверждение владельца создают новый релиз и допускают обновление `CURRENT_RELEASE.json`.

## Примечания
Эти правки не являются проверкой качества LLM-маршрутизатора v11/v9/v8; ошибки ответов на свободный язык нуждаются в отдельном анализе запросов/канона. Никаких production изменений не выполнялось.
