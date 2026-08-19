(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MysteryLogicInterrogationPreview = api;
  if (typeof location !== 'undefined') api.seedFromSearch(location.search);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const modes = Object.freeze(['initial', 'presence-ready', 'aster-blocked', 'aster-ready']);

  function addFacts(core, definition, state, facts) {
    return core.normalizeState(definition, {
      ...state,
      facts: [...(state.facts || []), ...facts],
    });
  }

  function stateFor(core, definition, mode) {
    if (!modes.includes(mode)) return null;
    const initial = core.createInitialState(definition);
    if (mode === 'initial') return initial;

    const presenceReady = addFacts(core, definition, initial, [
      't17_linked_roman',
      'rk_pixel_present',
      'roman_claims_port_2047',
    ]);
    if (mode === 'presence-ready') return presenceReady;

    const presenceOutcome = core.performAction(definition, presenceReady, 'confront-roman-presence');
    const afterPresence = core.openMaterial(definition, presenceOutcome.state, 'roman-presence-correction');
    const asterBlocked = addFacts(core, definition, afterPresence, ['guest02_assigned_roman']);
    if (mode === 'aster-blocked') return asterBlocked;
    return addFacts(core, definition, asterBlocked, ['copy_before_delete']);
  }

  function questionFor(mode) {
    return mode === 'initial' || mode === 'presence-ready'
      ? 'Вы возвращались в офис после 18:30?'
      : 'Ваш ли накопитель ASTER-64?';
  }

  function seedFromSearch(search) {
    const mode = new URLSearchParams(search || '').get('previewInterrogation');
    if (!modes.includes(mode)) return null;
    const core = root.MysteryLogicInvestigationCore;
    const definition = root.MysteryLogicInvestigationCase;
    if (!core || !definition) return null;
    const state = stateFor(core, definition, mode);
    try {
      localStorage.setItem(`mysterylogic:investigation:v1:${definition.id}`, JSON.stringify(state));
      sessionStorage.removeItem(`mysterylogic:interrogation:v1:${definition.id}:roman`);
    } catch (_) {}
    root.MysteryLogicPreviewInitialView = 'people';

    const submitQuestion = () => {
      const form = document.querySelector('[data-interrogation-form]');
      const input = document.querySelector('[data-interrogation-question]');
      if (!form || !input) return;
      input.value = questionFor(mode);
      form.requestSubmit();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(submitQuestion, 0), { once: true });
    }
    return mode;
  }

  return Object.freeze({ modes, stateFor, questionFor, seedFromSearch });
});
