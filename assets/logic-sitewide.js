(() => {
  'use strict';
  const METRIKA_ID = 111664459;
  const TELEGRAM_URL = 'https://t.me/mysterylogic';
  const STICKY_DISMISSED = 'mysterylogic:telegram:sticky-dismissed:v1';
  const sendMetrika = (goal, params = {}) => {
    try { if (typeof window.ym === 'function') window.ym(METRIKA_ID, 'reachGoal', goal, params); } catch {}
  };
  const sendFunnel = (eventName, metadata = {}, target = '') => {
    try { window.MysteryLogicFunnel?.track?.(eventName, metadata, target); } catch {}
  };
  const pathOf = (href) => {
    try { return new URL(href, location.href).pathname; } catch { return ''; }
  };
  const currentPath = () => {
    const path = String(location.pathname || '/').replace(/\/{2,}/g, '/');
    return path.length > 1 ? path.replace(/\/+$/, '') : '/';
  };

  const telegramCard = ({ placement, kicker, title, copy, button }) => {
    const wrap = document.createElement('aside');
    wrap.className = 'ml-telegram-retention';
    wrap.dataset.telegramRetention = placement;
    wrap.innerHTML = `<div class="ml-telegram-retention-mark" aria-hidden="true">↗</div><div class="ml-telegram-retention-copy"><span>${kicker}</span><strong>${title}</strong><p>${copy}</p></div><a class="ml-telegram-retention-btn" href="${TELEGRAM_URL}" target="_blank" rel="noopener" data-telegram-cta="${placement}">${button}</a>`;
    return wrap;
  };

  const stickyEligible = () => {
    const path = currentPath();
    if (path.startsWith('/admin')) return false;
    if (/^\/delo\/[^/]+$/.test(path) || /^\/ru\/cases\/[^/]+$/.test(path)) return false;
    if (/^\/detektivnye-igry-dlya-odnogo\/407$/.test(path)) return false;
    if (/^\/detektivnye-igry-dlya-dvoih\/[^/]+$/.test(path)) return false;
    return path === '/' || /^\/(?:kto-vret|dela|tom-1|detektivnye-igry-dlya-odnogo|detektivnye-igry-dlya-dvoih|golovolomki-onlayn|zagadki-na-logiku-dlya-vzroslyh|logicheskie-zadachi)(?:\/.*)?$/.test(path);
  };

  const stickyDismissed = () => {
    try { return sessionStorage.getItem(STICKY_DISMISSED) === '1'; } catch { return false; }
  };
  const dismissSticky = () => {
    try { sessionStorage.setItem(STICKY_DISMISSED, '1'); } catch {}
    document.querySelector('[data-telegram-sticky]')?.remove();
  };
  const showSticky = () => {
    if (!stickyEligible() || stickyDismissed() || document.querySelector('[data-telegram-sticky]')) return;
    const aside = document.createElement('aside');
    aside.className = 'ml-telegram-sticky';
    aside.dataset.telegramSticky = 'true';
    aside.innerHTML = `<button type="button" class="ml-telegram-sticky-close" aria-label="Скрыть">×</button><div><span>Задача дня</span><strong>Новая сложная задача — в Telegram</strong></div><a href="${TELEGRAM_URL}" target="_blank" rel="noopener" data-telegram-cta="sticky">Получать →</a>`;
    aside.querySelector('.ml-telegram-sticky-close')?.addEventListener('click', dismissSticky);
    document.body.appendChild(aside);
    sendFunnel('telegram_prompt_view', { placement: 'sticky' }, 't.me/mysterylogic');
  };

  const scheduleSticky = () => {
    if (!stickyEligible() || stickyDismissed()) return;
    let shown = false;
    const reveal = () => {
      if (shown) return;
      shown = true;
      showSticky();
      removeEventListener('scroll', onScroll);
    };
    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      if ((scrollY / max) >= .32) reveal();
    };
    addEventListener('scroll', onScroll, { passive: true });
    setTimeout(reveal, 18_000);
  };

  const appendAfterPuzzle = (puzzleId) => {
    const root = puzzleId
      ? [...document.querySelectorAll('[data-expert-puzzle]')].find((node) => node.dataset.expertPuzzle === String(puzzleId))
      : document.querySelector('[data-expert-puzzle]');
    if (!root || root.querySelector('[data-telegram-retention="after_puzzle"]')) return;
    root.appendChild(telegramCard({
      placement: 'after_puzzle',
      kicker: 'Решено',
      title: 'Завтра — новая задача.',
      copy: 'Новые сложные головоломки и задачи Mystery Logic выходят в Telegram.',
      button: 'Получать задачи →',
    }));
    sendFunnel('telegram_prompt_view', { placement: 'after_puzzle', puzzle_id: String(puzzleId || '') }, 't.me/mysterylogic');
  };

  const appendAfterShortCase = () => {
    const result = document.querySelector('#ktv-result, .ktv-result');
    if (!result || result.querySelector('[data-telegram-retention="after_case"]')) return;
    if (!(result.querySelector('.ktv-result-lead, .ktv-first-result') || document.querySelector('.ml-global-stats'))) return;
    result.appendChild(telegramCard({
      placement: 'after_case',
      kicker: 'Дело закрыто',
      title: 'Следующее дело не пропустите.',
      copy: 'Новые дела и сложные головоломки появляются в Telegram Mystery Logic.',
      button: 'Получать новые дела →',
    }));
    sendFunnel('telegram_prompt_view', { placement: 'after_case' }, 't.me/mysterylogic');
  };

  const appendAfterSolo = () => {
    const reveal = document.querySelector('.solo407-reveal');
    if (!reveal || reveal.querySelector('[data-telegram-retention="after_solo_case"]')) return;
    reveal.appendChild(telegramCard({
      placement: 'after_solo_case',
      kicker: 'Расследование закрыто',
      title: 'Продолжение — в следственном канале.',
      copy: 'Новые большие расследования и сложные задачи Mystery Logic — в Telegram.',
      button: 'Получать новые дела →',
    }));
    sendFunnel('telegram_prompt_view', { placement: 'after_solo_case', case_id: 'solo:407' }, 't.me/mysterylogic');
  };

  document.addEventListener('click', (event) => {
    const link = event.target?.closest?.('a[href]');
    if (!link) return;
    if (link.matches('[data-telegram-cta]')) {
      const placement = link.dataset.telegramCta || 'sitewide';
      sendFunnel('telegram_click', { placement }, 't.me/mysterylogic');
      sendMetrika('ml_telegram_click', { placement });
      return;
    }
    const path = pathOf(link.getAttribute('href'));
    if (/^\/(?:golovolomki-onlayn|zagadki-na-logiku-dlya-vzroslyh|logicheskie-zadachi)(?:\/|$)/.test(path)) {
      const placement = link.dataset.logicCta || 'sitewide';
      sendFunnel('logic_hub_open', { placement, target_path: path }, path);
      sendMetrika('ml_logic_hub_open', { placement, target_path: path });
    }
  }, true);

  window.addEventListener('ml:logic_complete', (event) => appendAfterPuzzle(event.detail?.puzzleId || ''));
  window.addEventListener('ml:solo_complete', () => requestAnimationFrame(() => requestAnimationFrame(appendAfterSolo)));

  const shortRoot = document.querySelector('[data-ktv-root]');
  if (shortRoot) {
    const observer = new MutationObserver(appendAfterShortCase);
    observer.observe(shortRoot, { childList: true, subtree: true });
    appendAfterShortCase();
  }
  if (document.querySelector('.solo407-reveal')) appendAfterSolo();
  scheduleSticky();
})();
