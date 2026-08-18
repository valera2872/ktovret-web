(function () {
  'use strict';

  const materialId = new URLSearchParams(location.search).get('previewEvidence');
  if (!materialId) return;

  const findMaterialButton = () => [...document.querySelectorAll('[data-material]')]
    .find((candidate) => candidate.dataset.material === materialId);

  const open = () => {
    const direct = findMaterialButton();
    if (direct) {
      direct.click();
      return;
    }

    const materialsView = document.querySelector('[data-view="materials"]');
    if (!materialsView) return;
    materialsView.click();
    requestAnimationFrame(() => findMaterialButton()?.click());
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(open), { once: true });
  } else {
    requestAnimationFrame(open);
  }
})();
