# Mystery Logic · Moreno Free — фото и осмысленная экспертиза (2026-11-23)

Lifecycle: **готово к ручной установке Beget-патча; LIVE-файлы Beget не менялись автоматически**.

## Пользовательский дефект и подтверждение
- После установки `MysteryLogic-Moreno-Free-v05-Beget-PATCH-2026-11-22.zip` пользователь прислал три LIVE скриншота: битый портрет Patricia вместо фотографии, исчезли атмосферные иллюстрации, общее «Нужно одно уточнение» на команды об экспертах и точный запрос «нужны экспертиза с рук бойфренда, стрелял ли он, может есть следы пороха?».
- Изображение раньше загружалось с Middlesex DA `capture_3.jpg`, адрес возвращает 404; изображение портрета 862×575 восстановлено из источника Oxygen/Middlesex DA, существовавший Unsplash fire-escape image 900×1350 восстановлен отдельно; это **редакционная иллюстрация**, не выдаётся за снимок места преступления.
- Источники изображений были доступны, но CDN отдавал **AVIF с именем JPG**. Поэтому финальный ZIP содержит перекодированные **реальные JPEG** (JFIF, image/jpeg), а не AVIF под неправильным расширением.
- Snapshot of installed live `https://mysterylogic.com/realnye-dela/pozharnaya-lestnica-1991-premium/` SHA256 `c726cada177fdda9d04cb75f95491a005e535cc7e63826402da5ce8c645f8c69`, **PASS exact byte match** with the owner's previously installed patch HTML, verified from GitHub Actions `45072005117` (PR #390).

## Backend
- Production Supabase **only** project `orknvuwknvsedjgqcfwc`. Updated **only** `ai-moreno-investigator-v11` from version 4→5, remains ACTIVE, `verify_jwt=false`, source in draft PR #391 (`fix/moreno-forensic-gsr-20261123`). No schema/RLS, auth/payment, other Edge Functions or LIVE site changes.
- An explicit *player request* for evidence of gunshot residue/hand swabs on boyfriend's hands routes to pre-existing `unsupported_forensic` operation, with the user request as note. No fake tests/results/evidence created. General unspecified expert request still correctly asks for specialization. Questions addressed to active boyfriend such as «Вы стреляли? На руках были следы пороха?» stay `ask_witness`; ballistics of recovered projectile still `forensic_ballistics`.
- CI run **45071564479** re-run job **137359812010** completed SUCCESS: 4 positive + 5 negative + origin/auth/final unit, real production `v11` smoke exactly user GSR phrase → `player_requested_source_limited_forensic [unsupported_forensic]`, witness question → `deterministic_active_interview [ask_witness]`, ballistics → `ai_plan [forensic_ballistics]`.

## Beget installable PATCH exact
Archive: `MysteryLogic-Moreno-Free-FIX-Images-2026-11-23.zip`, **SHA256 `13f9045af102589fb2e0dfccf00c8016b89d0d62e8f2036699aa98c13ac4a10b`**; contents exactly:
1. `realnye-dela/pozharnaya-lestnica-1991-premium/index.html` SHA256 `2215094ecc591963ddbd8a519ee9f0d3dee7d488674d47ce8f26ac112fa07a4f`
2. `assets/real-case-moreno-v05-compat.css` SHA256 `dab1cdf4a4099d6747d77586f3ce87d308b565d173cfd79705c4bb9268aca411`
3. `assets/real-case-moreno-v05-brief.js` SHA256 `818e7f17233ce4983593e2d3c075c6fcd07ca62e4d7a070dee6842aafbdb6c7c`
4. `assets/real-case-moreno-patricia-documentary.jpg` SHA256 `160ad2d6e25e07d3b575200a5102185670c11f1f4ec10bf25342f079facb1832`, real JPEG 862×575
5. `assets/real-case-moreno-fire-escape-editorial.jpg` SHA256 `59aec4e656027550dd09d5295b4cde193315e369c6d41a8e52f2e73396b864ec`, real JPEG 900×1350
No edits to game engine, v23 AI router, final v25, entitlement, analytics, shared menu or other cases. Cache query strings for revised CSS/JS in HTML.

## Gate and QA
- The **exact 5-file issued ZIP** was unpacked into a **clean directory**, SHA and ZIP CRC verified; overlaid against canonical `MysteryLogic-FINAL-BASE-2026-09-25.zip` plus the owner's three sitewide Beget files; all HTML-linked 15 styles + 16 scripts present and no missing references.
- Browser Chromium cleanroom re-run on **exact ZIP**: desktop 1649, tablet 768, phone 390 pixels, actual v6 game engine with isolated mocked network, **14 investigation commands/11 evidence flags**, 2 illustrated cards, persistent state after a new page with same localStorage, final reveal all PASS. Portrait naturalWidth 862. Zero JS exceptions, zero horizontal overflow. Real backend smoke **separate** as above; no claim of a single browser+live-network end-to-end test.
- Editorial source link on opening remains deferred until reveal. No user progression cleared. Free case, owner expressly chose not to add costly private-canon anti-cheat redesign.
- User installs ZIP manually in web root (contains `assets` and `realnye-dela`) after backup of existing 3 files and then confirms. Do not treat prepared ZIP as already deployed. **Do not update CURRENT_RELEASE.json** until real LIVE verified and owner confirms.
