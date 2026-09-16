(() => {
  'use strict';

  const CASE_ID = 'MLP001_NE_PUBLIKOVAT_PREVIEW';
  const CASE_TITLE = 'Не публиковать';
  const CASE_PATH = '/ru/cases/ne-publikovat/';
  const DUEL_ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/duel-room';
  const SESSION_ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/partner-session-v1';
  const AI_ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/partner-interrogate-v1';
  const KEY_STORAGE = 'mysterylogic:partner-premium:browser-key';
  const NAME_STORAGE = 'mysterylogic:partner-premium:player-name';

  const $ = (selector) => document.querySelector(selector);
  const els = {
    entry: $('[data-entry]'), createForm: $('[data-create-form]'), createName: $('[data-create-name]'), create: $('[data-create]'),
    joinForm: $('[data-join-form]'), joinName: $('[data-join-name]'), join: $('[data-join]'), roomContext: $('[data-room-context]'), entryError: $('[data-entry-error]'),
    lobby: $('[data-lobby]'), roomCode: $('[data-room-code]'), lobbyStatus: $('[data-lobby-status]'), copyInvite: $('[data-copy-invite]'), copyCode: $('[data-copy-code]'),
    game: $('[data-game]'), roleLabel: $('[data-role-label]'), partnerStatus: $('[data-partner-status]'), stateLabel: $('[data-state-label]'), roomFooter: $('[data-room-footer]'), syncStatus: $('[data-sync-status]'),
    roleIntro: $('[data-role-intro]'), roleIntroCopy: $('[data-role-intro-copy]'), roleIntroClose: $('[data-role-intro-close]'),
    evidenceEyebrow: $('[data-evidence-eyebrow]'), evidenceList: $('[data-evidence-list]'), evidenceEmpty: $('[data-evidence-empty]'), evidenceDetail: $('[data-evidence-detail]'), deductions: $('[data-deductions]'), board: $('[data-board]'),
    roman: $('[data-roman]'), romanStatus: $('[data-roman-status]'), presentEvidence: $('[data-present-evidence]'), chat: $('[data-chat]'), chatForm: $('[data-chat-form]'), chatInput: $('[data-chat-input]'), challenge: $('[data-challenge]'),
    sliceComplete: $('[data-slice-complete]'), toast: $('[data-toast]'),
  };

  let browserKey = getBrowserKey();
  let roomCode = new URLSearchParams(location.search).get('room')?.trim().toUpperCase() || '';
  let roomView = null;
  let snapshot = null;
  let selectedEvidenceId = null;
  let lobbyTimer = null;
  let syncTimer = null;
  let actionBusy = false;
  const chatHistory = [];

  function randomHex(bytes) {
    const data = crypto.getRandomValues(new Uint8Array(bytes));
    return [...data].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  function getBrowserKey() {
    try {
      let value = localStorage.getItem(KEY_STORAGE) || '';
      if (!/^[a-f0-9]{48}$/.test(value)) { value = randomHex(24); localStorage.setItem(KEY_STORAGE, value); }
      return value;
    } catch { return randomHex(24); }
  }
  function savedName() { try { return localStorage.getItem(NAME_STORAGE) || ''; } catch { return ''; } }
  function saveName(value) { try { localStorage.setItem(NAME_STORAGE, value); } catch {} }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
  function roomUrl(code = roomCode) { const url = new URL(location.href); url.search = ''; url.searchParams.set('room', code); return url.toString(); }
  function setError(message = '') { els.entryError.hidden = !message; els.entryError.textContent = message; }
  function toast(message) { els.toast.textContent = message; els.toast.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => { els.toast.hidden = true; }, 3300); }
  function setBusy(button, busy, text = 'Подождите…') { if (!button) return; if (busy) { button.dataset.oldText = button.textContent; button.disabled = true; button.textContent = text; } else { button.disabled = false; button.textContent = button.dataset.oldText || button.textContent; } }

  async function post(url, body) {
    const response = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, cache:'no-store', credentials:'omit', body:JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(data?.message || data?.error || `HTTP ${response.status}`); error.code = data?.error || ''; throw error; }
    return data;
  }

  async function duel(action, extra = {}) { return post(DUEL_ENDPOINT, { action, browserKey, code: roomCode || undefined, ...extra }); }
  async function partner(action = 'SNAPSHOT', extra = {}) { return post(SESSION_ENDPOINT, { action, code: roomCode, browserKey, ...extra }); }

  function showOnly(section) {
    for (const element of [els.entry, els.lobby, els.game]) element.hidden = element !== section;
  }

  async function createRoom() {
    const playerName = (els.createName.value || '').trim() || 'Следователь';
    setBusy(els.create, true, 'Создаём…'); setError('');
    try {
      const view = await post(DUEL_ENDPOINT, { action:'create', browserKey, caseId:CASE_ID, caseTitle:CASE_TITLE, casePath:CASE_PATH, playerName });
      saveName(playerName); roomView = view; roomCode = view.room.code;
      history.replaceState(null, '', `?room=${encodeURIComponent(roomCode)}`);
      enterLobby(view);
    } catch (error) { setError(humanError(error)); }
    finally { setBusy(els.create, false); }
  }

  async function joinRoom() {
    const playerName = (els.joinName.value || '').trim() || savedName() || 'Следователь';
    setBusy(els.join, true, 'Подключаем…'); setError('');
    try {
      const view = await duel('join', { playerName });
      saveName(playerName); roomView = view; enterLobby(view);
    } catch (error) { setError(humanError(error)); }
    finally { setBusy(els.join, false); }
  }

  async function inspectRoom() {
    if (!/^[A-HJ-NP-Z2-9]{8}$/.test(roomCode)) { roomCode = ''; return; }
    els.createForm.hidden = true; els.joinForm.hidden = false; els.joinName.value = savedName();
    try {
      const preview = await duel('preview');
      els.roomContext.textContent = `Комната ${roomCode}. Вас приглашает ${preview.creatorName || 'следователь'}.`;
      if (savedName()) await joinRoom();
    } catch (error) { setError(humanError(error)); }
  }

  function enterLobby(view) {
    showOnly(els.lobby); els.roomCode.textContent = view.room.code; roomCode = view.room.code;
    updateLobby(view);
    clearInterval(lobbyTimer); lobbyTimer = setInterval(pollLobby, 1900);
    if (view.bothJoined) beginGame();
  }

  function updateLobby(view) {
    const other = view.opponent || {};
    els.lobbyStatus.textContent = view.bothJoined ? `${other.name || 'Второй рецензент'} подключён. Открываем дело…` : 'Ждём второго рецензента…';
  }

  async function pollLobby() {
    try {
      roomView = await duel('status'); updateLobby(roomView);
      if (roomView.bothJoined) beginGame();
    } catch (error) { els.lobbyStatus.textContent = humanError(error); }
  }

  async function beginGame() {
    clearInterval(lobbyTimer); lobbyTimer = null;
    try {
      snapshot = await partner('START');
      showOnly(els.game); render(); showRoleIntroOnce();
      clearInterval(syncTimer); syncTimer = setInterval(syncSnapshot, 2200);
    } catch (error) {
      els.lobbyStatus.textContent = `Игровой сервер: ${humanError(error)}`;
      lobbyTimer = setInterval(pollLobby, 2400);
    }
  }

  async function syncSnapshot() {
    if (actionBusy || document.hidden) return;
    try {
      const incoming = await partner('SNAPSHOT');
      const changed = !snapshot || incoming.revision !== snapshot.revision;
      snapshot = incoming;
      els.syncStatus.textContent = changed ? 'Получены изменения партнёра' : 'Состояние синхронизировано';
      if (changed) render();
    } catch { els.syncStatus.textContent = 'Переподключение…'; }
  }

  async function act(action, extra = {}) {
    if (actionBusy) return null;
    actionBusy = true; els.syncStatus.textContent = 'Сохраняем…';
    try {
      snapshot = await partner(action, extra); render(); els.syncStatus.textContent = 'Состояние синхронизировано'; return snapshot;
    } catch (error) { toast(humanError(error)); return null; }
    finally { actionBusy = false; }
  }

  function roleIntroHtml(role) {
    if (role === 'archive') return `<p>Если этот архив открылся, значит сегодняшний выпуск Веры Ланской не вышел.</p><p>Вам назначен второй рецензент. <strong>Не пересылайте ему исходные документы.</strong> Обсуждать материалы можно. Мне нужно, чтобы вы смотрели на расследование независимо.</p>`;
    return `<p>Если это сообщение открылось, со мной невозможно связаться. Не пытайтесь сначала понять, где я. <strong>Сначала выясните, что я нашла.</strong></p><p>У второго рецензента другой набор материалов. Его документы не становятся надёжнее только потому, что выглядят официальнее. И не доверяйте моим материалам только потому, что их подготовила я.</p>`;
  }

  function showRoleIntroOnce() {
    if (!snapshot) return;
    const key = `mysterylogic:partner:intro:${roomCode}:${snapshot.role}`;
    let seen = false; try { seen = localStorage.getItem(key) === '1'; } catch {}
    if (seen) return;
    els.roleIntroCopy.innerHTML = roleIntroHtml(snapshot.role); els.roleIntro.hidden = false;
    els.roleIntroClose.onclick = () => { els.roleIntro.hidden = true; try { localStorage.setItem(key,'1'); } catch {} };
  }

  function render() {
    if (!snapshot) return;
    els.roleLabel.textContent = snapshot.roleLabel;
    els.evidenceEyebrow.textContent = snapshot.role === 'archive' ? 'Архив · ваши материалы' : 'Источники · ваши материалы';
    els.partnerStatus.textContent = snapshot.partner?.joined ? `Партнёр: ${snapshot.partner.name || 'подключён'}` : 'Партнёр не подключён';
    els.stateLabel.textContent = stateLabel(snapshot.narrativeState);
    els.roomFooter.textContent = `Комната ${roomCode}`;
    renderEvidenceList(); renderEvidenceDetail(); renderDeductions(); renderBoard(); renderRoman();
    els.sliceComplete.hidden = !snapshot.sliceComplete;
  }

  function stateLabel(value) {
    return ({STATE_02_SUICIDE_CASE:'Официальная версия',STATE_03_AUDIO_SUSPICIOUS:'Проверка аудио',STATE_04_AUDIO_FABRICATED:'Фальсификация доказана',STATE_05_ROMAN:'Допрос Романа',STATE_06_ROMAN_ALIBI:'Первая версия разрушена'})[value] || 'Расследование';
  }

  function renderEvidenceList() {
    const list = snapshot.evidence || [];
    if (!selectedEvidenceId || !list.some((e) => e.id === selectedEvidenceId)) selectedEvidenceId = list.find((e) => e.opened)?.id || list[0]?.id || null;
    els.evidenceList.innerHTML = list.map((e) => `<button class="pp-evidence ${e.opened?'is-opened':''} ${e.id===selectedEvidenceId?'is-selected':''}" type="button" data-evidence-id="${esc(e.id)}"><span class="pp-evidence__top"><i class="pp-evidence__dot"></i>${esc(e.kicker)}</span><strong>${esc(e.title)}</strong><small>${esc(e.teaser)}</small></button>`).join('');
    els.evidenceList.querySelectorAll('[data-evidence-id]').forEach((button) => button.addEventListener('click', async () => {
      selectedEvidenceId = button.dataset.evidenceId; const item = snapshot.evidence.find((e) => e.id === selectedEvidenceId);
      if (item && !item.opened) await act('OPEN_EVIDENCE', { evidence_id:selectedEvidenceId }); else render();
    }));
  }

  function renderEvidenceDetail() {
    const e = (snapshot.evidence || []).find((item) => item.id === selectedEvidenceId);
    if (!e) { els.evidenceEmpty.hidden = false; els.evidenceDetail.hidden = true; return; }
    els.evidenceEmpty.hidden = true; els.evidenceDetail.hidden = false;
    if (!e.opened) { els.evidenceDetail.innerHTML = `<p class="pp-doc-kicker">${esc(e.kicker)}</p><h2>${esc(e.title)}</h2><p class="pp-doc-teaser">${esc(e.teaser)}</p><button class="pp-primary" type="button" data-open-current>Открыть материал</button>`; els.evidenceDetail.querySelector('[data-open-current]')?.addEventListener('click', () => act('OPEN_EVIDENCE',{evidence_id:e.id})); return; }
    const findings = (e.findings || []).map((f) => `<div class="pp-finding ${f.published?'is-published':''}"><span>${esc(f.label)}</span>${f.published?'<small>на доске</small>':`<button class="pp-secondary" type="button" data-publish="${esc(f.id)}">Зафиксировать</button>`}</div>`).join('');
    els.evidenceDetail.innerHTML = `<p class="pp-doc-kicker">${esc(e.kicker)}</p><h2>${esc(e.title)}</h2><p class="pp-doc-teaser">${esc(e.teaser)}</p><div class="pp-doc-body">${esc(e.body)}</div><div class="pp-findings">${findings}</div>`;
    els.evidenceDetail.querySelectorAll('[data-publish]').forEach((button) => button.addEventListener('click', () => act('PUBLISH_FINDING',{evidence_id:e.id,finding_id:button.dataset.publish})));
  }

  function renderDeductions() {
    const items = Object.values(snapshot.deductions || {}).filter((d) => d.available || d.result === 'confirmed');
    els.deductions.innerHTML = items.map((d) => {
      if (d.result === 'confirmed') return `<section class="pp-deduction is-confirmed"><h3>${esc(d.prompt)}</h3><small>Вывод подтверждён доказательствами.</small></section>`;
      const options = d.options.map((o) => `<button type="button" data-deduction="${esc(d.id)}" data-selected="${esc(o.value)}">${esc(o.label)}</button>`).join('');
      return `<section class="pp-deduction"><h3>${esc(d.prompt)}</h3><div class="pp-deduction__options">${options}</div></section>`;
    }).join('');
    els.deductions.querySelectorAll('[data-deduction]').forEach((button) => button.addEventListener('click', () => act('ATTEMPT_DEDUCTION',{deduction_id:button.dataset.deduction,selected:button.dataset.selected})));
  }

  function renderBoard() {
    const board = snapshot.board || [];
    if (!board.length) { els.board.innerHTML = `<div class="pp-board-empty">Пока пусто. Открывайте свои материалы и решайте, какие выводы стоит вынести на общую доску.</div>`; return; }
    els.board.innerHTML = board.slice().sort((a,b) => a.created_sequence-b.created_sequence).map((item) => `<article class="pp-board-card" data-type="${esc(item.type)}"><span class="pp-board-card__type">${esc(boardType(item.type))}</span><p>${esc(item.label)}</p></article>`).join('');
  }
  function boardType(type) { return ({fact:'факт',contradiction:'противоречие',hypothesis:'гипотеза',proven:'доказано',disproven:'версия разрушена'})[type] || type; }

  function renderRoman() {
    const roman = snapshot.roman || {};
    els.roman.hidden = !roman.available;
    if (!roman.available) return;
    els.romanStatus.textContent = ({calm:'спокоен',cautious:'насторожен',defensive:'защищается',high:'сильно напряжён',crisis:'кризис'})[roman.stressBand] || 'насторожен';
    const presentable = (snapshot.evidence || []).filter((e) => e.opened && !e.presentedToRoman);
    els.presentEvidence.innerHTML = presentable.length ? presentable.map((e) => `<button type="button" data-present="${esc(e.id)}">Предъявить: ${esc(e.title)}</button>`).join('') : '<small>Новых материалов для предъявления нет.</small>';
    els.presentEvidence.querySelectorAll('[data-present]').forEach((button) => button.addEventListener('click', () => act('PRESENT_EVIDENCE',{evidence_id:button.dataset.present,character_id:'roman'})));
    els.challenge.hidden = !roman.canChallenge;
    els.challenge.onclick = () => act('CHALLENGE_ROMAN');
    renderChat();
  }

  function renderChat() {
    els.chat.innerHTML = chatHistory.length ? chatHistory.map((turn) => `<div class="pp-chat-bubble is-user">${esc(turn.question)}</div><div class="pp-chat-bubble is-roman">${esc(turn.answer)}</div>`).join('') : '<div class="pp-board-empty">Задавайте свои вопросы. Роман помнит состояние дела, включая материалы, которые мог предъявить ваш партнёр.</div>';
    els.chat.scrollTop = els.chat.scrollHeight;
  }

  async function askRoman(event) {
    event.preventDefault(); if (!snapshot?.roman?.available || actionBusy) return;
    const question = (els.chatInput.value || '').trim(); if (!question) return;
    const old = els.chatInput.value; els.chatInput.value = ''; actionBusy = true; els.syncStatus.textContent = 'Роман отвечает…';
    try {
      const response = await post(AI_ENDPOINT,{code:roomCode,browserKey,character_id:'roman',question,recent_history:chatHistory.slice(-8)});
      chatHistory.push({question,answer:response.reply}); if (chatHistory.length>16) chatHistory.splice(0,chatHistory.length-16); renderChat();
      els.syncStatus.textContent = 'Допрос продолжается';
    } catch (error) { els.chatInput.value = old; toast(humanError(error)); }
    finally { actionBusy = false; }
  }

  function humanError(error) {
    const code = error?.code || error?.message || String(error);
    return ({room_not_found:'Комната не найдена.',room_full:'В комнате уже два игрока.',room_expired:'Срок комнаты истёк.',room_inactive:'Комната закрыта.',partner_partner_required:'Сначала должен подключиться второй игрок.',partner_evidence_access_denied:'Этот материал принадлежит архиву второго игрока.',partner_evidence_not_opened:'Сначала откройте материал.',partner_challenge_unavailable:'Для этого противоречия пока недостаточно доказательств.',character_unavailable:'Роман пока недоступен для допроса.',model_unavailable:'ИИ-допрос временно недоступен.'})[code] || String(code).replace(/^partner_store_\d+:/,'Ошибка хранилища: ');
  }

  els.createName.value = savedName(); els.joinName.value = savedName();
  els.create?.addEventListener('click', createRoom); els.join?.addEventListener('click', joinRoom);
  els.createName?.addEventListener('keydown', (e) => { if (e.key === 'Enter') createRoom(); });
  els.joinName?.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinRoom(); });
  els.copyInvite?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(roomUrl()); toast('Ссылка скопирована.'); } catch { toast(roomUrl()); } });
  els.copyCode?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(roomCode); toast('Код скопирован.'); } catch { toast(roomCode); } });
  els.chatForm?.addEventListener('submit', askRoman);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && snapshot) syncSnapshot(); });

  if (roomCode) inspectRoom(); else showOnly(els.entry);
})();
