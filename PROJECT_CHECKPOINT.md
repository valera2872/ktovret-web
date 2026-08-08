# Mystery Logic / «Кто врёт?» — контрольная точка

Дата фиксации: 2026-08-08

Этот файл — точка восстановления контекста для продолжения разработки в новом чате. Перед любыми изменениями сначала прочитать его и сверить актуальный `main`.

## 1. Репозитории и публикация

- Web repo: `valera2872/ktovret-web`
- Mobile/source repo: `valera2872/ktovret`
- Pinned mobile source commit: `51c178f4dceba7bdb859e1e5d0c3244150438c0d`
- Текущий staging: `https://valera2872.github.io/ktovret-web/`
- Будущий production-domain: `https://mysterylogic.com/`
- GitHub Pages deploy от connector merge часто НЕ стартует автоматически. Рабочая схема: после merge пользователь вручную запускает `Actions → Validate and deploy Mystery Logic web → Run workflow → main`, затем сообщает «зелёный».

## 2. Текущая web-версия

Последняя слитая версия: **1.10.1**

Последний merge:
- PR #37 — `web 1.10.1: connect live Mystery Logic paid backend`
- merge commit: `e883a7b7b5725e297bbd3ffa63e4896d45f96766`
- CI #166: SUCCESS
- CI #165 ранее падал только из-за устаревшей строки ожидания в wrapper-тесте (`1.10` vs `1.10.1`), а не из-за backend/security; исправлено.

До этого:
- PR #36 / 1.10 — protected paid access boundary
- merge commit `1fdf4e8557002b72cff86a964374990991ccad63`
- CI #162: SUCCESS

## 3. Библиотека дел

Активная библиотека:
- 100 дел всего
- 15 бесплатных
- 85 платных
- deprecated/mobile editorial records фильтруются тем же правилом, что в mobile source

CI 1.5 подтвердил:
- 100/100 исходных дел валидны
- 100/100 editorial web conversion валидна
- public build = 15 playable + 85 locked

Важно: платные тексты/ответы НЕ должны попадать в статический GitHub Pages build.

## 4. SEO-native архитектура

Реализовано:
- `Case` — универсальная сущность дела
- `Collection` — подборка
- один общий Game Engine (`ktovret-game/assets/app-core.js`)
- SEO layer — server-generated/static HTML + canonical + sitemap + OG + hreflang foundation + перелинковка

Все 15 бесплатных дел имеют SEO-native URL:
- `/ru/cases/{slug}/`

Legacy URL:
- `/delo/{slug}/`
- для SEO-native free дел остаются рабочими, но `noindex,follow` + canonical на `/ru/cases/.../`

Первая реальная индексируемая collection:
- `/ru/besplatnye-detektivnye-dela/`

Sitemap после 1.8: 23 indexable URLs.

После прохождения дела есть:
- следующее дело
- 2 похожих дела
- ссылка на бесплатную коллекцию
- ссылка на каталог

## 5. Production SEO origin

Версия 1.9 ввела единый origin config.

Пока staging origin — GitHub Pages. При переходе на `mysterylogic.com` меняется одна настройка, после чего canonical/sitemap/robots должны переехать вместе.

Есть smoke-test, который останавливает production build, если после смены origin остаётся staging URL.

Не переключать origin на `mysterylogic.com`, пока домен реально не подключён в DNS/GitHub Pages.

## 6. Supabase backend для 85 платных дел

Создан отдельный Supabase project:
- name: `mystery-logic`
- project id/ref: `orknvuwknvsedjgqcfwc`
- region: `eu-west-1`
- status на момент фиксации: `ACTIVE_HEALTHY`

НЕ использовать проект `supervision-pocket` для этого продукта.

Project URL:
- `https://orknvuwknvsedjgqcfwc.supabase.co`

Live Edge Function:
- `case-access`
- endpoint: `https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/case-access`

`assets/paid-access-config.js` в web 1.10.1 уже указывает на этот endpoint.

Checkout пока выключен:
- `checkoutUrl: ''`

То есть backend активен, но продажа ещё не включена.

## 7. Database schema / security

Применена migration:
- `supabase/migrations/20260808181000_paid_access.sql`

Таблицы:
- `public.paid_case_payloads`
- `public.access_entitlements`

Security:
- RLS enabled
- anon/authenticated не имеют прямого доступа к таблицам
- service-role используется только внутри Edge Function/server tooling
- browser получает только opaque bearer token
- в БД хранится SHA-256 hash токена, а не исходный токен
- response paid case: `Cache-Control: private, no-store, max-age=0`

Product entitlement сейчас:
- `volume1`

## 8. Платные payload

В Supabase загружены ровно **85/85** платных case payload.

Проверено запросом в БД:
- total = 85
- volume1 = 85
- published = 85
- complete_shape = 85

Payload содержит тот же игровой config, что нужен Game Engine:
- timeline/facts
- отдельные characters/statements
- answerStages
- correct answer ids
- full explanation/reasoning

Эти payload НЕ находятся в публичном web repo/static pages.

Secure-export локально/в CI:
- `.secure-backend/`
- gitignored

## 9. Seed/import платных дел

Для первоначального импорта использовалась одноразовая Edge Function `seed-paid-cases`.

После загрузки 85 payload seed был отключён/переведён в защищённое состояние. Не использовать его как постоянный публичный API.

Для seed временно включалось PostgreSQL extension `http`; после завершения импорта extension удалено. На момент фиксации `http_installed = false`.

## 10. End-to-end backend validation

Проведён реальный тест:

`opaque token → SHA-256 → access_entitlements(volume1) → case-access → paid_case_payloads → HTTP 200 → полный KtoVretWeb config`

Тестовое платное дело:
- id: `alibi_r2_008_clock_correction`
- title: `Две камеры с поправкой`
- №016

Server response реально вернул:
- HTTP 200
- correct case id
- 3 characters: Алина / Павел / Роман
- answer stages
- explanation

Тестовый entitlement, использованный для server-side smoke, был удалён после проверки.

## 11. Текущий live user-test

После deploy 1.10.1 пользователь сообщил `зелёный`.

Создан отдельный ВРЕМЕННЫЙ live-test entitlement для проверки через опубликованный браузер.

Важно:
- сам test token намеренно НЕ записан в этот checkpoint и НЕ должен коммититься в GitHub
- token был выдан пользователю в чате
- entitlement должен быть удалён после пользовательского подтверждения
- если новый чат начался после истечения ключа, просто создать новый temporary entitlement; не пытаться восстановить старый token

Тестовая цель на сайте:
- дело №016 `Две камеры с поправкой`
- ожидаемый legacy URL: `/delo/016-dve-kamery-s-popravkoy/`

Пользователь должен проверить:
1. ввод ключа
2. `Открыть купленное дело`
3. paywall исчезает
4. загружается само дело
5. видны отдельные показания Алины / Павла / Романа
6. можно выбрать неверный/правильный ответ
7. после правильного ответа открывается полный разбор

После сообщения пользователя `работает`:
- удалить temporary entitlement из `access_entitlements`
- зафиксировать paid access E2E как принятый

## 12. Browser paid-access architecture

Files:
- `assets/paid-access-config.js`
- `assets/paid-access-client.js`
- `assets/paid-access.css`
- `tools/import-mobile/paid-access-postprocess.mjs`

Public 85 locked pages:
- содержат только metadata/paywall/gateway
- НЕ содержат `window.KtoVretWeb`
- НЕ содержат paid story/statements/correct answer/explanation

При действующем token:
- browser делает GET `case-access?case_id=...`
- Authorization: `Bearer <opaque token>`
- получает `config`
- создаёт обычный `.ktv-game-shell`
- запускает тот же Game Engine
- witness UI 1.3 и mobile scroll fix 1.4.1 сохраняются

Free 15 cases не зависят от backend и играются напрямую без регистрации.

## 13. Аналитические события

Заложены:
- `case_view`
- `case_started`
- `answer_selected`
- `answer_correct`
- `answer_wrong`
- `case_completed`
- `next_case_clicked`
- `paywall_viewed`
- `purchase_started`

Целевая воронка:
`organic entry → case_view → case_started → case_completed → second case → paywall → purchase_started`

## 14. Что НЕ делать

- Не менять `app-core.js` без реальной необходимости.
- Не публиковать 85 paid payload в GitHub Pages/repo.
- Не переносить paid backend в `supervision-pocket`.
- Не включать checkout раньше, чем готова payment/webhook/entitlement issuance цепочка.
- Не коммитить реальные access tokens, service-role keys или payment secrets.
- Не удалять legacy `/delo/.../` URL без миграционного плана.
- Не переключать canonical origin на `mysterylogic.com`, пока домен фактически не подключён.

## 15. Следующий этап после live test

Если пользователь подтверждает, что платное дело реально открывается на опубликованном сайте:

### 1.11 — payment issuance

Цель:
`ЮKassa → подтверждённый webhook → entitlement → opaque access token → пользователь получает полный volume1`

Нужно реализовать:
1. payment/session creation endpoint
2. ЮKassa webhook с обязательной серверной верификацией
3. idempotency по payment reference
4. создание `access_entitlements`
5. генерацию криптографически случайного opaque token
6. безопасную передачу token покупателю после подтверждённой оплаты
7. restore/recovery flow (например по email/receipt, без хранения plaintext email если не нужен)
8. refund → entitlement status `refunded/revoked`
9. `purchase_started` / purchase completed analytics
10. только после этого заполнить `checkoutUrl` / включить кнопку покупки

Перед интеграцией ЮKassa проверить актуальную API/webhook документацию и реальные реквизиты/credentials пользователя. Секреты никогда не коммитить.

## 16. Основные контрольные версии

- 1.2.3 — robust premium dossier layout
- 1.3 — separate witness UI
- 1.4 — game cycle polish
- 1.4.1 — mobile scroll stabilization
- 1.5 — 100-case QA/editorial validation
- 1.6 — catalog command center/navigation
- 1.7 — first SEO-native pilot
- 1.8 — all 15 free SEO-native + first real collection
- 1.9 — production origin abstraction
- 1.10 — protected paid access boundary
- 1.10.1 — live Supabase paid backend connection

## 17. Как продолжать в новом чате

Пользователь может написать:

> Продолжаем «Кто врёт?». Прочитай `PROJECT_CHECKPOINT.md` в `valera2872/ktovret-web` и продолжай с текущей точки.

После чтения checkpoint обязательно сверить `main`, Supabase state и последний CI перед любыми writes.
