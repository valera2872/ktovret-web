(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/coop-407';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  const NICK_STORAGE = 'mysterylogic:407:nickname';
  const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
  const data = window.MLCase407;
  const root = document.querySelector('[data-case407-app]');
  if (!root || !data) return;

  const v2Style = document.createElement('link');
  v2Style.rel = 'stylesheet';
  v2Style.href = '/assets/case-2317-v2.css?v=2';
  document.head.appendChild(v2Style);

  const HANDOFFS = {
    creator: {
      stage1: {
        prompt: 'У Аналитика есть идентификатор контроллера двери, в которую вошла Марта. Получите его у напарника и введите здесь.',
        expected: 'L-409',
        label: 'ID контроллера',
        unlockTitle: 'Дверь сопоставлена с планом отеля',
        unlockBody: 'Контроллер L-409 закреплён за физическим номером 409 независимо от латунной таблички. Охрана открыла именно эту дверь, когда пошла по указателю «407».'
      },
      stage3: {
        prompt: 'У Аналитика есть мастер-токен, которым открыт весь служебный маршрут. Введите его, чтобы сопоставить следы на погрузочной двери.',
        expected: 'HK-44',
        label: 'Мастер-токен',
        unlockTitle: 'След тележки подтверждён журналом двери',
        unlockBody: 'Вмятина на тележке совпадает с ограничителем двери LOADING-B1. В 01:18:41 её открыли токеном HK-44, выданным Елене Раевой.'
      }
    },
    guest: {
      stage1: {
        prompt: 'Следователь нашёл складскую гравировку на обратной стороне таблички. Получите код у напарника и сопоставьте его с реестром дверей.',
        expected: 'H-409',
        label: 'Код таблички',
        unlockTitle: 'Табличка «407» принадлежит другой двери',
        unlockBody: 'Складской реестр: H-409 изготовлена и принята для номера 409. Таблички 407 и 409 физически переставили между дверями.'
      },
      stage3: {
        prompt: 'Следователь получил лабораторный код эталона футляра, с которым совпали волокна в бельевой тележке. Получите код и проверьте восстановленную переписку.',
        expected: 'BR-220',
        label: 'Маркер футляра',
        unlockTitle: 'Футляр заранее назван в сообщении',
        unlockBody: 'За 18 минут до тревоги Марта пишет Елене: «Футляр BR-220 войдёт в мешок». Это связывает подготовку, тележку и вынесенный сапфир.'
      }
    }
  };
  const DECISION = {
    title: 'Какую зону проверить первой?',
    lead: 'Один срочный запрос откроет следующий пакет материалов. Обсудите выбор: неверная линия будет учтена в итоговом отчёте.',
    options: [
      { id: 'corridor', title: 'Гостевой коридор', text: 'Повторно проверить единственную камеру напротив двери.' },
      { id: 'appraiser', title: 'Оценщик Денис Левин', text: 'Поднять его звонки, такси и спор с владельцем сапфира.' },
      { id: 'service', title: 'Служебный маршрут', text: 'Запросить токены, лифт и погрузочную зону.' }
    ],
    correct: 'service',
    feedback: {
      corridor: 'Камера исправна и честно показывает: через гостевой коридор никто не выходил. Повторная выгрузка не объясняет второй выход физического 407.',
      appraiser: 'Денис скрыл встречу, но непрерывный маршрут такси подтверждён независимыми камерами. Его ложь — отдельный конфликт, а не путь из номера.',
      service: 'Новый пакет получен: HK-44 открывает SVC-407, вызывает служебный лифт и затем дверь LOADING-B1. Между событиями — меньше пяти минут.'
    }
  };
  const EVIDENCE_PICKS = [
    ['room_swap', 'H-409 и L-409: табличка и контроллер доказывают подмену номера'],
    ['duress', 'Журнал S-407: верный код Марты с намеренной цифрой 9'],
    ['service_route', 'HK-44, часы и служебный лифт фиксируют маршрут до B1'],
    ['tea', 'Чай в постановочной комнате налит около 00:50'],
    ['tickets', 'Два билета на рейс в 06:40'],
    ['denis_lie', 'Оценщик скрыл ночную встречу с Мартой']
  ];
  const EVIDENCE_CORRECT = new Set(['room_swap', 'duress', 'service_route']);

  let roomState = null;
  let pollTimer = null;
  let busy = false;
  let toastTimer = null;

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
  const normalizeToken = (value = '') => String(value).trim().toUpperCase().replace(/[–—−]/g, '-').replace(/\s+/g, '');

  const track = (event, params = {}) => {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event, page_type: 'coop_407', ...params });
    } catch {}
    try {
      if (typeof window.ym === 'function') window.ym(111664459, 'reachGoal', event, { page_type: 'coop_407', ...params });
    } catch {}
  };
  const api = async (body) => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ ...body, browserKey: browserKey() })
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
    not_joined: 'Сначала войдите в комнату.'
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

  const toast = (message) => {
    document.querySelector('.case2317-toast')?.remove();
    const node = document.createElement('div');
    node.className = 'case2317-toast';
    node.textContent = message;
    document.body.appendChild(node);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.remove(), 3200);
  };

  const renderHome = (message = '') => {
    clearPoll(); roomState = null;
    shell(`
      <section class="case2317-cover">
        <div>
          <p class="case2317-eyebrow">Дело ML-0407 · 2 игрока · 50–70 минут</p>
          <h1>Номер <em>407</em></h1>
          <p>В 01:12 сейф подаёт тихую тревогу. Через четыре минуты охрана находит запертый пустой номер, телефон хранительницы и футляр без сапфира. Камера не видела выхода.</p>
          <div class="case2317-actions"><button class="case2317-button is-primary" data-action="create-open">Создать комнату</button><button class="case2317-button" data-action="join-focus">У меня есть код</button></div>
        </div>
        <div class="case2317-clock case407-room-mark" aria-hidden="true"><span>4</span><i>0</i><span>7</span><small>SILENT ALARM · 01:12</small></div>
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
    ${panel('Вход по приглашению', 'Вас ждут в деле ML-0407', `${preview?.creatorName || 'Следователь'} уже открыл расследование. Вы получите роль Аналитика.`, `
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
    clearPoll(); roomState = state;
    const myRole = state.me.role;
    const otherRole = opponentRole(myRole);
    shell(`${panel('Комната расследования', state.bothJoined ? 'Оба игрока на месте' : 'Ждём второго игрока', state.bothJoined ? 'Роли разделены. Внутри дела вам придётся передавать друг другу сведения, которых нет на втором экране.' : 'Отправьте ссылку напарнику. Код действует семь дней.', `
      <div class="case2317-room"><div class="case2317-room-code"><small>Код комнаты</small><strong>${escapeHtml(state.room.code)}</strong></div>
      <div class="case2317-role-pair">${playerSlot(myRole, { ...state.me, joined: true }, true)}${playerSlot(otherRole, state.opponent, false)}</div>
      ${state.bothJoined ? '<div class="case2317-drop"><small>Правило дела</small><strong>Не показывайте экран целиком. Говорите, спорьте и передавайте только то, что считаете важным.</strong></div>' : '<div class="case2317-wait">Проверяем подключение второго игрока автоматически…</div>'}
      <div class="case2317-actions"><button class="case2317-button" data-action="copy">Копировать ссылку</button><button class="case2317-button" data-action="share">Пригласить</button><button class="case2317-button is-primary" data-action="start" ${state.bothJoined ? '' : 'disabled'}>${state.me.started ? 'Продолжить дело' : 'Начать расследование'}</button></div></div>`)} `);
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

  const progressKey = (state) => `mysterylogic:407:v1:${state.room.code}:${state.me.role}`;
  const freshProgress = () => ({
    stage: 1, viewStage: 1, finalAttempts: 0, hints: 0, startedAt: Date.now(), decisionMistakes: 0,
    decisions: [], handoffs: { stage1: false, stage3: false }, evidencePicks: []
  });
  const readProgress = (state) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(progressKey(state)) || '{}');
      const base = freshProgress();
      return {
        ...base, ...parsed,
        stage: Math.min(3, Math.max(1, Number(parsed.stage) || 1)),
        viewStage: Math.min(3, Math.max(1, Number(parsed.viewStage) || Number(parsed.stage) || 1)),
        finalAttempts: Math.max(0, Number(parsed.finalAttempts) || Number(parsed.attempts) || 0),
        hints: Math.max(0, Math.min(data.hints.length, Number(parsed.hints) || 0)),
        startedAt: Number(parsed.startedAt) || Date.now(),
        decisionMistakes: Math.max(0, Number(parsed.decisionMistakes) || 0),
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
        handoffs: { ...base.handoffs, ...(parsed.handoffs || {}) },
        evidencePicks: Array.isArray(parsed.evidencePicks) ? parsed.evidencePicks : []
      };
    } catch { return freshProgress(); }
  };
  const saveProgress = (state, progress) => localStorage.setItem(progressKey(state), JSON.stringify(progress));

  const evidenceHtml = (item, index, state, progress) => {
    const paragraphs = (item.body || []).map((text) => `<p>${escapeHtml(text)}</p>`).join('');
    const facts = (item.facts || []).length ? `<div class="case2317-facts">${item.facts.map((fact) => `<span>${escapeHtml(fact)}</span>`).join('')}</div>` : '';
    const messages = (item.messages || []).length ? `<div class="case2317-messages">${item.messages.map(([name, text]) => `<div class="case2317-message"><b>${escapeHtml(name)}</b>${escapeHtml(text)}</div>`).join('')}</div>` : '';
    const quote = item.quote ? `<blockquote>${escapeHtml(item.quote)}</blockquote>` : '';
    const stamp = item.stamp ? `<span class="case2317-stamp">${escapeHtml(item.stamp)}</span>` : '';
    const photo = item.image ? `<figure class="case407-evidence-photo"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.title)}" loading="eager" width="1600" height="900"><figcaption>Фотоматериал следственной группы · без ретуши улик</figcaption></figure>` : '';
    return `<article class="case2317-evidence ${item.image ? 'has-photo' : ''}" data-index="${String(index + 1).padStart(2, '0')}"><span class="tag">${escapeHtml(item.tag)}</span><h3>${escapeHtml(item.title)}</h3>${photo}${paragraphs}${messages}${quote}${facts}${stamp}</article>`;
  };

  const topbar = (state, progress) => {
    const info = roleInfo(state.me.role);
    return `<div class="case2317-topbar"><div class="case2317-topline"><div class="case2317-role-label"><b>${escapeHtml(info.title)}</b><span>· комната ${escapeHtml(state.room.code)}</span></div><button class="case2317-button" data-action="copy" type="button">Приглашение</button></div><div class="case2317-stage-tabs">${data.stages.map((stage) => `<button type="button" data-action="stage" data-stage="${stage.id}" class="${progress.viewStage === stage.id ? 'is-active' : ''}" ${stage.id > progress.stage ? 'disabled' : ''}>${stage.id}. ${escapeHtml(stage.title)}</button>`).join('')}</div></div>`;
  };
  const handoffHtml = (state, progress, stageId) => {
    const key = stageId === 1 ? 'stage1' : 'stage3';
    const config = HANDOFFS[state.me.role]?.[key];
    if (!config) return '';
    const done = Boolean(progress.handoffs[key]);
    return `<section class="case2317-handoff ${done ? 'is-complete' : ''}">
      <p class="case2317-eyebrow">Передача между ролями</p>
      <h3>${done ? 'Материал разблокирован' : 'Нужна информация с другого экрана'}</h3>
      <p>${escapeHtml(done ? config.unlockBody : config.prompt)}</p>
      ${done ? `<div class="case2317-handoff-result"><strong>${escapeHtml(config.unlockTitle)}</strong></div>` : `<div class="case2317-handoff-row"><input data-handoff-input data-handoff-key="${key}" placeholder="${escapeHtml(config.label)}" autocomplete="off"><button class="case2317-button is-primary" type="button" data-action="handoff" data-handoff-key="${key}">Проверить</button></div><div class="case2317-handoff-error" data-handoff-error></div>`}
    </section>`;
  };
  const decisionHtml = (progress) => {
    const solved = progress.decisions.includes(DECISION.correct);
    const last = progress.decisions.at(-1);
    const feedback = last ? DECISION.feedback[last] : '';
    return `<section class="case2317-decision">
      <p class="case2317-eyebrow">Оперативное решение · этап 2</p><h3>${escapeHtml(DECISION.title)}</h3><p>${escapeHtml(DECISION.lead)}</p>
      ${solved ? `<div class="case2317-decision-feedback is-right">${escapeHtml(DECISION.feedback.service)}</div><div class="case2317-drop"><small>Новые материалы получены</small><strong>HK-44 · SVC-407 → служебный лифт → LOADING-B1</strong></div>` : `<div class="case2317-decision-options">${DECISION.options.map((opt) => `<button class="case2317-decision-option" type="button" data-action="decision" data-decision="${opt.id}"><strong>${escapeHtml(opt.title)}</strong>${escapeHtml(opt.text)}</button>`).join('')}</div>${feedback ? `<div class="case2317-decision-feedback is-wrong">${escapeHtml(feedback)}</div>` : ''}`}
    </section>`;
  };
  const stageReady = (progress, stage) => {
    if (stage === 1) return Boolean(progress.handoffs.stage1);
    if (stage === 2) return progress.decisions.includes(DECISION.correct);
    if (stage === 3) return Boolean(progress.handoffs.stage3);
    return true;
  };
  const guidanceHtml = (progress, stage) => {
    const ready = stageReady(progress, stage.id);
    const next = stage.id === 1
      ? 'Изучите три материала, найдите служебный код своей роли и обменяйтесь кодами с напарником.'
      : stage.id === 2
        ? 'Сопоставьте архитектуру и цифровые журналы, затем вместе выберите одну приоритетную зону проверки.'
        : 'Сверьте маршрут до погрузочной зоны, обменяйтесь последними маркерами и подготовьте общее заключение.';
    return `<aside class="case407-guidance" aria-label="Ход расследования"><div><small>Ход расследования</small><strong>${ready ? (stage.id < 3 ? 'Совместное действие завершено' : 'Можно переходить к заключению') : 'Что делать сейчас'}</strong></div><p>${ready ? (stage.id < 3 ? 'Новый пакет материалов доступен кнопкой внизу этапа.' : 'Финальная форма открыта после материалов этапа.') : escapeHtml(next)}</p><span>${ready ? '✓' : `${stage.id}/3`}</span></aside>`;
  };

  const renderGame = (state, message = '') => {
    clearPoll(); roomState = state;
    const progress = readProgress(state); saveProgress(state, progress);
    if (state.bothCompleted) { renderReveal(state, progress); return; }
    if (state.me.completed) { renderWaitingFinal(state, progress); return; }
    const info = roleInfo(state.me.role);
    const stage = data.stages.find((item) => item.id === progress.viewStage) || data.stages[0];
    let items = stage[info.key] || [];
    const canAdvance = stageReady(progress, progress.stage);
    const nextAvailable = progress.stage < 3 && progress.viewStage === progress.stage && canAdvance;
    const atFinal = progress.stage === 3 && progress.viewStage === 3 && stageReady(progress, 3);
    const hintText = progress.hints > 0 ? data.hints[progress.hints - 1] : '';
    const special = progress.viewStage === 1 ? handoffHtml(state, progress, 1) : progress.viewStage === 2 ? decisionHtml(progress) : handoffHtml(state, progress, 3);
    shell(`
      ${topbar(state, progress)}
      ${progress.viewStage === 1 ? `<section class="case2317-brief"><p class="case2317-eyebrow">${escapeHtml(data.brief.kicker)}</p><h2>${escapeHtml(data.title)}</h2><p>${escapeHtml(data.brief.lead)}</p><div class="case2317-mission">${escapeHtml(data.brief.mission)}</div></section>` : ''}
      <section><div class="case2317-stage-head"><small>Этап ${stage.id} · ваш пакет материалов</small><h2>${escapeHtml(stage.title)}</h2><p>${escapeHtml(stage.objective)}</p></div>
      ${guidanceHtml(progress, stage)}
      <div class="case2317-evidence-grid">${items.map((item, index) => evidenceHtml(item, index, state, progress)).join('')}</div>
      ${special}
      <div class="case2317-crosscheck"><strong>Работайте голосом.</strong><p>Не пересылайте скриншоты. Сформулируйте напарнику, что именно вы считаете доказанным, и попросите его найти факт, который это подтверждает или разрушает.</p></div>
      ${message ? `<div class="case2317-feedback is-wrong">${escapeHtml(message)}</div>` : ''}
      ${hintText ? `<div class="case2317-hint"><strong>Подсказка ${progress.hints}:</strong> ${escapeHtml(hintText)}</div>` : ''}
      <div class="case2317-stage-actions"><button class="case2317-button" data-action="hint" ${progress.hints >= data.hints.length ? 'disabled' : ''}>Нужна подсказка</button>${nextAvailable ? `<button class="case2317-button is-primary" data-action="next-stage">Получить новые материалы</button>` : (!canAdvance && progress.viewStage === progress.stage ? '<span class="case2317-marker-note">Сначала завершите совместное действие этого этапа.</span>' : '')}</div>
      </section>${atFinal ? finalHtml(progress) : ''}
    `);
  };

  const finalHtml = (progress) => `<section class="case2317-final"><p class="case2317-eyebrow">Заключение следственной группы</p><h2>Восстановите маршрут из номера 407</h2><p>${escapeHtml(data.final.intro)}</p><form data-final-form>${data.final.questions.map((question) => `<div class="case2317-question"><h3>${escapeHtml(question.title)}</h3><div class="case2317-options">${question.options.map(([value, label]) => `<label class="case2317-option"><input type="radio" name="${escapeHtml(question.id)}" value="${escapeHtml(value)}"><span>${escapeHtml(label)}</span></label>`).join('')}</div></div>`).join('')}
    <div class="case2317-final-evidence"><h3>Выберите 3 ключевых доказательства</h3><p>Не всё найденное одинаково важно. Выберите именно те материалы, которые доказывают вашу реконструкцию.</p><div class="case2317-evidence-picks">${EVIDENCE_PICKS.map(([id, label]) => `<label class="case2317-pick"><input type="checkbox" name="evidence" value="${id}" ${progress.evidencePicks.includes(id) ? 'checked' : ''}><span>${escapeHtml(label)}</span></label>`).join('')}</div><p class="case2317-final-counter" data-pick-counter>Выбрано: ${progress.evidencePicks.length} из 3</p></div>
    <div class="case2317-actions"><button class="case2317-button is-primary" type="submit">Передать общее заключение</button></div></form></section>`;

  const renderWaitingFinal = (state, progress) => {
    shell(`${topbar(state, progress)}${panel('Заключение принято', 'Ваш напарник ещё работает', 'Развязка и итоговый ранг пары откроются только после того, как оба игрока передадут заключение.', `<div class="case2317-wait-final">Проверяем статус второго игрока автоматически…</div>`)}`);
    clearPoll();
    pollTimer = setTimeout(async () => {
      try { const next = await api({ action: 'status', code: state.room.code }); if (next.bothCompleted) renderReveal(next, progress); else renderWaitingFinal(next, progress); }
      catch { renderWaitingFinal(state, progress); }
    }, 3000);
  };
  const formatTime = (seconds) => {
    const value = Math.max(0, Number(seconds) || 0); const min = Math.floor(value / 60); const sec = value % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };
  const scoreTeam = (creator, guest) => {
    const totalHints = (creator?.hintsUsed || 0) + (guest?.hintsUsed || 0);
    const totalAttempts = (creator?.attempts || 1) + (guest?.attempts || 1);
    const extraAttempts = Math.max(0, totalAttempts - 2);
    const maxElapsed = Math.max(creator?.elapsedSeconds || 0, guest?.elapsedSeconds || 0);
    const timePenalty = Math.min(12, Math.max(0, Math.floor((maxElapsed - 3600) / 180)));
    const firstPenalty = (creator?.firstAnswerCorrect === false ? 4 : 0) + (guest?.firstAnswerCorrect === false ? 4 : 0);
    const score = Math.max(45, 100 - totalHints * 4 - extraAttempts * 6 - timePenalty - firstPenalty);
    const rank = score >= 94 ? 'Отдел особых расследований' : score >= 84 ? 'Старшие детективы' : score >= 72 ? 'Оперативная группа' : 'Следственная группа';
    const reconstruction = Math.max(10, 25 - firstPenalty * 2);
    const evidence = Math.max(10, 25 - extraAttempts * 3);
    const teamwork = 25;
    const discipline = Math.max(8, 25 - totalHints * 3 - timePenalty);
    return { score, rank, reconstruction, evidence, teamwork, discipline };
  };
  const renderReveal = (state, progress) => {
    clearPoll();
    const creator = state.results?.creator; const guest = state.results?.guest;
    const result = scoreTeam(creator, guest);
    shell(`${topbar(state, progress)}<section class="case2317-reveal"><p class="case2317-eyebrow">Дело закрыто · оба заключения получены</p><h2>${escapeHtml(data.reveal.title)}</h2>${data.reveal.body.map((text) => `<p>${escapeHtml(text)}</p>`).join('')}<div class="case2317-closing">${escapeHtml(data.reveal.closing)}</div>
      <div class="case2317-score"><div class="case2317-score-head"><div><p class="case2317-eyebrow">Итог следственной группы</p><h3>${escapeHtml(result.rank)}</h3><span class="case2317-badge">Дело ML-0407 · совместное расследование</span></div><div class="case2317-score-number">${result.score}<small>/100</small></div></div><div class="case2317-score-grid"><div class="case2317-score-row"><span>Реконструкция</span><strong>${result.reconstruction}/25</strong></div><div class="case2317-score-row"><span>Работа с уликами</span><strong>${result.evidence}/25</strong></div><div class="case2317-score-row"><span>Командная работа</span><strong>${result.teamwork}/25</strong></div><div class="case2317-score-row"><span>Дисциплина</span><strong>${result.discipline}/25</strong></div></div></div>
      ${creator && guest ? `<div class="case2317-role-pair"><div class="case2317-role-slot"><i>СЛ</i><div><small>Следователь</small><strong>${escapeHtml(creator.name)}</strong><span>${formatTime(creator.elapsedSeconds)} · ошибок/попыток: ${creator.attempts} · подсказок: ${creator.hintsUsed}</span></div></div><div class="case2317-role-slot is-analyst"><i>АН</i><div><small>Аналитик</small><strong>${escapeHtml(guest.name)}</strong><span>${formatTime(guest.elapsedSeconds)} · ошибок/попыток: ${guest.attempts} · подсказок: ${guest.hintsUsed}</span></div></div></div>` : ''}
      <div class="case2317-actions"><button class="case2317-button is-primary" type="button" data-action="share-result" data-score="${result.score}" data-rank="${escapeHtml(result.rank)}">Поделиться результатом</button><a class="case2317-button" href="../">Другой формат для двоих</a></div></section>`);
    track('coop_407_reveal', { room_code: state.room.code, score: result.score, rank: result.rank });
  };

  const renderByState = (state) => {
    roomState = state;
    if (state.room.caseId !== data.id) { renderHome('Этот код относится к другой игре Mystery Logic.'); return; }
    if (state.me.started || state.me.completed) renderGame(state); else renderLobby(state);
  };
  const createRoom = async () => {
    if (busy) return; busy = true;
    const name = cleanName(root.querySelector('[data-player-name]')?.value || nickname()); localStorage.setItem(NICK_STORAGE, name);
    try { const state = await api({ action: 'create', playerName: name }); setRoomQuery(state.room.code); roomState = state; track('coop_407_room_created', { room_code: state.room.code }); renderLobby(state); }
    catch (error) { renderCreate(errorText(error)); } finally { busy = false; }
  };
  const previewRoom = async (code) => {
    try { const state = await api({ action: 'status', code }); setRoomQuery(code); renderByState(state); return; }
    catch (error) { if (error.message !== 'not_joined') { renderHome(errorText(error)); return; } }
    try { const preview = await api({ action: 'preview', code }); setRoomQuery(code); renderJoin(code, preview); }
    catch (error) { renderHome(errorText(error)); }
  };
  const joinRoom = async (code) => {
    if (busy) return; busy = true;
    const name = cleanName(root.querySelector('[data-player-name]')?.value || nickname()); localStorage.setItem(NICK_STORAGE, name);
    try { const state = await api({ action: 'join', code, playerName: name }); roomState = state; track('coop_407_room_joined', { room_code: code }); renderLobby(state); }
    catch (error) { try { renderJoin(code, await api({ action: 'preview', code }), errorText(error)); } catch { renderHome(errorText(error)); } } finally { busy = false; }
  };
  const startGame = async () => {
    if (!roomState?.bothJoined || busy) return; busy = true;
    try {
      const state = await api({ action: 'start', code: roomState.room.code });
      const progress = readProgress(state); if (!progress.startedAt) progress.startedAt = Date.now(); saveProgress(state, progress);
      track('coop_407_started', { room_code: state.room.code, role: state.me.role }); renderGame(state);
    } catch { renderLobby(roomState); } finally { busy = false; }
  };
  const copyInvite = async () => {
    if (!roomState?.room?.code) return;
    const url = inviteUrl(roomState.room.code);
    try { await navigator.clipboard.writeText(url); toast('Ссылка приглашения скопирована'); track('coop_407_invite_copied', { room_code: roomState.room.code }); }
    catch { prompt('Скопируйте ссылку:', url); }
  };
  const shareInvite = async () => {
    if (!roomState?.room?.code) return;
    const url = inviteUrl(roomState.room.code);
    const text = `Расследование «Номер 407». Ты — ${roleName(opponentRole(roomState.me.role))}. Код комнаты ${roomState.room.code}.`;
    if (navigator.share) { try { await navigator.share({ title: data.title, text, url }); return; } catch (error) { if (error?.name === 'AbortError') return; } }
    await copyInvite();
  };
  const verifyHandoff = (key) => {
    if (!roomState) return;
    const progress = readProgress(roomState); const config = HANDOFFS[roomState.me.role]?.[key]; if (!config) return;
    const input = root.querySelector(`[data-handoff-input][data-handoff-key="${key}"]`);
    const error = root.querySelector('[data-handoff-error]');
    if (normalizeToken(input?.value || '') !== normalizeToken(config.expected)) {
      if (error) error.textContent = 'Маркер не совпадает. Не угадывайте — попросите напарника проверить свой материал.';
      track('coop_407_handoff_wrong', { room_code: roomState.room.code, role: roomState.me.role, key }); return;
    }
    progress.handoffs[key] = true; saveProgress(roomState, progress);
    track('coop_407_handoff_unlocked', { room_code: roomState.room.code, role: roomState.me.role, key });
    toast('Новый материал разблокирован'); renderGame(roomState);
  };
  const makeDecision = (id) => {
    if (!roomState || !DECISION.options.some((opt) => opt.id === id)) return;
    const progress = readProgress(roomState);
    if (progress.decisions.includes(DECISION.correct)) return;
    progress.decisions.push(id);
    if (id !== DECISION.correct) progress.decisionMistakes += 1;
    saveProgress(roomState, progress);
    track('coop_407_decision', { room_code: roomState.room.code, role: roomState.me.role, decision: id, correct: id === DECISION.correct });
    if (id === DECISION.correct) toast('Новые материалы получены');
    renderGame(roomState);
  };
  const submitFinal = async (form) => {
    if (!roomState || busy) return;
    const progress = readProgress(roomState);
    const fd = new FormData(form); const values = Object.fromEntries(fd.entries()); const picks = fd.getAll('evidence');
    progress.evidencePicks = picks; saveProgress(roomState, progress);
    if (data.final.questions.some((question) => !values[question.id])) { renderGame(roomState, 'Ответьте на все вопросы и сверяйте каждый выбор с напарником.'); return; }
    if (picks.length !== 3) { renderGame(roomState, 'Для заключения выберите ровно три ключевых доказательства.'); return; }
    progress.finalAttempts += 1; saveProgress(roomState, progress);
    const answersCorrect = data.final.questions.every((question) => values[question.id] === question.answer);
    const picksCorrect = picks.every((id) => EVIDENCE_CORRECT.has(id)) && EVIDENCE_CORRECT.size === picks.length;
    if (!answersCorrect || !picksCorrect) {
      track('coop_407_final_wrong', { room_code: roomState.room.code, attempt: progress.finalAttempts, evidence_correct: picksCorrect });
      renderGame(roomState, picksCorrect ? 'В реконструкции остаётся противоречие. Разделите четыре вопроса: физический номер, способ тревоги, путь до B1 и участники постановки.' : 'Среди выбранных материалов есть мотив или ложь, но не доказательство ключевой реконструкции. Выберите три независимые опоры: подмена номера, намеренная тревога и служебный маршрут.');
      return;
    }
    busy = true;
    const elapsedSeconds = Math.max(1, Math.min(21600, Math.round((Date.now() - progress.startedAt) / 1000)));
    const attemptsForScore = Math.max(1, progress.finalAttempts + progress.decisionMistakes);
    try {
      const next = await api({ action: 'complete', code: roomState.room.code, elapsedSeconds, hintsUsed: progress.hints, attempts: attemptsForScore, firstAnswerCorrect: progress.finalAttempts === 1 && progress.decisionMistakes === 0 });
      track('coop_407_completed', { room_code: roomState.room.code, role: roomState.me.role, attempts: attemptsForScore, decision_mistakes: progress.decisionMistakes });
      roomState = next; if (next.bothCompleted) renderReveal(next, progress); else renderWaitingFinal(next, progress);
    } catch { renderGame(roomState, 'Заключение верное, но сервер комнаты временно не ответил. Нажмите отправку ещё раз.'); } finally { busy = false; }
  };
  const shareResult = async (target) => {
    const score = target.dataset.score || ''; const rank = target.dataset.rank || 'Следственная группа';
    const url = new URL('../', location.href).href;
    const text = `Мы раскрыли «Номер 407» в Mystery Logic. Результат: ${score}/100 — ${rank}. Сможете лучше?`;
    if (navigator.share) { try { await navigator.share({ title: 'Mystery Logic · Номер 407', text, url }); track('coop_407_result_shared', { score }); return; } catch (error) { if (error?.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(`${text} ${url}`); toast('Результат и ссылка скопированы'); } catch { prompt('Скопируйте результат:', `${text} ${url}`); }
    track('coop_407_result_shared', { score });
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
    else if (action === 'handoff') verifyHandoff(target.dataset.handoffKey || '');
    else if (action === 'decision') makeDecision(target.dataset.decision || '');
    else if (action === 'share-result') shareResult(target);
    else if (action === 'stage' && roomState) { const p = readProgress(roomState); const requested = Number(target.dataset.stage); if (requested >= 1 && requested <= p.stage) { p.viewStage = requested; saveProgress(roomState, p); renderGame(roomState); } }
    else if (action === 'next-stage' && roomState) { const p = readProgress(roomState); if (p.stage < 3 && stageReady(p, p.stage)) { p.stage += 1; p.viewStage = p.stage; saveProgress(roomState, p); track('coop_407_stage_opened', { room_code: roomState.room.code, stage: p.stage }); renderGame(roomState); window.scrollTo({ top: 0, behavior: 'smooth' }); } }
    else if (action === 'hint' && roomState) { const p = readProgress(roomState); if (p.hints < data.hints.length) { p.hints += 1; saveProgress(roomState, p); track('coop_407_hint', { room_code: roomState.room.code, hint: p.hints }); renderGame(roomState); } }
  });
  root.addEventListener('change', (event) => {
    if (!event.target.matches('[data-final-form] input[name="evidence"]') || !roomState) return;
    const form = event.target.closest('form'); const picks = [...form.querySelectorAll('input[name="evidence"]:checked')].map((el) => el.value);
    if (picks.length > 3) { event.target.checked = false; toast('Для заключения можно выбрать только три ключевых доказательства'); }
    const current = [...form.querySelectorAll('input[name="evidence"]:checked')].map((el) => el.value);
    const progress = readProgress(roomState); progress.evidencePicks = current; saveProgress(roomState, progress);
    const counter = form.querySelector('[data-pick-counter]'); if (counter) counter.textContent = `Выбрано: ${current.length} из 3`;
  });
  root.addEventListener('submit', (event) => { if (event.target.matches('[data-final-form]')) { event.preventDefault(); submitFinal(event.target); } });
  root.addEventListener('keydown', (event) => { if (event.key === 'Enter' && event.target.matches('[data-room-code]')) { event.preventDefault(); root.querySelector('[data-action="join-code"]')?.click(); } if (event.key === 'Enter' && event.target.matches('[data-handoff-input]')) { event.preventDefault(); root.querySelector(`[data-action="handoff"][data-handoff-key="${event.target.dataset.handoffKey}"]`)?.click(); } });
  window.addEventListener('beforeunload', clearPoll);

  const initialCode = cleanCode(new URL(location.href).searchParams.get('room') || '');
  if (initialCode) previewRoom(initialCode); else renderHome();
})();
