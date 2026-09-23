# Mystery Logic — Mystery Corpus / Studio Intelligence

Status: ACTIVE / M5 BLIND ORCHESTRATION PROTOTYPE
Workstream: CORPUS-01
Updated: 2026-09-23
Autonomy: L1 PROPOSE; implementation in non-production branch only unless explicitly approved
Production writes: FORBIDDEN
Supabase production schema changes: FORBIDDEN
Private canon / source payloads: NEVER store in public GitHub

## 1. Decision

Mystery Corpus remains inside the Mystery Logic product and project context.

Do NOT create a separate ChatGPT Project at this stage.

Reason:
- Case Architect, Premium cases, Studio, analytics and release gates share one product model;
- splitting the conversational/project context now would duplicate strategy and cause drift;
- the corpus is infrastructure for Mystery Logic, not a separate customer-facing product.

Technical separation is still required:
- public `ktovret-web`: spoiler-safe specs, schemas, validators, orchestration code and source manifests;
- private Library/data layer: detailed Case DNA, source payloads, copyrighted/licensed material, embeddings, creator submissions, private CANON and solution data;
- production website: no corpus payloads and no private canon.

## 2. Goal

Build a reusable detective-intelligence layer that improves originality, causal depth, evidence design, red herrings, hypothesis dynamics, fair play, character lies, technical realism, final reconstruction and portfolio diversity.

The corpus must NOT be a plot-copying library. Its unit of knowledge is abstract Case DNA: mechanisms, evidence topology, hypothesis shifts, lie structures, causal patterns and editorial lessons.

## 3. Product relationship

```
Mystery Logic Studio
        |
        v
Case Architect v2
   |      |      |
   v      v      v
Corpus  Theory  Blind
Search  Engine  Investigator
        |
        v
Canon Validator
        |
        v
WOW / G0-G9 / Cognitive Gate
        |
        v
Game Engine
```

Case Architect is the intelligence layer. Studio is the authoring environment. Mystery Corpus is the research/pattern memory. Release Gate remains the shipping authority.

## 4. Rights boundary

Every source record carries machine-readable:
- source type;
- provenance;
- rights status;
- ingestion policy;
- source date/jurisdiction when applicable;
- whether raw text retention is allowed.

Unknown rights status defaults to restrictive handling.

For analysis-only copyrighted works:
- do not retain full scripts/books in public GitHub;
- do not expose long source text to downstream generation;
- extract abstract Case DNA and similarity fingerprints;
- never recreate one protected plot with renamed characters.

## 5. Case DNA v1

Canonical schema:
`docs/schemas/case-dna-v1.schema.json`

Core layers:
1. provenance / rights;
2. incident;
3. mechanism;
4. characters and knowledge;
5. timeline;
6. evidence graph;
7. lies and misdirection;
8. hypotheses;
9. deduction chain;
10. reveal/recontextualization;
11. fair-play attributes;
12. signature/WOW attributes;
13. originality fingerprint;
14. editorial lessons.

## 6. Retrieval principles

Retrieve patterns, not stories.

Good retrieval:
- non-culpability lies;
- real mechanisms creating misleading timestamps;
- evidence combinations discriminating two hypotheses;
- institutional records created automatically by a process;
- recurring fair-play failures.

Bad retrieval:
- "rewrite this film with different names";
- copying a distinctive reveal, relationship topology and clue chain as one package.

## 7. Originality Engine

Compare:
- incident;
- setting;
- mechanism;
- motive structure;
- character topology;
- evidence topology;
- hypothesis curve;
- reversal;
- decisive proof;
- signature action.

Similarity must be decomposable. A warning must explain WHY cases are similar.

## 8. Theory Engine

Theory Engine receives player-available facts and attempts competing explanations:
- another suspect/cause;
- accident/no crime;
- witness error rather than lie;
- timestamp/process error;
- forged/misattributed evidence;
- canonical culprit innocent.

Failure: a non-canonical theory explains final available evidence as well as the canonical model.

## 9. Blind Investigator

Blind Investigator MUST NOT receive culprit, private CANON, intended solve path, author notes or important-clue labels.

At each stage record:
- current theories;
- confidence;
- established facts;
- unresolved questions;
- next desired action;
- theory changes;
- perceived unfairness/confusion.

## 10. Milestones

### M0 — architecture — COMPLETE
Delivered:
- workstream;
- Case Architect v2 spec;
- Case DNA v1 schema;
- single-record validator;
- privacy/rights boundary.

### M1 — seed corpus — COMPLETE
2026-09-23 seed v0.1:
- 25 curated Case DNA records;
- 14 public-domain detective-fiction records;
- 11 real-investigation records from FBI/SEC public material;
- no raw source texts retained;
- detailed DNA stored privately at:
  `/Mystery Logic/Private/Mystery Corpus/Mystery-Corpus-Seed-v0.1.zip`
- Library file id:
  `libfile_cc1d3f1e835c8191b424a805c134c916`
- ZIP SHA-256:
  `c48cf68d96c47b18153e668da7a1b84f04ce5b5e7bc5ae7b207656ea98e5f4b5`
- all 25 passed reference-integrity / rights-policy / Fair Play hard-check validation;
- public source-only manifest:
  `docs/corpus/source-manifest-v0.1.json`

The seed intentionally includes one unresolved investigation pattern so the system learns to preserve UNKNOWN rather than fabricate closure.

### M2 — corpus 200–300
Only after the pilot proves useful:
- semi-automated ingestion;
- extraction consistency tests;
- taxonomy stabilization.

### M3 — A/B concept test — COMPLETE

Pilot `CORPUS-AB-001` was run on the actual portfolio gap: next flagship-capable Premium Solo.

Method:
- A: 12 concepts from Case Architect v1 without corpus retrieval;
- B: 12 concepts from Case Architect v2 after abstract pattern retrieval;
- same internal editorial rubric;
- all candidate fingerprints checked against the private seed;
- full spoiler-bearing report stored privately:
  `/Mystery Logic/Private/Mystery Corpus/Mystery-Corpus-AB-001.json`
- Library file id:
  `libfile_87d2c63bda88819190ccda7ba97ed9ff`
- report SHA-256:
  `c188667eac2d882aa2007decb7c6e626f1cb645b7e69ee6ffb1633c48a5e33b7`

Internal pilot result (editorial estimate, NOT human-player evidence):
- v1 overall mean: 3.90 / 5;
- v2 overall mean: 4.44 / 5;
- v2 improved most on player agency, causal compression, hypothesis quality, human causality and market originality;
- v2 also exposed structurally derivative concepts before CANON;
- this is sufficient to continue engineering, but does not replace a human blind test.

Top v2 survivors for further concept development:
- `B04 Честное алиби` — strongest abstract causal architecture; needs a concrete real-world process;
- `B07 Учебная тревога` — strongest immediately playable concrete concept;
- `B01 Контрольный запуск` — strong system-failure investigation;
- `B10 Две правды` — strongest player-agency mechanic, needs a concrete incident.

Competitor refresh before pilot:
- Dramtezi currently advertises 21 browser investigations and now uses reconstruction, timelines, evidence combination, multiple outcomes and longer cases;
- Profile Detective emphasizes dense physical/media materials, multiple investigations per case and 1.5–3 hour sessions;
- rassledovanie.online now explicitly markets AI suspects, free-form Telegram interrogation, sites/social profiles/maps and 1–10 player online cases;
- Kod Goroda emphasizes an explorable city, 1000+ locations, team play and monthly cases.
Implication: a Premium Solo cannot differentiate merely through "lots of evidence", branching, maps, locked rooms, timelines or AI dialogue. Mystery Logic needs stronger causal modeling, non-leading agency, evidence confrontation and reconstruction.
Generate concept tournaments for one real Premium portfolio gap:
- Case Architect v1 without corpus;
- Case Architect v2 with the private 25-record seed.

Compare:
- originality;
- causal compression;
- red-herring quality;
- evidence variety;
- hypothesis depth;
- fair-play robustness;
- retell hook;
- structural similarity risk.

Proceed to M2 only if corpus materially improves the result.

### M4 — Originality Engine — ACTIVE

Implemented v0:
- `tools/mystery-corpus/retrieve-patterns.mjs`
  - weighted retrieval over mechanism / proof / reversal / evidence topology;
  - RU query synonym bridge for the pilot;
  - source-family diversity cap;
  - returns abstractions only, not raw source text.
- `tools/mystery-corpus/compare-fingerprints.mjs`
  - decomposes similarity across incident, setting, mechanism, motive, character topology, evidence topology, reversal, decisive proof and signature action;
  - explicitly warns that aggregate similarity is diagnostic only.
- `tests/mystery-corpus-retrieval.test.mjs`
  - retrieval test;
  - structural-comparison test.

Local test state:
- corpus validation: 25/25 VALID;
- validator tests: 3/3 PASS;
- retrieval/originality tests: 2/2 PASS.

M4 hardening completed in v0.2:
- `docs/corpus/fingerprint-taxonomy-v0.1.json` canonicalizes structurally related aliases;
- `tools/mystery-corpus/originality-gate.mjs` emits LOW / MEDIUM / HIGH / CRITICAL neighbor risk plus dimensional rationale;
- `tests/mystery-corpus-originality-gate.test.mjs` verifies semantic alias detection without treating one abstract inspiration as copying.

Gate rerun on v2 pilot finalists:
- B04 `Честное алиби`: PASS / LOW nearest-neighbor risk;
- B07 `Учебная тревога`: REVIEW_NEIGHBORS / MEDIUM;
- B01 `Контрольный запуск`: REVIEW_NEIGHBORS / MEDIUM;
- B10 `Две правды`: REVIEW_NEIGHBORS / MEDIUM.

Rejected/escalated examples:
- B05 `Договор на воздух`: EDITORIAL_REVIEW / HIGH vs Enron-like formal-vs-real structure;
- B08 `Сервисный вход`: EDITORIAL_REVIEW / HIGH vs classic social-invisibility/role-access structure.

This is the intended behavior: corpus patterns may inspire a new concept, but the originality gate can still veto a too-close recombination.

### M5 — Theory + Blind engines — ACTIVE

Theory Engine deterministic foundation implemented:
- `tools/mystery-corpus/theory-audit.mjs`
  - builds per-stage support/contradiction matrix for all declared hypotheses;
  - requires exactly one canonical hypothesis for Mystery Logic cases when run with `--require-canonical`;
  - FAILS when a non-canonical theory reaches final accusation with no explicit player-visible contradiction;
  - warns when canonical proof lacks two independent evidence types;
  - fails Fair Play when reveal introduces an answer-changing new fact;
  - calculates an approximate minimum discriminating evidence set via set-cover logic.
- `tests/mystery-corpus-theory-audit.test.mjs`
  - valid multi-hypothesis case PASS;
  - unresolved alternative FAIL;
  - answer-changing reveal fact FAIL.

Current boundary:
this is a deterministic graph audit over declared theories. It does NOT yet invent missing adversarial theories. The next Theory Engine layer must generate candidate alternatives in a solution-isolated context, then feed them back into Case DNA for deterministic audit.

Blind Investigator interface foundation implemented:
- `docs/schemas/blind-player-packet-v1.schema.json` — strictly player-visible stage packet;
- `docs/schemas/blind-run-v1.schema.json` — stage-by-stage theory/confidence/action record;
- `docs/schemas/adversarial-theory-v1.schema.json` — intake format for independently generated alternative theories;
- `tools/mystery-corpus/validate-blind-boundary.mjs` — rejects solution-bearing metadata such as culprit/canonical/solution/private_canon, author reliability labels and supports/weakens annotations from player packets;
- `tests/mystery-corpus-blind-boundary.test.mjs` — good packet PASS; solution leakage FAIL; author assessment leakage FAIL.

Combined local smoke for retrieval + originality + theory + blind modules on 2026-09-23:
- JavaScript syntax: PASS;
- 10/10 module tests PASS;
- plus earlier corpus validator suite: 3/3 PASS;
- private seed: 25/25 Case DNA VALID.

Blind execution/orchestration layer implemented 2026-09-23:
- `tools/mystery-corpus/build-blind-packet.mjs`
  - converts private Case DNA into a stage-limited `blind_player_packet_v1`;
  - strips mechanism, reveal, canonical labels, supports/weakens and evidence reliability.
- `tools/mystery-corpus/blind-investigator-baseline.mjs`
  - deterministic evidence-first investigator used ONLY for engineering smoke tests;
  - receives only the blind packet.
- `tools/mystery-corpus/run-blind-baseline.mjs`
  - creates per-stage packets;
  - validates the blind boundary before investigator execution;
  - runs the investigator in a separate child process and collects a `blind_run_v1`.
- `tests/mystery-corpus-blind-orchestration.test.mjs`
  - includes a private-solution canary;
  - test fails if hidden mechanism/canonical/reveal text leaks into packet or blind run.
- dedicated CI:
  `.github/workflows/mystery-corpus-ci.yml`
  - Node syntax for every corpus tool;
  - all `mystery-corpus-*.test.mjs` suites.

CI run 35914432677:
- SUCCESS;
- 16 tests;
- 16 PASS;
- 0 FAIL.

B07 engineering smoke:
- used a temporary, non-approved internal fixture derived from concept `B07 Учебная тревога`;
- solution leak check: PASS;
- deterministic baseline selected the equipment-coordinator role as its leading theory already at stage 0;
- because this baseline relies partly on lexical/role overlap, this is NOT evidence that B07 itself is too easy;
- it does demonstrate why the next blind layer must be a genuinely reasoning, stateless AI investigator rather than a keyword heuristic.
- the fixture is engineering-only and is NOT accepted game CANON.

Provider-safe AI boundary added:
- `tools/mystery-corpus/build-blind-investigator-prompt.mjs`
  - builds a provider prompt from the blind packet only;
- `tools/mystery-corpus/validate-blind-run.mjs`
  - rejects evidence IDs that were not available to the player at that stage;
- `docs/agents/blind-investigator-provider-contract-v1.md`
  - formalizes the stateless provider boundary and invalidates any run where the model context previously saw the answer;
- `tests/mystery-corpus-blind-provider.test.mjs`
  - verifies provider prompt isolation and unavailable-evidence rejection.

Important limitation:
the deterministic baseline is only an engineering smoke test. A real AI/human blind evaluation still requires a stateless investigator execution that has never seen Private CANON.

### M6 — Studio Internal
Expose author workflow to Mystery Logic team.

### M7 — Creator Beta
Small invited creator cohort. Marketplace remains later.

## 11. Storage

Current:
- public GitHub branch: specs, schemas, validators, source-only manifest;
- private Library: detailed seed Case DNA;
- LIVE production: unchanged;
- production Supabase: unchanged.

Future private architecture may use object storage + PostgreSQL + vector search, but only after explicit schema/RLS/security review and approval.

## 12. Current branch

`feature/mystery-corpus-v0`

Draft PR:
#355 — Mystery Corpus v0: foundation for Case Architect v2

No LIVE, payment, auth, entitlement, analytics, SEO, Game Engine, production Supabase schema, RLS or CURRENT_RELEASE changes.

## 13. Exact next step

Run the first controlled A/B Concept Tournament on a real Premium portfolio gap using:
A) Case Architect v1 with no corpus retrieval;
B) Case Architect v2 with abstract pattern retrieval from seed v0.1.

Do not scale ingestion before measuring this difference.
