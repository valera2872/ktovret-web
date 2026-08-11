(() => {
  'use strict';

  const root = document.querySelector('[data-ktv-root]');
  const cfg = window.KtoVretWeb || {};
  if (!root) return;

  const isMobile = () => window.matchMedia('(max-width: 820px)').matches;
  let desiredTarget = '';
  let settleTimer = 0;
  let settleToken = 0;
  let desktopTarget = '';
  let desktopUntil = 0;
  let desktopToken = 0;
  let desktopTimer = 0;

  const installVisualPolish = () => {
    if (document.querySelector('[data-ml-live-polish]')) return;
    const style = document.createElement('style');
    style.dataset.mlLivePolish = 'true';
    style.textContent = `
      body.ktv-case-page .ktv-game-shell .ktv-hero::before,
      body.ktv-case-page .ktv-game-shell .ktv-hero::after {
        display: none !important;
        content: none !important;
      }
      @media (max-width: 900px) {
        body.ktv-case-page .ktv-game-shell .ktv-hero-stamp {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const normalizeStaleTimer = () => {
    if (!cfg.storageKey) return;
    try {
      const state = JSON.parse(localStorage.getItem(cfg.storageKey) || '{}');
      if (!state || typeof state !== 'object' || state.solved || !state.accepted) return;
      const startedAt = Number(state.startedAt || 0);
      if (!startedAt) return;

      // «Кто врёт?» is a short-session product. If an unfinished case was left
      // open for more than 90 minutes, do not count the idle gap as solve time.
      if (Date.now() - startedAt > 90 * 60 * 1000) {
        state.startedAt = Date.now();
        localStorage.setItem(cfg.storageKey, JSON.stringify(state));
      }
    } catch {
      // Storage errors must never block the game.
    }
  };

  const placeTarget = (selector, token) => {
    if (!isMobile() || !selector || token !== settleToken) return;
    const target = root.querySelector(selector);
    if (!target) return;
    target.scrollIntoView({ behavior: 'auto', block: 'start' });
    target.focus?.({ preventScroll: true });
  };

  const settleTo = (selector) => {
    if (!isMobile() || !selector) return;
    desiredTarget = selector;
    settleToken += 1;
    const token = settleToken;
    window.clearTimeout(settleTimer);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => placeTarget(selector, token));
    });
    settleTimer = window.setTimeout(() => placeTarget(selector, token), 90);
    window.setTimeout(() => placeTarget(selector, token), 220);
  };

  const placeDesktopTarget = (selector, token) => {
    if (isMobile() || !selector || token !== desktopToken || performance.now() > desktopUntil) return;
    const target = root.querySelector(selector);
    if (!target) return;

    // Keep one complete interaction section anchored near the top edge of the
    // viewport. Late DOM adapters can still change heights for a few frames,
    // so this placement is repeated briefly after the game re-render.
    const desiredTop = 14;
    const delta = target.getBoundingClientRect().top - desiredTop;
    if (Math.abs(delta) > 0.5) {
      window.scrollBy({ top: delta, left: 0, behavior: 'auto' });
    }
    target.focus?.({ preventScroll: true });
  };

  const settleDesktopTo = (selector, duration = 850) => {
    if (isMobile() || !selector) return;
    desktopTarget = selector;
    desktopUntil = performance.now() + duration;
    desktopToken += 1;
    const token = desktopToken;
    window.clearTimeout(desktopTimer);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => placeDesktopTarget(selector, token));
    });
    [45, 110, 210, 360, 560, 760].forEach((delay) => {
      window.setTimeout(() => placeDesktopTarget(selector, token), delay);
    });
    desktopTimer = window.setTimeout(() => {
      if (token === desktopToken) desktopTarget = '';
    }, duration + 80);
  };

  const selectedIsCorrect = () => {
    const selectedId = root.querySelector('.ktv-option.is-selected')?.dataset.optionId || '';
    const correctId = cfg.case?.answerStages?.[0]?.correctOptionIds?.[0] || '';
    return Boolean(selectedId && correctId && selectedId === correctId);
  };

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const action = button.dataset.action;

    if (isMobile()) {
      if (action === 'select' || action === 'hint') {
        settleTo('#ktv-answer');
        return;
      }
      if (action === 'submit') {
        window.setTimeout(() => {
          settleTo(root.querySelector('#ktv-result') ? '#ktv-result' : '#ktv-answer');
        }, 0);
      }
      return;
    }

    // Desktop should never stop between two sections after a state change.
    // Selection/hints keep the full answer card in view. Submit snaps either
    // the refreshed answer card (wrong) or the result card (correct) to top.
    if (action === 'select' || action === 'hint') {
      settleDesktopTo('#ktv-answer', 520);
      return;
    }

    if (action === 'submit') {
      settleDesktopTo(selectedIsCorrect() ? '#ktv-result' : '#ktv-answer', 950);
    }
  }, true);

  const observer = new MutationObserver(() => {
    if (isMobile()) {
      if (!desiredTarget) return;
      window.clearTimeout(settleTimer);
      const target = desiredTarget;
      const token = settleToken;
      settleTimer = window.setTimeout(() => placeTarget(target, token), 70);
      return;
    }

    if (!desktopTarget || performance.now() > desktopUntil) return;
    window.clearTimeout(desktopTimer);
    const target = desktopTarget;
    const token = desktopToken;
    desktopTimer = window.setTimeout(() => placeDesktopTarget(target, token), 35);
  });

  observer.observe(root, { childList: true, subtree: true });
  normalizeStaleTimer();
  installVisualPolish();
})();
