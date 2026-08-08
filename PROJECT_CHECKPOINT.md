# Mystery Logic / «Кто врёт?» — контрольная точка

Дата фиксации: 2026-08-08

Этот файл — точка восстановления контекста. В новом чате сначала прочитать его, затем сверить актуальные `main`, Supabase и последний CI.

## 1. Репозитории и публикация

- Web: `valera2872/ktovret-web`
- Mobile/source: `valera2872/ktovret`
- Pinned mobile source commit: `51c178f4dceba7bdb859e1e5d0c3244150438c0d`
- Staging: `https://valera2872.github.io/ktovret-web/`
- Будущий production: `https://mysterylogic.com/`
- Pages после connector-merge часто требует ручного запуска: `Actions → Validate and deploy Mystery Logic web → Run workflow → main`.

## 2. Текущая web-версия

Последняя слитая версия: **1.11.0**.

Последний product merge:
- PR #38 — `web 1.11: add YooKassa payment orchestration`
- merge commit: `a09fdd004de1bd7566c72db5f04a61b7fd6c2a91`
- PR CI #171: SUCCESS

До этого:
- 1.10.1 / PR #37 — live Supabase paid backend connection
- 1.10 / PR #36 — protected paid-access boundary

`app-core.js` в 1.10/1.10.1/1.11 не менялся.

## 3. Библиотека и Game Engine

- 100 активных дел
- 15 бесплатных
- 85 платных
- Public build: 15 playable + 85 locked
- Editorial/CI build: 100 playable, но не публикуется
- Один общий Game Engine: `ktovret-game/assets/app-core.js`
- Платные тексты/ответы/объяснения НЕ должны попадать в GitHub Pages или public repo.

## 4. SEO-native архитектура

Реализовано:
- `Case`
- `Collection`
- единый Game Engine
- SEO layer: статический индексируемый HTML + canonical + sitemap + OG + hreflang foundation + перелинковка

Все 15 бесплатных дел:
- `/ru/cases/{slug}/`

Legacy URL:
- `/delo/{slug}/`
- для free SEO-native страниц: `noindex,follow` + canonical на новый URL

Первая индексируемая collection:
- `/ru/besplatnye-detektivnye-dela/`

Sitemap: 23 indexable URL.

Production origin абстрагирован в 1.9. Не переключать canonical на `mysterylogic.com`, пока домен фактически не подключён.

## 5. Supabase Mystery Logic

Использовать только этот проект:
- name: `mystery-logic`
- project id/ref: `orknvuwknvsedjgqcfwc`
- region: `eu-west-1`
- URL: `https://orknvuwknvsedjgqcfwc.supabase.co`

НЕ использовать `supervision-pocket`.

## 6. Защищённые 85 платных дел

В Supabase есть ровно 85/85 paid payload:
- table: `public.paid_case_payloads`
- entitlement table: `public.access_entitlements`
- product id: `volume1`

Edge Function:
- `case-access`
- `https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/case-access`

Security:
- RLS enabled
- нет anon/authenticated policies
- service role только server-side
- browser передаёт opaque bearer token
- в БД хранится только SHA-256 token hash
- paid response: `private, no-store`

## 7. Paid access live test — ПРИНЯТ

Пользователь реально проверил опубликованный сайт после 1.10.1:
- ввёл временный access key
- paywall исчез
- дело №016 `Две камеры с поправкой` загрузилось
- отдельные показания работали
- ответы и полный разбор работали

Результат пользователя: **«Ключ внес, все прошло хорошо»**.

Temporary live-test entitlement после подтверждения удалён. На момент удаления осталось `0` test entitlements с source `live-web-test`.

Никакой тестовый token в repo/checkpoint не записан.

## 8. Web 1.11 — payment orchestration

Целевая цепочка:

`locked case → browser secret → create-checkout → YooKassa redirect → payment.succeeded → verified webhook → volume1 entitlement → case-access → 85 paid cases`

Добавлено:
- `public.payment_orders`
- `supabase/functions/_shared/payment.ts`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/yookassa-webhook/index.ts`
- `supabase/functions/payment-status/index.ts`
- browser purchase/return flow в `assets/paid-access-client.js`

Миграции применены в production Supabase:
- `20260808181000_paid_access.sql`
- `20260808204000_payment_orders.sql`
- `20260808210500_payment_order_entitlement_index.sql`

Все три новые Edge Functions уже DEPLOYED/ACTIVE в `mystery-logic`:
- `create-checkout`
- `yookassa-webhook`
- `payment-status`

Они пока dormant для реальной оплаты, потому что merchant YooKassa env ещё не настроен.

## 9. Payment security model

- Browser сам генерирует 256-bit opaque token до редиректа в платёжку.
- Plaintext token хранится только в browser localStorage.
- `payment_orders` хранит только SHA-256 token hash.
- Сумма платежа НЕ приходит из browser; она читается из server env `VOLUME1_PRICE_RUB`.
- Создание платежа использует YooKassa `Idempotence-Key`.
- YooKassa credentials используются только server-side через HTTP Basic Auth.
- Incoming webhook body не считается доверенным: сервер повторно запрашивает payment через authenticated YooKassa API.
- `payment-status` служит recovery-path: если webhook задержался, после redirect сервер сам перепроверяет payment и активирует entitlement.
- Verified full refund → `access_entitlements.status = refunded`, доступ закрывается.
- `purchase_completed` analytics добавлена.

## 10. Payment orders DB

Table: `public.payment_orders`.

Основные состояния:
- `creating`
- `pending`
- `paid`
- `canceled`
- `refunded`
- `failed`

RLS enabled, anon/authenticated access revoked.

Supabase advisors после DDL:
- Security: только INFO `rls_enabled_no_policy` для server-only таблиц — это намеренно.
- Performance: advisor нашёл FK `entitlement_id` без индекса; индекс добавлен отдельной migration.
- `unused_index` INFO ожидаемы до появления реальных заказов.

## 11. Public checkout сейчас ВЫКЛЮЧЕН

`assets/paid-access-config.js` 1.11 содержит live backend endpoints, но:

- `checkoutEnabled:false`

Поэтому deploy 1.11 НЕ должен показывать реальную кнопку покупки.

Live endpoints уже записаны:
- `case-access`
- `create-checkout`
- `payment-status`

Checkout включать только после merchant configuration + тестового платежа.

## 12. Что нужно от YooKassa для следующего шага

В Supabase Edge Function secrets/env нужно настроить (значения НЕ писать в GitHub и желательно НЕ присылать в чат):

- `YOOKASSA_SHOP_ID`
- `YOOKASSA_SECRET_KEY`
- `VOLUME1_PRICE_RUB`
- optional `VOLUME1_DESCRIPTION`
- `YOOKASSA_RECEIPT_MODE` = `disabled` или `yookassa` согласно реальной фискальной схеме

Если используются «Чеки от ЮKassa», также нужны подтверждённые merchant/accounting значения:
- `YOOKASSA_VAT_CODE`
- `YOOKASSA_PAYMENT_MODE`
- `YOOKASSA_PAYMENT_SUBJECT`

Не угадывать фискальные значения в коде.

## 13. YooKassa HTTP notifications

Для HTTP Basic Auth уведомления настраиваются в кабинете YooKassa.

URL:
`https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/yookassa-webhook`

События:
- `payment.succeeded`
- `payment.canceled`
- `refund.succeeded`

Webhook перепроверяет payment через API YooKassa перед изменением entitlement.

## 14. Следующий точный этап

1. Пользователь настраивает/получает YooKassa shop credentials.
2. Пользователь сам заносит секреты в Supabase Dashboard; secret key не пересылать в чат.
3. Определить реальную цену `volume1`.
4. Определить режим чеков/54-ФЗ и корректные receipt-параметры.
5. Настроить HTTP notification URL + 3 события в YooKassa.
6. Проверить `create-checkout` в тестовом/реальном YooKassa режиме при `checkoutEnabled:false`.
7. Выполнить один полный payment E2E: create → redirect → payment → webhook/status → entitlement → paid case.
8. Только после успешного теста сделать маленькую сборку 1.11.1/1.12 с `checkoutEnabled:true`.
9. После этого можно переходить к UX цены/оффера, восстановлению покупки между устройствами и production domain.

## 15. Основные версии

- 1.2.3 — robust dossier layout
- 1.3 — separate witnesses
- 1.4 — investigation cycle
- 1.4.1 — mobile scroll fix
- 1.5 — 100-case QA/editorial validation
- 1.6 — catalog/navigation
- 1.7 — SEO-native pilot
- 1.8 — all 15 free SEO-native + first collection
- 1.9 — production origin abstraction
- 1.10 — protected paid access boundary
- 1.10.1 — live paid backend connection
- 1.11 — YooKassa payment orchestration, public checkout still off

## 16. Что НЕ делать

- Не менять `app-core.js` без необходимости.
- Не публиковать paid payload.
- Не хранить YooKassa secret, service role или plaintext access token в repo/browser bundle.
- Не включать checkout до merchant/payment E2E.
- Не использовать Supabase `supervision-pocket`.
- Не переключать SEO origin до реального подключения `mysterylogic.com`.
- Не удалять legacy `/delo/.../` без миграционного плана.

## 17. Как продолжить в новом чате

Пользователь может написать:

> Продолжаем «Кто врёт?». Прочитай `PROJECT_CHECKPOINT.md` в `valera2872/ktovret-web` и продолжай с текущей точки.

После чтения сверить `main`, Supabase state и последний CI до writes.
