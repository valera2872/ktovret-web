# Solo 407 — player feedback fixes · 2026-08-27

Source: real player report after completing the solo investigation.

## Problems reported

1. Too many opaque codes and technical identifiers; the player loses the physical meaning of an event.
2. Not enough visual/contextual introduction to the scene and people.
3. After returning to an earlier stage, the player cannot navigate forward again.
4. Newly requested evidence on stages 2–3 may appear above evidence requested earlier.
5. The relationship between Marta Orlova and Elena Raeva is unclear at the start.
6. Seconds in timestamps add noise and distract from the deduction.

## Product response

- Preserve canonical evidence and deduction logic; do not rewrite the co-op case.
- Add a solo-only clarity layer with a spoiler-safe cast card and corridor diagram.
- Explicitly state the initial working relationship: Marta is the sapphire custodian; Elena is the night manager with service access.
- Keep codes when they are evidentiary identifiers, but explain them in plain language and provide a compact code guide.
- Display timestamps at minute precision in solo UI.
- Restore forward navigation based on completed checkpoints, not the currently viewed stage.
- Preserve the actual order in which the player requested evidence.

## Regression requirements

The automated smoke must prove:
- stage 2 remains accessible after navigating back to stage 1;
- evidence requested out of canonical order remains displayed in actual request order;
- no HH:MM:SS timestamps remain visible;
- service codes have plain-language meaning;
- Marta/Elena context and scene diagram appear before/at the start of investigation.
