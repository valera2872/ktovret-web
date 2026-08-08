(() => {
  'use strict';

  const page = window.KtoVretPage || {};
  const base = {
    case_id: page.caseId || '',
    case_slug: page.slug || '',
    language: page.language || document.documentElement.lang || 'ru',
    access: page.access || '',
    canonical_path: page.canonicalPath || '',
  };

  if (location.search) {
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex,follow';
  }

  const track = (event, params = {}) => {
    if (!event) return;
    const detail = { event, ...base, ...params };

    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(detail);
    } catch {}

    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', event, { ...base, ...params });
      }
    } catch {}

    try {
      const counterId = Number(window.MYSTERYLOGIC_YM_COUNTER || 0);
      if (counterId > 0 && typeof window.ym === 'function') {
        window.ym(counterId, 'reachGoal', event, { ...base, ...params });
      }
    } catch {}

    try {
      window.dispatchEvent(new CustomEvent('mysterylogic:analytics', { detail }));
    } catch {}
  };

  window.MysteryLogicAnalytics = { track };

  track('case_view');
  if (page.access === 'premium' || document.querySelector('[data-paywall-view]')) {
    track('paywall_viewed');
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('a,button,[data-action],[data-analytics-event],[data-purchase-start]');
    if (!target) return;

    const explicit = target.dataset.analyticsEvent;
    if (explicit) {
      track(explicit, { target_href: target.getAttribute('href') || '' });
    }

    if (target.matches('[data-purchase-start]')) {
      track('purchase_started', { target_href: target.getAttribute('href') || '' });
    }

    if (target.matches('.ktv-dossier-link-primary') && explicit !== 'next_case_clicked') {
      track('next_case_clicked', { target_href: target.getAttribute('href') || '' });
    }

    const action = target.dataset.action;
    if (action === 'accept') {
      track('case_started');
      return;
    }

    if (action === 'select') {
      track('answer_selected', { option_id: target.dataset.optionId || '' });
      return;
    }

    if (action !== 'submit') return;

    const root = document.querySelector('[data-ktv-root]');
    const selected = root?.querySelector('[data-action="select"][aria-pressed="true"]');
    const selectedId = selected?.dataset.optionId || '';
    const correctIds = window.KtoVretWeb?.case?.answerStages?.[0]?.correctOptionIds || [];
    if (!selectedId || !Array.isArray(correctIds) || correctIds.length === 0) return;

    if (correctIds.includes(selectedId)) {
      track('answer_correct', { option_id: selectedId });
      track('case_completed', { option_id: selectedId });
    } else {
      track('answer_wrong', { option_id: selectedId });
    }
  }, true);
})();
