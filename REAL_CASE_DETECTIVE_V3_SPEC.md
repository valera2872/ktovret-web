# Mystery Logic — Real Case Detective v3

Status: product architecture reset after user rejection of Marshall v1/v2.

## 1. What failed

Marshall v1 and v2 created disclosure, not deduction. The user could progress by opening cards and reading. The product supplied the important relationships and conclusions instead of forcing the player to discover them.

Symptoms:
- no need to form a hypothesis;
- no need to test an idea;
- no consequence for an incorrect theory;
- no reason to use notes/board;
- anonymous A/B/C/D labels destroyed human context;
- first screens lacked visual atmosphere;
- state transitions were visually weak;
- interaction was often equivalent to `next page`.

Marshall is therefore not the flagship paid detective game. It may later become a separate documentary category: `Разбор реального дела`.

## 2. Hard product rule

A paid real-case game must create this loop:

`OBSERVE → FORM HYPOTHESIS → TEST → GET NEW CONSTRAINT → REVISE → COMMIT`

Every 3–5 minutes the player must make an inference that can be wrong.

If a player can progress by clicking every available card without thinking, the design fails.

## 3. What counts as real detective work

Allowed interaction must require at least one of:
- spatial reconstruction;
- timeline reconstruction;
- alibi consistency;
- source contradiction;
- physical evidence fit;
- suspect elimination;
- relationship inference;
- credibility weighting;
- choosing which hypothesis survives current evidence;
- final accusation / reconstruction before reveal.

Pure disclosure (`open witness`, `open document`, `read answer`) never counts as a core mechanic.

## 4. Memory rule

Never test memory of prose. The workspace must keep relevant facts visible.

The challenge is interpretation, not remembering which witness said what three screens ago.

## 5. Human identity rule

No A/B/C/D witness labels.

Use:
- real names when they do not spoil the case and rights/context allow it;
- otherwise contextual identity: `сосед со второго этажа`, `приёмная мать`, `человек в дверях квартиры`, `очевидец с лестницы`.

The player must always know why a person matters.

## 6. Visual rule

The first two screens must establish place, time and emotional reality.

Every major stage needs a visual anchor based on real/source-grounded material:
- location / building / route schematic;
- public official photograph where usable;
- evidence diagram;
- timeline strip;
- person relationship map;
- weapon / object diagram;
- document fragment only when the document itself is the puzzle.

No decorative police tape / red-string cosplay.

## 7. Transition rule

A state change cannot silently look like the same page.

Use a strong transition pattern:
- `НОВАЯ ЛИНИЯ ОТКРЫТА`
- `ПРОВЕРКА ДАЛА РЕЗУЛЬТАТ`
- `ВЕРСИЯ НЕ СХОДИТСЯ`
- `ПОЯВИЛСЯ НОВЫЙ СВИДЕТЕЛЬ`

The next meaningful action must be visually dominant.

## 8. Non-fiction boundary

Still mandatory:
- no invented evidence;
- no invented dialogue presented as historical;
- no fake facsimile;
- no invented forensic result;
- no invented suspect;
- no invented historical branch/outcome.

Original UI may visualize source-grounded facts as a clearly labelled schematic/reconstruction.

## 9. Candidate selection gate

A case cannot enter production unless it has:
1. a concrete mystery that the player can answer before reveal;
2. at least two plausible competing hypotheses;
3. at least three independent evidence types;
4. at least one visual/spatial/timeline reasoning task;
5. at least one contradiction or hidden-link task;
6. a real historical answer/outcome strong enough for reveal;
7. sufficient primary/official material to avoid invented filler.

## 10. Current lead candidate — Patricia Moreno / Rodney Daniels

Why it is stronger for the new format:
- bounded physical scene: third-floor apartment + fire escape;
- victim found on landing with gunshot wound;
- no forced entry;
- limited set of people present in apartment;
- projectile / trajectory information;
- suspect claimed to be asleep in armchair;
- evidence of access to handguns;
- later witness saw a male standing over victim and retreating into apartment;
- later information challenged the old alibi and described hiding/disposal of weapon;
- real 2023 first-degree murder conviction.

### Potential playable vertical slice

#### Task 1 — Where could the shot have come from?
Show a source-grounded schematic of apartment doorway / fire escape and trajectory constraints. Player marks viable shooter zone before names are emphasized.

Output: physical scene sharply narrows the hypothesis space.

#### Task 2 — Who could occupy that zone?
Player overlays known occupants / access and tests outside-intruder vs inside-apartment hypotheses.

Output: no-forced-entry and occupancy become reasoning constraints, not prose.

#### Task 3 — Does Daniels' account fit?
Place his sleeping-armchair account on the timeline/spatial view. Player identifies what must be true for his account to work.

Output: explicit testable hypothesis.

#### Task 4 — New witness
Do not simply show prose. Ask player to place the witness' observation on the existing reconstruction and choose which earlier hypotheses it strengthens/weakens.

#### Task 5 — Broken alibi layer
Reveal the later account about the alibi witness. Player must update the suspect matrix.

#### Final — Commit before reveal
Player submits:
- shooter hypothesis;
- location of shot;
- why alternative entry/escape theory fails or remains possible;
- which evidence is strongest and which is weakest.

Only then show arrest / trial / conviction history.

## 11. Prototype rule

Do not build another full case first.

Build a 10–15 minute vertical slice containing only:
- atmospheric opening;
- one visual scene reconstruction;
- one real deduction;
- one hypothesis update;
- one commit decision.

User tests that slice before the rest of the case is implemented.

Success criterion: the user spontaneously starts reasoning aloud (`если выстрел отсюда...`, `тогда этот человек не мог...`, `значит алиби не сходится...`).

If that does not happen, stop and redesign before adding content.
