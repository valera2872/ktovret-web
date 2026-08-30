(() => {
  'use strict';

  const path = location.pathname;
  const seen = new Set();

  const track = (eventName, metadata = {}, target = '') => {
    const send = window.MysteryLogicFunnel?.track;
    if (typeof send !== 'function') return false;
    try { send(eventName, metadata, target); return true; } catch { return false; }
  };

  const step = (flow, name, metadata = {}, target = 'journey-step') => {
    const signature = String(metadata.signature || name || '');
    const key = `${flow}:${name}:${signature}`;
    if (seen.has(key)) return;
    if (!track('step_view', { flow, step: name, ...metadata }, target)) return;
    seen.add(key);
  };

  const soloState = () => {
    try { return JSON.parse(localStorage.getItem('ml:solo:407:v1') || '{}') || {}; }
    catch { return {}; }
  };

  const openEvidenceCount = () => {
    const state = soloState();
    return Array.isArray(state.opened) ? state.opened.length : 0;
  };

  const enhanceSoloHub = () => {
    if (!/^\/detektivnye-igry-dlya-odnogo\/?$/.test(path)) return;
    const hero = document.querySelector('[data-solo-conversion-v3]');
    if (!hero) return;
    step('solo-hub-conversion', 'featured-view', { case_id: 'solo:407', signature: 'solo-407-v3' }, 'solo-407-featured');

    hero.addEventListener('click', (event) => {
      const cta = event.target.closest('[data-solo-featured-cta]');
      if (!cta) return;
      step('solo-hub-conversion', 'featured-click', { case_id: 'solo:407', signature: 'solo-407-v3' }, 'solo-407-featured');
    }, true);
  };

  const enhanceSolo407 = () => {
    if (!/^\/detektivnye-igry-dlya-odnogo\/407\/?$/.test(path)) return;
    const root = document.querySelector('[data-solo407-app]');
    if (!root) return;

    const initial = soloState();
    step('solo-407-case', initial.started ? 'returning' : 'entry', {
      case_id: 'solo:407',
      signature: initial.started ? `stage-${Number(initial.stage || 1)}` : 'fresh',
      position: Number(initial.stage || 1),
    }, 'solo-407');

    window.addEventListener('ml:solo_start', () => {
      step('solo-407-case', 'start', { case_id: 'solo:407', signature: 'start' }, 'solo-407');
    });

    window.addEventListener('ml:solo_evidence_open', (event) => {
      const evidenceId = String(event.detail?.evidenceId || 'unknown');
      setTimeout(() => step('solo-407-case', 'evidence-open', {
        case_id: 'solo:407',
        signature: evidenceId,
        position: openEvidenceCount(),
      }, evidenceId), 0);
    });

    window.addEventListener('ml:solo_request', (event) => {
      const evidenceId = String(event.detail?.evidenceId || 'unknown');
      setTimeout(() => step('solo-407-case', 'investigator-request', {
        case_id: 'solo:407',
        signature: evidenceId,
        position: openEvidenceCount(),
      }, evidenceId), 0);
    });

    window.addEventListener('ml:solo_checkpoint', (event) => {
      const stage = Math.max(1, Math.min(3, Number(event.detail?.stage || 1)));
      step('solo-407-case', 'hypothesis', {
        case_id: 'solo:407',
        signature: `stage-${stage}`,
        position: stage,
      }, `solo-checkpoint-${stage}`);
    });

    window.addEventListener('ml:solo_complete', () => {
      step('solo-407-case', 'complete', { case_id: 'solo:407', signature: 'complete' }, 'solo-407');
    });

    const inspect = () => {
      if (root.querySelector('[data-final]')) {
        step('solo-407-case', 'final-ready', {
          case_id: 'solo:407',
          signature: 'final-ready',
          position: openEvidenceCount(),
        }, 'solo-final');
      }
      if (root.querySelector('.solo407-reveal')) {
        step('solo-407-case', 'reveal', { case_id: 'solo:407', signature: 'reveal' }, 'solo-reveal');
      }
    };
    const observer = new MutationObserver(() => queueMicrotask(inspect));
    observer.observe(root, { childList: true, subtree: true });
    inspect();
  };

  const premiumProduct = (card) => {
    if (card?.classList?.contains('ref-premium-case-407')) return 'case_407';
    if (card?.classList?.contains('ref-premium-case-aria')) return 'last_aria';
    const title = String(card?.querySelector?.('h3')?.textContent || '').trim().toLowerCase();
    if (title.includes('407')) return 'case_407';
    if (title.includes('ария')) return 'last_aria';
    return 'premium_case';
  };

  const enhancePremiumCases = () => {
    const section = document.querySelector('[data-premium-cases-v2]');
    if (!section) return;
    const cards = [...section.querySelectorAll('.ref-premium-case')];
    if (!cards.length) return;

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.4) continue;
          const product = premiumProduct(entry.target);
          step('premium-case', 'card-view', { product, signature: product }, `premium:${product}`);
          io.unobserve(entry.target);
        }
      }, { threshold: [0.4] });
      cards.forEach((card) => io.observe(card));
    } else {
      cards.forEach((card) => {
        const product = premiumProduct(card);
        step('premium-case', 'card-view', { product, signature: product }, `premium:${product}`);
      });
    }

    section.addEventListener('click', (event) => {
      const link = event.target.closest('.ref-premium-case a[href]');
      if (!link) return;
      const card = link.closest('.ref-premium-case');
      const product = premiumProduct(card);
      step('premium-case', 'card-click', {
        product,
        signature: `${product}:${link.getAttribute('href') || ''}`.slice(0, 150),
        choice: link.classList.contains('ref-btn-primary') ? 'primary' : 'secondary',
      }, `premium:${product}`);
    }, true);
  };

  const enhanceCommerce = () => {
    document.addEventListener('click', (event) => {
      const node = event.target.closest('[data-aria-buy],[data-volume-pay],[data-checkout-submit]');
      if (!node) return;
      const product = node.matches('[data-aria-buy]') ? 'last_aria' : 'volume1';
      step('commerce', 'payment-intent', { product, signature: `${product}:${path}` }, `commerce:${product}`);
    }, true);
  };

  const boot = () => {
    enhanceSoloHub();
    enhanceSolo407();
    enhancePremiumCases();
    enhanceCommerce();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();