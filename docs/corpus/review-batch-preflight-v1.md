# Mystery Corpus — Review Batch Preflight v1

Before any private review batch is sent to an external/stateless reviewer, run:

```
node tools/mystery-corpus/validate-review-batch.mjs --batch-dir <unpacked-batch>
```

The preflight checks:
- manifest schema and extractor identity;
- required candidate files;
- standalone Case DNA / provenance / notes equal the embedded extraction result;
- manifest case IDs and folder uniqueness;
- extraction run and job ID uniqueness;
- review-request identity and source references;
- exact rights status / ingestion policy / rights evidence / verification-date consistency;
- `needs_review` state;
- the existing extractor-result + ingestion-bundle validators for every candidate.

This check does NOT approve source correctness. It only proves the review package is internally coherent enough to send to an independent reviewer.
