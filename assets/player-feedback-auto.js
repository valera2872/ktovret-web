(() => {
  'use strict';

  if (window.__mlFeedbackAutoInstalled) return;
  window.__mlFeedbackAutoInstalled = true;

  const path = location.pathname.replace(/\/+$/, '') || '/';
  const visible = (node) => {
    if (!node || node.hidden || node.getAttribute('aria-hidden') === 'true') return false;
    const style = getComputedStyle(node);
    return style.display !== 'none' && style.visibility !== 'hidden' && node.getClientRects().length > 0;
  };
  const meta = () => {
    if (path.includes('/poslednyaya-ariya')) return { caseId:'coop:last-aria', title:'Последняя ария', mode:'partner' };
    if (path.endsWith('/2317')) return { caseId:'coop:2317', title:'Последний звонок в 23:17', mode:'partner' };
    if (path.endsWith('/407')) return { caseId:'solo:407', title:'Номер 407', mode:'solo' };
    if (path.includes('/detektivnaya-igra-s-ii')) return { caseId:'AI-01', title:'Восемь минут без камеры', mode:'ai_text' };
    return null;
  };
  const config = meta();
  if (!config) return;

  let opened = false;
  const completed = () => {
    if (path.includes('/detektivnaya-igra-s-ii')) return visible(document.querySelector('[data-ai-detective] [data-view="resolution"]'));
    const selectors = [
      '.casearia-reveal', '.case2317-reveal', '.case407-reveal', '.solo407-reveal',
      '[data-case-reveal]', '[data-case-complete]', '[data-solo407-complete]', '[data-resolution="complete"]'
    ];
    return selectors.some((selector) => [...document.querySelectorAll(selector)].some(visible));
  };
  const load = () => {
    if (opened || !completed()) return;
    opened = true;
    const open = () => window.MysteryLogicFeedback?.open?.(config);
    if (window.MysteryLogicFeedback) { open(); return; }
    let script = document.querySelector('script[data-ml-player-feedback]');
    if (!script) {
      script = document.createElement('script');
      script.src = '/assets/player-feedback.js?v=2.0.0';
      script.defer = true;
      script.dataset.mlPlayerFeedback = 'true';
      script.addEventListener('load', open, { once:true });
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', open, { once:true });
      setTimeout(open, 0);
    }
  };

  const root = document.querySelector('[data-ai-detective],[data-case2317-app],[data-case407-app],[data-casearia-app],[data-solo407-app],main') || document.body;
  new MutationObserver(load).observe(root, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden','class','style','aria-hidden'] });
  load();
})();
