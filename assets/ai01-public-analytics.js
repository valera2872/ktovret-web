(() => {
  'use strict';
  const METRIKA_ID = 111664459;
  const once = new Set();
  let questionCount = 0;
  let startedAt = 0;

  const send = (eventName, metadata = {}) => {
    const payload = { case_id: 'ai01', case_slug: 'vosem-minut-bez-kamery', mode: 'text', ...metadata };
    try { window.MysteryLogicFunnel?.track?.(eventName, payload, location.pathname); } catch {}
    try { window.MysteryLogicAnalytics?.track?.(eventName, payload); } catch {}
    try { if (typeof window.ym === 'function') window.ym(METRIKA_ID, 'reachGoal', eventName, payload); } catch {}
    try { window.dispatchEvent(new CustomEvent('ml:ai01-analytics', { detail: { event: eventName, ...payload } })); } catch {}
  };
  const sendOnce = (key, eventName, metadata = {}) => {
    if (once.has(key)) return;
    once.add(key);
    send(eventName, metadata);
  };

  sendOnce('view', 'ai01_case_viewed');

  document.addEventListener('click', (event) => {
    const target = event.target?.closest?.('button,a,[data-action]');
    if (!target) return;
    const action = target.dataset?.action || '';

    if (action === 'start') {
      startedAt = Date.now();
      sendOnce('start', 'ai01_case_started');
      return;
    }

    if (target.closest('[data-suspect-strip]')) {
      const suspect = target.dataset?.suspect || target.dataset?.suspectId || target.getAttribute('data-id') || String(target.textContent || '').trim().slice(0,40);
      send('ai01_suspect_switched', { suspect });
      return;
    }

    if (target.closest('[data-evidence-list]')) {
      const evidence = target.dataset?.evidence || target.dataset?.evidenceId || target.getAttribute('data-id') || String(target.textContent || '').trim().slice(0,80);
      send('ai01_evidence_selected', { evidence });
      return;
    }

    if (target.matches('[data-ai01-interest="more"]')) {
      sendOnce('more', 'ai01_more_case_interest');
      const note = document.querySelector('[data-ai01-interest-note]');
      if (note) { note.hidden = false; note.textContent = 'Отметили. Вы первыми узнаете о следующем AI-расследовании.'; }
      return;
    }

    if (target.matches('[data-ai01-interest="live"]')) {
      sendOnce('live', 'ai01_live_interest');
      const note = document.querySelector('[data-ai01-interest-note]');
      if (note) { note.hidden = false; note.textContent = 'Интерес к Live отмечен. Публичный доступ откроем после отдельного теста.'; }
    }
  }, true);

  document.querySelector('[data-composer]')?.addEventListener('submit', () => {
    questionCount += 1;
    send('ai01_question_asked', { question_number: questionCount });
    if (questionCount === 1) sendOnce('first_question', 'ai01_first_question');
    if (questionCount === 3) sendOnce('three_questions', 'ai01_three_questions');
    if (questionCount === 5) sendOnce('five_questions', 'ai01_five_questions');
  }, true);

  document.querySelector('[data-theory-form]')?.addEventListener('submit', () => {
    send('ai01_theory_submitted', { questions_asked: questionCount });
  }, true);

  const resolution = document.querySelector('[data-view="resolution"]');
  if (resolution) {
    const reportCompletion = () => {
      if (resolution.hidden) return;
      sendOnce('complete', 'ai01_case_completed', {
        questions_asked: questionCount,
        elapsed_seconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0,
      });
    };
    new MutationObserver(reportCompletion).observe(resolution, { attributes: true, attributeFilter: ['hidden'] });
    reportCompletion();
  }

  window.MysteryLogicAI01Analytics = { track: send };
})();