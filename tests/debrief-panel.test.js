'use strict';

const assert = require('node:assert/strict');
require('../assets/investigations/last-build.ru.js');
require('../assets/investigations/last-build-human-layer.js');
require('../assets/investigations/last-build-presentation.js');
require('../assets/investigations/last-build-debrief.js');
const debrief = require('../assets/investigations/debrief-panel.js');

const definition = globalThis.MysteryLogicInvestigationCase;
assert.ok(definition.debrief, 'Last Build must define a rich debrief');
assert.equal(
  /каноничес|угад|верн.*исполн|роман|карск/i.test(definition.resultTiers.B.text),
  false,
  'Weak B result must not confirm that the selected suspect is canonically correct',
);

const base = {
  resultTier: null,
  hypothesisHistory: ['timur', 'roman'],
  selectedSuspectId: 'roman',
  viewedMaterials: ['delete-audit', 'r03-screenshot'],
  facts: ['timur_admits_session_open', 'r03_linked_roman'],
};

for (const tier of ['B', 'C']) {
  const model = debrief.buildModel(definition, { ...base, resultTier: tier });
  assert.equal(model.revealTruth, false, `${tier} must not reveal canonical reconstruction`);
  assert.deepEqual(model.timeline, [], `${tier} must not receive true timeline`);
  assert.deepEqual(model.lies, [], `${tier} must not receive canonical lie explanations`);
}

for (const tier of ['A', 'S']) {
  const model = debrief.buildModel(definition, { ...base, resultTier: tier });
  assert.equal(model.revealTruth, true, `${tier} should unlock the post-case reconstruction`);
  assert.ok(model.timeline.length >= 6, `${tier} should receive the true chronology`);
  assert.equal(model.lies.length, 3, `${tier} should explain all three different lies`);
  assert.ok(model.reinterpretations.some((item) => item.materialId === 'r03-screenshot'));
  assert.ok(model.missed.length > 0, `${tier} should identify unviewed material after the case is solved`);
}

const path = debrief.summarizePath(definition, base);
assert.equal(path.firstHypothesis, 'Тимур Власов');
assert.equal(path.finalHypothesis, 'Роман Карский');
assert.equal(path.hypothesisChanges, 1);
assert.ok(path.changedStatements.includes('Тимур Власов'));

const noMisses = debrief.missedMaterials(definition, {
  viewedMaterials: definition.materials.map((material) => material.id),
});
assert.deepEqual(noMisses, []);

console.log('Advanced investigation debrief: reveal boundary, neutral weak result and personalized path validated.');
