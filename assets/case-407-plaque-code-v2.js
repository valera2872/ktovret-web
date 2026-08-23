(() => {
  'use strict';

  const PUBLIC_CODE = 'H-7C4';
  const LEGACY_CODE = 'H-409';
  const root = document.querySelector('[data-case407-app]');

  const replaceInValue = (value) => typeof value === 'string' ? value.replaceAll(LEGACY_CODE, PUBLIC_CODE) : value;
  const migrateStory = (value, seen = new WeakSet()) => {
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return value;
    seen.add(value);
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (typeof value[index] === 'string') value[index] = replaceInValue(value[index]);
        else migrateStory(value[index], seen);
      }
      return value;
    }
    for (const key of Object.keys(value)) {
      if (typeof value[key] === 'string') value[key] = replaceInValue(value[key]);
      else migrateStory(value[key], seen);
    }
    return value;
  };

  if (window.MLCase407) migrateStory(window.MLCase407);
  if (!root) return;

  const normalize = (value = '') => String(value).trim().toUpperCase().replace(/[–—−]/g, '-').replace(/\s+/g, '');
  const translateInputForLegacyRuntime = (event) => {
    const input = event.target?.closest?.('[data-handoff-input][data-handoff-key="stage1"]')
      || root.querySelector('[data-handoff-input][data-handoff-key="stage1"]');
    if (!input || normalize(input.value) !== PUBLIC_CODE) return;
    input.value = LEGACY_CODE;
  };

  root.addEventListener('click', (event) => {
    if (event.target?.closest?.('[data-action="handoff"][data-handoff-key="stage1"]')) translateInputForLegacyRuntime(event);
  }, true);
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target?.matches?.('[data-handoff-input][data-handoff-key="stage1"]')) translateInputForLegacyRuntime(event);
  }, true);

  const maskLegacyText = (node) => {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue?.includes(LEGACY_CODE)) node.nodeValue = node.nodeValue.replaceAll(LEGACY_CODE, PUBLIC_CODE);
      return;
    }
    if (!(node instanceof Element)) return;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();
    while (textNode) {
      if (textNode.nodeValue?.includes(LEGACY_CODE)) textNode.nodeValue = textNode.nodeValue.replaceAll(LEGACY_CODE, PUBLIC_CODE);
      textNode = walker.nextNode();
    }
  };

  new MutationObserver((mutations) => {
    for (const mutation of mutations) for (const node of mutation.addedNodes) maskLegacyText(node);
  }).observe(root, { childList: true, subtree: true });
  maskLegacyText(root);

  window.ML407PlaqueCode = Object.freeze({ publicCode: PUBLIC_CODE, legacyAlias: LEGACY_CODE });
})();
