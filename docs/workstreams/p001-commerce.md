# P-001 commerce candidate — NOT READY
2026-11-27. Owner approved 299 RUB permanent access. Based on deployed sources (not main):
- create-checkout-solo v4, deployed bundle SHA-256 20991811afc9026d29cb559232e4d03512fa1fd2c08d70aa9c7105a201c59cef
- payment-status-solo v5, deployed bundle SHA-256 538d10d25490fa371ef16d1f35ba7a764cf5d1a7dbb47f21dc758152bb52e993
- tbank-webhook-solo v5, deployed bundle SHA-256 97d49a4b60163624018cd7d5ed85c38df7b67aa6e9e59de7a2914bb585d3d3cd

P001 checkout disabled unless P001_CHECKOUT_ENABLED=true AND case and paid payload are published, production eligible and private canon classification matches. Existing products retain deployed paths. No deploy or env changes. Status and webhook continue serving previously paid orders regardless of checkout switch. P001 access is scoped to P-001. No discounts on P001. Offer version is a draft identifier; terms/UI require verification before release.

Next: typecheck, mocked actual-handler regressions for three products, signed webhook and refund tests, verify shared payment helpers and frontend integration, legal offer version, real bank test, secure AI and release gates. No merge/deploy before approval. No private canon in repository.
