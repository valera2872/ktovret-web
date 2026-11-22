# Mystery Logic — Moreno Free v0.5: установочный патч Beget
Дата: 2026-11-22. Lifecycle: **готова к ручной установке проверенная трёхфайловая сборка; не LIVE до deploy и проверки владельца**.

## Решение владельца
Дело **бесплатное**. Античит-защита скрытого канона в публичном JavaScript экономически неоправданна для Free. Не менять/не создавать серверный финал, функции, схему, платежи; сохранить оригинальный v0.5 внешний вид с работающим modern v6 Game Engine, AI v23→v11, memory и final v25. Не переписывать интерфейс новыми дизайн-слоями.

## База и LIVE
- `CURRENT_RELEASE.json`: `MysteryLogic-FINAL-BASE-2026-09-25.zip` SHA-256 `a510891c3d68dcef723e5ff2f88789a8ad164ee3e777ac95db21b5544e407185`; проверено.
- Владелец передал Beget `realnye-dela/pozharnaya-lestnica-1991-premium/index.html`, SHA-256 `254a8808f0252cca29eb26a5868fa65b2c0670ea37a88d2885d76fd2fc9f50ea` 2026-11-19, 53 Moreno assets и 3 sitewide files (funnel/menu); все проверены.
- GitHub Actions QA-run `45025726572` on 2026-11-22 did `node tools/real-case-moreno-free-live-parity.mjs`: **PASS** byte-for-byte current `https://mysterylogic.com/realnye-dela/pozharnaya-lestnica-1991-premium/` HTML SHA-256 equals owner's Beget export. Thus source page not outdated at preinstall check. Other assets are not overwritten.

## Patch contents EXACT
`MysteryLogic-Moreno-Free-v05-Beget-PATCH-2026-11-22.zip` SHA-256 `96267f4bdf510b31c0b137918cf614b6363d706d14e2363c7307d31578b7eaf6`.
1. `realnye-dela/pozharnaya-lestnica-1991-premium/index.html`, SHA-256 `c726cada177fdda9d04cb75f95491a005e535cc7e63826402da5ce8c645f8c69`.
2. `assets/real-case-moreno-v05-compat.css`, SHA-256 `5a45142bec03adf4cf19955a5861c59d6e52bcbcb8eb05bf553a56bc17437485`.
3. `assets/real-case-moreno-v05-brief.js`, SHA-256 `94f4fabb4b581ebeb0258be01d9059429a8a23cfaf8645d544b8b37970a8af3c`.
No other live files touched. CSS/JS query strings on HTML use content SHA prefixes to bypass cache. Source arrest announcement link suppressed visually before reveal (official references remain in reveal). Scope: old v0.5 styling and layout, current v6 engine and final v25 untouched.

## Verification
- ZIP CRC PASS, exact three-file inventory, **unpacked issued ZIP into clean directory** and overlaid into a pristine mirrored site, byte-for-byte SHA verified.
- Browser Chromium desktop 1366×900, tablet 768×1024, mobile 390×844: 16 turn full mock-network investigation, 11 evidence flags, live UI flow accept→interviews→ballistics→trajectory→hypothesis→final form→reveal, progress persists after a fresh page parse with same localStorage; no JS errors or page horizontal overflow. Mobile drawer open and Escape close; desktop navigation ends inside viewport.
- Negative tests: no pre-reveal official arrest link, incorrect culprit cannot reveal answer, insufficient evidence cannot reveal. POST-reveal official sources remain present.
- **REAL live server investigation** in GitHub Actions run `45025400880`: full `tools/real-case-moreno-free-full-live-e2e.mjs` PASS, with independent QA IDs and multiple witness AI answers, evidence/experts and submission. Route v11→v9→v8 (v8 version 11 deployed in prior workstream).
- Follow-up CI `45025726572`: Beget LIVE parity and real full AI steps PASS; existing Moreno vertical suite continuing post-checks at last update.
- Caveat: offline browser and real live API checks are independent; no claim of single physically networked full-browser run. Real deployment verification must occur after owner's Beget extraction.

## Installation and rollback
Backup current `.../realnye-dela/pozharnaya-lestnica-1991-premium/index.html`, unpack above ZIP in website root (folder containing `assets` and `realnye-dela`), overwrite that one HTML; two CSS/JS are additions. Do not unpack in `realnye-dela` itself. Refresh cache private window and play through. Roll back by restoring backed-up index.html; the orphan add-on assets do not change other pages. Do not alter CURRENT_RELEASE until owner verifies deployed site.

## Release controls
No Beget deployment done, no owner deployment confirmation yet. No payment/auth/entitlement/database/schema/AI backend changed **in this release-preparation turn**. Keep GitHub QA branch Draft unmerged. Post-deploy LIVE verification, user's approval and canonical release update remain pending.
