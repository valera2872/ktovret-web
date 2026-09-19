# Mystery Logic Solo 02 — «Нулевая отметка»

Status: DESIGN GATE / NOT READY TO IMPLEMENT
Date: 2026-09-04
Purpose: evidence-first benchmark and design contract for the second flagship solo investigation.

## 1. Non-negotiable release standard

This case must pass `CASE_RELEASE_GATE.md` before any publication claim. In particular:

- G1 Evidence & Fair-Play: every required conclusion must be provable before reveal; no reveal-only facts; motive is never proof.
- G2 Adversarial Countertheory: actively try to acquit the canonical culprit and explain the case through every other suspect, accident, accomplice, frame-up, planted evidence, forged/buggy logs and alternate time window.
- G3 Blind Spoiler Audit: title, cards, stage labels, material titles, hints and UI must stay answer-neutral.
- G4 Solvability/Difficulty: optional investigation choices must never hide a unique mandatory clue.
- G5 First-Time UX: within 30–60 seconds the player must understand what happened, their role, what to do now and how to proceed.
- G6/G8/G9: full black-box flow, regressions and exact production artifact validation.

No prose-first writing. Lock the causal model and evidence graph before writing the final narrative materials.

## 2. Competitive benchmark — what to take, what not to copy

### Clurio
Sources:
- https://clurio.ru/news/odinochnye-rassledovaniya
- https://clurio.ru/news/bolshoe-obnovlenie-solo-del
- https://clurio.ru/how-to-play

Take:
- solo as its own interaction model, not simulated multiplayer;
- scene exploration + player-chosen actions;
- consequence feedback after an action, not merely “opened material”;
- deduction board that explains why a proposed link is accepted/rejected without revealing the answer;
- contextual help that appears at the point of friction;
- final reconstruction from confirmed deductions;
- optional investigation-resource mechanic in a form that creates choice without a timer;
- autosave/resume and a strong post-final next-case path.

Do not copy:
- their exact scene/deduction presentation;
- wording, visual identity or case premises;
- a resource mechanic that can make the canonical case unsolvable after a bad choice.

### Profile Detective
Source:
- https://profiledetective.ru/

Take:
- heterogeneous evidence as a core source of immersion: photos, reports, sounds, sites/logs, physical-looking artifacts;
- multiple investigative lines inside one case;
- atmosphere strong enough that players discuss the case after play;
- occasional embedded puzzle/cipher only when it is diegetic and advances the investigation.

Do not copy:
- 2–3 hour default runtime;
- dependence on physical delivery or external sites;
- their existing story territories: motel/hotel, 911 call from a ship, manor, camp, office threat, etc.

### Dramtezi
Sources:
- https://dramtezi.ru/game/detective/
- https://dramtezi.ru/game/detective/mayak-molchaniya/
- https://dramtezi.ru/game/detective/10krasotok/

Take:
- “lie ≠ murder”: a suspect may lie for an unrelated reason and still be innocent of the main crime;
- evidence whose meaning changes on a second look;
- an explicit notebook/chronology/version layer;
- a strong opening loop: inspection → contradiction → deduction → re-check → accusation.

Do not copy:
- film-studio / stop-frame territory (`Стоп-кадр` already occupies it);
- lighthouse, gallery or other existing premises;
- 7–8 endings merely for branching volume if that weakens a single provable truth.

### Rassledovanie.online
Source:
- https://rassledovanie.online/

Take:
- strong sense of investigator agency: choose whom/what/where to check next;
- varied digital surfaces and characters;
- map as a meaningful investigation layer rather than decoration.

Do not copy:
- Telegram dependency for the core solo case;
- 3–4 hour default runtime;
- external-web sprawl that breaks the premium single-product experience.

### Kod Goroda
Source:
- https://kodgoroda.games/

Take:
- navigable spatial model and meaningful location choice;
- a world that feels larger than a stack of documents.

Do not copy:
- 1000+ location scope. This solo should use 6–8 meaningful locations, each with a reason to exist.

## 3. Rejected concepts after benchmark

### «Последний дубль» / film studio
Rejected. Dramtezi already has `Стоп-кадр` on a film-studio murder and also uses frame-by-frame visual evidence in `10 красоток`. Too derivative.

### Emergency/911 dispatch as the main hook
Rejected for now. Profile Detective already advertises a case built around a barely audible 911 call from a ship. The mechanic can be reused elsewhere later, but not as the flagship premise immediately after this benchmark.

## 4. Selected territory

Working title: **«Нулевая отметка»**

Setting: a near-finished underground metro construction section during a night commissioning shift.

Core promise:
> An engineer is found dead behind a maintenance gate in a section the access system says nobody else entered. Four people were working below ground. One of them is clearly lying — but that lie is not the murder.

Why this territory:
- not found as a central premise among the surveyed competitors;
- naturally supports premium spatial investigation;
- supports logs, plans, radio, helmet-cam imagery, work permits, test reports, sensor timelines and physical traces without inventing fantasy technology;
- allows a fair “impossible access” mystery that can be dismantled by the player through construction-state evidence;
- visually distinct from Hotel 407 and existing Mystery Logic cases.

Target runtime: **70–90 minutes**.
Target cast: **4 primary suspects + victim**.
Target materials: **20–24**, across four acts.
Target locations: **6–8** meaningful underground/surface locations.
Target major reversals: **2**.

## 5. Provisional causal model — must survive G2 before lock

Victim: **Anton Voronov**, geotechnical/quality engineer on the night shift.

Provisional canonical culprit: **Irina Belova**, quality manager for the project.

Provisional motive: Anton discovers that an original concrete-core test from the K-6 section failed specification and that the published quality packet contains a substituted sample/reference. He intends to stop morning acceptance and preserve the original chain-of-custody record.

Provisional method/opportunity:
- The current operational plan makes chamber K-06 look accessible only through maintenance gate G-6.
- A temporary construction cross-passage CP-6 still physically connects the service gallery to K-06 because the delivered fire-door assembly has not yet been installed/accepted.
- Irina uses CP-6, confronts Anton in K-06, kills him during the confrontation, and exits by the same temporary route.
- The access log therefore remains internally consistent: it records G-6 correctly, but G-6 is not the only physical route.

Important: this is a hypothesis for adversarial testing, not yet canon. If any alternate suspect can explain all required evidence with equal or lower assumptions, rewrite the case.

## 6. False first solution

Primary false suspect: **Roman Lebedev**, electrical technician.

He really lies about his movements. He entered a restricted service gallery after the formal lockout window to correct/retrieve something that would expose a safety-procedure violation. His action is also connected to a short emergency-lighting event.

Why the player should suspect him:
- his stated location conflicts with a tool/maintenance record;
- his unauthorized action overlaps the critical time window;
- the emergency-lighting interruption initially looks like deliberate cover.

Why he is not the murderer:
- the violation explains the lighting anomaly but does not provide a route to K-06 at the required moment;
- an independent timeline/material must place his actual violation away from the murder scene;
- the case must explicitly support the distinction: **he lied, but about a different offence**.

This false solution must be strong enough to be tempting but must fail on a concrete fact, not because the finale says so.

## 7. Suspect set — provisional

1. **Irina Belova — quality manager**
   - apparent role: protects the morning acceptance schedule;
   - hidden issue: substituted/altered quality chain;
   - must have at least two independent evidence lines connecting motive + opportunity + knowledge/action.

2. **Roman Lebedev — electrical technician**
   - apparent role: strongest early suspect;
   - real secret: unauthorized safety-procedure breach;
   - lie is real but unrelated to the murder.

3. **Oleg Markin — maintenance-rail/cart operator**
   - apparent role: knows temporary routes and moved equipment near K-6;
   - real secret: off-book delivery/retrieval or schedule shortcut that creates a plausible alternate route;
   - must be cleanly excludable from the fatal window by independent evidence.

4. **Svetlana Orlova — night safety coordinator**
   - apparent role: signed/is responsible for section isolation status;
   - real secret: knew CP-6 was not physically sealed but left the paperwork unchanged to avoid a delay;
   - her lie creates the “locked section” illusion but she must not automatically become the culprit.

Victim: **Anton Voronov — quality/geotechnical engineer**
- discovers the discrepancy;
- leaves an incomplete but fair trail, not a posthumous exposition dump.

Names are placeholders until narrative lock and duplication check against existing Mystery Logic cast.

## 8. Four-act investigation architecture

### ACT I — «Закрытый участок»
Goal: establish the apparent impossible-access problem.

Candidate materials:
1. Scene inspection of K-06.
2. Current operational plan of K-6.
3. G-6 access log.
4. First statements of the four suspects.
5. Victim’s shift note / last task list.
6. Helmet-camera metadata/still before cutoff.

Player checkpoint:
- What is actually established by the access log?
- Correct conceptual answer: G-6 saw no second entry; this does **not yet prove G-6 was the only physical route**.

### ACT II — «Чужая ложь»
Goal: make Roman look increasingly guilty, then let the player discover that his lie explains a different event.

Candidate materials:
7. Electrical tool checkout / work permit.
8. Emergency-lighting timeline (approx. 60–90 seconds).
9. Radio transcript around the interruption.
10. Restricted-gallery maintenance ticket.
11. Independent evidence of Roman’s actual location/action.
12. Optional expert check on lighting controller raw events.

Checkpoint:
- Does Roman’s lie explain the murder, or only the blackout/safety breach?

### ACT III — «Проход, которого нет»
Goal: destroy the locked-room model by proving construction state differs from operational paperwork.

Candidate materials:
13. Revision drawing showing CP-6.
14. Fire-door delivery record.
15. Installation/acceptance record showing delivery ≠ installation.
16. Dated site photo or helmet-cam frame showing CP-6 still open.
17. Ventilation/airflow or dust-control record consistent with the open passage.
18. Spatial map update that unlocks CP-6 as a navigable location.

Major reversal #1:
- K-06 was never physically sealed from the service gallery during the fatal window.

Checkpoint:
- Which suspects now have a physically possible route, and which still fail the timeline?

### ACT IV — «Что не должно было дожить до утра»
Goal: establish motive and identify the culprit through independent lines, then reconstruct the whole sequence.

Candidate materials:
19. Original concrete-core/sample ledger.
20. Published quality packet with substituted sample/reference.
21. File/version or chain-of-custody metadata linking the substitution workflow.
22. A knowledge-leak statement/radio line that only makes sense from the underground service-gallery position; this must be grounded by a separate acoustic/spatial material, not trivia.
23. Independent physical/digital corroboration placing the culprit on the CP-6 route.
24. Victim’s unsent/draft message or morning acceptance hold note — motive context only, never sole proof.

Major reversal #2:
- The “murder route” and the “document fraud” are the same chain: the hidden construction-state discrepancy allowed access, while the quality discrepancy supplied motive.

## 9. Evidence media budget

The case must not become 24 beige text cards. Minimum media mix:

- 1 interactive/spatial tunnel plan;
- 1 access-log visualization;
- 1 emergency-lighting/sensor timeline graph;
- 2–3 photographic/helmet-cam stills;
- 1 radio/audio-style material (actual audio desirable later; transcript must remain sufficient for accessibility);
- 2 physical-looking scanned forms with annotations/stamps;
- 1 sample label / chain-of-custody visual;
- 1 version-history/diff style material;
- short witness statements/messages only where they advance a deduction.

Every act must introduce at least one new evidence medium.

## 10. Player agency — design target

### A. Investigation map
6–8 locations, unlocked progressively. The map is a state model, not decorative navigation.

Candidate nodes:
- surface site office;
- main shaft;
- service gallery S-2;
- maintenance gate G-6;
- chamber K-06;
- temporary cross-passage CP-6;
- electrical cabinet E-4;
- material/sample store.

### B. Expert requests
Player receives **3 optional expert-request credits** from a set of ~6 checks.

Hard rule: any combination of three must leave the canonical case solvable. Requests provide redundant corroboration, shortcut, characterization or confidence — never a unique mandatory fact.

Candidate requests:
- raw lighting-controller events;
- raw G-6 badge/access export;
- photo timestamp verification;
- ventilation/dust-control history;
- sample-label comparison;
- radio-channel archive.

G4 must test all meaningful request combinations.

### C. Deduction board upgrade
Beyond “pin to board”:
- link two materials;
- choose relation: `подтверждает`, `противоречит`, `объясняет`;
- accepted links create named deductions;
- rejected links explain **why the relation is unsupported**, without revealing the correct link.

### D. Consequence journal
After meaningful actions, store not just the action but its consequence:
- “Проверили аварийное освещение → отключение действительно было, но оно не открывает путь в K-06.”
- “Сверили доставку двери → дверь доставлена, но акт установки отсутствует.”

This should reduce rereading and support resume.

## 11. Final reconstruction — not just “who did it?”

Final should require at least 5 components:

1. **Where** did the fatal confrontation occur?
2. **How** was K-06 entered/exited without a G-6 event?
3. **Which early lie** was real but unrelated to the murder?
4. **What was being concealed** in the quality records?
5. **Who** committed the murder and which two independent evidence lines prove it?

Wrong complete reconstructions are accepted as player-owned theories and compared only at reveal, as in Solo 407.

## 12. “Wow” acceptance criteria

The case is not approved merely because it is harder than 407. It must deliver:

- hook understandable in <60 seconds;
- first strong suspect by ~15–20 minutes;
- a fair but surprising collapse of the locked-section assumption;
- at least one material whose meaning changes when re-read after CP-6 is discovered;
- at least two independent proof lines against the culprit;
- no single magic log / badge / credential that proves identity by itself;
- no mandatory external knowledge about metro engineering;
- a final reconstruction that makes earlier “background” evidence click into place;
- premium visual variety and readable contrast on desktop/mobile;
- replayable discussion point: “The lie was true evidence — just evidence of the wrong offence.”

## 13. Mandatory adversarial questions before prose lock

- Can Roman be the killer if we reinterpret the lighting outage?
- Can Svetlana use CP-6 and frame Irina through the sample substitution?
- Can Oleg enter via CP-6 during an unlogged equipment move?
- Can Irina’s account/device actions be performed by someone else?
- Can the quality discrepancy be an innocent clerical/sample-number error?
- Can CP-6 have been physically blocked despite missing acceptance paperwork?
- Can Anton have died accidentally and the later concealment be unrelated?
- Can any evidence be planted after the death?
- Does every time/distance/location transition fit a realistic walking/working window?
- Is there a solution path that never spends the “right” expert-request credit?

Any “yes, equally well” requires redesign before implementation.

## 14. Next implementation gate

Do not build UI or final prose yet.

Next deliverable:
1. lock exact timeline to the minute;
2. build suspect opportunity matrix;
3. build evidence → inference → conclusion graph;
4. run G2 countertheories on the frozen causal model;
5. only then write the 20–24 player-facing materials and build the premium UI.
