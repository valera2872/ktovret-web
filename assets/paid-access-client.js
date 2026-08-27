(() => {
  'use strict';

  const script = document.currentScript;
  const page = window.KtoVretPage || {};
  const cfg = window.MysteryLogicPaidAccessConfig || {};
  const panel = document.querySelector('[data-paid-access-panel]');
  const storefrontLink = document.querySelector('[data-paid-coming-soon]');
  if (!script?.src || !panel || !page.caseId) return;

  if (!cfg.endpoint) {
    panel.hidden = true;
    if (storefrontLink) storefrontLink.hidden = false;
    return;
  }
  panel.hidden = false;
  if (storefrontLink) storefrontLink.hidden = true;

  const siteRoot = new URL('../', script.src);
  const unlockButton = panel.querySelector('[data-paid-unlock]');
  const tokenInput = panel.querySelector('[data-paid-token]');
  const status = panel.querySelector('[data-paid-status]');
  const storageKey = cfg.tokenStorageKey || 'mysterylogic:volume1:access-token';
  const rewardStorageKey = `mysterylogic:reward:case:${page.caseId}`;
  const REWARD_TOKEN_RE = /^ml_reward_/i;

  const setStatus = (text, kind = '') => {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('is-error', kind === 'error');
    status.classList.toggle('is-ok', kind === 'ok');
  };

  const loadScript = (route) => new Promise((resolve, reject) => {
    const src = new URL(route, siteRoot).href;
    const existing = [...document.scripts].find((item) => item.src === src);
    if (existing) {
      if (existing.dataset.loaded === 'true') resolve();
      else existing.addEventListener('load', resolve, { once: true });
      return;
    }
    const node = document.createElement('script');
    node.src = src;
    node.onload = () => { node.dataset.loaded = 'true'; resolve(); };
    node.onerror = reject;
    document.head.appendChild(node);
  });

  const loadCss = (route) => {
    const href = new URL(route, siteRoot).href;
    if ([...document.styleSheets].some((sheet) => sheet.href === href)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  };

  const bootGame = async (gameConfig) => {
    if (!gameConfig?.case?.id || gameConfig.case.id !== page.caseId) throw new Error('case_mismatch');
    const locked = document.querySelector('[data-paywall-view]');
    if (!locked) throw new Error('paywall_root_missing');

    document.body.className = 'ktv-case-page';
    const root = document.createElement('main');
    root.className = 'ktv-game-shell';
    root.dataset.ktvRoot = '';
    root.dataset.premiumGame = '1.4.0';
    root.dataset.witnessUi = '1.3';
    root.dataset.cyclePolish = '1.4';
    root.dataset.mobileScroll = '1.4.1';
    root.dataset.witnessCount = String(gameConfig.case.witnessCount || gameConfig.case.characters?.length || 0);
    locked.replaceWith(root);

    loadCss('assets/witness-cycle.css?v=1.4.0');
    window.KtoVretWeb = gameConfig;
    window.KtoVretWeb.permalink = location.href;

    await loadScript('assets/generated/cases-index.js?v=1.11.0');
    await loadScript('assets/dossier-model.js?v=1.11.0');
    await loadScript('ktovret-game/assets/app.js?v=1.11.0');
    await loadScript('ktovret-game/assets/performance.js?v=1.11.0');
    await loadScript('assets/case-adapter.js?v=1.4.0');
    await loadScript('assets/mobile-scroll-stabilizer.js?v=1.4.1');

    window.dispatchEvent(new CustomEvent('mysterylogic:paid-case-unlocked', {
      detail: {
        caseId: page.caseId,
        productId: cfg.productId || 'volume1',
        accessSource: REWARD_TOKEN_RE.test(localStorage.getItem(rewardStorageKey) || '') ? 'player_reward' : 'purchase',
      },
    }));
  };

  const fetchPaidCase = async (token) => {
    const url = new URL(cfg.endpoint);
    url.searchParams.set('case_id', page.caseId);
    const response = await fetch(url.href, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
      credentials: 'omit',
    });
    let body = {};
    try { body = await response.json(); } catch {}
    if (!response.ok) throw new Error(body.error || `http_${response.status}`);
    if (!body?.config) throw new Error('invalid_case_payload');
    return body.config;
  };

  const unlock = async ({ silent = false } = {}) => {
    const typed = tokenInput?.value?.trim() || '';
    const rewarded = localStorage.getItem(rewardStorageKey) || '';
    const purchased = localStorage.getItem(storageKey) || '';
    const token = typed || rewarded || purchased;
    if (!token) {
      if (!silent) setStatus('Введите ключ покупки или благодарственный код.', 'error');
      return false;
    }

    if (unlockButton) unlockButton.disabled = true;
    if (!silent) setStatus('Проверяем доступ…');
    try {
      const gameConfig = await fetchPaidCase(token);
      if (REWARD_TOKEN_RE.test(token)) localStorage.setItem(rewardStorageKey, token);
      else localStorage.setItem(storageKey, token);
      setStatus(REWARD_TOKEN_RE.test(token)
        ? 'Бонусный доступ подтверждён. Открываем дело…'
        : 'Доступ подтверждён. Открываем дело…', 'ok');
      await bootGame(gameConfig);
      return true;
    } catch (error) {
      if (REWARD_TOKEN_RE.test(token) && error.message === 'reward_wrong_case') {
        if (typed) setStatus('Этот благодарственный код выдан для другого дела.', 'error');
        return false;
      }
      if (!silent) {
        const messages = {
          access_denied: 'Ключ не даёт доступа к этому делу.',
          reward_wrong_case: 'Этот благодарственный код выдан для другого дела.',
          access_revoked: 'Доступ по этому ключу отозван.',
          access_expired: 'Срок доступа закончился.',
          case_not_found: 'Платное дело не найдено на сервере.',
        };
        setStatus(messages[error.message] || 'Не удалось проверить доступ. Попробуйте ещё раз.', 'error');
      }
      return false;
    } finally {
      if (unlockButton && document.contains(unlockButton)) unlockButton.disabled = false;
    }
  };

  const rewarded = localStorage.getItem(rewardStorageKey) || '';
  const purchased = localStorage.getItem(storageKey) || '';
  if (tokenInput) tokenInput.value = rewarded || purchased;
  unlockButton?.addEventListener('click', () => unlock());
  if (rewarded || purchased) unlock({ silent: true });
})();
