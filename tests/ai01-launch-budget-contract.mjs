import fs from 'node:fs';
import assert from 'node:assert/strict';

const plan=fs.readFileSync('AI01_PUBLIC_RELEASE_PLAN.md','utf8');
assert.ok(plan.includes('30 questions per case session'),'session turn boundary missing from release plan');
assert.ok(plan.includes('180 AI turns per visitor per day'),'visitor guardrail missing from release plan');
assert.ok(plan.includes('2000 AI turns per network per day'),'network guardrail missing from release plan');
assert.ok(plan.includes('$10 daily global AI budget'),'global AI budget missing from release plan');
assert.ok(plan.includes('LiveAvatar provider spend is not required'),'Text release must not depend on LiveAvatar spend');
console.log('AI-01 launch budget contract OK');