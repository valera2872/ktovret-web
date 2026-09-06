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
  const sendStep = (flow, step, metadata = {}, target = '') => {
    sendFunnel('step_view', { flow, step, ...metadata }, target);
  };
  const sendAction = (label, metadata = {}, target = '') => {
    sendFunnel('primary_action', { label, ...metadata }, target);
  };
  const pathOf = (href) => {
    try { return new URL(href, location.href).pathname; } catch { return ''; }
  };
  const currentPath = () => {
    const path = String(location.pathname || '/').replace(/\/{2,}/g, '/');
    return path.length > 1 ? path.replace(/\/+$/, '') : '/';
  };
  const siteHref = (path) => {
    const prefix = String(location.pathname || '').startsWith('/ktovret-web/') ? '/ktovret-web' : '';
    return `${prefix}${path}`;
  };

  const telegramCard = ({ placement, kicker, title, copy, button }) => {
    const wrap = document.createElement('aside');
    wrap.className = 'ml-telegram-retention';
    wrap.dataset.telegramRetention = placement;
    wrap.innerHTML = `<div class="ml-telegram-retention-mark" aria-hidden="true">↗</div><div class="ml-telegram-retention-copy"><span>${kicker}</span><strong>${title}</strong><p>${copy}</p></div><a class="ml-telegram-retention-btn" href="${TELEGRAM_URL}" target="_blank" rel="noopener" data-telegram-cta="${placement}">${button}</a>`;
    return wrap;
  };

  const whoLiedBridge = () => {
    const wrap = document.createElement('aside');
    wrap.className = 'ml-who-lied-bridge';
    wrap.dataset.whoLiedBridge = 'after_case';
    wrap.innerHTML = `<div class="ml-who-lied-bridge-copy"><span>Кто врёт? · продолжение</span><strong>Таких коротких расследований — 100.</strong><p>15 дел доступны бесплатно. Если формат понравился, ещё 85 открываются за 99 ₽ одной покупкой без подписки. Можно решать самому, вдвоём или читать условие вслух семье.</p></div><div class="ml-who-lied-bridge-actions"><a href="${siteHref('/dela/')}" data-who-lied-cta="next_free">Ещё бесплатное дело</a><a class="is-primary" href="${siteHref('/tom-1/')}" data-who-lied-cta="paid_99">Открыть ещё 85 — 99 ₽</a></div>`;
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
    aside.innerHTML = `<button type="button" class="ml-telegram-sticky-close" aria-label="Скрыть">×</button><div><span>Мини-дела в Telegram</span><strong>Опрос → ваша версия → развязка</strong></div><a href="${TELEGRAM_URL}" target="_blank" rel="noopener" data-telegram-cta="sticky">Открыть →</a>`;
    aside.querySelector('.ml-telegram-sticky-close')?.addEventListener('click', dismissSticky);
    document.body.appendChild(aside);
    sendStep('telegram-retention', 'prompt_view', { position: 'sticky' }, 't.me/mysterylogic');
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
      kicker: 'Отдельный контент',
      title: 'Мини-расследования продолжаются в Telegram.',
      copy: 'Короткое дело, опрос с версиями и затем развязка. Не дублируем задания с сайта.',
      button: 'Открыть мини-дела →',
    }));
    sendStep('telegram-retention', 'prompt_view', { position: 'after_puzzle', label: String(puzzleId || '') }, 't.me/mysterylogic');
  };

  const appendAfterShortCase = () => {
    const result = document.querySelector('#ktv-result, .ktv-result');
    if (!result) return;
    const text = String(result.textContent || '');
    const completed = Boolean(
      result.querySelector('.ktv-result-lead, .ktv-first-result') ||
      document.querySelector('.ml-global-stats') ||
      /(Решение принято|Следствие завершено|Дело закрыто)/i.test(text)
    );
    if (!completed) return;

    if (!result.querySelector('[data-who-lied-bridge="after_case"]')) {
      result.appendChild(whoLiedBridge());
      sendStep('who-lied-offer', 'after_case', { product: 'volume1', position: 'after_case' }, siteHref('/tom-1/'));
    }

    if (!result.querySelector('[data-telegram-retention="after_case"]')) {
      result.appendChild(telegramCard({
        placement: 'after_case',
        kicker: 'Ещё одно расследование',
        title: 'В Telegram — мини-дела с голосованием.',
        copy: 'Сначала публикуем условие и версии, затем развязку. Это отдельная серия, которой нет в бесплатном архиве сайта.',
        button: 'Смотреть мини-дела →',
      }));
      sendStep('telegram-retention', 'prompt_view', { position: 'after_case' }, 't.me/mysterylogic');
    }
  };

  const appendAfterSolo = () => {
    const reveal = document.querySelector('.solo407-reveal');
    if (!reveal || reveal.querySelector('[data-telegram-retention="after_solo_case"]')) return;
    reveal.appendChild(telegramCard({
      placement: 'after_solo_case',
      kicker: 'Следственный канал',
      title: 'Короткие мини-дела между большими расследованиями.',
      copy: 'В Telegram — отдельные расследования с опросом и развязкой, которых нет на странице этого дела.',
      button: 'Открыть канал →',
    }));
    sendStep('telegram-retention', 'prompt_view', { position: 'after_solo_case', case_id: 'solo:407' }, 't.me/mysterylogic');
  };

  document.addEventListener('click', (event) => {
    const link = event.target?.closest?.('a[href]');
    if (!link) return;

    if (link.matches('[data-who-lied-cta]')) {
      const choice = link.dataset.whoLiedCta || 'unknown';
      sendAction(`who_lied_${choice}`, { flow: 'who-lied-offer', step: choice, product: 'volume1', position: 'after_case' }, pathOf(link.href));
      sendMetrika('ml_who_lied_offer_click', { choice });
      return;
    }

    if (link.matches('[data-telegram-cta]')) {
      const placement = link.dataset.telegramCta || 'sitewide';
      sendAction('telegram_open', { flow: 'telegram-retention', step: 'click', position: placement }, 't.me/mysterylogic');
      sendMetrika('ml_telegram_click', { placement });
      return;
    }

    const path = pathOf(link.getAttribute('href'));
    if (/^\/(?:golovolomki-onlayn|zagadki-na-logiku-dlya-vzroslyh|logicheskie-zadachi)(?:\/|$)/.test(path)) {
      const placement = link.dataset.logicCta || 'sitewide';
      sendFunnel('primary_action', { label: 'logic_hub_open', position: placement }, path);
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
