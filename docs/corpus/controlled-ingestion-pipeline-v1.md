# Mystery Corpus — Controlled Ingestion Pipeline v1

M2 does not mean "send 300 links to a model."

The ingestion unit is a job generated from a rights-validated source plan.

Pipeline:

```
Source Queue
   |
rights gate
   v
Ingestion Plan
   |
build-ingestion-jobs
   v
Job Envelope
   |
extractor / analyst
   v
Case DNA + Provenance Sidecar
   |
validate-case-dna
validate-case-dna-provenance
validate-ingestion-bundle
   |
   v
PRIVATE CORPUS
```

Hard rules:
- blocked/unknown-rights sources never receive an ingestion job;
- analysis-only sources retain no source text;
- extractor may not fabricate unknowns;
- extractor may not copy a distinctive protected plot as a generation template;
- critical Case DNA claims require source locators;
- approved ingestion requires provenance approval;
- Case DNA source rights/policy must match both provenance and job envelope.

This pipeline is intentionally provider-neutral. Human researchers, a stateless model, or a future Work/agent process may perform extraction, but the same gates apply.
