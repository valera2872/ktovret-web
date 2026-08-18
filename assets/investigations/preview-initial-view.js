(function () {
  'use strict';
  const view = globalThis.MysteryLogicPreviewInitialView;
  if (!view) return;
  const button = document.querySelector(`[data-view="${CSS.escape(view)}"]`);
  button?.click();
})();
