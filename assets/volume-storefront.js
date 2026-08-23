(() => {
  'use strict';

  const cfg = window.MysteryLogicPaidAccessConfig || {};
  const buy = document.querySelector('[data-volume-buy]');
  const email = document.querySelector('[data-volume-email]');
  const offerAccept = document.querySelector('[data-volume-offer-accept]');
  const privacyAck = document.querySelector('[data-volume-privacy-ack]');
  const note = document.querySelector('[data-volume-payment-note]');
  const checkoutDetails = document.querySelector('.ref-checkout');
  const closingBuyLinks = document.querySelectorAll('[data-volume-scroll-buy]');
  if (!buy) return;

  const storageKey = cfg.tokenStorageKey || 'mysterylogic:volume1:access-token';
  const orderStorageKey = cfg.orderStorageKey || 'mysterylogic:volume1:last-order-id';
  const requestStorageKey = cfg.requestStorageKey || 'mysterylogic:volume1:checkout-request-id';
  const emailWrap = email?.closest('.volume-checkout-email') || null;
  const legalWrap = document.querySelector('[data-volume-legal]');
  let busy = false;
  let libraryUnlocked = false;
  let catalogPromise = null;

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

  const checkoutReady = () => Boolean(
    cfg.checkoutEnabled
      && cfg.checkoutEndpoint
      && validEmail(String(email?.value || '').trim().toLowerCase())
      && offerAccept?.checked
      && privacyAck?.checked
  );

  const syncBuyState = () => {
    if (libraryUnlocked || busy) {
      buy.disabled = true;
      return;
    }
    buy.disabled = !checkoutReady();
  };

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

  const buildArchiveLibrary = async () => {
    const catalog = await loadCatalog();
    const premium = (catalog.cases || []).filter((item) => item.access === 'premium');
    const aliases = new Map([['Ежедневные расследования', 'Дела дня']]);

    for (const card of document.querySelectorAll('.volume-archive-card')) {
      if (card.dataset.libraryReady === '1') continue;
      const displayTitle = card.querySelector('h3')?.textContent?.trim() || '';
      const setTitle = aliases.get(displayTitle) || displayTitle;
      const cases = premium
        .filter((item) => String(item.setTitle || '').trim() === setTitle)
        .sort((a, b) => caseNumber(a) - caseNumber(b));
      if (!cases.length) continue;

      card.dataset.libraryReady = '1';
      card.classList.add('is-unlocked');
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-expanded', 'false');
      card.setAttribute('aria-label', `${displayTitle}. Открыть архив: ${cases.length} дел`);

      const lock = card.querySelector('.volume-lock');
      lock?.classList.add('is-unlocked');

      const openLabel = document.createElement('span');
      openLabel.className = 'volume-archive-open';
      openLabel.textContent = 'Открыть архив';
      card.appendChild(openLabel);

      const list = document.createElement('div');
      list.className = 'volume-archive-case-list';
      list.hidden = true;

      for (const item of cases) {
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
        openLabel.textContent = expanded ? 'Открыть архив' : 'Свернуть архив';
        if (!expanded) track('premium_archive_opened', { archive: setTitle });
      };

      card.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        toggle();
      });
      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (event.target.closest('a')) return;
        event.preventDefault();
        toggle();
      });
    }
  };

  const unlockLibrary = async ({ message = 'Доступ к полному первому тому активен.' } = {}) => {
    if (libraryUnlocked) return;
    libraryUnlocked = true;
    busy = false;
    buy.disabled = true;
    buy.textContent = 'Доступ открыт';
    buy.setAttribute('aria-disabled', 'true');
    if (emailWrap) emailWrap.hidden = true;
    if (legalWrap) legalWrap.hidden = true;
    document.documentElement.classList.add('volume-access-unlocked');
    setNote(message, 'ok');
    try {
      await buildArchiveLibrary();
    } catch {
      setNote('Доступ активен. Не удалось загрузить список дел — обновите страницу.', 'error');
    }
  };

  const restoreAccess = async () => {
    if (!cfg.paymentStatusEndpoint) return false;
    const token = localStorage.getItem(storageKey) || '';
    const orderId = localStorage.getItem(orderStorageKey) || '';
    if (!token || !orderId) return false;
    try {
      const result = await paymentStatus(token, orderId);
      if (result.status === 'paid' && result.entitled) {
        await unlockLibrary({ message: 'Доступ открыт. Выберите архив и расследование.' });
        return true;
      }
      if (result.status === 'refunded') {
        setNote('Платёж возвращён. Доступ закрыт.', 'error');
      }
    } catch {}
    return false;
  };

  const reconcileReturn = async () => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment_return') !== '1' || !cfg.paymentStatusEndpoint) return false;

    const token = localStorage.getItem(storageKey) || '';
    const orderId = params.get('order_id') || localStorage.getItem(orderStorageKey) || '';
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
          localStorage.setItem(orderStorageKey, orderId);
          track('purchase_completed', { order_id: orderId, payment_id: result.paymentId || '' });
          await unlockLibrary({ message: 'Оплата подтверждена. Выберите архив и расследование.' });
          try { history.replaceState({}, '', location.pathname); } catch {}
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
    if (busy || libraryUnlocked || !cfg.checkoutEnabled || !cfg.checkoutEndpoint) return;
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

      localStorage.setItem(orderStorageKey, body.orderId);
      track('checkout_created', { order_id: body.orderId, payment_id: body.paymentId || '' });
      setNote('Переходим на защищённую платёжную страницу T‑Bank…', 'ok');
      location.assign(body.confirmationUrl);
    } catch (error) {
      sessionStorage.removeItem(requestStorageKey);
      const messages = {
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

  for (const link of closingBuyLinks) {
    link.addEventListener('click', () => {
      if (checkoutDetails) checkoutDetails.open = true;
      track('volume_closing_cta_clicked', { price: 99, premium_cases: 85 });
      window.setTimeout(() => {
        (email || checkoutDetails?.querySelector('summary'))?.focus({ preventScroll: true });
      }, 350);
    });
  }

  if (cfg.checkoutEnabled && cfg.checkoutEndpoint) {
    setNote('Укажите e-mail и подтвердите условия перед переходом к оплате через T‑Bank.');
    buy.addEventListener('click', startCheckout);
    email?.addEventListener('input', syncBuyState);
    offerAccept?.addEventListener('change', syncBuyState);
    privacyAck?.addEventListener('change', syncBuyState);
    syncBuyState();
  } else {
    buy.disabled = true;
    setNote('Оплата временно недоступна. Бесплатные дела работают без ограничений.');
  }

  reconcileReturn().then((handled) => {
    if (!handled) restoreAccess();
  });
})();
