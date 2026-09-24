# Case Architect v2 — Controlled Concept Tournament v1

Purpose: measure whether approved Corpus context materially improves new detective concepts.

A valid tournament requires stateless provider execution because the current development/extractor conversation has already seen Corpus material.

## Variants

### Baseline
Receives:
- identical case brief;
- generic Case Architect rules.

MUST NOT receive:
- Corpus context;
- retrieved case IDs;
- pattern palette;
- prior concept from the corpus arm.

### Corpus
Receives:
- the same brief and rules;
- `case_architect_context_pack_v1` generated in `approved` mode only.

Shadow context is forbidden for the measured treatment arm until those records are independently approved.

## Evaluation

Before judging, `build-concept-evaluation-packet.mjs` removes:
- `generation_audit`;
- retrieved case IDs;
- baseline/corpus labels.

The evaluator sees concepts only as X and Y.

Suggested dimensions:
- originality;
- causal compression;
- hypothesis depth;
- evidence variety;
- fair-play risk;
- causal red-herring quality;
- signature action;
- retell hook;
- structural similarity risk.

This avoids giving the Corpus concept credit merely because the evaluator knows it used retrieval.

## Guardrail

Tournament output is research evidence, not a release gate. Any winning concept must still go through full CANON construction, evidence graph, contradiction map, Theory Audit, Blind Investigator and G0-G9/Cognitive gates.
