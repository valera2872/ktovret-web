(function () {
  'use strict';

  const materialId = new URLSearchParams(location.search).get('previewEvidence');
  if (!materialId) return;

  const open = () => {
    const button = [...document.querySelectorAll('[data-material]')]
      .find((candidate) => candidate.dataset.material === materialId);
    if (button) button.click();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(open), { once: true });
  } else {
    requestAnimationFrame(open);
  }
})();
