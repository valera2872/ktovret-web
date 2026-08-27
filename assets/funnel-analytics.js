(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/funnel-event';
  const VISITOR_KEY = 'mysterylogic:challenge:client-key';
  const SESSION_KEY = 'mysterylogic:funnel:session:v1';
  const METRIKA_ID = 111664459;

  if (location.pathname.startsWith('/admin/')) return;

  const randomHex = (bytes) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (value) =>
    value.toString(16).padStart(2, '0')).join('');

  const visitorKey = () => {
    let value = '';
    try { value = localStorage.getItem(VISITOR_KEY) || ''; } catch {}
    if (!/^[a-f0-9]{48}$/.test(value)) {
      value = randomHex(24);
      try { localStorage.setItem(VISITOR_KEY, value); } catch {}
    }
    return value;
  };

  const sessionKey = () => {
    let value = '';
    try { value = sessionStorage.getItem(SESSION_KEY) || ''; } catch {}
    if (!/^[a-f0-9]{32,64}$/.test(value)) {
      value = randomHex(20);
      try { sessionStorage.setItem(SESSION_KEY, value); } catch {}
    }
    return value;
  };

  const normalizePath = (pathname = location.pathname) => {
    const raw = String(pathname || '/').split('?')[0].split('#')[0] || '/';
    return raw.startsWith('/') ? raw : `/${raw}`;
  };

  const pageGroup = (path = normalizePath()) => {
    if (path === '/') return 'home';
    if (/^\/kto-vret\/?$/.test(path)) return 'kto-vret';
    if (/^\/dela\/?$/.test(path)) return 'catalog';
    if (/^\/tom-1\/?$/.test(path)) return 'volume';
    if (/^\/delo\/[^/]+\/?$/.test(path) || /^\/ru\/cases\/[^/]+\/?$/.test(path)) return 'short-case';
    if (/^\/detektivnye-igry-dlya-odnogo\/407\/?$/.test(path)) return 'solo-case';
    if (/^\/detektivnye-igry-dlya-odnogo\/?$/.test(path)) return 'solo-hub';
    if (/^\/detektivnye-igry-dlya-dvoih\/[^/]+\/?$/.test(path)) return 'coop-case';
    if (/^\/detektivnye-igry-dlya-dvoih\/?$/.test(path)) return 'coop-hub';
    if (
      /^\/(?:detektivnye-igry-onlayn|logicheskie-detektivnye-zadachi|golovolomki-onlayn|zagadki-na-logiku-dlya-vzroslyh)\/?$/.test(path) ||
      /^\/ru\/besplatnye-detektivnye-dela\/?$/.test(path)
    ) return 'seo-hub';
    if (/^\/challenge\/?$/.test(path)) return 'challenge';
    return 'other';
  };

  const referrerHost = () => {
    if (!document.referrer) return '';
    try { return new URL(document.referrer).hostname.toLowerCase(); } catch { return ''; }
  };

  const safeLabel = (node) => String(
    node?.dataset?.analyticsLabel ||
    node?.getAttribute?.('aria-label') ||
    node?.textContent || ''
  ).replace(/\s+/g, ' ').trim().slice(0, 120);

  const hrefInfo = (node) => {
    const href = node?.getAttribute?.('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return null;
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return { path: '', group: 'external' };
      const path = normalizePath(url.pathname);
      return { path, group: pageGroup(path) };
    } catch {
      return null;
    }
  };

  const sent = new Set();
  let meaningfulAction = false;
  let reviewSeen = false;
  let completionSeen = false;
  let maxScroll = 0;

  const metrika = (eventName, metadata = {}) => {
    try {
      if (typeof window.ym === 'function') {
        window.ym(METRIKA_ID, 'reachGoal', `ml_${eventName}`, {
          page_group: pageGroup(),
          ...metadata,
        });
      }
    } catch {}
  };

  const track = (eventName, metadata = {}, target = '', options = {}) => {
    const dedupe = options.dedupe || '';
    if (dedupe && sent.has(dedupe)) return;
    if (dedupe) sent.add(dedupe);

    if (['primary_action', 'format_choice', 'game_open', 'game_accept', 'game_answer_attempt', 'game_complete', 'checkout_open', 'checkout_start', 'diagnostic_choice'].includes(eventName)) {
      meaningfulAction = true;
    }

    const body = {
      browserKey: visitorKey(),
      sessionKey: sessionKey(),
      eventName,
      pagePath: normalizePath(),
      pageGroup: pageGroup(),
      target: String(target || '').slice(0, 300),
      referrerHost: referrerHost(),
      metadata,
    };

    metrika(eventName, metadata);
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
        credentials: 'omit',
        keepalive: true,
      }).catch(() => {});
    } catch {}
  };

  const classifyClick = (node) => {
    const action = String(node?.dataset?.action || '');
    const label = safeLabel(node);
    const href = hrefInfo(node);
    const metadata = { label };

    if (action === 'accept') return ['game_accept', metadata, 'accept-case'];
    if (action === 'submit') return ['game_answer_attempt', metadata, 'submit-answer'];

    if (node?.matches?.('[data-volume-buy], [data-volume-checkout], [data-checkout-open]')) {
      return ['checkout_open', { ...metadata, product: 'volume1' }, 'volume-checkout'];
    }
    if (node?.matches?.('[data-volume-pay], [data-checkout-submit]')) {
      return ['checkout_start', { ...metadata, product: 'volume1' }, 'checkout-submit'];
    }

    if (href) {
      metadata.href_group = href.group;
      if (href.group === 'short-case' || href.group === 'solo-case' || href.group === 'coop-case') {
        return ['game_open', metadata, href.path];
      }
      if (node?.closest?.('.solo407-home-switch, .solo407-home-switch-actions')) {
        const choice = href.group === 'solo-hub' ? 'solo' : href.group === 'coop-hub' ? 'coop' : href.group;
        return ['format_choice', { ...metadata, choice }, href.path];
      }
      if (node?.matches?.('.ml-button, .ml-product, .ml-preview-link, .solo407-primary, .solo407-kv-cta, .coop-primary, .ml-nav-cta') ||
          node?.closest?.('.ml-actions, .ml-products, .solo407-kv-cases')) {
        return ['primary_action', metadata, href.path || href.group];
      }
    }
    return null;
  };

  document.addEventListener('click', (event) => {
    const node = event.target?.closest?.('a,button');
    if (!node) return;
    const classified = classifyClick(node);
    if (!classified) return;
    track(classified[0], classified[1], classified[2]);
  }, true);

  const inspectRuntime = () => {
    const review = document.querySelector('[data-ktv-review-card]');
    if (review && !reviewSeen) {
      reviewSeen = true;
      track('review_view', { case_id: String(window.KtoVretWeb?.case?.id || '') }, 'review-card', { dedupe: 'review-view' });
    }

    const success = review?.querySelector?.('.ktv-review-success');
    if (success) {
      track('review_submit', { case_id: String(window.KtoVretWeb?.case?.id || '') }, 'review-success', { dedupe: 'review-submit' });
    }

    const result = document.querySelector('#ktv-result, .ktv-result');
    if (result && !completionSeen && (result.querySelector('.ktv-result-lead, .ktv-first-result') || document.querySelector('.ml-global-stats'))) {
      completionSeen = true;
      track('game_complete', { case_id: String(window.KtoVretWeb?.case?.id || '') }, 'case-result', { dedupe: 'game-complete' });
    }
  };

  if (document.querySelector('[data-ktv-root]')) {
    const observer = new MutationObserver(inspectRuntime);
    observer.observe(document.querySelector('[data-ktv-root]'), { childList: true, subtree: true });
    inspectRuntime();
  }

  const onScroll = () => {
    const height = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    maxScroll = Math.max(maxScroll, Math.min(100, Math.round((scrollY / height) * 100)));
    if (maxScroll >= 50) {
      track('scroll_50', { scroll_pct: maxScroll }, 'document', { dedupe: 'scroll-50' });
      removeEventListener('scroll', onScroll);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });

  track('page_view', { source: document.referrer ? 'referral' : 'direct' }, 'document', { dedupe: 'page-view' });
  setTimeout(() => track('engaged_15s', {}, 'document', { dedupe: 'engaged-15' }), 15_000);
  setTimeout(() => {
    track('engaged_45s', {}, 'document', { dedupe: 'engaged-45' });
    if (!meaningfulAction) track('no_action_45s', { scroll_pct: maxScroll }, 'document', { dedupe: 'no-action-45' });
  }, 45_000);

  window.MysteryLogicFunnel = Object.freeze({
    track: (eventName, metadata = {}, target = '') => track(eventName, metadata, target),
    pageGroup: () => pageGroup(),
  });
})();
