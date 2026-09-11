from pathlib import Path
import json, sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
case_dir = root / 'content' / 'volume2-launch'
errors = []

for n in range(101, 111):
    path = case_dir / f'case-{n}.json'
    if not path.exists():
        errors.append(f'missing {path.relative_to(root)}')
        continue
    data = json.loads(path.read_text(encoding='utf-8'))
    stages = data.get('answerStages') or []
    facts = data.get('facts') or []
    timeline = data.get('timeline') or []
    reasoning = (data.get('explanation') or {}).get('reasoningSteps') or []
    full_reason = str((data.get('explanation') or {}).get('fullReason') or '')
    if len(stages) < 3:
        errors.append(f'case {n}: needs >=3 answer stages, got {len(stages)}')
    if len(facts) < 5:
        errors.append(f'case {n}: needs >=5 independent facts, got {len(facts)}')
    if len(timeline) < 5:
        errors.append(f'case {n}: needs >=5 timeline events, got {len(timeline)}')
    if len(reasoning) < 6:
        errors.append(f'case {n}: needs >=6 reasoning steps, got {len(reasoning)}')
    if len(full_reason) < 450:
        errors.append(f'case {n}: final reconstruction too short ({len(full_reason)} chars)')
    prompts = [str(s.get('prompt') or '').strip() for s in stages]
    if len(set(prompts)) != len(prompts):
        errors.append(f'case {n}: duplicated answer-stage prompt')

if errors:
    print('VOLUME II DEPTH GATE FAILED')
    for err in errors:
        print(' -', err)
    raise SystemExit(1)

print('VOLUME II DEPTH GATE OK: cases 101-110 all have multi-stage reconstruction depth')
