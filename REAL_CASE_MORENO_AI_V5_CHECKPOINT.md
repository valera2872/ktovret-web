# Moreno AI investigation v0.5 checkpoint

## Product pivot

v0.1–v0.4.1 proved that free text alone is insufficient when a local keyword parser cannot understand ordinary Russian. v0.5 adds a server-side AI language layer while keeping evidence unlocks deterministic.

## Architecture

`player natural language -> Supabase ai-moreno-investigator-v1 -> structured intent/topic -> deterministic case engine -> source-grounded result`

The AI does not own case truth and cannot directly create evidence.

### General investigation

The AI receives only already discovered state, known people, current interview target and recent target context. It returns a bounded intent such as `start_interview`, `forensic_ballistics`, `check_alibi`, `clarify`, etc.

Pronouns/context are supported. Tested examples include:
- `вызвать этого свидетеля`
- `что он слышал или видел?`

### Interviews

AI classifies the natural-language question into a bounded topic. The server returns a canonical source-grounded answer. Unknown topics return an explicit source limitation rather than invented dialogue.

Exact witness description is not reconstructed because the public source does not publish the precise descriptive features. A match against known people is a separate player-requested comparison step.

### Safety / nonfiction boundary

- OpenAI key exists only in Supabase secrets.
- Browser contains only public Supabase credentials.
- AI cannot directly mutate evidence state.
- Client maps only known intent/topic values to deterministic state changes.
- No invented evidence, exact geometry, witness dialogue or hidden culprit facts.
- `назначить экспертизу` without object/question must clarify rather than select an examination for the player.
- weapon/alibi/motive checks require a target; AI may not silently choose one.

## Backend

Supabase project: `mystery-logic`
Edge Function: `ai-moreno-investigator-v1`
Active backend version at checkpoint: 2

## Frontend

Route: `realnye-dela/pozharnaya-lestnica-1991/`
Active JS: `assets/real-case-moreno-ai-v5.js?v=0.5.0`
CSS: `assets/real-case-moreno-sandbox.css?v=0.5.0`
State key: `ml-realcase-moreno-ai-v5`
The v0.5 state migrates v0.4.1 state when first opened.

## Tested head

`22e53f463dd76d476815fc93d6d7515e1d21f0f4`

Dedicated workflow run #45: SUCCESS.

Validated:
- JavaScript syntax
- no OpenAI secret in browser bundle
- deterministic browser guard
- live Supabase AI status
- live context resolution: `вызвать этого свидетеля`
- live context resolution: `что он слышал или видел?`
- vague examination request -> clarification
- live witness question -> observation topic
- source-limited exact description
- earned description comparison
- 7 visual states x desktop/mobile = 14 screenshots

Artifact: `real-case-moreno-v5-audit`, id `9683285763`.

## Release boundary

PR #103 remains draft. `main` must remain untouched until the user naturally plays v0.5 and explicitly accepts the direction.
