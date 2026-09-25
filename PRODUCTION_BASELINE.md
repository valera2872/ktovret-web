# Mystery Logic production baseline

## Mandatory source of truth

Before **any** production patch, update, ZIP, deploy, or visual/content change:

1. read `CURRENT_RELEASE.json`;
2. materialize the exact ZIP referenced there from Library;
3. verify its SHA-256;
4. inspect the current implementation and current `mysterylogic.com` for concurrent changes;
5. modify only the required files.

Every parallel chat or agent working on Mystery Logic must follow this sequence.

## Canonical production base — 2026-09-25

The mandatory baseline is:

`/Mystery Logic/Production/MysteryLogic-FINAL-BASE-2026-09-25.zip`

Release id:

`canonical-live-2026-09-25`

SHA-256:

`a510891c3d68dcef723e5ff2f88789a8ad164ee3e777ac95db21b5544e407185`

Size:

`7,558,894 bytes`

Files:

`686`

ZIP integrity:

`PASS`

This file is byte-identical to the owner-verified production snapshot `MysteryLogic-LIVE-2026-09-25.zip`.

## Mandatory rules

1. **Do not use older ZIPs as a production base.** This includes the 2026-09-23 baseline, intermediate IQ candidates, and obsolete S1 patches.
2. **Do not infer production from GitHub `main`, a commit, PR, workflow run, or Actions artifact.**
3. **Do not replace this baseline with your own rebuilt copy.** Use the exact Library file referenced by `CURRENT_RELEASE.json`.
4. For isolated changes, build a minimal patch over this baseline and preserve unrelated files.
5. Before deployment, inspect the current LIVE site for concurrent changes.
6. A new candidate, commit, merge, ZIP, or CI artifact is **not** the new baseline by itself.
7. A newer canonical baseline is created only after:
   `deploy -> verify mysterylogic.com -> owner confirmation -> save verified full LIVE baseline -> update CURRENT_RELEASE.json`.
8. Do not invent semantic version numbers. Use the explicit release id/date from `CURRENT_RELEASE.json`.

## Current IQ S1 state

The old L-shaped S1 with orange marker is retired and must not be restored.

Canonical S1:
- start arrow: UP;
- 90° clockwise;
- 180° counter-clockwise;
- 360° clockwise;
- final direction: LEFT;
- correct answer: A / index 0.

The approved visual is the premium multistep version with separate rotation cards.

## Purpose

This document exists to prevent parallel chats from rebuilding production from stale archives or partial candidates. When in doubt, `CURRENT_RELEASE.json` wins.
