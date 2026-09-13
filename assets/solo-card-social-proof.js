(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/social-proof';

  const ratingWord = (n) => {
    const a = Math.abs(n) % 100, b = Math.abs(n) % 10;
    if (a >= 11 && a <= 14) return 'оценок';
    if (b === 1) return 'оценка';
    if (b >= 2 && b <= 4) return 'оценки';
    return 'оценок';
  };

  const reviewWord = (n) => {
    const a = Math.abs(n) % 100, b = Math.abs(n) % 10;
    if (a >= 11 && a <= 14) return 'отзывов';
    if (b === 1) return 'отзыв';
    if (b >= 2 && b <= 4) return 'отзыва';
    return 'отзывов';
  };

  const addStyles = () => {
    if (document.querySelector('[data-solo-card-proof-styles]')) return;
    const style = document.createElement('style');
    style.dataset.soloCardProofStyles = 'true';
    style.textContent = `
      .solo-card-proof{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin:12px 0 11px;padding-top:11px;border-top:1px solid rgba(231,201,143,.13);font:800 11px/1.35 Inter,ui-sans-serif,system-ui,sans-serif;color:#aebbc3}
      .solo-card-proof__rating{color:#e7c98f;letter-spacing:.01em}
      .solo-card-proof__empty{color:#8f9ca5}
      .solo-card-proof__dot{opacity:.38}
      .sm-hub-card .solo-card-proof{margin-top:auto}
      .sp-card .solo-card-proof{margin-top:auto}
    `;
    document.head.appendChild(style);
  };

  const renderProof = (card, key, item = {}) => {
    if (!card || card.querySelector('[data-solo-card-proof]')) return;
    const rating = Number(item.rating || 0);
    const ratingCount = Number(item.ratingCount || 0);
    const reviewCount = Number(item.reviewCount || 0);

    const node = document.createElement('div');
    node.className = 'solo-card-proof';
    node.dataset.soloCardProof = key;
    node.title = 'Рейтинг — оценки игроков после прохождения. Текстовые отзывы публикуются после модерации.';

    const parts = [];
    if (ratingCount > 0 && rating >= 1 && rating <= 5) {
      parts.push(`<span class="solo-card-proof__rating">★ ${rating.toFixed(1)}</span>`);
      parts.push(`<span>${ratingCount} ${ratingWord(ratingCount)}</span>`);
    } else {
      parts.push('<span class="solo-card-proof__empty">☆ Пока нет оценок</span>');
    }
    parts.push(`<span>${reviewCount} ${reviewWord(reviewCount)}</span>`);
    node.innerHTML = parts.join('<span class="solo-card-proof__dot">•</span>');

    const action = card.querySelector('.sm-hub-card__go') || card.querySelector(':scope > strong:last-child');
    if (action) action.insertAdjacentElement('beforebegin', node);
    else card.appendChild(node);
  };

  const render = (items) => {
    addStyles();

    document.querySelectorAll('.sm-hub-card[data-mini-card]').forEach((card) => {
      const id = String(card.dataset.miniCard || '').trim();
      if (!id) return;
      const key = `case:${id}`;
      renderProof(card, key, items[key] || {});
    });

    document.querySelectorAll('.sp-card[data-solo-paid-case]').forEach((card) => {
      const id = String(card.dataset.soloPaidCase || '').trim();
      if (!id) return;
      const key = `case:${id}`;
      renderProof(card, key, items[key] || {});
    });
  };

  fetch(ENDPOINT, { cache: 'no-store', credentials: 'omit' })
    .then((response) => response.ok ? response.json() : null)
    .then((payload) => { if (payload?.ok) render(payload.items || {}); })
    .catch(() => {});
})();
