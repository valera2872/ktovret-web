(() => {
  'use strict';

  const root = document.querySelector('[data-solo407-app]');
  if (!root) return;

  const STATE_KEY = 'ml:solo:407:v1';
  const ACTION_EVIDENCE = {
    security: 's1-i1',
    door: 's1-i2',
    lock: 's1-a0',
  };

  const readState = () => {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}') || {}; }
    catch { return {}; }
  };

  const esc = (value = '') => String(value).replace(/[&<>\"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;',
  }[char]));

  const evidenceById = (evidenceId) => {
    const match = /^s(\d+)-([ia])(\d+)$/.exec(evidenceId || '');
    if (!match) return null;
    const stage = window.MLCase407?.stages?.find((item) => Number(item.id) === Number(match[1]));
    if (!stage) return null;
    const list = match[2] === 'i' ? stage.investigator : stage.analyst;
    return Array.isArray(list) ? list[Number(match[3])] || null : null;
  };

  const completedGuidedActions = (state) => {
    const opened = new Set(Array.isArray(state.opened) ? state.opened : []);
    return Object.values(ACTION_EVIDENCE).filter((evidenceId) => opened.has(evidenceId));
  };

  if (!document.getElementById('ml-solo407-guided-material')) {
    const style = document.createElement('style');
    style.id = 'ml-solo407-guided-material';
    style.textContent = `
      .solo407-progressive-material{margin:18px 0;padding:18px 20px;border:1px solid rgba(210,174,115,.24);border-radius:16px;background:rgba(8,20,30,.76)}
      .solo407-progressive-material small{display:block;margin-bottom:5px;color:#d2ae73;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
      .solo407-progressive-material h2{margin:0 0 10px;font-family:Georgia,serif;font-size:22px;font-weight:500}
      .solo407-progressive-material p{margin:8px 0;line-height:1.58}
      .solo407-progressive-material-note{margin-top:12px!important;padding-top:11px;border-top:1px solid rgba(210,174,115,.14);color:#91a7b4}
    `;
    document.head.appendChild(style);
  }

  const focusMaterialOnDesk = (evidenceId) => {
    requestAnimationFrame(() => {
      const card = root.querySelector(`[data-evidence="${evidenceId}"]`);
      if (!card) return;
      card.classList.add('solo407-focus-material');
      card.setAttribute('tabindex', '-1');
      card.scrollIntoView({ behavior: 'auto', block: 'center' });
      try { card.focus({ preventScroll: true }); } catch {}
      setTimeout(() => card.classList.remove('solo407-focus-material'), 2200);
    });
  };

  const showChosenMaterial = (evidenceId) => {
    setTimeout(() => {
      const state = readState();
      if (!Array.isArray(state.opened) || !state.opened.includes(evidenceId)) return;

      const completed = completedGuidedActions(state);
      if (completed.length >= 2) {
        // progressive-entry.js owns the two-action completion gate and desk reveal.
        // Do not mark onboarding done here; just focus the second material after the desk appears.
        setTimeout(() => focusMaterialOnDesk(evidenceId), 60);
        return;
      }

      const overlay = root.querySelector('[data-solo407-progressive][data-progressive-step="choice"]');
      const next = overlay?.querySelector('.solo407-progressive-next');
      const evidence = evidenceById(evidenceId);
      if (!overlay || !next || !evidence) return;

      overlay.querySelector('[data-solo407-progressive-material]')?.remove();
      const paragraphs = (evidence.body || []).map((text) => `<p>${esc(text)}</p>`).join('');
      next.insertAdjacentHTML('beforebegin', `
        <article class="solo407-progressive-material" data-solo407-progressive-material="${esc(evidenceId)}">
          <small>Получен материал · ${esc(evidence.tag || 'материал дела')}</small>
          <h2>${esc(evidence.title || 'Новый материал')}</h2>
          ${paragraphs}
          <p class="solo407-progressive-material-note"><strong>Первое направление проверено.</strong> Выберите ещё одно следственное действие ниже — после него откроется полный рабочий стол.</p>
        </article>`);
    }, 45);
  };

  const injectArchiveSource = () => {
    const card = root.querySelector('[data-evidence="s2-i0"]');
    if (!card) return false;

    const tag = card.querySelector('.solo407-evidence-head small');
    const sourceTag = 'Технический архив отеля · план 1998';
    if (tag && tag.textContent !== sourceTag) tag.textContent = sourceTag;

    const body = card.querySelector('.solo407-evidence-body');
    if (body && !body.querySelector('[data-solo407-material-source="archive-plan"]')) {
      body.insertAdjacentHTML('afterbegin', '<aside class="solo407-material-source" data-solo407-material-source="archive-plan"><strong>Источник материала</strong><span>После сверки таблички и дверного контроллера следователь запросил инженерную документацию 4-го этажа. Технический архив отеля выдал план 1998 года; сведения о сохранённой служебной двери сверены с документацией ремонта 2019 года.</span></aside>');
    }
    return Boolean(body);
  };

  const scheduleArchiveSource = () => {
    setTimeout(injectArchiveSource, 0);
    setTimeout(injectArchiveSource, 60);
  };

  root.addEventListener('click', (event) => {
    const archiveToggle = event.target.closest('[data-open="s2-i0"]');
    if (archiveToggle) scheduleArchiveSource();

    const action = event.target.closest('[data-solo407-progressive-action]');
    if (!action || action.disabled) return;
    const evidenceId = ACTION_EVIDENCE[action.dataset.solo407ProgressiveAction];
    if (evidenceId) showChosenMaterial(evidenceId);
  }, true);

  for (const eventName of ['ml:solo_evidence_open', 'ml:solo_request']) {
    window.addEventListener(eventName, scheduleArchiveSource);
  }

  const polishProgressiveCopy = () => {
    const choice = root.querySelector('[data-solo407-progressive][data-progressive-step="choice"]');
    const copy = choice?.querySelector('.solo407-progressive-next > div:first-child > p:last-child');
    if (!copy) return;

    const completed = completedGuidedActions(readState()).length;
    const desired = completed === 1
      ? 'Первое направление уже проверено. Изучите полученный материал и выберите ещё одно — после второго действия откроется полный рабочий стол.'
      : 'Выберите направление, которое считаете наиболее полезным. После первого результата мы предложим проверить ещё один след, прежде чем открыть полный рабочий стол.';

    if (copy.textContent !== desired) copy.textContent = desired;
  };

  let scheduled = false;
  const apply = () => {
    scheduled = false;
    injectArchiveSource();
    polishProgressiveCopy();
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(apply);
  };

  new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  schedule();
})();
