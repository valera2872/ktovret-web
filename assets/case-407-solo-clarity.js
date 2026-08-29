(() => {
  'use strict';

  const root = document.querySelector('[data-solo407-app]');
  if (!root) return;

  const STATE_KEY = 'ml:solo:407:v1';
  const DONE_KEY = 'ml:solo:407:progressive-entry:v1';
  const ACTION_EVIDENCE = {
    security: 's1-i1',
    door: 's1-i2',
    lock: 's1-a0',
  };

  const readState = () => {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}') || {}; }
    catch { return {}; }
  };

  const revealChosenMaterial = (evidenceId) => {
    setTimeout(() => {
      const state = readState();
      if (!Array.isArray(state.opened) || !state.opened.includes(evidenceId)) return;

      try { localStorage.setItem(DONE_KEY, 'done'); } catch {}
      root.querySelector('[data-solo407-progressive]')?.remove();
      root.classList.remove('solo407-progressive-active');

      requestAnimationFrame(() => {
        const card = root.querySelector(`[data-evidence="${evidenceId}"]`);
        if (!card) return;
        card.classList.add('solo407-focus-material');
        card.setAttribute('tabindex', '-1');
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        card.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        try { card.focus({ preventScroll: true }); } catch {}
        setTimeout(() => card.classList.remove('solo407-focus-material'), 2200);
      });
    }, 45);
  };

  root.addEventListener('click', (event) => {
    const action = event.target.closest('[data-solo407-progressive-action]');
    if (!action || action.disabled) return;
    const evidenceId = ACTION_EVIDENCE[action.dataset.solo407ProgressiveAction];
    if (evidenceId) revealChosenMaterial(evidenceId);
  }, true);

  const injectArchiveSource = () => {
    const card = root.querySelector('[data-evidence="s2-i0"]');
    if (!card) return;

    const tag = card.querySelector('.solo407-evidence-head small');
    const sourceTag = 'Технический архив отеля · план 1998';
    if (tag && tag.textContent !== sourceTag) tag.textContent = sourceTag;

    const body = card.querySelector('.solo407-evidence-body');
    if (body && !body.querySelector('[data-solo407-material-source="archive-plan"]')) {
      body.insertAdjacentHTML('afterbegin', '<aside class="solo407-material-source" data-solo407-material-source="archive-plan"><strong>Источник материала</strong><span>После сверки таблички и дверного контроллера следователь запросил инженерную документацию 4-го этажа. Технический архив отеля выдал план 1998 года; сведения о сохранённой служебной двери сверены с документацией ремонта 2019 года.</span></aside>');
    }
  };

  const polishProgressiveCopy = () => {
    const choice = root.querySelector('[data-solo407-progressive][data-progressive-step="choice"]');
    const copy = choice?.querySelector('.solo407-progressive-next > div:first-child > p:last-child');
    if (copy && copy.dataset.clarityCopy !== 'done') {
      copy.textContent = 'Выберите одно направление. Сразу после выбора откроется полученный материал, и вы продолжите расследование на рабочем столе.';
      copy.dataset.clarityCopy = 'done';
    }
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
