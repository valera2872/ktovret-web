# Mystery Corpus — Source Grounding Audit v1

This is a pre-review QA stage performed by the extractor/research context.

It exists to catch obvious source problems before paying the independence cost of a separate reviewer.

It MAY:
- reopen official sources;
- check critical provenance locators;
- identify allegation/fact framing problems;
- repair the extractor's own candidate;
- verify that rights-evidence URLs are reachable and relevant;
- mark a candidate `ready_for_independent_review`.

It MUST NOT:
- set `approved`;
- impersonate an independent reviewer;
- satisfy the Extractor != Reviewer gate;
- promote files to the approved private corpus.

The schema hard-codes:
- `independent_review=false`;
- `can_approve=false`;
- `summary.independent_review_still_required=true`.

If this audit repairs a candidate, the next independent reviewer must review the repaired version, not the prior package.
