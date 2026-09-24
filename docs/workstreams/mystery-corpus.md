# Mystery Logic — Mystery Corpus / Studio Intelligence

Status: ACTIVE / M2 CONTROLLED EXPANSION PILOT + M5 PROVIDER READY
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

### M2 — controlled corpus expansion — ACTIVE

Scale target remains 200–300, but ingestion is now gated rather than bulk-imported.

Current controlled expansion:
- source queue v0.2: 160 candidates;
- 126 rights-verified / eligible for controlled analysis;
- 34 blocked with `unknown / prohibited_pending_review` until individual rights verification;
- source families: FBI history 100, Project Gutenberg 52, NTSB 4, SEC 4;
- first diversity-aware ingestion batch: 20 sources;
- batch composition: FBI 6, Project Gutenberg 6, NTSB 4, SEC 4.

Implemented M2 controls:
- source rights queue;
- diversity-aware batch planner;
- provenance sidecar for critical Case DNA claims;
- controlled ingestion job envelope;
- ingestion bundle validation;
- extractor/reviewer separation;
- independent review prompt;
- review validation;
- promotion gate.

Mass ingestion to 200–300 is NOT yet authorized. New records remain candidates until independent review.

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

## 14. M5 provider-ready continuation — 2026-09-23

Additional implementation after the first blind-orchestration checkpoint:

### Provider-neutral Blind Investigator
- `tools/mystery-corpus/run-blind-provider.mjs`
  - sends only `blind_provider_request_v1`;
  - payload contains the generated blind prompt contract and player packet only;
  - optional bearer token stays in environment;
  - every response is validated against stage-visible evidence before acceptance.
- `tests/mystery-corpus-blind-provider-runner.test.mjs`
  - local mock HTTP provider;
  - private-canary environment value must never appear in network payload;
  - unavailable evidence references are rejected.
- `docs/agents/blind-provider-adapter-v1.md`

### Solution-isolated Adversarial Theory provider
- `tools/mystery-corpus/build-adversarial-theory-prompt.mjs`
- `tools/mystery-corpus/validate-adversarial-theories.mjs`
- `tools/mystery-corpus/run-adversarial-provider.mjs`
- `tests/mystery-corpus-adversarial-provider.test.mjs`
- `docs/agents/adversarial-theory-loop-v1.md`

The provider receives only the final player-visible packet plus optional blind-run observations.
It never receives Private CANON.
Generated theory evidence IDs must be visible at the supplied stage.

### Adversarial theory -> deterministic audit bridge
- `tools/mystery-corpus/merge-adversarial-theories.mjs`
  - maps independent theory support/conflict evidence into Case DNA;
  - rejects unknown evidence IDs;
  - rejects a competing theory that requires a new answer-changing fact.
- `tests/mystery-corpus-adversarial-merge.test.mjs`

### End-to-end theory attack
- `tools/mystery-corpus/run-adversarial-theory-audit.mjs`
- `tests/mystery-corpus-adversarial-e2e.test.mjs`
- `docs/agents/m5-end-to-end-theory-attack-v1.md`

End-to-end behavior:
1. private Case DNA stays local;
2. final player-visible packet is generated and blind-boundary validated;
3. external/stateless provider proposes alternative explanations from visible evidence only;
4. alternatives are validated;
5. alternatives are merged locally into Case DNA;
6. deterministic Theory Audit checks whether final evidence actually discriminates them;
7. an alternative that survives all final evidence => FAIL.

This turns "the author believes the case is proven" into a machine-checkable adversarial condition.

### M2 scale-safety foundation
Added before scaling beyond the 25-record seed:
- `docs/schemas/case-dna-provenance-v1.schema.json`
- `tools/mystery-corpus/validate-case-dna-provenance.mjs`
- `tests/mystery-corpus-provenance.test.mjs`
- `docs/corpus/extraction-provenance-gate-v1.md`

Rule:
critical corpus claims (incident, mechanism, evidence, hypotheses, known reveal) must be source-supported or explicitly abstracted from a cited source locator.
Critical editorial inference is forbidden.
UNKNOWN is preserved rather than silently filled.
An approved ingestion cannot contain UNKNOWN critical claims.

This provenance gate is required before any semi-automated 200–300 record expansion.

### CI state
Dedicated workflow:
`.github/workflows/mystery-corpus-ci.yml`

Latest verified aggregate run:
- run 35915682364
- 32 tests
- 32 PASS
- 0 FAIL

This run includes Retriever/Originality, Theory Audit, blind boundary/orchestration canaries, provider network isolation, adversarial-provider validation, end-to-end theory attack and extraction-provenance tests.

### Safety state
Still unchanged:
- no LIVE deployment;
- no CURRENT_RELEASE modification;
- no production Supabase schema/RLS change;
- no payment/auth/entitlement/analytics/SEO/Game Engine change;
- no Private CANON in public GitHub;
- no vendor API credentials committed.

### Remaining M5 blocker
The current chat/process has seen private pilot material and therefore MUST NOT masquerade as a genuine blind investigator.

A valid AI blind test requires a separate stateless provider/model context that:
- has never seen Private CANON;
- receives only the generated blind provider request;
- cannot retrieve private solution data through tools/memory;
- returns checkpoints that pass `validate-blind-run.mjs`.

The code boundary is ready; the external/stateless execution is not yet performed.

## 15. Exact next step after provider-ready M5

1. Connect one non-production stateless model adapter to `BLIND_INVESTIGATOR_ENDPOINT` / `ADVERSARIAL_THEORY_ENDPOINT`.
2. Run one mature Mystery Logic case through:
   - staged Blind Investigator;
   - final Adversarial Theory generation;
   - local merge;
   - Theory Audit.
3. Record whether the independent investigator:
   - changes theories at sensible evidence points;
   - solves by deduction rather than UI leading;
   - invents no unavailable evidence;
   - discovers any alternative not present in author hypotheses.
4. Only after that result decide whether to scale Mystery Corpus from 25 to 200–300 records.

Do not merge PR #355 or touch production as part of this validation unless explicitly approved by the user.

## 16. M2 controlled expansion checkpoint — 2026-09-23

### Source queue

Committed public/spoiler-safe control files:
- `docs/corpus/source-queue-v0.2.json`
- `docs/corpus/ingestion-plan-v0.2-batch1.json`
- `docs/schemas/corpus-source-queue-v1.schema.json`
- `tools/mystery-corpus/validate-source-queue.mjs`
- `tools/mystery-corpus/build-ingestion-plan.mjs`

Queue state:
- total: 160;
- rights-verified: 126;
- blocked pending rights verification: 34;
- first planned batch: 20;
- no blocked/unknown-rights item may enter an ingestion job; every verified source must carry `rights_evidence_reference` + `rights_verified_date`.

### Controlled ingestion pipeline

Implemented:
- `docs/schemas/corpus-ingestion-job-v1.schema.json`
- `tools/mystery-corpus/build-ingestion-jobs.mjs`
- `tools/mystery-corpus/validate-ingestion-bundle.mjs`
- `docs/corpus/controlled-ingestion-pipeline-v1.md`

Pipeline:
`Source Queue -> Rights Gate -> Ingestion Plan -> Job Envelope -> Extractor -> Case DNA + Provenance -> Validation -> Independent Review -> Promotion Gate -> Private Corpus`.

### Extractor / Reviewer hard separation

Implemented:
- `docs/schemas/corpus-extraction-result-v1.schema.json`
- `docs/schemas/corpus-extraction-review-v1.schema.json`
- `tools/mystery-corpus/build-extractor-prompt.mjs`
- `tools/mystery-corpus/validate-extractor-result.mjs`
- `tools/mystery-corpus/build-extraction-review-prompt.mjs`
- `tools/mystery-corpus/validate-extraction-review.mjs`
- `tools/mystery-corpus/validate-ingestion-promotion.mjs`
- `docs/corpus/extractor-review-separation-v1.md`
- `docs/corpus/independent-review-promotion-gate-v1.md`

Hard rules:
- extractor cannot self-approve;
- `reviewer_id != extractor_id`;
- approved review requires all hard checks true;
- critical source claims require locators;
- analysis-only sources retain no source text;
- UNKNOWN must not be silently filled;
- promotion re-runs bundle validation with approved provenance;
- validation only makes a record eligible for private-corpus promotion; it does not mutate production.

### Real M2 extraction candidates

All current records were extracted by:
`chatgpt-project-context-2026-09-23`

Therefore this context MUST NOT act as their independent reviewer.

#### Pilot 01 — Hollow Nickel / Rudolf Abel
Private Library:
`/Mystery Logic/Private/Mystery Corpus/M2 Candidates/Mystery-Corpus-M2-Pilot-Hollow-Nickel-v0.2.zip`

Library id:
`libfile_f68b6ea073c481919d1b8956f80ba6a3`

SHA-256:
`3aa6e8688bad00b81195bbaf8136de6ffbb30cbef42b9aaccd2e0f3aa7b424b4`

State:
- Case DNA + provenance + job + extraction result + review request;
- provenance review status: `needs_review`;
- NOT approved.

#### Pilot 02/03 — TWA Flight 800 + WorldCom
Private Library:
`/Mystery Logic/Private/Mystery Corpus/M2 Candidates/Mystery-Corpus-M2-Pilot-Pack-003-v0.2.zip`

Library id:
`libfile_3513c4690d60819196b11d7a2b3c9fd0`

SHA-256:
`78ce2a337a806440ad0bf785f0d0ed72288e6c0d00e94d2f8295aa0e435de3d8`

Contains for each candidate:
- Case DNA;
- provenance;
- extraction notes;
- ingestion job;
- `corpus_extraction_result_v1`;
- independent review request.

TWA 800 extraction state:
- 6 evidence lines;
- 3 competing hypotheses;
- preserves UNKNOWN for the exact ignition source;
- review status: `needs_review`;
- NOT approved.

WorldCom extraction state:
- 6 evidence lines;
- 3 competing hypotheses;
- preserves allegation/source wording boundary;
- review status: `needs_review`;
- NOT approved.

The three pilots intentionally exercise different evidence topology:
- covert tradecraft + delayed attribution;
- technical causal investigation + hypothesis elimination + preserved uncertainty;
- systemic financial records + repeated pattern + mechanism shift.

### CI

Latest verified Mystery Corpus CI:
- run: `35918475738`;
- head: `c829ea1eb0c8131a5b9b48cd48eb0cec59178cce`;
- tests: 49;
- PASS: 49;
- FAIL: 0.

Coverage now includes:
- Case DNA validation;
- corpus validation;
- retrieval/originality;
- Theory Audit;
- blind boundary/canary;
- provider isolation;
- adversarial theory loop;
- end-to-end theory attack;
- provenance gate;
- source queue;
- real committed queue regression;
- controlled ingestion jobs/bundles;
- extractor/reviewer separation;
- independent review/promotion gate.

### Current blockers before mass scale

M2:
- the first 3 real extractions require independent review by a context/provider that did not perform the extraction;
- only independently approved records may become approved corpus entries.

M5:
- a genuine Blind Investigator still requires a separate stateless context/provider that has never seen Private CANON.

### Exact next action

1. Independently review the 3 real M2 pilots using their review requests.
2. Run `validate-extraction-review.mjs` and `validate-ingestion-promotion.mjs` on every returned review.
3. Promote only records that pass.
4. Compare fingerprint/retrieval behavior before vs after the approved additions.
5. If extraction/review quality is stable across these three very different source types, expand controlled ingestion to the rest of Batch 1.
6. Do not jump directly to 200–300 approved records.
7. Keep PR #355 draft and non-production until this validation loop is proven.

## 17. Discovery queue + rights provenance + review handoff — 2026-09-23

### Discovery queue expanded

The discovery queue now contains:
- 160 total source records;
- 100 FBI history investigations;
- 52 Project Gutenberg detective-fiction records;
- 4 NTSB investigations;
- 4 SEC enforcement/fraud records.

Rights state:
- 126 `rights_verified`;
- 34 `unknown / prohibited_pending_review`.

Important:
- queue expansion does NOT mean corpus approval;
- newly discovered Gutenberg titles default to blocked;
- an individual ebook page must explicitly support public-domain status before the queue record can become rights-verified.

Verified fiction currently includes 18 Project Gutenberg records.
Individual pages were checked and the queue now stores the exact ebook URL as rights evidence.

### Rights evidence is now end-to-end

New requirement:
every `rights_verified / queued / ingested` source must carry:
- `rights_evidence_reference`;
- `rights_verified_date`.

For source families:
- FBI: rights evidence points to the FBI Cases and Criminals page containing the non-commercial reuse statement;
- Project Gutenberg: rights evidence is the individual ebook page with its copyright status;
- NTSB: rights evidence points to NTSB Website Policies; NTSB-created material may be reused, while third-party copyrighted docket content remains excluded;
- SEC: rights evidence points to the SEC Webmaster FAQ / reuse policy.

Rights evidence now propagates:
`Source Queue -> Ingestion Plan -> Ingestion Job -> Independent Review Prompt`.

### Batch 1 rebalanced

The first 20-source ingestion plan is now:
- FBI history: 6;
- Project Gutenberg verified public-domain fiction: 6;
- NTSB: 4;
- SEC: 4.

Reason:
avoid a corpus dominated by one institutional source family and deliberately combine:
- real evidence-generation systems;
- causal/technical investigation;
- financial/institutional evidence;
- authored fair-play mystery design.

### Private pilot packages migrated to rights-aware jobs

Hollow Nickel latest:
`/Mystery Logic/Private/Mystery Corpus/M2 Candidates/Mystery-Corpus-M2-Pilot-Hollow-Nickel-v0.3.zip`

Library id:
`libfile_3b5faf58f314819180fe62b924aa7d7b`

SHA-256:
`964eedd033e77f5385da9dadfa5b4e55c03350dafa3221d4187dbf77b6c94794`

TWA 800 + WorldCom latest:
`/Mystery Logic/Private/Mystery Corpus/M2 Candidates/Mystery-Corpus-M2-Pilot-Pack-003-v0.3.zip`

Library id:
`libfile_60e2af74a3d88191a95687a49637c3a0`

SHA-256:
`c562659eef11f1471a670c57d60730998aa2d37fc20c4c51605ede40a6ae8733`

All three remain:
`needs_review`.
None is approved.

### Independent Review Batch 001

Private handoff artifact:
`/Mystery Logic/Private/Mystery Corpus/M2 Candidates/Mystery-Corpus-M2-Review-Batch-001-v0.2.zip`

Library id:
`libfile_f857176493fc81918a8d2294d18ba11a`

SHA-256:
`a87d76a37244778f43564b60a40c7d85827f6a6d22bf0338f9bbc74d5ec9b5bc`

Contains the three real extraction candidates plus:
- extractor identity;
- source references;
- rights evidence references;
- provenance;
- independent-review requests;
- hard review checks.

It is ready for a separate stateless reviewer context/provider.
The current extractor context must not approve this batch.

### CI state

Latest verified completed aggregate after the 155-source discovery expansion and newline repair:
- run `35919388029`;
- head `2032858be2f0fae3a9f9065e12d8a0c72b47b190`;
- 49 tests;
- 49 PASS;
- 0 FAIL.

After that verified run, additional rights-provenance propagation commits were added.
Current branch-head CI must be checked before any merge.

### Exact next action

1. Complete current branch-head CI.
2. Run Independent Review Batch 001 in a genuinely separate reviewer context.
3. Validate each returned `corpus_extraction_review_v1`.
4. Run `validate-ingestion-promotion.mjs`.
5. Promote only independently approved records.
6. Run retrieval/originality regression before vs after promoted additions.
7. If all three source types survive review, continue the balanced 20-source Batch 1.
8. Keep the 34 blocked records blocked until individual rights evidence is collected.

## 18. Independent review execution hardening — 2026-09-24

### Reviewer provider runner

Added:
- `tools/mystery-corpus/run-extraction-review-provider.mjs`
- `tools/mystery-corpus/run-review-promotion-check.mjs`
- `tests/mystery-corpus-review-provider.test.mjs`
- `docs/corpus/independent-reviewer-provider-v1.md`

Rules:
- reviewer ID must differ from extractor ID;
- provider response reviewer ID must equal the requested independent reviewer ID;
- provider output is validated before promotion eligibility is checked;
- review/promotion orchestration never moves or rewrites corpus files;
- a review verdict can only produce `eligible_for_private_corpus` or `blocked`.

### Batch reviewer

Added:
- `tools/mystery-corpus/run-review-batch-provider.mjs`
- `tests/mystery-corpus-review-batch-provider.test.mjs`
- `docs/corpus/review-batch-runner-v1.md`

The runner:
- processes every candidate in a private review batch;
- continues after individual failures;
- returns one aggregate report;
- exits non-zero when any candidate is blocked;
- NEVER promotes files.

Latest aggregate CI:
- run `35928201975`;
- head `156013c32be7348af217ed2340bfbc8b135a4111`;
- 59 tests;
- 59 PASS;
- 0 FAIL.

### Rights contract defect found and fixed

During preparation of Review Batch 001, a real metadata gap was detected:

`rights_evidence_reference` and `rights_verified_date` existed in the ingestion job/review request but were not required to propagate into:
- `case_dna.source`;
- `provenance.source_snapshot`.

That meant the previous phrase "end-to-end rights evidence" was stronger than the actual machine contract.

Fix:
- Case DNA schema accepts rights evidence fields;
- provenance schema accepts rights evidence fields;
- `validate-ingestion-bundle.mjs` requires exact match to the ingestion job whenever the job carries rights evidence;
- `build-extractor-prompt.mjs` explicitly requires exact propagation;
- regression tests fail missing/drifted rights evidence.

This is enforced for new M2 jobs without breaking the original 25-record seed.

### Review Batch 001 v0.3

Private Library artifact:
`/Mystery Logic/Private/Mystery Corpus/M2 Candidates/Mystery-Corpus-M2-Review-Batch-001-v0.3.zip`

Library id:
`libfile_30b4519728fc8191bfe657f3e1639f1a`

SHA-256:
`276dc9f3cfbaf24e89e61f137e51a22c0f789feaa7c558d953f1778f110f92c3`

Size:
40,592 bytes.

Contains:
- Hollow Nickel / Rudolf Abel;
- TWA Flight 800;
- WorldCom;
- job;
- extraction result;
- standalone Case DNA;
- provenance;
- extraction notes;
- review request;
- batch manifest/instructions.

v0.3 differs from v0.2 by propagating exact job rights evidence/date into both Case DNA and provenance.

All three v0.3 candidates pass current M2 structural/provenance/rights consistency checks and remain:
`needs_review`.

No candidate was promoted.

### Pre-review locator check

Critical locators are reviewable:
- TWA 800 uses NTSB report sections/findings/pages;
- WorldCom uses SEC complaint paragraph ranges;
- Hollow Nickel uses named FBI history sections plus FBI artifact references.

This is a pre-review usability check only; it does NOT establish source correctness.

### Exact next action

Run `m2-review-batch-001 v0.3` through one genuinely separate stateless reviewer/provider with source browsing enabled:

```
run-review-batch-provider.mjs
  --batch-dir <unpacked v0.3>
  --reviewer-id <independent-id>
  --endpoint <reviewer-adapter>
```

Then:
1. retain every reviewer issue/verdict;
2. promote NONE automatically;
3. for approved items, run explicit private-corpus promotion eligibility validation;
4. repair any `needs_rework` items and send them through a NEW independent review;
5. only after 3/3 stable outcomes run retrieval/originality regression and continue Batch 1.

Current conversation/extractor context must not act as that independent reviewer.

## 19. Review-ready v0.4 + source-grounding precheck — 2026-09-24

### Current independent-review blocker

A valid independent review still requires a genuinely separate stateless reviewer context/provider.

Current environment check:
- no `OPENAI_API_KEY`;
- no `CORPUS_REVIEWER_ENDPOINT`;
- OpenAI Developers integration is not currently connected.

Therefore this extractor context did NOT issue any `approved` review.

### OpenAI stateless reviewer adapter

Added:
- `tools/mystery-corpus/openai-reviewer-adapter.mjs`
- `tools/mystery-corpus/run-openai-review-batch.mjs`
- `tests/mystery-corpus-openai-reviewer-adapter.test.mjs`
- `tests/mystery-corpus-openai-review-batch.test.mjs`
- `docs/corpus/openai-reviewer-adapter-v1.md`
- `docs/corpus/openai-review-batch-v1.md`

Behavior:
- one fresh Responses API request per candidate;
- no prior response/conversation state;
- live web search;
- domain restriction to source / rights-evidence domains where possible;
- strict `corpus_extraction_review_v1` Structured Output;
- review-only permissions;
- no corpus promotion capability;
- one-command local wrapper starts/stops the adapter automatically.

### Review batch preflight

Added:
- `tools/mystery-corpus/validate-review-batch.mjs`
- `tests/mystery-corpus-review-batch-preflight.test.mjs`
- `docs/corpus/review-batch-preflight-v1.md`

The preflight checks package-internal consistency before external review:
- manifest / candidate identities;
- embedded vs standalone Case DNA/provenance/notes;
- job/run/case uniqueness;
- exact rights metadata propagation;
- `needs_review` state;
- source references and review checks;
- existing extractor-result / ingestion-bundle validation.

### SEC rights evidence strengthened

SEC source queue and Batch 1 plan now use:
`https://www.sec.gov/about/privacy-information`

Verified 2026-09-24.

Reason:
SEC Website Dissemination states that information presented on sec.gov is public information that may be copied or further distributed without SEC permission, while trademarks/logos and third-party material remain separately constrained.

Corpus policy remains stricter:
`metadata_and_analysis_only`, no raw source text retention.

### WorldCom source-framing repair

A non-independent source-grounding precheck found that v0.3 sometimes presented SEC complaint allegations as unattributed historical facts.

v0.4 repairs:
- `incident.surface_problem`;
- `mechanism.core_mechanism`;
- canonical `H_SYSTEMATIC`;
- reveal / causal-compression wording.

Complaint-derived wrongdoing is now explicitly attributed to the SEC allegation.

This is an extractor repair, NOT an independent review approval.

### Review Batch 001 v0.4

Private Library artifact:
`/Mystery Logic/Private/Mystery Corpus/M2 Candidates/Mystery-Corpus-M2-Review-Batch-001-v0.4.zip`

Library id:
`libfile_8ae361cba0188191a5c737042ae05f0d`

SHA-256:
`550ec8d938f1ec704c0ba82e04f71f17c84a6e1d504b64a68e065eedde88c6d3`

Size:
41,295 bytes.

Local/private package preflight:
- candidates: 3;
- errors: 0;
- warnings: 0.

Candidates remain:
`needs_review`.

No candidate promoted.

### Source-Grounding Audit guard

Added:
- `docs/schemas/corpus-source-grounding-audit-v1.schema.json`
- `tools/mystery-corpus/validate-source-grounding-audit.mjs`
- `tests/mystery-corpus-source-grounding-audit.test.mjs`
- `docs/corpus/source-grounding-audit-v1.md`

The schema hard-codes:
- `independent_review=false`;
- `can_approve=false`;
- `independent_review_still_required=true`.

Purpose:
the extractor context may reopen sources, catch obvious grounding errors and repair its own extraction, but can never approve it.

### Source-grounding precheck observations

Hollow Nickel:
- official FBI history supports the core discovery / unresolved-code / Hayhanen / comparative-tradecraft / Abel-identification sequence;
- FBI Cases and Criminals grants its monographs/write-ups for non-commercial use;
- corpus remains metadata/analysis-only and retains no raw FBI text;
- independent rights-policy review remains required before promotion.

TWA Flight 800:
- NTSB report supports CWT explosion, explicit alternative-hypothesis analysis, rejection of bomb/missile and pre-existing structural failure, witness-evidence interpretation, and unresolved exact ignition source;
- NTSB-created materials are generally public-domain under its Website Policies, while third-party docket material remains excluded.

WorldCom:
- SEC First Amended Complaint supports the alleged reserve-release -> capitalization method shift, unsupported entries, repetition and alleged senior-management direction;
- v0.4 preserves allegation framing;
- SEC rights evidence is now the direct Website Dissemination policy.

These observations establish readiness for independent review only.

### CI

Latest verified aggregate:
- run `35959637833`;
- head `164acd722ce1f2e6c39abfbf4176869e9f914372`;
- 72 tests;
- 72 PASS;
- 0 FAIL.

### Exact next action

1. Connect a genuinely separate stateless reviewer capability (preferred current path: OpenAI Developers / API).
2. Unpack private Review Batch 001 v0.4.
3. Run:
   `run-openai-review-batch.mjs`
   or the provider-neutral `run-review-batch-provider.mjs`.
4. Retain all three review verdicts and issues.
5. Promote NONE automatically.
6. Repair any `needs_rework` item and submit the repaired version to a NEW independent review.
7. Only after stable independent outcomes run before/after Retriever + Originality regression and continue the remaining Batch 1 sources.

Do not merge PR #355 or touch LIVE as part of this review.

## 20. Locked review handoff + retrieval safety — 2026-09-24

### Review Batch 001 v0.5

Private Library artifact:
`/Mystery Logic/Private/Mystery Corpus/M2 Candidates/Mystery-Corpus-M2-Review-Batch-001-v0.5.zip`

Library id:
`libfile_ba96f3818dac8191be56f5c56de9c900`

ZIP SHA-256:
`ba61c28dd554347e7cc18650232290e49fba64118f2183e7a099b2ff840a606f`

Size:
44,979 bytes.

New in v0.5:
- `review-batch.lock.json`;
- 20 package files bound by per-file SHA-256 + byte size;
- lock SHA-256:
  `80a97677e850820a4f143b910a6c58d0d1a7b49a27016a04796dd5fbede2f71d`;
- instructions require lock verification before review.

Direct private verification:
- locked files: 20;
- actual files: 20;
- hash/size errors: 0;
- 3/3 candidate statuses remain `needs_review`.

### Mandatory preflight + integrity before reviewer execution

Added:
- `tools/mystery-corpus/build-review-batch-lock.mjs`;
- `tools/mystery-corpus/validate-review-batch-lock.mjs`;
- `tests/mystery-corpus-review-batch-lock.test.mjs`;
- `docs/corpus/review-batch-integrity-lock-v1.md`.

`run-review-batch-provider.mjs` now REFUSES to call any external reviewer until BOTH pass:
1. `validate-review-batch.mjs`;
2. review-batch integrity lock verification.

A tampered/unlocked package therefore cannot reach the reviewer.

A temporary CI failure after enabling this protection was caused only by a missing `spawnSync` import in the test fixture; the security contract was not weakened.

Current verified CI:
- run `35961474580`;
- head `267c47ab420457431bbe53618ad5d8e261f93003`;
- tests: 85;
- PASS: 85;
- FAIL: 0.

### Retrieval Safety Layer

Added:
- `docs/schemas/corpus-layer-manifest-v1.schema.json`;
- `tools/mystery-corpus/retrieve-patterns-safe.mjs`;
- `tools/mystery-corpus/case-dna-quality-scorecard.mjs`;
- `tests/mystery-corpus-retrieval-safety-scorecard.test.mjs`;
- `docs/corpus/retrieval-safety-scorecard-v1.md`.

Default retrieval mode is `approved`.

Only:
- `approved_legacy`;
- `approved_reviewed`

may participate.

`needs_review` / `candidate` layers can participate only in explicit `shadow` mode and every result is labeled with `corpus_origin`.

This prevents unreviewed M2 records from silently becoming Case Architect knowledge.

### Shadow retrieval result

Using the 25-record approved legacy seed plus the 3 v0.4/v0.5 candidates in shadow-only overlay:
- 6/6 diagnostic queries received relevant overlay hits;
- 4/6 queries increased source-type diversity;
- 6/6 queries increased matched structural-dimension coverage.

Observed niches:
- Hollow Nickel: covert tradecraft / delayed attribution / evidence convergence;
- TWA 800: alternative-hypothesis elimination / technical causal analysis / negative evidence;
- WorldCom: longitudinal financial pattern / repeated institutional records / process-vs-intent discrimination.

This is evidence that the candidates add retrieval value.
It is NOT review approval.

### Diagnostic Case DNA scorecard

Added a non-ranking scorecard for:
- evidence modality variety;
- hypothesis depth;
- corroboration of essential evidence;
- deduction structure;
- stage structure;
- causal misdirection;
- canonical uniqueness;
- provenance grounding;
- fingerprint richness.

It produces no overall PASS/rank and cannot replace:
- independent source review;
- Originality Gate;
- Theory Audit;
- Blind Investigator;
- fair-play review;
- human editorial judgment.

### Audited private promotion

Added:
- `tools/mystery-corpus/promote-reviewed-extraction.mjs`;
- `tools/mystery-corpus/build-approved-corpus-registry.mjs`;
- `tests/mystery-corpus-private-promotion.test.mjs`;
- `docs/corpus/audited-private-promotion-v1.md`.

Promotion defaults to DRY RUN.

Actual promotion requires explicit `--execute`.

A successful promotion writes:
- exact Case DNA;
- immutable promotion receipt binding Case DNA SHA-256 to extraction run, job, extractor, independent reviewer, review time and rights evidence.

Implicit overwrite is forbidden.

### External reviewer routes checked

OpenAI Developers:
- not installed/connected in the current account runtime;
- therefore no API key/endpoint is available to this chat.

GitHub Models fallback:
- NOT AVAILABLE;
- GitHub Models was fully retired on 2026-07-30.

GitHub connector currently exposes no Copilot coding-agent/session action that can be used as the separate reviewer.

Therefore no independent review was fabricated.

### Exact next action

The implementation is now review-ready.

To complete the first true review:
1. provide a genuinely separate stateless model execution with browsing;
2. use locked private Review Batch 001 v0.5;
3. reviewer verifies the lock before review;
4. run all 3 candidates;
5. validate every review;
6. dry-run promotion;
7. explicitly promote only independently approved records;
8. rebuild approved registry;
9. run approved-only retrieval/originality regression;
10. then continue the remaining Batch 1 extraction.

Until step 1 exists:
- do NOT scale approved corpus to 200–300;
- do NOT treat shadow results as approved corpus knowledge;
- do NOT merge PR #355 into production paths;
- do NOT touch LIVE/CURRENT_RELEASE/production Supabase.

## 21. M2 Extraction Wave 02 — 2026-09-24

A second controlled extraction wave was created without changing the approved corpus.

Private package:
`/Mystery Logic/Private/Mystery Corpus/M2 Candidates/Mystery-Corpus-M2-Extraction-Wave-02-v0.1.zip`

Library id:
`libfile_9b5a6c9db3f48191a78efb1dd5e8f1db`

ZIP SHA-256:
`2595adbd02bb40622bbd37d6aa5f2b0105048b1a87ef67823c78b4ee4a88673d`

Size:
45,567 bytes.

Integrity lock:
- 26 package files;
- lock SHA-256:
  `aee05d1ed4cfa5ca0947581d623292cc0ba4069393a00b00522002e59bbae27e`.

Candidates:
1. FBI — ABSCAM
   - controlled undercover environment;
   - recorded quid-pro-quo / payment context;
   - opportunity vs intent / entrapment distinction;
   - network-driven investigation expansion.
2. NTSB — Colgan Air Flight 3407
   - immediate probable-cause sequence vs contributing factors;
   - human factors + organizational procedures;
   - technical causal reconstruction rather than culprit search.
3. SEC — Adelphia
   - off-balance-sheet / related-party liability pattern;
   - economic substance vs formal record label;
   - multi-domain reporting pattern;
   - all wrongdoing statements remain explicitly attributed to SEC complaint allegations.
4. Project Gutenberg — The Moonstone
   - public-domain fiction;
   - true physical trace whose meaning changes;
   - observed action separated from inferred intent;
   - protective concealment / lie != guilt;
   - two-stage custody chain: room removal != later criminal appropriation.

All four:
- pass internal Case DNA/reference-integrity checks;
- pass provenance coverage checks;
- pass rights/job/provenance consistency checks;
- remain `needs_review`;
- are NOT approved;
- are NOT available to approved-only retrieval.

One extraction bug was caught before packaging:
- Moonstone evidence E1 referenced a non-existent hypothesis id;
- repaired before lock/archive creation.

### Wave 02 diagnostics

Private diagnostic report:
`/Mystery Logic/Private/Mystery Corpus/M2 Candidates/Mystery-Corpus-M2-Wave-02-Diagnostics-v0.1.json`

Library id:
`libfile_5334d5968c1481919b6de9381ed060cb`

SHA-256:
`301c7f7a6b77df68043696edc893b484c05c0f50fe1f29349cdea2b670947eb9`

Shadow retrieval against the 25-record approved legacy seed:
- diagnostic queries: 8;
- queries with new Wave-02 hits: 8/8;
- source-type diversity gain: 7/8;
- matched-dimension diversity gain: 7/8.

Observed retrieval niches:
- ABSCAM: controlled opportunity / recorded intent / network expansion;
- Colgan 3407: immediate vs contributing cause / human-system chain;
- Adelphia: economic substance / related-party records / repeated reporting pattern;
- Moonstone: action vs intent / protective deception / two-stage custody / clue recontextualization.

Deterministic quality scorecard:
- no `thin` or `attention` structural dimension in the four current candidates;
- this is diagnostics only and does NOT imply factual approval.

### Approved-corpus state after Wave 02

Approved corpus remains unchanged:
- 25 approved legacy seed records.

Unapproved M2 candidate pool:
- Review Batch 001: 3 candidates;
- Wave 02: 4 candidates;
- total unapproved candidates: 7.

Safe retrieval rule remains:
- approved mode -> approved layers only;
- Wave 02 may be used only in explicit shadow mode until independent review and audited promotion.

### Next controlled action

Do NOT promote or merge the seven M2 candidates without independent review.

While external review capability is unavailable, further work may:
- continue a small balanced extraction wave as `needs_review`;
- improve source grounding;
- run shadow retrieval / quality diagnostics;
- prepare Studio/Case Architect integration around approved-vs-shadow layers.

Do not scale directly to 200–300 approved records until at least the first independent review/promotion loop is proven.

