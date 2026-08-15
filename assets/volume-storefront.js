(() => {
  'use strict';

  const cfg = window.MysteryLogicPaidAccessConfig || {};
  const buy = document.querySelector('[data-volume-buy]');
  const email = document.querySelector('[data-volume-email]');
  const note = document.querySelector('[data-volume-payment-note]');
  if (!buy) return;

  const storageKey = cfg.tokenStorageKey || 'mysterylogic:volume1:access-token';
  const orderStorageKey = cfg.orderStorageKey || 'mysterylogic:volume1:last-order-id';
  const requestStorageKey = cfg.requestStorageKey || 'mysterylogic:volume1:checkout-request-id';
  let busy = false;

  const setNote = (text, kind = '') => {
    if (!note) return;
    note.textContent = text;
    note.dataset.kind = kind;
  };

  const track = (event, params = {}) => {
    try { window.MysteryLogicAnalytics?.track?.(event, params); } catch {}
  };

  const randomToken = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let binary = '';
    for (const value of bytes) binary += String.fromCharCode(value);
    const encoded = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
    return `ml_live_${encoded}`;
  };

  const ensureToken = () => {
    let token = localStorage.getItem(storageKey) || '';
    if (!/^ml_[a-z0-9]+_[A-Za-z0-9_-]{32,160}$/.test(token)) {
      token = randomToken();
      localStorage.setItem(storageKey, token);
    }
    return token;
  };

  const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

  const paymentStatus = async (token, orderId) => {
    const response = await fetch(cfg.paymentStatusEndpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId }),
      cache: 'no-store',
      credentials: 'omit',
    });
    let body = {};
    try { body = await response.json(); } catch {}
    if (!response.ok) throw new Error(body.error || `http_${response.status}`);
    return body;
  };

  const reconcileReturn = async () => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment_return') !== '1' || !cfg.paymentStatusEndpoint) return;

    const token = localStorage.getItem(storageKey) || '';
    const orderId = params.get('order_id') || localStorage.getItem(orderStorageKey) || '';
    sessionStorage.removeItem(requestStorageKey);
    if (!token || !orderId) {
      setNote('Не удалось найти данные покупки в этом браузере. Напишите в поддержку, если оплата уже прошла.', 'error');
      return;
    }

    setNote('Проверяем оплату…');
    for (const delay of [0, 900, 1600, 2600, 4200]) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        const result = await paymentStatus(token, orderId);
        if (result.status === 'paid' && result.entitled) {
          localStorage.setItem(orderStorageKey, orderId);
          track('purchase_completed', { order_id: orderId, payment_id: result.paymentId || '' });
          buy.disabled = true;
          buy.textContent = 'Доступ открыт';
          setNote('Оплата подтверждена. Доступ к полному первому тому активирован.', 'ok');
          try { history.replaceState({}, '', location.pathname); } catch {}
          return;
        }
        if (result.status === 'canceled') {
          setNote('Платёж не выполнен. Деньги не списаны.', 'error');
          busy = false;
          buy.disabled = false;
          return;
        }
        if (result.status === 'refunded') {
          setNote('Платёж возвращён. Доступ закрыт.', 'error');
          busy = false;
          buy.disabled = false;
          return;
        }
      } catch {}
    }
    setNote('Платёж ещё обрабатывается. Обновите страницу через несколько секунд.', 'error');
    busy = false;
    buy.disabled = false;
  };

  const startCheckout = async () => {
    if (busy || !cfg.checkoutEnabled || !cfg.checkoutEndpoint) return;
    const customerEmail = String(email?.value || '').trim().toLowerCase();
    if (!validEmail(customerEmail)) {
      setNote('Укажите корректный e-mail — на него придёт электронный чек.', 'error');
      email?.focus();
      return;
    }

    busy = true;
    buy.disabled = true;
    setNote('Создаём защищённый платёж…');

    const token = ensureToken();
    const requestId = crypto.randomUUID();
    sessionStorage.setItem(requestStorageKey, requestId);

    const returnUrl = new URL(location.href);
    returnUrl.search = '';
    returnUrl.hash = '';

    try {
      const response = await fetch(cfg.checkoutEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          accessToken: token,
          requestId,
          returnUrl: returnUrl.href,
          caseId: '',
          email: customerEmail,
          language: 'ru',
        }),
        cache: 'no-store',
        credentials: 'omit',
      });
      let body = {};
      try { body = await response.json(); } catch {}
      if (!response.ok) throw new Error(body.error || `http_${response.status}`);
      if (!body.orderId || !body.confirmationUrl) throw new Error('invalid_checkout_response');

      localStorage.setItem(orderStorageKey, body.orderId);
      track('checkout_created', { order_id: body.orderId, payment_id: body.paymentId || '' });
      setNote('Переходим на защищённую платёжную страницу T‑Bank…', 'ok');
      location.assign(body.confirmationUrl);
    } catch (error) {
      sessionStorage.removeItem(requestStorageKey);
      const messages = {
        email_required_for_receipt: 'Для электронного чека укажите e-mail.',
        invalid_email: 'Проверьте e-mail.',
        payment_service_not_configured: 'Оплата временно недоступна.',
        payment_create_failed: 'T‑Bank не создал платёж. Попробуйте ещё раз.',
      };
      setNote(messages[error.message] || 'Не удалось начать оплату. Попробуйте ещё раз.', 'error');
      busy = false;
      buy.disabled = false;
    }
  };

  if (cfg.checkoutEnabled && cfg.checkoutEndpoint) {
    buy.disabled = false;
    setNote('Укажите e-mail для электронного чека и перейдите к оплате через T‑Bank.');
    buy.addEventListener('click', startCheckout);
  } else {
    buy.disabled = true;
    setNote('Оплата временно недоступна. Бесплатные дела работают без ограничений.');
  }

  reconcileReturn();
})();
