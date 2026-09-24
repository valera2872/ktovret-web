# Mystery Corpus — Review Batch Runner v1

The batch runner processes an unpacked private review batch through one independent stateless reviewer provider.

Entry point:

`node tools/mystery-corpus/run-review-batch-provider.mjs --batch-dir <dir> --reviewer-id <id> --endpoint <url> --out batch-report.json`

For every candidate it:
1. calls the independent review provider;
2. validates reviewer identity and review schema;
3. runs promotion eligibility validation;
4. records approved/blocked/invalid status;
5. continues to the next candidate even if one fails.

The batch runner NEVER:
- rewrites extraction data;
- promotes/moves files;
- changes review verdicts;
- retries a failed claim by weakening the checks.

Exit status is non-zero when any candidate is blocked. The output report still contains all candidate results.

Use this for private review batches such as `m2-review-batch-001`.
