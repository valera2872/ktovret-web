(() => {
  'use strict';

  const root = document.querySelector('[data-ktv-root]');
  if (!root || !window.KtoVretWeb?.case?.id) return;

  let opened = false;
  const loadFeedback = () => {
    if (opened) return;
    const result = root.querySelector('.ktv-result, #ktv-result');
    if (!result) return;
    opened = true;

    const open = () => window.MysteryLogicFeedback?.open?.({
      caseId: String(window.KtoVretWeb.case.id || ''),
      title: String(window.KtoVretWeb.case.title || document.querySelector('h1')?.textContent || 'Дело'),
      mode: 'short',
    });

    if (window.MysteryLogicFeedback) {
      open();
      return;
    }

    let script = document.querySelector('script[data-ml-player-feedback]');
    if (!script) {
      script = document.createElement('script');
      script.src = '/assets/player-feedback.js?v=2.0.0';
      script.defer = true;
      script.dataset.mlPlayerFeedback = 'true';
      script.addEventListener('load', open, { once: true });
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', open, { once: true });
      setTimeout(open, 0);
    }
  };

  const observer = new MutationObserver(loadFeedback);
  observer.observe(root, { childList: true, subtree: true });
  loadFeedback();
})();
