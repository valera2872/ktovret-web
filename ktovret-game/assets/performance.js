(() => {
  'use strict';

  const root = document.querySelector('[data-ktv-root]');
  const cfg = window.KtoVretWeb || {};
  if (!root || !cfg.case) return;

  const storageKey = cfg.storageKey || `ktovret:web:v2:${cfg.case.id}`;
  const achievementKey = `ktovret:achievement:v1:${cfg.case.id}`;
  const answerStage = Array.isArray(cfg.case.answerStages) ? cfg.case.answerStages[0] : null;
  const correctOptionId = answerStage?.correctOptionIds?.[0] || '';

  const read = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be unavailable in strict privacy modes.
    }
  };

  const pluralAttempts = (value) => {
    const number = Math.max(1, Number(value) || 1);
    const mod100 = number % 100;
    const mod10 = number % 10;
    if (mod100 >= 11 && mod100 <= 14) return `${number} попыток`;
    if (mod10 === 1) return `${number} попытку`;
    if (mod10 >= 2 && mod10 <= 4) return `${number} попытки`;
    return `${number} попыток`;
  };

  const pluralHints = (value) => {
    const number = Math.max(0, Number(value) || 0);
    const mod100 = number % 100;
    const mod10 = number % 10;
    if (mod100 >= 11 && mod100 <= 14) return `${number} подсказок`;
    if (mod10 === 1) return `${number} подсказка`;
    if (mod10 >= 2 && mod10 <= 4) return `${number} подсказки`;
    return `${number} подсказок`;
  };

  const buildAchievement = (state, attemptsOverride) => {
    const attempts = Math.max(1, Number(attemptsOverride ?? state.attempts ?? 1));
    const hints = Math.max(0, Number(state.hintsUsed || 0));
    return {
      firstCompletionAt: Number(state.solvedAt || Date.now()),
      firstCompletionAttempts: attempts,
      firstCompletionHints: hints,
      firstCompletionClean: attempts === 1 && hints === 0,
    };
  };

  const migrateLegacyResult = () => {
    const existing = read(achievementKey);
    if (existing.firstCompletionAt) return;

    const state = read(storageKey);
    if (!state.solved) return;

    write(achievementKey, buildAchievement(state));
  };

  migrateLegacyResult();

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || button.dataset.action !== 'submit') return;

    const existing = read(achievementKey);
    if (existing.firstCompletionAt) return;

    const state = read(storageKey);
    const selectedOptionId = state.selectedOptionId || root.querySelector('.ktv-option.is-selected')?.dataset.optionId || '';
    if (!correctOptionId || selectedOptionId !== correctOptionId) return;

    write(achievementKey, buildAchievement(state, Number(state.attempts || 0) + 1));
  }, true);

  if (!document.querySelector('[data-ktv-performance-styles]')) {
    const style = document.createElement('style');
    style.dataset.ktvPerformanceStyles = 'true';
    style.textContent = `
      .ktv-first-result{display:grid;gap:4px;margin:14px 0 0;padding:14px 16px;border:1px solid rgba(231,201,143,.22);border-radius:15px;background:rgba(231,201,143,.065)}
      .ktv-first-result small{color:#e7c98f;font-size:.68rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
      .ktv-first-result strong{color:#fff;font-size:.96rem}
      .ktv-first-result span{color:#a8b6c5;font-size:.78rem}
    `;
    document.head.appendChild(style);
  }

  const enhanceResult = () => {
    const result = root.querySelector('#ktv-result');
    if (!result) return;

    const state = read(storageKey);
    if (!state.solved) return;

    const attempts = Math.max(1, Number(state.attempts || 1));
    const hints = Math.max(0, Number(state.hintsUsed || 0));
    const cleanCurrentRun = attempts === 1 && hints === 0;
    const badge = result.querySelector('.ktv-result-badge');
    const title = result.querySelector('h2');

    if (badge) {
      badge.textContent = cleanCurrentRun
        ? 'Раскрыто с первой попытки'
        : hints > 0
          ? `Раскрыто · ${pluralHints(hints)}`
          : `Раскрыто за ${pluralAttempts(attempts)}`;
    }

    if (title) {
      title.textContent = cleanCurrentRun ? 'Чистое раскрытие' : 'Дело раскрыто';
    }

    let achievement = read(achievementKey);
    if (!achievement.firstCompletionAt) {
      achievement = buildAchievement(state);
      write(achievementKey, achievement);
    }

    let panel = result.querySelector('.ktv-first-result');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'ktv-first-result';
      const lead = result.querySelector('.ktv-result-lead');
      if (lead) lead.insertAdjacentElement('afterend', panel);
      else result.appendChild(panel);
    }

    const firstAttempts = Math.max(1, Number(achievement.firstCompletionAttempts || 1));
    const firstHints = Math.max(0, Number(achievement.firstCompletionHints || 0));
    panel.innerHTML = achievement.firstCompletionClean
      ? '<small>Постоянное достижение</small><strong>Чистое первое раскрытие</strong><span>Сохранено для будущих наград и бонусов.</span>'
      : `<small>Первое прохождение</small><strong>${pluralAttempts(firstAttempts)} · ${pluralHints(firstHints)}</strong><span>Повторные прохождения не изменят этот результат.</span>`;
  };

  new MutationObserver(enhanceResult).observe(root, { childList: true, subtree: true });
  enhanceResult();
})();
