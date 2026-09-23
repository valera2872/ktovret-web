# Mystery Corpus — Extraction Provenance Gate v1

Purpose: stop scale from turning the corpus into AI-authored pseudo-facts.

Starting with M2, every newly ingested Case DNA record should have a private provenance sidecar:
`case-dna-provenance-v1`.

Critical areas:
- incident;
- core mechanism;
- evidence;
- hypotheses;
- reveal / known resolution.

Allowed statuses:
- `source_supported` — directly grounded in a source location;
- `abstracted_from_source` — a structural abstraction of source-supported material;
- `editorial_inference` — editorial interpretation, never allowed for a critical factual claim;
- `unknown` — explicitly unresolved;
- `not_applicable`.

For an approved ingestion:
- every critical area has provenance coverage;
- critical source-supported/abstracted claims have locators;
- no critical claim remains UNKNOWN;
- no critical claim is merely an editorial inference.

Exception: genuinely unresolved real cases may remain non-approved/reference-only and preserve UNKNOWN rather than fabricate a solution.

The sidecar belongs in the private data layer when it carries spoiler-bearing locators or detailed source mapping.
