# Mystery Logic production baseline

## Source of truth

Before creating any production patch, update, ZIP, or deployment package, read `CURRENT_RELEASE.json`.

The file referenced there is the **current user-verified LIVE production baseline**.

## Mandatory rules

1. Do not infer the live version from the latest commit, branch, pull request, workflow run, or GitHub Actions artifact.
2. Do not use an Actions artifact as a production base unless `CURRENT_RELEASE.json` explicitly designates that artifact.
3. For a small isolated change, create a minimal patch over the current LIVE baseline instead of rebuilding/replacing the whole site.
4. Preserve all unrelated files byte-for-byte whenever possible.
5. After deployment, verify the live site first. Only then publish/store the new full baseline and update `CURRENT_RELEASE.json`.
6. Any parallel chat or agent working on Mystery Logic must start by resolving `CURRENT_RELEASE.json`.

## Current live baseline

At the time this protocol was introduced, the user-confirmed live version is **10.6.7**.

The canonical ZIP is stored in the user's persistent Library at:

`/Mystery Logic/Production/MysteryLogic-LIVE-10.6.7.zip`

Its SHA-256 is recorded in `CURRENT_RELEASE.json` and should be checked before use.

## Patch naming

Use names such as:

`patch-10.6.7-golovolomki.zip`

A patch must contain only the paths that are meant to overwrite the live installation.
