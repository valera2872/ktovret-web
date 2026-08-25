# Mystery Logic — real case Marshall checkpoint

Checkpoint date: 2026-08-25

## Repository state

- Repository: `valera2872/ktovret-web`
- Draft PR: `#97` — `feat: real-case Marshall documentary prototype`
- Branch: `feature/real-case-marshall-prototype`
- Base: `main`
- `main` is intentionally untouched. Do not merge until the user completes the first manual product walkthrough.
- Final fully tested **code head**: `68383cf8f61d038708803855febe8f5b5cd794ad`.
- All **13 required workflows passed** on that code head. A separate unrelated `Live Last Aria Release Gate` was `skipped`, not failed.
- Dedicated `Real case Marshall prototype` run **#54** passed JavaScript validation, functional smoke and the full 52-screen premium visual audit.
- This file is the durable continuation point. A later branch head may differ only because of this documentation checkpoint; resume from the tested code head above plus this file.

## Source of truth

Canonical product/source specification: `real_cases_research_database_v13.xlsx` from the project File Library. Preserve v13 unless a later explicit product decision overrides it.

Hard rules:

1. Real non-fiction case; no invented evidence.
2. 26 screens `S00–S25`.
3. Player audits evidence/investigation reliability; the task is not to guess the offender.
4. Names, place and final legal outcome stay hidden until the final reveal.
5. Frozen-date progression: future material is not visible before its checkpoint.
6. One evidence source at a time; no evidence-card dashboard.
7. Redline changes are discovered by the player, not pre-highlighted.
8. `S17` — `ВЫ БЫ ПОДПИСАЛИ ЭТУ ВЕРСИЮ?` — is the key independent decision **before** reinvestigation and Royal Commission material.
9. Do not reorder S20/S22 merely because S22 is later written synthesis; the independent fair-play decision already happened at S17.
10. Evidence status must distinguish original witness claim / transcription or extract / prosecution theory / reinvestigation evidence / Royal Commission finding.
11. Commercial Nova Scotia Archives facsimile rights are not cleared. Use source-grounded extracts/transcriptions + original analytic UI + later official links; no fake facsimiles.
12. Documentary tone only: no blood, red-string boards, police-tape cosplay or victory animation.
13. Auto-save notebook/progress.
14. Checkpoints score evidentiary discipline. Premature/unsupported positions may lose points but are recorded and allowed to proceed; do not turn the case into a retry-until-correct school quiz.

## Product visual bar — explicit user decision

The first playable version must look **premium-premium now**, not after a later redesign.

Acceptance criteria for every S00–S25 screen:

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
- `S03–S07`: three early witness materials, early evidence board, C1 with 2+ citations
- `S08–S14`: changed June 4 statements, two redline comparisons, common-pattern audit, C2
- `S15–S17`: Crown Statement of Facts, prosecution-file audit, then independent sign-off decision with 3+ citations including M08 + one early source
- `S18–S21`: 11-year jump, RCMP reinvestigation, reopened alternative line, Royal Commission findings, investigation-failure audit
- `S22`: written evidentiary synthesis with 5+ citations
- `S23`: real case/name/legal-outcome reveal
- `S24`: source ledger with official links
- `S25`: systemic epilogue + post-case evidence-work score

LocalStorage autosave, notebook, revisiting unlocked materials, spoiler locks and reset are implemented.

## v13 scoring / source discipline

100-point matrix is exactly:

- Document comparison — 30
- Source discipline — 25
- Alternative hypotheses — 15
- Investigation audit — 20
- Final synthesis — 10

`assets/real-case-marshall-source-meta.js` provides provenance/status boundaries for M01/M02/M03/M05/M06/M08/M10/M11/M12/M13. M08 is explicitly prosecution theory, not established fact. M02 deliberately uses the Commission record reproducing Exhibit 16 p.22.

`assets/real-case-marshall-v13-guards.js` adds:

- S07: minimum 2 citations from M01/M02/M03
- S16: minimum 3 citations
- S17: minimum 3 citations, including M08 + at least one early M01/M02/M03
- S21: minimum 3 citations
- reset integration for guard state
- synchronous initial decoration + `queueMicrotask` on rerenders

S07/S14 record unsupported/categorical player positions and continue; full-credit reasoning earns points rather than forcing retries.

## Reopened file depth

S19 preserves identity as `Мужчина X` while separately presenting three v13-grounded later materials:

1. Ten days after conviction: later witness statement naming the other man as stabber — witness claim, not final fact.
2. 1974: family report of apparent blood being washed from a knife — later report requiring verification.
3. 1982 reinvestigation: physical material concerning the knife — reinvestigation evidence, not later Commission conclusion.

S23 preserves that Roy Ebsary's manslaughter conviction followed three trials.

## Premium art direction

`assets/real-case-marshall-premium.css` supplies the main documentary art direction:

- restrained dark editorial environment;
- premium frame/shadow system;
- S00 archival `71—05` motif;
- refined display typography;
- warm physical paper/document treatment;
- less dashboard-like sidebar/material list;
- numbered editorial choices;
- refined citations, textarea, timeline, reveal and mobile density;
- reduced-motion-safe entrance animation.

`assets/real-case-marshall-final-polish.css` adds the final emotional hierarchy:

- S18 is a real temporal rupture with a large restrained `11 ЛЕТ` motif;
- S23 is a single-column human/factual reveal;
- numeric score is **hidden on S23** so it does not compete with the death, wrongful conviction and 11 years of imprisonment;
- score belongs to S25, after the factual outcome, as evaluation of evidence discipline;
- S22 mobile textarea is treated as a deliberate writing field rather than a utility control;
- redundant legacy fact-grid is force-hidden on passive evidence-reading screens.

## Player-facing reading flow

`assets/real-case-marshall-presentation.js` removes development language and fake interaction while preserving runtime compatibility.

Player-facing cleanup:

- no visible `прототип` language;
- no runtime version in footer;
- clean reset wording;
- S23 CTA is `Открыть официальные источники`;
- S24 uses normal documentary provenance language;
- S25 distinguishes score from actual completion state.

Important UX decision from the internal walkthrough:

`S03/S04/S05/S09/S11` originally repeated the document text as mandatory checkboxes. That felt like a school test and added no investigative decision. The player-facing layer now:

- internally checks those legacy inputs only for old-runtime compatibility;
- hides the duplicated checkbox grid completely;
- presents the source as a document to read;
- adds a restrained reading prompt;
- keeps real interaction where it matters: S06/S07, S10/S12, S16/S17, S19/S21 and S22.

Second statements are not pre-highlighted: the player is told that comparison happens on the next screen.

## CI regressions caught during this pass

Do not erase these lessons:

1. A non-idempotent S24 presentation text replacement caused a MutationObserver loop. Fixed by only mutating when content actually differs.
2. An early S25 polish rule mistook the always-visible score card for completed state and disabled `Завершить дело` before the user clicked it. Smoke run #50 caught this. Fixed by distinguishing the score card from the separate completion feedback created after the actual click.
3. HTML `hidden` on the redundant fact grid was overridden by author `display:grid`; full visual audit exposed this. Fixed with `.rc-fact-grid[hidden]{display:none!important}`.

These are examples of why both functional smoke and visual audit must remain mandatory.

## Full visual audit system

`tools/real-case-marshall-visual-audit.mjs` renders **all 26 screens** at:

- desktop `1440×1200`
- mobile `390×844`

Total = **52 browser screenshots** per dedicated run, in addition to functional smoke screenshots.

Latest run #54 after all fixes passed the complete 52-screen audit. Fresh manual review confirmed:

- S03 is now a clean document-reading screen without repeated checkboxes;
- S18 has a stronger time-jump hierarchy;
- S23 has a strong factual reveal with no score competing for attention;
- S25 keeps the post-case evidence-work score while `Завершить дело` remains active until the actual completion click;
- no new systemic wrapping/overflow regression was found.

## CI / verification — current clean baseline

Final tested code head: `68383cf8f61d038708803855febe8f5b5cd794ad`.

Required workflows: **13/13 successful**:

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
- Real case Marshall prototype — run #54

A separate `Live Last Aria Release Gate` appeared in the check suite and was `skipped`; it is unrelated to this real-case branch and is not a failure.

Dedicated run #54 passed:

- JavaScript validation;
- source-locked responsive functional smoke;
- full 52-screen premium visual audit;
- artifact upload.

## Deliberately not changed yet

Do not add mechanics merely because v13 could be interpreted slightly differently before real player feedback. The next signal should come from the user's actual walkthrough, not speculative feature accumulation.

Small copy details such as whether S03 CTA should remain `Зафиксировать и продолжить` or become more literal can be judged during the real playthrough; do not restart a redesign cycle for that alone.

## Exact next action

1. Keep PR #97 **draft** and `main` untouched.
2. Update PR #97 body to reference tested code head `68383cf8…`, run #54, the reading-flow cleanup, reveal hierarchy and 13 required green workflows.
3. Then hand the current route to the user for the **first true end-to-end S00–S25 gameplay walkthrough**. The user has not previously played or product-critiqued this case.
4. During that walkthrough judge gameplay and visual quality together: first-contact clarity, suspense, comprehension, document density, whether choices feel investigative rather than school-like, emotional peaks at S15/S17/S19/S23, and desktop/mobile presentation.
5. Do not merge until the user accepts the product after that walkthrough.

## Continuation safety rule

If conversation context becomes constrained, update this checkpoint again before further code changes. Never rely only on a chat summary for the next handoff.
