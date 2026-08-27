(() => {
  'use strict';
  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/social-proof';

  const gameKeyFromPath = (href = '') => {
    try {
      const path = new URL(href, location.href).pathname.replace(/\/$/, '') + '/';
      const map = {
        '/detektivnye-igry-dlya-odnogo/407/': 'solo-407',
        '/detektivnye-igry-dlya-dvoih/2317/': 'coop-2317',
        '/detektivnye-igry-dlya-dvoih/407/': 'coop-407',
        '/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/': 'last_aria',
      };
      return map[path] || '';
    } catch { return ''; }
  };

  const reviewWord = (n) => {
    const a = Math.abs(n) % 100, b = Math.abs(n) % 10;
    if (a >= 11 && a <= 14) return 'отзывов';
    if (b === 1) return 'отзыв';
    if (b >= 2 && b <= 4) return 'отзыва';
    return 'отзывов';
  };

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
    style.textContent = '.ml-social-proof{display:flex;flex-wrap:wrap;gap:7px 10px;align-items:center;margin:10px 0 12px;color:#b9c7d0;font-size:.76rem;font-weight:800;line-height:1.35}.ml-social-proof .star{color:#e7c98f;font-weight:950}.ml-social-proof .dot{opacity:.45}.ml-social-proof.compact{font-size:.72rem;margin:8px 0 10px}';
    document.head.appendChild(style);
  };

  const makeProof = (item, compact = false) => {
    const reviews = Number(item?.reviewCount || 0);
    const players = Number(item?.completedPlayers || 0);
    const rating = Number(item?.rating || 0);
    const chunks = [];
    if (reviews >= 3 && rating >= 1 && rating <= 5) chunks.push(`<span class="star">★ ${rating.toFixed(1)}</span>`);
    if (reviews > 0) chunks.push(`<span>${reviews} ${reviewWord(reviews)}</span>`);
    if (players >= 10) chunks.push(`<span>${playerText(players)}</span>`);
    if (!chunks.length) return null;
    const node = document.createElement('div');
    node.className = `ml-social-proof${compact ? ' compact' : ''}`;
    node.dataset.mlSocialProof = 'true';
    node.title = 'Оценки публикуются после модерации. Число игроков — подтверждённые завершения.';
    node.innerHTML = chunks.join('<span class="dot">•</span>');
    return node;
  };

  const render = (items) => {
    addStyles();
    document.querySelectorAll('[data-case-id]').forEach((card) => {
      if (card.querySelector('[data-ml-social-proof]')) return;
      const id = String(card.dataset.caseId || '').trim();
      const proof = makeProof(items[`case:${id}`], true);
      if (!proof) return;
      const action = card.querySelector('[data-case-open],a[href]');
      if (action) action.insertAdjacentElement('beforebegin', proof);
      else card.appendChild(proof);
    });

    document.querySelectorAll('a[href]').forEach((anchor) => {
      const key = gameKeyFromPath(anchor.getAttribute('href') || '');
      if (!key || !items[key]) return;
      const container = anchor.closest('.solo407-hub-card,.case407-catalog,.coop-hero,.ml-case-card,article,section');
      if (!container || container.dataset.mlProofDone === key) return;
      const proof = makeProof(items[key]);
      if (!proof) return;
      container.dataset.mlProofDone = key;
      anchor.insertAdjacentElement('beforebegin', proof);
    });
  };

  fetch(ENDPOINT, { cache: 'no-store', credentials: 'omit' })
    .then((response) => response.ok ? response.json() : null)
    .then((payload) => { if (payload?.ok) render(payload.items || {}); })
    .catch(() => {});
})();
