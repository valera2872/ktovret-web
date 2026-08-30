# Mystery Logic puzzle editorial workflow

## Owner flow

1. Open `/admin/puzzles/`.
2. Use the same `MLADM-…` moderator key as `/admin/reviews/`.
3. Review each puzzle's condition, choices, correct answer, hint and explanation.
4. Choose **Утвердить**, **Отклонить**, or return it to **На проверку**. An optional editor note is stored with the decision.

## Publication rule

The first quick-puzzle release is a 33-puzzle editorial batch. Public builds are fail-closed:

- every one of the 33 current source versions must be approved;
- the build compares a SHA-256 fingerprint of each current source object with the approved fingerprint returned by the editorial service;
- changed source content no longer matches the old approval;
- if the manifest is unavailable, incomplete, rejected, pending or mismatched, the new audience layer is omitted from the public build;
- internal `--mode editorial` builds retain the full corpus for QA.

Until 33/33 exact approvals are present, public builds keep the existing 20 Expert puzzles and do not create the five new audience collection pages or `/golovolomki/<slug>/` pages.

The public approval manifest contains only puzzle IDs and fingerprints. Pending/rejected content and answer text require the owner moderator key.
