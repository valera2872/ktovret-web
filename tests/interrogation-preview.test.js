'use strict';

const assert = require('node:assert/strict');
const core = require('../assets/investigations/investigation-core.js');
require('../assets/investigations/last-build.ru.js');
require('../assets/investigations/last-build-human-layer.js');
const preview = require('../assets/investigations/interrogation-preview.js');

const definition = globalThis.MysteryLogicInvestigationCase;
const actionIds = (state) => core.availableActions(definition, state).map((action) => action.id);

assert.deepEqual(preview.modes, ['initial', 'presence-ready', 'aster-blocked', 'aster-ready']);
assert.equal(preview.stateFor(core, definition, 'missing'), null);

const initial = preview.stateFor(core, definition, 'initial');
assert.equal(actionIds(initial).includes('confront-roman-presence'), false);
assert.equal(initial.performedActions.length, 0);

const presenceReady = preview.stateFor(core, definition, 'presence-ready');
assert.ok(actionIds(presenceReady).includes('confront-roman-presence'));
assert.equal(presenceReady.facts.includes('roman_return_admitted'), false);

const asterBlocked = preview.stateFor(core, definition, 'aster-blocked');
assert.ok(asterBlocked.performedActions.includes('confront-roman-presence'));
assert.ok(asterBlocked.facts.includes('roman_return_admitted'));
assert.ok(asterBlocked.facts.includes('guest02_assigned_roman'));
assert.equal(asterBlocked.facts.includes('copy_before_delete'), false);
assert.equal(actionIds(asterBlocked).includes('confront-roman-aster'), false);

const asterReady = preview.stateFor(core, definition, 'aster-ready');
assert.ok(asterReady.facts.includes('copy_before_delete'));
assert.ok(actionIds(asterReady).includes('confront-roman-aster'));
assert.match(preview.questionFor('initial'), /18:30/);
assert.match(preview.questionFor('aster-ready'), /ASTER-64/);

console.log('Strict interrogation QA states: initial lie, earned presence and blocked/earned ASTER paths validated.');
