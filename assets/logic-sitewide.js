(() => {
  'use strict';
  const METRIKA_ID = 111664459;
  const sendMetrika = (goal, params = {}) => {
    try { if (typeof window.ym === 'function') window.ym(METRIKA_ID, 'reachGoal', goal, params); } catch {}
  };
  const sendFunnel = (eventName, metadata = {}, target = '') => {
    try { window.MysteryLogicFunnel?.track?.(eventName, metadata, target); } catch {}
  };
  const pathOf = (href) => {
    try { return new URL(href, location.href).pathname; } catch { return ''; }
  };

  document.addEventListener('click', (event) => {
    const link = event.target?.closest?.('a[href]');
    if (!link) return;
    if (link.matches('[data-telegram-cta]')) {
      const placement = link.dataset.telegramCta || 'sitewide';
      sendFunnel('telegram_click', { placement }, 't.me/mysterylogic');
      sendMetrika('ml_telegram_click', { placement });
      return;
    }
    const path = pathOf(link.getAttribute('href'));
    if (/^\/(?:golovolomki-onlayn|zagadki-na-logiku-dlya-vzroslyh|logicheskie-zadachi)(?:\/|$)/.test(path)) {
      const placement = link.dataset.logicCta || 'sitewide';
      sendFunnel('logic_hub_open', { placement, target_path: path }, path);
      sendMetrika('ml_logic_hub_open', { placement, target_path: path });
    }
  }, true);
})();
