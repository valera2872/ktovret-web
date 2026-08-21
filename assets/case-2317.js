(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/coop-2317';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  const NICK_STORAGE = 'mysterylogic:2317:nickname';
  const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
  const data = window.MLCase2317;
  const root = document.querySelector('[data-case2317-app]');
  if (!root || !data) return;

  let roomState = null;
  let pollTimer = null;
  let busy = false;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const randomKey = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (value) => value.toString(16).padStart(2, '0')).join('');
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
    const match = text.match(/[A-HJ-NP-Z2-9]{8}/);
    return match?.[0] || '';
  };

  const track = (event, params = {}) => {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event, page_type: 'coop_2317', ...params });
    } catch {}
    try {
      if (typeof window.ym === 'function') window.ym(111664459, 'reachGoal', event, { page_type: 'coop_2317', ...params });
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
      throw error;
    }
    return payload;
  };

  const errorText = (error) => ({
    room_not_found: 'Комната с таким кодом не найдена.',
    room_expired: 'Срок комнаты истёк. Создайте новую игру.',
    room_full: 'В этой комнате уже два игрока.',
    room_rate_limited: 'Слишком много новых комнат за короткое время. Попробуйте чуть позже.',
    wrong_case: 'Этот код относится к другой игре Mystery Logic.',
    not_joined: 'Сначала войдите в комнату.',
  }[error?.message] || 'Не удалось связаться с комнатой. Попробуйте ещё раз.');

  const setRoomQuery = (code) => {
    const url = new URL(location.href);
    if (code) url.searchParams.set('room', code); else url.searchParams.delete('room');
    history.replaceState(null, '', url);
  };
  const inviteUrl = (code) => {
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set('room', code);
    return url.href;
  };
  const clearPoll = () => { if (pollTimer) clearTimeout(pollTimer); pollTimer = null; };
  const roleInfo = (role) => data.roles[role] || data.roles.creator;
  const roleName = (role) => roleInfo(role).title;
  const opponentRole = (role) => role === 'creator' ? 'guest' : 'creator';

  const shell = (inner) => { root.innerHTML = `<div class="case2317-app">${inner}</div>`; };
  const panel = (kicker, title, lead, inner = '') => `
    <section class="case2317-panel">
      <p class="case2317-eyebrow">${escapeHtml(kicker)}</p>
      <h2>${escapeHtml(title)}</h2>
      ${lead ? `<p>${escapeHtml(lead)}</p>` : ''}
      ${inner}
    </section>`;

  const renderHome = (message = '') => {
    clearPoll();
    roomState = null;
    shell(`
      <section class="case2317-cover">
        <div>
          <p class="case2317-eyebrow">Дело ML-2317 · 2 игрока · 45–60 минут</p>
          <h1>Последний звонок<br><em>в 23:17</em></h1>
          <p>В 23:17 Вера Лебедева звонит в экстренную службу. Через 46 секунд связь обрывается. Через час её автомобиль находят пустым.</p>
          <div class="case2317-actions"><button class="case2317-button is-primary" data-action="create-open">Создать комнату</button><button class="case2317-button" data-action="join-focus">У меня есть код</button></div>
        </div>
        <div class="case2317-clock" aria-hidden="true"><span>23</span><i>:</i><span>17</span><small>CALL ENDED · 00:46</small></div>
      </section>
      ${message ? `<div class="case2317-error">${escapeHtml(message)}</div>` : ''}
      ${panel('Войти в существующее дело', 'Код комнаты', 'Введите код, который прислал второй игрок.', `
        <label class="case2317-field"><span>8 символов</span><input data-room-code maxlength="30" autocomplete="off" placeholder="Например, 7K4P9D2X"></label>
        <div class="case2317-actions"><button class="case2317-button" data-action="join-code">Войти</button></div>`)}
    `);
  };

  const renderCreate = (message = '') => shell(`
    ${panel('Новое расследование', 'Создать комнату', 'Вы станете Следователем. Второй игрок автоматически получит роль Аналитика.', `
      ${message ? `<div class="case2317-error">${escapeHtml(message)}</div>` : ''}
      <label class="case2317-field"><span>Ваше имя</span><input data-player-name maxlength="32" autocomplete="nickname" value="${escapeHtml(nickname())}"></label>
      <div class="case2317-role-pair">
        <div class="case2317-role-slot"><i>СЛ</i><div><small>Игрок 1</small><strong>Следователь</strong><span>Протоколы, показания, осмотр</span></div></div>
        <div class="case2317-role-slot is-analyst"><i>АН</i><div><small>Игрок 2</small><strong>Аналитик</strong><span>Логи, переписки, цифровые следы</span></div></div>
      </div>
      <div class="case2317-actions"><button class="case2317-button" data-action="home">Назад</button><button class="case2317-button is-primary" data-action="create">Создать комнату</button></div>`)}
  `);

  const renderJoin = (code, preview, message = '') => shell(`
    ${panel('Вход по приглашению', 'Вас ждут в деле ML-2317', `${preview?.creatorName || 'Следователь'} уже открыл расследование. Вы получите роль Аналитика.`, `
      ${message ? `<div class="case2317-error">${escapeHtml(message)}</div>` : ''}
      <div class="case2317-room-code"><small>Код комнаты</small><strong>${escapeHtml(code)}</strong></div>
      <label class="case2317-field"><span>Ваше имя</span><input data-player-name maxlength="32" autocomplete="nickname" value="${escapeHtml(nickname())}"></label>
      <div class="case2317-role-slot is-analyst"><i>АН</i><div><small>Ваша роль</small><strong>Аналитик</strong><span>Переписки, логи, камеры, цифровые следы</span></div></div>
      <div class="case2317-actions"><button class="case2317-button" data-action="home">Назад</button><button class="case2317-button is-primary" data-action="join" data-code="${escapeHtml(code)}" ${preview?.roomFull ? 'disabled' : ''}>Войти в комнату</button></div>`)}
  `);

  const playerSlot = (role, player, mine) => {
    const info = roleInfo(role);
    const joined = Boolean(player?.joined || mine);
    const status = player?.completed ? 'заключение отправлено' : player?.started ? 'изучает материалы' : joined ? 'готов к старту' : 'ждём подключения';
    return `<div class="case2317-role-slot ${role === 'guest' ? 'is-analyst' : ''}"><i>${escapeHtml(info.mark)}</i><div><small>${mine ? 'Ваша роль' : 'Напарник'} · ${escapeHtml(info.title)}</small><strong>${escapeHtml(joined ? (player?.name || roomState?.me?.name || info.title) : 'Не подключён')}</strong><span>${escapeHtml(status)}</span></div></div>`;
  };

  const renderLobby = (state) => {
    clearPoll();
    roomState = state;
    const myRole = state.me.role;
    const otherRole = opponentRole(myRole);
    shell(`
      ${panel('Комната расследования', state.bothJoined ? 'Оба игрока на месте' : 'Ждём второго игрока', state.bothJoined ? 'Роли уже разделены. После старта у каждого откроется свой набор материалов.' : 'Отправьте ссылку напарнику. Код действует семь дней.', `
        <div class="case2317-room">
          <div class="case2317-room-code"><small>Код комнаты</small><strong>${escapeHtml(state.room.code)}</strong></div>
          <div class="case2317-role-pair">
            ${playerSlot(myRole, { ...state.me, joined: true }, true)}
            ${playerSlot(otherRole, state.opponent, false)}
          </div>
          ${state.bothJoined ? '' : '<div class="case2317-wait">Проверяем подключение второго игрока автоматически…</div>'}
          <div class="case2317-actions"><button class="case2317-button" data-action="copy">Копировать ссылку</button><button class="case2317-button" data-action="share">Пригласить</button><button class="case2317-button is-primary" data-action="start" ${state.bothJoined ? '' : 'disabled'}>${state.me.started ? 'Продолжить дело' : 'Начать расследование'}</button></div>
        </div>`)}
    `);
    scheduleLobbyPoll(state.room.code);
  };

  const scheduleLobbyPoll = (code) => {
    clearPoll();
    pollTimer = setTimeout(async () => {
      try {
        const next = await api({ action: 'status', code });
        const before = JSON.stringify({ bothJoined: roomState?.bothJoined, me: roomState?.me, opponent: roomState?.opponent });
        const after = JSON.stringify({ bothJoined: next.bothJoined, me: next.me, opponent: next.opponent });
        if (before !== after) renderByState(next); else scheduleLobbyPoll(code);
      } catch { scheduleLobbyPoll(code); }
    }, 3000);
  };

  const progressKey = (state) => `mysterylogic:2317:${state.room.code}:${state.me.role}`;
  const readProgress = (state) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(progressKey(state)) || '{}');
      return {
        stage: Math.min(3, Math.max(1, Number(parsed.stage) || 1)),
        viewStage: Math.min(3, Math.max(1, Number(parsed.viewStage) || Number(parsed.stage) || 1)),
        attempts: Math.max(0, Number(parsed.attempts) || 0),
        hints: Math.max(0, Math.min(data.hints.length, Number(parsed.hints) || 0)),
        startedAt: Number(parsed.startedAt) || Date.now(),
      };
    } catch { return { stage: 1, viewStage: 1, attempts: 0, hints: 0, startedAt: Date.now() }; }
  };
  const saveProgress = (state, progress) => localStorage.setItem(progressKey(state), JSON.stringify(progress));

  const evidenceHtml = (item, index) => {
    const paragraphs = (item.body || []).map((text) => `<p>${escapeHtml(text)}</p>`).join('');
    const facts = (item.facts || []).length ? `<div class="case2317-facts">${item.facts.map((fact) => `<span>${escapeHtml(fact)}</span>`).join('')}</div>` : '';
    const messages = (item.messages || []).length ? `<div class="case2317-messages">${item.messages.map(([name, text]) => `<div class="case2317-message"><b>${escapeHtml(name)}</b>${escapeHtml(text)}</div>`).join('')}</div>` : '';
    const quote = item.quote ? `<blockquote>${escapeHtml(item.quote)}</blockquote>` : '';
    const stamp = item.stamp ? `<span class="case2317-stamp">${escapeHtml(item.stamp)}</span>` : '';
    return `<article class="case2317-evidence" data-index="${String(index + 1).padStart(2, '0')}"><span class="tag">${escapeHtml(item.tag)}</span><h3>${escapeHtml(item.title)}</h3>${paragraphs}${messages}${quote}${facts}${stamp}</article>`;
  };

  const topbar = (state, progress) => {
    const info = roleInfo(state.me.role);
    return `<div class="case2317-topbar"><div class="case2317-topline"><div class="case2317-role-label"><b>${escapeHtml(info.title)}</b><span>· комната ${escapeHtml(state.room.code)}</span></div><button class="case2317-button" data-action="copy" type="button">Приглашение</button></div><div class="case2317-stage-tabs">${data.stages.map((stage) => `<button type="button" data-action="stage" data-stage="${stage.id}" class="${progress.viewStage === stage.id ? 'is-active' : ''}" ${stage.id > progress.stage ? 'disabled' : ''}>${stage.id}. ${escapeHtml(stage.title)}</button>`).join('')}</div></div>`;
  };

  const renderGame = (state, message = '') => {
    clearPoll();
    roomState = state;
    const progress = readProgress(state);
    saveProgress(state, progress);
    if (state.bothCompleted) { renderReveal(state, progress); return; }
    if (state.me.completed) { renderWaitingFinal(state, progress); return; }

    const info = roleInfo(state.me.role);
    const stage = data.stages.find((item) => item.id === progress.viewStage) || data.stages[0];
    const items = stage[info.key] || [];
    const nextAvailable = progress.stage < 3 && progress.viewStage === progress.stage;
    const atFinal = progress.stage === 3 && progress.viewStage === 3;
    const hintText = progress.hints > 0 ? data.hints[progress.hints - 1] : '';

    shell(`
      ${topbar(state, progress)}
      ${progress.viewStage === 1 ? `<section class="case2317-brief"><p class="case2317-eyebrow">${escapeHtml(data.brief.kicker)}</p><h2>${escapeHtml(data.title)}</h2><p>${escapeHtml(data.brief.lead)}</p><div class="case2317-mission">${escapeHtml(data.brief.mission)}</div></section>` : ''}
      <section>
        <div class="case2317-stage-head"><small>Этап ${stage.id} · ваш пакет материалов</small><h2>${escapeHtml(stage.title)}</h2><p>${escapeHtml(stage.objective)}</p></div>
        <div class="case2317-evidence-grid">${items.map(evidenceHtml).join('')}</div>
        <div class="case2317-crosscheck"><strong>Не пытайтесь решить это в одиночку.</strong><p>Расскажите напарнику, что кажется вам важным, и спросите, есть ли на его экране время, имя, номер или маршрут, который подтверждает вашу версию.</p></div>
        ${message ? `<div class="case2317-feedback is-wrong">${escapeHtml(message)}</div>` : ''}
        ${hintText ? `<div class="case2317-hint"><strong>Подсказка ${progress.hints}:</strong> ${escapeHtml(hintText)}</div>` : ''}
        <div class="case2317-stage-actions">
          <button class="case2317-button" data-action="hint" ${progress.hints >= data.hints.length ? 'disabled' : ''}>Нужна подсказка</button>
          ${nextAvailable ? `<button class="case2317-button is-primary" data-action="next-stage">Открыть этап ${progress.stage + 1}</button>` : ''}
        </div>
      </section>
      ${atFinal ? finalHtml() : ''}
    `);
  };

  const finalHtml = () => `<section class="case2317-final"><p class="case2317-eyebrow">Общее заключение</p><h2>Что произошло после звонка?</h2><p>${escapeHtml(data.final.intro)}</p><form data-final-form>${data.final.questions.map((question) => `<div class="case2317-question"><h3>${escapeHtml(question.title)}</h3><div class="case2317-options">${question.options.map(([value, label]) => `<label class="case2317-option"><input type="radio" name="${escapeHtml(question.id)}" value="${escapeHtml(value)}"><span>${escapeHtml(label)}</span></label>`).join('')}</div></div>`).join('')}<div class="case2317-actions"><button class="case2317-button is-primary" type="submit">Передать общее заключение</button></div></form></section>`;

  const renderWaitingFinal = (state, progress) => {
    shell(`${topbar(state, progress)}${panel('Заключение принято', 'Ваш напарник ещё работает', 'Развязка откроется только после того, как оба игрока передадут заключение.', `<div class="case2317-wait-final">Проверяем статус второго игрока автоматически…</div>`)}`);
    clearPoll();
    pollTimer = setTimeout(async () => {
      try { const next = await api({ action: 'status', code: state.room.code }); if (next.bothCompleted) renderReveal(next, progress); else renderWaitingFinal(next, progress); }
      catch { renderWaitingFinal(state, progress); }
    }, 3000);
  };

  const formatTime = (seconds) => {
    const value = Math.max(0, Number(seconds) || 0);
    const min = Math.floor(value / 60); const sec = value % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };
  const renderReveal = (state, progress) => {
    clearPoll();
    const creator = state.results?.creator;
    const guest = state.results?.guest;
    shell(`${topbar(state, progress)}<section class="case2317-reveal"><p class="case2317-eyebrow">Дело закрыто · оба заключения получены</p><h2>${escapeHtml(data.reveal.title)}</h2>${data.reveal.body.map((text) => `<p>${escapeHtml(text)}</p>`).join('')}<div class="case2317-closing">${escapeHtml(data.reveal.closing)}</div>${creator && guest ? `<div class="case2317-role-pair" style="margin-top:22px"><div class="case2317-role-slot"><i>СЛ</i><div><small>Следователь</small><strong>${escapeHtml(creator.name)}</strong><span>${formatTime(creator.elapsedSeconds)} · попыток: ${creator.attempts} · подсказок: ${creator.hintsUsed}</span></div></div><div class="case2317-role-slot is-analyst"><i>АН</i><div><small>Аналитик</small><strong>${escapeHtml(guest.name)}</strong><span>${formatTime(guest.elapsedSeconds)} · попыток: ${guest.attempts} · подсказок: ${guest.hintsUsed}</span></div></div>` : ''}<div class="case2317-actions"><a class="case2317-button is-primary" href="../">Выбрать другой формат для двоих</a></div></section>`);
    track('coop_2317_reveal', { room_code: state.room.code });
  };

  const renderByState = (state) => {
    roomState = state;
    if (state.room.caseId !== data.id) { renderHome('Этот код относится к другой игре Mystery Logic.'); return; }
    if (state.me.started || state.me.completed) renderGame(state); else renderLobby(state);
  };

  const createRoom = async () => {
    if (busy) return; busy = true;
    const name = cleanName(root.querySelector('[data-player-name]')?.value || nickname());
    localStorage.setItem(NICK_STORAGE, name);
    try {
      const state = await api({ action: 'create', playerName: name });
      setRoomQuery(state.room.code); roomState = state; track('coop_2317_room_created', { room_code: state.room.code }); renderLobby(state);
    } catch (error) { renderCreate(errorText(error)); }
    finally { busy = false; }
  };

  const previewRoom = async (code) => {
    try { const state = await api({ action: 'status', code }); setRoomQuery(code); renderByState(state); return; }
    catch (error) { if (error.message !== 'not_joined') { renderHome(errorText(error)); return; } }
    try { const preview = await api({ action: 'preview', code }); setRoomQuery(code); renderJoin(code, preview); }
    catch (error) { renderHome(errorText(error)); }
  };

  const joinRoom = async (code) => {
    if (busy) return; busy = true;
    const name = cleanName(root.querySelector('[data-player-name]')?.value || nickname());
    localStorage.setItem(NICK_STORAGE, name);
    try { const state = await api({ action: 'join', code, playerName: name }); roomState = state; track('coop_2317_room_joined', { room_code: code }); renderLobby(state); }
    catch (error) { try { renderJoin(code, await api({ action: 'preview', code }), errorText(error)); } catch { renderHome(errorText(error)); } }
    finally { busy = false; }
  };

  const startGame = async () => {
    if (!roomState?.bothJoined || busy) return; busy = true;
    try {
      const state = await api({ action: 'start', code: roomState.room.code });
      const progress = readProgress(state); if (!progress.startedAt) progress.startedAt = Date.now(); saveProgress(state, progress);
      track('coop_2317_started', { room_code: state.room.code, role: state.me.role }); renderGame(state);
    } catch (error) { renderLobby(roomState); }
    finally { busy = false; }
  };

  const copyInvite = async () => {
    if (!roomState?.room?.code) return;
    const url = inviteUrl(roomState.room.code);
    try { await navigator.clipboard.writeText(url); track('coop_2317_invite_copied', { room_code: roomState.room.code }); }
    catch { prompt('Скопируйте ссылку:', url); }
  };
  const shareInvite = async () => {
    if (!roomState?.room?.code) return;
    const url = inviteUrl(roomState.room.code);
    const text = `Расследование «Последний звонок в 23:17». Ты — ${roleName(opponentRole(roomState.me.role))}. Код комнаты ${roomState.room.code}.`;
    if (navigator.share) { try { await navigator.share({ title: data.title, text, url }); return; } catch (error) { if (error?.name === 'AbortError') return; } }
    await copyInvite();
  };

  const submitFinal = async (form) => {
    if (!roomState || busy) return;
    const progress = readProgress(roomState);
    const values = Object.fromEntries(new FormData(form).entries());
    if (data.final.questions.some((question) => !values[question.id])) { renderGame(roomState, 'Ответьте на все три вопроса и сверяйте каждый выбор с напарником.'); return; }
    progress.attempts += 1; saveProgress(roomState, progress);
    const correct = data.final.questions.every((question) => values[question.id] === question.answer);
    if (!correct) { track('coop_2317_final_wrong', { room_code: roomState.room.code, attempt: progress.attempts }); renderGame(roomState, 'В вашей реконструкции остаётся противоречие. Вернитесь к временным меткам: отдельно проследите телефон Веры, её автомобиль и машину Ильи.'); return; }
    busy = true;
    const elapsedSeconds = Math.max(1, Math.min(21600, Math.round((Date.now() - progress.startedAt) / 1000)));
    try {
      const next = await api({ action: 'complete', code: roomState.room.code, elapsedSeconds, hintsUsed: progress.hints, attempts: progress.attempts, firstAnswerCorrect: progress.attempts === 1 });
      track('coop_2317_completed', { room_code: roomState.room.code, role: roomState.me.role, attempts: progress.attempts });
      roomState = next; if (next.bothCompleted) renderReveal(next, progress); else renderWaitingFinal(next, progress);
    } catch { renderGame(roomState, 'Заключение верное, но сервер комнаты временно не ответил. Нажмите отправку ещё раз.'); }
    finally { busy = false; }
  };

  root.addEventListener('click', (event) => {
    const target = event.target.closest?.('[data-action]'); if (!target) return;
    const action = target.dataset.action;
    if (action === 'create-open') renderCreate();
    else if (action === 'join-focus') root.querySelector('[data-room-code]')?.focus();
    else if (action === 'home') { setRoomQuery(''); renderHome(); }
    else if (action === 'join-code') { const code = cleanCode(root.querySelector('[data-room-code]')?.value || ''); if (code) previewRoom(code); else root.querySelector('[data-room-code]')?.focus(); }
    else if (action === 'create') createRoom();
    else if (action === 'join') joinRoom(cleanCode(target.dataset.code || ''));
    else if (action === 'copy') copyInvite();
    else if (action === 'share') shareInvite();
    else if (action === 'start') startGame();
    else if (action === 'stage' && roomState) { const p = readProgress(roomState); const requested = Number(target.dataset.stage); if (requested >= 1 && requested <= p.stage) { p.viewStage = requested; saveProgress(roomState, p); renderGame(roomState); } }
    else if (action === 'next-stage' && roomState) { const p = readProgress(roomState); if (p.stage < 3) { p.stage += 1; p.viewStage = p.stage; saveProgress(roomState, p); track('coop_2317_stage_opened', { room_code: roomState.room.code, stage: p.stage }); renderGame(roomState); window.scrollTo({ top: 0, behavior: 'smooth' }); } }
    else if (action === 'hint' && roomState) { const p = readProgress(roomState); if (p.hints < data.hints.length) { p.hints += 1; saveProgress(roomState, p); track('coop_2317_hint', { room_code: roomState.room.code, hint: p.hints }); renderGame(roomState); } }
  });

  root.addEventListener('submit', (event) => { if (event.target.matches('[data-final-form]')) { event.preventDefault(); submitFinal(event.target); } });
  root.addEventListener('keydown', (event) => { if (event.key === 'Enter' && event.target.matches('[data-room-code]')) { event.preventDefault(); root.querySelector('[data-action="join-code"]')?.click(); } });
  window.addEventListener('beforeunload', clearPoll);

  const initialCode = cleanCode(new URL(location.href).searchParams.get('room') || '');
  if (initialCode) previewRoom(initialCode); else renderHome();
})();
