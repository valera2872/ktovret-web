# Mystery Logic — Mystery Corpus / Studio Intelligence

Status: ACTIVE / M0 ARCHITECTURE
Workstream: CORPUS-01
Updated: 2026-09-23
Autonomy: L1 PROPOSE; implementation in non-production branch only unless explicitly approved
Production writes: FORBIDDEN
Supabase production schema changes: FORBIDDEN in M0
Private canon / source payloads: NEVER store in public GitHub

## 1. Decision

Mystery Corpus remains inside the Mystery Logic product and project context.

Do NOT create a separate ChatGPT Project at this stage.

Reason:
- Case Architect, Premium cases, Studio, analytics and release gates share one product model;
- splitting the conversational/project context now would duplicate strategy and cause drift;
- the corpus is infrastructure for Mystery Logic, not a separate customer-facing product.

Technical separation is still required:
- public `ktovret-web`: spoiler-safe specs, schemas, validators, orchestration code;
- private data layer: source payloads, copyrighted/licensed material, embeddings, creator submissions, private CANON and solution data;
- production website: no corpus payloads and no private canon.

A separate private repository or private storage namespace may be introduced when ingestion begins. It must not become the source of truth for LIVE website state.

## 2. Goal

Build a reusable detective-intelligence layer that improves:
- originality;
- causal depth;
- evidence design;
- red herrings;
- hypothesis dynamics;
- fair play;
- character lies;
- technical realism;
- final reconstruction;
- portfolio diversity.

The corpus must NOT be a plot-copying library.

Its unit of knowledge is abstract Case DNA: mechanisms, evidence topology, hypothesis shifts, lie structures, causal patterns and editorial lessons.

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

Case Architect is the intelligence layer.
Studio is the authoring environment.
Mystery Corpus is the research/pattern memory.
Release Gate remains the shipping authority.

## 4. Source classes

Allowed source classes include:
- Mystery Logic owned cases;
- public-domain fiction;
- public/government records where reuse is permitted;
- licensed material;
- user-owned creator submissions;
- factual case summaries and procedural records;
- analysis-only references to copyrighted modern works.

Every source record must have:
- source type;
- provenance;
- rights status;
- ingestion policy;
- source date/jurisdiction when applicable;
- extraction date;
- whether raw text retention is allowed.

Unknown rights status must default to restrictive handling.

## 5. Rights boundary

The corpus must distinguish facts/ideas/patterns from protected expression.

For analysis-only copyrighted works:
- do not retain full scripts/books in the public repository;
- do not expose long source text to downstream generation;
- extract abstract Case DNA and similarity fingerprints;
- retain only metadata and permitted excerpts when justified;
- never instruct generation to imitate a living author's style or reproduce a source plot.

Rights status is data, not a comment. It must be machine-readable.

## 6. Case DNA v1

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

External-source DNA and Mystery Logic private CANON may share structure, but private answer-changing data stays server-side/private.

## 7. Retrieval principles

Case Architect must query the corpus for patterns, not ask it to continue a source story.

Good retrieval:
- examples of non-culpability lies;
- real mechanisms that produce misleading timestamps;
- evidence combinations that distinguish two plausible hypotheses;
- institutional records automatically created by a process;
- recurring fair-play failures.

Bad retrieval:
- "rewrite this film with different names";
- "make a case like [single copyrighted work]";
- copying a distinctive reveal, relationship topology and clue chain as one package.

## 8. Originality Engine

Every candidate case should produce a plot fingerprint across:
- incident;
- setting;
- mechanism;
- motive structure;
- character topology;
- evidence topology;
- hypothesis curve;
- reversal type;
- decisive proof;
- reveal;
- signature action.

Similarity must be decomposable.

A warning should say WHY two cases are similar, not only output one percentage.

High similarity triggers redesign before polished writing.

## 9. Theory Engine

Theory Engine receives player-available facts plus structured evidence and attempts to build competing explanations.

Default adversarial theories:
- another suspect/cause;
- accident/no crime;
- witness error rather than lie;
- timestamp/process error;
- forged or misattributed evidence;
- canonical culprit innocent.

Failure condition:
an alternative explains the final available evidence as well as the canonical model.

The engine must identify the smallest discriminating evidence set.

## 10. Blind Investigator

Blind Investigator MUST NOT receive:
- culprit;
- private CANON;
- intended solve path;
- author notes;
- "important clue" labels.

At each stage it records:
- current theories;
- confidence;
- facts treated as established;
- unresolved questions;
- next desired action;
- point of theory change;
- perceived unfairness/confusion.

Its result is compared with intended hypothesis dynamics only after the blind run ends.

## 11. Phase plan

### M0 — architecture
Deliver:
- workstream;
- Case Architect v2 spec;
- Case DNA v1 schema;
- local validator;
- privacy/rights boundary.

No LIVE changes.

### M1 — seed corpus
Target:
- 25–50 deliberately diverse manually reviewed Case DNA records;
- mix of real cases, public-domain fiction, Mystery Logic cases and analysis-only modern references;
- build taxonomy from evidence, not from assumptions.

Success:
Case Architect retrieves useful patterns without reproducing source-specific plot details.

### M2 — corpus 200–300
Add semi-automated ingestion and human QA.
Measure extraction consistency.

### M3 — A/B concept test
Generate concept tournaments:
- Case Architect v1 without corpus;
- Case Architect v2 with corpus.

Compare:
- originality;
- causal compression;
- red-herring quality;
- evidence variety;
- hypothesis depth;
- fair-play robustness;
- retell hook.

Proceed only if corpus materially improves output.

### M4 — Originality Engine
Structured similarity + semantic retrieval + explicit similarity rationale.

### M5 — Theory + Blind engines
Run adversarial theory construction and solution-agnostic investigation before human blind test.

### M6 — Studio Internal
Expose author workflow to Mystery Logic team first.

### M7 — Creator Beta
Invite a small number of creators only after internal workflow is stable.

Marketplace is NOT part of v0.

## 12. Storage architecture

M0:
- GitHub branch contains only public-safe code/specs.
- No production DB mutation.

Target private architecture:
- object storage for permitted raw source payloads;
- PostgreSQL for structured Case DNA;
- vector index for semantic retrieval;
- access-controlled private CANON;
- immutable provenance record.

Production Supabase `mystery-logic` may eventually host selected services, but only after explicit schema/RLS/security review and approval.

## 13. Evaluation

The corpus is valuable only if measurable case quality improves.

Required evaluations:
- retrieval relevance;
- extraction fidelity;
- similarity false positives/negatives;
- concept novelty;
- theory discrimination;
- blind-solve behavior;
- human editorial assessment;
- eventual player analytics after release.

More data is not automatically better.
A smaller curated corpus may outperform a huge noisy one.

## 14. Current state

M0 started 2026-09-23.

Created:
- `docs/workstreams/mystery-corpus.md`
- `docs/agents/case-architect-v2-corpus.md`
- `docs/schemas/case-dna-v1.schema.json`
- `tools/mystery-corpus/validate-case-dna.mjs`

Branch:
`feature/mystery-corpus-v0`

No LIVE, payment, auth, entitlement, analytics, SEO, game engine, Supabase schema or CURRENT_RELEASE changes.

## 15. Exact next step

Create the first 25 curated Case DNA records in a PRIVATE storage location, then run an A/B concept tournament on one real Premium portfolio gap.

Do not scale ingestion before that test.
