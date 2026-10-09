# Mystery Logic — Partner AI-01 «Последний сеанс» — PUBLIC WORKSTREAM

Дата: 2026-10-09
Статус: scenario design / pre-implementation / до Premium UI
Формат: Premium Partner AI Investigation, строго 2 игрока

## Цель
Создать первое полноценное асимметричное Partner AI-расследование Mystery Logic, где:
- игрок A ведёт физическую/человеческую линию;
- игрок B ведёт цифровую/техническую линию;
- каждому доступны разные действия, сведения и улики;
- ключевые выводы требуют обмена информацией;
- финал — совместная реконструкция, а не угадывание имени.

## Закреплённые продуктовые решения
- Guest/room-first: короткая ссылка/код, игра с разных устройств.
- Server-controlled state, refresh/disconnect не должны терять прогресс.
- private_A / private_B / shared как модель информации.
- Общая доска: Факты / Версии / Противоречия / Общие выводы.
- Partner Sync проверяет сформулированную игроками дедукцию, а не просто сочетание карточек.
- Игроки могут свободно разговаривать между собой; асимметрия держится на разных полномочиях, а не на запрете делиться.
- AI не создаёт канон и не знает факты вне Knowledge персонажа.
- Ложь ≠ вина; главный ложный подозреваемый должен быть доказательно отделён от виновного.
- Признание не является источником решения.
- Финальная реконструкция делится между ролями и завершается совместной частью.

## Концепция без спойлеров
Исчезает психотерапевт Илья Марков. Его машина и телефон остаются у центра, но вечером после предполагаемого исчезновения он совершенно точно проводит настоящий интерактивный онлайн-сеанс. После этого из его аккаунта появляются признаки добровольного ухода.

Центральная загадка:
«Почему человек, который точно был жив и работал до 21:09, к утру выглядел так, будто заранее подготовил собственное исчезновение?»

Игрок A исследует физические следы, людей, гараж, документы, транспорт и объекты.
Игрок B анализирует сеанс, устройства, сеть, версии файлов, аккаунты и цифровой timeline.

## Текущий объём проектирования
Готовы:
- CANON WHO/WHY/HOW/WHERE/WHEN;
- точный timeline;
- 7 character-state моделей;
- suspect matrix;
- knowledge boundaries / forbidden knowledge;
- 20 evidence nodes;
- contradiction map;
- unlock graph;
- 2+ крупные Partner deduction moments;
- rescue logic;
- final reconstruction;
- Premium visual direction.

Не готовы:
- adversarial QA;
- technical fact-check;
- Content Freeze;
- Cognitive Gate;
- CASE_RELEASE_GATE;
- DELIVERY_SELF_QA_CANON;
- UI/backend implementation;
- room/session schema decisions;
- pricing;
- production deploy.

## Premium visual direction
Обязателен не как поздняя оболочка, а как часть механики.

Концепция: «Две половины одного дела» / «Одно исчезновение. Две версии реальности.»

A — тёплый физический след: фото, планы, ключи, бумага, автомобиль, реальные пространства.
B — холодный цифровой след: network graph, session waveform, fingerprints, timeline, version diff.

Одна Mystery Logic design system.

Ключевые Premium-moments:
- две временные линии расходятся, затем сходятся в одной доказанной точке;
- материалы переходят из private workspace на общую доску после сознательной передачи;
- совместная дедукция визуализируется как связь независимых доказательств;
- ложный подозреваемый визуально отделяется от доказанной вины;
- rescue не завершает дело: физическая и цифровая части всё ещё должны быть реконструированы.

## Private canon checkpoint
Полный спойлерный checkpoint хранится в Library:
`/Mystery Logic/Checkpoints/MysteryLogic-Partner01-LastSession-CHECKPOINT.md`

Library file id:
`libfile_665e09264d608191b5b3a866e15f20d1`

SHA-256 exact private checkpoint:
`82743bc45c8bce08cf2a4d331f9ed23d66c2355478616598b178b9c92507242a`

## Точный следующий шаг
ADVЕRSARIAL QA №1 до любого UI/кода.

Пройти дело шестью ролями:
1. Следователь — честно вывести решение.
2. Адвокат виновного — построить максимально сильную альтернативную версию и найти недоказанные звенья.
3. Spoiler hunter — назвать правильного подозреваемого слишком рано и искать обход доказательной позиции.
4. Застрявший игрок — пропустить ключевую связь и проверить recovery без спойлера.
5. QA/абьюзер — brute force, широкие запросы, повторные допросы, scope abuse, refresh/disconnect.
6. Новый пользователь — onboarding, ясность ролей, первое действие.

После QA:
- исправить канон/graph;
- провести technical fact-check;
- только затем Content Freeze;
- затем Premium UI/visual architecture;
- затем implementation.

## Инструкция новому чату
На фразы пользователя «продолжай Последний сеанс», «продолжай Partner-дело» или «продолжим»:
1. прочитать этот public workstream;
2. найти и прочитать private Library checkpoint по указанному пути/file id;
3. при необходимости свериться с Грант-Адамсон, стратегией Clurio и монетизацией;
4. не спрашивать заново идею, роли, таймлайн или Premium-направление;
5. продолжить с ADVERSARIAL QA №1, если пользователь не изменил приоритет.


## 2026-10-09 — Technical Fact-Check + Adversarial QA №2

Technical Fact-Check completed against authoritative technical/privacy references.

Scenario changes:
- removed obvious R-04 ↔ REMOTE-04 naming shortcut;
- B now sees network node KAPPA-7 + hardware asset tag; A sees Object 12 + matching inventory tag; location requires cross-role mapping;
- B02 now uses managed-device identity/certificate instead of browser fingerprint;
- added B11 phone presence/return evidence using enterprise enrolment/controller identity rather than raw MAC;
- added B12 late deep-audit evidence tying support-recovery initiation to Malcev's managed corporate device;
- exact 21:23 remains private canon but final asks for the fair-play interval after the live session and before digital staging;
- removed «locked from inside by electronic door» holding mechanism; physical restraint/injury is now the canonical constraint, with the door itself not serving as the trap;
- data motive refined from vague «anonymised metadata» to detailed event-level pseudonymized data that can be re-linked with additional booking/marketing data;
- progressive three-stage hint recovery added for the location bridge;
- onboarding reduced to immediate role-specific first actions, with Partner mechanics introduced just-in-time.

Adversarial QA №2:
- Investigator: PASS.
- Defence of culprit: PASS after B11+B12 close the Belov/remote-action alternative.
- Spoiler hunter: PASS.
- Stuck player: PASS with graduated hints.
- QA/abuse: PASS under role/scope/server-state contracts.
- New user onboarding: PASS after simplification.

Current quality:
- Adversarial QA №1: FAIL → fixed.
- Technical Fact-Check: PASS WITH CANON CHANGES.
- Adversarial QA №2: PASS.
- Fair-play graph: PASS.
- Cognitive Gate: NOT RUN.
- CASE_RELEASE_GATE: NOT RUN.
- DELIVERY_SELF_QA_CANON: NOT RUN.
- Content Freeze: NOT YET DECLARED.
- Premium UI / implementation: NOT STARTED.

New private checkpoint:
`/Mystery Logic/Checkpoints/MysteryLogic-Partner01-LastSession-CHECKPOINT-v0.7.md`
Library id: `libfile_9d4ae84995688191a10436eb57e04c1d`
SHA-256: `34509c8bdef7ef80444a31a8d756261403748ed919bc332757f61495fcf0ef34`

Next:
1. update exact evidence copy A01–A10 + B01–B12 to v0.7;
2. run DELIVERY_SELF_QA_CANON + Cognitive Gate;
3. if PASS → Content Freeze;
4. only then Premium visual architecture / room/workspace UX.


## 2026-10-09 — Evidence Copy + Pre-Freeze Gates

Private evidence copy A01–A10 / B01–B12 is now fully rewritten to v0.8 terminology and player-facing wording.

Pre-freeze results:
- DELIVERY_SELF_QA_CANON (content-level): PASS.
- Cognitive pre-freeze gate: PASS at simulated/content level.
- First Screen Clarity / Hook Gate: PASS.
- Progressive Vocabulary gate: PASS.
- Fair-play / minimum sufficient proof: PASS.
- WOW precheck: W1–W6, W8–W9 PASS; W7 and W10 remain HUMAN UNKNOWN.
- Content Freeze: HOLD, because this is intended as a flagship/signature Partner case and no real two-person blind test has yet been run.
- Premium UI: NOT STARTED.
- Implementation: NOT STARTED.

Current private checkpoint:
`/Mystery Logic/Checkpoints/MysteryLogic-Partner01-LastSession-CHECKPOINT-v0.8.md`
Library id: `libfile_2291989d816081918dcf0a2569f985dd`
SHA-256: `f5a25f884aa4204f38adcaf78edfb3703d48da66c9ca216cce83f1bb65c9931b`

Real blind-test packets prepared privately:
- Player A: `/Mystery Logic/Blind Tests/Last Session/LastSession-BLINDTEST-Player-A-v1.md`
- Player B: `/Mystery Logic/Blind Tests/Last Session/LastSession-BLINDTEST-Player-B-v1.md`
- Moderator: `/Mystery Logic/Blind Tests/Last Session/LastSession-BLINDTEST-Moderator-v1.md`

Exact next step:
run one real blind test with two players using ONLY these packets, capture literal observations and timing, then rerun W7/W10 + Cognitive gate and decide Content Freeze. Do not begin Premium UI/code before this unless the owner explicitly accepts the human-test UNKNOWN.


## 2026-10-09 — Local two-player blind-test demo

A real local two-player demo was built for human blind testing.

Artifact:
`MysteryLogic-LastSession-LOCAL-2PLAYER-DEMO-v1.zip`
SHA-256:
`08b28e5a0c61d5f357a7f36d6bc69d5e2536aa6186b4b489d23a37e319f466c9`

Characteristics:
- Python standard-library local server, no external dependencies;
- one room shared by two real browser clients;
- Player A / Player B role-bound permissions;
- separate private evidence scopes;
- staged unlocks;
- local canon-bounded free-text interrogation / analysis engine;
- explicit evidence transfer to partner;
- shared board;
- semantic Partner Sync checks;
- final reconstruction;
- room state persistence across refresh;
- LAN access for two devices on the same network;
- no LIVE / Supabase / payment / analytics writes.

QA:
- ZIP extraction: PASS;
- server startup: PASS;
- HTTP first screen: PASS;
- room creation: PASS;
- Player A join: PASS;
- Player B join: PASS;
- role action smoke tests: PASS.

This demo is for blind-test validation, not a production implementation and not evidence of Content Freeze.

Exact next step remains:
run one real two-person blind test, capture timing/theories/stalls/aha moments, then rerun W7/W10 and decide Content Freeze.
