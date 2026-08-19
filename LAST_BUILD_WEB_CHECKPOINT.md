# «Последняя сборка» — web checkpoint

Дата: 2026-08-19
Ветка: `feature/last-build-web-slice`
PR: #64 — `Mystery Logic: Last Build web functional slice`
Статус: draft; web `0.3.1`, APK/Flutter заморожен.

## WORK HANDOFF — читать первым

Этот файл — основная контрольная точка для продолжения проекта в ChatGPT Work.

Новый Work НЕ должен восстанавливать состояние по старым чатам и НЕ должен начинать проектирование заново. Сначала:

1. прочитать этот файл целиком;
2. открыть PR #64 и текущую ветку `feature/last-build-web-slice`;
3. считать текущий web engine и scenario graph рабочей базой;
4. продолжать только от текущего live lab preview;
5. любые изменения сюжета делать только при обнаруженной доказательной/психологической дыре или после ручного playthrough.

Текущий safe lab preview:

`https://valera2872.github.io/ktovret-web/ru/investigations/poslednyaya-sborka/`

Preview опубликован GitHub Pages workflow `Deploy Last Build lab preview` успешно. Первое подтверждённое успешное развертывание — commit `c8b10eb8b564fe17842dcef117ef5b651239e572`.

Production `mysterylogic.com`, Beget, Supabase, платежи и обычные 100 дел этим preview не затронуты.

### Точный следующий шаг для Work

Ручной product playthrough от cold open до результата S проведён 2026-08-18. Подтверждённый friction исправлен четырьмя A-правками версии `0.2.10`:

1. результат проверки или повторного опроса сразу открывается как материал;
2. proof-board больше не закрывает раскрытое звено после каждого выбора доказательства;
3. новые материалы показываются первыми, изученные убраны в сворачиваемый архив;
4. существующий журнал GUEST-02 теперь явно фиксирует ASTER-64 / A64-7731 как личное устройство выданного посетителя, не добавляя новую улику или новую сюжетную ветку.

`0.2.10` опубликована и подтверждена целевыми workflow и live preview. В `0.2.11` добавлен high-reuse art pack: утренний офис и четыре психологически нейтральных портрета. Офис повторно используется в cold open и осмотре места; портреты — в досье, выборе версии, первичных показаниях и повторных опросах.

`0.2.11` опубликована в feature-ветку и подтверждена mobile/desktop smoke QA и live browser review. В `0.3.0` добавлен B-пилот: свободный допрос Романа внутри жёсткой author truth, без генерации фактов или реплик дела.

`0.3.0` опубликована в feature-ветку коммитом `6af85fa62b0e84d03b3a2d27aaef2c4721baa083`. `Validate advanced investigations` и `Deploy Last Build lab preview` — SUCCESS. Live browser review подтвердил: портрет Романа сохранён, панель и три примера вопросов отображаются, свободный вопрос возвращает существующий авторский материал.

`0.3.1` добавляет воспроизводимый clean-state маршрут «исходная ложь → заслуженное признание возвращения → ASTER ещё не доказан → ASTER доказан» и authored eval из 45 русских вопросов. Локальный классификатор проходит 45/45, включая неизвестные вопросы и prompt injection; серверный fallback использует тот же словарь. Изменение опубликовано коммитом `d358d202e40a1463ef04f5088cd0229a9a159152`: оба целевых workflow — SUCCESS, live browser review подтвердил правильную авторскую реплику во всех четырёх состояниях. Remote semantic classifier остаётся выключен до отдельного eval его точности, injection-устойчивости, задержки и стоимости.

Следующий шаг: расширить eval естественными перефразировками из ручного теста и только затем решать, даёт ли remote semantic classifier заметный игроку эффект относительно бесплатного локального fallback.

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

### Strict free-form interrogation · Roman pilot

`0.3.0` добавляет свободный текстовый допрос Романа в карточке персонажа.

Граница авторской истины:
- классификатор может выбрать только одну авторскую тему;
- текст лжи, уклонения или признания хранится в сценарном контракте, а не генерируется;
- новые факты появляются только через уже существующие `confront-roman-presence` и `confront-roman-aster`;
- без достаточной совокупности улик Роман сохраняет ложь или уклоняется;
- неизвестная тема, ошибка API или prompt injection не меняют state дела.

Live preview использует `classifierMode: 'local'`: механика работает мгновенно, без API-ключа, сетевой задержки и стоимости. `supabase/functions/interrogate-character/` готовит optional semantic classifier со strict topic enum и server-only secrets, но не включается до eval.

`0.3.1` фиксирует QA-контракт этой механики:
- четыре детерминированных preview-state без ручной подготовки localStorage;
- browser smoke проверяет соответствующую авторскую реплику в каждом состоянии;
- набор из 45 вопросов проверяет все семь тем, неизвестные вопросы и injection-команды;
- client и Edge Function fallback используют синхронный словарь тем.

## QA

Workflow: `.github/workflows/advanced-investigation.yml`.

На контрольной точке перед переходом в Work workflow полностью SUCCESS, включая:
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
- analytics layer;
- noindex и отсутствие дела в sitemap/catalog.

Lab-only QA helpers:
- `?previewEvidence=<material-id>`;
- `?previewResult=S|A|B|C`.
- `?previewInterrogation=initial|presence-ready|aster-blocked|aster-ready`.

## Safe manual preview

Workflow: `.github/workflows/last-build-preview.yml`.

Он повторно валидирует advanced investigation и публикует feature-ветку только в GitHub Pages staging. `mysterylogic.com`, Beget production, Supabase и платежи не затрагиваются.

Первый вариант workflow зависал на GitHub Environment approval. Environment-gate для лабораторного preview убран; production workflows не менялись.

Текущий статус `0.3.1`: **validate SUCCESS + deploy-preview SUCCESS + live browser review SUCCESS**. Проверены арт-слой, strict interrogation pilot, четыре gated-состояния и authored eval 45/45.

Live URL:

`https://valera2872.github.io/ktovret-web/ru/investigations/poslednyaya-sborka/`

## Mystery Logic quality standard — обязателен

При любых следующих правках использовать конкурентный quality gate как постоянную систему проверки:

- True Crime Games / Last Ascent — премиальность, глубина, ощущение законченного большого расследования;
- ProfileDetective — достоверность материалов, мультимедиа, психологическая неоднозначность;
- Saint Twins / Home Detective — свобода расследования, выбор маршрутов, низкий порог входа;
- Rassledovanie.online — свободный AI-допрос в будущем, но только внутри жёсткой author truth;
- Kodgoroda — ощущение живого мира без необходимости строить огромный дорогой мир;
- Dramtezi — быстрый web-start, ветвление последствий и web/SEO-практичность.

Основная формула Mystery Logic:

**психологически убедительная история + ощущение настоящего расследования + свобода действий + качественные цифровые доказательства + минимум технического трения.**

Правило стоимости:
- A — дёшево и сильно улучшает: делать;
- B — заметно улучшает, но требует работы: выбирать лучшие;
- C — дорого/сложно: не делать, если тот же эффект можно получить проще.

Не копировать механику конкурента ради механики. Всегда оценивать, что именно должен почувствовать игрок и можно ли получить этот эффект дешевле.

### Конкурентный gate после `0.2.11`

- **Что уже нельзя потерять:** одна доказуемая истина, независимые маршруты, психологически мотивированная ложь, ручной proof-board и персональный debrief.
- **Что стало ближе к Last Ascent / ProfileDetective:** холодное открытие и осмотр места теперь используют одну документальную сцену; четыре портрета проходят через все основные поверхности досье и дают персонажам конкретность без кодирования виновника.
- **Где остаётся разрыв:** объём мультимедиа и материальная вариативность всё ещё ниже лидеров, но добавление видео/3D сейчас не окупает разработку.
- **B — реализовано:** пять high-reuse WebP-материалов общим весом около 152 КБ; эффект большого дела достигается повторным использованием, а не ростом механик.
- **C — не делать:** отдельные видео, 3D-офис, большая карта и уникальные портретные состояния. Нужное ощущение уже получено значительно дешевле.

## Канон расследования — не переписывать автоматически

Сохранять:
- «лгут все, виновен один»;
- Алина скрывает нарушение с T-17;
- Тимур скрывает открытую сессию и NIGHTSAFE;
- Роман — единственный сознательный исполнитель кражи/передачи;
- `t.vlasov` — честный ложный след;
- T-17 + RK-Pixel — независимая presence constellation;
- ASTER — средство копирования;
- R-03 — ранний след с поздним переосмыслением;
- NIGHTSAFE — улика, меняющая значение и спасающая проект;
- Павел возвращается после преступления, восстанавливает сборку на ORBIT-2;
- финал — proof graph, а не выбор фамилии.

Интерфейс должен быть очевидным; расследование не должно быть очевидным.

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
- не разрешать модели генерировать факты или реплики дела;
- не включать remote semantic classifier до eval точности, injection и стоимости;
- не делать видео/3D/multiplayer;
- не публиковать дело в каталог до ручного прохождения;
- не создавать второй evidence renderer — единый reusable layer уже существует.

## Следующий production step

1. Ручной playthrough, friction log и A-правки — выполнено в `0.2.10`.
2. High-reuse art и browser QA — выполнено в `0.2.11`.
3. CI и live QA strict Roman interrogation `0.3.0`.
4. Ручной маршрут: ложь без улик → earned presence admission → blocked/earned ASTER response.
5. Eval semantic classifier на авторском наборе вопросов; только затем решать, включать ли remote mode.
6. Controlled publication decision: lab-only, ограниченный внешний тест или каталогизация.
