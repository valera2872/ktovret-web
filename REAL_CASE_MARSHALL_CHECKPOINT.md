# Mystery Logic — real case Marshall checkpoint

Checkpoint date: 2026-08-25

## Repository state

- Repository: `valera2872/ktovret-web`
- Draft PR: `#97` — `feat: real-case Marshall documentary prototype`
- Branch: `feature/real-case-marshall-prototype`
- Base: `main`
- `main` is intentionally untouched. Do not merge until manual product review.
- Final tested code head before this documentation checkpoint: `eccb8c785268b6ae9bc2be9a2f72d986c99a712b`.
- This file is the durable continuation point. If a conversation ends, resume from the branch head containing this checkpoint, not from chat memory.

## Source of truth

The product/source specification is `real_cases_research_database_v13.xlsx` from the project File Library. In case of conflict between an ad-hoc implementation idea and v13, preserve v13 unless a later explicit product decision overrides it.

Core rules:

1. Real non-fiction case; no invented evidence.
2. 26 screens `S00–S25`.
3. The task is evidence audit, not guessing the offender's name.
4. Names/place/final legal outcome stay hidden until the final reveal.
5. Frozen-date progression: future material is not visible before its checkpoint.
6. One evidence source at a time; no evidence-card dashboard.
7. Redline changes are discovered by the player, not pre-highlighted.
8. `S17` — `ВЫ БЫ ПОДПИСАЛИ ЭТУ ВЕРСИЮ?` — is the key independent pre-reinvestigation decision and requires document citations.
9. Reinvestigation and Royal Commission layers follow that independent decision. Do not reorder them merely because `S22` contains a later written synthesis.
10. Evidence status must distinguish original witness claim / our transcription or extract / prosecution theory / reinvestigation evidence / Royal Commission finding.
11. Prototype may use source-grounded text and original analytic UI. Nova Scotia Archives facsimiles remain a separate commercial-rights issue.
12. Documentary visual tone only: no blood, red-string boards, police-tape cosplay, or victory animation.
13. Auto-save notebook/tags/progress.
14. Checkpoints score evidentiary discipline. A premature/unsupported conclusion may lose points but must not force the player to keep clicking until the game receives its preferred answer.

## Product visual bar — explicit user decision

The first playable product review must already look **premium-premium**. Visual quality is not deferred to a later cosmetic pass.

For every S00–S25 screen, judge and fix before acceptance:

- editorial typography and hierarchy;
- composition and whitespace;
- document-card treatment and material legibility;
- restrained, documentary atmosphere rather than game-admin UI;
- premium microinteractions and state changes;
- desktop and mobile separately;
- first-contact clarity and emotional pull without sacrificing nonfiction credibility.

Reference level: use the strongest presentation lessons from True Crime Games / ProfileDetective / Saint Twins as a quality bar, without copying their visual language. Mystery Logic should feel cleaner, more deliberate and more premium.

## Working route

`realnye-dela/arhiv-71-05/`

- `noindex,follow`
- not in sitemap/catalogue
- independent from payment, 15/85, `23:17`, Room 407 and Last Aria

## Implemented gameplay

- `S00–S02`: clean entry / case brief / first 72 hours
- `S03–S07`: three early witness materials, early evidence board, C1 with 2+ source citations
- `S08–S14`: changed June 4 statements, two redline comparisons, common-pattern audit, C2
- `S15–S17`: Crown Statement of Facts, prosecution-file audit with sources, `Вы бы подписали эту версию?` with 3+ citations including M08 and at least one early source
- `S18–S21`: 11-year jump, RCMP reinvestigation, reopened alternative line, Royal Commission findings, investigation-failure audit with sources
- `S22`: written evidentiary conclusion with 5+ citations
- `S23`: real case/name/legal-outcome reveal
- `S24`: source ledger with official links
- `S25`: systemic epilogue

LocalStorage autosave, notebook, revisiting unlocked materials and spoiler locks are implemented.

## v13 scoring now aligned

The 100-point evidence-audit score now matches the v13 dimension matrix:

- Document comparison — 30
- Source discipline — 25
- Alternative hypotheses — 15
- Investigation audit — 20
- Final synthesis — 10

`S07` and `S14` now record the player's chosen position and continue even if it is too categorical. Full-credit reasoning earns the points; unsupported certainty is preserved as the player's answer and reflected in the score instead of becoming a quiz retry gate.

## Source provenance layer

`assets/real-case-marshall-source-meta.js` is loaded after the core runtime. It changes labels/provenance only; it does not invent facts or change progression.

It keeps witnesses anonymised during play while distinguishing:

- original statement + textual extract;
- original statement reproduced by the Commission;
- prosecution theory + textual extract;
- reinvestigation evidence + textual extract;
- Royal Commission finding;
- official outcome/systemic finding after reveal.

Exact provenance boundaries are present for M01/M02/M03/M05/M06/M08/M10/M11/M12/M13. M02 is deliberately sourced through the Commission record reproducing Exhibit 16 p.22; do not 'correct' that URL merely because it is a later hearing/Commission record.

## v13 validation layer

`assets/real-case-marshall-v13-guards.js` supplies requirements that the original prototype runtime omitted:

- S07: minimum 2 citations from M01/M02/M03.
- S16: minimum 3 source citations for the prosecution-file audit.
- S17: existing 3-citation requirement is strengthened to require M08 and at least one early source M01/M02/M03.
- S21: minimum 3 source citations for investigation-failure findings.
- Guard state is cleared together with the core reset, including programmatic `MLRealCase7105.reset()`.
- Initial guard decoration is synchronous; later rerenders use `queueMicrotask`, avoiding the headless/browser race found by CI.

## Reopened file depth restored

S19 no longer compresses the reopened case to one vague sentence. While the true identity remains hidden as `Мужчина X`, the player receives three separately labelled later materials grounded in v13:

1. Ten days after conviction: a new witness statement naming the other man as the stabber (presented as a witness claim, not final fact).
2. 1974: a family report that the man was seen washing apparent blood from a knife (presented as a later report requiring verification).
3. 1982 reinvestigation: physical material concerning the knife (presented as reinvestigation evidence, not the later Commission conclusion).

S23 also preserves the v13 endpoint that Ebsary's manslaughter conviction followed three trials.

## Entry / visual rules already implemented

- Top route navigation (`Другие дела` and duplicate header notebook) was removed so the case entry has one focus.
- S00–S02 already hide the working sidebar on desktop and mobile.
- The in-case notebook remains once the working investigation UI is relevant.
- JS cache versions were bumped after the v13/core update so product review does not accidentally load stale runtime code.
- Mobile title wrapping was hardened at final code head `eccb8c7…`; S21 now renders `ГДЕ СЛОМАЛОСЬ / РАССЛЕДОВАНИЕ?` cleanly instead of breaking inside the word.

## CI / smoke state — final tested code head

Dedicated workflow watches `assets/real-case-marshall*.js`, not only the original core file, and syntax-checks:

- `assets/real-case-marshall.js`
- `assets/real-case-marshall-source-meta.js`
- `assets/real-case-marshall-v13-guards.js`
- `tools/real-case-marshall-smoke.mjs`

The smoke checks S00/S03/S04/S07/S10/S15/S16/S19/S20/S21/S23/S24 on desktop and mobile, including noindex/spoiler/source-link/overflow boundaries, provenance labels, source-citation UI, reopened-file depth, cache versions, v13 choice semantics and the 30/25/15/20/10 score distribution.

Final result for tested code head `eccb8c785268b6ae9bc2be9a2f72d986c99a712b`: **12/12 GitHub Actions workflows passed**.

Passed workflows include:

- Validate and deploy Mystery Logic web
- Build Mystery Logic production bundle for Beget
- Validate Mystery Logic SEO expansion
- Validate Mystery Logic legal shell
- Validate Mystery Logic global stats
- Validate Mystery Logic challenge
- Validate Mystery Logic 23:17 co-op case
- Validate Mystery Logic Room 407
- Validate Mystery Logic Last Aria
- Visual smoke Mystery Logic co-op cases
- Visual smoke Mystery Logic approved storefront reference
- Real case Marshall prototype — run #29

The run #29 screenshot artifact was manually reviewed after the mobile typography fix. S21 mobile title is clean; a contact-sheet review of S00/S07/S10/S15/S19/S21/S23 mobile showed no obvious new wrapping/overflow regression. This is smoke-level visual verification only, **not** the full premium product review.

Historical CI note:

- Original prototype head `3600b18e…` passed 12/12.
- Provenance/v13 head `dac360f…` fixed the initial requestAnimationFrame smoke race and `Real case Marshall prototype` run #24 passed successfully.
- Final tested code head `eccb8c7…` is the current clean code baseline.

## Important correction preserved

Do **not** reinterpret the existing S20→S22 order as a fair-play bug. The player's independent decision already occurs at S17 before reinvestigation/Commission. The later S22 conclusion is a synthesis after comparison with the official inquiry, as designed in v13.

## Rights boundary

Commercial embedding of Nova Scotia Archives facsimile scans is not cleared here. Safe prototype mode remains:

- our source-grounded extracts/transcriptions;
- our comparison and audit UI;
- official source links revealed at the appropriate stage;
- no fake archival facsimiles.

## Deliberately not expanded further before product review

The remaining differences are small interaction-detail questions rather than blockers. Example: S05 currently asks the player to mark important facts and then S06 performs the cross-source synthesis; v13 could be read as asking S05 itself to mark matching/differing details. Do not add mechanics merely to satisfy a theoretical reading before observing the end-to-end flow. However, **visual deficiencies are not deferred**: anything below the premium bar should be corrected during the first full screen-by-screen review.

## Exact next action

1. Keep PR #97 draft and `main` untouched.
2. Update PR #97 body to reference tested code head `eccb8c7…`, v13 guards/provenance/scoring and 12/12 final CI.
3. Perform the first full S00–S25 product walkthrough, not merely a smoke check.
4. Review every screen simultaneously for gameplay and premium visual quality: first-contact clarity, suspense, document density, hierarchy, whitespace, mobile/desktop composition, microinteractions and whether choices feel investigative rather than school-like.
5. Fix visual defects immediately rather than accumulating a later redesign pass.

## Safety rule for continuation

If conversation context becomes constrained, update this checkpoint again before making more code changes. Never rely only on a chat summary for the next handoff.
