# Mystery Logic — Mystery Corpus / Studio Intelligence

Status: ACTIVE / M1 SEED CORPUS
Workstream: CORPUS-01
Updated: 2026-09-23
Autonomy: L1 PROPOSE; implementation in non-production branch only unless explicitly approved
Production writes: FORBIDDEN
Supabase production schema changes: FORBIDDEN in M1
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

### M1 — seed corpus — ACTIVE
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

### M3 — A/B concept test — NEXT
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

### M4 — Originality Engine
Structured similarity + semantic retrieval + explicit rationale.

### M5 — Theory + Blind engines
Adversarial theories and solution-agnostic investigation.

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
