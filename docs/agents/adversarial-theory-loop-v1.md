# Mystery Logic — Solution-Isolated Adversarial Theory Loop v1

Pipeline:

```
final player-visible packet
        +
optional blind-run observations
        |
        v
Adversarial Theory Provider
        |
validate-adversarial-theories
        |
merge-adversarial-theories
        |
Theory Audit
        |
PASS / unresolved alternative FAIL
```

The adversarial provider never sees Private CANON.

Its task is not to guess the author's answer. Its task is to find other explanations that fit the evidence the player actually had.

A fair competing theory:
- uses only player-visible evidence;
- may make explicit assumptions;
- does not require a new answer-changing fact;
- names discriminating checks that could have been performed before reveal.

If an independently generated theory survives final evidence without contradiction, the case fails final discrimination until repaired.

Provider endpoint:
- `ADVERSARIAL_THEORY_ENDPOINT`, or fallback to `BLIND_INVESTIGATOR_ENDPOINT`;
- optional bearer token: `ADVERSARIAL_THEORY_TOKEN`.

No provider credential or endpoint is committed to GitHub.
