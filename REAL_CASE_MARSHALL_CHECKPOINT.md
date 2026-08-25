# Mystery Logic — real case Marshall checkpoint

Checkpoint date: 2026-08-25

## Repository state

- Repository: `valera2872/ktovret-web`
- Draft PR: `#97` — `feat: real-case Marshall documentary prototype`
- Branch: `feature/real-case-marshall-prototype`
- Base: `main`
- `main` is intentionally untouched. Do not merge until the user completes the first manual product walkthrough.
- Final fully tested **code head**: `b11cb0ef1323b99c5712666dcd2e976df4523ccd`.
- That code head passed **13/13 GitHub Actions workflows**.
- This file is the durable continuation point. If conversation context is lost, resume from this checkpoint and the tested code head above rather than chat memory.

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
10. Evidence status must distinguish original witness claim / our transcription or extract / prosecution theory / reinvestigation evidence / Royal Commission finding.
11. Commercial Nova Scotia Archives facsimile rights are not cleared. Prototype uses source-grounded extracts/transcriptions + our analytic UI + later official links; no fake facsimiles.
12. Documentary tone only: no blood, red-string boards, police-tape cosplay or victory animation.
13. Auto-save notebook/tags/progress.
14. Checkpoints score evidentiary discipline. Premature/unsupported positions may lose points but are recorded and allowed to proceed; do not turn the case into a retry-until-correct school quiz.

## Product visual bar — explicit user decision

The user explicitly requires the first playable version to look **premium-premium now**, not after a later redesign.

Acceptance criteria for every S00–S25 screen:

- editorial typography and hierarchy;
- strong composition and whitespace;
- premium document/paper treatment and legibility;
- serious documentary atmosphere rather than admin/dashboard UI;
- restrained premium microinteractions;
- desktop and mobile reviewed separately;
- first-contact clarity, suspense and emotional pull without compromising nonfiction credibility.

Reference quality bar: strongest presentation lessons from True Crime Games / ProfileDetective / Saint Twins, without copying their visual language. Mystery Logic should feel cleaner, more deliberate and more premium.

## Working route

`realnye-dela/arhiv-71-05/`

- `noindex,follow`
- not in sitemap/catalogue
- independent from payment, 15/85, `23:17`, Room 407 and Last Aria

## Gameplay implemented

- `S00–S02`: entry / case brief / first 72 hours
- `S03–S07`: three early witness materials, early evidence board, C1 with 2+ citations
- `S08–S14`: changed June 4 statements, two redline comparisons, common-pattern audit, C2
- `S15–S17`: Crown Statement of Facts, prosecution-file audit, then independent `Вы бы подписали эту версию?` decision with 3+ citations including M08 and at least one early source
- `S18–S21`: 11-year jump, RCMP reinvestigation, reopened alternative line, Royal Commission findings, investigation-failure audit
- `S22`: written evidentiary synthesis with 5+ citations
- `S23`: real case/name/legal-outcome reveal
- `S24`: source ledger with official links
- `S25`: systemic epilogue

LocalStorage autosave, notebook, revisiting unlocked materials, spoiler locks and reset are implemented.

## v13 scoring / source discipline

100-point matrix is exactly:

- Document comparison — 30
- Source discipline — 25
- Alternative hypotheses — 15
- Investigation audit — 20
- Final synthesis — 10

`assets/real-case-marshall-source-meta.js` provides precise provenance/status boundaries for M01/M02/M03/M05/M06/M08/M10/M11/M12/M13. M08 is explicitly prosecution theory, not established fact. M02 deliberately uses the Commission record reproducing Exhibit 16 p.22; do not “correct” that URL merely because it is a later record.

`assets/real-case-marshall-v13-guards.js` adds:

- S07: minimum 2 citations from M01/M02/M03
- S16: minimum 3 citations
- S17: minimum 3 citations, including M08 + at least one early M01/M02/M03
- S21: minimum 3 citations
- reset integration for guard state
- synchronous initial decoration + `queueMicrotask` on rerenders to avoid the CI race previously found

S07/S14 record unsupported/categorical player positions and continue; full-credit reasoning earns points rather than forcing a retry.

## Reopened file depth

S19 preserves identity as `Мужчина X` while separately presenting three v13-grounded later materials:

1. Ten days after conviction: a later witness said the other man inflicted the fatal stab — labelled as a witness statement, not final fact.
2. 1974: a family member reported seeing that man wash apparent blood from a knife — labelled as a later report requiring verification.
3. 1982 reinvestigation: physical material concerning the knife — labelled as reinvestigation evidence, not the later Commission conclusion.

S23 preserves the v13 endpoint that Roy Ebsary's manslaughter conviction followed three trials.

## Premium visual layer now implemented

New file: `assets/real-case-marshall-premium.css`.

It is a visual-only art-direction layer and does not alter facts or progression. Key changes:

- more editorial dark documentary background and restrained texture;
- tighter brand/header and thin progress line;
- premium frame/shadow system;
- S00 ghost `71—05` archival motif and stronger hero composition;
- refined serif display typography and hierarchy;
- more physical warm-paper/document treatment;
- less dashboard-like sidebar/material list;
- numbered, more editorial choices instead of generic form cards;
- refined citation controls, textarea, timeline, reveal and score treatment;
- mobile-specific density/spacing improvements;
- subtle reduced-motion-safe entrance animation.

The opening route still has one focus: top navigation and duplicate notebook were removed earlier; S00–S02 hide the working sidebar.

## Player-facing presentation cleanup

New file: `assets/real-case-marshall-presentation.js`.

It removes development/prototype language from the actual player experience after every core render without changing source/game logic:

- S00 eyebrow: `Реальное уголовное дело · 1971` instead of `... · прототип`;
- footer: `Автосохранение включено` instead of exposing runtime version;
- reset: `Сбросить прогресс` with clean confirmation `Сбросить весь прогресс расследования?`;
- S25: `Расследование завершено.` instead of `Вы завершили прототип...`.

Route `<title>` is now `Архивное дело №71-05 — Mystery Logic`; meta description also no longer calls the experience a prototype.

The sidecar uses MutationObserver + `queueMicrotask` so the cleanup survives the core's full `innerHTML` rerenders. It calls `MLRealCase7105.reset()` so existing v13 guard-reset wrapping remains intact.

## Full visual audit system

New file: `tools/real-case-marshall-visual-audit.mjs`.

The dedicated Marshall workflow now captures **all 26 screens** at:

- desktop `1440×1200`
- mobile `390×844`

Total = **52 browser-rendered screenshots** per dedicated run, in addition to the functional smoke screenshots.

The 52-screen audit was manually reviewed after the premium layer. Findings:

- overall visual system holds consistently across S00–S25;
- paper/document screens S03/S04/S05/S09/S11/S15 are particularly strong;
- S17 independent sign-off screen reads clean, serious and premium;
- S24 source ledger is structured and visually credible;
- no obvious systemic wrapping/overflow regression appeared in the contact-sheet review;
- fresh S00 mobile and S25 mobile were separately re-opened after the presentation cleanup and confirmed free of visible `прототип`/version dev copy.

Potential later micro-polish only if the actual playthrough shows need: S18 could become slightly more cinematic; mobile S22 textarea could be marginally less utility-like. These are not blockers and should not trigger decorative redesign without gameplay evidence.

## CI / verification — current clean baseline

Final tested code head: `b11cb0ef1323b99c5712666dcd2e976df4523ccd`.

Result: **13/13 workflows passed**:

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
- Real case Marshall prototype — run #37

Dedicated run #37 passed JavaScript validation, functional responsive smoke, full 52-screen premium visual capture and artifact upload.

Current workflow syntax validation includes:

- `assets/real-case-marshall.js`
- `assets/real-case-marshall-source-meta.js`
- `assets/real-case-marshall-v13-guards.js`
- `assets/real-case-marshall-presentation.js`
- `tools/real-case-marshall-smoke.mjs`
- `tools/real-case-marshall-visual-audit.mjs`

## Deliberately not changed yet

Do not add mechanics merely because v13 could be read slightly differently before observing real player friction. Example: S05 currently marks important facts and S06 performs cross-source synthesis; this is not a blocker.

Visual problems, however, are not deferred: if the first manual playthrough exposes any screen below the premium bar, fix it immediately rather than accumulating a later redesign pass.

## Exact next action

1. Keep PR #97 **draft** and `main` untouched.
2. Update PR #97 body to reference tested code head `b11cb0e…`, premium CSS/presentation layer, full 52-screen visual audit and 13/13 CI.
3. Then begin the user's **first true end-to-end S00–S25 gameplay walkthrough**. The user has not previously played or product-critiqued this case.
4. During that walkthrough judge gameplay and visual quality together: first-contact clarity, suspense, comprehension, document density, whether choices feel investigative rather than school-like, emotional peaks at S15/S17/S19/S23, and desktop/mobile presentation.
5. Do not merge until the user accepts the product after that walkthrough.

## Continuation safety rule

If conversation context becomes constrained, update this checkpoint again before further code changes. Never rely only on a chat summary for the next handoff.
