(() => {
  'use strict';
  if (!document.querySelector('[data-ktv-root]') || !window.KtoVretWeb?.case?.id) return;
  if (!document.querySelector('link[data-ml-feedback-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/post-case-feedback.css?v=2';
    link.dataset.mlFeedbackCss = 'true';
    document.head.appendChild(link);
  }
  if (!window.MysteryLogicPostCaseFeedback && !document.querySelector('script[data-ml-feedback-loader]')) {
    const script = document.createElement('script');
    script.src = '/assets/post-case-feedback.js?v=2';
    script.defer = true;
    script.dataset.mlFeedbackLoader = 'true';
    document.head.appendChild(script);
  } else {
    window.MysteryLogicPostCaseFeedback?.scan?.();
  }
})();