# Mystery Logic — M5 End-to-End Theory Attack v1

This pipeline closes the current Case Architect v2 theory-validation loop.

```
PRIVATE CASE DNA
      |
      | local only
      v
final blind packet
      |
      | solution-isolated HTTP boundary
      v
adversarial theory provider
      |
validate against visible evidence
      v
merge alternatives into private Case DNA
      |
      v
deterministic Theory Audit
      |
      v
PASS / FAIL unresolved alternatives
```

Entry point:

`node tools/mystery-corpus/run-adversarial-theory-audit.mjs --case PRIVATE.json --endpoint http://... --out report.json`

Rules:
- provider never receives the private case file;
- the final player packet is validated before provider execution;
- provider theories are validated against player-visible evidence;
- theories requiring a new answer-changing fact are rejected;
- generated alternatives are merged only locally;
- Theory Audit decides whether final evidence actually discriminates them.

A FAIL means the authored case needs repair, not that the generated alternative is necessarily the true explanation.
