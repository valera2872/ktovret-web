# Premium Partner «Не публиковать» v2 — QA gate

## Room / asymmetry
- [ ] creator maps to Archive; guest maps to Sources
- [ ] each player only receives own raw evidence
- [ ] shared board is identical on both clients
- [ ] concurrent actions preserve revision monotonicity

## Evidence progression
- [ ] E04 + E05 → D_FINANCE_CONTRADICTION → E06
- [ ] E06 → E07/E08/E09 → D_AUDIO_FABRICATION → E10/Roman
- [ ] Roman contradiction → E11 → D_ROMAN_MURDER → E12/E13/E14
- [ ] E13 + E14 → D_PAVEL_FAKE → E15/E16/E17/E34/E35
- [ ] E16 + E17 → dual-doc deduction → E18/E19
- [ ] canary deduction → E20
- [ ] Roman leak challenge + E17/E20 → D_LEAK → E21
- [ ] E21 → D_VERA_ALIVE → E22/E23/E24
- [ ] location deduction → E25; evidence packet with E25 → rescue dispatch
- [ ] location submitted → E26/E27/E28
- [ ] preparation deduction → E29/E30/E31/E32
- [ ] Nina/Elena deduction → E33 + Vera found + reconstruction
- [ ] complete reconstruction → publication decision → closed case

## Shared character state
- [ ] evidence shown by player A changes the same character for player B
- [ ] AI cannot expose future statement levels
- [ ] AI cannot invent evidence, locations or alibis
- [ ] Pavel confesses fake letter only after evidence/challenge
- [ ] Roman confesses leak only after canary + E17/E20/challenge
- [ ] Elena advances in stages rather than full confession on first question

## Rescue logic
- [ ] Vera-alive event changes UI state
- [ ] location cannot be submitted without 3 published independent indicators and E25
- [ ] rescue dispatch unlocks later evidence but not reconstruction immediately
- [ ] Vera found only after old-case chain is proven

## Finale
- [ ] reconstruction returns conflicts instead of binary wrong screen
- [ ] all six reconstruction dimensions must align
- [ ] final publication choice does not rewrite factual solution
