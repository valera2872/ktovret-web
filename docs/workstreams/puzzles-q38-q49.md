# Workstream: puzzles-q38-q49

Date: 2026-09-21
Status: **STAGING REDESIGN / AWAITING OWNER VISUAL ACCEPTANCE / NOT PRODUCTION**

## Goal
Add a new batch of 12 original Mystery Logic quick puzzles (Q38–Q49) with broader mechanics and less repetition than Q01–Q37.

## Content
Difficulty curve:
- 3 easy
- 5 medium
- 3 hard
- 1 very hard

Visual puzzles:
- Q38 Three rhythms
- Q40 Robot route
- Q43 Five rooms
- Q44 Disappearing lines
- Q48 Cube in corridor
- Q49 One weighing

Mechanics added:
- parallel pattern cycles
- formal implication
- spatial navigation
- square-difference sequence
- physical trace evidence
- graph/Hamiltonian route
- XOR-like line composition
- hypothesis falsification
- negative evidence
- causal reconstruction
- cube orientation
- information-encoding weighing strategy

## Production baseline
CURRENT_RELEASE:
- release_id: live-2026-09-20
- canonical LIVE ZIP: MysteryLogic-LIVE-2026-09-20.zip
- SHA-256: afeee57f1f0431b2762d5a8159b933c01ae88369f1d7f814b187452066ee9015

The redesign was derived from the exact LIVE /golovolomki-onlayn/ markup and CSS language, not from GitHub main's stale generator header.

## Staging branch
`staging/puzzles-q38-q49`

Current reviewed snapshot:
`e0621fb2069c0c26318b1c58b4414de72ad55229`

Files:
- admin/puzzles-q38-q49-preview/index.html
- assets/puzzles-q38-q49-preview.css
- assets/puzzles-q38-q49-preview.mjs
- assets/puzzles-q38-q49-preview-data.mjs
- tests/puzzles-q38-q49-preview.test.mjs
- .github/workflows/puzzles-q38-q49-staging.yml

## Design decision
The first staging design was rejected by owner as too rough and not aligned with the site template. The owner then supplied a screenshot and explicitly stated that this screenshot is the current on-site visual reference; that screenshot is now the source of truth for card composition.

Current redesign:
- keeps the Mystery Logic site header/navigation context
- uses the owner-supplied on-site card composition as the visual source of truth
- three-column visual-first cards on desktop
- every Q38–Q49 card now has a top visual/illustration, not only the six diagram-heavy puzzles
- exact schematic visuals for Q38/Q40/Q43/Q44/Q48/Q49
- subject illustrations for Q39/Q41/Q42/Q45/Q46/Q47
- number/mechanic/title/short premise/time/difficulty/CTA below the visual
- individual puzzle view remains interactive with choices, hint, validation and explanation
- no visible Puzzle Lab / TEST DOMAIN product framing

## QA
Latest branch validation:
- run 35643376436 — SUCCESS
- 12/12 content contract
- difficulty distribution 3/5/3/1
- 12 visual-first catalog cards
- six exact diagram-heavy visuals
- Q40 deterministic movement checked
- Q43 unique valid A→E route checked by enumeration
- Q48 cube orientation checked
- Q49 eight distinct non-zero weighing deviations checked
- no Telegram content
- noindex staging boundary

Combined GitHub Pages staging deploy:
- main workflow commit: 39155416236201347699959f858da0a1a48a7c2e
- run 35643410444 — SUCCESS
- staging URL: https://valera2872.github.io/ktovret-web/admin/puzzles-q38-q49-preview/

## Production boundary
NOT touched:
- Beget LIVE
- CURRENT_RELEASE.json
- canonical LIVE ZIP
- Supabase
- production analytics
- production puzzle catalog/editorial queue

## Pending
1. Owner visual review of redesigned staging page.
2. Real desktop/mobile visual smoke after owner accepts direction.
3. If accepted: convert Q38–Q49 into editorial source objects/batch.
4. Decide which new puzzles enter /golovolomki-onlayn/ featured quick-start.
5. Only after approval: prepare production patch from exact LIVE baseline.
