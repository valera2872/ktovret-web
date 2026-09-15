(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/social-proof';
  const BIG_CASES = {
    '/detektivnye-igry-dlya-odnogo/407/': 'solo-407',
    '/detektivnye-igry-dlya-dvoih/2317/': 'coop-2317',
    '/detektivnye-igry-dlya-dvoih/407/': 'coop-407',
    '/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/': 'last_aria',
    '/detektivnaya-igra-s-ii/': 'case:ai:01',
    '/ai-investigation/': 'case:ai:01',
  };

  const cleanPath = (href = '') => {
    try { return new URL(href, location.href).pathname.replace(/\/$/, '') + '/'; }
    catch { return ''; }
  };
  const gameKeyFromPath = (href = '') => BIG_CASES[cleanPath(href)] || '';
  const playerText = (n) => {
    const a = Math.abs(n) % 100, b = Math.abs(n) % 10;
    if (a >= 11 && a <= 14) return `${n} игроков прошли`;
    if (b === 1) return `${n} игрок прошёл`;
    if (b >= 2 && b <= 4) return `${n} игрока прошли`;
    return `${n} игроков прошли`;
  };

  const addStyles = () => {
    if (document.querySelector('[data-ml-social-proof-styles]')) return;
    const style = document.createElement('style');
    style.dataset.mlSocialProofStyles = 'true';
    style.textContent = `
      .ml-social-proof{display:flex;flex-wrap:wrap;gap:7px 10px;align-items:center;margin:10px 0 12px;color:#b9c7d0;font-size:.76rem;font-weight:800;line-height:1.35}
      .ml-social-proof.compact{font-size:.72rem;margin:8px 0 10px}
      .coop-entry-choice .ml-social-proof{margin:2px 0 1px;font-size:.66rem;gap:5px 7px;color:#b9ad9d}
      .ml-social-proof.current{width:max-content;max-width:100%;padding:8px 11px;border:1px solid rgba(231,201,143,.2);border-radius:999px;background:rgba(7,17,29,.48);backdrop-filter:blur(8px);font-size:.78rem;margin:10px 0 16px}
    `;
    document.head.appendChild(style);
  };

  const makeProof = (item = {}, { compact = false, current = false } = {}) => {
    const players = Number(item?.completedPlayers || 0);
    if (players <= 0) return null;
    const node = document.createElement('div');
    node.className = `ml-social-proof${compact ? ' compact' : ''}${current ? ' current' : ''}`;
    node.dataset.mlSocialProof = 'true';
    node.title = 'Подтверждённые завершения расследования.';
    node.textContent = playerText(players);
    return node;
  };

  const currentGameKey = () => {
    const big = gameKeyFromPath(location.href);
    if (big) return big;
    const rootId = document.querySelector('[data-ktv-root][data-case-id]')?.dataset?.caseId
      || document.querySelector('main[data-case-id]')?.dataset?.caseId
      || window.KtoVretWeb?.case?.id
      || '';
    return rootId ? `case:${String(rootId).trim()}` : '';
  };

  const placeCurrentProof = (items) => {
    const key = currentGameKey();
    if (!key || document.querySelector('[data-ml-current-proof]')) return true;
    const proof = makeProof(items[key] || {}, { current: true });
    if (!proof) return true;
    proof.dataset.mlCurrentProof = key;
    const title = document.querySelector('.ktv-cover-copy h1,.ktv-hero-copy h1,.coop-hero h1,.solo407-hero h1,[data-case-hero] h1,main h1');
    if (!title) return false;
    title.insertAdjacentElement('afterend', proof);
    return true;
  };

  const render = (items) => {
    addStyles();
    document.querySelectorAll('[data-ml-public-reviews]').forEach((node) => node.remove());

    document.querySelectorAll('[data-case-id]').forEach((card) => {
      if (card.matches('[data-ktv-root]') || card.querySelector('[data-ml-social-proof]')) return;
      const id = String(card.dataset.caseId || '').trim();
      if (!id) return;
      const proof = makeProof(items[`case:${id}`] || {}, { compact: true });
      if (!proof) return;
      const action = card.querySelector('[data-case-open],a[href]');
      if (action) action.insertAdjacentElement('beforebegin', proof);
      else card.appendChild(proof);
    });

    document.querySelectorAll('a[href]').forEach((anchor) => {
      const key = gameKeyFromPath(anchor.getAttribute('href') || '');
      if (!key) return;
      const item = items[key] || {};
      const coopChoice = anchor.closest('.coop-entry-choice');
      if (coopChoice) {
        if (coopChoice.dataset.mlProofDone === key) return;
        const proof = makeProof(item, { compact: true });
        if (!proof) return;
        coopChoice.dataset.mlProofDone = key;
        const action = coopChoice.querySelector('b');
        if (action) action.insertAdjacentElement('beforebegin', proof);
        else coopChoice.appendChild(proof);
        return;
      }
      const container = anchor.closest('.solo407-hub-card,.case407-catalog,.coop-hero,.ml-case-card,article,section');
      if (!container || container.dataset.mlProofDone === key) return;
      const proof = makeProof(item);
      if (!proof) return;
      container.dataset.mlProofDone = key;
      anchor.insertAdjacentElement('beforebegin', proof);
    });

    if (!placeCurrentProof(items)) {
      const observer = new MutationObserver(() => { if (placeCurrentProof(items)) observer.disconnect(); });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 8000);
    }
  };

  fetch(ENDPOINT, { cache: 'no-store', credentials: 'omit' })
    .then((response) => response.ok ? response.json() : null)
    .then((payload) => { if (payload?.ok) render(payload.items || {}); })
    .catch(() => {});
})();
