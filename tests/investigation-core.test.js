'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../assets/investigations/investigation-core.js');
require('../assets/investigations/last-build.ru.js');
require('../assets/investigations/last-build-human-layer.js');

const definition = globalThis.MysteryLogicInvestigationCase;

assert.ok(definition, 'Last Build definition must be available');
assert.equal(definition.id, 'last_build_ru_web');
assert.equal(definition.suspects.filter((suspect) => suspect.isCanonicalCulprit).length, 1, 'There must be exactly one canonical culprit');
assert.deepEqual(core.auditDefinition(definition), [], 'Investigation graph must have no dangling references');
assert.deepEqual(definition.openingMaterialIds, ['pavel-message', 'office-morning', 'initial-statements'], 'The first workspace must expose exactly three authored entry points');
for (const materialId of definition.openingMaterialIds) {
  const material = definition.materials.find((item) => item.id === materialId);
  assert.ok(material?.availableFromStart, `Opening material ${materialId} must be available from the start`);
}
assert.match(definition.heroImage || '', /office-hero-v2\.webp$/, 'The workspace hero must use the cinematic phone-and-empty-case scene');
assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'investigations', 'last-build-art', 'office-hero-v2.webp')), 'Cinematic case-cover art file must exist');
for (const character of definition.characters) {
  assert.match(character.portrait || '', /last-build-art\/.+\.webp$/, `Character ${character.id} must have a reusable dossier portrait`);
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'investigations', 'last-build-art', path.basename(character.portrait))), `Portrait file for ${character.id} must exist`);
  assert.ok(character.relationship, `Character ${character.id} must explain their relationship to the case in plain language`);
  assert.ok(character.responsibility, `Character ${character.id} must explain what they are responsible for`);
  assert.ok(character.introduction, `Character ${character.id} must have an authored answer to the introductory interview question`);
}

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
const guest02Assignment = definition.materials.find((item) => item.id === 'guest02-assignment');
assert.match(guest02Assignment.body, /личное устройство: ASTER-64 \/ A64-7731/i, 'GUEST-02 register must explicitly bind the ASTER serial to its assigned visitor');
assert.ok(
  guest02Assignment.presentation.fields.some((field) => field.label === 'Личное устройство' && field.value === 'ASTER-64 / A64-7731'),
  'Premium GUEST-02 registry must preserve the explicit ASTER ownership link',
);
assert.match(definition.materials.find((item) => item.id === 'office-morning').presentation.image || '', /office-morning\.webp$/, 'Office inspection must reuse the cold-open scene image');
assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'investigations', 'last-build-art', 'office-morning.webp')), 'Morning office art file must exist');
const initialInterviews = definition.materials.find((item) => item.id === 'initial-statements');
assert.equal(initialInterviews.title, 'Первые опросы участников');
assert.equal(initialInterviews.presentation.items.length, 3, 'The introductory interview file must contain three separate authored interviews');
assert.match(initialInterviews.presentation.identityQuestion, /представьтесь.*как вы связаны/i, 'The first interview question must establish identity and relationship before alibi');
assert.match(initialInterviews.presentation.items.find((item) => item.id === 'timur').introduction, /DEMO-04 — общий компьютер в переговорной/i, 'DEMO-04 must be explained before it is used as evidence jargon');
assert.equal(initialInterviews.presentation.items.some((item) => /operations|technical lead/i.test(item.role)), false, 'Introductory roles must not use unexplained English job titles');

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

require('../assets/investigations/last-build-questions.js');
const questionsPanel = require('../assets/investigations/questions-panel.js');
let questions = questionsPanel.openQuestions(definition, ['r03_visible']);
assert.ok(questions.some((question) => question.id === 'r03-meaning'), 'Visible R-03 must earn the question about its meaning');
questions = questionsPanel.openQuestions(definition, ['r03_visible', 'r03_linked_roman']);
assert.equal(questions.some((question) => question.id === 'r03-meaning'), false, 'R-03 question must disappear after its meaning is established');
questions = questionsPanel.openQuestions(definition, ['copy_before_delete']);
assert.ok(questions.some((question) => question.id === 'delete-purpose'), 'Copy-before-delete must earn the causal question about deletion');
questions = questionsPanel.openQuestions(definition, ['copy_before_delete', 'nordlight_clean_build_promise', 'deal_pressure_context_known']);
assert.equal(questions.some((question) => question.id === 'delete-purpose'), false, 'Deletion-purpose question must resolve only after intent and deal context are known');
questions = questionsPanel.openQuestions(definition, ['orbit_write_2123']);
assert.ok(questions.some((question) => question.id === 'orbit-source-question'), 'ORBIT write after deletion must earn the source question');
questions = questionsPanel.openQuestions(definition, ['orbit_write_2123', 'orbit_from_nightsafe']);
assert.equal(questions.some((question) => question.id === 'orbit-source-question'), false, 'ORBIT source question must resolve after NIGHTSAFE comparison');

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

console.log('Advanced investigation core: Last Build graph, human layer, premium evidence, statement history, progressive timeline, earned questions, fair-play copy and full S path validated.');
