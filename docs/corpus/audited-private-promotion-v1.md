# Mystery Corpus — Audited Private Promotion v1

Independent approval is necessary but not sufficient for a record to enter the approved private corpus.

Promotion is an explicit second action.

Dry-run:

```
node promote-reviewed-extraction.mjs --result result.json --review review.json --job job.json --dest APPROVED_DIR
```

This validates eligibility and writes nothing.

Execution requires an explicit flag:

```
... --execute
```

On success it writes:
- `<case_id>.json` — exact approved Case DNA bytes;
- `<case_id>.promotion.json` — immutable audit receipt with Case DNA SHA-256, extraction run, job, extractor, independent reviewer, review timestamp and rights evidence.

No implicit overwrite is allowed.

`build-approved-corpus-registry.mjs` validates all promotion receipts and their bound Case DNA hashes.

This remains private-data tooling. It does not publish to LIVE, GitHub public corpus, Game Engine, or production Supabase.
