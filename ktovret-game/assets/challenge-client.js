(() => {
  'use strict';

  const cfg = window.KtoVretWeb || {};
  const root = document.querySelector('[data-ktv-root]');
  if (!root || !cfg.case) return;

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/challenge';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  const NICKNAME_STORAGE = 'mysterylogic:challenge:nickname';
  const CHALLENGE_PARAM = 'challenge';
  const challengeCode = new URL(location.href).searchParams.get(CHALLENGE_PARAM)?.trim().toUpperCase() || '';

  let challengeInfo = null;
  let comparison = null;
  let createModal = null;
  let createBusy = false;
  let comparisonBusy = false;

  const injectStyles = () => {
    if (document.querySelector('[data-ml-challenge-styles]')) return;
    const style = document.createElement('style');
    style.dataset.mlChallengeStyles = 'true';
    style.textContent = `
      .ml-challenge-banner,.ml-challenge-comparison{margin:18px 0;padding:18px;border:1px solid rgba(115,184,255,.34);border-radius:18px;background:linear-gradient(135deg,rgba(24,75,120,.34),rgba(16,35,58,.72));box-shadow:0 18px 46px rgba(0,0,0,.22);color:#eaf5ff}
      .ml-challenge-banner strong,.ml-challenge-comparison strong{color:#fff}
      .ml-challenge-banner p,.ml-challenge-comparison p{margin:6px 0 0;color:rgba(232,244,255,.82)}
      .ml-challenge-kicker{display:block;margin-bottom:5px;color:#7cc7ff;font-size:.72rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
      .ml-challenge-stats{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
      .ml-challenge-chip{padding:7px 10px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.06);font-size:.78rem;font-weight:800}
      .ml-challenge-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
      .ml-challenge-player{padding:13px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(0,0,0,.13)}
      .ml-challenge-player small{display:block;color:rgba(232,244,255,.62);margin-bottom:5px}
      .ml-challenge-player b{display:block;font-size:1.15rem;color:#fff}
      .ml-challenge-verdict{margin-top:13px!important;font-weight:800;color:#bde5ff!important}
      .ml-challenge-overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:18px;background:rgba(2,8,15,.78);backdrop-filter:blur(10px)}
      .ml-challenge-modal{width:min(520px,100%);padding:22px;border:1px solid rgba(125,193,255,.28);border-radius:22px;background:#0b1725;box-shadow:0 28px 90px rgba(0,0,0,.5);color:#eef8ff}
      .ml-challenge-modal h2{margin:0 0 8px;font-size:1.45rem;color:#fff}
      .ml-challenge-modal p{margin:0;color:rgba(235,247,255,.72);line-height:1.5}
      .ml-challenge-field{display:grid;gap:7px;margin:18px 0}
      .ml-challenge-field span{font-size:.78rem;font-weight:900;color:#9fd5ff;text-transform:uppercase;letter-spacing:.06em}
      .ml-challenge-field input{width:100%;box-sizing:border-box;padding:13px 14px;border:1px solid rgba(255,255,255,.15);border-radius:13px;background:#07111d;color:#fff;font:inherit;outline:none}
      .ml-challenge-field input:focus{border-color:#69bfff;box-shadow:0 0 0 3px rgba(68,162,235,.16)}
      .ml-challenge-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
      .ml-challenge-actions button{min-height:44px;padding:0 15px;border-radius:12px;font:inherit;font-weight:900;cursor:pointer}
      .ml-challenge-primary{border:0;background:#e8f5ff;color:#07111d}
      .ml-challenge-secondary{border:1px solid rgba(255,255,255,.16);background:transparent;color:#e9f6ff}
      .ml-challenge-actions button:disabled{opacity:.55;cursor:wait}
      .ml-challenge-error{margin-top:12px!important;color:#ffc7b9!important}
      .ml-challenge-ready{margin-top:16px;padding:13px;border:1px solid rgba(123,213,167,.27);border-radius:13px;background:rgba(70,165,119,.12);word-break:break-word}
      @media(max-width:560px){.ml-challenge-grid{grid-template-columns:1fr}.ml-challenge-modal{padding:18px}.ml-challenge-actions{display:grid}.ml-challenge-actions button{width:100%}}
    `;
    document.head.appendChild(style);
  };

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
    const elapsedSeconds = Math.max(1, Math.min(21600, Math.round((end - start) / 1000)));
    return {
      elapsedSeconds,
      hintsUsed: Math.max(0, Math.min(10, Number(state.hintsUsed || 0))),
      attempts: Math.max(1, Math.min(20, Number(state.attempts || 1))),
      firstAnswerCorrect: Boolean(state.firstAnswerCorrect),
    };
  };

  const formatTime = (seconds) => {
    const value = Math.max(0, Number(seconds || 0));
    const minutes = Math.floor(value / 60);
    const rest = value % 60;
    return `${minutes}:${String(rest).padStart(2, '0')}`;
  };

  const hintLabel = (value) => Number(value) === 0 ? 'без подсказок' : `${value} подсказк${Number(value) === 1 ? 'а' : 'и'}`;
  const attemptLabel = (value) => Number(value) === 1 ? 'с первой попытки' : `${value} попытки`;

  const api = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body?.error || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return body;
  };

  const closeModal = () => {
    createModal?.remove();
    createModal = null;
    createBusy = false;
  };

  const sharePreparedChallenge = async (shareUrl, nickname) => {
    const data = metrics();
    const text = `${nickname} раскрыл дело «${cfg.case.title}» за ${formatTime(data.elapsedSeconds)}. Сможете лучше?`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Вызов Mystery Logic', text, url: shareUrl });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
    alert('Вызов и ссылка скопированы.');
  };

  const openCreateModal = () => {
    if (createModal) return;
    injectStyles();
    const data = metrics();
    const overlay = document.createElement('div');
    overlay.className = 'ml-challenge-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="ml-challenge-modal">
        <span class="ml-challenge-kicker">Дуэль следователей</span>
        <h2>Бросить вызов другу</h2>
        <p>Друг получит то же дело и увидит ваш результат до начала расследования — без спойлеров и ответа.</p>
        <div class="ml-challenge-stats">
          <span class="ml-challenge-chip">${formatTime(data.elapsedSeconds)}</span>
          <span class="ml-challenge-chip">${hintLabel(data.hintsUsed)}</span>
          <span class="ml-challenge-chip">${attemptLabel(data.attempts)}</span>
        </div>
        <label class="ml-challenge-field">
          <span>Как вас подписать</span>
          <input data-ml-challenge-name maxlength="32" autocomplete="nickname" placeholder="Следователь" value="">
        </label>
        <p class="ml-challenge-error" data-ml-challenge-error hidden></p>
        <div data-ml-challenge-ready></div>
        <div class="ml-challenge-actions">
          <button class="ml-challenge-secondary" type="button" data-ml-challenge-close>Отмена</button>
          <button class="ml-challenge-primary" type="button" data-ml-challenge-create>Создать вызов</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    createModal = overlay;

    const input = overlay.querySelector('[data-ml-challenge-name]');
    input.value = (localStorage.getItem(NICKNAME_STORAGE) || 'Следователь').slice(0, 32);
    requestAnimationFrame(() => input.focus());

    overlay.querySelector('[data-ml-challenge-close]').addEventListener('click', closeModal);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeModal();
    });

    overlay.querySelector('[data-ml-challenge-create]').addEventListener('click', async () => {
      const createButton = overlay.querySelector('[data-ml-challenge-create]');
      const errorBox = overlay.querySelector('[data-ml-challenge-error]');
      const readyBox = overlay.querySelector('[data-ml-challenge-ready]');
      const nickname = (input.value || 'Следователь').trim().replace(/\s+/g, ' ').slice(0, 32) || 'Следователь';
      if (createButton.dataset.shareUrl) {
        await sharePreparedChallenge(createButton.dataset.shareUrl, createButton.dataset.nickname || nickname);
        return;
      }
      if (createBusy) return;
      createBusy = true;
      createButton.disabled = true;
      createButton.textContent = 'Создаём…';
      errorBox.hidden = true;
      readyBox.innerHTML = '';

      try {
        localStorage.setItem(NICKNAME_STORAGE, nickname);
        const result = await api(ENDPOINT, {
          method: 'POST',
          body: JSON.stringify({
            action: 'create',
            browserKey: clientKey(),
            caseId: String(cfg.case.id || ''),
            caseTitle: String(cfg.case.title || ''),
            casePath: location.pathname,
            challengerName: nickname,
            ...data,
          }),
        });
        readyBox.className = 'ml-challenge-ready';
        readyBox.textContent = result.shareUrl;
        createButton.textContent = 'Поделиться вызовом';
        createButton.disabled = false;
        createButton.dataset.shareUrl = result.shareUrl;
        createButton.dataset.nickname = nickname;
        createBusy = false;
      } catch (error) {
        errorBox.hidden = false;
        errorBox.textContent = error?.status === 429
          ? 'Слишком много новых вызовов за короткое время. Попробуйте немного позже.'
          : 'Не удалось создать вызов. Обычная ссылка на дело по-прежнему работает.';
        createButton.disabled = false;
        createButton.textContent = 'Повторить';
        createBusy = false;
      }
    });
  };

  const challengeSummary = (info) => `${formatTime(info.challenger.elapsedSeconds)} · ${hintLabel(info.challenger.hintsUsed)} · ${attemptLabel(info.challenger.attempts)}`;

  const ensureChallengeBanner = () => {
    if (!challengeInfo || challengeInfo.caseId !== String(cfg.case.id || '')) return;
    if (root.querySelector('[data-ml-challenge-banner]')) return;
    const banner = document.createElement('section');
    banner.className = 'ml-challenge-banner';
    banner.dataset.mlChallengeBanner = 'true';
    banner.innerHTML = `
      <span class="ml-challenge-kicker">Вызов принят</span>
      <strong></strong>
      <p></p>
      <div class="ml-challenge-stats"></div>
    `;
    banner.querySelector('strong').textContent = `${challengeInfo.challenger.name} уже раскрыл это дело.`;
    banner.querySelector('p').textContent = 'Теперь ваша очередь. Решение и правильный ответ в вызове не передаются.';
    const stats = banner.querySelector('.ml-challenge-stats');
    challengeSummary(challengeInfo).split(' · ').forEach((item) => {
      const chip = document.createElement('span');
      chip.className = 'ml-challenge-chip';
      chip.textContent = item;
      stats.appendChild(chip);
    });
    root.prepend(banner);
  };

  const cleanScore = (value) => {
    const first = value.firstAnswerCorrect ? 0 : 1;
    return [first, Number(value.hintsUsed || 0), Number(value.attempts || 0)];
  };

  const compareClean = (left, right) => {
    const a = cleanScore(left);
    const b = cleanScore(right);
    for (let index = 0; index < a.length; index += 1) {
      if (a[index] < b[index]) return -1;
      if (a[index] > b[index]) return 1;
    }
    return 0;
  };

  const comparisonVerdict = (data) => {
    const challenger = data.challenger;
    const player = data.player;
    const clean = compareClean(player, challenger);
    const delta = Number(challenger.elapsedSeconds) - Number(player.elapsedSeconds);
    if (clean < 0 && delta > 0) return `Вы выиграли по чистоте решения и были быстрее на ${Math.abs(delta)} сек.`;
    if (clean < 0) return 'По качеству решения вы впереди. По скорости соперник оказался быстрее.';
    if (clean > 0 && delta > 0) return 'Вы были быстрее, но соперник решил дело чище.';
    if (clean > 0) return 'В этом раунде соперник оказался сильнее. Берите реванш на другом деле.';
    if (delta > 0) return `При одинаковой чистоте решения вы быстрее на ${delta} сек.`;
    if (delta < 0) return `При одинаковой чистоте решения соперник быстрее на ${Math.abs(delta)} сек.`;
    return 'Абсолютная ничья: одинаковая чистота решения и одинаковое время.';
  };

  const ensureComparison = () => {
    if (!comparison) return;
    const result = root.querySelector('.ktv-result');
    if (!result || result.querySelector('[data-ml-challenge-comparison]')) return;
    const card = document.createElement('section');
    card.className = 'ml-challenge-comparison';
    card.dataset.mlChallengeComparison = 'true';
    card.innerHTML = `
      <span class="ml-challenge-kicker">Результат дуэли</span>
      <strong>Сравнение результатов</strong>
      <div class="ml-challenge-grid">
        <div class="ml-challenge-player" data-side="challenger"><small></small><b></b><span></span></div>
        <div class="ml-challenge-player" data-side="player"><small>Вы</small><b></b><span></span></div>
      </div>
      <p class="ml-challenge-verdict"></p>
    `;
    const challenger = card.querySelector('[data-side="challenger"]');
    const player = card.querySelector('[data-side="player"]');
    challenger.querySelector('small').textContent = comparison.challenger.name;
    challenger.querySelector('b').textContent = formatTime(comparison.challenger.elapsedSeconds);
    challenger.querySelector('span').textContent = `${hintLabel(comparison.challenger.hintsUsed)} · ${attemptLabel(comparison.challenger.attempts)}`;
    player.querySelector('b').textContent = formatTime(comparison.player.elapsedSeconds);
    player.querySelector('span').textContent = `${hintLabel(comparison.player.hintsUsed)} · ${attemptLabel(comparison.player.attempts)}`;
    card.querySelector('.ml-challenge-verdict').textContent = comparisonVerdict(comparison);
    const actions = result.querySelector('.ktv-result-actions');
    if (actions) actions.before(card);
    else result.appendChild(card);
  };

  const submitChallengeResult = async () => {
    if (!challengeInfo || comparisonBusy) return;
    const state = readState();
    if (!state.solved) return;
    const cacheKey = `mysterylogic:challenge:comparison:${challengeCode}:${cfg.case.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { comparison = JSON.parse(cached); } catch { /* ignore */ }
      ensureComparison();
      return;
    }

    comparisonBusy = true;
    try {
      const result = await api(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          action: 'complete',
          code: challengeCode,
          browserKey: clientKey(),
          ...metrics(),
        }),
      });
      comparison = { challenger: result.challenger, player: result.player };
      localStorage.setItem(cacheKey, JSON.stringify(comparison));
      ensureComparison();
    } catch {
      // The game result remains valid even if challenge comparison is temporarily unavailable.
    } finally {
      comparisonBusy = false;
    }
  };

  const loadChallenge = async () => {
    if (!/^[A-HJ-NP-Z2-9]{8}$/.test(challengeCode)) return;
    try {
      const info = await api(`${ENDPOINT}?code=${encodeURIComponent(challengeCode)}`, { headers: {} });
      if (info.caseId !== String(cfg.case.id || '')) return;
      challengeInfo = info;
      ensureChallengeBanner();
      submitChallengeResult();
    } catch {
      // Invalid/expired challenges gracefully fall back to the ordinary game.
    }
  };

  injectStyles();

  root.addEventListener('click', (event) => {
    const share = event.target.closest?.('[data-action="share"]');
    if (!share) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openCreateModal();
  }, true);

  const observer = new MutationObserver(() => {
    ensureChallengeBanner();
    ensureComparison();
    submitChallengeResult();
  });
  observer.observe(root, { childList: true, subtree: true });

  loadChallenge();
})();
