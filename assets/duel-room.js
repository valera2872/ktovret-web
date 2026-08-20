(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/duel-room';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  const NICKNAME_STORAGE = 'mysterylogic:duel:nickname';
  const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
  const root = document.querySelector('[data-duel-room-app]');
  if (!root) return;

  let cases = [];
  try {
    cases = JSON.parse(document.querySelector('[data-duel-room-cases]')?.textContent || '[]');
  } catch {
    cases = [];
  }

  let roomState = null;
  let pollTimer = null;
  let busy = false;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const randomKey = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  };

  const clientKey = () => {
    let value = localStorage.getItem(CLIENT_KEY_STORAGE) || '';
    if (!/^[a-f0-9]{48}$/.test(value)) {
      value = randomKey();
      localStorage.setItem(CLIENT_KEY_STORAGE, value);
    }
    return value;
  };

  const nickname = () => (localStorage.getItem(NICKNAME_STORAGE) || 'Следователь').slice(0, 32);

  const cleanCode = (value = '') => {
    const text = String(value).trim().toUpperCase();
    if (CODE_RE.test(text)) return text;
    try {
      const url = new URL(text);
      const code = (url.searchParams.get('room') || '').trim().toUpperCase();
      return CODE_RE.test(code) ? code : '';
    } catch {
      const match = text.match(/[A-HJ-NP-Z2-9]{8}/);
      return match?.[0] || '';
    }
  };

  const track = (event, params = {}) => {
    if (!event) return;
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event, page_type: 'duel_room', ...params });
    } catch {}
    try {
      const counterId = Number(window.MYSTERYLOGIC_YM_COUNTER || 111664459);
      if (counterId > 0 && typeof window.ym === 'function') {
        window.ym(counterId, 'reachGoal', event, { page_type: 'duel_room', ...params });
      }
    } catch {}
  };

  const api = async (body) => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ ...body, browserKey: clientKey() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return data;
  };

  const errorText = (error) => {
    switch (error?.message) {
      case 'room_not_found': return 'Комната с таким кодом не найдена. Проверьте код или попросите новую ссылку.';
      case 'room_expired': return 'Срок комнаты истёк. Создайте новую игру.';
      case 'room_inactive': return 'Эта комната больше недоступна.';
      case 'room_full': return 'В комнате уже два игрока. Для новой пары создайте другую комнату.';
      case 'room_rate_limited': return 'Слишком много новых комнат за короткое время. Попробуйте немного позже.';
      case 'not_joined': return 'Сначала войдите в комнату.';
      default: return 'Не удалось связаться с игровой комнатой. Попробуйте ещё раз.';
    }
  };

  const setQueryCode = (code) => {
    const url = new URL(location.href);
    url.searchParams.set('room', code);
    history.replaceState(null, '', url);
  };

  const clearPoll = () => {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = null;
  };

  const inviteUrl = (code) => {
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set('room', code);
    return url.href;
  };

  const renderShell = (title, lead, content) => {
    root.innerHTML = `
      <div class="duel-app-header">
        <div>
          <p class="duel-kicker">Игра на двоих</p>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(lead)}</p>
        </div>
      </div>
      ${content}
    `;
  };

  const renderHome = (message = '') => {
    clearPoll();
    roomState = null;
    renderShell(
      'Начните за минуту',
      'Создайте комнату или введите код, который прислал второй игрок.',
      `<div class="duel-step">
        ${message ? `<div class="duel-error">${escapeHtml(message)}</div>` : ''}
        <div class="duel-choice-grid">
          <button class="duel-choice" type="button" data-duel-action="show-create">
            <b>Создать игру</b>
            <span>Выберите бесплатное дело и отправьте другу ссылку.</span>
          </button>
          <button class="duel-choice" type="button" data-duel-action="focus-code">
            <b>У меня есть код</b>
            <span>Войдите в комнату, которую уже создал друг.</span>
          </button>
        </div>
        <div class="duel-form">
          <label class="duel-field">
            <span>Код комнаты</span>
            <div class="duel-code-row">
              <input data-duel-code maxlength="80" inputmode="text" autocomplete="off" placeholder="Например, 7K4P9D2X">
              <button class="duel-button duel-button-secondary" type="button" data-duel-action="lookup-code">Войти</button>
            </div>
          </label>
        </div>
      </div>`,
    );
  };

  const renderCreate = (message = '') => {
    clearPoll();
    const cards = cases.map((item, index) => `
      <label class="duel-case-option">
        <input type="radio" name="duel-case" value="${escapeHtml(item.id)}" ${index === 0 ? 'checked' : ''}>
        <span class="duel-case-card">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.difficulty || 'Среднее')} · ≈ ${escapeHtml(item.minutes || 10)} минут</span>
        </span>
      </label>
    `).join('');

    renderShell(
      'Создать комнату',
      'Выберите дело. Оба игрока получат одинаковые материалы, но будут решать независимо.',
      `<div class="duel-step">
        ${message ? `<div class="duel-error">${escapeHtml(message)}</div>` : ''}
        <label class="duel-field">
          <span>Ваше имя в дуэли</span>
          <input data-duel-name maxlength="32" autocomplete="nickname" value="${escapeHtml(nickname())}" placeholder="Следователь">
        </label>
        <div>
          <p class="duel-kicker">Выберите бесплатное дело</p>
          <div class="duel-case-picker">${cards || '<div class="duel-error">Список бесплатных дел не загрузился.</div>'}</div>
        </div>
        <div class="duel-actions">
          <button class="duel-button duel-button-secondary" type="button" data-duel-action="home">Назад</button>
          <button class="duel-button duel-button-primary" type="button" data-duel-action="create" ${cases.length ? '' : 'disabled'}>Создать комнату</button>
        </div>
      </div>`,
    );
  };

  const renderJoin = (code, preview, message = '') => {
    clearPoll();
    renderShell(
      'Вас пригласили в расследование',
      preview?.room?.caseTitle || 'Войдите вторым игроком и получите то же дело.',
      `<div class="duel-step">
        ${message ? `<div class="duel-error">${escapeHtml(message)}</div>` : ''}
        <div class="duel-note"><strong>${escapeHtml(preview?.creatorName || 'Следователь')}</strong> уже создал комнату <strong>${escapeHtml(code)}</strong>. Результаты друг друга будут скрыты до финала.</div>
        ${preview?.roomFull ? '<div class="duel-error">В комнате уже есть второй игрок.</div>' : `
          <label class="duel-field">
            <span>Как вас подписать</span>
            <input data-duel-name maxlength="32" autocomplete="nickname" value="${escapeHtml(nickname())}" placeholder="Следователь">
          </label>
          <div class="duel-actions">
            <button class="duel-button duel-button-secondary" type="button" data-duel-action="home">На главную режима</button>
            <button class="duel-button duel-button-primary" type="button" data-duel-action="join" data-code="${escapeHtml(code)}">Войти в комнату</button>
          </div>
        `}
      </div>`,
    );
  };

  const statusLabel = (player, own = false) => {
    if (!player?.joined && !own) return 'Ждём подключения';
    if (player?.completed) return 'Расследование завершено';
    if (player?.started) return 'Сейчас расследует';
    return own ? 'Вы в комнате' : 'Готов к старту';
  };

  const renderLobby = (state) => {
    roomState = state;
    const code = state.room.code;
    const opponent = state.opponent || { joined: false };
    const startDisabled = !state.bothJoined || busy;
    const startText = state.me.completed ? 'Открыть результат дела' : state.me.started ? 'Продолжить расследование' : 'Начать расследование';

    renderShell(
      state.bothJoined ? 'Оба следователя на месте' : 'Комната создана',
      state.bothJoined ? 'Откройте одно и то же дело на своих устройствах. Чужой результат появится только после финала.' : 'Отправьте ссылку второму игроку. Как только он войдёт, можно начинать.',
      `<div class="duel-step">
        <div class="duel-room-head">
          <div class="duel-room-code"><small>Код комнаты</small><strong>${escapeHtml(code)}</strong></div>
          <div class="duel-actions">
            <button class="duel-button duel-button-secondary" type="button" data-duel-action="copy-invite">Копировать ссылку</button>
            <button class="duel-button duel-button-primary" type="button" data-duel-action="share-invite">Пригласить игрока</button>
          </div>
        </div>
        <div class="duel-room-case"><small>Общее дело</small><h3>${escapeHtml(state.room.caseTitle)}</h3></div>
        <div class="duel-player-grid">
          <div class="duel-player-slot is-ready">
            <small>Вы · ${escapeHtml(state.me.role === 'creator' ? 'создатель' : 'второй игрок')}</small>
            <strong>${escapeHtml(state.me.name)}</strong>
            <span>${escapeHtml(statusLabel({ joined: true, ...state.me }, true))}</span>
          </div>
          <div class="duel-player-slot ${opponent.joined ? 'is-ready' : ''}">
            <small>${opponent.joined ? 'Соперник' : 'Второе место'}</small>
            <strong>${escapeHtml(opponent.joined ? opponent.name : 'Ждём друга…')}</strong>
            <span>${escapeHtml(statusLabel(opponent))}</span>
          </div>
        </div>
        ${state.bothJoined ? '' : '<div class="duel-waiting">Проверяем подключение второго игрока автоматически</div>'}
        <div class="duel-actions">
          <button class="duel-button duel-button-primary" type="button" data-duel-action="start" ${startDisabled ? 'disabled' : ''}>${escapeHtml(startText)}</button>
          <button class="duel-button duel-button-quiet" type="button" data-duel-action="home">Другая комната</button>
        </div>
        <div class="duel-note">У каждого игрока отдельный прогресс этой дуэли. Обычные одиночные результаты не засчитываются и не перезаписываются.</div>
      </div>`,
    );
    schedulePoll(code);
  };

  const schedulePoll = (code) => {
    clearPoll();
    pollTimer = setTimeout(async () => {
      if (document.hidden) {
        schedulePoll(code);
        return;
      }
      try {
        const next = await api({ action: 'status', code });
        const changed = JSON.stringify({
          bothJoined: roomState?.bothJoined,
          me: roomState?.me,
          opponent: roomState?.opponent,
        }) !== JSON.stringify({
          bothJoined: next?.bothJoined,
          me: next?.me,
          opponent: next?.opponent,
        });
        if (changed) renderLobby(next);
        else schedulePoll(code);
      } catch {
        schedulePoll(code);
      }
    }, 3000);
  };

  const previewRoom = async (code) => {
    try {
      const state = await api({ action: 'status', code });
      setQueryCode(code);
      renderLobby(state);
      return;
    } catch (error) {
      if (error?.message !== 'not_joined') {
        renderHome(errorText(error));
        return;
      }
    }

    try {
      const preview = await api({ action: 'preview', code });
      setQueryCode(code);
      renderJoin(code, preview);
    } catch (error) {
      renderHome(errorText(error));
    }
  };

  const createRoom = async () => {
    if (busy) return;
    const selectedId = root.querySelector('input[name="duel-case"]:checked')?.value || '';
    const item = cases.find((value) => String(value.id) === selectedId);
    const input = root.querySelector('[data-duel-name]');
    const playerName = (input?.value || 'Следователь').trim().replace(/\s+/g, ' ').slice(0, 32) || 'Следователь';
    if (!item) {
      renderCreate('Выберите дело.');
      return;
    }
    busy = true;
    root.querySelector('[data-duel-action="create"]')?.setAttribute('disabled', '');
    track('duel_room_create_clicked', { case_id: item.id });
    try {
      localStorage.setItem(NICKNAME_STORAGE, playerName);
      const state = await api({
        action: 'create',
        playerName,
        caseId: item.id,
        caseTitle: item.title,
        casePath: item.path,
      });
      roomState = state;
      setQueryCode(state.room.code);
      track('duel_room_created', { case_id: item.id, room_code: state.room.code });
      renderLobby(state);
    } catch (error) {
      renderCreate(errorText(error));
    } finally {
      busy = false;
    }
  };

  const joinRoom = async (code) => {
    if (busy) return;
    const input = root.querySelector('[data-duel-name]');
    const playerName = (input?.value || 'Следователь').trim().replace(/\s+/g, ' ').slice(0, 32) || 'Следователь';
    busy = true;
    root.querySelector('[data-duel-action="join"]')?.setAttribute('disabled', '');
    try {
      localStorage.setItem(NICKNAME_STORAGE, playerName);
      const state = await api({ action: 'join', code, playerName });
      roomState = state;
      setQueryCode(code);
      track('duel_room_joined', { case_id: state.room.caseId, room_code: code });
      renderLobby(state);
    } catch (error) {
      try {
        const preview = await api({ action: 'preview', code });
        renderJoin(code, preview, errorText(error));
      } catch {
        renderHome(errorText(error));
      }
    } finally {
      busy = false;
    }
  };

  const startCase = async () => {
    if (!roomState?.bothJoined || busy) return;
    busy = true;
    try {
      const state = await api({ action: 'start', code: roomState.room.code });
      track('duel_case_started', { case_id: state.room.caseId, room_code: state.room.code });
      const target = new URL(state.room.casePath, location.origin);
      target.searchParams.set('duel', state.room.code);
      location.href = target.href;
    } catch (error) {
      busy = false;
      renderLobby(roomState);
      const note = document.createElement('div');
      note.className = 'duel-error';
      note.textContent = errorText(error);
      root.querySelector('.duel-step')?.prepend(note);
    }
  };

  const copyInvite = async () => {
    if (!roomState?.room?.code) return;
    const url = inviteUrl(roomState.room.code);
    try {
      await navigator.clipboard.writeText(url);
      const button = root.querySelector('[data-duel-action="copy-invite"]');
      if (button) {
        const old = button.textContent;
        button.textContent = 'Ссылка скопирована';
        setTimeout(() => { if (button.isConnected) button.textContent = old; }, 1800);
      }
      track('duel_invite_copied', { room_code: roomState.room.code });
    } catch {
      prompt('Скопируйте ссылку:', url);
    }
  };

  const shareInvite = async () => {
    if (!roomState?.room?.code) return;
    const url = inviteUrl(roomState.room.code);
    const text = `Детективная игра на двоих: дело «${roomState.room.caseTitle}». Вход в комнату ${roomState.room.code}.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mystery Logic — игра на двоих', text, url });
        track('duel_invite_shared', { room_code: roomState.room.code });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    await copyInvite();
  };

  root.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-duel-action]');
    if (!button) return;
    const action = button.dataset.duelAction;
    if (action === 'show-create') {
      track('duel_create_opened');
      renderCreate();
    } else if (action === 'home') {
      const url = new URL(location.href);
      url.searchParams.delete('room');
      history.replaceState(null, '', url);
      renderHome();
    } else if (action === 'focus-code') {
      root.querySelector('[data-duel-code]')?.focus();
    } else if (action === 'lookup-code') {
      const code = cleanCode(root.querySelector('[data-duel-code]')?.value || '');
      if (!code) {
        const field = root.querySelector('[data-duel-code]');
        field?.focus();
        field?.setCustomValidity('Введите код из 8 символов');
        field?.reportValidity();
        field?.setCustomValidity('');
        return;
      }
      previewRoom(code);
    } else if (action === 'create') {
      createRoom();
    } else if (action === 'join') {
      joinRoom(cleanCode(button.dataset.code || ''));
    } else if (action === 'start') {
      startCase();
    } else if (action === 'copy-invite') {
      copyInvite();
    } else if (action === 'share-invite') {
      shareInvite();
    }
  });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || !event.target.matches('[data-duel-code]')) return;
    event.preventDefault();
    root.querySelector('[data-duel-action="lookup-code"]')?.click();
  });

  window.addEventListener('beforeunload', clearPoll);

  const initialCode = cleanCode(new URL(location.href).searchParams.get('room') || '');
  if (initialCode) previewRoom(initialCode);
  else renderHome();
})();
