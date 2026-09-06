(() => {
  'use strict';

  const root = document.querySelector('[data-casearia-app]');
  if (!root || window.__MLLastAriaFirstBuyerRecovery) return;
  window.__MLLastAriaFirstBuyerRecovery = true;

  const PREFIX = 'mysterylogic:last-aria:v1:';
  const QUESTION_HINTS = {
    culprit: {
      area: 'кто организовал саботаж и кражу',
      materials: 'B-3 / BR-06 / P-771, C-2, HEEL-43C, K-12 и T-6M',
      strong: 'Сведите одного человека сразу с подготовкой PR-17, физическим LOCAL-ARM на C-2, следом 43-го размера, дубликатом K-12 и дальнейшим контролем T-6M.'
    },
    anton: {
      area: 'роль Антона Руденко',
      materials: 'медицинский протокол и окно 21:49:22–22:03',
      strong: 'Проверьте не мотив, а физическую возможность: медицинский протокол фиксирует Антона на сцене в момент открытия архива.'
    },
    voice: {
      area: 'происхождение трёх фраз и алиби Михаила',
      materials: 'PB-2, TAKE-6, MIC-C, C-2 и Q-17B',
      strong: 'Сопоставьте четыре факта: MIC-C молчит; PB-2 совпадает с TAKE-6; TAKE-6 получает LOCAL-ARM до blackout; после ARM три смещения запускает Q-17B без оператора.'
    },
    sequence: {
      area: 'порядок событий в 21:49',
      materials: '21:48:54 LOCAL-ARM → 21:49:12 Q-17B → 21:49:31.604 архив → дальнейший путь T-6M',
      strong: 'Постройте цепочку только из жёстких временных якорей: подготовка до сцены, ARM до blackout, затем cue Q-17B, открытие K-12 и уже после этого физический путь оригинала к T-6M.'
    }
  };
  const GROUP_LABELS = {
    sabotage: 'сам факт саботажа PR-17',
    'culprit-sabotage': 'связь саботажа с обвиняемым',
    alibi: 'ложное алиби / источник сообщений',
    identity: 'личность у архива',
    access: 'способ доступа K-12',
    possession: 'физическая связь оригинала с T-6M'
  };

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const roomCode = () => String(new URL(location.href).searchParams.get('room') || '').trim().toUpperCase();
  const progressKey = () => {
    const code = roomCode();
    if (!code) return '';
    const creator = `${PREFIX}${code}:creator`;
    const guest = `${PREFIX}${code}:guest`;
    if (localStorage.getItem(creator)) return creator;
    if (localStorage.getItem(guest)) return guest;
    return creator;
  };
  const readProgress = () => {
    const key = progressKey();
    if (!key) return {};
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { return {}; }
  };
  const writeProgress = (progress) => {
    const key = progressKey();
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(progress)); } catch {}
  };

  const snapshot = (form, data) => {
    const answers = {};
    for (const question of data.final.questions || []) {
      answers[question.id] = form.querySelector(`input[name="final-${CSS.escape(question.id)}"]:checked`)?.value || '';
    }
    const evidencePicks = [...form.querySelectorAll('input[name="evidence"]:checked')].map((input) => input.value);
    return { answers, evidencePicks };
  };

  const evaluate = (shot, data) => {
    const questions = data.final.questions || [];
    const unansweredIds = questions.filter((question) => !shot.answers?.[question.id]).map((question) => question.id);
    const wrongIds = questions.filter((question) => shot.answers?.[question.id] && shot.answers[question.id] !== question.answer).map((question) => question.id);
    const evidenceGroups = new Set((shot.evidencePicks || [])
      .map((id) => data.final.evidence?.find((item) => item.id === id)?.group)
      .filter(Boolean));
    const missingGroups = (data.final.requiredGroups || []).filter((group) => !evidenceGroups.has(group));
    return {
      allAnswered: unansweredIds.length === 0,
      answersCorrect: unansweredIds.length === 0 && wrongIds.length === 0,
      proofComplete: missingGroups.length === 0,
      unansweredIds,
      wrongIds,
      evidenceGroups,
      missingGroups
    };
  };

  const saveAttempt = (shot) => {
    const progress = readProgress();
    progress.finalAnswers = { ...(shot.answers || {}) };
    progress.evidencePicks = [...(shot.evidencePicks || [])];
    progress.attempts = Number(progress.attempts || 0) + 1;
    if (progress.firstAnswerCorrect === null || typeof progress.firstAnswerCorrect === 'undefined') progress.firstAnswerCorrect = false;
    writeProgress(progress);
    return Math.max(1, Number(progress.attempts || 1));
  };

  const ensureStyle = () => {
    if (document.querySelector('[data-last-aria-first-buyer-recovery-style]')) return;
    const style = document.createElement('style');
    style.dataset.lastAriaFirstBuyerRecoveryStyle = '1';
    style.textContent = `
      .casearia-final-question.is-recovery-focus{border-color:rgba(216,179,110,.62)!important;box-shadow:0 0 0 1px rgba(216,179,110,.2) inset;background:rgba(216,179,110,.055)}
      .casearia-final-feedback[data-recovery-feedback="1"]{border-color:rgba(216,179,110,.45);background:rgba(82,61,24,.2)}
      .casearia-final-feedback[data-recovery-feedback="1"] .recovery-route{margin-top:10px;color:#ead6a6}
    `;
    document.head.appendChild(style);
  };

  const clearFocus = (form) => form.querySelectorAll('.casearia-final-question.is-recovery-focus')
    .forEach((node) => node.classList.remove('is-recovery-focus'));

  const focusQuestions = (form, ids, attempt) => {
    clearFocus(form);
    if (attempt < 3) return;
    for (const id of ids) {
      const input = form.querySelector(`input[name="final-${CSS.escape(id)}"]`);
      input?.closest('.casearia-final-question')?.classList.add('is-recovery-focus');
    }
  };

  const showFeedback = (form, message, detail = '') => {
    ensureStyle();
    root.querySelector('.casearia-final > .casearia-error')?.remove();
    let box = form.querySelector('[data-final-inline-feedback]');
    if (!box) {
      box = document.createElement('div');
      box.className = 'casearia-final-feedback';
      box.dataset.finalInlineFeedback = '1';
      box.setAttribute('role', 'alert');
      box.setAttribute('aria-live', 'polite');
      box.setAttribute('tabindex', '-1');
      const actions = form.querySelector('.casearia-actions');
      if (actions) actions.before(box); else form.appendChild(box);
    }
    box.dataset.recoveryFeedback = '1';
    box.innerHTML = `<strong>Заключение пока не принято.</strong><p>${esc(message)}</p>${detail ? `<p class="recovery-route"><b>${esc(detail)}</b></p>` : ''}<p class="casearia-final-feedback-note">Ваши ответы и выбранные материалы сохранены. Меняйте только подсвеченное или недостающее звено.</p>`;
    requestAnimationFrame(() => {
      try { box.focus({ preventScroll: true }); } catch {}
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const answerFeedback = (state, attempt, data) => {
    const ids = state.wrongIds;
    const titles = ids.map((id) => data.final.questions?.find((question) => question.id === id)?.title || QUESTION_HINTS[id]?.area || id);
    if (attempt < 3) {
      return ['В реконструкции осталось противоречие с материалами дела. Не меняйте всё сразу: перепроверьте один вывод за другим.', ''];
    }
    if (attempt < 5) {
      return [`Сейчас не сходится ${ids.length === 1 ? 'один пункт' : `${ids.length} пункта`}: ${titles.join('; ')}.`, 'Подсвечены только те вопросы, которые стоит пересмотреть. Остальные ответы оставьте как есть.'];
    }
    if (attempt < 8) {
      const materials = ids.map((id) => QUESTION_HINTS[id]?.materials).filter(Boolean);
      return [`Перепроверьте: ${titles.join('; ')}.`, `Опорные материалы: ${materials.join(' · ')}.`];
    }
    const strong = ids.map((id) => QUESTION_HINTS[id]?.strong).filter(Boolean);
    return [`Вы уже достаточно долго проверяете финал. Система показывает только конфликтующие звенья, не сбрасывая верные ответы.`, strong.join(' ')];
  };

  const proofFeedback = (state, attempt) => {
    const labels = state.missingGroups.map((group) => GROUP_LABELS[group] || group);
    if (attempt < 3) return ['Сама реконструкция уже согласуется с материалами, но доказательная конструкция неполна.', 'Нужны независимые классы доказательств, а не несколько документов об одном событии.'];
    return ['Реконструкция верна. Не хватает только доказательных связок.', `Добавьте: ${labels.join('; ')}.`];
  };

  const trackWrong = (state, attempt) => {
    const reason = state.wrongIds.length
      ? `answers:${state.wrongIds.join(',')}`
      : state.missingGroups.length
        ? `proof:${state.missingGroups.join(',')}`
        : state.unansweredIds.length
          ? `unanswered:${state.unansweredIds.join(',')}`
          : 'unknown';
    try {
      window.MysteryLogicFunnel?.track?.('diagnostic_choice', {
        case_id: 'coop:last-aria',
        choice: 'coop:last-aria:final-recovery',
        label: state.answersCorrect ? 'Неполная доказательная конструкция' : 'Диагностика финальной реконструкции',
        position: 3,
        step: attempt,
        reason
      }, 'coop-cognitive');
    } catch {}
    try {
      window.ym?.(111664459, 'reachGoal', 'coop_last_aria_final_recovery', {
        page_type: 'coop_last_aria',
        room_code: roomCode(),
        attempt,
        reason
      });
    } catch {}
  };

  const patchProofCopy = () => {
    const data = window.MLCaseAria;
    const lead = root.querySelector('.casearia-proof-board > p');
    if (!data?.final || !lead) return;
    const count = (data.final.requiredGroups || []).length;
    if (!count) return;
    const copy = `Нужно закрыть ${count} независимых доказательных групп. Система проверяет не число галочек, а наличие каждой обязательной связки.`;
    if (lead.textContent !== copy) lead.textContent = copy;
  };

  document.addEventListener('submit', (event) => {
    const form = event.target?.closest?.('.casearia-final-form[data-final-form]');
    if (!form || !root.contains(form)) return;
    const data = window.MLCaseAria;
    if (!data?.final?.questions?.length) return;

    const shot = snapshot(form, data);
    const state = evaluate(shot, data);
    if (state.allAnswered && state.answersCorrect && state.proofComplete) return;

    event.preventDefault();
    event.stopPropagation();
    const attempt = saveAttempt(shot);
    focusQuestions(form, state.wrongIds, attempt);

    if (!state.allAnswered) {
      const titles = state.unansweredIds.map((id) => data.final.questions?.find((question) => question.id === id)?.title || id);
      showFeedback(form, 'Ответьте на все четыре вопроса, прежде чем отправлять заключение.', `Не заполнено: ${titles.join('; ')}.`);
      trackWrong(state, attempt);
      return;
    }
    if (!state.answersCorrect) {
      const [message, detail] = answerFeedback(state, attempt, data);
      showFeedback(form, message, detail);
      trackWrong(state, attempt);
      return;
    }
    const [message, detail] = proofFeedback(state, attempt);
    showFeedback(form, message, detail);
    trackWrong(state, attempt);
  }, true);

  root.addEventListener('change', (event) => {
    if (!event.target?.closest?.('.casearia-final-form[data-final-form]')) return;
    const form = event.target.closest('.casearia-final-form[data-final-form]');
    form.querySelector('[data-final-inline-feedback]')?.remove();
    clearFocus(form);
  }, true);

  const installCreateDedupe = () => {
    if (window.__MLLastAriaCreateDedupe) return;
    window.__MLLastAriaCreateDedupe = true;
    const previousFetch = window.fetch.bind(window);
    let createFlight = null;
    let clearTimer = 0;
    const requestUrl = (input) => {
      try { return typeof input === 'string' ? input : String(input?.url || ''); } catch { return ''; }
    };
    const requestBody = (init = {}) => {
      try { return JSON.parse(String(init?.body || '{}')) || {}; } catch { return {}; }
    };
    window.fetch = (input, init = {}) => {
      const url = requestUrl(input);
      const body = requestBody(init);
      const isCreate = url.includes('/functions/v1/coop-last-aria') && String(body.action || '') === 'create';
      if (!isCreate) return previousFetch(input, init);
      if (createFlight) return createFlight.then((response) => response.clone());

      const original = previousFetch(input, init);
      createFlight = original.then((response) => response.clone());
      clearTimeout(clearTimer);
      createFlight.finally(() => {
        clearTimer = setTimeout(() => { createFlight = null; }, 2000);
      });
      return original;
    };
  };

  installCreateDedupe();
  const observer = new MutationObserver(patchProofCopy);
  observer.observe(root, { childList: true, subtree: true });
  patchProofCopy();

  window.__MLLastAriaFirstBuyerRecoveryState = Object.freeze({
    revision: '1.0.0',
    preservesProgressPrefix: PREFIX,
    adaptiveFinalRecovery: true,
    createRequestDedupe: true
  });
})();
