(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MysteryLogicCaseIntro = api;
  if (typeof document !== 'undefined') api.mount();
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function hasProgress(definition) {
    try {
      const key = `mysterylogic:investigation:v1:${definition.id}`;
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const state = JSON.parse(raw);
      return Boolean(
        (state.viewedMaterials || []).length
        || (state.performedActions || []).length
        || (state.hypothesisHistory || []).length
        || state.selectedSuspectId,
      );
    } catch (_) {
      return false;
    }
  }

  function shouldShow(definition, search) {
    if (!definition?.caseIntro) return false;
    if (definition.caseIntro.mode === 'integrated') return false;
    const params = new URLSearchParams(search || '');
    if (params.has('previewEvidence') || params.has('previewResult') || params.has('previewInterrogation')) return false;
    if (hasProgress(definition)) return false;
    try {
      return localStorage.getItem(`mysterylogic:investigation:intro:v1:${definition.id}`) !== 'seen';
    } catch (_) {
      return true;
    }
  }

  function render(intro) {
    return `
      <div class="mli-intro-backdrop" data-mli-intro>
        <section class="mli-intro-card" role="dialog" aria-modal="true" aria-labelledby="mli-intro-title">
          <div class="mli-intro-message">
            <small>${escapeHtml(intro.messageDate)}</small>
            <div><span>${intro.senderPortrait ? `<img src="${escapeHtml(intro.senderPortrait)}" alt="" width="96" height="120" decoding="async">` : escapeHtml((intro.sender || '').split(/\s+/).map((part) => part[0] || '').slice(0, 2).join('').toUpperCase())}</span><p><strong>${escapeHtml(intro.sender)}</strong>${escapeHtml(intro.message)}</p></div>
          </div>
          <div class="mli-intro-divider"><span>${escapeHtml(intro.morningDate)}</span></div>
          <div class="mli-intro-morning">
            ${intro.morningImage ? `<figure class="mli-intro-scene"><img src="${escapeHtml(intro.morningImage)}" alt="${escapeHtml(intro.morningImageAlt || '')}" width="1440" height="810" fetchpriority="high" decoding="async" data-mli-intro-scene-image></figure>` : ''}
            <ul class="mli-intro-facts">${(intro.morningFacts || []).map((fact) => `<li>${escapeHtml(fact)}</li>`).join('')}</ul>
          </div>
          <div class="mli-intro-title">
            <p class="mli-eyebrow">Mystery Logic · расширенное расследование</p>
            <h1 id="mli-intro-title">${escapeHtml(intro.title)}</h1>
            <p>${escapeHtml(intro.subtitle || '')}</p>
          </div>
          <button type="button" class="mli-primary-button mli-intro-start" data-mli-intro-start>${escapeHtml(intro.cta || 'Начать расследование')}</button>
        </section>
      </div>
    `;
  }

  function mount() {
    const definition = root.MysteryLogicInvestigationCase;
    if (!definition || !shouldShow(definition, location.search)) return;
    document.body.insertAdjacentHTML('beforeend', render(definition.caseIntro));
    const overlay = document.querySelector('[data-mli-intro]');
    const start = overlay?.querySelector('[data-mli-intro-start]');
    if (!overlay || !start) return;
    document.documentElement.classList.add('mli-intro-open');
    start.focus();
    start.addEventListener('click', () => {
      try {
        localStorage.setItem(`mysterylogic:investigation:intro:v1:${definition.id}`, 'seen');
      } catch (_) {}
      overlay.classList.add('is-leaving');
      document.documentElement.classList.remove('mli-intro-open');
      setTimeout(() => {
        overlay.remove();
        document.querySelector('[data-ml-investigation]')?.focus?.();
      }, 180);
    });
  }

  return Object.freeze({ hasProgress, shouldShow, render, mount });
});
