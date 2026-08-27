(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/reward-admin';
  const TOKEN_KEY = 'mysterylogic:review-admin-token:v1';
  const ACTIVATION_URL = 'https://mysterylogic.com/bonus/';

  const login = document.querySelector('[data-admin-login]');
  const app = document.querySelector('[data-admin-app]');
  const loginForm = document.querySelector('[data-admin-login-form]');
  const tokenInput = document.querySelector('[data-admin-token]');
  const loginError = document.querySelector('[data-admin-login-error]');
  const refreshButton = document.querySelector('[data-admin-refresh]');
  const lockButton = document.querySelector('[data-admin-lock]');
  const createForm = document.querySelector('[data-reward-create-form]');
  const targetSelect = document.querySelector('[data-reward-target]');
  const volumeOptions = document.querySelector('[data-volume-options]');
  const expirySelect = document.querySelector('[data-reward-expiry]');
  const noteInput = document.querySelector('[data-reward-note]');
  const createButton = document.querySelector('[data-reward-create]');
  const createStatus = document.querySelector('[data-reward-create-status]');
  const createdPanel = document.querySelector('[data-reward-created]');
  const createdCode = document.querySelector('[data-created-code]');
  const copyCodeButton = document.querySelector('[data-copy-code]');
  const copyMessageButton = document.querySelector('[data-copy-message]');
  const copyStatus = document.querySelector('[data-copy-status]');
  const list = document.querySelector('[data-reward-list]');
  const empty = document.querySelector('[data-reward-empty]');
  const listStatus = document.querySelector('[data-reward-list-status]');

  let token = '';
  let busy = false;
  let latestCreated = null;

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const setStatus = (node, text = '', kind = '') => {
    if (!node) return;
    node.textContent = text;
    node.dataset.kind = kind;
  };

  const request = async (path = '', options = {}) => {
    const response = await fetch(`${ENDPOINT}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      cache: 'no-store',
      credentials: 'omit',
    });
    let body = {};
    try { body = await response.json(); } catch {}
    if (!response.ok) throw new Error(body.error || `http_${response.status}`);
    return body;
  };

  const lock = () => {
    token = '';
    try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
    if (app) app.hidden = true;
    if (login) login.hidden = false;
    if (tokenInput) tokenInput.value = '';
  };

  const formatDate = (value) => {
    if (!value) return 'без срока';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  const loadCatalog = async () => {
    if (!volumeOptions) return;
    try {
      const response = await fetch('../../assets/generated/cases-index.json', { cache: 'no-store' });
      if (!response.ok) return;
      const catalog = await response.json();
      const premium = Array.isArray(catalog?.cases)
        ? catalog.cases.filter((item) => item?.access === 'premium' && item?.id && item?.slug && item?.title)
        : [];
      premium.sort((a, b) => Number(a.caseNumber || 999) - Number(b.caseNumber || 999) || String(a.title).localeCompare(String(b.title), 'ru'));
      for (const item of premium) {
        const option = document.createElement('option');
        option.value = `volume:${item.id}`;
        option.dataset.caseId = item.id;
        option.dataset.slug = item.slug;
        option.textContent = `${item.caseNumber ? `${String(item.caseNumber).padStart(3, '0')} · ` : ''}${item.title}`;
        volumeOptions.appendChild(option);
      }
    } catch {}
  };

  const renderList = (rewards = []) => {
    if (!list || !empty) return;
    list.innerHTML = '';
    empty.hidden = rewards.length > 0;
    for (const reward of rewards) {
      const item = document.createElement('article');
      item.className = `mlra-item${reward.status !== 'active' ? ' is-revoked' : ''}`;
      const activated = reward.activatedAt
        ? `<span class="is-ok">активирован ${esc(formatDateTime(reward.activatedAt))}</span>`
        : '<span class="is-warn">ещё не активирован</span>';
      const feedback = reward.feedbackAt ? `<span class="is-ok">отзыв ${esc(formatDateTime(reward.feedbackAt))}</span>` : '';
      const note = reward.note ? `<p><b>Пометка:</b> ${esc(reward.note)}</p>` : '';
      item.innerHTML = `<div><h3>${esc(reward.caseTitle)} · ${esc(reward.codeHint)}</h3>${note}<p>Создан ${esc(formatDateTime(reward.createdAt))} · действует до ${esc(formatDate(reward.expiresAt))}</p><div class="mlra-meta"><span>${esc(reward.productId)}</span>${activated}${feedback}${reward.activationCount > 1 ? `<span>открытий страницы: ${Number(reward.activationCount)}</span>` : ''}${reward.status !== 'active' ? '<span>отозван</span>' : ''}</div></div>${reward.status === 'active' ? `<button class="mlra-revoke" type="button" data-revoke-id="${esc(reward.id)}">Отозвать</button>` : ''}`;
      list.appendChild(item);
    }
  };

  const loadRewards = async () => {
    setStatus(listStatus, 'Обновляем список…');
    try {
      const body = await request('');
      renderList(body.rewards || []);
      setStatus(listStatus, '');
      return true;
    } catch (error) {
      if (error.message === 'unauthorized') {
        lock();
        if (loginError) loginError.textContent = 'Ключ не принят.';
        return false;
      }
      setStatus(listStatus, 'Не удалось загрузить выданные доступы.', 'error');
      return false;
    }
  };

  const unlock = async (candidate) => {
    token = String(candidate || '').trim();
    if (!/^MLADM-[A-Za-z0-9_-]{30,100}$/.test(token)) {
      if (loginError) loginError.textContent = 'Проверьте формат ключа MLADM.';
      return false;
    }
    const ok = await loadRewards();
    if (!ok) return false;
    try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
    if (login) login.hidden = true;
    if (app) app.hidden = false;
    if (loginError) loginError.textContent = '';
    return true;
  };

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    await unlock(tokenInput?.value || '');
    busy = false;
  });

  createForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    const option = targetSelect?.selectedOptions?.[0];
    const value = String(option?.value || '');
    const payload = {
      action: 'create',
      targetType: value.startsWith('volume:') ? 'volume_case' : 'last_aria',
      expiryDays: Number(expirySelect?.value || 90),
      note: String(noteInput?.value || '').trim(),
    };
    if (payload.targetType === 'volume_case') {
      payload.caseId = option?.dataset.caseId || '';
      payload.slug = option?.dataset.slug || '';
    }
    busy = true;
    if (createButton) createButton.disabled = true;
    setStatus(createStatus, 'Создаём защищённый код…');
    try {
      const body = await request('', { method: 'POST', body: JSON.stringify(payload) });
      latestCreated = body;
      if (createdCode) createdCode.textContent = body.code || '';
      if (createdPanel) createdPanel.hidden = false;
      setStatus(createStatus, `Готово: ${body.reward?.caseTitle || 'доступ создан'}. Полный код больше нигде не будет показан.`, 'ok');
      if (noteInput) noteInput.value = '';
      await loadRewards();
    } catch (error) {
      const messages = {
        premium_case_not_found: 'Это дело не найдено среди опубликованных платных дел.',
        invalid_case_target: 'Не удалось определить выбранное дело.',
        reward_create_failed: 'Не удалось создать код. Попробуйте ещё раз.',
      };
      setStatus(createStatus, messages[error.message] || 'Не удалось создать благодарственный код.', 'error');
    } finally {
      busy = false;
      if (createButton) createButton.disabled = false;
    }
  });

  list?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-revoke-id]');
    if (!button || busy) return;
    if (!confirm('Отозвать этот благодарственный доступ? Игрок больше не сможет открыть дело по коду.')) return;
    busy = true;
    button.disabled = true;
    try {
      await request('', { method: 'POST', body: JSON.stringify({ action: 'revoke', id: button.dataset.revokeId }) });
      await loadRewards();
    } catch {
      setStatus(listStatus, 'Не удалось отозвать доступ.', 'error');
    } finally {
      busy = false;
    }
  });

  const copyText = async (text, success) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setStatus(copyStatus, success, 'ok');
    } catch {
      setStatus(copyStatus, 'Браузер не дал доступ к буферу. Скопируй текст вручную.', 'error');
    }
  };

  copyCodeButton?.addEventListener('click', () => copyText(latestCreated?.code || '', 'Код скопирован.'));
  copyMessageButton?.addEventListener('click', () => {
    const title = latestCreated?.reward?.caseTitle || 'премиальное дело';
    const code = latestCreated?.code || '';
    const message = `Спасибо за внимательность и полезную обратную связь — она помогает нам делать Mystery Logic лучше. В знак благодарности мы открыли вам премиальное дело «${title}».\n\nВаш персональный код:\n${code}\n\nВведите его здесь: ${ACTIVATION_URL}\n\nПосле игры, если будет желание, там же можно оставить ещё один отзыв — в том числе критический.`;
    copyText(message, 'Готовое сообщение скопировано.');
  });

  refreshButton?.addEventListener('click', () => loadRewards());
  lockButton?.addEventListener('click', lock);

  loadCatalog();
  let saved = '';
  try { saved = sessionStorage.getItem(TOKEN_KEY) || ''; } catch {}
  if (saved) unlock(saved);
})();
