# AI-01 public release prep

This branch prepares the public Text release of AI-01 while keeping it closed until explicit owner approval.

## Release intent

- AI-01 Text: free acquisition case.
- AI-01 Live: remains private / owner-preview only.
- Production rollout: disabled until approval.
- Promotion: prepared as a site-wide launch module, but not active on mysterylogic.com yet.
- Analytics: launch funnel tracks case start, first question, 3/5 questions, evidence use, suspect switching, theory submission, completion, "want another AI case", and Live interest.

## Site-wide launch message

- Kicker: `Новое · AI-расследование · бесплатно`
- Promise: `Допрашивайте подозреваемых своими словами.`
- CTA: `Принять дело →`
- Public flag is hard-OFF in `assets/ai01-launch-promo.js` until explicit approval.
- Closed visual-preview mode is enabled only with `?ai01_preview=1` and lasts for the current browser session.

## Early-access / compensation use

Before the public launch, AI-01 may be offered to a customer as early access / compensation. Position it as access before everyone else, not as a replacement value claim. Do not expose the public site-wide campaign for that use.

## Runtime economics / guardrails

The deployed Text interrogation backend uses a launch-preview profile:

- 30 questions per case session (gameplay boundary retained),
- 180 AI turns per visitor per day,
- 2000 AI turns per network per day,
- $10 daily global AI budget.

The old $0.50 global budget was intentionally raised so a small public wave cannot shut the case down. Abuse and rate-limit protection remains; economic protection is loosened, not removed.

## Launch controls

Do not merge or deploy this branch to production until explicit approval. Keep the case `noindex,follow`, keep it out of the sitemap, and keep Live assets / owner preview stripped from the Beget production runtime until the separate Live launch decision.