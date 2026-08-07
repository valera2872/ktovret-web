(() => {
  'use strict';

  const root = document.querySelector('[data-ktv-root]');
  if (!root) return;

  const isMobile = () => window.matchMedia('(max-width: 820px)').matches;
  let desiredTarget = '';
  let timer = 0;

  const settleTo = (selector) => {
    if (!selector || !isMobile()) return;
    desiredTarget = selector;
    window.clearTimeout(timer);

    const place = () => {
      const target = root.querySelector(desiredTarget);
      if (!target) return;
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
      target.focus?.({ preventScroll: true });
    };

    requestAnimationFrame(() => requestAnimationFrame(place));
    timer = window.setTimeout(place, 90);
    window.setTimeout(place, 220);
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
      const wasSolved = Boolean(root.querySelector('#ktv-result'));
      window.setTimeout(() => {
        const nowSolved = Boolean(root.querySelector('#ktv-result'));
        settleTo(!wasSolved && nowSolved ? '#ktv-result' : '#ktv-answer');
      }, 0);
    }
  }, true);

  // The witness/cycle adapter mutates the freshly rendered DOM after the core
  // has already started its own smooth scroll. Re-apply the target after those
  // mutations settle so mobile browsers do not preserve the old notebook offset.
  const observer = new MutationObserver(() => {
    if (!desiredTarget || !isMobile()) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => settleTo(desiredTarget), 55);
  });
  observer.observe(root, { childList: true, subtree: true });
})();
