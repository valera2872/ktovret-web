# Moreno investigative sandbox checkpoint — v0.4.1

## Product status

v0.1–v0.3 rejected as too guided. v0.4.1 is the current experiment.

## Core principle

The UI must not enumerate investigative branches. The player receives only the facts already earned and writes the next investigative action in free text.

## Interaction

- no action menu;
- one free-text investigator command field;
- vague requests do not reveal evidence;
- people must be discovered before they can be questioned;
- interviews are one person at a time;
- the player writes each interview question;
- bulk `question everyone` does not return a testimony dump;
- newly located witnesses must be interviewed before their testimony is known;
- answers are limited to source-grounded public facts;
- unsupported questions return an explicit source limitation instead of invented dialogue;
- working hypotheses are written by the player in free text;
- the case may be returned for more investigation if the submitted theory lacks independent/physical support.

## Source boundary

Facts are grounded in official Middlesex District Attorney releases about Patricia Moreno / Rodney Daniels. No invented evidence, dialogue, exact geometry, crime-scene imagery, or alternate outcome.

## Active route

`realnye-dela/pozharnaya-lestnica-1991/`

Active assets:
- `assets/real-case-moreno-sandbox-v41.js?v=0.4.1`
- `assets/real-case-moreno-sandbox.css?v=0.4.1`

## Tested head before this docs commit

`5f9ae68c331939e03909d142149d46277c993a31`

Dedicated workflow run #38: SUCCESS.
- syntax: pass
- free-text investigation: pass
- bulk interview rejection: pass
- question-driven boyfriend interview: pass
- question-driven independent witness interview: pass
- full free-text solve path: pass
- visual audit: 7 states x desktop/mobile = 14 screenshots: pass

## Release boundary

PR #103 remains draft. `main` must remain untouched until manual gameplay acceptance.
