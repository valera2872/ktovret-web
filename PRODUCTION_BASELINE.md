# Mystery Logic production baseline

## Source of truth

Before creating any production patch, update, ZIP, or deployment package, read `CURRENT_RELEASE.json`.

The file referenced there is the **current user-verified LIVE production baseline**.

## Mandatory rules

1. Do not infer the live build from the latest commit, branch, pull request, workflow run, or GitHub Actions artifact.
2. Do not use an Actions artifact as a production base unless `CURRENT_RELEASE.json` explicitly designates that artifact.
3. Do not invent, infer, or assign a version number. A version identifier may be used only if the user explicitly provides one or it is present in the deployed build itself.
4. For a small isolated change, create a minimal patch over the current LIVE baseline instead of rebuilding/replacing the whole site.
5. Preserve all unrelated files byte-for-byte whenever possible.
6. After deployment, verify the live site first. Only then publish/store the new full baseline and update `CURRENT_RELEASE.json`.
7. Any parallel chat or agent working on Mystery Logic must start by resolving `CURRENT_RELEASE.json`.

## Current live baseline

The current baseline has **no version number assigned**.

The canonical ZIP is identified by date and stored in the user's persistent Library at:

`/Mystery Logic/Production/MysteryLogic-LIVE-2026-09-20.zip`

Original uploaded filename:

`MysteryLogic-PRODUCTION-2026-09-20-CHECKED-FIXED(1).zip`

Its SHA-256 is recorded in `CURRENT_RELEASE.json` and should be checked before use.

## Patch naming

For a dated baseline, use names such as:

`patch-2026-09-20-golovolomki.zip`

A patch must contain only the paths that are meant to overwrite the live installation.
