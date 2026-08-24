(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/coop-last-aria';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  const NICK_STORAGE = 'mysterylogic:last-aria:nickname';
  const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
  const data = window.MLCaseAria;
  const root = document.querySelector('[data-casearia-app]');
  if (!root || !data) return;

  let roomState = null;
  let pollTimer = null;
  let busy = false;
  let toastTimer = null;

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const randomKey = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), (v) => v.toString(16).padStart(2, '0')).join('');
  const browserKey = () => {
    let value = localStorage.getItem(CLIENT_KEY_STORAGE) || '';
    if (!/^[a-f0-9]{48}$/.test(value)) {
      value = randomKey();
      localStorage.setItem(CLIENT_KEY_STORAGE, value);
    }
    return value;
  };
  const cleanName = (value = '') => String(value).trim().replace(/\s+/g, ' ').slice(0, 32) || 'Игрок';
  const cleanCode = (value = '') => {
    const text = String(value).trim().toUpperCase();
    if (CODE_RE.test(text)) return text;
    return text.match(/[A-HJ-NP-Z2-9]{8}/)?.[0] || '';
  };
  const normalizeToken = (value = '') => String(value).trim().toUpperCase().replace(/[–—−]/g, '-').replace(/\s+/g, '');
  const roleInfo = (role) => data.roles[role] || data.roles.creator;
  const roleMaterials = (stage, role) => stage[role] || [];
  const opponentRole = (role) => role === 'creator' ? 'guest' : 'creator';
  const progressKey = (code, role) => `mysterylogic:last-aria:v1:${code}:${role}`;
  const defaultProgress = () => ({ stage: 1, hintsUsed: 0, attempts: 0, firstAnswerCorrect: null, startedAt: Date.now(), handoffs: {}, decision: '', finalAccepted: false });
  const loadProgress = (code, role) => {
    try { return { ...defaultProgress(), ...JSON.parse(localStorage.getItem(progressKey(code, role)) || '{}') }; }
    catch { return defaultProgress(); }
  };
  const saveProgress = (code, role, progress) => localStorage.setItem(progressKey(code, role), JSON.stringify(progress));
  const track = (event, params = {}) => {
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event, page_type: 'coop_last_aria', ...params }); } catch {}
    try { if (typeof window.ym === 'function') window.ym(111664459, 'reachGoal', event, { page_type: 'coop_last_aria', ...params }); } catch {}
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
  const toast = (message) => {
    document.querySelector('.casearia-toast')?.remove();
    const node = document.createElement('div');
    node.className = 'casearia-toast';
    node.textContent = message;
    document.body.appendChild(node);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.remove(), 3400);
  };
  const shell = (inner) => { root.innerHTML = `<div class="casearia-app">${inner}</div>`; };
  const panel = (kicker, title, lead, inner = '') => `<section class="casearia-panel"><p class="casearia-eyebrow">${esc(kicker)}</p><h2>${esc(title)}</h2>${lead ? `<p>${esc(lead)}</p>` : ''}${inner}</section>`;

  const renderHome = (message = '') => {
    clearPoll(); roomState = null;
    shell(`
      <section class="casearia-cover">
        <div class="casearia-cover-copy">
          <p class="casearia-eyebrow">Дело ML-AR17 · 2 игрока · 55–75 минут</p>
          <h1>Последняя <em>ария</em></h1>
          <p>Генеральная репетиция. Настоящая рана от бутафорского кинжала. Пятьдесят две секунды темноты. И партитура 1908 года, исчезнувшая из закрытого архива, пока все слышали голос дирижёра в оркестровой яме.</p>
          <div class="casearia-actions"><button class="casearia-button is-primary" data-action="create-open">Создать комнату</button><button class="casearia-button" data-action="join-focus">У меня есть код</button></div>
        </div>
        <div class="casearia-stage-visual" aria-hidden="true"><span class="casearia-curtain left"></span><span class="casearia-curtain right"></span><div class="casearia-score"><small>ORIGINAL SCORE · 1908</small><strong>OPUS XVII</strong><i></i><i></i><i></i><b>21:49</b></div><div class="casearia-cue">BLACKOUT<br><strong>00:52</strong></div></div>
      </section>
      ${message ? `<div class="casearia-error">${esc(message)}</div>` : ''}
      ${panel('Войти в расследование', 'Код комнаты', 'Введите восьмисимвольный код, который прислал второй игрок.', `<label class="casearia-field"><span>Код</span><input data-room-code maxlength="30" autocomplete="off" placeholder="Например, 7K4P9D2X"></label><div class="casearia-actions"><button class="casearia-button" data-action="join-code">Войти</button></div>`)}
    `);
  };

  const renderCreate = (message = '') => shell(panel('Новое дело', 'Создать комнату', 'Вы получите роль Сценического следователя. Напарник автоматически станет Техническим аналитиком.', `
    ${message ? `<div class="casearia-error">${esc(message)}</div>` : ''}
    <label class="casearia-field"><span>Ваше имя</span><input data-player-name maxlength="32" autocomplete="nickname" value="${esc(localStorage.getItem(NICK_STORAGE) || 'Игрок 1')}"></label>
    <div class="casearia-role-pair"><div class="casearia-role-slot"><b>СЦ</b><span><strong>Сценический следователь</strong><small>реквизит, следы, планы, опросы</small></span></div><div class="casearia-role-slot is-tech"><b>ТХ</b><span><strong>Технический аналитик</strong><small>свет, интерком, замки, архив</small></span></div></div>
    <div class="casearia-actions"><button class="casearia-button is-primary" data-action="create-room">Создать комнату</button><button class="casearia-button" data-action="home">Назад</button></div>
  `));

  const roomTop = (view) => {
    const me = roleInfo(view.me?.role);
    return `<div class="casearia-room-top"><span><small>Комната</small><strong>${esc(view.room?.code || '')}</strong></span><span><small>Ваша роль</small><strong>${esc(me.title)}</strong></span><span><small>Напарник</small><strong>${view.opponent?.joined ? esc(view.opponent.name || roleInfo(opponentRole(view.me?.role)).title) : 'подключается…'}</strong></span></div>`;
  };

  const renderWaiting = (view, message = '') => {
    roomState = view;
    const code = view.room.code;
    const ready = view.bothJoined;
    shell(`
      ${roomTop(view)}
      ${panel('Дело ML-AR17', ready ? 'Оба игрока в комнате' : 'Ждём второго игрока', ready ? 'У каждого будет собственный пакет. Не показывайте экран напарнику: передавайте только те маркеры, которые просит расследование.' : 'Отправьте ссылку или код. Комната действует семь дней.', `
        ${message ? `<div class="casearia-error">${esc(message)}</div>` : ''}
        <div class="casearia-codebox"><strong>${esc(code)}</strong><button class="casearia-button" data-action="copy-invite">Скопировать ссылку</button></div>
        <div class="casearia-role-pair"><div class="casearia-role-slot"><b>СЦ</b><span><strong>${view.me.role === 'creator' ? esc(view.me.name) : esc(view.opponent?.name || 'Сценический следователь')}</strong><small>${view.me.role === 'creator' ? 'вы' : (view.opponent?.joined ? 'в комнате' : 'ожидается')}</small></span></div><div class="casearia-role-slot is-tech"><b>ТХ</b><span><strong>${view.me.role === 'guest' ? esc(view.me.name) : esc(view.opponent?.name || 'Технический аналитик')}</strong><small>${view.me.role === 'guest' ? 'вы' : (view.opponent?.joined ? 'в комнате' : 'ожидается')}</small></span></div></div>
        <div class="casearia-actions">${ready ? '<button class="casearia-button is-primary" data-action="start-game">Начать расследование</button>' : '<button class="casearia-button" data-action="refresh-room">Проверить подключение</button>'}<button class="casearia-button" data-action="home">Выйти</button></div>
      `)}
    `);
    if (!ready) schedulePoll();
  };

  const materialHtml = (material, index) => {
    const body = (material.body || []).map((p) => `<p>${esc(p)}</p>`).join('');
    const facts = (material.facts || []).map((f) => `<span>${esc(f)}</span>`).join('');
    return `<article class="casearia-evidence type-${esc(material.type || 'card')}"><header><small>${esc(material.tag || `Материал ${index + 1}`)}</small><h3>${esc(material.title)}</h3></header><div class="casearia-evidence-body">${body}</div>${facts ? `<div class="casearia-facts">${facts}</div>` : ''}</article>`;
  };

  const handoffHtml = (role, stageId, progress) => {
    const handoff = data.handoffs?.[role]?.[stageId];
    if (!handoff) return '';
    const done = Boolean(progress.handoffs?.[stageId]);
    return `<section class="casearia-handoff${done ? ' is-complete' : ''}"><p class="casearia-eyebrow">Перекрёстная сверка</p><h3>${done ? 'Материалы двух ролей сошлись' : 'Нужен факт с экрана напарника'}</h3><p>${esc(done ? handoff.result : handoff.prompt)}</p>${done ? '<strong class="casearia-check">✓ подтверждено двумя пакетами</strong>' : `<label class="casearia-field"><span>${esc(handoff.label)}</span><input data-handoff-input autocomplete="off" placeholder="Введите маркер"></label><button class="casearia-button is-primary" data-action="handoff-check">Сверить</button>`}</section>`;
  };

  const decisionHtml = (progress) => {
    if (progress.stage !== data.decision.stage) return '';
    const chosen = progress.decision || '';
    return `<section class="casearia-decision"><p class="casearia-eyebrow">Совместное решение</p><h3>${esc(data.decision.title)}</h3><p>${esc(data.decision.lead)}</p><div class="casearia-decision-grid">${data.decision.options.map((opt) => `<button type="button" class="casearia-decision-option${chosen === opt.id ? ' is-selected' : ''}" data-decision="${esc(opt.id)}"><strong>${esc(opt.title)}</strong><span>${esc(opt.text)}</span></button>`).join('')}</div>${chosen ? `<div class="casearia-decision-feedback">${esc(data.decision.feedback[chosen])}</div>` : ''}</section>`;
  };

  const hintsHtml = (role, stageId, progress) => {
    const list = data.hints?.[role]?.[stageId] || [];
    const used = Math.min(progress[`hintStage${stageId}`] || 0, list.length);
    return `<section class="casearia-hints"><div><p class="casearia-eyebrow">Если застряли</p><h3>Подсказки этого этапа</h3></div><div>${used ? list.slice(0, used).map((h, i) => `<p><b>${i + 1}.</b> ${esc(h)}</p>`).join('') : '<p>Подсказки не раскрывают ответ и учитываются в итоговом ранге.</p>'}</div>${used < list.length ? '<button class="casearia-button" data-action="hint">Открыть подсказку</button>' : ''}</section>`;
  };

  const renderStage = (view) => {
    clearPoll(); roomState = view;
    const role = view.me.role;
    const progress = loadProgress(view.room.code, role);
    if (progress.finalAccepted) return renderSolvedWaiting(view, progress);
    const stage = data.stages[progress.stage - 1] || data.stages[0];
    const materials = roleMaterials(stage, role);
    const handoffDone = Boolean(progress.handoffs?.[stage.id]);
    const decisionDone = stage.id !== data.decision.stage || Boolean(progress.decision);
    const canAdvance = handoffDone && decisionDone;
    shell(`
      ${roomTop(view)}
      <section class="casearia-brief"><div><p class="casearia-eyebrow">${esc(data.brief.kicker)}</p><h1>${esc(stage.title)}</h1><p>${esc(stage.objective)}</p></div><aside><small>Пакет ${stage.id} / ${data.stages.length}</small><strong>${esc(roleInfo(role).title)}</strong><span>${esc(roleInfo(role).short)}</span></aside></section>
      <div class="casearia-evidence-grid">${materials.map(materialHtml).join('')}</div>
      ${handoffHtml(role, stage.id, progress)}
      ${decisionHtml(progress)}
      ${hintsHtml(role, stage.id, progress)}
      <section class="casearia-stage-footer"><p>${canAdvance ? 'Ключевая сверка выполнена. Переходите дальше одновременно с напарником.' : 'Не переходите дальше, пока не выполнена перекрёстная сверка этого этапа.'}</p><button class="casearia-button is-primary" data-action="next-stage" ${canAdvance ? '' : 'disabled'}>${stage.id === data.stages.length ? 'Собрать обвинение' : 'Открыть следующий пакет'}</button></section>
    `);
  };

  const finalQuestion = (q) => `<fieldset class="casearia-final-question"><legend>${esc(q.title)}</legend>${q.options.map(([id, label]) => `<label><input type="radio" name="final-${esc(q.id)}" value="${esc(id)}"> <span>${esc(label)}</span></label>`).join('')}</fieldset>`;
  const renderFinal = (view, message = '') => {
    roomState = view;
    const role = view.me.role;
    shell(`
      ${roomTop(view)}
      <section class="casearia-final"><p class="casearia-eyebrow">Финальная версия</p><h1>Что произошло в 21:49?</h1><p>Ответьте на четыре вопроса и выберите не просто подозрительные, а доказательные материалы. Нужны независимые цепочки: саботаж, ложное алиби, личность в архиве, доступ и физическая связь с оригиналом.</p>${message ? `<div class="casearia-error">${esc(message)}</div>` : ''}</section>
      <form class="casearia-final-form" data-final-form>
        <div class="casearia-final-questions">${data.final.questions.map(finalQuestion).join('')}</div>
        <fieldset class="casearia-proof-board"><legend>Какие материалы выдерживают обвинение?</legend><p>Отметьте минимум пять. Система проверит не количество, а независимость доказательных групп.</p>${data.final.evidence.map((item) => `<label><input type="checkbox" name="evidence" value="${esc(item.id)}"> <span>${esc(item.label)}</span></label>`).join('')}</fieldset>
        <div class="casearia-actions"><button class="casearia-button is-primary" type="submit">Проверить версию</button><button class="casearia-button" type="button" data-action="back-stage">Вернуться к материалам</button></div>
      </form>
    `);
  };

  const renderSolvedWaiting = (view, progress) => {
    roomState = view;
    if (view.bothCompleted) return renderReveal(view, progress);
    shell(`${roomTop(view)}${panel('Версия принята', 'Ваше обвинение выдержало проверку', 'Полный разбор откроется только после того, как напарник завершит своё расследование.', `<div class="casearia-waiting-score"><strong>Доказательства собраны</strong><span>Не раскрывайте решение вслух до завершения второго игрока.</span></div><div class="casearia-actions"><button class="casearia-button" data-action="refresh-room">Проверить напарника</button></div>`)} `);
    schedulePoll(true);
  };

  const pairRank = (view) => {
    const a = view.results?.creator || {};
    const b = view.results?.guest || {};
    const hints = Number(a.hintsUsed || 0) + Number(b.hintsUsed || 0);
    const attempts = Number(a.attempts || 1) + Number(b.attempts || 1);
    if (hints <= 1 && attempts <= 2) return 'Маэстро расследования';
    if (hints <= 3 && attempts <= 4) return 'Сильный следственный дуэт';
    return 'Дело раскрыто';
  };
  const renderReveal = (view) => {
    clearPoll(); roomState = view;
    shell(`
      ${roomTop(view)}
      <section class="casearia-reveal"><p class="casearia-eyebrow">Заключение следственной группы</p><h1>${esc(data.reveal.title)}</h1>${data.reveal.body.map((p) => `<p>${esc(p)}</p>`).join('')}<blockquote>${esc(data.reveal.closing)}</blockquote></section>
      <section class="casearia-pair-result"><div><small>Общий ранг</small><strong>${esc(pairRank(view))}</strong></div><div><small>${esc(view.results?.creator?.name || 'Сценический следователь')}</small><span>${Math.round(Number(view.results?.creator?.elapsedSeconds || 0) / 60)} мин · подсказок ${Number(view.results?.creator?.hintsUsed || 0)}</span></div><div><small>${esc(view.results?.guest?.name || 'Технический аналитик')}</small><span>${Math.round(Number(view.results?.guest?.elapsedSeconds || 0) / 60)} мин · подсказок ${Number(view.results?.guest?.hintsUsed || 0)}</span></div></section>
      <section class="casearia-stage-footer"><p>Три независимые линии — реквизит, ложное аудиоалиби и физический маршрут в архив — сходятся на одном человеке.</p><a class="casearia-button is-primary" href="../">Другие игры для двоих</a></section>
    `);
  };

  const schedulePoll = (solved = false) => {
    clearPoll();
    pollTimer = setTimeout(async () => {
      if (!roomState?.room?.code) return;
      try {
        const view = await api({ action: 'status', code: roomState.room.code });
        roomState = view;
        const progress = loadProgress(view.room.code, view.me.role);
        if (solved || progress.finalAccepted) renderSolvedWaiting(view, progress);
        else if (view.bothJoined) renderWaiting(view);
        else schedulePoll(false);
      } catch { schedulePoll(solved); }
    }, 3000);
  };

  const joinByCode = async (code, name) => {
    const preview = await api({ action: 'preview', code });
    if (preview.roomFull) throw new Error('room_full');
    localStorage.setItem(NICK_STORAGE, cleanName(name));
    const view = await api({ action: 'join', code, playerName: cleanName(name) });
    setRoomQuery(code);
    renderWaiting(view);
    track('coop_last_aria_join', { room: code });
  };

  const resumeFromQuery = async () => {
    const code = cleanCode(new URL(location.href).searchParams.get('room') || '');
    if (!code) return renderHome();
    try {
      const view = await api({ action: 'status', code });
      roomState = view;
      const progress = loadProgress(code, view.me.role);
      if (progress.finalAccepted) return renderSolvedWaiting(view, progress);
      if (view.me.started) return renderStage(view);
      return renderWaiting(view);
    } catch (error) {
      if (error.message === 'not_joined') {
        try {
          const preview = await api({ action: 'preview', code });
          return shell(panel('Приглашение в дело', `Комната ${code}`, `${preview.creatorName || 'Первый игрок'} уже начал собирать команду. Вы получите роль Технического аналитика.`, `<label class="casearia-field"><span>Ваше имя</span><input data-player-name maxlength="32" value="${esc(localStorage.getItem(NICK_STORAGE) || 'Игрок 2')}"></label><input type="hidden" data-invite-code value="${esc(code)}"><div class="casearia-actions"><button class="casearia-button is-primary" data-action="join-invite">Войти в комнату</button><button class="casearia-button" data-action="home">На главную дела</button></div>`));
        } catch (previewError) { return renderHome(errorText(previewError)); }
      }
      return renderHome(errorText(error));
    }
  };

  root.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-final-form]');
    if (!form) return;
    event.preventDefault();
    if (!roomState?.room?.code || busy) return;
    const progress = loadProgress(roomState.room.code, roomState.me.role);
    progress.attempts = Number(progress.attempts || 0) + 1;
    const answers = Object.fromEntries(data.final.questions.map((q) => [q.id, form.querySelector(`input[name="final-${q.id}"]:checked`)?.value || '']));
    const allAnswered = data.final.questions.every((q) => answers[q.id]);
    const answersCorrect = data.final.questions.every((q) => answers[q.id] === q.answer);
    const chosenEvidence = [...form.querySelectorAll('input[name="evidence"]:checked')].map((input) => input.value);
    const evidenceGroups = new Set(chosenEvidence.map((id) => data.final.evidence.find((item) => item.id === id)?.group).filter(Boolean));
    const proofComplete = data.final.requiredGroups.every((group) => evidenceGroups.has(group));
    const accepted = allAnswered && answersCorrect && proofComplete;
    if (progress.firstAnswerCorrect === null) progress.firstAnswerCorrect = accepted;
    saveProgress(roomState.room.code, roomState.me.role, progress);
    if (!allAnswered) return renderFinal(roomState, 'Заполните все четыре вопроса.');
    if (!answersCorrect) return renderFinal(roomState, 'Версия пока не выдерживает все временные и физические ограничения. Проверьте алиби, которое существует только как звук.');
    if (!proofComplete) return renderFinal(roomState, 'Ответ выглядит верно, но доказательная конструкция неполна. Нужны независимые материалы о саботаже, ложном алиби, личности в архиве, доступе и физической связи с оригиналом.');
    progress.finalAccepted = true;
    saveProgress(roomState.room.code, roomState.me.role, progress);
    busy = true;
    try {
      const elapsedSeconds = Math.max(60, Math.round((Date.now() - Number(progress.startedAt || Date.now())) / 1000));
      const view = await api({ action: 'complete', code: roomState.room.code, elapsedSeconds, hintsUsed: Number(progress.hintsUsed || 0), attempts: progress.attempts, firstAnswerCorrect: Boolean(progress.firstAnswerCorrect) });
      track('coop_last_aria_complete', { hints: progress.hintsUsed, attempts: progress.attempts });
      renderSolvedWaiting(view, progress);
    } catch (error) { progress.finalAccepted = false; saveProgress(roomState.room.code, roomState.me.role, progress); renderFinal(roomState, errorText(error)); }
    finally { busy = false; }
  });

  root.addEventListener('click', async (event) => {
    const actionNode = event.target.closest('[data-action]');
    const decisionNode = event.target.closest('[data-decision]');
    if (decisionNode && roomState?.room?.code) {
      const progress = loadProgress(roomState.room.code, roomState.me.role);
      progress.decision = decisionNode.dataset.decision || '';
      saveProgress(roomState.room.code, roomState.me.role, progress);
      track('coop_last_aria_decision', { choice: progress.decision });
      return renderStage(roomState);
    }
    if (!actionNode || busy) return;
    const action = actionNode.dataset.action;
    if (action === 'home') { setRoomQuery(''); return renderHome(); }
    if (action === 'create-open') return renderCreate();
    if (action === 'join-focus') { renderHome(); return setTimeout(() => document.querySelector('[data-room-code]')?.focus(), 0); }
    if (action === 'copy-invite' && roomState?.room?.code) {
      try { await navigator.clipboard.writeText(inviteUrl(roomState.room.code)); toast('Ссылка скопирована'); }
      catch { toast(inviteUrl(roomState.room.code)); }
      return;
    }
    if (action === 'refresh-room' && roomState?.room?.code) {
      busy = true;
      try {
        const view = await api({ action: 'status', code: roomState.room.code });
        const progress = loadProgress(view.room.code, view.me.role);
        if (progress.finalAccepted) renderSolvedWaiting(view, progress); else if (view.me.started) renderStage(view); else renderWaiting(view);
      } catch (error) { toast(errorText(error)); }
      finally { busy = false; }
      return;
    }
    if (action === 'create-room') {
      const name = cleanName(root.querySelector('[data-player-name]')?.value || 'Игрок 1');
      localStorage.setItem(NICK_STORAGE, name); busy = true;
      try {
        const view = await api({ action: 'create', playerName: name });
        setRoomQuery(view.room.code); renderWaiting(view); track('coop_last_aria_create', { room: view.room.code });
      } catch (error) { renderCreate(errorText(error)); }
      finally { busy = false; }
      return;
    }
    if (action === 'join-code') {
      const code = cleanCode(root.querySelector('[data-room-code]')?.value || '');
      if (!code) return toast('Введите восьмисимвольный код комнаты.');
      setRoomQuery(code);
      try {
        const preview = await api({ action: 'preview', code });
        shell(panel('Подключиться к делу', `Комната ${code}`, `${preview.creatorName || 'Первый игрок'} ждёт напарника. Вы получите роль Технического аналитика.`, `<label class="casearia-field"><span>Ваше имя</span><input data-player-name maxlength="32" value="${esc(localStorage.getItem(NICK_STORAGE) || 'Игрок 2')}"></label><input type="hidden" data-invite-code value="${esc(code)}"><div class="casearia-actions"><button class="casearia-button is-primary" data-action="join-invite">Войти</button><button class="casearia-button" data-action="home">Назад</button></div>`));
      } catch (error) { renderHome(errorText(error)); }
      return;
    }
    if (action === 'join-invite') {
      const code = cleanCode(root.querySelector('[data-invite-code]')?.value || new URL(location.href).searchParams.get('room') || '');
      const name = cleanName(root.querySelector('[data-player-name]')?.value || 'Игрок 2'); busy = true;
      try { await joinByCode(code, name); }
      catch (error) { renderHome(errorText(error)); }
      finally { busy = false; }
      return;
    }
    if (action === 'start-game' && roomState?.room?.code) {
      busy = true;
      try {
        const view = await api({ action: 'start', code: roomState.room.code });
        const progress = loadProgress(view.room.code, view.me.role);
        if (!localStorage.getItem(progressKey(view.room.code, view.me.role))) saveProgress(view.room.code, view.me.role, progress);
        roomState = view; renderStage(view); track('coop_last_aria_start', { role: view.me.role });
      } catch (error) { toast(errorText(error)); }
      finally { busy = false; }
      return;
    }
    if (action === 'handoff-check' && roomState?.room?.code) {
      const progress = loadProgress(roomState.room.code, roomState.me.role);
      const handoff = data.handoffs?.[roomState.me.role]?.[progress.stage];
      const entered = normalizeToken(root.querySelector('[data-handoff-input]')?.value || '');
      if (!handoff) return;
      if (entered !== normalizeToken(handoff.expected)) return toast('Маркер не совпал. Попросите напарника прочитать его точно, включая цифры и дефис.');
      progress.handoffs = { ...progress.handoffs, [progress.stage]: true };
      saveProgress(roomState.room.code, roomState.me.role, progress);
      track('coop_last_aria_handoff', { stage: progress.stage, role: roomState.me.role });
      return renderStage(roomState);
    }
    if (action === 'hint' && roomState?.room?.code) {
      const progress = loadProgress(roomState.room.code, roomState.me.role);
      const key = `hintStage${progress.stage}`;
      const max = data.hints?.[roomState.me.role]?.[progress.stage]?.length || 0;
      if ((progress[key] || 0) < max) { progress[key] = (progress[key] || 0) + 1; progress.hintsUsed = Number(progress.hintsUsed || 0) + 1; saveProgress(roomState.room.code, roomState.me.role, progress); track('coop_last_aria_hint', { stage: progress.stage }); }
      return renderStage(roomState);
    }
    if (action === 'next-stage' && roomState?.room?.code) {
      const progress = loadProgress(roomState.room.code, roomState.me.role);
      const handoffDone = Boolean(progress.handoffs?.[progress.stage]);
      const decisionDone = progress.stage !== data.decision.stage || Boolean(progress.decision);
      if (!handoffDone || !decisionDone) return toast('Сначала завершите перекрёстную сверку и совместное решение этапа.');
      if (progress.stage >= data.stages.length) return renderFinal(roomState);
      progress.stage += 1; saveProgress(roomState.room.code, roomState.me.role, progress); track('coop_last_aria_stage', { stage: progress.stage }); return renderStage(roomState);
    }
    if (action === 'back-stage' && roomState) return renderStage(roomState);
  });

  resumeFromQuery();
})();