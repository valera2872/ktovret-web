(() => {
  'use strict';
  const root = document.querySelector('.ref-access-strip');
  if (!root || !/85\s+дел/i.test(root.textContent || '')) return;
  const normalize = () => {
    root.querySelectorAll('strong').forEach((node) => {
      if (/^\s*99\s*₽\s*$/iu.test(node.textContent || '')) node.textContent = '199 ₽';
    });
  };
  normalize();
  new MutationObserver(normalize).observe(root, { subtree: true, childList: true, characterData: true });
})();
