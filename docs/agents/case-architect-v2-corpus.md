# Mystery Logic — Case Architect v2 / Corpus Intelligence

Status: DRAFT IMPLEMENTATION SPEC
Extends:
- docs/agents/case-architect-v1-wow.md
- docs/workstreams/mystery-corpus.md

Updated: 2026-09-23

## 0. Purpose

Case Architect v2 preserves every v1 quality gate and adds externalized detective intelligence.

v2 must be better at:
- finding non-obvious mechanisms;
- avoiding self-cloning;
- testing alternatives;
- discovering impossible knowledge;
- constructing evidence that discriminates between theories;
- learning from real investigative structures;
- recognizing similarity to existing stories before production effort is spent.

The corpus is advisory evidence, never a license to copy.

## 1. Core architecture

Case Architect v2 is an orchestrator over independent cells:

1. Portfolio Gap Analyst
2. Corpus Retriever
3. Concept Tournament
4. Originality Engine
5. Canon Builder
6. Canon Validator
7. Character Causality Cell
8. Evidence Graph Builder
9. Theory Engine
10. Player Plot Editor
11. Blind Investigator
12. Technical Reality Cell
13. Artifact Authenticity Director
14. Editorial Jury
15. WOW / Release Gates

Critical rule:
cells that must be solution-agnostic do not receive private solution context.

## 2. Corpus retrieval contract

Before concept selection, retrieve patterns across multiple source families.

Default retrieval should diversify by:
- real vs fictional;
- incident type;
- mechanism;
- evidence type;
- setting;
- social system;
- decade/jurisdiction when relevant.

A single famous work must not dominate retrieval.

For each retrieved item return only:
- Case DNA fields relevant to the query;
- provenance;
- rights policy;
- similarity dimensions;
- short abstracted lesson.

Do not pass raw protected source text downstream unless separately authorized.

## 3. Concept tournament v2

Generate 10–12 divergent seeds as in v1.

For each seed add:
- corpus novelty notes;
- closest known structural neighbors;
- mechanism uniqueness;
- portfolio overlap;
- likely evidence diversity;
- signature-action potential.

Reject a seed if:
- its main value is recognizably borrowed from one source;
- clue topology and reveal are both highly similar to the same source;
- only cosmetic changes distinguish it;
- corpus evidence shows the mechanic is saturated and the seed adds no new player action.

## 4. Originality Engine

Originality is multidimensional.

Compare:
- incident similarity;
- mechanism similarity;
- motive similarity;
- character-role topology;
- evidence topology;
- hypothesis/reversal curve;
- decisive proof;
- reveal structure;
- signature action.

Do NOT use a single scalar as the editorial decision.

Output:
- nearest structural neighbors;
- matching dimensions;
- differing dimensions;
- risk level;
- redesign target.

A high textual similarity can be harmless if structural content differs.
A low textual similarity can still hide structural copying.

## 5. Canon as executable structure

Private CANON should be representable as Case DNA plus private solution fields.

Every material fact should be attributable to:
- event;
- actor;
- observation;
- record;
- inference.

Every character statement should be classifiable as:
- true known fact;
- belief/error;
- omission;
- lie;
- inference;
- unknown.

Impossible knowledge is a hard error unless explicitly caused by a canonical information channel.

## 6. Evidence graph contract

Each evidence item must specify:
- provenance;
- creator/source;
- creation reason;
- availability stage;
- reliability;
- what it directly establishes;
- theories it supports;
- theories it weakens;
- whether it is essential;
- independent corroboration.

The graph must support minimum-sufficient-proof testing.

## 7. Theory Engine

Theory Engine must run AFTER a coherent canon exists but BEFORE polished production.

Inputs:
- player-visible facts by stage;
- evidence graph;
- character public behavior;
- no privileged author explanation beyond data necessary to test consistency.

Generate plausible competing theories.

For each theory:
- explanatory coverage;
- assumptions required;
- contradictions;
- unresolved facts;
- discriminating evidence needed.

Hard failure:
a non-canonical theory remains equally sufficient at the final accusation point.

Warning:
canonical theory wins only because of obscure specialist knowledge unavailable to the player.

## 8. Counterfactual generator

Automatically create counterfactuals:
- culprit innocent;
- suspect B culprit;
- one timestamp wrong;
- one witness absent;
- one record forged;
- one physical clue misattributed;
- one institutional process behaves normally rather than conveniently.

Check whether the mystery survives and whether expected secondary traces exist.

## 9. Blind Investigator protocol

Blind Investigator is a separate context boundary.

It receives only current player-facing packet/stage state.

At each checkpoint produce:
- top 3 theories;
- confidence;
- strongest supporting fact;
- strongest contradiction;
- next action;
- confusion/friction;
- whether a deduction was earned, guessed or UI-led.

Only after completion may the orchestrator compare the blind path with CANON.

Leakage of culprit, intended comparison, or decisive clue labels invalidates the run.

## 10. Multi-blind mode

For flagship candidates, run multiple investigator profiles:
- forensic;
- psychology-first;
- skeptical lawyer;
- impulsive;
- minimalist;
- completionist;
- casual;
- genre-savvy;
- stuck;
- adversarial.

Diversity of mid-game theories is desirable.
Final proof convergence is required.

## 11. Corpus learning loop

After a released Mystery Logic case:
- ingest spoiler-safe analytics;
- ingest editorial postmortem;
- record failed hypotheses and clue misses;
- update pattern memory.

Do not directly optimize toward lower difficulty.

Classify observed problems:
- desirable difficulty;
- unclear language;
- hidden affordance;
- weak evidence scent;
- unfair missing fact;
- pacing friction;
- technical contradiction.

## 12. Creator mode

Future Studio modes:
- Create from zero
- Improve my concept
- Repair logic
- Make harder
- Check fair play
- Check originality
- Build evidence graph
- Prepare for publication

Case Architect must explain defects before rewriting them.

For third-party creators, preserve author ownership:
the system proposes repairs and alternatives rather than silently replacing the case.

## 13. Source-use safety

Case Architect may learn abstractions from sources.

It must not:
- reproduce source passages;
- recreate one protected plot with renamed characters;
- imitate a living writer on request;
- expose private creator submissions to other creators;
- use one creator's private CANON as a retrieval source for another without permission.

## 14. Acceptance criteria for v2 pilot

v2 pilot passes only if, on a real Mystery Logic Premium brief:
- concept finalists are at least as compelling as v1;
- nearest-neighbor risks are visible before CANON;
- evidence graph has fewer unsupported jumps;
- Theory Engine finds at least useful adversarial alternatives;
- Blind Investigator can progress without author coaching;
- no private source payload leaks into generated player content.

If v2 adds complexity without measurable quality improvement, simplify it.
