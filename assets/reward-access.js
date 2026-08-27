(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/reward-access';
  const LAST_REWARD_KEY = 'mysterylogic:player-reward:last';
  const LAST_ARIA_TOKEN_KEY = 'mysterylogic:last-aria:access-token';
  const REWARD_CODE_RE = /^ml_reward_(?:[A-HJ-NP-Z2-9]{4}-){6}[A-HJ-NP-Z2-9]{4}$/;

  const activateForm = document.querySelector('[data-reward-form]');
  const codeInput = document.querySelector('[data-reward-code]');
  const activateButton = document.querySelector('[data-reward-submit]');
  const activateNote = document.querySelector('[data-reward-note]');
  const result = document.querySelector('[data-reward-result]');
  const resultTitle = document.querySelector('[data-reward-title]');
  const resultDescription = document.querySelector('[data-reward-description]');
  const resultMeta = document.querySelector('[data-reward-meta]');
  const openLink = document.querySelector('[data-reward-open]');
  const feedbackOpen = document.querySelector('[data-reward-feedback-open]');
  const feedbackSection = document.querySelector('[data-reward-feedback]');
  const feedbackForm = document.querySelector('[data-feedback-form]');
  const feedbackButton = document.querySelector('[data-feedback-submit]');
  const feedbackNote = document.querySelector('[data-feedback-note]');

  let activeReward = null;
  let activeCode = '';
  let busy = false;

  const normalizeCode = (value = '') => {
    const raw = String(value || '').trim().replace(/\s+/g, '');
    const match = raw.match(/^ml_reward_(.+)$/i);
    return match ? `ml_reward_${match[1].toUpperCase()}` : raw;
  };

  const setNote = (node, text, kind = '') => {
    if (!node) return;
    node.textContent = text;
    node.dataset.kind = kind;
  };

  const track = (event, params = {}) => {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event, page_type: 'player_reward', ...params });
    } catch {}
    try {
      if (typeof window.ym === 'function') window.ym(111664459, 'reachGoal', event, { page_type: 'player_reward', ...params });
    } catch {}
  };

  const request = async (action, code, extra = {}) => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action, code, ...extra }),
      cache: 'no-store',
      credentials: 'omit',
    });
    let body = {};
    try { body = await response.json(); } catch {}
    if (!response.ok) throw new Error(body.error || `http_${response.status}`);
    return body;
  };

  const persistReward = (code, reward) => {
    const value = {
      code,
      productId: reward.productId,
      caseId: reward.caseId,
      caseTitle: reward.caseTitle,
      targetPath: reward.targetPath,
      expiresAt: reward.expiresAt || null,
      activatedAt: reward.activatedAt || null,
      feedbackAt: reward.feedbackAt || null,
    };
    try { localStorage.setItem(LAST_REWARD_KEY, JSON.stringify(value)); } catch {}
    if (reward.productId === 'volume1' && reward.caseId) {
      try { localStorage.setItem(`mysterylogic:reward:case:${reward.caseId}`, code); } catch {}
    }
    if (reward.productId === 'last_aria') {
      try { localStorage.setItem(LAST_ARIA_TOKEN_KEY, code); } catch {}
    }
  };

  const prettyDate = (value) => {
    if (!value) return 'Без ограничения срока';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `Доступ до ${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)}`;
  };

  const renderReward = (code, reward, { restored = false } = {}) => {
    activeCode = code;
    activeReward = reward;
    persistReward(code, reward);
    if (resultTitle) resultTitle.textContent = reward.caseTitle || 'Премиальное дело';
    if (resultDescription) {
      resultDescription.textContent = restored
        ? 'Персональный доступ сохранён в этом браузере. Можно продолжить расследование.'
        : 'Спасибо за помощь проекту. Премиальное расследование открыто для вас без оплаты.';
    }
    if (resultMeta) {
      resultMeta.innerHTML = '';
      const access = document.createElement('span');
      access.textContent = prettyDate(reward.expiresAt);
      resultMeta.appendChild(access);
      if (reward.feedbackAt) {
        const feedback = document.createElement('span');
        feedback.textContent = 'Обратная связь уже отправлена';
        resultMeta.appendChild(feedback);
      }
    }
    if (openLink) openLink.href = reward.targetPath || '/';
    if (result) result.hidden = false;
    if (codeInput && !codeInput.value) codeInput.value = code;
  };

  const activationError = (message) => ({
    reward_invalid: 'Код не найден. Проверьте, не потерялись ли символы при копировании.',
    reward_revoked: 'Этот благодарственный доступ был отозван.',
    reward_expired: 'Срок действия этого благодарственного доступа закончился.',
    reward_not_started: 'Доступ ещё не начал действовать.',
    reward_lookup_failed: 'Сервис временно не смог проверить код. Попробуйте ещё раз.',
  }[message] || 'Не удалось активировать код. Попробуйте ещё раз.');

  const activate = async (code, { restored = false } = {}) => {
    const normalized = normalizeCode(code);
    if (!REWARD_CODE_RE.test(normalized)) {
      if (!restored) setNote(activateNote, 'Проверьте формат кода и вставьте его целиком.', 'error');
      return false;
    }
    if (!restored) setNote(activateNote, 'Проверяем персональный доступ…');
    try {
      const body = await request(restored ? 'status' : 'activate', normalized);
      renderReward(normalized, body.reward || {}, { restored });
      if (!restored) {
        setNote(activateNote, 'Готово. Дело открыто в этом браузере.', 'ok');
        track('reward_code_activated', { product_id: body.reward?.productId || '', case_id: body.reward?.caseId || '' });
        result?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return true;
    } catch (error) {
      if (!restored) setNote(activateNote, activationError(error.message), 'error');
      return false;
    }
  };

  activateForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    if (activateButton) activateButton.disabled = true;
    await activate(codeInput?.value || '');
    busy = false;
    if (activateButton) activateButton.disabled = false;
  });

  feedbackOpen?.addEventListener('click', () => {
    if (!activeCode || !activeReward) return;
    if (feedbackSection) feedbackSection.hidden = false;
    feedbackSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  feedbackForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !activeCode || !activeReward) return;
    const rating = Number(feedbackForm.querySelector('input[name="rating"]:checked')?.value || 0);
    const comment = String(document.querySelector('[data-feedback-comment]')?.value || '').trim();
    const difficulty = String(document.querySelector('[data-feedback-difficulty]')?.value || '');
    const displayName = String(document.querySelector('[data-feedback-name]')?.value || '').trim();
    const publicationConsent = Boolean(document.querySelector('[data-feedback-consent]')?.checked);
    if (!rating) return setNote(feedbackNote, 'Поставьте общую оценку от 1 до 5.', 'error');
    if (comment.length < 20) return setNote(feedbackNote, 'Напишите хотя бы несколько предложений — от 20 символов.', 'error');

    busy = true;
    if (feedbackButton) feedbackButton.disabled = true;
    setNote(feedbackNote, 'Сохраняем обратную связь…');
    try {
      const body = await request('feedback', activeCode, {
        rating,
        comment,
        difficulty,
        displayName,
        publicationConsent,
      });
      activeReward = { ...activeReward, feedbackAt: body.reward?.feedbackAt || new Date().toISOString() };
      persistReward(activeCode, activeReward);
      setNote(feedbackNote, 'Спасибо. Отзыв сохранён и попадёт владельцу Mystery Logic.', 'ok');
      track('reward_feedback_submitted', { product_id: activeReward.productId || '', case_id: activeReward.caseId || '', rating });
    } catch (error) {
      const messages = {
        reward_activation_required: 'Сначала активируйте благодарственный код.',
        reward_expired: 'Срок доступа закончился.',
        reward_revoked: 'Этот доступ был отозван.',
        review_too_short: 'Отзыв слишком короткий.',
        review_too_long: 'Отзыв длиннее 2000 символов.',
        review_save_failed: 'Не удалось сохранить отзыв. Попробуйте ещё раз.',
      };
      setNote(feedbackNote, messages[error.message] || 'Не удалось отправить обратную связь. Попробуйте ещё раз.', 'error');
    } finally {
      busy = false;
      if (feedbackButton) feedbackButton.disabled = false;
    }
  });

  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(LAST_REWARD_KEY) || 'null'); } catch {}
  if (saved?.code) {
    activate(saved.code, { restored: true }).then((ok) => {
      if (!ok) {
        try { localStorage.removeItem(LAST_REWARD_KEY); } catch {}
      } else if (new URLSearchParams(location.search).get('feedback') === '1') {
        if (feedbackSection) feedbackSection.hidden = false;
        feedbackSection?.scrollIntoView({ block: 'start' });
      }
    });
  }
})();
