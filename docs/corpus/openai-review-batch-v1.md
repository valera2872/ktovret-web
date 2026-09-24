# One-command independent OpenAI review

Once an API key is available, an unpacked private review batch can be processed with one command:

```
OPENAI_API_KEY=... \
node tools/mystery-corpus/run-openai-review-batch.mjs \
  --batch-dir /private/path/Mystery-Corpus-M2-Review-Batch-001-v0.3 \
  --reviewer-id openai-stateless-reviewer-001 \
  --out /private/path/review-batch-001-report.json
```

The wrapper:
1. starts the OpenAI stateless reviewer adapter on an ephemeral localhost port;
2. waits for readiness;
3. calls the existing independent batch-review runner;
4. writes one aggregate review report;
5. terminates the local adapter.

It does NOT promote files.

A non-zero exit code means at least one candidate is blocked, invalid, or needs rework.

The reviewer uses a fresh Responses API request per candidate, live web search, domain restriction when possible, and strict Structured Outputs.

The current ChatGPT extraction context is not used as the reviewer.
