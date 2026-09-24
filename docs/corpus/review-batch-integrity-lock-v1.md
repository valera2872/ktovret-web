# Mystery Corpus — Review Batch Integrity Lock v1

Before a private review batch leaves the extractor context, create a per-file integrity lock:

```
node tools/mystery-corpus/build-review-batch-lock.mjs --batch-dir <unpacked-batch>
```

This writes `review-batch.lock.json` with:
- every non-hidden review-package file;
- byte size;
- SHA-256;
- batch id/version.

Before independent review:

```
node tools/mystery-corpus/build-review-batch-lock.mjs --batch-dir <unpacked-batch> --verify-only
```

Verification fails if:
- a locked file changed;
- a locked file disappeared;
- a new unlocked file appeared;
- size/hash differ.

The lock proves package integrity between extraction and review. It does NOT prove factual correctness or independent review quality.

For future review packages, run:
1. review-batch preflight;
2. create lock;
3. package/archive;
4. reviewer verifies lock;
5. independent review.
