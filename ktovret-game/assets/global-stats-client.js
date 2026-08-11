(() => {
  'use strict';

  const root = document.querySelector('[data-ktv-root]');
  const cfg = window.KtoVretWeb || {};
  if (!root || !cfg.case) return;

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/case-stats';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  let busy = false;
  let loaded = false;
  let stats = null;

  const injectStyles = () => {
    if (document.querySelector('[data-ml-global-stats-styles]')) return;
    const style = document.createElement('style');
    style.dataset.mlGlobalStatsStyles = 'true';
    style.textContent = `
      .ml-global-stats{margin:18px 0 0;padding:19px 20px;border:1px solid rgba(231,201,143,.25);border-radius:18px;background:linear-gradient(135deg,rgba(231,201,143,.09),rgba(26,53,72,.38));box-shadow:0 16px 44px rgba(0,0,0,.18);color:#eaf3f7}
      .ml-global-kicker{display:block;margin-bottom:6px;color:#e7c98f;font-size:.7rem;font-weight:950;letter-spacing:.11em;text-transform:uppercase}
      .ml-global-head{display:flex;align-items:end;justify-content:space-between;gap:14px;flex-wrap:wrap}
      .ml-global-head strong{font-family:Georgia,'Times New Roman',serif;font-size:clamp(1.65rem,3vw,2.55rem);line-height:1;color:#fff}
      .ml-global-rank{color:#9eb0bd;font-size:.82rem;font-weight:800}
      .ml-global-stats p{margin:9px 0 0;color:#b7c5ce;line-height:1.5}
      .ml-global-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
      .ml-global-chip{padding:7px 10px;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.045);color:#dbe8ef;font-size:.76rem;font-weight:800}
      .ml-global-elite{display:inline-flex;margin-top:14px;padding:8px 11px;border:1px solid rgba(231,201,143,.35);border-radius:10px;background:rgba(231,201,143,.11);color:#f5d99e;font-size:.77rem;font-weight:950;letter-spacing:.04em;text-transform:uppercase}
      @media(max-width:560px){.ml-global-stats{padding:16px}.ml-global-head{align-items:start;display:grid;gap:7px}}
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
    if (!state.solved) return null;
    const end = Number(state.solvedAt || 0);
    const start = Number(state.startedAt || 0);
    if (!end || !start || end < start) return null;
    const elapsedSeconds = Math.max(1, Math.round((end - start) / 1000));
    // These are short investigations. Abandoned browser tabs should not distort
    // the global timing distribution.
    if (elapsedSeconds > 5400) return null;
    return {
      elapsedSeconds,
      hintsUsed: Math.max(0, Math.min(10, Number(state.hintsUsed || 0))),
      attempts: Math.max(1, Math.min(20, Number(state.attempts || 1))),
      firstAnswerCorrect: Boolean(state.firstAnswerCorrect),
    };
  };

  const formatTime = (seconds) => {
    const value = Math.max(0, Math.round(Number(seconds || 0)));
    const minutes = Math.floor(value / 60);
    const rest = value % 60;
    return `${minutes}:${String(rest).padStart(2, '0')}`;
  };

  const phrase = (data) => {
    const top = Number(data.topPercent || 100);
    if (top <= 5) return 'Вы в самой сильной группе этого расследования.';
    if (top <= 10) return 'Элитное раскрытие: вы вошли в верхние 10% результатов.';
    if (top <= 25) return 'Сильное раскрытие: результат заметно выше большинства.';
    if (top <= 50) return 'Вы в верхней половине следователей этого дела.';
    return 'Попробуйте реванш: повтор не изменит ваше первое достижение, но поможет проверить логику ещё раз.';
  };

  const render = () => {
    if (!stats) return;
    const result = root.querySelector('#ktv-result');
    if (!result) return;
    if (result.querySelector('[data-ml-global-stats]')) return;

    injectStyles();
    const card = document.createElement('section');
    card.className = 'ml-global-stats';
    card.dataset.mlGlobalStats = 'true';

    const total = Number(stats.totalPlayers || 0);
    const sampleSufficient = Boolean(stats.sampleSufficient);
    if (!sampleSufficient) {
      card.innerHTML = `
        <span class="ml-global-kicker">Вы против всех</span>
        <div class="ml-global-head">
          <strong>Среди первых ${total}</strong>
          <span class="ml-global-rank">Глобальный рейтинг формируется</span>
        </div>
        <p>Когда у дела наберётся 20 уникальных первых прохождений, здесь появится ваше место и процентиль.</p>
      `;
    } else {
      const top = Number(stats.topPercent || 100);
      card.innerHTML = `
        <span class="ml-global-kicker">Вы против всех</span>
        <div class="ml-global-head">
          <strong>Топ ${top}%</strong>
          <span class="ml-global-rank">№${Number(stats.rank || 1)} из ${total}</span>
        </div>
        <p>${phrase(stats)}</p>
        <div class="ml-global-chips">
          <span class="ml-global-chip">Чистое первое раскрытие: ${Number(stats.cleanRatePct || 0).toFixed(1)}%</span>
          <span class="ml-global-chip">С первой попытки: ${Number(stats.firstTryRatePct || 0).toFixed(1)}%</span>
          <span class="ml-global-chip">Медиана времени: ${formatTime(stats.medianSeconds)}</span>
        </div>
        ${top <= 10 ? '<span class="ml-global-elite">Элитное раскрытие</span>' : ''}
      `;
    }

    const firstResult = result.querySelector('.ktv-first-result');
    if (firstResult) firstResult.insertAdjacentElement('afterend', card);
    else {
      const lead = result.querySelector('.ktv-result-lead');
      if (lead) lead.insertAdjacentElement('afterend', card);
      else result.appendChild(card);
    }
  };

  const submit = async () => {
    if (busy || loaded) {
      render();
      return;
    }
    const data = metrics();
    if (!data) return;

    busy = true;
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          browserKey: clientKey(),
          caseId: String(cfg.case.id || ''),
          casePath: location.pathname,
          ...data,
        }),
      });
      if (!response.ok) return;
      stats = await response.json();
      loaded = true;
      render();
    } catch {
      // Global comparison is an enhancement and must never block the case result.
    } finally {
      busy = false;
    }
  };

  root.addEventListener('click', (event) => {
    if (event.target.closest?.('[data-action="submit"]')) {
      window.setTimeout(submit, 0);
      window.setTimeout(submit, 180);
    }
  }, true);

  const observer = new MutationObserver(() => {
    if (stats) render();
    else submit();
  });
  observer.observe(root, { childList: true, subtree: true });

  submit();
})();
