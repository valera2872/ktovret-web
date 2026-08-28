(() => {
  'use strict';

  if (window.__MLLastAriaPaidFetchInstalled) return;
  window.__MLLastAriaPaidFetchInstalled = true;

  const nativeFetch = window.fetch.bind(window);
  const COOP_ENDPOINT = '/functions/v1/coop-last-aria';
  const CHECKOUT_ENDPOINT = '/functions/v1/create-checkout-last-aria';
  const STATUS_ENDPOINT = '/functions/v1/payment-status-last-aria';
  const TOKEN_KEY = 'mysterylogic:last-aria:access-token';
  const REQUEST_KEY = 'mysterylogic:last-aria:checkout-request-id';
  const FLIGHT_KEY = 'mysterylogic:last-aria:checkout-flight:v2';
  const PENDING_KEY = 'mysterylogic:last-aria:pending-payment:v2';
  const PROGRESS_PREFIX = 'mysterylogic:last-aria:v1:';
  const FLIGHT_TTL_MS = 2 * 60 * 60 * 1000;
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const TERMINAL_ROOM_ERRORS = new Set(['room_expired', 'room_inactive', 'room_not_found']);

  let terminalRoom = '';
  let lastFinalSubmit = { signature: '', at: 0 };

  const parseJson = (value, fallback = null) => {
    try { return JSON.parse(value); } catch { return fallback; }
  };
  const readSession = (key) => parseJson(sessionStorage.getItem(key) || 'null');
  const writeSession = (key, value) => {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
  };
  const removeSession = (key) => {
    try { sessionStorage.removeItem(key); } catch {}
  };
  const requestUrl = (input) => {
    try { return typeof input === 'string' ? input : String(input?.url || ''); } catch { return ''; }
  };
  const requestBody = (init = {}) => parseJson(String(init?.body || ''), {} ) || {};
  const responseWithJson = (response, body, status = response.status) => new Response(JSON.stringify(body), {
    status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });
  const clampInt = (value, min, max, fallback = min) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, Math.trunc(number)));
  };
  const roleFromScreen = () => {
    const title = document.querySelector('.casearia-room-top>span:nth-child(2) strong')?.textContent?.trim() || '';
    if (title && title === window.MLCaseAria?.roles?.guest?.title) return 'guest';
    if (title && title === window.MLCaseAria?.roles?.creator?.title) return 'creator';
    return '';
  };
  const normalizeProgress = (code, role, completed = false) => {
    if (!code || !['creator', 'guest'].includes(role)) return null;
    const key = `${PROGRESS_PREFIX}${code}:${role}`;
    const raw = localStorage.getItem(key);
    if (raw === null && !completed) return null;
    let progress = parseJson(raw || '{}', {});
    if (!progress || typeof progress !== 'object' || Array.isArray(progress)) progress = {};
    const now = Date.now();
    const startedAt = Number(progress.startedAt);
    const decisionIds = new Set((window.MLCaseAria?.decision?.options || []).map((item) => item.id));
    const decision = String(progress.decision || '');
    const normalized = {
      ...progress,
      stage: completed ? 3 : clampInt(progress.stage, 1, 3, 1),
      hintsUsed: clampInt(progress.hintsUsed, 0, 10, 0),
      attempts: clampInt(progress.attempts, 0, 20, 0),
      firstAnswerCorrect: typeof progress.firstAnswerCorrect === 'boolean' ? progress.firstAnswerCorrect : null,
      startedAt: Number.isFinite(startedAt) && startedAt > 0 ? startedAt : now,
      handoffs: progress.handoffs && typeof progress.handoffs === 'object' && !Array.isArray(progress.handoffs) ? progress.handoffs : {},
      decision: !decision || !decisionIds.size || decisionIds.has(decision) ? decision : '',
      finalAccepted: Boolean(completed),
    };
    for (const stage of [1, 2, 3]) normalized[`hintStage${stage}`] = clampInt(progress[`hintStage${stage}`], 0, 10, 0);
    try { localStorage.setItem(key, JSON.stringify(normalized)); } catch {}
    return normalized;
  };
  const rollbackCompleteAttempt = (code, submittedAttempts) => {
    const role = roleFromScreen();
    if (!code || !role) return;
    setTimeout(() => {
      const key = `${PROGRESS_PREFIX}${code}:${role}`;
      const progress = parseJson(localStorage.getItem(key) || '{}', {});
      if (!progress || typeof progress !== 'object') return;
      const current = Number(progress.attempts || 0);
      if (current >= submittedAttempts && submittedAttempts > 0) {
        progress.attempts = Math.max(0, submittedAttempts - 1);
        progress.finalAccepted = false;
        try { localStorage.setItem(key, JSON.stringify(progress)); } catch {}
      }
    }, 0);
  };
  const terminalMessage = (error) => ({
    room_expired: ['Срок комнаты истёк', 'Эта игровая комната действовала семь дней. Создайте новую комнату, чтобы начать заново.'],
    room_inactive: ['Комната закрыта', 'Эта игровая комната больше не активна.'],
    room_not_found: ['Комната не найдена', 'Ссылка больше не ведёт к активному расследованию.'],
  }[error] || ['Комната недоступна', 'Создайте новую комнату или попросите напарника прислать актуальную ссылку.']);
  const showTerminalRoom = (code, error) => {
    terminalRoom = code || terminalRoom;
    const root = document.querySelector('[data-casearia-app]');
    if (!root) return;
    const [title, text] = terminalMessage(error);
    root.innerHTML = `<div class="casearia-app"><section class="casearia-panel"><p class="casearia-eyebrow">Последняя ария</p><h2>${title}</h2><p>${text}</p><div class="casearia-actions"><a class="casearia-button is-primary" href="${location.pathname}">Вернуться к делу</a></div></section></div>`;
  };
  const validFlight = (flight, body) => Boolean(
    flight
    && UUID_RE.test(String(flight.requestId || ''))
    && Date.now() - Number(flight.createdAt || 0) < FLIGHT_TTL_MS
    && String(flight.email || '') === String(body.email || '').trim().toLowerCase()
    && String(flight.discountCode || '') === String(body.reviewDiscountCode || ''),
  );
  const prepareCheckout = (body) => {
    const normalizedEmail = String(body.email || '').trim().toLowerCase();
    const normalizedDiscount = String(body.reviewDiscountCode || '');
    const current = readSession(FLIGHT_KEY);
    let requestId = String(body.requestId || '');
    if (validFlight(current, { email: normalizedEmail, reviewDiscountCode: normalizedDiscount })) {
      requestId = current.requestId;
    } else {
      if (!UUID_RE.test(requestId)) requestId = crypto.randomUUID();
      writeSession(FLIGHT_KEY, {
        requestId,
        email: normalizedEmail,
        discountCode: normalizedDiscount,
        createdAt: Date.now(),
        orderId: '',
        confirmationUrl: '',
      });
    }
    try { sessionStorage.setItem(REQUEST_KEY, requestId); } catch {}
    return { ...body, requestId };
  };
  const rememberCheckout = (payload) => {
    const flight = readSession(FLIGHT_KEY) || {};
    writeSession(FLIGHT_KEY, {
      ...flight,
      orderId: String(payload?.orderId || flight.orderId || ''),
      confirmationUrl: String(payload?.confirmationUrl || flight.confirmationUrl || ''),
      updatedAt: Date.now(),
    });
  };
  const rememberPending = (payload) => {
    const confirmationUrl = String(payload?.confirmationUrl || readSession(FLIGHT_KEY)?.confirmationUrl || '');
    const orderId = String(payload?.orderId || readSession(FLIGHT_KEY)?.orderId || '');
    if (!confirmationUrl || !orderId) return;
    writeSession(PENDING_KEY, { orderId, confirmationUrl, createdAt: Date.now() });
  };
  const clearPaymentFlight = () => {
    removeSession(FLIGHT_KEY);
    removeSession(PENDING_KEY);
    try { sessionStorage.removeItem(REQUEST_KEY); } catch {}
  };
  const decoratePendingPaywall = () => {
    const pending = readSession(PENDING_KEY);
    if (!pending?.confirmationUrl || Date.now() - Number(pending.createdAt || 0) > FLIGHT_TTL_MS) return;
    const buy = document.querySelector('[data-aria-buy]');
    if (!buy || buy.dataset.stateSpacePending === '1') return;
    const replacement = buy.cloneNode(true);
    replacement.dataset.stateSpacePending = '1';
    replacement.disabled = false;
    replacement.textContent = 'Вернуться к незавершённой оплате';
    buy.replaceWith(replacement);
    replacement.addEventListener('click', () => location.assign(pending.confirmationUrl));
    const note = document.querySelector('[data-aria-payment-note]');
    if (note) {
      note.textContent = 'У вас уже есть созданный платёж. Чтобы не оплачивать дело повторно, продолжите его на странице T‑Bank.';
      note.dataset.kind = 'ok';
    }
  };

  const observer = new MutationObserver(() => decoratePendingPaywall());
  const observedRoot = document.querySelector('[data-casearia-app]');
  if (observedRoot) observer.observe(observedRoot, { childList: true, subtree: true });

  document.addEventListener('submit', (event) => {
    const form = event.target.closest?.('.casearia-final-form[data-final-form]');
    if (!form) return;
    const signature = [...form.querySelectorAll('input:checked')]
      .map((input) => `${input.name}:${input.value}`)
      .sort()
      .join('|');
    const now = Date.now();
    if (signature === lastFinalSubmit.signature && now - lastFinalSubmit.at < 650) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    lastFinalSubmit = { signature, at: now };
  }, true);

  window.fetch = async (input, init = {}) => {
    const url = requestUrl(input);
    let nextInit = init;
    let body = requestBody(init);
    const isCoop = url.includes(COOP_ENDPOINT);
    const isCheckout = url.includes(CHECKOUT_ENDPOINT);
    const isStatus = url.includes(STATUS_ENDPOINT);
    const action = String(body.action || '');
    const code = String(body.code || '').trim().toUpperCase();

    if (isCoop) {
      if (terminalRoom && action === 'status' && code === terminalRoom) return new Promise(() => {});
      const token = String(window.MLLastAriaAccessToken || '').trim();
      const headers = new Headers(init.headers || (typeof input !== 'string' ? input?.headers : undefined) || {});
      if (token) headers.set('authorization', `Bearer ${token}`);
      if (action === 'complete') {
        body = {
          ...body,
          elapsedSeconds: clampInt(body.elapsedSeconds, 1, 21600, 60),
          hintsUsed: clampInt(body.hintsUsed, 0, 10, 0),
          attempts: clampInt(body.attempts, 1, 20, 1),
        };
      }
      nextInit = { ...init, headers, body: init.body ? JSON.stringify(body) : init.body };
    } else if (isCheckout) {
      body = prepareCheckout(body);
      nextInit = { ...init, body: JSON.stringify(body) };
    }

    const submittedAttempts = isCoop && action === 'complete' ? Number(requestBody(init).attempts || 0) : 0;
    try {
      const response = await nativeFetch(input, nextInit);
      let payload = null;
      try { payload = await response.clone().json(); } catch {}

      if (isCheckout) {
        if (response.ok && payload) rememberCheckout(payload);
        if (!response.ok && ['request_id_conflict', 'request_provider_conflict'].includes(String(payload?.error || ''))) clearPaymentFlight();
      }

      if (isStatus && payload) {
        if (payload.entitled === true && payload.status !== 'refunded') {
          clearPaymentFlight();
          if (payload.status !== 'paid') return responseWithJson(response, { ...payload, status: 'paid' });
        } else if (['creating', 'pending'].includes(String(payload.status || ''))) {
          rememberPending(payload);
        } else if (['canceled', 'refunded', 'failed'].includes(String(payload.status || ''))) {
          clearPaymentFlight();
        }
      }

      if (isCoop) {
        if (action === 'join' && response.ok && payload?.error === 'not_joined') {
          return responseWithJson(response, { error: 'room_full' }, 409);
        }
        if (!response.ok && action === 'status' && TERMINAL_ROOM_ERRORS.has(String(payload?.error || ''))) {
          showTerminalRoom(code, String(payload.error));
        }
        if (response.ok && payload?.me?.role) normalizeProgress(code, payload.me.role, Boolean(payload.me.completed));
        if (!response.ok && action === 'complete' && submittedAttempts > 0) rollbackCompleteAttempt(code, submittedAttempts);
      }
      return response;
    } catch (error) {
      if (isCoop && action === 'complete' && submittedAttempts > 0) rollbackCompleteAttempt(code, submittedAttempts);
      throw error;
    }
  };

  window.__MLLastAriaStateSpace = Object.freeze({
    revision: '2.0',
    normalizeProgress,
    prepareCheckout,
    clearPaymentFlight,
    clampInt,
  });
})();