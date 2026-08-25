# Release Gate records

For every release candidate of a large Mystery Logic investigation, copy `TEMPLATE.md` to a case-specific record and complete it only after running the mandatory process in `../CASE_RELEASE_GATE.md`.

## Invocation

Normal mode is automatic: no user phrase is required. The Gate runs before any large case can be called ready to publish and reruns after any substantive content, UX, game-flow, commerce, or security change.

Manual emergency command: **Полный Release Gate**.

That command invalidates prior PASS results for the current candidate and forces a clean run from G0 through G9.

A case-specific record is valid only when the audited tree SHA and the exact production artifact SHA-256 are recorded and all ten gates plus all independent adversarial passes are PASS.
