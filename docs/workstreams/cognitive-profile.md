# Workstream: Cognitive Profile

Date: 2026-09-21  
Status: **STAGING PRODUCT QA / CONTENT ACCEPTED / NOT PRODUCTION**

## Goal

Build a Mystery Logic cognitive / detective-profile acquisition layer that leads from a short reasoning assessment to an analyst dossier and then into real investigations.

## Product decisions

- 24 items, 6 scales × 4 items.
- No standardized IQ claim in v1.
- Public result stays descriptive: raw correct / 24 plus broad 0–4 subscale outcomes.
- No percentile or normed score before empirical calibration.
- No speed penalty.
- Deterministic SVG/HTML for visual items.
- Investigative items test evidence strength and over-inference.
- Guest-first: test and result require no registration.
- Production analytics/persistence are not implemented yet.

## Owner acceptance

- Initial staging test accepted overall.
- Original first item was rejected as too simple.
- Revised P1 was accepted.
- Owner then accepted all remaining items as strong: “остальные отлично”.

## Staging

Branch: `staging/cognitive-profile`  
Reviewed snapshot: `f92a42a6e474f3fe4eb3bf351f8ae48f430786ea`

Route:
`https://valera2872.github.io/ktovret-web/admin/cognitive-profile-preview/`

Current staging includes:
- 24-item playable test;
- six scale results;
- raw score / 24;
- completion time and answered count;
- Evidence Discipline explanation;
- strongest / most difficult observed scale wording;
- scale descriptions;
- guest-first bridge to the current LIVE solo-investigation hub;
- noindex/nofollow/noarchive and staging robots disallow.

Staging validation run: `35600521359` — SUCCESS.  
Staging deploy run: `35600568542` — SUCCESS.  
Staging artifact id: `10639220278`.  
Artifact digest: `sha256:0862b2531fd9a776a05532921bb78aee4540da71a10ba81952aae4097e9489c8`.

## QA

- Alternate-answer / ambiguity audit: PASS for current 24-item set.
- Deduction items with ordering/code constraints were rechecked for unique solutions.
- Numerical, spatial, abstract and evidence-strength items were independently re-solved.
- CI locks 24 items, 6×4 scale distribution, visual minimum, P1 key, result contract, noindex boundary and investigation CTA.
- Owner manual pass is positive.
- This is content/product QA, not psychometric validation.

## Production boundary

Not changed:
- Beget LIVE;
- `CURRENT_RELEASE.json`;
- canonical production baseline;
- Supabase schema/RLS/auth/payment/entitlement;
- production puzzle hub;
- analytics.

No production release is authorized from this checkpoint.

## Exact next step

Owner reviews the revised dossier/result screen on staging. If accepted:
1. freeze Cognitive v1 staging content;
2. design production integration: final public URL, navigation/SEO placement, guest persistence/account handoff, and analytics experiment;
3. preview that integration before any production patch or deploy.
