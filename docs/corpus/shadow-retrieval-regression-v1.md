# Mystery Corpus — Shadow Retrieval Regression v1

Purpose: measure whether `needs_review` M2 candidates add useful retrieval coverage without promoting them into the approved corpus.

The tool creates a temporary merged directory, runs the existing deterministic Retriever against:
1. approved base only;
2. approved base + unapproved overlay.

It reports:
- which queries gain overlay hits;
- source-type diversity changes;
- matched-dimension diversity changes;
- exact overlay cases appearing in top results.

Hard boundary:
- the approved base directory is never modified;
- no merged corpus is persisted;
- output says `mode=shadow_only`;
- results are diagnostic only;
- unapproved records must not be used as production truth or generation evidence.

Default pilot query set:
`docs/corpus/m2-shadow-queries-v0.1.json`.
