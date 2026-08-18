(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MysteryLogicDebriefPanel = api;
  if (typeof document !== 'undefined') api.mount();
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function readState(definition) {
    try {
      const key = `mysterylogic:investigation:v1:${definition.id}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function summarizePath(definition, state) {
    const history = state?.hypothesisHistory || [];
    const suspectName = (id) => definition.suspects?.find((suspect) => suspect.id === id)?.label || id || 'не выбрана';
    const facts = new Set(state?.facts || []);
    const changedStatements = (definition.characters || []).filter((character) =>
      (character.statementStates || []).some((candidate) =>
        (candidate.requiresAllFacts || []).every((fact) => facts.has(fact)),
      ),
    ).map((character) => character.name);
    return {
      firstHypothesis: history.length ? suspectName(history[0]) : 'не фиксировалась',
      finalHypothesis: suspectName(state?.selectedSuspectId),
      hypothesisChanges: Math.max(0, history.length - 1),
      changedStatements,
    };
  }

  function missedMaterials(definition, state) {
    const viewed = new Set(state?.viewedMaterials || []);
    return (definition.materials || []).filter((material) => !viewed.has(material.id));
  }

  function buildModel(definition, state) {
    const tier = state?.resultTier;
    const revealTruth = tier === 'S' || tier === 'A';
    return {
      tier,
      revealTruth,
      path: summarizePath(definition, state),
      missed: revealTruth ? missedMaterials(definition, state) : [],
      timeline: revealTruth ? (definition.debrief?.timeline || []) : [],
      lies: revealTruth ? (definition.debrief?.lies || []) : [],
      reinterpretations: revealTruth ? (definition.debrief?.reinterpretations || []) : [],
    };
  }

  function render(definition, state) {
    const model = buildModel(definition, state);
    if (!model.revealTruth) return '';
    const viewed = new Set(state?.viewedMaterials || []);

    return `
      <section class="mli-debrief" data-mli-debrief>
        <header class="mli-debrief-head">
          <p class="mli-eyebrow">После предъявления</p>
          <h2>Что произошло на самом деле</h2>
          <p>Теперь можно развернуть всю причинную цепочку и сравнить её с вашим собственным расследованием.</p>
        </header>

        <div class="mli-debrief-timeline">
          ${model.timeline.map((event) => `
            <article><div><small>${escapeHtml(event.date)}</small><strong>${escapeHtml(event.time)}</strong></div><span></span><div><strong>${escapeHtml(event.title)}</strong><p>${escapeHtml(event.text)}</p></div></article>
          `).join('')}
        </div>

        <section class="mli-debrief-block">
          <div class="mli-debrief-block-head"><p class="mli-eyebrow">Три разные причины</p><h3>Почему они лгали</h3></div>
          <div class="mli-debrief-lies">${model.lies.map((item) => `<article><small>${escapeHtml(item.name)}</small><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.text)}</p></article>`).join('')}</div>
        </section>

        <section class="mli-debrief-block">
          <div class="mli-debrief-block-head"><p class="mli-eyebrow">Второе значение</p><h3>Улики, которые изменили смысл</h3></div>
          <div class="mli-debrief-reinterpret">${model.reinterpretations.map((item) => `
            <article class="${viewed.has(item.materialId) ? 'was-found' : 'was-missed'}">
              <header><strong>${escapeHtml(item.title)}</strong><span>${viewed.has(item.materialId) ? 'вы исследовали' : 'вы пропустили'}</span></header>
              <div><small>Сначала</small><p>${escapeHtml(item.before)}</p></div>
              <div><small>После реконструкции</small><p>${escapeHtml(item.after)}</p></div>
            </article>
          `).join('')}</div>
        </section>

        <section class="mli-debrief-block mli-debrief-personal">
          <div class="mli-debrief-block-head"><p class="mli-eyebrow">Ваш путь</p><h3>Как менялось расследование</h3></div>
          <div class="mli-debrief-path">
            <div><small>Первая рабочая версия</small><strong>${escapeHtml(model.path.firstHypothesis)}</strong></div>
            <div><small>Итоговая версия</small><strong>${escapeHtml(model.path.finalHypothesis)}</strong></div>
            <div><small>Смен версии</small><strong>${escapeHtml(model.path.hypothesisChanges)}</strong></div>
            <div><small>Чьи показания изменились</small><strong>${escapeHtml(model.path.changedStatements.length ? model.path.changedStatements.join(', ') : 'ни одного')}</strong></div>
          </div>
          ${model.missed.length ? `<details class="mli-debrief-missed"><summary>Материалы, которые вы не изучили · ${model.missed.length}</summary><div>${model.missed.map((item) => `<span>${escapeHtml(item.title)}</span>`).join('')}</div></details>` : '<p class="mli-debrief-complete">Вы изучили все доступные материалы дела.</p>'}
        </section>
      </section>
    `;
  }

  function enhance(workspace, definition) {
    const result = workspace.querySelector('.mli-result');
    if (!result || workspace.querySelector('[data-mli-debrief]')) return;
    const state = readState(definition);
    const html = render(definition, state);
    if (!html) return;
    result.insertAdjacentHTML('afterend', html);
  }

  function mount() {
    const definition = root.MysteryLogicInvestigationCase;
    const workspace = document.querySelector('[data-ml-investigation]');
    if (!definition || !workspace) return;
    const run = () => enhance(workspace, definition);
    new MutationObserver(run).observe(workspace, { childList: true, subtree: true });
    run();
  }

  return Object.freeze({ summarizePath, missedMaterials, buildModel, render, enhance, mount });
});
