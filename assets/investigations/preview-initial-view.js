(function () {
  'use strict';
  const requested = new URLSearchParams(location.search).get('previewInitial');
  const view = ['overview', 'materials', 'people', 'theory'].includes(requested)
    ? requested
    : globalThis.MysteryLogicPreviewInitialView;
  if (!view) return;
  const button = document.querySelector(`[data-view="${CSS.escape(view)}"]`);
  button?.click();
})();
