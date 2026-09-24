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

## Source-lineage guard

When a reviewed candidate has the same normalized `source_reference` as an already approved Case DNA record, promotion is refused unless the operator explicitly supplies:

```
--approved-reference-dir <approved-source-directory>
--supersedes <existing_case_id>
```

The superseded case ID must be one of the actual same-source matches.

This rule prevents:
- a richer re-extraction of the same book/case from becoming a second independent retrieval vote;
- accidental duplicate promotion of legacy seed material;
- silent replacement without an audit trail.

If one source URL contains multiple distinct works (for example an anthology), URL equality alone is not sufficient to choose which work is superseded. The operator must explicitly identify the lineage target.

The promotion receipt records:
- `supersedes_case_id`;
- `same_source_collision_count`.

Promotion still never deletes the legacy record automatically. Active-corpus rebuilding/migration must resolve the recorded lineage explicitly.

