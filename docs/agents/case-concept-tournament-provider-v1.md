# Case Architect v2 — Provider-neutral Concept Tournament Runner

Entry point:

```
node tools/mystery-corpus/run-concept-tournament-provider.mjs \
  --manifest corpus-layers.json \
  --brief "Premium Solo ..." \
  --outdir /private/tournament-001 \
  --endpoint http://127.0.0.1:...
```

The runner performs:
1. approved-only Case Architect context retrieval;
2. baseline request creation with NO corpus context;
3. corpus request creation with approved context;
4. two separate provider HTTP calls;
5. validation of both `case_concept_v1` outputs;
6. deterministic counterbalancing of X/Y order from pair ID;
7. anonymized evaluator packet;
8. private mapping file withheld from evaluator.

The provider endpoint accepts `case_concept_provider_request_v1` and returns either the concept directly or `{"concept": {...}}`.

This runner does not evaluate which concept is better. Evaluation must happen in another stateless context after the X/Y packet is created.

Environment:
- `CASE_CONCEPT_ENDPOINT`;
- optional `CASE_CONCEPT_TOKEN`.

No production dependency is introduced.
