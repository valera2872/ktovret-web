(() => {
  'use strict';

  const root = document.querySelector('[data-casearia-app]');
  if (!root || window.__MLCaseAriaResilience) return;
  window.__MLCaseAriaResilience = true;

  const PREFIX = 'mysterylogic:last-aria:v1:';
  const roomCode = () => String(new URL(location.href).searchParams.get('room') || '').trim().toUpperCase();

  const install = (data) => {
    if (!data?.decision?.correct || root.dataset.caseariaResilienceInstalled === '1') return false;
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
      const history = Array.isArray(progress.decisionHistory) ? [...progress.decisionHistory] : [];
      const decision = String(progress.decision || '');

      // Migrate saves created by the legacy runtime, where any stage-two option
      // was treated as sufficient to advance. A wrong legacy choice becomes a
      // rejected line rather than an accepted investigative conclusion.
      if (decision && decision !== data.decision.correct) {
        if (!history.includes(decision)) {
          history.push(decision);
          progress.decisionHistory = history;
          progress.decisionMistakes = Number(progress.decisionMistakes || 0) + 1;
        }
        progress.decision = '';
        changed = true;
      }

      // Apply the intermediate-decision penalty independently of listener order.
      // This protects both dynamically loaded feedback and resumed old sessions.
      const mistakes = Number(progress.decisionMistakes || 0);
      if (mistakes > 0 && !progress.decisionPenaltyApplied) {
        progress.attempts = Number(progress.attempts || 0) + mistakes;
        progress.decisionPenaltyApplied = true;
        if (progress.firstAnswerCorrect === null || typeof progress.firstAnswerCorrect === 'undefined') progress.firstAnswerCorrect = false;
        changed = true;
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

    // document capture fires before the case root. We schedule normalization for
    // after the current event, so a wrong decision written by the investigation
    // guard is scored even if another root listener stops propagation later.
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
