(() => {
  'use strict';
  const METRIKA_ID = 111664459;
  const HERO_VARIANT = 'hero-v2';
  const once = new Set();
  let questionCount = 0;
  let startedAt = 0;

  const sendFunnel = (eventName, metadata = {}, target = '') => {
    const track = window.MysteryLogicFunnel?.track;
    if (typeof track !== 'function') return false;
    try { track(eventName, metadata, target); return true; } catch { return false; }
  };
  const sendFunnelEventually = (key, eventName, metadata = {}, target = '', attempts = 20) => {
    if (once.has(key)) return;
    if (sendFunnel(eventName, metadata, target)) {
      once.add(key);
      return;
    }
    if (attempts > 0) setTimeout(() => sendFunnelEventually(key, eventName, metadata, target, attempts - 1), 100);
  };

  const optimizeHero = () => {
    const intro = document.querySelector('[data-view="intro"]');
    const title = intro?.querySelector('h1');
    const start = intro?.querySelector('[data-action="start"]');
    if (!intro || !title || !start || intro.dataset.ai01Hero === HERO_VARIANT) return;

    intro.dataset.ai01Hero = HERO_VARIANT;
    start.textContent = 'Начать расследование';
    start.dataset.ai01HeroCta = HERO_VARIANT;

    const promise = document.createElement('p');
    promise.className = 'aid-lead';
    promise.dataset.ai01HeroPromise = HERO_VARIANT;
    promise.textContent = 'Допрашивайте трёх подозреваемых своими словами, предъявляйте улики и проверяйте их ответы. Готовых реплик и заранее заданного маршрута нет.';
    title.insertAdjacentElement('afterend', promise);
    promise.insertAdjacentElement('afterend', start);

    const oldNote = intro.querySelector('.aid-start-note');
    if (oldNote) oldNote.remove();

    const note = document.createElement('p');
    note.className = 'aid-start-note';
    note.id = 'ai01-hero-note';
    note.textContent = 'Сразу откроется досье и первый допрос. Бесплатно, без регистрации.';
    start.setAttribute('aria-describedby', note.id);
    start.insertAdjacentElement('afterend', note);
  };

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

  optimizeHero();
  sendOnce('view', 'ai01_case_viewed', { hero_variant: HERO_VARIANT });
  sendFunnelEventually('funnel_entry', 'step_view', { flow: 'ai-demo', step: 'entry', case_id: 'ai01', signature: HERO_VARIANT }, 'ai01-hero');

  document.addEventListener('click', (event) => {
    const target = event.target?.closest?.('button,a,[data-action]');
    if (!target) return;
    const action = target.dataset?.action || '';

    if (action === 'start') {
      startedAt = Date.now();
      sendOnce('start', 'ai01_case_started', { hero_variant: HERO_VARIANT });
      sendFunnelEventually('funnel_start', 'step_view', { flow: 'ai-demo', step: 'start', case_id: 'ai01', signature: HERO_VARIANT }, 'ai01-hero');
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
      sendFunnelEventually('funnel_complete', 'game_complete', {
        flow: 'ai-demo',
        case_id: 'ai01',
        signature: 'resolution',
        position: questionCount,
      }, 'ai01-resolution');
    };
    new MutationObserver(reportCompletion).observe(resolution, { attributes: true, attributeFilter: ['hidden'] });
    reportCompletion();
  }

  window.MysteryLogicAI01Analytics = { track: send, heroVariant: HERO_VARIANT };
})();
