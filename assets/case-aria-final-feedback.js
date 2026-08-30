(() => {
  'use strict';

  const root = document.querySelector('[data-casearia-app]');
  const data = window.MLCaseAria;
  if (!root || !data?.final) return;

  // Keep the canonical answer ids intact for the proof engine, but remove the
  // obvious quiz cue where the correct reconstruction is much more specific
  // than the distractors. Every alternative now makes a coherent claim that
  // has to be rejected with evidence from the case.
  const questions = Object.fromEntries((data.final.questions || []).map((question) => [question.id, question]));
  if (questions.anton) {
    questions.anton.title = 'Как материалы определяют роль Антона Руденко?';
    questions.anton.options = [
      ['victim', 'Ранение было настоящим; материалы не связывают Антона с подготовкой кражи.'],
      ['partner', 'Ранение было настоящим, но Антон сознательно помог создать аварийное окно для кражи.'],
      ['thief', 'Антон действительно был ранен, но в blackout успел уйти со сцены и забрать партитуру.']
    ];
  }
  if (questions.voice) {
    questions.voice.title = 'Как технические данные меняют алиби Михаила?';
    questions.voice.options = [
      ['recording', 'Фразы могли звучать без Михаила у подиума: TAKE-6 был вооружён до blackout, а Q-17B затем сам запустил PB-2 при молчащем MIC-C.'],
      ['distance', 'Фразы были живыми через MIC-C, но задержка интеркома позволила им звучать уже после ухода Михаила от подиума.'],
      ['witness', 'PB-2 был записью, но связать её запуск с Михаилом нельзя: C-2 мог получить ARM удалённо без человека у панели.']
    ];
  }
  if (questions.sequence) {
    questions.sequence.title = 'Какая реконструкция выдерживает всю временную линию?';
    questions.sequence.options = [
      ['canonical', 'PR-17 подготовлен заранее → травма запускает SAFE → заранее вооружённый TAKE-6 создаёт звуковое присутствие → K-12 открывает архив → MS-1908 оказывается в T-6M.'],
      ['manager', 'PR-17 подготовлен заранее → травма запускает SAFE → Илья намеренно удерживает blackout → Дарья использует K-12 → оригинал позднее оказывается в T-6M.'],
      ['anton', 'PR-17 подготовлен заранее → Антон помогает создать аварийное окно → Михаил остаётся у подиума → другой человек идёт по STAIR-18 → оригинал затем подбрасывают в T-6M.']
    ];
  }

  const PREFIX = 'mysterylogic:last-aria:v1:';
  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const roomCode = () => String(new URL(location.href).searchParams.get('room') || '').trim().toUpperCase();
  const progressStorageKey = () => {
    const code = roomCode();
    if (!code) return '';
    const candidates = [`${PREFIX}${code}:creator`, `${PREFIX}${code}:guest`];
    return candidates.find((key) => localStorage.getItem(key)) || candidates[0];
  };
  const readProgress = () => {
    const key = progressStorageKey();
    if (!key) return {};
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch { return {}; }
  };
  const writeProgress = (progress) => {
    const key = progressStorageKey();
    if (!key) return;
    try { localStorage.setItem(key, JSON.stringify(progress)); } catch {}
  };

  const snapshotForm = (form) => {
    const answers = {};
    for (const question of data.final.questions || []) {
      answers[question.id] = form.querySelector(`input[name="final-${CSS.escape(question.id)}"]:checked`)?.value || '';
    }
    const evidencePicks = [...form.querySelectorAll('input[name="evidence"]:checked')].map((input) => input.value);
    return { answers, evidencePicks };
  };

  const saveDraft = (snapshot, { countAttempt = false } = {}) => {
    const progress = readProgress();
    progress.finalAnswers = { ...(snapshot?.answers || {}) };
    progress.evidencePicks = [...(snapshot?.evidencePicks || [])];
    if (countAttempt) {
      progress.attempts = Number(progress.attempts || 0) + 1;
      if (progress.firstAnswerCorrect === null || typeof progress.firstAnswerCorrect === 'undefined') progress.firstAnswerCorrect = false;
    }
    writeProgress(progress);
    return progress;
  };

  const restoreDraft = (form) => {
    const progress = readProgress();
    const answers = progress.finalAnswers || {};
    const picks = new Set(Array.isArray(progress.evidencePicks) ? progress.evidencePicks : []);
    for (const [questionId, value] of Object.entries(answers)) {
      if (!value) continue;
      const input = form.querySelector(`input[name="final-${CSS.escape(questionId)}"][value="${CSS.escape(String(value))}"]`);
      if (input) input.checked = true;
    }
    for (const input of form.querySelectorAll('input[name="evidence"]')) input.checked = picks.has(input.value);
  };

  const ensureStyle = () => {
    if (document.querySelector('[data-casearia-final-feedback-style]')) return;
    const style = document.createElement('style');
    style.dataset.caseariaFinalFeedbackStyle = '1';
    style.textContent = `
      .casearia-final-consensus{margin:16px 0 0;padding:14px 16px;border-left:3px solid rgba(216,179,110,.62);background:rgba(216,179,110,.075);color:#d8d0be;line-height:1.55}.casearia-final-consensus strong{color:#ead6a6}
      .casearia-final-feedback{margin:20px 0 16px;padding:16px 18px;border:1px solid rgba(191,96,76,.38);border-radius:14px;background:rgba(83,29,22,.16);box-shadow:0 10px 30px rgba(0,0,0,.08)}
      .casearia-final-feedback strong{display:block;margin-bottom:7px;font-size:1rem;letter-spacing:.01em}
      .casearia-final-feedback p{margin:6px 0;line-height:1.55}
      .casearia-final-feedback .casearia-final-feedback-note{opacity:.8;font-size:.94em}
    `;
    document.head.appendChild(style);
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
    box.innerHTML = `<strong>Заключение пока не принято.</strong><p>${esc(message)}</p>${detail ? `<p><b>${esc(detail)}</b></p>` : ''}<p class="casearia-final-feedback-note">Ваши ответы и выбранные материалы сохранены — меняйте только то, что хотите пересмотреть.</p>`;
    requestAnimationFrame(() => {
      try { box.focus({ preventScroll: true }); } catch {}
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const proofState = (snapshot) => {
    const allAnswered = (data.final.questions || []).every((question) => snapshot.answers?.[question.id]);
    const answersCorrect = (data.final.questions || []).every((question) => snapshot.answers?.[question.id] === question.answer);
    const evidenceGroups = new Set((snapshot.evidencePicks || []).map((id) => data.final.evidence?.find((item) => item.id === id)?.group).filter(Boolean));
    const proofComplete = (data.final.requiredGroups || []).every((group) => evidenceGroups.has(group));
    return { allAnswered, answersCorrect, proofComplete, evidenceGroups };
  };

  const trackWrong = (attempt, state) => {
    try {
      window.MysteryLogicFunnel?.track?.('diagnostic_choice', {
        case_id: 'coop:last-aria',
        choice: 'coop:last-aria:final-wrong',
        label: state.answersCorrect ? 'Неполная доказательная конструкция' : 'Противоречие в финальной реконструкции',
        position: 3,
        attempt,
        evidence_groups: [...state.evidenceGroups].join(',')
      }, 'coop-cognitive');
    } catch {}
    try {
      window.ym?.(111664459, 'reachGoal', 'coop_last_aria_final_wrong', {
        page_type: 'coop_last_aria',
        room_code: roomCode(),
        attempt
      });
    } catch {}
  };

  root.addEventListener('change', (event) => {
    const form = event.target.closest?.('.casearia-final-form[data-final-form]');
    if (!form) return;
    saveDraft(snapshotForm(form));
    form.querySelector('[data-final-inline-feedback]')?.remove();
  }, true);

  root.addEventListener('submit', (event) => {
    const form = event.target.closest?.('.casearia-final-form[data-final-form]');
    if (!form) return;

    const snapshot = snapshotForm(form);
    const state = proofState(snapshot);
    saveDraft(snapshot);

    if (state.allAnswered && state.answersCorrect && state.proofComplete) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const progress = saveDraft(snapshot, { countAttempt: true });
    const attempt = Number(progress.attempts || 1);

    if (!state.allAnswered) {
      showFeedback(form, 'Согласуйте с напарником и ответьте на все четыре вопроса. Уже заполненные пункты и выбранные доказательства останутся на месте.');
      trackWrong(attempt, state);
      return;
    }
    if (!state.answersCorrect) {
      const detail = attempt >= 3 ? 'Более точная подсказка: проверьте отдельно источник трёх фраз и физическую возможность каждого участника оказаться у архива в критическое окно.' : '';
      showFeedback(form, 'В реконструкции осталось противоречие с временной линией или независимым источником. Не меняйте всё сразу: найдите одно звено, которое не выдерживает второй проверки.', detail);
      trackWrong(attempt, state);
      return;
    }

    const detail = attempt >= 3 ? 'Более точная подсказка: обвинению нужны разные классы доказательств; несколько документов об одном событии не заменяют отсутствующее звено.' : '';
    showFeedback(form, 'Реконструкция выглядит цельной, но доказательная конструкция неполна. Проверьте, что каждое ключевое звено подтверждается своим независимым материалом.', detail);
    trackWrong(attempt, state);
  }, true);

  const repairFinal = () => {
    const form = root.querySelector('.casearia-final-form[data-final-form]');
    if (!form) return;
    ensureStyle();
    restoreDraft(form);

    const intro = root.querySelector('.casearia-final');
    if (intro && !intro.querySelector('[data-final-consensus]')) {
      const note = document.createElement('div');
      note.className = 'casearia-final-consensus';
      note.dataset.finalConsensus = '1';
      note.innerHTML = '<strong>Сначала договоритесь вслух.</strong> Финал — не два отдельных теста. Обсудите четыре пункта и зафиксируйте одну общую реконструкцию на обоих устройствах. Если версии расходятся, вернитесь к открытым пакетам.';
      intro.appendChild(note);
    }
    const submit = form.querySelector('button[type="submit"]');
    if (submit && submit.textContent !== 'Зафиксировать общую версию') submit.textContent = 'Зафиксировать общую версию';

    const legacyError = root.querySelector('.casearia-final > .casearia-error');
    if (legacyError?.textContent?.trim()) {
      showFeedback(form, legacyError.textContent.trim());
      legacyError.remove();
    }
  };

  const observer = new MutationObserver(() => repairFinal());
  observer.observe(root, { childList: true, subtree: true });
  repairFinal();
})();