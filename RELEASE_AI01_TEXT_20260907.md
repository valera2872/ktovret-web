# AI-01 Text release candidate — 2026-09-07

## Public product
- Free Text investigation: «Восемь минут без камеры».
- Free-form typed interrogation plus microphone speech-to-text.
- Static dossier portraits for Marina, Anton and Lev.
- Evidence presentation, memory of testimony, suspect switching, theory and final reconstruction retained.
- LiveAvatar is not part of the public offer and remains owner-preview only.

## Rollout
- Sitewide promo is enabled in the release branch.
- First public stability cohort stays `noindex,follow` and out of sitemap.
- Production must strip `admin/ai01-live-preview` and `assets/ai-liveavatar-factory.js`.
- Public Text play has no paid LiveAvatar dependency.

## Portrait packaging
- Static suspect artwork is shipped as `assets/ai01-suspects-strip.jpg` rather than an inline/base64 payload.
- Release contracts validate JPEG signature and minimum payload size.

## Release gate
Before merge:
1. reconcile with latest `main`;
2. AI-01 public Text release workflow green;
3. AI detective vertical slice green;
4. production Beget bundle green;
5. Last Aria and existing premium/SEO regression checks remain green.

Do not merge while any release-blocking check is red.