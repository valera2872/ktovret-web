import fs from 'node:fs';
import assert from 'node:assert/strict';
const handoff=fs.readFileSync('RELEASE_AI01_TEXT_20260907.md','utf8');
assert.ok(handoff.includes('do not merge until the parallel Last Aria work lands in `main`'),'parallel release hold is missing');
assert.ok(handoff.includes('reconcile branch with fresh `main`'),'fresh-main reconciliation step missing');
assert.ok(handoff.includes('production Beget validation'),'production validation step missing');
console.log('AI-01 release branch contract OK');