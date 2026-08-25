(() => {
  'use strict';

  const currentScript = document.currentScript;
  const root = document.querySelector('[data-ktv-root]');
  if (!root || !currentScript?.src || !window.KtoVretWeb?.case?.id) return;

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/review-discount';
  const REVIEWER_KEY = 'mysterylogic:reviewer-token:v1';
  const REWARD_KEY = 'mysterylogic:last-aria:review-reward:v1';
  const ariaUrl = new URL('../../detektivnye-igry-dlya-dvoih/poslednyaya-ariya/', currentScript.src).href;
  let rating = 0;
  let difficulty = '';
  let busy = false;

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const track = (event, params = {}) => {
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event, page_type: 'short_case_review', ...params }); } catch {}
    try { if (typeof window.ym === 'function') window.ym(111664459, 'reachGoal', event, { page_type: 'short_case_review', ...params }); } catch {}
  };

  const makeToken = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let binary = '';
    for (const value of bytes) binary += String.fromCharCode(value);
    return `ml_review_${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')}`;
  };

  const reviewerToken = () => {
    let token = localStorage.getItem(REVIEWER_KEY) || '';
    if (!/^ml_review_[A-Za-z0-9_-]{32,160}$/.test(token)) {
      token = makeToken();
      localStorage.setItem(REVIEWER_KEY, token);
    }
    return token;
  };

  const saveReward = (reward) => {
    localStorage.setItem(REWARD_KEY, JSON.stringify({
      code: String(reward.code || ''),
      discountRub: Number(reward.discountRub || 50),
      priceRub: Number(reward.priceRub || 249),
      expiresAt: String(reward.expiresAt || ''),
      productId: 'last_aria',
    }));
  };

  const injectStyles = () => {
    if (document.querySelector('[data-ktv-review-styles]')) return;
    const style = document.createElement('style');
    style.dataset.ktvReviewStyles = 'true';
    style.textContent = `
      .ktv-review-card{margin:28px 0 4px;padding:24px;border:1px solid rgba(196,164,103,.34);border-radius:22px;background:linear-gradient(145deg,rgba(16,31,48,.96),rgba(8,19,31,.98));box-shadow:0 22px 60px rgba(0,0,0,.25);text-align:left}
      .ktv-review-card *{box-sizing:border-box}.ktv-review-kicker{margin:0 0 8px;color:#c9aa71;font-size:.76rem;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.ktv-review-card h3{margin:0;color:#fff;font-size:clamp(1.35rem,3vw,1.85rem);line-height:1.12}.ktv-review-lead{max-width:700px;margin:10px 0 20px;color:rgba(230,238,246,.78);line-height:1.55}.ktv-review-offer{display:flex;gap:12px;align-items:center;margin:0 0 22px;padding:14px 16px;border:1px solid rgba(201,170,113,.28);border-radius:16px;background:rgba(201,170,113,.08);color:#f1dfba}.ktv-review-offer strong{font-size:1.1rem;color:#fff}.ktv-review-field{display:grid;gap:8px;margin-top:16px}.ktv-review-field>span{color:rgba(239,245,250,.88);font-size:.88rem;font-weight:800}.ktv-review-field textarea,.ktv-review-field input{width:100%;border:1px solid rgba(173,191,207,.22);border-radius:14px;background:rgba(4,12,21,.66);color:#f8fbfd;padding:13px 14px;font:inherit;outline:none}.ktv-review-field textarea{min-height:104px;resize:vertical}.ktv-review-field textarea:focus,.ktv-review-field input:focus{border-color:rgba(201,170,113,.7);box-shadow:0 0 0 3px rgba(201,170,113,.1)}.ktv-review-stars{display:flex;gap:7px;flex-wrap:wrap}.ktv-review-star{width:46px;height:44px;border:1px solid rgba(201,170,113,.3);border-radius:12px;background:rgba(201,170,113,.06);color:#c9aa71;font-size:1.55rem;cursor:pointer}.ktv-review-star.is-active{background:rgba(201,170,113,.2);border-color:#c9aa71;color:#ffe2a9}.ktv-review-difficulty{display:flex;gap:8px;flex-wrap:wrap}.ktv-review-pill{border:1px solid rgba(173,191,207,.22);border-radius:999px;background:rgba(255,255,255,.035);color:rgba(239,245,250,.78);padding:9px 13px;cursor:pointer;font:inherit}.ktv-review-pill.is-active{border-color:rgba(201,170,113,.66);background:rgba(201,170,113,.13);color:#fff}.ktv-review-check{display:flex;gap:10px;align-items:flex-start;margin:18px 0 0;color:rgba(230,238,246,.72);font-size:.84rem;line-height:1.45}.ktv-review-check input{margin-top:3px}.ktv-review-note{margin:9px 0 0;color:rgba(181,197,211,.62);font-size:.78rem;line-height:1.45}.ktv-review-submit{margin-top:20px;min-height:48px;border:0;border-radius:14px;background:#c9aa71;color:#102030;padding:12px 18px;font:inherit;font-weight:950;cursor:pointer}.ktv-review-submit:disabled{opacity:.45;cursor:not-allowed}.ktv-review-status{margin:13px 0 0;color:#efc0ad;font-size:.86rem}.ktv-review-success{display:grid;gap:15px}.ktv-review-code{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:15px 16px;border:1px dashed rgba(201,170,113,.55);border-radius:16px;background:rgba(201,170,113,.08)}.ktv-review-code code{color:#fff;font-size:1.02rem;font-weight:900;letter-spacing:.06em}.ktv-review-aria{display:inline-flex;width:max-content;max-width:100%;align-items:center;justify-content:center;border-radius:14px;background:#c9aa71;color:#102030;padding:13px 17px;text-decoration:none;font-weight:950}.ktv-review-expiry{color:rgba(230,238,246,.64);font-size:.8rem}.ktv-review-copy{border:1px solid rgba(201,170,113,.35);border-radius:11px;background:transparent;color:#f4dfb8;padding:8px 10px;cursor:pointer}.ktv-review-quiet{margin:0;color:rgba(230,238,246,.72);line-height:1.5}@media(max-width:640px){.ktv-review-card{padding:20px 16px}.ktv-review-star{width:43px;height:42px}}
    `;
    document.head.appendChild(style);
  };

  const formatExpiry = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(date);
  };

  const renderSuccess = (card, reward) => {
    const expiry = formatExpiry(reward.expiresAt);
    card.innerHTML = `
      <div class="ktv-review-success">
        <div><p class="ktv-review-kicker">Спасибо за обратную связь</p><h3>Скидка 50 ₽ уже у вас</h3></div>
        <p class="ktv-review-quiet">Оценка не влияет на подарок: нам важен честный отзыв. На «Последнюю арию» теперь действует цена <strong>249 ₽ вместо 299 ₽</strong>.</p>
        <div class="ktv-review-code"><code>${esc(reward.code)}</code><button class="ktv-review-copy" type="button" data-review-copy>Скопировать</button></div>
        ${expiry ? `<div class="ktv-review-expiry">Используйте скидку до ${esc(expiry)} включительно.</div>` : ''}
        <a class="ktv-review-aria" href="${esc(ariaUrl)}">Открыть «Последнюю арию» — 249 ₽</a>
      </div>`;
    card.querySelector('[data-review-copy]')?.addEventListener('click', async (event) => {
      try {
        await navigator.clipboard.writeText(String(reward.code || ''));
        event.currentTarget.textContent = 'Скопировано';
      } catch {}
    });
  };

  const renderSavedWithoutReward = (card, reason) => {
    card.innerHTML = `
      <p class="ktv-review-kicker">Спасибо за обратную связь</p>
      <h3>Отзыв сохранён</h3>
      <p class="ktv-review-quiet">${reason === 'expired' ? 'Ранее вы уже получали скидку за отзыв, но срок её действия закончился.' : 'Ранее вы уже использовали скидку за отзыв. Новый отзыв всё равно поможет нам улучшать следующие дела.'}</p>`;
  };

  const mount = () => {
    const result = root.querySelector('.ktv-result');
    if (!result || result.querySelector('[data-ktv-review-card]')) return;
    injectStyles();

    const card = document.createElement('section');
    card.className = 'ktv-review-card';
    card.dataset.ktvReviewCard = 'true';
    card.innerHTML = `
      <p class="ktv-review-kicker">После расследования</p>
      <h3>Помогите нам делать следующие дела лучше</h3>
      <p class="ktv-review-lead">Поставьте оценку и напишите пару слов — что сработало, а что стоило бы улучшить. За <strong>любой честный отзыв</strong>, независимо от оценки, подарим 50 ₽ на большое расследование.</p>
      <div class="ktv-review-offer"><span aria-hidden="true">✦</span><div><strong>«Последняя ария» — 249 ₽ вместо 299 ₽</strong><br><small>Одноразовая скидка действует 7 дней.</small></div></div>
      <div class="ktv-review-field"><span>Ваша оценка</span><div class="ktv-review-stars" role="group" aria-label="Оценка дела">${[1,2,3,4,5].map((value) => `<button class="ktv-review-star" type="button" data-review-rating="${value}" aria-label="${value} из 5" aria-pressed="false">★</button>`).join('')}</div></div>
      <label class="ktv-review-field"><span>Короткий отзыв</span><textarea data-review-comment maxlength="2000" placeholder="Например: где было интересно, что оказалось слишком лёгким или что мешало разобраться..."></textarea></label>
      <p class="ktv-review-note">Для скидки достаточно содержательного отзыва от 20 символов. Не указывайте телефон, e-mail и другие личные данные.</p>
      <div class="ktv-review-field"><span>Сложность</span><div class="ktv-review-difficulty">${[['too_easy','Слишком легко'],['just_right','В самый раз'],['too_hard','Слишком сложно']].map(([value,label]) => `<button class="ktv-review-pill" type="button" data-review-difficulty="${value}" aria-pressed="false">${label}</button>`).join('')}</div></div>
      <label class="ktv-review-field"><span>Имя или псевдоним <small>(необязательно)</small></span><input data-review-name maxlength="80" autocomplete="nickname" placeholder="Например: Алексей"></label>
      <label class="ktv-review-check"><input type="checkbox" data-review-publish><span>Разрешаю после модерации опубликовать этот отзыв и указанный псевдоним на Mystery Logic. Это не влияет на получение скидки.</span></label>
      <button class="ktv-review-submit" type="button" data-review-submit disabled>Отправить отзыв и получить 50 ₽</button>
      <p class="ktv-review-status" data-review-status role="status" aria-live="polite"></p>`;
    result.appendChild(card);

    const comment = card.querySelector('[data-review-comment]');
    const submit = card.querySelector('[data-review-submit]');
    const status = card.querySelector('[data-review-status]');
    const sync = () => { submit.disabled = busy || rating < 1 || String(comment?.value || '').trim().length < 20; };

    card.querySelectorAll('[data-review-rating]').forEach((button) => {
      button.addEventListener('click', () => {
        rating = Number(button.dataset.reviewRating || 0);
        card.querySelectorAll('[data-review-rating]').forEach((node) => {
          const active = Number(node.dataset.reviewRating || 0) <= rating;
          node.classList.toggle('is-active', active);
          node.setAttribute('aria-pressed', String(Number(node.dataset.reviewRating || 0) === rating));
        });
        sync();
      });
    });

    card.querySelectorAll('[data-review-difficulty]').forEach((button) => {
      button.addEventListener('click', () => {
        difficulty = button.dataset.reviewDifficulty === difficulty ? '' : String(button.dataset.reviewDifficulty || '');
        card.querySelectorAll('[data-review-difficulty]').forEach((node) => {
          const active = node.dataset.reviewDifficulty === difficulty;
          node.classList.toggle('is-active', active);
          node.setAttribute('aria-pressed', String(active));
        });
      });
    });
    comment?.addEventListener('input', sync);

    submit.addEventListener('click', async () => {
      if (busy || submit.disabled) return;
      busy = true;
      sync();
      status.textContent = 'Сохраняем отзыв…';
      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            reviewerToken: reviewerToken(),
            caseId: String(window.KtoVretWeb.case.id || ''),
            rating,
            comment: String(comment?.value || '').trim(),
            difficulty,
            displayName: String(card.querySelector('[data-review-name]')?.value || '').trim(),
            publicationConsent: Boolean(card.querySelector('[data-review-publish]')?.checked),
          }),
          cache: 'no-store',
          credentials: 'omit',
        });
        let body = {};
        try { body = await response.json(); } catch {}
        if (!response.ok) throw new Error(body.error || `http_${response.status}`);
        track('case_review_submitted', { case_id: String(window.KtoVretWeb.case.id || ''), rating, difficulty: difficulty || 'none' });
        if (body.rewardEligible && body.reward?.code) {
          saveReward(body.reward);
          track('review_discount_issued', { case_id: String(window.KtoVretWeb.case.id || ''), discount_rub: 50, product_id: 'last_aria' });
          renderSuccess(card, body.reward);
        } else {
          renderSavedWithoutReward(card, body.rewardReason || 'already_used');
        }
      } catch (error) {
        const messages = {
          review_too_short: 'Добавьте ещё немного текста — для скидки нужно минимум 20 символов.',
          invalid_rating: 'Выберите оценку от 1 до 5.',
          review_save_failed: 'Не удалось сохранить отзыв. Попробуйте ещё раз.',
        };
        status.textContent = messages[error.message] || 'Не удалось отправить отзыв. Попробуйте ещё раз.';
        busy = false;
        sync();
      }
    });
    sync();
  };

  const observer = new MutationObserver(mount);
  observer.observe(root, { childList: true, subtree: true });
  mount();
})();
