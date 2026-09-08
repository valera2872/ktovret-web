(() => {
  'use strict';

  const cfg = window.MysteryLogicPaidAccessConfig || {};
  const products = cfg.products || {};
  const buy = document.querySelector('[data-volume-buy]');
  const email = document.querySelector('[data-volume-email]');
  const offerAccept = document.querySelector('[data-volume-offer-accept]');
  const privacyAck = document.querySelector('[data-volume-privacy-ack]');
  const note = document.querySelector('[data-volume-payment-note]');
  const checkoutDetails = document.querySelector('.ref-checkout');
  const selectedSummary = document.querySelector('[data-volume-selected-summary]');
  const selectedProductText = document.querySelector('[data-volume-selected-product]');
  const productButtons = [...document.querySelectorAll('[data-volume-product]')];
  const closingBuyLinks = document.querySelectorAll('[data-volume-scroll-buy]');
  const accessStrip = document.querySelector('#volume-access');
  if (!buy) return;

  const storageKey = cfg.tokenStorageKey || 'mysterylogic:volume1:access-token';
  const baseOrderStorageKey = cfg.orderStorageKey || 'mysterylogic:who-lied:last-order-id';
  const requestStorageKey = cfg.requestStorageKey || 'mysterylogic:who-lied:checkout-request-id';
  const emailWrap = email?.closest('.volume-checkout-email') || null;
  const legalWrap = document.querySelector('[data-volume-legal]');
  const ownedProductIds = new Set();
  let busy = false;
  let catalogPromise = null;

  const productIds = Object.keys(products);
  const isKnownProduct = (id) => Boolean(id && products[id]);
  const productGrantIds = (id) => id === 'volume_bundle_1_2' ? ['volume1', 'volume2'] : isKnownProduct(id) ? [id] : [];
  const initialQueryProduct = new URLSearchParams(location.search).get('product');
  let selectedProductId = isKnownProduct(initialQueryProduct)
    ? initialQueryProduct
    : (isKnownProduct('volume_bundle_1_2') ? 'volume_bundle_1_2' : (productIds[0] || 'volume1'));

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

  const validEmail = (value) => /^[^\s@]+@[^\s]+\.[^\s]+$/.test(value) && value.length <= 254;
  const orderKey = (productId) => `${baseOrderStorageKey}:${productId}`;
  const product = () => products[selectedProductId] || null;
  const selectionOwned = () => productGrantIds(selectedProductId).length > 0
    && productGrantIds(selectedProductId).every((id) => ownedProductIds.has(id));
  const selectionPartiallyOwned = () => selectedProductId === 'volume_bundle_1_2'
    && productGrantIds(selectedProductId).some((id) => ownedProductIds.has(id))
    && !selectionOwned();

  const productLabel = (id) => {
    const item = products[id];
    if (!item) return id;
    return `${item.label} · ${item.caseCount} дел · ${item.priceRub} ₽`;
  };

  const checkoutReady = () => Boolean(
    cfg.checkoutEnabled
      && cfg.checkoutEndpoint
      && product()
      && !selectionOwned()
      && !selectionPartiallyOwned()
      && validEmail(String(email?.value || '').trim().toLowerCase())
      && offerAccept?.checked
      && privacyAck?.checked
  );

  const syncBuyState = () => {
    const current = product();
    if (!current) {
      buy.disabled = true;
      return;
    }
    if (selectionOwned()) {
      buy.disabled = true;
      buy.textContent = 'Уже куплено';
      return;
    }
    if (selectionPartiallyOwned()) {
      buy.disabled = true;
      buy.textContent = 'Выберите недостающий том';
      return;
    }
    buy.textContent = `Перейти к оплате · ${current.priceRub} ₽`;
    buy.disabled = busy || !checkoutReady();
  };

  const syncProductUi = ({ announce = false } = {}) => {
    const current = product();
    for (const button of productButtons) {
      const active = button.dataset.volumeProduct === selectedProductId;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    }
    if (selectedSummary && current) selectedSummary.textContent = `${current.label} · ${current.priceRub} ₽`;
    if (selectedProductText && current) selectedProductText.textContent = productLabel(selectedProductId);
    buy.dataset.productId = selectedProductId;
    syncBuyState();
    if (announce) {
      if (selectionOwned()) setNote(`${current.label} уже доступен в этом браузере.`, 'ok');
      else if (selectionPartiallyOwned()) setNote('Один из томов уже куплен. Чтобы не платить за него повторно, выберите недостающий том.', 'error');
      else setNote(`Выбрано: ${productLabel(selectedProductId)}. Укажите e-mail и подтвердите условия.`);
    }
  };

  const selectProduct = (productId, options = {}) => {
    if (!isKnownProduct(productId)) return;
    selectedProductId = productId;
    syncProductUi(options);
    try {
      const url = new URL(location.href);
      if (url.searchParams.get('payment_return') !== '1') {
        url.searchParams.set('product', productId);
        history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      }
    } catch {}
    track('volume_product_selected', {
      product_id: productId,
      price: products[productId]?.priceRub || 0,
      cases: products[productId]?.caseCount || 0,
    });
  };

  for (const button of productButtons) {
    button.addEventListener('click', () => selectProduct(button.dataset.volumeProduct, { announce: true }));
  }

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

  const loadCatalog = () => {
    if (window.KtoVretCatalog?.cases) return Promise.resolve(window.KtoVretCatalog);
    if (catalogPromise) return catalogPromise;
    catalogPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('../assets/generated/cases-index.js', location.href).href;
      script.async = true;
      script.onload = () => window.KtoVretCatalog?.cases ? resolve(window.KtoVretCatalog) : reject(new Error('catalog_missing'));
      script.onerror = () => reject(new Error('catalog_load_failed'));
      document.head.appendChild(script);
    });
    return catalogPromise;
  };

  const caseNumber = (item) => Number.parseInt(String(item.number || '').replace(/\D/g, ''), 10) || 0;

  const addCaseList = (card, productId, cases) => {
    if (!card || card.dataset.libraryReady === '1') return;
    card.dataset.libraryReady = '1';
    card.classList.add('is-unlocked');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');
    card.setAttribute('aria-label', `${products[productId]?.label || productId}. Открыть список: ${cases.length} дел`);

    const list = document.createElement('div');
    list.className = 'volume-archive-case-list';
    list.hidden = true;
    for (const item of cases.sort((a, b) => caseNumber(a) - caseNumber(b))) {
      const link = document.createElement('a');
      const target = item.legacyPath || item.path || '';
      link.href = new URL(`../${target}`, location.href).href;
      link.className = 'volume-archive-case-link';
      link.innerHTML = `<span>Дело № ${String(item.number || '').padStart(3, '0')}</span><strong>${String(item.title || 'Расследование')}</strong><small>${String(item.difficulty || 'Логика')} · ≈ ${Number(item.estimatedMinutes) || 7} мин</small>`;
      list.appendChild(link);
    }
    card.appendChild(list);

    const toggle = () => {
      const expanded = card.getAttribute('aria-expanded') === 'true';
      card.setAttribute('aria-expanded', String(!expanded));
      card.classList.toggle('is-expanded', !expanded);
      list.hidden = expanded;
      if (!expanded) track('premium_volume_opened', { product_id: productId });
    };
    card.addEventListener('click', (event) => { if (!event.target.closest('a')) toggle(); });
    card.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('a')) {
        event.preventDefault();
        toggle();
      }
    });
  };

  const refreshOwnedLibrary = async () => {
    const catalog = await loadCatalog();
    for (const id of ['volume1', 'volume2']) {
      const owned = ownedProductIds.has(id);
      const cards = [...document.querySelectorAll(`[data-volume-card="${id}"], [data-product-card="${id}"]`)];
      for (const card of cards) card.classList.toggle('is-unlocked', owned);
      if (!owned) continue;
      const cases = (catalog.cases || []).filter((item) => item.productId === id);
      for (const card of cards) addCaseList(card, id, [...cases]);
    }
    const bothOwned = ownedProductIds.has('volume1') && ownedProductIds.has('volume2');
    for (const card of document.querySelectorAll('[data-volume-card="volume_bundle_1_2"], [data-product-card="volume_bundle_1_2"]')) {
      card.classList.toggle('is-unlocked', bothOwned);
    }
    document.documentElement.classList.toggle('volume-access-unlocked', ownedProductIds.size > 0);
    syncProductUi();
  };

  const applyPaidResult = async (result, message) => {
    for (const id of result.entitlementProductIds || []) ownedProductIds.add(id);
    if (!result.entitlementProductIds?.length && result.productId === 'volume1') ownedProductIds.add('volume1');
    if (result.productId === 'volume2') ownedProductIds.add('volume2');
    if (result.productId === 'volume_bundle_1_2') {
      ownedProductIds.add('volume1');
      ownedProductIds.add('volume2');
    }
    setNote(message || 'Доступ активирован.', 'ok');
    busy = false;
    await refreshOwnedLibrary();
  };

  const storedOrderIds = () => {
    const ids = new Set();
    const legacy = localStorage.getItem(baseOrderStorageKey) || '';
    if (legacy) ids.add(legacy);
    for (const id of productIds) {
      const value = localStorage.getItem(orderKey(id)) || '';
      if (value) ids.add(value);
    }
    return [...ids];
  };

  const restoreAccess = async () => {
    if (!cfg.paymentStatusEndpoint) return false;
    const token = localStorage.getItem(storageKey) || '';
    const orders = storedOrderIds();
    if (!token || !orders.length) return false;
    let restored = false;
    for (const orderId of orders) {
      try {
        const result = await paymentStatus(token, orderId);
        if (result.status === 'paid' && result.entitled) {
          for (const id of result.entitlementProductIds || []) ownedProductIds.add(id);
          if (result.productId === 'volume1') ownedProductIds.add('volume1');
          if (result.productId === 'volume2') ownedProductIds.add('volume2');
          if (result.productId === 'volume_bundle_1_2') {
            ownedProductIds.add('volume1');
            ownedProductIds.add('volume2');
          }
          restored = true;
        }
      } catch {}
    }
    if (restored) {
      await refreshOwnedLibrary();
      const missing = ['volume1', 'volume2'].filter((id) => !ownedProductIds.has(id));
      setNote(missing.length ? 'Купленный том открыт. Можно приобрести второй том отдельно.' : 'Оба тома доступны. Выберите расследование.', 'ok');
      if (missing.length === 1 && selectedProductId === 'volume_bundle_1_2') selectedProductId = missing[0];
      syncProductUi();
    }
    return restored;
  };

  const reconcileReturn = async () => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment_return') !== '1' || !cfg.paymentStatusEndpoint) return false;

    const token = localStorage.getItem(storageKey) || '';
    const returnProduct = isKnownProduct(params.get('product')) ? params.get('product') : selectedProductId;
    const orderId = params.get('order_id') || localStorage.getItem(orderKey(returnProduct)) || localStorage.getItem(baseOrderStorageKey) || '';
    sessionStorage.removeItem(requestStorageKey);
    if (!token || !orderId) {
      setNote('Не удалось найти данные покупки в этом браузере. Напишите в поддержку, если оплата уже прошла.', 'error');
      return true;
    }

    setNote('Проверяем оплату…');
    for (const delay of [0, 900, 1600, 2600, 4200]) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        const result = await paymentStatus(token, orderId);
        if (result.status === 'paid' && result.entitled) {
          localStorage.setItem(baseOrderStorageKey, orderId);
          localStorage.setItem(orderKey(result.productId || returnProduct), orderId);
          track('purchase_completed', {
            order_id: orderId,
            payment_id: result.paymentId || '',
            product_id: result.productId || returnProduct,
          });
          await applyPaidResult(result, 'Оплата подтверждена. Купленные расследования открыты.');
          try { history.replaceState({}, '', `${location.pathname}?product=${encodeURIComponent(result.productId || returnProduct)}`); } catch {}
          return true;
        }
        if (result.status === 'canceled') {
          setNote('Платёж не выполнен. Деньги не списаны.', 'error');
          busy = false;
          syncBuyState();
          return true;
        }
        if (result.status === 'refunded') {
          setNote('Платёж возвращён. Доступ закрыт.', 'error');
          busy = false;
          syncBuyState();
          return true;
        }
      } catch {}
    }
    setNote('Платёж ещё обрабатывается. Обновите страницу через несколько секунд.', 'error');
    busy = false;
    syncBuyState();
    return true;
  };

  const startCheckout = async () => {
    if (busy || !cfg.checkoutEnabled || !cfg.checkoutEndpoint || !product()) return;
    if (selectionOwned()) {
      setNote('Этот том уже куплен.', 'ok');
      return;
    }
    if (selectionPartiallyOwned()) {
      const missing = ['volume1', 'volume2'].find((id) => !ownedProductIds.has(id));
      if (missing) selectProduct(missing, { announce: true });
      return;
    }

    const customerEmail = String(email?.value || '').trim().toLowerCase();
    if (!validEmail(customerEmail)) {
      setNote('Укажите корректный e-mail — на него придёт электронный чек.', 'error');
      email?.focus();
      return;
    }
    if (!offerAccept?.checked) {
      setNote('Перед оплатой примите условия Публичной оферты.', 'error');
      offerAccept?.focus();
      return;
    }
    if (!privacyAck?.checked) {
      setNote('Подтвердите, что ознакомились с Политикой конфиденциальности.', 'error');
      privacyAck?.focus();
      return;
    }

    busy = true;
    syncBuyState();
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
          productId: selectedProductId,
          accessToken: token,
          requestId,
          returnUrl: returnUrl.href,
          caseId: '',
          email: customerEmail,
          language: 'ru',
          offerAccepted: true,
          privacyAcknowledged: true,
        }),
        cache: 'no-store',
        credentials: 'omit',
      });
      let body = {};
      try { body = await response.json(); } catch {}
      if (!response.ok) throw new Error(body.error || `http_${response.status}`);
      if (!body.orderId || !body.confirmationUrl) throw new Error('invalid_checkout_response');

      localStorage.setItem(baseOrderStorageKey, body.orderId);
      localStorage.setItem(orderKey(body.productId || selectedProductId), body.orderId);
      track('checkout_created', {
        order_id: body.orderId,
        payment_id: body.paymentId || '',
        product_id: body.productId || selectedProductId,
        price: product()?.priceRub || 0,
      });
      setNote('Переходим на защищённую платёжную страницу T‑Bank…', 'ok');
      location.assign(body.confirmationUrl);
    } catch (error) {
      sessionStorage.removeItem(requestStorageKey);
      const messages = {
        invalid_product: 'Выберите доступный том.',
        email_required_for_receipt: 'Для электронного чека укажите e-mail.',
        invalid_email: 'Проверьте e-mail.',
        offer_acceptance_required: 'Перед оплатой примите условия Публичной оферты.',
        privacy_acknowledgement_required: 'Подтвердите ознакомление с Политикой конфиденциальности.',
        payment_service_not_configured: 'Оплата временно недоступна.',
        payment_create_failed: 'T‑Bank не создал платёж. Попробуйте ещё раз.',
      };
      setNote(messages[error.message] || 'Не удалось начать оплату. Попробуйте ещё раз.', 'error');
      busy = false;
      syncBuyState();
    }
  };

  const syncCheckoutLayout = () => {
    accessStrip?.classList.toggle('is-checkout-open', Boolean(checkoutDetails?.open));
  };
  checkoutDetails?.addEventListener('toggle', syncCheckoutLayout);
  syncCheckoutLayout();

  for (const link of closingBuyLinks) {
    link.addEventListener('click', () => {
      if (checkoutDetails) checkoutDetails.open = true;
      if (!ownedProductIds.size) selectProduct('volume_bundle_1_2');
      syncCheckoutLayout();
      track('volume_closing_cta_clicked', { product_id: selectedProductId, price: product()?.priceRub || 0, cases: product()?.caseCount || 0 });
      window.setTimeout(() => {
        (email || checkoutDetails?.querySelector('summary'))?.focus({ preventScroll: true });
      }, 350);
    });
  }

  if (cfg.checkoutEnabled && cfg.checkoutEndpoint) {
    buy.addEventListener('click', startCheckout);
    email?.addEventListener('input', syncBuyState);
    offerAccept?.addEventListener('change', syncBuyState);
    privacyAck?.addEventListener('change', syncBuyState);
    syncProductUi();
  } else {
    buy.disabled = true;
    setNote('Оплата временно недоступна. Бесплатные дела работают без ограничений.');
  }

  reconcileReturn().then((handled) => {
    if (!handled) restoreAccess();
  });
})();
