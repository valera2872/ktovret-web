(function () {
  'use strict';

  const materialId = new URLSearchParams(location.search).get('previewEvidence');
  if (!materialId) return;

  const findMaterialButton = () => [...document.querySelectorAll('[data-material]')]
    .find((candidate) => candidate.dataset.material === materialId);

  const enhance = () => {
    globalThis.MysteryLogicEvidenceRenderers?.enhanceDialog?.();
    setTimeout(() => globalThis.MysteryLogicEvidenceRenderers?.enhanceDialog?.(), 0);
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
    setTimeout(() => clickMaterial(findMaterialButton()), 0);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', open, { once: true });
  } else {
    open();
  }
})();
