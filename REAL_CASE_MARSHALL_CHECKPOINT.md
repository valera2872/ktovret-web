# Mystery Logic — real case Marshall checkpoint

Checkpoint date: 2026-08-25

## Repository state

- Repository: `valera2872/ktovret-web`
- Draft PR: `#97` — `feat: real-case Marshall documentary prototype`
- Branch: `feature/real-case-marshall-prototype`
- Base: `main`
- `main` is intentionally untouched. Do not merge until manual product review.
- Checkpoint created immediately after commit `c72d91437c50ccc5fa6d5cc6a7c6d5f820924745`.

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

## Working route

`realnye-dela/arhiv-71-05/`

- `noindex,follow`
- not in sitemap/catalogue
- independent from payment, 15/85, `23:17`, Room 407 and Last Aria

## Implemented gameplay

- `S00–S02`: clean entry / case brief / first 72 hours
- `S03–S07`: three early witness materials, early evidence board, first checkpoint
- `S08–S14`: changed June 4 statements, two redline comparisons, common-pattern audit, checkpoint
- `S15–S17`: Crown Statement of Facts, prosecution-file audit, `Вы бы подписали эту версию?` with 3+ citations
- `S18–S21`: 11-year jump, RCMP reinvestigation, Royal Commission findings, investigation-failure audit
- `S22`: written evidentiary conclusion with 5+ citations
- `S23`: real case/name/legal-outcome reveal
- `S24`: source ledger with official links
- `S25`: systemic epilogue

100-point evidence-audit scoring, localStorage autosave, notebook, revisiting unlocked materials and spoiler locks are implemented.

## Changes made after previous checkpoint (`3600b18e…`)

1. Removed the top navigation (`Другие дела` / duplicate header notebook) from the real-case route so first contact keeps one visual focus. The in-case notebook remains available after the working interface appears.
2. Confirmed opening `S00–S02` already hide the right working sidebar on desktop and mobile via `real-case-marshall-mobile.css`.
3. Added `assets/real-case-marshall-source-meta.js` as a non-invasive source-provenance layer. It does not change game facts or progression.
4. The provenance layer keeps witnesses anonymised during play while explicitly distinguishing:
   - original statement + textual extract;
   - original statement reproduced by the Commission;
   - prosecution theory + textual extract;
   - reinvestigation evidence + textual extract;
   - Royal Commission finding.
5. Added exact provenance boundaries for M01/M02/M03/M05/M06/M08/M10/M11/M12/M13. In particular M02 is correctly described as Exhibit 16 p.22 reproduced in the Commission record; the current Commission-record URL is deliberate, not a mistaken source.
6. Strengthened `tools/real-case-marshall-smoke.mjs` to require the provenance layer, reject the entry navigation, and test provenance/status markers on S03/S04/S15/S19/S20/S24.

## Important correction preserved

Do **not** reinterpret the existing S20→S22 order as a fair-play bug. The player's independent decision already occurs at S17 before reinvestigation/Commission. The later S22 conclusion is a synthesis after comparison with the official inquiry, as designed in v13.

## Rights boundary

Commercial embedding of Nova Scotia Archives facsimile scans is not cleared here. Safe prototype mode remains:

- our source-grounded extracts/transcriptions;
- our comparison and audit UI;
- official source links revealed at the appropriate stage;
- no fake archival facsimiles.

## Next actions

1. Run/verify the updated real-case smoke and full PR CI on the current head.
2. Manually inspect S00, S03/S04, S10, S15, S19/S20, S23/S24 on desktop and mobile after provenance decoration.
3. Audit the implementation against v13 screen script/fact ledger for any remaining quiet simplifications, especially interpretive-feedback language and the fidelity of the prosecution/reinvestigation source summaries.
4. Only after that decide whether PR #97 is ready for the user's full product walkthrough.

## Safety rule for continuation

If conversation context becomes constrained, update this checkpoint with the latest head SHA, CI result, completed changes and exact next action before continuing elsewhere.
