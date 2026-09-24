# Case Architect v2 — Corpus Context Pack v1

This is the safe bridge from Mystery Corpus into actual case creation.

Entry point:

```
node tools/mystery-corpus/build-case-architect-context.mjs \
  --manifest corpus-layers.json \
  --brief "Premium Solo logistics mystery..." \
  --mode approved
```

The output deliberately contains:
- abstract mechanism tags;
- evidence topology;
- reversal tags;
- decisive-proof tags;
- editorial lessons;
- a similarity watchlist.

It deliberately excludes:
- source evidence facts;
- source hypotheses/solutions;
- reveal prose;
- raw source text;
- source plot summaries.

Default mode is `approved`.

`shadow` mode is allowed only for research and diagnostics; the output explicitly marks unapproved origins.

The context pack is not a case generator by itself. Case Architect must still build a fresh CANON and then pass:
- Originality Gate;
- Theory Audit;
- solution-isolated Blind Investigator;
- Fair Play / G0-G9 / Cognitive Gate.

The goal is retrieval-augmented reasoning without retrieval-augmented copying.
