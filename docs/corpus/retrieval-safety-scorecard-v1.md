# Mystery Corpus — Retrieval Safety + Quality Scorecard v1

## Retrieval safety

Use `retrieve-patterns-safe.mjs` for Case Architect / Studio retrieval.

A layer manifest explicitly classifies every corpus directory:
- `approved_legacy`
- `approved_reviewed`
- `needs_review`
- `candidate`
- `blocked`

Default mode is `approved`.

In approved mode:
- only approved layers are copied into the temporary retrieval view;
- needs-review/candidate records are excluded.

In shadow mode:
- explicitly marked `shadow_only` needs-review/candidate layers may be included;
- every result carries `corpus_origin`;
- output warns that overlay results are unapproved diagnostics.

This prevents the convenience of a raw directory path from silently turning review candidates into Case Architect knowledge.

## Case DNA quality scorecard

`case-dna-quality-scorecard.mjs` provides deterministic diagnostics:
- evidence modality variety;
- competing hypothesis depth;
- corroboration of essential evidence;
- deduction structure;
- stage structure;
- causal misdirection;
- canonical uniqueness;
- source grounding when provenance is supplied;
- fingerprint richness.

It deliberately does NOT produce an overall score, rank, PASS or approval.

A structurally rich record can still be factually wrong, derivative, unfair, technically false or badly written.

Independent source review, Originality Gate, Theory Audit, Blind Investigator, fair-play review and human editorial judgment remain separate gates.
