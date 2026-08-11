(() => {
  'use strict';

  const root = document.querySelector('[data-ktv-root]');
  const cfg = window.KtoVretWeb || {};
  if (!root) return;

  const isMobile = () => window.matchMedia('(max-width: 820px)').matches;
  let desiredTarget = '';
  let settleTimer = 0;
  let settleToken = 0;
  let desktopLock = null;
  let desktopFrame = 0;

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

  const holdDesktopScroll = () => {
    if (!desktopLock || isMobile()) {
      desktopLock = null;
      desktopFrame = 0;
      return;
    }

    if (performance.now() >= desktopLock.until) {
      desktopLock = null;
      desktopFrame = 0;
      return;
    }

    if (Math.abs(window.scrollY - desktopLock.y) > 0.5) {
      window.scrollTo({ top: desktopLock.y, left: window.scrollX, behavior: 'auto' });
    }
    desktopFrame = requestAnimationFrame(holdDesktopScroll);
  };

  const lockDesktopScroll = (duration = 650) => {
    if (isMobile()) return;
    desktopLock = {
      y: window.scrollY,
      until: performance.now() + duration,
    };
    if (desktopFrame) cancelAnimationFrame(desktopFrame);
    desktopFrame = requestAnimationFrame(holdDesktopScroll);
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

    if (action === 'select' || action === 'hint') {
      lockDesktopScroll();
      return;
    }

    // Wrong answers re-render the answer panel and app-core requests a smooth
    // scroll to it. On desktop that looks like a page jump, so keep the exact
    // viewport position. Correct answers are allowed to move to the result.
    if (action === 'submit' && !selectedIsCorrect()) {
      lockDesktopScroll(750);
    }
  }, true);

  const observer = new MutationObserver(() => {
    if (!isMobile() || !desiredTarget) return;
    window.clearTimeout(settleTimer);
    const target = desiredTarget;
    const token = settleToken;
    settleTimer = window.setTimeout(() => placeTarget(target, token), 70);
  });

  observer.observe(root, { childList: true, subtree: true });
  normalizeStaleTimer();
  installVisualPolish();
})();
