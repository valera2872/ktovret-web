# «Последняя сборка» — web checkpoint

Дата: 2026-08-18
Ветка: `feature/last-build-web-slice`
PR: #64 — `Mystery Logic: Last Build web functional slice`
Статус: draft, advanced-investigation CI GREEN.

## Продуктовое решение

APK / Flutter на этом этапе заморожен. Развитие «Последней сборки» идёт в `valera2872/ktovret-web` как отдельный reusable advanced-investigation engine внутри Mystery Logic.

Обычный движок 100 дел `ktovret-game/assets/app-core.js`, Supabase paid-access и платёжный слой не менялись.

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
Reusable renderers:
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

`last-build-evidence.js` задаёт presentation-data, а `evidence-renderers.js` рисует носитель. Логика доказательств от визуального представления отделена.

### Human layer
Добавлены три дешёвых supporting-materials, не являющиеся chokepoint:
1. Алина ↔ Роман о T-17;
2. Павел ↔ Тимур о резервных копиях;
3. деловой контекст Романа перед презентацией.

### Statement history
После фактического опровержения старое показание не исчезает: остаётся зачёркнутым как изменённая версия. Для Тимура поддерживается промежуточное состояние и отдельное позднее признание NIGHTSAFE.

### Progressive timeline
Timeline строится только из уже установленных literal facts. После раскрытия R-03 временная линия расширяется назад к 15 октября. Timeline не пишет выводы и не связывает события с виновностью.

### Earned open questions
Вопросы появляются из уже найденного противоречия и исчезают после его фактического разрешения. Это не quest-log и не список следующих действий.

Примеры:
- кто мог действовать под `t.vlasov` после ухода Тимура;
- кто воспользовался T-17;
- что означает R-03;
- зачем удалить RELEASE после завершения копирования;
- откуда взялась полная сборка на ORBIT-2.

### Cold open
Новый игрок почти сразу видит:
- сообщение Павла 21:27;
- утреннее состояние офиса;
- название дела;
- кнопку «Начать расследование».

Cold open показывается только для чистого старта. При сохранённом прогрессе не повторяется. QA previews его обходят.

### Personalized debrief
Полная реконструкция раскрывается только на S/A.
B/C не получают canonical truth dump.

S/A debrief показывает:
- настоящую причинную хронологию;
- почему лгали Алина / Тимур / Роман;
- второе значение R-03, NIGHTSAFE, t.vlasov и чека «Порт»;
- первую и итоговую рабочую версию игрока;
- количество смен версии;
- чьи показания удалось изменить;
- пропущенные материалы.

Старый generic truth wall при наличии rich debrief убирается.

## QA

Отдельный workflow: `.github/workflows/advanced-investigation.yml`.

На текущей контрольной точке SUCCESS:
- JS syntax;
- graph references;
- все материалы достижимы;
- full exploration converges;
- manual proof assembly достигает S;
- wrong suspect -> C;
- fair-play player copy не выдаёт Романа;
- earned question lifecycle;
- progressive timeline / R-03 backwards expansion;
- statement history;
- cold-open fresh/resume rules;
- debrief S/A vs B/C reveal boundary;
- mobile Chrome 390×844;
- desktop Chrome 1440×1100;
- premium receipt renderer;
- terminal renderer;
- pseudo-web renderer;
- S final + rich debrief in Chrome;
- B final without truth reveal in Chrome;
- lab page remains noindex and outside sitemap/catalog.

Lab-only QA helpers:
- `?previewEvidence=<material-id>`;
- `?previewResult=S|A|B|C`.
They are not player mechanics.

## Известные внешние проблемы repo CI

Общие workflows репозитория всё ещё могут быть красными по старым, не связанным с advanced engine причинам:
- paid-access boundary для `alibi_r2_008_clock_correction` после генерации из pinned mobile source;
- legal test `personal-data-consent/index.html` (требование отдельной отметки).

Не смешивать эти задачи с «Последней сборкой» без необходимости.

## Что НЕ делать следующим шагом

- не возвращаться к APK;
- не переписывать сюжет;
- не добавлять новые улики ради объёма;
- не делать карту для этого дела без географической дедукции;
- не включать AI interrogation до ручной проверки базового web-flow;
- не добавлять видео, 3D или multiplayer;
- не сливать лабораторный маршрут в публичный каталог до ручного прохождения.

## Следующий production step

1. Получить безопасный ручной browser preview / пройти дело человеком от холодного открытия до финала.
2. По результату исправить только UX/deduction friction.
3. После этого добавить финальные art-assets с высокой reuse value: прежде всего реальное изображение утреннего офиса и четыре портрета.
4. Затем решить publication boundary: merge/noindex staging -> controlled public launch.
5. Только после устойчивого web-flow рассматривать AI interrogation как B-upgrade.
