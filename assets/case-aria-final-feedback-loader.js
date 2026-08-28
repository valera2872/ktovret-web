(() => {
  'use strict';

  const root = document.querySelector('[data-casearia-app]');
  if (!root || window.__MLCaseAriaFinalFeedbackLoader) return;
  window.__MLCaseAriaFinalFeedbackLoader = true;

  const load = () => {
    if (!window.MLCaseAria?.final || window.__MLCaseAriaFinalFeedbackReloaded) return false;
    window.__MLCaseAriaFinalFeedbackReloaded = true;
    const current = document.currentScript?.src || '';
    const src = current
      ? current.replace(/case-aria-final-feedback-loader\.js(?:\?.*)?$/, 'case-aria-final-feedback.js?v=2')
      : '../../assets/case-aria-final-feedback.js?v=2';
    const script = document.createElement('script');
    script.src = src;
    script.dataset.caseariaFinalFeedbackRuntime = '1';
    document.body.appendChild(script);
    return true;
  };

  if (load()) return;
  const observer = new MutationObserver(() => {
    if (!load()) return;
    observer.disconnect();
  });
  observer.observe(root, { childList: true, subtree: true });
})();
