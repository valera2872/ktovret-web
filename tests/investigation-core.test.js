'use strict';

const assert = require('node:assert/strict');
const core = require('../assets/investigations/investigation-core.js');
require('../assets/investigations/last-build.ru.js');

const definition = globalThis.MysteryLogicInvestigationCase;

assert.ok(definition, 'Last Build definition must be available');
assert.equal(definition.id, 'last_build_ru_web');
assert.equal(
  definition.suspects.filter((suspect) => suspect.isCanonicalCulprit).length,
  1,
  'There must be exactly one canonical culprit',
);
assert.deepEqual(core.auditDefinition(definition), [], 'Investigation graph must have no dangling references');

require('../assets/investigations/last-build-presentation.js');
for (const proof of definition.proofFamilies) {
  const visibleCopy = `${proof.label} ${proof.description}`.toLowerCase();
  assert.equal(
    /роман|карск/.test(visibleCopy),
    false,
    `Player-facing proof copy must not reveal canonical suspect: ${proof.id}`,
  );
}
assert.equal(
  definition.proofFamilies.find((proof) => proof.id === 'presence').label,
  'Физическое присутствие',
);
assert.equal(
  definition.proofFamilies.find((proof) => proof.id === 'copy-device').label,
  'Кто контролировал носитель с копией?',
);

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
assert.equal(
  core.availableActions(definition, state).length,
  0,
  'Full exploration should leave no unperformed earned actions',
);
assert.equal(
  state.viewedMaterials.length,
  definition.materials.length,
  'Every material should be reachable in a full exploration',
);

state = core.selectSuspect(state, 'roman');
let incomplete = core.finalize(definition, state);
assert.equal(incomplete.resultTier, 'B', 'Correct suspect without assembled proof must not pass');

for (const proof of definition.proofFamilies) {
  for (const material of definition.materials) {
    if (!state.viewedMaterials.includes(material.id)) {
      continue;
    }
    const materialFacts = new Set(material.grantsFacts || []);
    const requiredFacts = new Set([
      ...(proof.allOf || []),
      ...((proof.anyOfGroups || []).flat()),
    ]);
    if ([...materialFacts].some((fact) => requiredFacts.has(fact))) {
      state = core.toggleEvidence(definition, state, proof.id, material.id);
    }
  }
}

for (const proof of definition.proofFamilies) {
  assert.equal(
    core.proofSatisfiedBySelection(definition, state, proof.id),
    true,
    `Proof family ${proof.id} must be satisfiable from player-selected materials`,
  );
}

state = core.finalize(definition, state);
assert.equal(state.resultTier, 'S', 'Full Last Build reconstruction must reach S');

const wrong = core.finalize(
  definition,
  core.selectSuspect(core.createInitialState(definition), 'timur'),
);
assert.equal(wrong.resultTier, 'C', 'Wrong suspect must produce C');

console.log('Advanced investigation core: Last Build graph, fair-play copy and full S path validated.');
