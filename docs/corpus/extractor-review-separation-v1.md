# Mystery Corpus — Extractor / Reviewer Separation v1

M2 uses two distinct roles.

## Extractor

Input:
- a rights-approved `corpus_ingestion_job_v1`;
- the authorized/public source identified by that job.

Output:
- `corpus_extraction_result_v1`;
- Case DNA;
- provenance sidecar;
- extraction notes.

Extractor rules:
- never fabricate missing critical facts;
- never copy source prose or a distinctive plot as a template;
- analysis-only sources retain no source text;
- every critical claim gets a locator;
- reconstructed hypotheses are explicitly abstractions;
- extractor MUST set provenance review status to `needs_review`;
- extractor cannot approve its own record.

## Reviewer

Reviewer receives extraction result plus source access.

Review checks:
- rights/policy match;
- source support for critical claims;
- preservation of UNKNOWN;
- grounding of reconstructed hypotheses;
- no raw-source leakage;
- no distinctive-plot copying.

Hard separation:
`reviewer_id != extractor_id`.

Only an independent review with every hard check true may return `approved`.

This is a data-quality boundary, not merely an editorial convention.
