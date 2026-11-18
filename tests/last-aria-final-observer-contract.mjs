import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/case-aria-first-buyer-recovery.js', import.meta.url), 'utf8');

function checkProofCopy({ investigatorPresent }) {
  const lead = { textContent: 'Initial proof text' };
  const callbacks = [];
  const root = {
    querySelector(selector) { return selector === '.casearia-proof-board > p' ? lead : null; },
    addEventListener() {},
  };
  const window = {
    MLCaseAria: { final: { requiredGroups: ['sabotage','culprit-sabotage','alibi','identity','access','possession'] } },
    fetch: async () => ({ ok: true }),
    ...(investigatorPresent ? { MLAriaInvestigatorV16: { revision: '1.6' } } : {}),
  };
  const document = {
    querySelector(selector) { return selector === '[data-casearia-app]' ? root : null; },
    addEventListener() {},
  };
  class MutationObserver {
    constructor(callback) { callbacks.push(callback); }
    observe() {}
  }
  vm.runInNewContext(source, { window, document, MutationObserver, Object, String, Set });
  assert.equal(callbacks.length, 1, 'recovery proof observer is installed');
  if (investigatorPresent) {
    const investigatorCopy = 'Отметьте шесть ключевых связок.';
    lead.textContent = investigatorCopy;
    for (let attempt = 0; attempt < 8; attempt++) callbacks[0]();
    assert.equal(lead.textContent, investigatorCopy, 'recovery must not overwrite investigator copy');
  } else {
    callbacks[0]();
    assert.match(lead.textContent, /6 независимых доказательных групп/, 'fallback copy without investigator');
  }
}

checkProofCopy({ investigatorPresent: true });
checkProofCopy({ investigatorPresent: false });
console.log('PASS Last Aria final observers: single copy owner and fallback');
