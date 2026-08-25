# Mystery Logic — real case Marshall checkpoint

Checkpoint date: 2026-08-25

## Repository state

- Repository: `valera2872/ktovret-web`
- Draft PR: `#97` — `feat: real-case Marshall documentary prototype`
- Branch: `feature/real-case-marshall-prototype`
- Base: `main`
- `main` is intentionally untouched. Do not merge until the user completes the first true manual walkthrough and explicitly accepts the product.
- Final fully tested **code head**: `23a56a21aa614e760afec5ef4fff2846e378ded4`.
- On that head all required project workflows are green; the dedicated real-case workflow is `Real case Marshall prototype` **run #58**.
- Run #58 passed JavaScript validation, smoke v0.7.0, full 52-screen premium visual audit and artifact upload.
- Artifact: `real-case-marshall-smoke`, id `9565296076`.
- This file is the durable continuation point. A later branch head may differ only because of this documentation checkpoint.

## Critical history correction

The user has **not yet played or product-critiqued this case**. Internal screenshot/smoke review is not player validation. Do not invent prior player decisions or say that the user already approved the gameplay.

## Source of truth

Canonical product/source specification: `real_cases_research_database_v13.xlsx` from the project File Library. Preserve v13 unless a later explicit product decision overrides it.

Hard rules:

1. Real non-fiction case; no invented evidence, details, facsimiles or archive material.
2. 26 screens `S00–S25`.
3. Player audits evidence/investigation reliability; task is not to guess the offender.
4. Names, place and final legal outcome stay hidden until the final reveal.
5. Frozen-date progression: future material is not visible before its checkpoint.
6. One evidence source at a time; no evidence-card dashboard.
7. Redline changes are discovered by the player, not pre-highlighted.
8. `S17` — `ВЫ БЫ ПОДПИСАЛИ ЭТУ ВЕРСИЮ?` — is the key independent decision **before** reinvestigation and Royal Commission material.
9. S20 before S22 is intentional: independent fair-play judgment already happened at S17.
10. Evidence status must distinguish original witness claim / transcription or extract / prosecution theory / reinvestigation evidence / Royal Commission finding.
11. Nova Scotia Archives facsimile commercial rights are not cleared. Use source-grounded extracts/transcriptions + original analytic UI + later official links; no fake facsimiles.
12. Documentary tone only: no blood, red-string boards, police-tape cosplay or victory animation.
13. Auto-save notebook/progress.
14. Interpretive positions may lose points but are recorded and allowed to continue; do not create retry-until-correct school-quiz behaviour. Objective document-comparison gates may remain where v13 requires them.

## Product visual bar — explicit user decision

The first playable version must look **premium-premium now**, not after a later redesign.

Acceptance bar across S00–S25:

- editorial typography and hierarchy;
- strong composition and whitespace;
- premium document/paper treatment and legibility;
- serious documentary atmosphere rather than admin/dashboard UI;
- restrained premium microinteractions;
- desktop and mobile reviewed separately;
- first-contact clarity, suspense and emotional pull without compromising nonfiction credibility.

Reference quality bar: strongest presentation lessons from True Crime Games / ProfileDetective / Saint Twins, without copying their visual language.

## Working route

`realnye-dela/arhiv-71-05/`

- `noindex,follow`
- not in sitemap/catalogue
- independent from payment, 15/85, `23:17`, Room 407 and Last Aria

## Gameplay structure

- `S00–S02`: entry / case brief / first 72 hours
- `S03–S07`: three early witness materials, early evidence map, C1 with 2+ citations
- `S08–S14`: changed June 4 statements, two redline comparisons, common-pattern audit, C2
- `S15–S17`: Crown Statement of Facts, prosecution-file audit, independent sign-off with 3+ citations including M08 + one early source
- `S18–S21`: 11-year jump, RCMP reinvestigation, reopened alternative line, Royal Commission findings, investigation-failure audit
- `S22`: written evidentiary synthesis with 5+ citations
- `S23`: real case/name/legal-outcome reveal
- `S24`: official source ledger
- `S25`: systemic epilogue + post-case evidence-work score

LocalStorage autosave, notebook, revisiting unlocked materials, spoiler locks and reset are implemented.

## v13 scoring / source discipline

100-point matrix remains exactly:

- Document comparison — 30
- Source discipline — 25
- Alternative hypotheses — 15
- Investigation audit — 20
- Final synthesis — 10

Citation guards remain:

- S07: minimum 2 citations from M01/M02/M03
- S16: minimum 3 citations
- S17: minimum 3 citations including M08 + at least one early source
- S21: minimum 3 citations

S07/S14 record unsupported/categorical positions and continue. Objective redline/comparison/audit requirements remain source-grounded v13 gates.

## Non-fiction provenance

`assets/real-case-marshall-source-meta.js` defines provenance/status for M01/M02/M03/M05/M06/M08/M10/M11/M12/M13. M08 is explicitly prosecution theory, not established fact. M02 deliberately uses the Commission record reproducing Exhibit 16 p.22.

S19 preserves identity as `Мужчина X` while separately presenting:

1. ten-days-after-conviction later witness statement;
2. 1974 family report about apparent blood on a knife;
3. 1982 reinvestigation physical material concerning the knife.

These remain labelled according to evidentiary status rather than presented as final fact. S23 preserves that Roy Ebsary's manslaughter conviction followed three trials.

## Premium art direction

`assets/real-case-marshall-premium.css` + `assets/real-case-marshall-final-polish.css` provide the premium documentary layer:

- restrained dark editorial archive environment;
- warm physical paper/document treatment;
- less dashboard-like sidebar/material list;
- numbered editorial choices and refined citations;
- S00 archival `71—05` motif;
- S18 strong temporal rupture with `11 ЛЕТ` motif;
- S23 single-column human/factual reveal with numeric score hidden;
- score moved to S25, after the human outcome, as evidence-discipline evaluation;
- mobile typography/density and S22 writing-field treatment;
- redundant legacy fact-grid force-hidden on passive evidence screens.

## Player-facing reading flow

`assets/real-case-marshall-presentation.js` version `0.1.2` removes development language and fake interaction while preserving runtime compatibility.

Passive evidence screens `S03/S04/S05/S09/S11` no longer ask players to tick checkbox copies of the document text. Legacy inputs are filled only for old-runtime compatibility, hidden from the player, and the screen reads as evidence. Real interaction remains on comparison, audit and judgment screens.

No player-visible `прототип` or runtime version remains. S23 CTA is `Открыть официальные источники`; S24 uses documentary provenance language; S25 separates score from actual completion state.

## Investigator-tone pass — latest product cleanup

The final autonomous pass changed **presentation language only**. It did not change v13 thresholds, scoring, correct comparisons or source facts.

Key CTAs now read:

- S06 `Зафиксировать карту фактов`
- S07 `Зафиксировать рабочую версию`
- S10/S12 `Зафиксировать изменения`
- S13 `Зафиксировать общий сдвиг`
- S14 `Зафиксировать рабочий вывод`
- S16 `Зафиксировать слабые места`
- S17 `Зафиксировать решение по файлу`
- S19 `Обновить рабочую версию`
- S21 `Зафиксировать причины провала`
- S22 `Передать итоговое заключение`

Eyebrows were also made less quiz-like: S07 `Рабочий вывод · ранний файл`, S14 `Рабочий вывод · после повторных допросов`, S21 `Аудит расследования`.

Failure/success feedback on S06/S10/S12/S13/S16/S17/S19/S21/S22 is now framed as evidence work: incomplete map, incomplete comparison, unsupported shift, weak point not grounded in file, decision needing support, etc., rather than `выберите правильный ответ` language.

## Smoke v0.7.0

`tools/real-case-marshall-smoke.mjs` now treats investigator tone as a regression contract.

It asserts the new CTAs/eyebrows on key screens in desktop and mobile DOM, keeps spoiler/source/overflow checks, and reports `investigatorTone:true`. Screenshot checkpoints now include S00/S03/S06/S07/S10/S13/S16/S17/S19/S21/S22/S23/S24 in both viewports.

## Visual verification — run #58

Dedicated run #58 on tested code head `23a56a2…` passed:

- JavaScript validation;
- source-locked responsive smoke v0.7.0;
- full premium visual audit: **26 screens × desktop/mobile = 52 screenshots**;
- artifact upload.

The latest artifact was manually spot-checked after investigator-tone changes. S06, S17, S21, S10 and S22 were reviewed across desktop/mobile where relevant. New labels fit without obvious wrapping/overflow regression and the visual system still reads as one premium documentary product.

## CI regressions previously caught and fixed

Preserve these lessons:

1. S24 non-idempotent text replacement caused a MutationObserver loop — fixed.
2. S25 score card was once mistaken for completed state and disabled `Завершить дело` too early — fixed.
3. HTML `hidden` on legacy fact grid was overridden by CSS `display:grid` — fixed with explicit force-hide.

Functional smoke + visual audit must remain mandatory.

## CI / verification — current clean baseline

Final tested code head: `23a56a21aa614e760afec5ef4fff2846e378ded4`.

All required project checks on that head are complete and successful, including:

- Validate and deploy Mystery Logic web
- Build Mystery Logic production bundle for Beget
- Validate Mystery Logic SEO expansion
- Validate Mystery Logic legal shell
- Validate Mystery Logic global stats
- Validate Mystery Logic challenge
- Validate Mystery Logic Case Release Gate standard
- Validate Mystery Logic 23:17 co-op case
- Validate Mystery Logic Room 407
- Validate Mystery Logic Last Aria
- Visual smoke Mystery Logic co-op cases
- Visual smoke Mystery Logic approved storefront reference
- Real case Marshall prototype — run #58

## Preview/deployment boundary discovered

`.github/workflows/pages.yml` validates PR heads but its `deploy` job does **not** deploy pull-request heads. Deployment checks out `main`. Therefore a successful PR workflow does not imply a public branch-preview URL. Do not invent one and do not use `/deploy-ktovret-web` expecting a PR preview: the existing deploy path publishes `main`.

Before the user's walkthrough, provide a safe way to open this exact tested head without merging. Prefer an isolated temporary/static preview or a portable local preview; do not alter production or `main` merely to get a link.

## Exact next action

1. Keep PR #97 **draft** and `main` untouched.
2. Update PR #97 body to reference tested code head `23a56a2…`, investigator-tone pass, smoke v0.7.0, run #58 and green checks.
3. Stop autonomous product redesign. The next meaningful signal must come from the user's first actual playthrough.
4. Provide the user a safe preview of this exact tested head without merging to `main`.
5. User then performs the **first true S00–S25 walkthrough** and comments naturally while playing. Do not give them a checklist in advance that biases their experience.
6. Fix issues found during that real playthrough; merge only after explicit acceptance.

## Continuation safety rule

If conversation context becomes constrained, update this checkpoint before further changes. Never rely only on chat memory for handoff.
