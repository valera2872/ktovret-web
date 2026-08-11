(() => {
  'use strict';

  const root = document.querySelector('[data-ktv-root]');
  if (!root) return;

  const isMobile = () => window.matchMedia('(max-width: 820px)').matches;
  let desiredTarget = '';
  let settleTimer = 0;
  let settleToken = 0;
  let desktopAnchor = null;
  let desktopTimer = 0;
  let desktopToken = 0;

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

  const restoreDesktopAnchor = (token) => {
    if (isMobile() || !desktopAnchor || token !== desktopToken) return;
    const target = root.querySelector(desktopAnchor.selector);
    if (!target) return;
    const delta = target.getBoundingClientRect().top - desktopAnchor.top;
    if (Math.abs(delta) > 0.5) window.scrollBy(0, delta);
  };

  const preserveDesktopPosition = (selector) => {
    if (isMobile() || !selector) return;
    const target = root.querySelector(selector);
    if (!target) return;

    desktopToken += 1;
    const token = desktopToken;
    desktopAnchor = {
      selector,
      top: target.getBoundingClientRect().top,
    };
    window.clearTimeout(desktopTimer);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => restoreDesktopAnchor(token));
    });
    [70, 150, 280].forEach((delay) => {
      window.setTimeout(() => restoreDesktopAnchor(token), delay);
    });
    window.setTimeout(() => {
      if (token === desktopToken) desktopAnchor = null;
    }, 420);
  };

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    if (action === 'select' || action === 'hint') {
      if (isMobile()) settleTo('#ktv-answer');
      else preserveDesktopPosition('#ktv-answer');
      return;
    }

    if (action === 'submit' && isMobile()) {
      window.setTimeout(() => {
        settleTo(root.querySelector('#ktv-result') ? '#ktv-result' : '#ktv-answer');
      }, 0);
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

    if (!desktopAnchor) return;
    window.clearTimeout(desktopTimer);
    const token = desktopToken;
    desktopTimer = window.setTimeout(() => restoreDesktopAnchor(token), 45);
  });

  observer.observe(root, { childList: true, subtree: true });
})();
