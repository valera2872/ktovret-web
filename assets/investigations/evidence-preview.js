(function () {
  'use strict';

  const materialId = new URLSearchParams(location.search).get('previewEvidence');
  if (!materialId) return;

  const findMaterialButton = () => [...document.querySelectorAll('[data-material]')]
    .find((candidate) => candidate.dataset.material === materialId);

  const enhance = () => {
    requestAnimationFrame(() => {
      globalThis.MysteryLogicEvidenceRenderers?.enhanceDialog?.();
    });
  };

  const clickMaterial = (button) => {
    if (!button) return false;
    button.click();
    enhance();
    return true;
  };

  const open = () => {
    if (clickMaterial(findMaterialButton())) return;

    const materialsView = document.querySelector('[data-view="materials"]');
    if (!materialsView) return;
    materialsView.click();
    requestAnimationFrame(() => clickMaterial(findMaterialButton()));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(open), { once: true });
  } else {
    requestAnimationFrame(open);
  }
})();
