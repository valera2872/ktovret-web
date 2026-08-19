'use strict';

const assert = require('node:assert/strict');
require('../assets/investigations/last-build.ru.js');
require('../assets/investigations/last-build-intro.js');

const store = new Map();
global.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
};

const intro = require('../assets/investigations/case-intro.js');
const definition = globalThis.MysteryLogicInvestigationCase;
const progressKey = `mysterylogic:investigation:v1:${definition.id}`;
const introKey = `mysterylogic:investigation:intro:v1:${definition.id}`;

assert.ok(definition.caseIntro, 'Last Build must define a cold open');
assert.equal(intro.shouldShow(definition, ''), true, 'Fresh investigation should show cold open');
assert.equal(intro.shouldShow(definition, '?previewEvidence=roman-receipt'), false, 'Evidence QA preview must bypass cold open');
assert.equal(intro.shouldShow(definition, '?previewResult=S'), false, 'Result QA preview must bypass cold open');
assert.equal(intro.shouldShow(definition, '?previewInterrogation=initial'), false, 'Interrogation QA preview must bypass cold open');

store.set(introKey, 'seen');
assert.equal(intro.shouldShow(definition, ''), false, 'Seen cold open should not repeat');
store.delete(introKey);

store.set(progressKey, JSON.stringify({ viewedMaterials: ['pavel-message'], performedActions: [], hypothesisHistory: [] }));
assert.equal(intro.hasProgress(definition), true);
assert.equal(intro.shouldShow(definition, ''), false, 'Existing investigation progress must suppress cold open after site updates');
store.delete(progressKey);

const html = intro.render(definition.caseIntro);
assert.ok(html.includes('Презентации не будет. Один из вас уже продал нашу игру.'));
assert.ok(html.includes('Начать расследование'));
assert.ok(html.includes('RELEASE удалена'));
assert.ok(html.includes('office-morning.webp'), 'Cold open must use the morning office image');
assert.ok(html.includes('pavel-nesterov.webp'), 'Cold open message must use Pavel portrait');

console.log('Advanced investigation cold open: fresh/resume/QA rules validated.');
