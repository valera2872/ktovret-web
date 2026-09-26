(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MysteryLogicStatementHistory = api;
  if (typeof document !== 'undefined') api.mount();
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  function requirementsMet(candidate, facts) {
    const set = facts instanceof Set ? facts : new Set(facts || []);
    return (candidate.requiresAllFacts || []).every((fact) => set.has(fact));
  }

  function buildHistory(character, facts) {
    const applicable = (character.statementStates || [])
      .filter((candidate) => requirementsMet(candidate, facts))
      .sort((a, b) => (a.requiresAllFacts || []).length - (b.requiresAllFacts || []).length);
    return [
      { text: character.initialStatement, current: applicable.length === 0, label: 'Первоначальные показания' },
      ...applicable.map((candidate, index) => ({
        text: candidate.text,
        current: index === applicable.length - 1,
        label: index === applicable.length - 1 ? 'Текущая версия' : 'Промежуточная версия',
      })),
    ];
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

  function enhance(rootNode, definition) {
    const facts = readFacts(definition);
    for (const card of rootNode.querySelectorAll('.mli-person-card')) {
      const name = card.querySelector('h3')?.textContent?.trim();
      const character = (definition.characters || []).find((item) => item.name === name);
      const statement = card.querySelector('.mli-statement');
      if (!character || !statement || statement.dataset.historyEnhanced === 'true') continue;

      const history = buildHistory(character, facts);
      if (history.length < 2) continue;
      statement.dataset.historyEnhanced = 'true';
      statement.innerHTML = `<div class="mli-statement-history">${history.map((item) => `
        <div class="mli-statement-version ${item.current ? 'is-current' : 'is-old'}">
          <small>${escapeHtml(item.label)}</small>
          <p>${escapeHtml(item.text)}</p>
        </div>
      `).join('')}</div>`;
    }
  }

  function mount() {
    const definition = root.MysteryLogicInvestigationCase;
    const workspace = document.querySelector('[data-ml-investigation]');
    if (!definition || !workspace) return;

    const run = () => enhance(workspace, definition);
    new MutationObserver(run).observe(workspace, { childList: true, subtree: true });
    run();
  }

  return Object.freeze({ buildHistory, enhance, mount });
});
