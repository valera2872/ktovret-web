(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/social-proof';

  const playerText = (n) => {
    const a = Math.abs(n) % 100, b = Math.abs(n) % 10;
    if (a >= 11 && a <= 14) return `${n} игроков прошли`;
    if (b === 1) return `${n} игрок прошёл`;
    if (b >= 2 && b <= 4) return `${n} игрока прошли`;
    return `${n} игроков прошли`;
  };

  const addStyles = () => {
    if (document.querySelector('[data-solo-card-proof-styles]')) return;
    const style = document.createElement('style');
    style.dataset.soloCardProofStyles = 'true';
    style.textContent = `
      .solo-card-proof{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:12px 0 11px;padding-top:11px;border-top:1px solid rgba(231,201,143,.13);font:800 11px/1.35 Inter,ui-sans-serif,system-ui,sans-serif;color:#aebbc3}
      .solo-card-proof__empty{color:#8f9ca5}
      .sm-hub-card .solo-card-proof{margin-top:auto}
      .sp-card .solo-card-proof{margin-top:auto}
    `;
    document.head.appendChild(style);
  };

  const renderProof = (card, key, item = {}) => {
    if (!card || card.querySelector('[data-solo-card-proof]')) return;
    const players = Number(item.completedPlayers || 0);
    const node = document.createElement('div');
    node.className = 'solo-card-proof';
    node.dataset.soloCardProof = key;
    node.title = 'Подтверждённые завершения расследования.';
    node.innerHTML = players > 0
      ? `<span>${playerText(players)}</span>`
      : '<span class="solo-card-proof__empty">Пока нет завершённых прохождений</span>';
    const action = card.querySelector('.sm-hub-card__go') || card.querySelector(':scope > strong:last-child');
    if (action) action.insertAdjacentElement('beforebegin', node);
    else card.appendChild(node);
  };

  const render = (items) => {
    addStyles();
    document.querySelectorAll('.sm-hub-card[data-mini-card]').forEach((card) => {
      const id = String(card.dataset.miniCard || '').trim();
      if (id) renderProof(card, `case:${id}`, items[`case:${id}`] || {});
    });
    document.querySelectorAll('.sp-card[data-solo-paid-case]').forEach((card) => {
      const id = String(card.dataset.soloPaidCase || '').trim();
      if (id) renderProof(card, `case:${id}`, items[`case:${id}`] || {});
    });
  };

  fetch(ENDPOINT, { cache: 'no-store', credentials: 'omit' })
    .then((response) => response.ok ? response.json() : null)
    .then((payload) => { if (payload?.ok) render(payload.items || {}); })
    .catch(() => {});
})();
