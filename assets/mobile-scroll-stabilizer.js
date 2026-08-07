(() => {
  'use strict';

  const root = document.querySelector('[data-ktv-root]');
  if (!root) return;

  const isMobile = () => window.matchMedia('(max-width: 820px)').matches;
  let desiredTarget = '';
  let settleTimer = 0;
  let settleToken = 0;

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

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || !isMobile()) return;

    const action = button.dataset.action;
    if (action === 'select' || action === 'hint') {
      settleTo('#ktv-answer');
      return;
    }

    if (action === 'submit') {
      window.setTimeout(() => {
        settleTo(root.querySelector('#ktv-result') ? '#ktv-result' : '#ktv-answer');
      }, 0);
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
})();
