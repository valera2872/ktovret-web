# «Последняя сборка» — web checkpoint

Дата: 2026-08-18
Ветка: `feature/last-build-web-slice`
PR: #64 — `Mystery Logic: Last Build web functional slice`
Статус: draft; разработка только web, APK/Flutter заморожен.

## Продуктовое решение

«Последняя сборка» развивается в `valera2872/ktovret-web` как отдельный reusable advanced-investigation engine внутри Mystery Logic.

Не изменены:
- обычный движок 100 коротких дел `ktovret-game/assets/app-core.js`;
- Supabase paid-access;
- YooKassa/payment orchestration;
- APK/Flutter.

Лабораторный маршрут:
`/ru/investigations/poslednyaya-sborka/`

До ручного product playthrough маршрут остаётся `noindex,follow`, вне sitemap и каталога.

## Что уже работает

### Investigation engine
- data-driven facts/materials/actions;
- earned actions из фактических предпосылок;
- нелинейные линии доступа, Timur/session, USB/ASTER, R-03/NordLight, Pavel/NIGHTSAFE;
- отрицательные проверки;
- localStorage progress;
- рабочая гипотеза и история смен подозреваемого;
- proof-board с ручным приложением реально просмотренных материалов;
- S/A/B/C final evaluation;
- pre-final audit не подтверждает правильность выбранной фамилии;
- B-result не подтверждает, что игрок угадал виновного.

### Premium evidence layer
Reusable renderers уже реализованы:
- messenger;
- receipt + message context;
- terminal / endpoint audit;
- access-control log;
- registry;
- interview correction;
- pseudo web page;
- review screenshot;
- email / external correspondence;
- hash comparison;
- official document;
- office scene;
- statement cards.

`last-build-evidence.js` задаёт presentation-data, `evidence-renderers.js` рисует носитель. Логика доказательств отделена от presentation.

### Human layer
Supporting-materials без single-clue chokepoint:
1. Алина ↔ Роман о T-17;
2. Павел ↔ Тимур о резервных копиях;
3. деловой контекст Романа перед презентацией.

### Statement history / timeline / open questions
- опровергнутые показания остаются зачёркнутыми;
- у Тимура есть промежуточное состояние до признания NIGHTSAFE;
- timeline строится только из literal facts;
- после R-03 timeline расширяется назад к 15 октября;
- открытые вопросы появляются из противоречий и исчезают после разрешения;
- интерфейс не превращает вопросы в список «следующих правильных действий».

### Cold open
Чистый старт: сообщение Павла 21:27 → состояние офиса утром → название дела → «Начать расследование».
При сохранённом прогрессе интро не повторяется. QA preview-параметры его обходят.

### Personalized debrief
Canonical reconstruction раскрывается только на S/A. B/C не получают truth dump.

S/A debrief показывает:
- настоящую причинную хронологию;
- почему лгали Алина / Тимур / Роман;
- переосмысление R-03, NIGHTSAFE, t.vlasov и чека «Порт»;
- первую и итоговую гипотезу игрока;
- смены версии;
- изменившиеся показания;
- пропущенные материалы.

### Investigation analytics
Добавлен `assets/investigations/investigation-analytics.js`.
Он не отправляет тексты показаний/документов и не собирает персональные данные игрока. Передаются только технические ID и агрегаты процесса.

События:
- `investigation_view`;
- `investigation_started`;
- `investigation_material_opened`;
- `investigation_action_performed`;
- `investigation_statement_changed`;
- `investigation_hypothesis_changed`;
- `investigation_theory_audited`;
- `investigation_completed` с result tier S/A/B/C.

QA URL `previewEvidence` / `previewResult` намеренно не отправляют эти события.

## QA

Workflow: `.github/workflows/advanced-investigation.yml`.

Проверяет:
- JS syntax;
- graph references;
- достижимость всех материалов;
- convergence полного exploration;
- manual proof assembly -> S;
- wrong suspect -> C;
- theory-neutral player copy;
- earned question lifecycle;
- progressive timeline;
- statement history;
- cold-open fresh/resume;
- S/A vs B/C debrief boundary;
- mobile Chrome 390×844;
- desktop Chrome 1440×1100;
- premium evidence renderers;
- S final + rich debrief;
- B final без truth reveal;
- наличие analytics layer;
- noindex и отсутствие дела в sitemap/catalog.

Lab-only QA helpers:
- `?previewEvidence=<material-id>`;
- `?previewResult=S|A|B|C`.

## Safe manual preview

Workflow: `.github/workflows/last-build-preview.yml`.

Он повторно валидирует advanced investigation и публикует feature-ветку только в GitHub Pages staging. `mysterylogic.com`, Beget production, Supabase и платежи не затрагиваются.

Первый вариант workflow зависал на GitHub Environment approval (`github-pages`). Environment-gate для лабораторного preview убран; production Pages/Beget workflows не менялись. Текущий deploy нужно считать готовым только после фактического успешного run и появления preview URL в PR #64.

## Известные внешние проблемы repo CI

Не относятся к advanced engine:
- paid-access boundary для `alibi_r2_008_clock_correction` после генерации из pinned mobile source;
- legal test `personal-data-consent/index.html`.

Не смешивать их с «Последней сборкой» без необходимости.

## Не делать сейчас

- не возвращаться к APK;
- не переписывать сюжет;
- не добавлять улики ради объёма;
- не добавлять карту без географической дедукции;
- не включать AI interrogation до ручной проверки web-flow;
- не делать видео/3D/multiplayer;
- не публиковать дело в каталог до ручного прохождения.

## Следующий production step

1. Получить работающий lab preview URL.
2. Пройти дело человеком от cold open до финала и записать friction: где непонятно, где слишком явно, где скучно, где действие не ощущается следственным.
3. Исправить только подтверждённый UX/deduction friction.
4. После этого добавить дорогие high-reuse art-assets: реальное утреннее фото офиса и 4 портрета.
5. Затем решить controlled publication boundary и только после устойчивого web-flow возвращаться к AI interrogation как B-upgrade.
