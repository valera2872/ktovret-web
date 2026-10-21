# «Последняя сборка» — Web checkpoint

Дата: 2026-08-18

## Решение по платформе

На текущем этапе APK / Flutter-ветка «Последней сборки» заморожена. Разработка расширенного расследования продолжается в web-репозитории `valera2872/ktovret-web`.

Рабочая ветка:

- `feature/last-build-web-slice`
- draft PR #64

Лабораторный маршрут:

- `/ru/investigations/poslednyaya-sborka/`
- `noindex,follow`
- не включён в каталог
- не включён в sitemap

До ручного playthrough и отдельного решения продуктовой команды маршрут нельзя делать индексируемым или массово продвигать.

## Архитектурная изоляция

Существующий движок коротких дел:

- `ktovret-game/assets/app-core.js`

НЕ изменён.

Расширенные Mystery Logic investigations используют отдельный слой:

- `assets/investigations/investigation-core.js` — data-driven logic core;
- `assets/investigations/last-build.ru.js` — author truth / investigation graph для «Последней сборки»;
- `assets/investigations/last-build-presentation.js` — player-facing neutral proof copy;
- `assets/investigations/investigation-app.js` — workspace UI;
- `assets/investigations/investigation-fairplay.js` — pre-final audit, который не раскрывает правильного подозреваемого;
- `assets/investigations/investigation.css` — отдельный responsive visual layer.

Прогресс хранится локально в browser localStorage и не пересекается с прогрессом 100 коротких дел.

## Основной игровой контракт

Интерфейс должен быть очевидным. Расследование не должно быть очевидным.

Основной цикл:

`fact → earned investigative action → new evidence → revised state/hypothesis → test`

Запрещено превращать дело в:

- последовательность Next;
- список этапов «сначала проверь это, потом это»;
- подсказку правильного подозреваемого через названия proof blocks;
- автоматическую финальную цепочку из всех найденных фактов.

## Текущий workspace

Desktop-first:

- Досье
- Материалы
- Люди
- Версия
- правый компактный desk-status на широком экране

На mobile интерфейс сворачивается в верхнюю навигацию и одноколоночный workspace.

## Материалы и маршруты

В деле реализованы параллельные направления:

1. Физический доступ:
   - вечерний access log;
   - T-17;
   - ручной возврат;
   - RK-Pixel;
   - повторный опрос Алины / Романа.

2. Учётная запись Тимура:
   - `t.vlasov` в delete audit;
   - фактический выход Тимура;
   - negative remote-access check;
   - открытая локальная сессия DEMO-04;
   - NIGHTSAFE;
   - повторный опрос Тимура.

3. Копирование:
   - ASTER-64 / A64-7731;
   - copy before delete;
   - prior appearance on GUEST-02;
   - GUEST-02 issued to Roman.

4. Предшествующая утечка / умысел:
   - R-03 виден в раннем материале;
   - review-build registry;
   - NordLight compliance;
   - clean final build promise before 22:00.

5. Павел / судьба проекта:
   - его возвращение после ухода T-17;
   - ORBIT-2;
   - NIGHTSAFE → ORBIT checksum match;
   - цифровой депозит у нотариуса «Контур».

## Финальная версия

В отличие от раннего mobile functional slice, web-финал требует ручной сборки доказательств.

Игрок:

1. выбирает предполагаемого исполнителя;
2. видит нейтральные причинные звенья;
3. к каждому звену прикладывает только материалы, которые реально открыл;
4. может проверить полноту конструкции;
5. только при итоговом предъявлении движок сопоставляет личность и доказательства с author truth.

До итогового предъявления интерфейс НЕ сообщает, выбран ли правильный подозреваемый.

Player-facing core proof labels:

- «Физическое присутствие»;
- «Почему журнал показывает t.vlasov?»;
- «Кто контролировал носитель с копией?»;
- «Предварительный умысел».

Secondary reconstruction:

- «Что скрывала Алина?»;
- «Что скрывал Тимур?»;
- «Что произошло после 21:02?».

Результаты:

- S — полная реконструкция;
- A — исполнитель доказан, вторичные обстоятельства неполны;
- B — выбран канонический исполнитель, но предъявленная доказательная конструкция имеет критический разрыв;
- C — неверный исполнитель.

## Fair-play ограничения

Внутренняя author truth может содержать `roman` и точные proof requirements.

Player-facing интерфейс не должен:

- писать «Роман физически присутствовал» как задачу;
- маркировать правильные материалы до предъявления;
- сообщать, что выбранная фамилия верна, через pre-final audit;
- выделять «следующий правильный» investigative action.

CI отдельно проверяет, что player-facing proof copy не содержит подсказки на Романа.

## Проверки

Workflow:

- `.github/workflows/advanced-investigation.yml`

Проверяет:

- JS syntax;
- отсутствие dangling graph references;
- достижимость всех материалов;
- полный exploration graph;
- возможность вручную собрать proof families;
- достижимость S;
- C для wrong suspect;
- theory-neutral player-facing proof copy;
- mobile Chrome render 390×844;
- desktop Chrome render 1440×1100;
- `noindex` laboratory boundary;
- отсутствие дела в sitemap/catalog.

На контрольной точке 2026-08-18 advanced-investigation CI зелёный.

## Старые CI-проблемы репозитория

Не смешивать их с разработкой «Последней сборки» без отдельной необходимости.

Общий Pages CI сейчас может падать на существующей paid-access проверке:

- `alibi_r2_008_clock_correction needs paid gateway marker`.

Legal workflow может падать на существующей странице:

- `personal-data-consent/index.html missing отдельной отметки`.

Новый advanced-investigation слой этих файлов и подсистем не меняет.

## Что ещё НЕ сделано

- ручной пользовательский playthrough в опубликованном браузерном preview;
- production/catalog integration;
- SEO-страница для расширенного кейса;
- premium evidence renderers;
- фото/портреты;
- мультимедиа;
- аналитика advanced investigation funnel;
- серверная синхронизация прогресса;
- AI interrogation.

## Следующий рекомендуемый slice

После functional web core:

1. дать реальный browser preview для ручного прохождения;
2. исправить найденные UX-проблемы ручного playthrough;
3. затем добавить reusable premium evidence renderers для:
   - message/chat;
   - access log;
   - endpoint/system audit;
   - receipt;
   - registry;
   - email/compliance;
4. только после этого создавать дорогие изображения: офис, персонажи, отдельные визуальные улики.

Не начинать с декоративных картинок до подтверждения, что расследование интересно проходить в браузере.
