(() => {
  'use strict';

  const root = document.querySelector('[data-partner-v2-app]');
  if (!root) return;

  const CASE_ID = root.dataset.partnerCaseId || '';
  const ENDPOINT = root.dataset.partnerEndpoint || '';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  const NICK_STORAGE = `mysterylogic:partner-v2:${CASE_ID}:nickname`;
  const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
  const POLL_MS = 3000;

  let roomState = null;
  let pollTimer = null;
  let busy = false;
  let toastTimer = null;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const randomKey = () => Array.from(
    crypto.getRandomValues(new Uint8Array(24)),
    (value) => value.toString(16).padStart(2, '0')
  ).join('');

  const browserKey = () => {
    let value = localStorage.getItem(CLIENT_KEY_STORAGE) || '';
    if (!/^[a-f0-9]{48}$/.test(value)) {
      value = randomKey();
      localStorage.setItem(CLIENT_KEY_STORAGE, value);
    }
    return value;
  };

  const nickname = () => (localStorage.getItem(NICK_STORAGE) || 'Следователь').slice(0, 32);
  const cleanName = (value = '') => String(value).trim().replace(/\s+/g, ' ').slice(0, 32) || 'Следователь';
  const cleanCode = (value = '') => {
    const text = String(value).trim().toUpperCase();
    if (CODE_RE.test(text)) return text;
    return text.match(/[A-HJ-NP-Z2-9]{8}/)?.[0] || '';
  };
  const membershipKey = (code) => `mysterylogic:partner-v2:${CASE_ID}:joined:${cleanCode(code)}`;
  const wasJoined = (code) => localStorage.getItem(membershipKey(code)) === '1';
  const markJoined = (code) => localStorage.setItem(membershipKey(code), '1');
  const forgetJoined = (code) => localStorage.removeItem(membershipKey(code));

  const track = (event, params = {}) => {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event, page_type: 'partner_v2_zero_container', ...params });
    } catch {}
    try {
      if (typeof window.ym === 'function') {
        window.ym(111664459, 'reachGoal', event, { page_type: 'partner_v2_zero_container', ...params });
      }
    } catch {}
  };

  const api = async (body) => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ ...body, browserKey: browserKey() }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  };

  const errorText = (error) => ({
    room_not_found: 'Комната с таким кодом не найдена.',
    room_expired: 'Срок комнаты истек. Создайте новое расследование.',
    room_full: 'В комнате уже два игрока.',
    room_rate_limited: 'Слишком много новых комнат за короткое время. Попробуйте немного позже.',
    wrong_case: 'Этот код относится к другому расследованию Mystery Logic.',
    not_joined: 'Сначала войдите в комнату.',
    partner_not_joined: 'Второй игрок еще не подключился.',
    unsupported_case: 'Это расследование пока недоступно.',
    state_conflict: 'Напарник только что обновил состояние дела.'
  }[error?.message] || 'Не удалось связаться с комнатой. Попробуйте еще раз.');

  const setRoomQuery = (code) => {
    const url = new URL(location.href);
    if (code) url.searchParams.set('room', code);
    else url.searchParams.delete('room');
    history.replaceState(null, '', url);
  };

  const inviteUrl = (code) => {
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set('room', code);
    return url.href;
  };

  const clearPoll = () => {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = null;
  };

  const toast = (message) => {
    document.querySelector('.partner-v2-toast')?.remove();
    const node = document.createElement('div');
    node.className = 'partner-v2-toast';
    node.textContent = message;
    document.body.appendChild(node);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.remove(), 3200);
  };

  const shell = (inner) => {
    root.innerHTML = `<div class="partner-v2-shell">${inner}</div>`;
  };

  const panel = (kicker, title, lead, inner = '') => `
    <section class="partner-v2-panel">
      <p class="partner-v2-kicker">${escapeHtml(kicker)}</p>
      <h2>${escapeHtml(title)}</h2>
      ${lead ? `<p>${escapeHtml(lead)}</p>` : ''}
      ${inner}
    </section>`;

  const roleCard = (mark, title, text, extra = '') => `
    <div class="partner-v2-role ${extra}">
      <i>${escapeHtml(mark)}</i>
      <div><small>Роль</small><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>
    </div>`;

  const renderHome = (message = '') => {
    clearPoll();
    roomState = null;
    shell(`
      <section class="partner-v2-cover">
        <div class="partner-v2-cover-copy">
          <p class="partner-v2-kicker">Бесплатное дело для двоих · 40-50 минут</p>
          <h1>Нулевой<br><em>контейнер</em></h1>
          <p>Он прибыл вовремя. Пломба цела. Вес совпадает. Но груз исчез.</p>
          <div class="partner-v2-actions">
            <button class="partner-v2-button is-primary" type="button" data-action="create-open">Создать расследование</button>
            <button class="partner-v2-button" type="button" data-action="join-focus">У меня есть код</button>
          </div>
        </div>
        <div class="partner-v2-cover-card" aria-hidden="true">
          <small>СОСТАВ 214</small>
          <strong>CAXU 771204 2</strong>
          <span>03:08 · ЮЖНЫЙ ТЕРМИНАЛ</span>
          <b>МАССА СОВПАДАЕТ</b>
          <b>ПЛОМБА ЦЕЛА</b>
          <b>ГРУЗ ОТСУТСТВУЕТ</b>
        </div>
      </section>
      ${message ? `<div class="partner-v2-error">${escapeHtml(message)}</div>` : ''}
      ${panel('Войти в существующее дело', 'Код комнаты', 'Введите код, который прислал второй игрок.', `
        <label class="partner-v2-field"><span>8 символов</span><input data-room-code maxlength="30" autocomplete="off" placeholder="Например, 7K4P9D2X"></label>
        <div class="partner-v2-actions"><button class="partner-v2-button" type="button" data-action="join-code">Войти</button></div>`)}
    `);
  };

  const renderCreate = (message = '') => shell(`
    ${panel('Новое расследование', 'Создать комнату', 'У игроков будут разные материалы. Первый игрок получает роль Маршрут, второй - роль Груз.', `
      ${message ? `<div class="partner-v2-error">${escapeHtml(message)}</div>` : ''}
      <label class="partner-v2-field"><span>Ваше имя</span><input data-player-name maxlength="32" autocomplete="nickname" value="${escapeHtml(nickname())}"></label>
      <div class="partner-v2-role-grid">
        ${roleCard('МР', 'Маршрут', 'Движение состава, инфраструктура, техника, связь')}
        ${roleCard('ГР', 'Груз', 'Документы, склад, персонал, заявки, доступ', 'is-cargo')}
      </div>
      <div class="partner-v2-actions">
        <button class="partner-v2-button" type="button" data-action="home">Назад</button>
        <button class="partner-v2-button is-primary" type="button" data-action="create">Создать комнату</button>
      </div>`)}
  `);

  const renderJoin = (code, preview, message = '') => shell(`
    ${panel('Вход по приглашению', `Вас ждут в деле «${preview?.room?.caseTitle || 'Нулевой контейнер'}»`, `${preview?.creatorName || 'Первый игрок'} уже открыл расследование. Вы получите роль Груз.`, `
      ${message ? `<div class="partner-v2-error">${escapeHtml(message)}</div>` : ''}
      <div class="partner-v2-room-code"><small>Код комнаты</small><strong>${escapeHtml(code)}</strong></div>
      <label class="partner-v2-field"><span>Ваше имя</span><input data-player-name maxlength="32" autocomplete="nickname" value="${escapeHtml(nickname())}"></label>
      ${preview?.roomFull ? '<div class="partner-v2-error">В этой комнате уже два игрока.</div>' : ''}
      <div class="partner-v2-actions">
        <button class="partner-v2-button" type="button" data-action="home">Назад</button>
        <button class="partner-v2-button is-primary" type="button" data-action="join" data-code="${escapeHtml(code)}" ${preview?.roomFull ? 'disabled' : ''}>Войти в дело</button>
      </div>`)}
  `);

  const scheduleLobbyPoll = () => {
    clearPoll();
    pollTimer = setTimeout(async () => {
      if (!roomState?.room?.code) return;
      const previous = roomState;
      try {
        const next = await api({ action: 'status', code: previous.room.code });
        const changed = next.bothJoined !== previous.bothJoined || next.me?.started !== previous.me?.started || next.opponent?.started !== previous.opponent?.started;
        roomState = next;
        if (next.me?.started) renderGame(next);
        else if (changed) renderLobby(next);
        else scheduleLobbyPoll();
      } catch {
        roomState = previous;
        scheduleLobbyPoll();
      }
    }, POLL_MS);
  };

  const renderLobby = (state, message = '') => {
    clearPoll();
    roomState = state;
    const other = state.opponent?.joined ? state.opponent.name : 'Ожидаем второго игрока';
    shell(`
      ${panel('Комната создана', state.case?.title || 'Нулевой контейнер', 'После старта каждый увидит только свой пакет материалов.', `
        ${message ? `<div class="partner-v2-error">${escapeHtml(message)}</div>` : ''}
        <div class="partner-v2-room-code"><small>Код комнаты</small><strong>${escapeHtml(state.room.code)}</strong></div>
        <div class="partner-v2-role-grid">
          ${roleCard(state.me.roleMark, state.me.roleTitle, state.me.roleShort)}
          ${roleCard(state.me.role === 'creator' ? 'ГР' : 'МР', state.me.role === 'creator' ? 'Груз' : 'Маршрут', state.me.role === 'creator' ? 'Документы, склад, персонал, заявки, доступ' : 'Движение состава, инфраструктура, техника, связь', 'is-cargo')}
        </div>
        <div class="partner-v2-status-line"><span>Напарник</span><strong>${escapeHtml(other)}</strong></div>
        <div class="partner-v2-actions">
          <button class="partner-v2-button" type="button" data-action="copy">Скопировать приглашение</button>
          ${navigator.share ? '<button class="partner-v2-button" type="button" data-action="share">Отправить ссылку</button>' : ''}
          <button class="partner-v2-button is-primary" type="button" data-action="start" ${state.bothJoined ? '' : 'disabled'}>Начать расследование</button>
        </div>`)}
    `);
    scheduleLobbyPoll();
  };

  const evidenceHtml = (item) => {
    const facts = (item.facts || []).length
      ? `<div class="partner-v2-facts">${item.facts.map((fact) => `<span>${escapeHtml(fact)}</span>`).join('')}</div>`
      : '';
    const body = (item.body || []).map((text) => `<p>${escapeHtml(text)}</p>`).join('');
    const quote = item.quote ? `<blockquote>${escapeHtml(item.quote)}</blockquote>` : '';
    const special = item.type === 'photo'
      ? `<div class="partner-v2-photo-placeholder"><small>ФОТОМАТЕРИАЛ</small><strong>${escapeHtml(item.payload?.imageKey || item.id)}</strong><span>Точное игровое изображение будет подключено отдельным визуальным пакетом.</span></div>`
      : item.type === 'map'
        ? `<div class="partner-v2-map-mini"><span>ГЛАВНЫЙ ПУТЬ</span><b>ПЕТЛЯ Б</b><i>ТЕХПЛОЩАДКА</i><em>БОКС 3</em></div>`
        : '';
    return `<article class="partner-v2-evidence" data-evidence-id="${escapeHtml(item.id)}">
      <div class="partner-v2-evidence-head"><span>${escapeHtml(item.tag)}</span><b>${escapeHtml(item.id)}</b></div>
      <h3>${escapeHtml(item.title)}</h3>
      ${special}${body}${quote}${facts}
    </article>`;
  };

  const hypothesisHtml = (state) => {
    if (state.me.firstHypothesis) {
      const option = (state.case.initialHypothesisOptions || []).find((item) => item.id === state.me.firstHypothesis);
      return `<section class="partner-v2-checkpoint is-complete">
        <p class="partner-v2-kicker">Первая версия зафиксирована</p>
        <h3>${escapeHtml(option?.label || state.me.firstHypothesis)}</h3>
        <p>${state.state.shared.initialHypothesesComplete ? 'Оба игрока зафиксировали версии. Открыт следующий пакет.' : 'Ожидаем первую версию напарника. Ответ можно обсуждать, но изменить его уже нельзя.'}</p>
      </section>`;
    }

    return `<section class="partner-v2-checkpoint">
      <p class="partner-v2-kicker">Первая версия</p>
      <h3>Когда, по вашему мнению, исчез груз?</h3>
      <p>Это не экзамен. Версия сохраняется, чтобы в финале сравнить ее с вашей реконструкцией.</p>
      <div class="partner-v2-options">
        ${(state.case.initialHypothesisOptions || []).map((option) => `<button class="partner-v2-option" type="button" data-action="hypothesis" data-value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</button>`).join('')}
      </div>
    </section>`;
  };

  const boardHtml = (state) => {
    const chapter = state.state.chapter;
    const facts = [
      chapter >= 1 ? 'Состав №214 остановился на Векторе-12.' : '',
      state.me.role === 'creator' ? 'У вас есть независимые данные о движении состава.' : 'У вас есть исходные документы и контроль склада.',
      state.state.shared.initialHypothesesComplete ? 'Оба игрока зафиксировали первую версию.' : 'Первая версия напарника еще не получена.',
      chapter >= 2 ? 'Открыт пакет «16 минут».' : ''
    ].filter(Boolean);
    return `<aside class="partner-v2-board">
      <p class="partner-v2-kicker">Доска дела</p>
      <h3>Что уже установлено</h3>
      ${facts.map((fact) => `<div class="partner-v2-board-row"><i></i><span>${escapeHtml(fact)}</span></div>`).join('')}
    </aside>`;
  };

  const scheduleGamePoll = () => {
    clearPoll();
    pollTimer = setTimeout(async () => {
      if (!roomState?.room?.code) return;
      const previous = roomState;
      try {
        const next = await api({ action: 'status', code: previous.room.code });
        const changed = next.state?.revision !== previous.state?.revision || next.state?.chapter !== previous.state?.chapter || next.me?.firstHypothesis !== previous.me?.firstHypothesis;
        roomState = next;
        if (changed) {
          if ((next.state?.chapter || 0) > (previous.state?.chapter || 0)) {
            toast('Напарник завершил checkpoint. Открыт новый пакет материалов.');
          }
          renderGame(next);
        } else {
          scheduleGamePoll();
        }
      } catch {
        roomState = previous;
        scheduleGamePoll();
      }
    }, POLL_MS);
  };

  const renderGame = (state, message = '') => {
    clearPoll();
    roomState = state;
    const chapter = state.state.chapter || 1;
    const currentChapter = (state.case.chapters || []).find((item) => item.id === chapter) || state.case.chapters?.[0];
    const evidence = state.evidence || [];
    const chapterOneEvidence = evidence.filter((item) => item.chapter === 1);
    const laterEvidence = evidence.filter((item) => item.chapter > 1);

    shell(`
      <header class="partner-v2-topbar">
        <div><small>${escapeHtml(state.case.title)}</small><strong>${escapeHtml(state.me.roleTitle)}</strong><span>Комната ${escapeHtml(state.room.code)}</span></div>
        <button class="partner-v2-button is-small" type="button" data-action="copy">Приглашение</button>
      </header>
      <section class="partner-v2-brief">
        <p class="partner-v2-kicker">${escapeHtml(state.case.brief.kicker)}</p>
        <h2>${escapeHtml(state.case.brief.lead)}</h2>
        <p>${escapeHtml(state.case.brief.mission)}</p>
        <div class="partner-v2-role-badge"><b>${escapeHtml(state.me.roleMark)}</b><span><small>Ваш допуск</small>${escapeHtml(state.me.roleTitle)}: ${escapeHtml(state.me.roleShort)}</span></div>
      </section>
      ${message ? `<div class="partner-v2-error">${escapeHtml(message)}</div>` : ''}
      <div class="partner-v2-game-grid">
        <main>
          <section class="partner-v2-chapter-head">
            <small>Глава ${chapter}</small>
            <h2>${escapeHtml(currentChapter?.title || '')}</h2>
            <p>${escapeHtml(currentChapter?.objective || '')}</p>
          </section>
          <div class="partner-v2-evidence-grid">${chapterOneEvidence.map(evidenceHtml).join('')}</div>
          ${chapter === 1 ? hypothesisHtml(state) : ''}
          ${laterEvidence.length ? `<section class="partner-v2-new-packet"><p class="partner-v2-kicker">Новый пакет</p><h2>16 минут</h2><div class="partner-v2-evidence-grid">${laterEvidence.map(evidenceHtml).join('')}</div><div class="partner-v2-next-slice"><strong>Partner V2 core работает.</strong><p>Следующий slice подключит сравнение двух фотографий контейнера и синхронный checkpoint на двух устройствах.</p></div></section>` : ''}
        </main>
        ${boardHtml(state)}
      </div>
    `);
    scheduleGamePoll();
  };

  const createRoom = async () => {
    if (busy) return;
    busy = true;
    const name = cleanName(root.querySelector('[data-player-name]')?.value || nickname());
    localStorage.setItem(NICK_STORAGE, name);
    try {
      const state = await api({ action: 'create', caseId: CASE_ID, playerName: name });
      setRoomQuery(state.room.code);
      markJoined(state.room.code);
      roomState = state;
      track('zero_room_created', { room_code: state.room.code });
      renderLobby(state);
    } catch (error) {
      renderCreate(errorText(error));
    } finally {
      busy = false;
    }
  };

  const previewRoom = async (code) => {
    if (wasJoined(code)) {
      try {
        const state = await api({ action: 'status', code });
        setRoomQuery(code);
        if (state.me?.started) renderGame(state);
        else renderLobby(state);
        return;
      } catch (error) {
        if (error.message === 'not_joined') forgetJoined(code);
        else {
          renderHome(errorText(error));
          return;
        }
      }
    }

    try {
      const preview = await api({ action: 'preview', code });
      setRoomQuery(code);
      renderJoin(code, preview);
    } catch (error) {
      renderHome(errorText(error));
    }
  };

  const joinRoom = async (code) => {
    if (busy) return;
    busy = true;
    const name = cleanName(root.querySelector('[data-player-name]')?.value || nickname());
    localStorage.setItem(NICK_STORAGE, name);
    try {
      const state = await api({ action: 'join', code, playerName: name });
      markJoined(code);
      roomState = state;
      track('zero_partner_joined', { room_code: code });
      renderLobby(state);
    } catch (error) {
      try { renderJoin(code, await api({ action: 'preview', code }), errorText(error)); }
      catch { renderHome(errorText(error)); }
    } finally {
      busy = false;
    }
  };

  const startGame = async () => {
    if (!roomState?.bothJoined || busy) return;
    busy = true;
    try {
      const state = await api({ action: 'start', code: roomState.room.code });
      track('zero_started', { room_code: state.room.code, role: state.me.role });
      renderGame(state);
    } catch (error) {
      renderLobby(roomState, errorText(error));
    } finally {
      busy = false;
    }
  };

  const postHypothesis = async (value, state, allowRetry) => {
    try {
      return await api({
        action: 'submit_checkpoint',
        code: state.room.code,
        checkpointId: 'initial_hypothesis',
        value,
        clientRevision: state.state.revision,
      });
    } catch (error) {
      if (allowRetry && error.message === 'state_conflict') {
        const fresh = await api({ action: 'status', code: state.room.code });
        if (fresh.me.firstHypothesis) return fresh;
        return postHypothesis(value, fresh, false);
      }
      throw error;
    }
  };

  const submitHypothesis = async (value) => {
    if (!roomState || busy || roomState.me.firstHypothesis) return;
    busy = true;
    try {
      const state = await postHypothesis(value, roomState, true);
      track('zero_first_hypothesis', { room_code: state.room.code, role: state.me.role, hypothesis: value });
      renderGame(state);
    } catch (error) {
      renderGame(roomState, errorText(error));
    } finally {
      busy = false;
    }
  };

  const copyInvite = async () => {
    if (!roomState?.room?.code) return;
    const url = inviteUrl(roomState.room.code);
    try {
      await navigator.clipboard.writeText(url);
      toast('Ссылка приглашения скопирована');
    } catch {
      prompt('Скопируйте ссылку:', url);
    }
  };

  const shareInvite = async () => {
    if (!roomState?.room?.code) return;
    const url = inviteUrl(roomState.room.code);
    const text = `Расследование «Нулевой контейнер». Код комнаты ${roomState.room.code}.`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Mystery Logic: Нулевой контейнер', text, url }); return; }
      catch (error) { if (error?.name === 'AbortError') return; }
    }
    await copyInvite();
  };

  root.addEventListener('click', (event) => {
    const target = event.target.closest?.('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'create-open') renderCreate();
    else if (action === 'join-focus') root.querySelector('[data-room-code]')?.focus();
    else if (action === 'home') { setRoomQuery(''); renderHome(); }
    else if (action === 'join-code') {
      const code = cleanCode(root.querySelector('[data-room-code]')?.value || '');
      if (code) previewRoom(code);
      else root.querySelector('[data-room-code]')?.focus();
    }
    else if (action === 'create') createRoom();
    else if (action === 'join') joinRoom(cleanCode(target.dataset.code || ''));
    else if (action === 'copy') copyInvite();
    else if (action === 'share') shareInvite();
    else if (action === 'start') startGame();
    else if (action === 'hypothesis') submitHypothesis(target.dataset.value || '');
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.matches('[data-room-code]')) {
      event.preventDefault();
      root.querySelector('[data-action="join-code"]')?.click();
    }
  });

  window.addEventListener('beforeunload', clearPoll);

  const initialCode = cleanCode(new URL(location.href).searchParams.get('room') || '');
  if (!CASE_ID || !ENDPOINT) {
    shell('<div class="partner-v2-error">Конфигурация Partner V2 не найдена.</div>');
  } else if (initialCode) {
    previewRoom(initialCode);
  } else {
    renderHome();
  }
})();