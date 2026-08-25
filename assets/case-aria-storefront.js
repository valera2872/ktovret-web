(() => {
  'use strict';

  const PRODUCT_ID = 'last_aria';
  const PRICE_RUB = 299;
  const REVIEW_DISCOUNT_RUB = 50;
  const REVIEW_PRICE_RUB = 249;
  const CHECKOUT_ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/create-checkout-last-aria';
  const STATUS_ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/payment-status-last-aria';
  const TOKEN_KEY = 'mysterylogic:last-aria:access-token';
  const ORDER_KEY = 'mysterylogic:last-aria:last-order-id';
  const REQUEST_KEY = 'mysterylogic:last-aria:checkout-request-id';
  const REVIEW_REWARD_KEY = 'mysterylogic:last-aria:review-reward:v1';
  const ROOM_CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
  const REVIEW_CODE_RE = /^ML-[A-HJ-NP-Z2-9]{4}(?:-[A-HJ-NP-Z2-9]{4}){3}$/;
  const root = document.querySelector('[data-casearia-app]');
  if (!root) return;

  let booting = false;
  let busy = false;

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const track = (event, params = {}) => {
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event, page_type: 'last_aria_storefront', ...params }); } catch {}
    try { if (typeof window.ym === 'function') window.ym(111664459, 'reachGoal', event, { page_type: 'last_aria_storefront', ...params }); } catch {}
  };

  const injectDiscountStyles = () => {
    if (document.querySelector('[data-aria-review-discount-styles]')) return;
    const style = document.createElement('style');
    style.dataset.ariaReviewDiscountStyles = 'true';
    style.textContent = `
      .casearia-paywall-price.is-discounted{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}.casearia-paywall-price.is-discounted s{color:rgba(224,231,238,.45);font-size:1rem;text-decoration-thickness:1px}.casearia-paywall-price.is-discounted strong{color:#f4d99f}.casearia-review-discount{margin:14px 0 0;padding:12px 14px;border:1px solid rgba(214,181,116,.35);border-radius:14px;background:rgba(214,181,116,.09);color:rgba(245,232,204,.9);font-size:.86rem;line-height:1.45}.casearia-review-discount b{color:#fff}.casearia-review-discount code{color:#f4d99f;font-weight:800;letter-spacing:.04em}`;
    document.head.appendChild(style);
  };
  injectDiscountStyles();

  const activeReviewReward = () => {
    let value = null;
    try { value = JSON.parse(localStorage.getItem(REVIEW_REWARD_KEY) || 'null'); } catch {}
    const code = String(value?.code || '').trim().toUpperCase();
    const expiresAt = String(value?.expiresAt || '');
    if (!REVIEW_CODE_RE.test(code) || !expiresAt || new Date(expiresAt).getTime() <= Date.now()) {
      if (value) localStorage.removeItem(REVIEW_REWARD_KEY);
      return null;
    }
    return { code, expiresAt };
  };

  const randomToken = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let binary = '';
    for (const value of bytes) binary += String.fromCharCode(value);
    return `ml_aria_${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')}`;
  };

  const ensureToken = () => {
    let token = localStorage.getItem(TOKEN_KEY) || '';
    if (!/^ml_[a-z0-9]+_[A-Za-z0-9_-]{32,160}$/.test(token)) {
      token = randomToken();
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  };

  const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = [...document.scripts].find((item) => item.src === new URL(src, location.href).href);
    if (existing) return resolve();
    const node = document.createElement('script');
    node.src = src;
    node.onload = resolve;
    node.onerror = reject;
    document.body.appendChild(node);
  });

  const bootGame = async ({ token = '' } = {}) => {
    if (booting) return;
    booting = true;
    if (token) window.MLLastAriaAccessToken = token;
    root.innerHTML = '<section class="casearia-paywall-status"><span class="casearia-paywall-spinner"></span><strong>Открываем материалы дела…</strong></section>';
    try {
      const version = '1.3.0';
      await loadScript(`../../assets/case-aria-data.js?v=${version}`);
      await loadScript(`../../assets/case-aria-fairplay-v2.js?v=${version}`);
      await loadScript(`../../assets/case-aria-investigator-v16.js?v=${version}`);
      await loadScript(`../../assets/case-aria.js?v=${version}`);
      await loadScript(`../../assets/case-aria-materials-v2.js?v=${version}`);
    } catch {
      booting = false;
      renderPaywall('Не удалось открыть дело. Обновите страницу и попробуйте ещё раз.');
    }
  };

  const paymentStatus = async (token, orderId) => {
    const response = await fetch(STATUS_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId }),
      cache: 'no-store',
      credentials: 'omit',
    });
    let body = {};
    try { body = await response.json(); } catch {}
    if (!response.ok) throw new Error(body.error || `http_${response.status}`);
    return body;
  };

  const setNote = (text, kind = '') => {
    const node = root.querySelector('[data-aria-payment-note]');
    if (!node) return;
    node.textContent = text;
    node.dataset.kind = kind;
  };

  const renderPaywall = (message = '') => {
    booting = false;
    const reward = activeReviewReward();
    const checkoutPrice = reward ? REVIEW_PRICE_RUB : PRICE_RUB;
    root.innerHTML = `
      <section class="casearia-cover casearia-paywall-cover">
        <div class="casearia-cover-copy">
          <p class="casearia-eyebrow">Премиальное дело ML-AR17 · 2 игрока · 55–75 минут</p>
          <h1>Последняя <em>ария</em></h1>
          <p>Генеральная репетиция. Настоящая рана от бутафорского кинжала. Пятьдесят две секунды темноты. И оригинальная партитура 1908 года, исчезнувшая из закрытого архива.</p>
          <div class="casearia-paywall-facts"><span>18 материалов</span><span>2 разные роли</span><span>3 этапа</span><span>6 обменов уликами</span></div>
        </div>
        <div class="casearia-stage-visual" aria-hidden="true"><span class="casearia-curtain left"></span><span class="casearia-curtain right"></span><div class="casearia-score"><small>ORIGINAL SCORE · 1908</small><strong>OPUS XVII</strong><i></i><i></i><i></i><b>21:49</b></div><div class="casearia-cue">BLACKOUT<br><strong>00:52</strong></div></div>
      </section>
      <section class="casearia-paywall-card">
        <div class="casearia-paywall-copy">
          <p class="casearia-eyebrow">Полный доступ</p>
          <h2>Одно дело — одна покупка</h2>
          <p>Покупает только тот, кто создаёт комнату. Второй игрок входит по приглашению бесплатно со своего устройства.</p>
          ${reward
            ? `<div class="casearia-paywall-price is-discounted"><s>${PRICE_RUB} ₽</s><strong>${REVIEW_PRICE_RUB} ₽</strong><span>за всё расследование</span></div><div class="casearia-review-discount"><b>Скидка за ваш отзыв: −${REVIEW_DISCOUNT_RUB} ₽</b><br>Код <code>${esc(reward.code)}</code> будет проверен сервером при создании платежа.</div>`
            : `<div class="casearia-paywall-price"><strong>${PRICE_RUB} ₽</strong><span>за всё расследование</span></div>`}
        </div>
        <div class="casearia-paywall-checkout">
          <label class="casearia-field"><span>E-mail для электронного чека</span><input type="email" data-aria-email autocomplete="email" placeholder="name@example.com"></label>
          <label class="casearia-paywall-check"><input type="checkbox" data-aria-offer> <span>Принимаю <a href="../../offer/" target="_blank" rel="noopener">Публичную оферту</a></span></label>
          <label class="casearia-paywall-check"><input type="checkbox" data-aria-privacy> <span>Ознакомился с <a href="../../privacy/" target="_blank" rel="noopener">Политикой конфиденциальности</a></span></label>
          <button class="casearia-button is-primary casearia-paywall-buy" data-aria-buy>Купить дело — ${checkoutPrice} ₽</button>
          <p class="casearia-paywall-note" data-aria-payment-note data-kind="${message ? 'error' : ''}">${esc(message || 'Оплата проходит на защищённой странице T‑Bank. После оплаты дело откроется автоматически.')}</p>
        </div>
      </section>
      <section class="casearia-paywall-invite">
        <div><p class="casearia-eyebrow">Вас пригласили?</p><h2>Второму игроку платить не нужно</h2><p>Откройте ссылку, которую прислал создатель комнаты. В ней уже будет код расследования.</p></div>
      </section>`;

    const buy = root.querySelector('[data-aria-buy]');
    const email = root.querySelector('[data-aria-email]');
    const offer = root.querySelector('[data-aria-offer]');
    const privacy = root.querySelector('[data-aria-privacy]');
    const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
    const sync = () => {
      if (!buy) return;
      buy.disabled = busy || !validEmail(String(email?.value || '').trim()) || !offer?.checked || !privacy?.checked;
    };
    email?.addEventListener('input', sync);
    offer?.addEventListener('change', sync);
    privacy?.addEventListener('change', sync);
    buy?.addEventListener('click', async () => {
      if (busy) return;
      const customerEmail = String(email?.value || '').trim().toLowerCase();
      if (!validEmail(customerEmail) || !offer?.checked || !privacy?.checked) return sync();
      busy = true;
      sync();
      setNote('Создаём защищённый платёж…');
      const token = ensureToken();
      const requestId = crypto.randomUUID();
      sessionStorage.setItem(REQUEST_KEY, requestId);
      try {
        const response = await fetch(CHECKOUT_ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            accessToken: token,
            requestId,
            returnUrl: `${location.origin}${location.pathname}`,
            email: customerEmail,
            language: 'ru',
            offerAccepted: true,
            privacyAcknowledged: true,
            reviewDiscountCode: reward?.code || '',
          }),
          cache: 'no-store',
          credentials: 'omit',
        });
        let body = {};
        try { body = await response.json(); } catch {}
        if (!response.ok) throw new Error(body.error || `http_${response.status}`);
        if (!body.orderId || !body.confirmationUrl) throw new Error('invalid_checkout_response');
        localStorage.setItem(ORDER_KEY, body.orderId);
        const chargedPrice = Number(body.amountRub || checkoutPrice);
        track('last_aria_checkout_created', { price: chargedPrice, discount_rub: Number(body.discountRub || 0), product_id: PRODUCT_ID, order_id: body.orderId });
        setNote('Переходим на защищённую страницу T‑Bank…', 'ok');
        location.assign(body.confirmationUrl);
      } catch (error) {
        const discountFailures = new Set(['review_discount_invalid', 'review_discount_used', 'review_discount_expired', 'review_discount_already_used', 'review_discount_in_use']);
        if (discountFailures.has(error.message)) {
          localStorage.removeItem(REVIEW_REWARD_KEY);
          busy = false;
          renderPaywall('Скидка уже использована, истекла или сейчас привязана к другому платежу. Цена возвращена к 299 ₽.');
          return;
        }
        const messages = {
          payment_service_not_configured: 'Оплата временно недоступна.',
          payment_create_failed: 'T‑Bank не создал платёж. Попробуйте ещё раз.',
          invalid_email: 'Проверьте e-mail.',
          request_amount_conflict: 'Не удалось применить скидку к этому запросу. Попробуйте ещё раз.',
          request_discount_conflict: 'Не удалось применить скидку к этому запросу. Попробуйте ещё раз.',
        };
        setNote(messages[error.message] || 'Не удалось начать оплату. Попробуйте ещё раз.', 'error');
        busy = false;
        sync();
      }
    });
    sync();
  };

  const restore = async () => {
    const token = localStorage.getItem(TOKEN_KEY) || '';
    const orderId = localStorage.getItem(ORDER_KEY) || '';
    if (!token || !orderId) return false;
    try {
      const result = await paymentStatus(token, orderId);
      if (result.status === 'paid' && result.entitled) {
        if (Number(result.discountRub || 0) > 0) localStorage.removeItem(REVIEW_REWARD_KEY);
        track('last_aria_access_restored', { product_id: PRODUCT_ID, price: Number(result.amountRub || PRICE_RUB) });
        await bootGame({ token });
        return true;
      }
      if (result.status === 'refunded') renderPaywall('Платёж возвращён. Доступ к делу закрыт.');
    } catch {}
    return false;
  };

  const reconcileReturn = async () => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment_return') !== '1') return false;
    const token = localStorage.getItem(TOKEN_KEY) || '';
    const orderId = params.get('order_id') || localStorage.getItem(ORDER_KEY) || '';
    sessionStorage.removeItem(REQUEST_KEY);
    if (!token || !orderId) {
      renderPaywall('Не удалось найти данные покупки в этом браузере. Если деньги списались, напишите в поддержку.');
      return true;
    }
    renderPaywall();
    setNote('Проверяем оплату…');
    for (const delay of [0, 900, 1600, 2600, 4200]) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        const result = await paymentStatus(token, orderId);
        if (result.status === 'paid' && result.entitled) {
          localStorage.setItem(ORDER_KEY, orderId);
          if (Number(result.discountRub || 0) > 0) localStorage.removeItem(REVIEW_REWARD_KEY);
          track('last_aria_purchase_completed', { price: Number(result.amountRub || PRICE_RUB), discount_rub: Number(result.discountRub || 0), product_id: PRODUCT_ID, order_id: orderId });
          try { history.replaceState({}, '', location.pathname); } catch {}
          await bootGame({ token });
          return true;
        }
        if (result.status === 'canceled') {
          renderPaywall('Платёж не выполнен. Деньги не списаны. Скидка снова доступна для следующей попытки.');
          return true;
        }
        if (result.status === 'refunded') {
          renderPaywall('Платёж возвращён. Доступ к делу закрыт.');
          return true;
        }
      } catch {}
    }
    renderPaywall('Платёж ещё обрабатывается. Обновите страницу через несколько секунд.');
    return true;
  };

  const params = new URLSearchParams(location.search);
  const roomCode = String(params.get('room') || '').trim().toUpperCase();
  if (ROOM_CODE_RE.test(roomCode)) {
    bootGame();
    return;
  }

  reconcileReturn().then((handled) => {
    if (handled) return;
    restore().then((restored) => {
      if (!restored) renderPaywall();
    });
  });
})();
