(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MysteryLogicQuestionsPanel = api;
  if (typeof document !== 'undefined') api.mount();
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  function openQuestions(definition, facts) {
    const set = facts instanceof Set ? facts : new Set(facts || []);
    return (definition.investigationQuestions || []).filter((question) => {
      const available = (question.requiresAllFacts || []).every((fact) => set.has(fact));
      const resolved = (question.resolvedWhenAllFacts || []).length > 0
        && question.resolvedWhenAllFacts.every((fact) => set.has(fact));
      return available && !resolved;
    });
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function readFacts(definition) {
    try {
      const key = `mysterylogic:investigation:v1:${definition.id}`;
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      return new Set(parsed?.facts || definition.initialFacts || []);
    } catch (_) {
      return new Set(definition.initialFacts || []);
    }
  }

  function enhance(workspace, definition) {
    const main = workspace.querySelector('.mli-main');
    const briefSection = main?.querySelector('.mli-brief')?.closest('.mli-section');
    if (!main || !briefSection || main.querySelector('[data-mli-questions]')) return;

    const questions = openQuestions(definition, readFacts(definition));
    if (!questions.length) return;

    const section = document.createElement('section');
    section.className = 'mli-section mli-questions-section';
    section.dataset.mliQuestions = 'true';
    section.innerHTML = `
      <div class="mli-section-heading compact">
        <div><p class="mli-eyebrow">Рабочие противоречия</p><h2>Открытые вопросы</h2></div>
        <p>Это не задания. Вопрос появляется только тогда, когда найденные факты уже дают основание его задать.</p>
      </div>
      <div class="mli-question-list">
        ${questions.map((question) => `<article class="mli-question-card${question.optional ? ' is-optional' : ''}"><span>?</span><strong>${escapeHtml(question.text)}</strong>${question.optional ? '<small>дополнительная линия</small>' : ''}</article>`).join('')}
      </div>
    `;
    briefSection.insertAdjacentElement('afterend', section);
  }

  function mount() {
    const definition = root.MysteryLogicInvestigationCase;
    const workspace = document.querySelector('[data-ml-investigation]');
    if (!definition || !workspace) return;
    const run = () => enhance(workspace, definition);
    new MutationObserver(run).observe(workspace, { childList: true, subtree: true });
    run();
  }

  return Object.freeze({ openQuestions, enhance, mount });
});
