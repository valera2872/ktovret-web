# Mystery Logic Growth Workstream

Updated: 2026-09-21
Status: ACTIVE
Autonomy: L0 OBSERVE
Production changes: NONE

## Goal

Build a data-driven Growth & Retention loop for Mystery Logic:

`observe -> diagnose -> hypothesis -> experiment -> measure -> decision -> next action`

Primary objective: increase the number of users who:
1. arrive with relevant intent;
2. start a real investigation;
3. reach first value;
4. continue far enough to understand the product;
5. show premium intent / buy;
6. return.

Do not optimize vanity metrics in isolation.

## Current systems

- Production site: https://mysterylogic.com/
- Production Supabase: `mystery-logic`
- Supabase ref: `orknvuwknvsedjgqcfwc`
- Web repository: `valera2872/ktovret-web`
- Daily Growth Agent: active, read-only morning analysis.
- Growth Agent must not change LIVE, schema/RLS/auth/payment/entitlement/private canon/analytics definitions/SEO/prices without explicit approval.

## Baseline: last 7 days vs previous 7 days

Source: production Supabase, `site_funnel_events`.
Important: these are independent unique-visitor counts per event, NOT strict cohort conversion rates.

| Event | Last 7d | Previous 7d | Change |
|---|---:|---:|---:|
| page_view visitors | 972 | 730 | +33% |
| engaged_15s visitors | 701 | 525 | +34% |
| engaged_45s visitors | 577 | 439 | +31% |
| game_open visitors | 382 | 342 | +12% |
| game_accept visitors | 222 | 208 | +7% |
| game_complete visitors | 98 | 76 | +29% |
| checkout_open visitors | 4 | 3 | too small |
| checkout_start visitors | 3 | 0 | too small |
| checkout_success visitors | 1 | 0 | too small |

Interpretation at baseline:
- traffic and engagement grew faster than game starts;
- completions increased, but checkout volume remains too small for reliable optimization;
- the current bottleneck should be diagnosed before the checkout step, not assumed to be payment price or payment UX.

## Acquisition baseline: last 7 days

Unique visitors on page_view by referrer:

- yandex.ru: 567
- direct/unknown: 245
- away.vk.ru: 38
- ya.ru: 29
- google.com: 22
- yandex.by: 14
- yandex.kz: 9
- chatgpt.com: 9
- Instagram: 3
- Telegram web: 1

Telegram is currently NOT a demonstrated acquisition channel.
Default role: retention / community / notifications until data proves otherwise.

## Payments baseline

Production `payment_orders`, last 7 days:
- paid: 3 orders, 797 RUB total;
- pending: 2 orders.

Previous 7 days:
- paid: 3 orders, 497 RUB total.

Do not interpret revenue growth as conversion improvement without cohort/source/product context.

## Data-quality issues / UNKNOWN

1. `ai_detective_sessions` shows 451 non-test sessions in the last 7 days vs 11 in the previous 7 days, while funnel event counts for AI starts are much lower.
   Status: UNKNOWN.
   Required: determine session creation semantics and whether these datasets are comparable before using this as a growth KPI.

2. Current funnel does not yet provide a clean cohort chain for all steps:
   acquisition -> landing -> first value -> premium offer -> buy click -> checkout -> payment.

3. CI/QA/test contamination must be excluded wherever it can be identified reliably.

4. Missing or incomplete Premium event taxonomy must be treated as a measurement problem, not filled with inferred conversion numbers.

## Week 1: observation window

Period: 2026-09-21 through 2026-09-27.

No broad growth changes during the observation window unless a critical production problem is discovered.

Daily agent task:
- compare latest 24h with prior 7d and 30d context;
- inspect acquisition/referrer;
- inspect engagement;
- inspect game_open / game_accept / game_complete;
- inspect premium / checkout / payment;
- inspect AI / Partner where data is trustworthy;
- identify ONE most important change or bottleneck;
- propose ONE priority action;
- explicitly say when evidence is insufficient.

## Week 1 questions

By the end of the week answer:

1. Where is the largest verified loss of user intent?
2. Which landing/page group sends the highest-quality traffic into game_open and game_accept?
3. Which cases/formats create the strongest progression toward completion?
4. What event is missing between first value and commercial intent?
5. Are checkout events rare because offers are rarely shown, poorly clicked, or because tracking is incomplete?
6. Is the AI session spike real usage or a measurement/implementation artifact?
7. Which external source currently sends activated users, not merely visits?
8. Is Telegram providing any measurable retention or acquisition value?

## First experiment rule

Do NOT choose the first Growth 2.0 experiment until:
- at least several daily observations exist;
- the main bottleneck is supported by data;
- baseline is recorded;
- primary metric and guardrail can be measured.

Experiment format:
Hypothesis / Evidence / Intervention / Primary metric / Guardrail / Baseline / Window / Result / Decision.

Decision must be one of:
`KEEP / ITERATE / REVERT / INCONCLUSIVE`.

## Current priority

Priority #1: improve observability between meaningful gameplay value and premium intent.

Before changing price, Telegram content, ads, or checkout UX, determine what users actually see and do before commercial intent.

## Decisions already made

- Telegram is not a duplicate game/content catalog.
- Telegram defaults to retention/community/notification.
- Growth Agent starts at L0 OBSERVE.
- Do not automate production writes yet.
- One bottleneck and one priority action at a time.
- Data quality outranks activity.
- Correlation is not treated as causation.

## Rejected / superseded direction

Do not return to a strategy of publishing more standalone puzzles/cases in Telegram merely to increase channel activity unless new evidence supports it.

## Next step

Complete Week 1 observation, resolve the AI-session measurement discrepancy, identify the strongest verified bottleneck, and design Experiment GROWTH-001.


## Day 1 finding — 2026-09-21

### Verified

Production analytics currently records checkout-stage events but does NOT record the intermediate commercial-intent events needed to diagnose the funnel.

Observed event family:
- checkout_open
- checkout_start
- checkout_request
- checkout_created
- checkout_success

Not found in production event history and not found in current GitHub code search:
- premium_offer_impression
- premium_case_open
- demo_start
- key_evidence_found
- paywall_impression
- buy_click

### Consequence

Current data cannot distinguish among:
1. Premium offer is rarely shown.
2. Premium offer is shown but users do not click.
3. Users have not yet received enough gameplay value before the offer.
4. Tracking is incomplete.

Therefore no product/price/checkout conclusion is justified yet.

### Priority decision

The first Growth 2.0 intervention should be a measurement patch, not a marketing/content experiment.

Candidate measurement chain:

`premium_offer_impression -> buy_click -> checkout_open -> checkout_start -> checkout_success`

For premium demo flows also add:

`demo_start -> meaningful_value_reached -> paywall_impression`

Exact event semantics must be defined before implementation so the same event is not emitted from incompatible contexts.

Status: PROPOSED, requires explicit approval before analytics/code changes.


## Day 1 refinement — existing journey analytics

Further audit found useful commercial-intent signals already present in `site_funnel_events` through `journey-analytics.js`.

Last 7 days:
- Premium card `case_407`: 81 unique viewers, 15 unique clickers.
- Premium card `last_aria`: 75 unique viewers, 1 unique clicker.
- After-case Who Lied offer `volume1`: 65 unique viewers.
- `next_free` action from that offer: 10 unique visitors.
- `paid_199` action from that offer: 0 unique visitors.
- Last Aria `commerce/payment-intent`: 3 unique visitors.

Previous 7 days:
- `case_407`: 77 viewers, 16 clickers.
- `last_aria`: 71 viewers, 1 clicker.
- Who Lied after-case offer: 28 viewers; 2 chose `next_free`; 0 chose `paid_199`.

Historical caveat:
- `checkout_open` is semantically contaminated for Last Aria because the current frontend emits it when the paywall is rendered, not only after a deliberate user action.
- Do not use `checkout_open` alone as purchase intent.

### Revised Day 1 conclusion

The measurement layer is incomplete but not empty. Before adding new analytics events, use existing journey flows to diagnose commercial intent.

Strong verified signal: users who finish short cases are seeing the 85-case paid continuation offer, but no tracked `paid_199` clicks have occurred since this offer tracking began (first observed 2026-09-11), while some users choose another free case.

This does NOT yet prove why the paid continuation is unattractive. It does show that checkout optimization is downstream of the currently observed problem.

### Agent update

The daily Growth Agent must explicitly inspect:
- `step_view flow=premium-case` card-view/card-click;
- `step_view flow=who-lied-offer` after_case;
- `primary_action flow=who-lied-offer` next_free/paid_199;
- `step_view flow=commerce` payment-intent;
- product-level comparisons.

Status: L0 observation. No LIVE or analytics-code changes made.
