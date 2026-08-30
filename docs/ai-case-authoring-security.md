# Paid AI case authoring: spoiler-safe workflow

The Mystery Logic web repository is public. A paid AI case must therefore treat its private canon as a production secret, not as ordinary source content.

## Storage boundary

### Public repository may contain
- runtime/schema code;
- generic synthetic test fixtures;
- spoiler-safe case manifests;
- hashes and version numbers;
- release-gate results that do not identify the culprit or expose hidden evidence;
- player-visible case content only when it is intentionally ready to be public.

### Public repository must never contain
- `culprit_id` for an unreleased paid case;
- private suspect knowledge/persona facts that expose the solution;
- hidden evidence bodies;
- unlock rules or dependency graph;
- confession conditions or `terminal_reply`;
- private theory requirements/explanation before they are intentionally public after release.

The authoritative private object lives only in `public.ai_case_canon`, which is service-role-only and has `draft / published / retired` states.

## Draft sequence

1. Author the player-safe payload and private canon separately.
2. Validate both against the generic v2 runtime contract.
3. Run a private state-space gate against the exact canon.
4. Store `paid_case_payloads` as `draft`.
5. Store the matching `ai_case_canon` row as `draft`.
6. Compute SHA-256 over the database JSONB representation of each row.
7. Commit only a spoiler-safe manifest containing hashes, versions, counts and non-spoiler gate outcomes.
8. Keep both database rows `draft` while UX, payment, entitlement, live-avatar and end-to-end tests are unfinished.

## Required private state-space assertions

Before publication every case must prove at minimum:
- at least one complete solution path exists below `max_turns`;
- the culprit cannot reach terminal confession before the authored minimum pressure depth;
- removing any core required evidence prevents terminal confession;
- removing any required contradiction/admission prevents terminal confession;
- no non-culprit can reach a terminal confession rule;
- every required hidden evidence item is reachable from the initial state through valid player actions;
- no rule depends on an unknown evidence/note id or on the note it grants itself;
- repeated rules do not grant the same discovery twice;
- the final theory cannot succeed without the evidence/notes the player actually earned.

## Publication gate

Publishing is an explicit two-row operation: public payload and private canon must be promoted together only after their manifest hashes still match the reviewed draft. The generic runtime reads only rows with `status = published`.

Never solve a deployment problem by copying private canon into browser JavaScript, HTML, a public JSON file, a GitHub issue, a PR body or a CI log.
