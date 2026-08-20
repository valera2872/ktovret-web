(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/duel-room';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
  const cfg = window.KtoVretWeb || {};
  const root = document.querySelector('[data-ktv-root]');
  const code = new URL(location.href).searchParams.get('duel')?.trim().toUpperCase() || '';
  if (!root || !cfg.case || !CODE_RE.test(code)) return;

  let roomState = null;
  let submitting = false;
  let pollTimer = null;
  let observer = null;

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

  const api = async (body) => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ ...body, browserKey: clientKey() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
    return data;
  };

  const track = (event, params = {}) => {
    try {
      window.MysteryLogicAnalytics?.track?.(event, { room_code: code, ...params });
    } catch {}
  };

  const readState = () => {
    try {
      return JSON.parse(localStorage.getItem(cfg.storageKey || '') || '{}') || {};
    } catch {
      return {};
    }
  };

  const metrics = () => {
    const state = readState();
    const end = Number(state.solvedAt || Date.now());
    const start = Number(state.startedAt || end - 1000);
    return {
      elapsedSeconds: Math.max(1, Math.min(21600, Math.round((end - start) / 1000))),
      hintsUsed: Math.max(0, Math.min(10, Number(state.hintsUsed || 0))),
      attempts: Math.max(1, Math.min(20, Number(state.attempts || 1))),
      firstAnswerCorrect: Boolean(state.firstAnswerCorrect),
    };
  };

  const formatTime = (seconds) => {
    const value = Math.max(0, Number(seconds || 0));
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  };

  const hintLabel = (value) => Number(value) === 0 ? 'без подсказок' : `подсказок: ${Number(value)}`;
  const attemptLabel = (value) => Number(value) === 1 ? 'с первой попытки' : `попыток: ${Number(value)}`;

  const injectStyles = () => {
    if (document.querySelector('[data-duel-case-styles]')) return;
    const style = document.createElement('style');
    style.dataset.duelCaseStyles = 'true';
    style.textContent = `
      .duel-case-banner,.duel-case-wait,.duel-case-results{margin:18px 0;padding:18px;border:1px solid rgba(113,190,241,.3);border-radius:18px;background:linear-gradient(135deg,rgba(26,74,108,.3),rgba(10,29,43,.78));box-shadow:0 18px 50px rgba(0,0,0,.2);color:#eaf6fd}
      .duel-case-kicker{display:block;margin-bottom:5px;color:#85c8f4;font-size:.7rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
      .duel-case-banner strong,.duel-case-wait strong,.duel-case-results strong{color:#fff}
      .duel-case-banner p,.duel-case-wait p,.duel-case-results p{margin:7px 0 0;color:rgba(233,246,254,.76);line-height:1.5}
      .duel-case-banner-line{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
      .duel-case-chip{padding:7px 10px;border:1px solid rgba(255,255,255,.11);border-radius:999px;background:rgba(255,255,255,.05);font-size:.75rem;font-weight:850}
      .duel-case-room-link{display:inline-flex;margin-top:12px;color:#a9d9f7;font-size:.76rem;font-weight:900;text-decoration:none}
      .duel-case-room-link:hover{text-decoration:underline}
      .duel-case-wait{border-color:rgba(123,198,158,.28);background:linear-gradient(135deg,rgba(57,124,89,.16),rgba(10,29,43,.78))}
      .duel-case-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:15px}
      .duel-case-player{padding:14px;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:rgba(0,0,0,.12)}
      .duel-case-player small{display:block;color:#8198a8;margin-bottom:5px}
      .duel-case-player b{display:block;color:#fff;font-size:1.25rem}
      .duel-case-player span{display:block;margin-top:6px;color:#9fb2bf;font-size:.76rem}
      .duel-case-verdict{margin-top:14px!important;color:#c4e5f8!important;font-weight:900}
      @media(max-width:560px){.duel-case-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  };

  const roomPageUrl = () => {
    const url = new URL('/detektivnye-igry-dlya-dvoih/', location.origin);
    url.searchParams.set('room', code);
    return url.href;
  };

  const ensureBanner = () => {
    if (!roomState || roomState.room.caseId !== String(cfg.case.id || '')) return;
    let banner = root.querySelector('[data-duel-case-banner]');
    if (!banner) {
      banner = document.createElement('section');
      banner.className = 'duel-case-banner';
      banner.dataset.duelCaseBanner = 'true';
      root.prepend(banner);
    }
    const opponent = roomState.opponent || { joined: false };
    banner.innerHTML = `
      <span class="duel-case-kicker">Игра на двоих · ${escapeHtml(code)}</span>
      <strong>${opponent.joined ? `${escapeHtml(opponent.name)} играет с вами` : 'Комната ожидает второго игрока'}</strong>
      <p>Вы проходите одно и то же дело независимо. Чужие попытки, время и итог скрыты до завершения обоих расследований.</p>
      <div class="duel-case-banner-line">
        <span class="duel-case-chip">Вы: ${roomState.me.completed ? 'завершили' : roomState.me.started ? 'в расследовании' : 'готовы'}</span>
        <span class="duel-case-chip">${opponent.joined ? `${escapeHtml(opponent.name)}: ${opponent.completed ? 'завершил' : opponent.started ? 'в расследовании' : 'готов'}` : 'соперник не подключён'}</span>
      </div>
      <a class="duel-case-room-link" href="${escapeHtml(roomPageUrl())}">Вернуться в комнату →</a>
    `;
  };

  const removeOrdinaryChallengeAction = () => {
    root.querySelectorAll('[data-action="share"]').forEach((button) => button.remove());
  };

  const ensureWaiting = () => {
    if (!roomState?.me?.completed || roomState.bothCompleted) {
      root.querySelector('[data-duel-case-wait]')?.remove();
      return;
    }
    const result = root.querySelector('#ktv-result,.ktv-result');
    if (!result) return;
    let card = result.querySelector('[data-duel-case-wait]');
    if (!card) {
      card = document.createElement('section');
      card.className = 'duel-case-wait';
      card.dataset.duelCaseWait = 'true';
      const actions = result.querySelector('.ktv-result-actions');
      if (actions) actions.before(card);
      else result.appendChild(card);
    }
    card.innerHTML = `
      <span class="duel-case-kicker">Ваше расследование завершено</span>
      <strong>Ждём второго игрока</strong>
      <p>${roomState.opponent?.joined ? `${escapeHtml(roomState.opponent.name)} ещё расследует дело.` : 'Второй игрок ещё не подключился к комнате.'} Сравнение откроется автоматически, когда оба закончат.</p>
    `;
  };

  const cleanScore = (value) => [
    value.firstAnswerCorrect ? 0 : 1,
    Number(value.hintsUsed || 0),
    Number(value.attempts || 0),
  ];

  const compareClean = (left, right) => {
    const a = cleanScore(left);
    const b = cleanScore(right);
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] < b[i]) return -1;
      if (a[i] > b[i]) return 1;
    }
    return 0;
  };

  const verdict = (mine, other) => {
    const clean = compareClean(mine, other);
    const delta = Number(other.elapsedSeconds) - Number(mine.elapsedSeconds);
    if (clean < 0 && delta > 0) return `Вы решили чище и были быстрее на ${delta} сек.`;
    if (clean < 0) return 'По качеству решения вы впереди, хотя соперник был быстрее.';
    if (clean > 0 && delta > 0) return 'Вы были быстрее, но соперник решил дело чище.';
    if (clean > 0) return 'В этом раунде соперник оказался сильнее.';
    if (delta > 0) return `При одинаковой чистоте решения вы быстрее на ${delta} сек.`;
    if (delta < 0) return `При одинаковой чистоте решения соперник быстрее на ${Math.abs(delta)} сек.`;
    return 'Абсолютная ничья: одинаковая чистота решения и одинаковое время.';
  };

  const ensureResults = () => {
    if (!roomState?.bothCompleted || !roomState.results) return;
    const result = root.querySelector('#ktv-result,.ktv-result');
    if (!result) return;
    root.querySelector('[data-duel-case-wait]')?.remove();
    let card = result.querySelector('[data-duel-case-results]');
    if (!card) {
      card = document.createElement('section');
      card.className = 'duel-case-results';
      card.dataset.duelCaseResults = 'true';
      const actions = result.querySelector('.ktv-result-actions');
      if (actions) actions.before(card);
      else result.appendChild(card);
    }

    const mine = roomState.results[roomState.me.role];
    const otherRole = roomState.me.role === 'creator' ? 'guest' : 'creator';
    const other = roomState.results[otherRole];
    card.innerHTML = `
      <span class="duel-case-kicker">Финал игры на двоих</span>
      <strong>Оба расследования завершены</strong>
      <div class="duel-case-grid">
        <div class="duel-case-player">
          <small>Вы · ${escapeHtml(mine.name)}</small>
          <b>${escapeHtml(formatTime(mine.elapsedSeconds))}</b>
          <span>${escapeHtml(hintLabel(mine.hintsUsed))} · ${escapeHtml(attemptLabel(mine.attempts))}</span>
        </div>
        <div class="duel-case-player">
          <small>Соперник · ${escapeHtml(other.name)}</small>
          <b>${escapeHtml(formatTime(other.elapsedSeconds))}</b>
          <span>${escapeHtml(hintLabel(other.hintsUsed))} · ${escapeHtml(attemptLabel(other.attempts))}</span>
        </div>
      </div>
      <p class="duel-case-verdict">${escapeHtml(verdict(mine, other))}</p>
      <a class="duel-case-room-link" href="${escapeHtml(roomPageUrl())}">Вернуться в комнату →</a>
    `;
  };

  const renderRoomUi = () => {
    observer?.disconnect();
    try {
      ensureBanner();
      removeOrdinaryChallengeAction();
      ensureWaiting();
      ensureResults();
    } finally {
      observer?.observe(root, { childList: true, subtree: true });
    }
  };

  const schedulePoll = () => {
    if (pollTimer) clearTimeout(pollTimer);
    if (roomState?.bothCompleted) return;
    pollTimer = setTimeout(async () => {
      try {
        const next = await api({ action: 'status', code });
        if (next.room.caseId !== String(cfg.case.id || '')) return;
        const becameComplete = !roomState?.bothCompleted && next.bothCompleted;
        roomState = next;
        renderRoomUi();
        if (becameComplete) track('duel_both_completed', { case_id: String(cfg.case.id || '') });
      } catch {
        // Keep the local game usable even when room status is temporarily unavailable.
      }
      schedulePoll();
    }, 4000);
  };

  const submitIfSolved = async () => {
    if (submitting || roomState?.me?.completed) return;
    const state = readState();
    if (!state.solved) return;
    submitting = true;
    try {
      const next = await api({ action: 'complete', code, ...metrics() });
      if (next.room.caseId !== String(cfg.case.id || '')) return;
      roomState = next;
      track('duel_player_completed', { case_id: String(cfg.case.id || ''), both_completed: Boolean(next.bothCompleted) });
      renderRoomUi();
      schedulePoll();
    } catch {
      // The ordinary game result remains available; retry on the next DOM mutation/status cycle.
    } finally {
      submitting = false;
    }
  };

  const loadRoom = async () => {
    injectStyles();
    try {
      const state = await api({ action: 'status', code });
      if (state.room.caseId !== String(cfg.case.id || '')) {
        throw new Error('wrong_case');
      }
      roomState = state;
      renderRoomUi();
      submitIfSolved();
      schedulePoll();
    } catch {
      const banner = document.createElement('section');
      banner.className = 'duel-case-banner';
      banner.dataset.duelCaseBanner = 'true';
      banner.innerHTML = `
        <span class="duel-case-kicker">Игра на двоих</span>
        <strong>Комната недоступна</strong>
        <p>Само дело можно продолжить, но результат этой дуэли не будет отправлен. Вернитесь на страницу игры для двоих и создайте новую комнату.</p>
        <a class="duel-case-room-link" href="/detektivnye-igry-dlya-dvoih/">Открыть режим для двоих →</a>
      `;
      root.prepend(banner);
    }
  };

  observer = new MutationObserver(() => {
    if (!roomState) return;
    renderRoomUi();
    submitIfSolved();
  });
  observer.observe(root, { childList: true, subtree: true });
  window.addEventListener('beforeunload', () => {
    if (pollTimer) clearTimeout(pollTimer);
    observer?.disconnect();
  });

  loadRoom();
})();
