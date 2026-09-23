# Mystery Corpus — Independent Review / Promotion Gate v1

An extraction is never promoted to the approved private corpus merely because it passed structural validators.

Flow:

```
Extraction Result (needs_review)
        |
        v
Independent Reviewer
        |
        v
corpus_extraction_review_v1
        |
validate-extraction-review
        |
validate-ingestion-promotion
        |
        v
eligible_for_private_corpus
```

Rules:
- reviewer must differ from extractor;
- reviewer independently opens the registered source;
- every critical provenance locator is checked;
- approval requires all six hard checks to be true;
- no fail issue may remain;
- promotion re-runs Case DNA, provenance and ingestion-job consistency with an approved provenance state;
- validation only marks eligibility; actual private-corpus mutation is a separate controlled action.

This protects the corpus from self-confirming extraction errors at scale.
