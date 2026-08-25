# Case Release Gate record

> Копировать для каждого релиз-кандидата большого дела. Не отмечать PASS по памяти или по предыдущей версии.

## Candidate

- Case: `<case title>`
- Case slug/id: `<slug/id>`
- Audit tree SHA: `<full git SHA>`
- Production artifact: `<filename>`
- Production artifact SHA-256: `<digest>`
- Audit started: `<date/time>`
- Audit completed: `<date/time>`
- Content changed after G0: `NO`

Если `Content changed after G0 = YES`, запись недействительна: вернуться к G0 и пройти Gate заново.

## Gate

| Gate | Status | Evidence / artifact |
|---|---|---|
| G0 Content Freeze | NOT RUN | |
| G1 Evidence & Fair Play | NOT RUN | |
| G2 Adversarial Countertheories | NOT RUN | |
| G3 Blind Spoiler | NOT RUN | |
| G4 Solvability & Difficulty | NOT RUN | |
| G5 First-Time Player UX | NOT RUN | |
| G6 Black-Box Game Flow | NOT RUN | |
| G7 Commerce & Security | NOT RUN | |
| G8 Regression | NOT RUN | |
| G9 Production Artifact | NOT RUN | |

Allowed final values: `PASS` or `FAIL`. `UNKNOWN`, `NOT RUN`, stale evidence or evidence from another tree prohibit release.

## Independent passes

- Investigator pass: `NOT RUN`
- Defense/countertheory pass: `NOT RUN`
- Spoiler-hunter pass: `NOT RUN`
- Stuck-player pass: `NOT RUN`
- QA/abuse pass: `NOT RUN`
- First-time-user pass: `NOT RUN`

## Defects found during Gate

1. `<defect>` → `<fix>` → `<retested from G0/Gx>`

Any substantive fix invalidates prior downstream PASS results. Record the restart explicitly.

## Final verdict

`NOT READY`

The only permitted release verdict is:

`READY TO PUBLISH · Release Gate 10/10 PASS · audited tree <sha> · production artifact <sha256>`
