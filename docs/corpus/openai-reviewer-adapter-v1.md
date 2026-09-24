# OpenAI stateless Corpus Reviewer adapter

This optional non-production adapter satisfies the HTTP contract expected by:

- `run-extraction-review-provider.mjs`
- `run-review-batch-provider.mjs`

It creates one independent Responses API request per review and does not carry conversation state between candidates.

## Why this adapter exists

The extractor conversation cannot independently approve its own extraction. The reviewer must be a separate stateless model execution with source browsing.

The adapter:
- accepts only `corpus_review_provider_request_v1`;
- rejects reviewer/extractor identity reuse;
- enables live web search;
- constrains web search to source/right-evidence domains when URLs are available;
- uses Structured Outputs with the `corpus_extraction_review_v1` JSON Schema;
- keeps private-corpus write access out of the reviewer;
- returns only a review verdict. It cannot promote files.

## Runtime

Environment:

```
OPENAI_API_KEY=...
OPENAI_REVIEWER_MODEL=gpt-5.6-sol   # optional
CORPUS_REVIEWER_PORT=8787           # optional
```

Run:

```
node tools/mystery-corpus/openai-reviewer-adapter.mjs
```

Then point the batch runner to:

```
http://127.0.0.1:8787/review
```

## Independence requirement

A fresh Responses API call is necessary but not sufficient if the prompt itself leaks extractor-private context.

The adapter therefore receives only the explicit review contract assembled from the private review batch. It does not load Project memory, ChatGPT memory, Private CANON, approved corpus, or previous review responses.

The reviewer may search the public source URLs needed to verify the extraction.

## API basis

Implementation follows the current OpenAI Responses API pattern:
- `POST /v1/responses`;
- `tools: [{ type: "web_search" }]`;
- Structured Outputs via `text.format.type = "json_schema"`.

The adapter is provider-specific; the rest of Mystery Corpus remains provider-neutral.
