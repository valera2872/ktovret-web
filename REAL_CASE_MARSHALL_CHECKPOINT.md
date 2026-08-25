# Mystery Logic — real case Marshall checkpoint

Checkpoint date: 2026-08-26

## Repository state

- Repository: `valera2872/ktovret-web`
- Draft PR: `#97`
- Branch: `feature/real-case-marshall-prototype`
- Base: `main`
- `main` is intentionally untouched. Do not merge without explicit user approval.
- Final fully tested **v2 code head**: `6677b507a354cf57596f367c2e9aa993c6e49f06`.
- Dedicated workflow: `Real case Marshall prototype` **run #70** — success.
- Artifact: `real-case-marshall-smoke`, id `9584764475`.
- On the same head **15 project workflows succeeded**. `Live Last Aria Release Gate` was skipped as inapplicable, not failed.
- Any later branch head may differ only because of this checkpoint / PR documentation.

## Critical product pivot from the first real user walkthrough

The user actually began playing the old linear version and immediately exposed the central product problem.

First, S00 was unclear. More importantly, S06 (`Разделите тезисы по силе подтверждения...`) made the user stop; they said this was the point where they would quit and ask for a refund.

Then the user identified the deeper problem: the player did not feel like an investigator. The old flow showed a finished archive in a fixed S00→S25 sequence, expected the player to remember witness material and then classify / agree with conclusions. It felt like watching an interactive documentary rather than conducting an investigation.

The user explicitly requested a redesign where the investigator chooses what to do, whom to question, which line to follow and may reach dead ends. Important discoveries must be recorded automatically rather than memorized.

This feedback **overrides the old v13 screen/mechanics architecture**. v13 remains source-of-truth for historical facts, provenance and evidentiary boundaries, not for the former linear quiz UX.

## New governing product rule

The core loop is now:

`происшествие → ВАШИ ДЕЙСТВИЯ? → выбранное следственное действие → реальный source-grounded result → auto case-board update → newly available actions`

The player chooses the route. Historical events still happen on their real dates, but they do not force a single reading order.

No fabricated evidence, witness dialogue, suspects, physical findings or alternate-history outcomes are allowed. If an action has no documented resolution, the result remains an open / insufficiently checked line rather than inventing an answer.

## New route implementation

Working route remains:

`realnye-dela/arhiv-71-05/`

- `noindex,follow`
- not in sitemap/catalogue
- independent from payment, 15/85, 23:17, Room 407 and Last Aria

The route now loads only:

- `assets/real-case-marshall-investigation.js?v=2.0.0`
- `assets/real-case-marshall-investigation.css?v=2.0.0`

It no longer loads the old linear runtime / v13 guards / presentation sidecar. Those old files remain in the repository as archival/reference implementation until v2 is accepted.

New LocalStorage key:

`ml-realcase-71-05-investigation-v2`

## Investigator-driven v2 gameplay

### Opening

Player receives only the anonymized incident:

- late night;
- city park;
- two teenagers wounded with a knife;
- one dies, one survives;
- offender unknown;
- names/place/outcome hidden.

The role is explicit: the player leads the check and chooses what to inspect / whom to question / which line to keep open. The interface states that history is not being rewritten and that only source-grounded material is used.

### First free actions

On the first desk the player sees **`Ваши действия?`**, not a next-page button. Initial choices include:

- `Осмотреть место происшествия`
- `Допросить выжившего`
- `Найти свидетелей в районе парка`

No mandatory order.

### Witness discovery and questioning

After finding witnesses, player chooses among:

- Witness A — first statement;
- Witness B — first statement;
- Witnesses C/D — joint statement.

Inside a witness material, the interface asks **what the player wants to clarify**. Example question topics:

- Кто ещё был рядом?
- Вы видели сам удар?
- Вы можете опознать этих мужчин?
- Куда они направились?

These are navigation choices over the preserved written source. Responses are source-grounded summaries, not generated dialogue.

### Auto case board

The player is never required to memorize earlier pages.

Significant discoveries automatically enter `ДОСКА ДЕЛА` with:

- evidence/lead status;
- concise conclusion;
- evidentiary limitation;
- source id / source title.

Board examples:

- scene not secured/searched;
- survivor points to two other men;
- Witness A links knife to one of the other men;
- Witness B sees two men running to a white Volkswagen;
- Witness B's first statement does not describe the stabbing;
- C/D independently describe two men;
- witness limitation / contradiction / prosecution theory / later reinvestigation findings.

Desktop keeps the board visible as an independent scrollable rail. Mobile exposes it through `Доска дела N`.

### Open investigative lines

The player can choose to check lines such as:

- `Проверить двух других мужчин`
- `Проверить белый Volkswagen`

If the current source packet cannot identify somebody or close the line, the game says so. It does not invent a plate, suspect or result.

### 4 June historical event

After enough early investigative work, history advances and the desk announces:

`В деле появились новые показания`

The player then chooses when to open the second statements of Witness A / B and when to compare them with the earlier versions.

The old five-row dropdown/redline quiz has been removed. Comparison itself records the meaningful contradiction on the board.

The player can separately choose:

`Выяснить, почему показания изменились`

At that historical point, the game correctly refuses to jump ahead to the later Commission explanation. It records only that the reason was not independently resolved in the contemporary file.

### Crown file and independent decision

Player opens the Crown Statement of Facts as a **prosecution theory**, not established fact.

Then the game asks:

`Что вы делаете с этим файлом?`

Options include:

- support the prosecution version;
- return the file for additional investigation;
- keep the two-other-men line open.

No citation-memory quiz. The complete case board remains beside the decision. An optional one-sentence reason may be written but is not required.

The player's decision is preserved separately from history; the historical case still proceeds as it actually did.

### Later lines / reinvestigation

After the historical conviction, player can choose which later signals to inspect:

- new eyewitness statement ten days after conviction;
- 1974 report concerning a knife;
- 1982 RCMP reinvestigation.

Identity stays `Мужчина X` until reveal.

Royal Commission findings remain distinct from reinvestigation evidence.

### Reveal / sources / epilogue

Only after Commission stage does v2 reveal:

- Donald Marshall Jr.;
- Sandy Seale;
- Sydney, Nova Scotia;
- Roy Ebsary;
- Marshall's 11 years imprisonment;
- Ebsary manslaughter conviction after three trials.

The reveal also shows the player's own pre-reveal decision.

Official source ledger and systemic epilogue follow. Numeric game score was removed from the new core; the ending emphasizes the player's investigative route rather than a school-style grade.

## Non-fiction boundaries

Canonical historical/source packet: `real_cases_research_database_v13.xlsx` in File Library.

Preserve:

- witness claim vs fact distinction;
- first vs second statement distinction;
- Crown theory vs established fact;
- reinvestigation evidence vs Royal Commission finding;
- no fake facsimiles / commercial archive scans without clearance;
- no invented dialogue or procedural result;
- no claim that repetition automatically proves truth;
- no premature statement that police pressure caused changes before the later official finding is opened;
- names / exact outcome hidden until reveal.

## Source-grounded key facts used by v2

- Royal Commission found the first responding officers did not cordon/search the scene or question witnesses there; nobody remained to protect the scene after the victim was taken to hospital.
- Witness A first statement described two other men and attributed the knife/stabbing to one of them; A could not identify the men by face.
- Witness B first statement described two men running from the direction of screams and entering a white Volkswagen; it did not make B an eyewitness to the stabbing.
- C/D independently described two other men in/near the park but did not claim to witness the stabbing.
- On 4 June A and B materially changed their accounts toward directly incriminating the survivor.
- A's second statement also retained the survivor's reference to `the 2 fellows`, creating an internal tension in that document.
- Crown Statement of Facts built its prosecution theory around the later accounts.
- Later evidence included a new witness ten days after conviction, a 1974 family report concerning a knife, and 1982 reinvestigation evidence.
- Royal Commission later found the incriminating second statements untrue and linked them to police suggestions/pressure; it also found broader systemic failures.
- Final reveal remains sourced to Commission findings.

## CI / visual verification — v2 clean baseline

Final tested v2 code head:

`6677b507a354cf57596f367c2e9aa993c6e49f06`

Dedicated `Real case Marshall prototype` **run #70** passed:

1. JavaScript syntax validation.
2. Investigator-driven browser smoke.
3. New graph visual audit.
4. Artifact upload.

Smoke v2 verifies:

- new route loads only v2 engine/style;
- free-action desk exists;
- witness-selection state exists;
- 4 June event exists;
- pre-trial decision state exists;
- later-line state exists;
- reveal exists;
- names / Roy Ebsary do not appear in pre-reveal DOM;
- old quiz language such as `Проверить классификацию`, `2+ источника`, `Статус изменения` and `подтвердить минимум четыре изменения` is forbidden;
- desktop/mobile screenshots render without the old horizontal-overflow regression.

Visual audit now covers 11 graph states × 2 viewports = **22 screenshots**:

- opening
- desk
- witnesses
- June 4
- contradictions
- decision
- later
- Commission
- reveal
- sources
- epilogue

Manually spot-checked from run #70:

- opening desktop/mobile;
- first free-action desk desktop/mobile;
- witness-choice desk;
- pre-trial decision desktop/mobile;
- later-lines desk;
- reveal desktop/mobile.

No obvious layout break or systemic overflow was found. The first desk clearly reads as player agency rather than a reading sequence.

On the same tested head, 15 project workflows completed successfully, including main web validation, production bundle, SEO, legal, global stats, challenge, release gates, co-op visual smoke, Room 407, Last Aria and the dedicated Marshall workflow. `Live Last Aria Release Gate` was skipped as unrelated.

## Regression lessons to preserve

From the old version:

- MutationObserver presentation changes must be idempotent.
- Completion state must not be inferred from a visible score card.
- CSS can override HTML `hidden`; visual smoke is mandatory.

From the first real user walkthrough:

- Do not confuse interaction with agency.
- Do not make the player memorize documents before a later quiz.
- Do not turn source comparison into dropdown taxonomy.
- The primary recurring question should be `Что вы делаете дальше?`, not `Выберите правильную классификацию`.
- A premium visual shell cannot rescue a spectator role.

## Exact next action

1. Keep PR #97 draft and `main` untouched.
2. Give the user an isolated preview of exact tested v2 head `6677b507…`.
3. User begins a fresh manual walkthrough from the opening.
4. Collect reactions naturally while the user plays, especially whether the new desk creates a real feeling of conducting the investigation.
5. Fix actual gameplay/visual failures found in that walkthrough.
6. Do not merge until explicit user acceptance.
