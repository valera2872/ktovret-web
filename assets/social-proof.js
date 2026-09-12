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
    try {
      return new URL(href, location.href).pathname.replace(/\/$/, '') + '/';
    } catch {
      return '';
    }
  };

  const gameKeyFromPath = (href = '') => BIG_CASES[cleanPath(href)] || '';

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

  const playerText = (n) => {
    const a = Math.abs(n) % 100, b = Math.abs(n) % 10;
    if (a >= 11 && a <= 14) return `${n} игроков прошли`;
    if (b === 1) return `${n} игрок прошёл`;
    if (b >= 2 && b <= 4) return `${n} игрока прошли`;
    return `${n} игроков прошли`;
  };

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const addStyles = () => {
    if (document.querySelector('[data-ml-social-proof-styles]')) return;
    const style = document.createElement('style');
    style.dataset.mlSocialProofStyles = 'true';
    style.textContent = `
      .ml-social-proof{display:flex;flex-wrap:wrap;gap:7px 10px;align-items:center;margin:10px 0 12px;color:#b9c7d0;font-size:.76rem;font-weight:800;line-height:1.35}
      .ml-social-proof .star{color:#e7c98f;font-weight:950;letter-spacing:.01em}
      .ml-social-proof .empty-rating{color:#91a0ad;font-weight:800}
      .ml-social-proof .dot{opacity:.4}
      .ml-social-proof.compact{font-size:.72rem;margin:8px 0 10px}
      .coop-entry-choice .ml-social-proof{margin:2px 0 1px;font-size:.66rem;gap:5px 7px;color:#b9ad9d}
      .coop-entry-choice .ml-social-proof .empty-rating{color:#9c948a}
      .ml-social-proof.current{width:max-content;max-width:100%;padding:8px 11px;border:1px solid rgba(231,201,143,.2);border-radius:999px;background:rgba(7,17,29,.48);backdrop-filter:blur(8px);font-size:.78rem;margin:10px 0 16px}
      .ml-public-reviews{margin:34px auto 24px;padding:24px;border:1px solid rgba(231,201,143,.18);border-radius:24px;background:linear-gradient(145deg,rgba(17,36,54,.88),rgba(7,18,30,.94));box-shadow:0 18px 48px rgba(0,0,0,.18)}
      .ml-public-reviews-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px 18px;align-items:end;margin-bottom:16px}
      .ml-public-reviews h2{margin:0;color:#f4f7f9;font-size:clamp(1.25rem,3vw,1.7rem)}
      .ml-public-reviews-summary{color:#e7c98f;font-weight:900;font-size:.9rem}
      .ml-public-review-list{display:grid;gap:12px}
      .ml-public-review{padding:15px 16px;border:1px solid rgba(255,255,255,.08);border-radius:17px;background:rgba(255,255,255,.035)}
      .ml-public-review-top{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin-bottom:7px}
      .ml-public-review-stars{color:#e7c98f;font-weight:950}
      .ml-public-review-name{color:#d9e2e8;font-weight:850}
      .ml-public-review p{margin:0;color:#c2ced6;line-height:1.55}
      .ml-public-review small{display:block;margin-top:8px;color:#7f919e}
    `;
    document.head.appendChild(style);
  };

  const makeProof = (item = {}, { compact = false, current = false, showEmptyRating = false } = {}) => {
    const ratings = Number(item?.ratingCount ?? item?.reviewCount ?? 0);
    const reviews = Number(item?.reviewCount || 0);
    const players = Number(item?.completedPlayers || 0);
    const rating = Number(item?.rating || 0);
    const chunks = [];

    if (ratings > 0 && rating >= 1 && rating <= 5) {
      chunks.push(`<span class="star">★ ${rating.toFixed(1)}</span>`);
      chunks.push(`<span>${ratings} ${ratingWord(ratings)}</span>`);
    } else if (showEmptyRating) {
      chunks.push('<span class="empty-rating">☆ Оценок пока нет</span>');
    }

    if (players > 0) chunks.push(`<span>${playerText(players)}</span>`);
    if (reviews > 0 && reviews !== ratings) chunks.push(`<span>${reviews} ${reviewWord(reviews)}</span>`);
    if (!chunks.length) return null;

    const node = document.createElement('div');
    node.className = `ml-social-proof${compact ? ' compact' : ''}${current ? ' current' : ''}`;
    node.dataset.mlSocialProof = 'true';
    node.title = 'Оценки — от игроков после прохождения. Число игроков — подтверждённые завершения.';
    node.innerHTML = chunks.join('<span class="dot">•</span>');
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
    const item = items[key] || {};
    const proof = makeProof(item, { current: true, showEmptyRating: true });
    if (!proof) return true;
    proof.dataset.mlCurrentProof = key;

    const title = document.querySelector(
      '.ktv-cover-copy h1,.ktv-hero-copy h1,.coop-hero h1,.solo407-hero h1,[data-case-hero] h1,main h1'
    );
    if (!title) return false;
    title.insertAdjacentElement('afterend', proof);
    return true;
  };

  const renderReviews = (items) => {
    const key = currentGameKey();
    if (!key || document.querySelector('[data-ml-public-reviews]')) return;
    const item = items[key] || {};
    const reviews = Array.isArray(item.reviews) ? item.reviews.slice(0, 3) : [];
    if (!reviews.length) return;

    const section = document.createElement('section');
    section.className = 'ml-public-reviews';
    section.dataset.mlPublicReviews = key;
    const rating = Number(item.rating || 0);
    const ratingCount = Number(item.ratingCount || 0);
    section.innerHTML = `
      <div class="ml-public-reviews-head">
        <h2>Отзывы игроков</h2>
        <div class="ml-public-reviews-summary">${ratingCount > 0 && rating > 0 ? `★ ${rating.toFixed(1)} · ${ratingCount} ${ratingWord(ratingCount)}` : ''}</div>
      </div>
      <div class="ml-public-review-list">
        ${reviews.map((review) => {
          const stars = Math.max(1, Math.min(5, Number(review.rating || 0)));
          const difficulty = review.difficulty === 'too_easy' ? 'Слишком легко'
            : review.difficulty === 'too_hard' ? 'Слишком сложно'
              : review.difficulty === 'just_right' ? 'Сложность в самый раз' : '';
          return `<article class="ml-public-review"><div class="ml-public-review-top"><span class="ml-public-review-stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span><span class="ml-public-review-name">${escapeHtml(review.displayName || 'Игрок Mystery Logic')}</span></div><p>${escapeHtml(review.comment || '')}</p>${difficulty ? `<small>${escapeHtml(difficulty)}</small>` : ''}</article>`;
        }).join('')}
      </div>`;

    const main = document.querySelector('main');
    const footer = document.querySelector('.ml-case-footer,footer');
    if (footer?.parentNode) footer.parentNode.insertBefore(section, footer);
    else if (main) main.appendChild(section);
    else document.body.appendChild(section);
  };

  const render = (items) => {
    addStyles();

    document.querySelectorAll('[data-case-id]').forEach((card) => {
      if (card.matches('[data-ktv-root]') || card.querySelector('[data-ml-social-proof]')) return;
      const id = String(card.dataset.caseId || '').trim();
      if (!id) return;
      const item = items[`case:${id}`] || {};
      const proof = makeProof(item, { compact: true, showEmptyRating: Number(item.completedPlayers || 0) > 0 });
      if (!proof) return;
      const action = card.querySelector('[data-case-open],a[href]');
      if (action) action.insertAdjacentElement('beforebegin', proof);
      else card.appendChild(proof);
    });

    document.querySelectorAll('a[href]').forEach((anchor) => {
      const key = gameKeyFromPath(anchor.getAttribute('href') || '');
      if (!key) return;
      const item = items[key] || {};

      // The two-player format cards are a CSS grid. A proof node inserted as a sibling
      // becomes an extra grid item and pushes the cards into a diagonal layout.
      // Keep the proof inside its own card so both format cards stay aligned.
      const coopChoice = anchor.closest('.coop-entry-choice');
      if (coopChoice) {
        if (coopChoice.dataset.mlProofDone === key) return;
        const proof = makeProof(item, { compact: true, showEmptyRating: Number(item.completedPlayers || 0) > 0 });
        if (!proof) return;
        coopChoice.dataset.mlProofDone = key;
        const action = coopChoice.querySelector('b');
        if (action) action.insertAdjacentElement('beforebegin', proof);
        else coopChoice.appendChild(proof);
        return;
      }

      const container = anchor.closest('.solo407-hub-card,.case407-catalog,.coop-hero,.ml-case-card,article,section');
      if (!container || container.dataset.mlProofDone === key) return;
      const proof = makeProof(item, { showEmptyRating: Number(item.completedPlayers || 0) > 0 });
      if (!proof) return;
      container.dataset.mlProofDone = key;
      anchor.insertAdjacentElement('beforebegin', proof);
    });

    if (!placeCurrentProof(items)) {
      const observer = new MutationObserver(() => {
        if (placeCurrentProof(items)) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 8000);
    }
    renderReviews(items);
  };

  fetch(ENDPOINT, { cache: 'no-store', credentials: 'omit' })
    .then((response) => response.ok ? response.json() : null)
    .then((payload) => { if (payload?.ok) render(payload.items || {}); })
    .catch(() => {});
})();
