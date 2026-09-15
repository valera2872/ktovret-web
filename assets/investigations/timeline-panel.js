(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MysteryLogicTimelinePanel = api;
  if (typeof document !== 'undefined') api.mount();
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  function visibleEvents(definition, facts) {
    const set = facts instanceof Set ? facts : new Set(facts || []);
    return (definition.timelineEvents || [])
      .filter((event) => (event.requiresAllFacts || []).every((fact) => set.has(fact)))
      .slice()
      .sort((a, b) => String(a.sort || '').localeCompare(String(b.sort || '')));
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
    if (!main || !briefSection || main.querySelector('[data-mli-timeline]')) return;

    const events = visibleEvents(definition, readFacts(definition));
    if (events.length < 2) return;

    const section = document.createElement('section');
    section.className = 'mli-section mli-timeline-section';
    section.dataset.mliTimeline = 'true';
    section.innerHTML = `
      <div class="mli-section-heading compact">
        <div><p class="mli-eyebrow">Установленные события</p><h2>Временная линия</h2></div>
        <p>Показывает только уже подтверждённые факты. Выводы и связи между ними остаются за вами.</p>
      </div>
      <div class="mli-timeline-track">
        ${events.map((event, index) => `
          <article class="mli-timeline-event${index === 0 && event.date !== events.at(-1)?.date ? ' is-early' : ''}">
            <div class="mli-timeline-time"><small>${escapeHtml(event.date)}</small><strong>${escapeHtml(event.time)}</strong></div>
            <div class="mli-timeline-dot"></div>
            <div class="mli-timeline-copy"><strong>${escapeHtml(event.label)}</strong><span>${escapeHtml(event.source || '')}</span></div>
          </article>
        `).join('')}
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

  return Object.freeze({ visibleEvents, enhance, mount });
});
