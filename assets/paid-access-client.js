(() => {
  'use strict';

  const script = document.currentScript;
  const page = window.KtoVretPage || {};
  const cfg = window.MysteryLogicPaidAccessConfig || {};
  const panel = document.querySelector('[data-paid-access-panel]');
  const comingSoon = document.querySelector('[data-paid-coming-soon]');
  if (!script?.src || !panel || !page.caseId) return;

  if (!cfg.endpoint) {
    panel.hidden = true;
    if (comingSoon) comingSoon.hidden = false;
    return;
  }
  panel.hidden = false;
  if (comingSoon) comingSoon.hidden = true;

  const siteRoot = new URL('../', script.src);
  const unlockButton = panel.querySelector('[data-paid-unlock]');
  const tokenInput = panel.querySelector('[data-paid-token]');
  const status = panel.querySelector('[data-paid-status]');
  const purchase = panel.querySelector('[data-purchase-start]');
  const purchaseEmailWrap = panel.querySelector('[data-purchase-email-wrap]');
  const purchaseEmail = panel.querySelector('[data-purchase-email]');
  const storageKey = cfg.tokenStorageKey || 'mysterylogic:volume1:access-token';
  const orderStorageKey = cfg.orderStorageKey || 'mysterylogic:volume1:last-order-id';
  const requestStorageKey = cfg.requestStorageKey || 'mysterylogic:volume1:checkout-request-id';
  let purchaseBusy = false;

  const track = (event, params = {}) => {
    try { window.MysteryLogicAnalytics?.track?.(event, params); } catch {}
  };

  const setStatus = (text, kind = '') => {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('is-error', kind === 'error');
    status.classList.toggle('is-ok', kind === 'ok');
  };

  const randomToken = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let binary = '';
    for (const value of bytes) binary += String.fromCharCode(value);
    const encoded = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
    return `ml_live_${encoded}`;
  };

  const ensurePurchaseToken = () => {
    let token = localStorage.getItem(storageKey) || '';
    if (!/^ml_[a-z0-9]+_[A-Za-z0-9_-]{32,160}$/.test(token)) {
      token = randomToken();
      localStorage.setItem(storageKey, token);
    }
    if (tokenInput) tokenInput.value = token;
    return token;
  };

  const loadScript = (route) => new Promise((resolve, reject) => {
    const src = new URL(route, siteRoot).href;
    const existing = [...document.scripts].find((item) => item.src === src);
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve();
      else existing.addEventListener('load', resolve, { once: true });
      return;
    }
    const node = document.createElement('script');
    node.src = src;
    node.onload = () => { node.dataset.loaded = 'true'; resolve(); };
    node.onerror = reject;
    document.head.appendChild(node);
  });

  const loadCss = (route) => {
    const href = new URL(route, siteRoot).href;
    if ([...document.styleSheets].some((sheet) => sheet.href === href)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };

  const bootGame = async (gameConfig) => {
    if (!gameConfig?.case?.id || gameConfig.case.id !== page.caseId) throw new Error('case_mismatch');
    const locked = document.querySelector('[data-paywall-view]');
    if (!locked) throw new Error('paywall_root_missing');

    document.body.className = 'ktv-case-page';
    const root = document.createElement('main');
    root.className = 'ktv-game-shell';
    root.dataset.ktvRoot = '';
    root.dataset.premiumGame = '1.4.0';
    root.dataset.witnessUi = '1.3';
    root.dataset.cyclePolish = '1.4';
    root.dataset.mobileScroll = '1.4.1';
    root.dataset.witnessCount = String(gameConfig.case.witnessCount || gameConfig.case.characters?.length || 0);
    locked.replaceWith(root);

    loadCss('assets/witness-cycle.css?v=1.4.0');
    window.KtoVretWeb = gameConfig;
    window.KtoVretWeb.permalink = location.href;

    await loadScript('assets/generated/cases-index.js?v=1.11.0');
    await loadScript('assets/dossier-model.js?v=1.11.0');
    await loadScript('ktovret-game/assets/app.js?v=1.11.0');
    await loadScript('ktovret-game/assets/performance.js?v=1.11.0');
    await loadScript('assets/case-adapter.js?v=1.4.0');
    await loadScript('assets/mobile-scroll-stabilizer.js?v=1.4.1');

    window.dispatchEvent(new CustomEvent('mysterylogic:paid-case-unlocked', {
      detail: { caseId: page.caseId, productId: cfg.productId || 'volume1' },
    }));
  };

  const fetchPaidCase = async (token) => {
    const url = new URL(cfg.endpoint);
    url.searchParams.set('case_id', page.caseId);
    const response = await fetch(url.href, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
      credentials: 'omit',
    });
    let body = {};
    try { body = await response.json(); } catch {}
    if (!response.ok) {
      const error = new Error(body.error || `http_${response.status}`);
      error.status = response.status;
      throw error;
    }
    if (!body?.config) throw new Error('invalid_case_payload');
    return body.config;
  };

  const unlock = async ({ silent = false } = {}) => {
    const typed = tokenInput?.value?.trim() || '';
    const stored = localStorage.getItem(storageKey) || '';
    const token = typed || stored;
    if (!token) {
      if (!silent) setStatus('Введите ключ доступа, полученный после покупки.', 'error');
      return false;
    }

    if (unlockButton) unlockButton.disabled = true;
    if (!silent) setStatus('Проверяем доступ…');
    try {
      const gameConfig = await fetchPaidCase(token);
      localStorage.setItem(storageKey, token);
      setStatus('Доступ подтверждён. Открываем дело…', 'ok');
      await bootGame(gameConfig);
      return true;
    } catch (error) {
      if (!silent) {
        const messages = {
          access_denied: 'Ключ не даёт доступа к полному тому.',
          access_revoked: 'Доступ по этому ключу отозван.',
          access_expired: 'Срок доступа закончился.',
          case_not_found: 'Платное дело не найдено на сервере.',
        };
        setStatus(messages[error.message] || 'Не удалось проверить доступ. Попробуйте ещё раз.', 'error');
      }
      return false;
    } finally {
      if (unlockButton && document.contains(unlockButton)) unlockButton.disabled = false;
    }
  };

  const paymentStatus = async (token, orderId) => {
    const response = await fetch(cfg.paymentStatusEndpoint, {
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

  const reconcilePaymentReturn = async () => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment_return') !== '1' || !cfg.paymentStatusEndpoint) return false;
    const token = localStorage.getItem(storageKey) || '';
    const orderId = params.get('order_id') || localStorage.getItem(orderStorageKey) || '';
    if (!token || !orderId) {
      setStatus('Не удалось найти данные покупки в этом браузере. Используйте сохранённый ключ доступа.', 'error');
      return true;
    }

    setStatus('Проверяем оплату…');
    const delays = [0, 900, 1600, 2600, 4200];
    for (const delay of delays) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        const result = await paymentStatus(token, orderId);
        if (result.status === 'paid' && result.entitled) {
          sessionStorage.removeItem(requestStorageKey);
          localStorage.setItem(orderStorageKey, orderId);
          track('purchase_completed', { order_id: orderId, payment_id: result.paymentId || '' });
          setStatus('Оплата подтверждена. Открываем полный том…', 'ok');
          await unlock({ silent: true });
          try {
            const clean = `${location.pathname}${location.hash || ''}`;
            history.replaceState({}, '', clean);
          } catch {}
          return true;
        }
        if (result.status === 'canceled') {
          setStatus('Платёж отменён. Деньги не списаны.', 'error');
          return true;
        }
        if (result.status === 'refunded') {
          setStatus('Платёж возвращён, доступ закрыт.', 'error');
          return true;
        }
      } catch {}
    }
    setStatus('Платёж ещё обрабатывается. Обновите страницу через несколько секунд — доступ подхватится автоматически.', 'error');
    return true;
  };

  const createCheckout = async () => {
    if (purchaseBusy || !cfg.checkoutEnabled || !cfg.checkoutEndpoint) return;
    purchaseBusy = true;
    if (purchase) purchase.setAttribute('aria-disabled', 'true');
    setStatus('Создаём защищённый платёж…');

    const token = ensurePurchaseToken();
    let requestId = sessionStorage.getItem(requestStorageKey) || '';
    if (!requestId) {
      requestId = crypto.randomUUID();
      sessionStorage.setItem(requestStorageKey, requestId);
    }
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
          caseId: page.caseId,
          email: purchaseEmail?.value?.trim() || '',
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
      setStatus('Переходим на защищённую страницу ЮKassa…', 'ok');
      location.assign(body.confirmationUrl);
    } catch (error) {
      const messages = {
        email_required: 'Для формирования чека укажите e-mail.',
        invalid_email: 'Проверьте e-mail.',
        payment_service_not_configured: 'Оплата пока не включена.',
        payment_create_failed: 'ЮKassa не создала платёж. Попробуйте ещё раз.',
      };
      setStatus(messages[error.message] || 'Не удалось начать оплату. Попробуйте ещё раз.', 'error');
      purchaseBusy = false;
      if (purchase) purchase.removeAttribute('aria-disabled');
    }
  };

  if (purchase) {
    const enabled = Boolean(cfg.checkoutEnabled && cfg.checkoutEndpoint);
    purchase.hidden = !enabled;
    purchaseEmailWrap?.toggleAttribute('hidden', !enabled);
    purchase.addEventListener('click', (event) => {
      event.preventDefault();
      createCheckout();
    });
  }

  if (tokenInput) tokenInput.value = localStorage.getItem(storageKey) || '';
  unlockButton?.addEventListener('click', () => unlock());

  reconcilePaymentReturn().then((handled) => {
    if (!handled && localStorage.getItem(storageKey)) unlock({ silent: true });
  });
})();
