(() => {
  'use strict';

  const root = document.querySelector('[data-casearia-app]');
  if (!root || window.__MLCaseAriaResilience) return;
  window.__MLCaseAriaResilience = true;

  const PREFIX = 'mysterylogic:last-aria:v1:';
  const roomCode = () => String(new URL(location.href).searchParams.get('room') || '').trim().toUpperCase();

  const install = (data) => {
    if (!data?.decision?.options?.length || root.dataset.caseariaResilienceInstalled === '1') return false;
    root.dataset.caseariaResilienceInstalled = '1';

    const roleFromScreen = () => {
      const title = root.querySelector('.casearia-room-top>span:nth-child(2) strong')?.textContent?.trim() || '';
      if (title === data.roles?.guest?.title) return 'guest';
      if (title === data.roles?.creator?.title) return 'creator';
      const code = roomCode();
      if (code && localStorage.getItem(`${PREFIX}${code}:guest`) && !localStorage.getItem(`${PREFIX}${code}:creator`)) return 'guest';
      return 'creator';
    };

    const progressKey = () => {
      const code = roomCode();
      if (!code) return '';
      const role = roleFromScreen();
      const preferred = `${PREFIX}${code}:${role}`;
      if (localStorage.getItem(preferred)) return preferred;
      const candidates = [`${PREFIX}${code}:creator`, `${PREFIX}${code}:guest`];
      return candidates.find((key) => localStorage.getItem(key)) || preferred;
    };

    const normalize = () => {
      const key = progressKey();
      if (!key) return;
      let progress = {};
      try { progress = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { return; }
      let changed = false;
      const allowed = new Set((data.decision.options || []).map((item) => String(item.id || '')));
      const decision = String(progress.decision || '');

      // A stage-two choice is a provisional theory, not a graded answer. Preserve
      // every valid suspect choice across refresh/resume and clear only corrupt ids.
      if (decision && !allowed.has(decision)) {
        progress.decision = '';
        changed = true;
      }

      // Old builds graded intermediate theories. That metadata is obsolete now:
      // it must never reject a valid theory or affect future final scoring.
      for (const field of ['decisionHistory', 'decisionMistakes', 'decisionPenaltyApplied']) {
        if (Object.prototype.hasOwnProperty.call(progress, field)) {
          delete progress[field];
          changed = true;
        }
      }

      if (changed) {
        try { localStorage.setItem(key, JSON.stringify(progress)); } catch {}
      }
    };

    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => { scheduled = false; normalize(); });
    };

    document.addEventListener('click', (event) => {
      if (event.target.closest?.('[data-decision]')) schedule();
    }, true);
    document.addEventListener('submit', (event) => {
      if (event.target.closest?.('.casearia-final-form[data-final-form]')) schedule();
    }, true);

    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    normalize();
    return true;
  };

  if (install(window.MLCaseAria)) return;
  const bootObserver = new MutationObserver(() => {
    if (!install(window.MLCaseAria)) return;
    bootObserver.disconnect();
  });
  bootObserver.observe(root, { childList: true, subtree: true });
})();