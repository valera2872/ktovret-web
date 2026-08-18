'use strict';

const assert = require('node:assert/strict');
const core = require('../assets/investigations/investigation-core.js');
require('../assets/investigations/last-build.ru.js');
require('../assets/investigations/last-build-human-layer.js');

const definition = globalThis.MysteryLogicInvestigationCase;

assert.ok(definition, 'Last Build definition must be available');
assert.equal(definition.id, 'last_build_ru_web');
assert.equal(definition.suspects.filter((suspect) => suspect.isCanonicalCulprit).length, 1, 'There must be exactly one canonical culprit');
assert.deepEqual(core.auditDefinition(definition), [], 'Investigation graph must have no dangling references');

for (const id of ['alina-roman-t17-chat', 'pavel-timur-backup-chat', 'roman-deal-context']) {
  assert.ok(definition.materials.some((material) => material.id === id), `Human-layer material ${id} must exist`);
}
for (const id of ['inspect-t17-chat', 'inspect-backup-conflict', 'inspect-deal-context']) {
  assert.ok(definition.actions.some((action) => action.id === id), `Human-layer action ${id} must exist`);
}

require('../assets/investigations/last-build-presentation.js');
for (const proof of definition.proofFamilies) {
  const visibleCopy = `${proof.label} ${proof.description}`.toLowerCase();
  assert.equal(/роман|карск/.test(visibleCopy), false, `Player-facing proof copy must not reveal canonical suspect: ${proof.id}`);
}
assert.equal(definition.proofFamilies.find((proof) => proof.id === 'presence').label, 'Физическое присутствие');
assert.equal(definition.proofFamilies.find((proof) => proof.id === 'copy-device').label, 'Кто контролировал носитель с копией?');

require('../assets/investigations/last-build-evidence.js');
const premiumKinds = new Set(['message', 'receipt', 'terminal', 'access', 'registry', 'interview', 'web', 'screenshot', 'email', 'comparison', 'document', 'scene', 'statements']);
for (const id of ['pavel-message', 'delete-audit', 'roman-receipt', 'studio-brief', 'access-log', 't17-registry', 'guest-wifi', 'nordlight-compliance', 'orbit-source', 'pavel-deposit', 'alina-roman-t17-chat', 'pavel-timur-backup-chat', 'roman-deal-context']) {
  const material = definition.materials.find((item) => item.id === id);
  assert.ok(material?.presentation, `Premium presentation missing for ${id}`);
  assert.ok(premiumKinds.has(material.presentation.kind), `Unsupported evidence renderer kind for ${id}`);
}

const statementHistory = require('../assets/investigations/statement-history.js');
const timur = definition.characters.find((character) => character.id === 'timur');
assert.equal(statementHistory.buildHistory(timur, []).length, 1, 'Unchallenged testimony must have one visible version');
const timurSessionHistory = statementHistory.buildHistory(timur, ['timur_admits_session_open']);
assert.equal(timurSessionHistory.length, 2, 'First contradiction must preserve original and current testimony');
assert.equal(timurSessionHistory[0].current, false);
assert.equal(timurSessionHistory[1].current, true);
const timurFullHistory = statementHistory.buildHistory(timur, ['timur_admits_session_open', 'timur_admits_nightsafe']);
assert.equal(timurFullHistory.length, 3, 'Second contradiction must preserve the intermediate testimony too');
assert.equal(timurFullHistory.filter((item) => item.current).length, 1);

require('../assets/investigations/last-build-timeline.js');
const timelinePanel = require('../assets/investigations/timeline-panel.js');
const initialTimeline = timelinePanel.visibleEvents(definition, ['roman_at_port_1812', 'delete_t_vlasov_2059']);
assert.deepEqual(initialTimeline.map((event) => event.id), ['port-payment', 'release-delete']);
const expandedTimeline = timelinePanel.visibleEvents(definition, ['roman_at_port_1812', 'delete_t_vlasov_2059', 'r03_linked_roman']);
assert.equal(expandedTimeline[0].id, 'review-r03', 'R-03 discovery must expand timeline backwards instead of adding a future hint');
assert.equal(expandedTimeline.at(-1).id, 'release-delete');

let state = core.createInitialState(definition);
let safety = 0;
let changed = true;
while (changed && safety < 100) {
  safety += 1;
  changed = false;

  for (const material of core.availableMaterials(definition, state)) {
    if (!state.viewedMaterials.includes(material.id)) {
      state = core.openMaterial(definition, state, material.id);
      changed = true;
    }
  }

  for (const action of core.availableActions(definition, state)) {
    const outcome = core.performAction(definition, state, action.id);
    assert.ok(outcome.action, `Action ${action.id} should be executable`);
    state = outcome.state;
    changed = true;
  }
}

assert.ok(safety < 100, 'Investigation graph should converge');
assert.equal(core.availableActions(definition, state).length, 0, 'Full exploration should leave no unperformed earned actions');
assert.equal(state.viewedMaterials.length, definition.materials.length, 'Every material should be reachable in a full exploration');

state = core.selectSuspect(state, 'roman');
let incomplete = core.finalize(definition, state);
assert.equal(incomplete.resultTier, 'B', 'Correct suspect without assembled proof must not pass');

for (const proof of definition.proofFamilies) {
  for (const material of definition.materials) {
    if (!state.viewedMaterials.includes(material.id)) continue;
    const materialFacts = new Set(material.grantsFacts || []);
    const requiredFacts = new Set([...(proof.allOf || []), ...((proof.anyOfGroups || []).flat())]);
    if ([...materialFacts].some((fact) => requiredFacts.has(fact))) {
      state = core.toggleEvidence(definition, state, proof.id, material.id);
    }
  }
}

for (const proof of definition.proofFamilies) {
  assert.equal(core.proofSatisfiedBySelection(definition, state, proof.id), true, `Proof family ${proof.id} must be satisfiable from player-selected materials`);
}

state = core.finalize(definition, state);
assert.equal(state.resultTier, 'S', 'Full Last Build reconstruction must reach S');

const wrong = core.finalize(definition, core.selectSuspect(core.createInitialState(definition), 'timur'));
assert.equal(wrong.resultTier, 'C', 'Wrong suspect must produce C');

console.log('Advanced investigation core: Last Build graph, human layer, premium evidence, statement history, progressive timeline, fair-play copy and full S path validated.');
