# AI-01 public Text release

This branch contains the launch candidate for the first public AI investigation while keeping Live experimental and isolated.

## Release intent

- AI-01 Text: free acquisition case.
- Input: text or microphone speech-to-text.
- Suspects: static dossier portraits in public Text mode.
- AI-01 Live: remains private / owner-preview only and is not part of the public offer.
- Sitewide promotion: enabled in this release branch.
- Analytics: tracks case start, first question, 3/5 questions, evidence use, suspect switching, theory submission, completion, "want another AI case", and Live interest.

## Sitewide launch message

- Kicker: `Новое · AI-расследование · бесплатно`
- Promise: `Допрашивайте подозреваемых голосом или текстом.`
- CTA: `Принять дело →`
- `assets/ai01-launch-promo.js` has `PUBLIC_LAUNCH = true` in this release branch.
- Admin routes stay outside the campaign injection.

## Static suspect portraits

Public Text no longer depends on paid LiveAvatar rendering. The interrogation stage shows dossier portraits for Marina, Anton and Lev. The portrait layer sits behind the existing video element so the private Live owner-preview can still overlay a real stream during future provider experiments.

## Initial indexing policy

The first public stability wave remains `noindex,follow` and stays out of the sitemap. This is intentional: the case can be promoted to existing Mystery Logic traffic immediately without touching the central SEO/sitemap generator while the parallel Last Aria release work is still in flight. After the first clean public cohort, indexing can be switched on as a separate low-risk SEO change.

## Runtime economics / guardrails

The deployed Text interrogation backend uses the launch profile:

- 30 questions per case session,
- 180 AI turns per visitor per day,
- 2000 AI turns per network per day,
- $10 daily global AI budget.

Abuse and rate-limit protection remains. LiveAvatar provider spend is not required for the public Text experience.

## Parallel release safety

Branch: `release/ai01-text-public-20260907`.

Do not merge this branch while the parallel Last Aria fix is still changing `main`. Once that work lands:

1. refresh/reconcile this branch against the new `main`;
2. verify the changed-file overlap is limited and intentional;
3. run AI-01 release contract, voice input contract, full AI detective vertical slice and production Beget validation;
4. merge only after all checks are green;
5. verify that production still strips `admin/ai01-live-preview` and the LiveAvatar factory.
