(() => {
  'use strict';

  const path = location.pathname;
  const seenViews = new Set();
  const emittedClicks = new Set();

  const track = (eventName, metadata = {}, target = '') => {
    const send = window.MysteryLogicFunnel?.track;
    if (typeof send !== 'function') return false;
    try { send(eventName, metadata, target); return true; } catch { return false; }
  };

  const stepView = (flow, step, metadata = {}) => {
    const signature = String(metadata.signature || '');
    const key = `${flow}:${step}:${signature}`;
    if (seenViews.has(key)) return;
    if (!track('step_view', { flow, step, ...metadata }, 'conversion-step')) return;
    seenViews.add(key);
  };

  const safeText = (node, text) => {
    if (node && node.textContent !== text) node.textContent = text;
  };

  const enhanceCoopHub = () => {
    if (!/^\/detektivnye-igry-dlya-dvoih\/?$/.test(path)) return;
    const copy = document.querySelector('.coop-hero-copy');
    if (!copy) return;

    const shell = document.querySelector('.duel-app-shell');
    if (shell && !shell.id) shell.id = 'duel-room';

    if (!copy.querySelector('[data-coop-format-choice]')) {
      copy.innerHTML = `
        <p class="duel-kicker">Mystery Logic · выберите формат</p>
        <h1>Детективные игры для двоих онлайн</h1>
        <p class="coop-lead"><strong>Один создаёт комнату и отправляет ссылку. Второй подключается — без регистрации.</strong> Дальше выберите, сколько времени хотите провести в расследовании.</p>
        <p class="coop-entry-question">Как хотите играть сегодня?</p>
        <div class="coop-entry-choice-grid" aria-label="Выберите формат игры для двоих">
          <a class="coop-entry-choice is-deep" href="2317/" data-coop-format-choice="deep-2317">
            <small>45–60 минут · разные роли</small>
            <strong>Совместное расследование</strong>
            <span>У каждого свои улики. Полную версию дела можно собрать только вместе.</span>
            <b>Начать «23:17» бесплатно →</b>
          </a>
          <a class="coop-entry-choice" href="#duel-room" data-coop-format-choice="short-duel">
            <small>10–15 минут · быстрый формат</small>
            <strong>Короткая дуэль</strong>
            <span>Одинаковое дело на двух устройствах. Решаете независимо и сравниваете результат.</span>
            <b>Выбрать короткое дело ↓</b>
          </a>
        </div>
        <a class="coop-entry-existing" href="#duel-room" data-coop-format-choice="join-existing">Уже получили ссылку или код? Войти в комнату ↓</a>
        <div class="duel-trust coop-entry-trust" aria-label="Особенности режима"><span>2 устройства</span><span>Без регистрации</span><span>Бесплатный старт</span></div>
      `;
    }

    stepView('coop-hub', 'format-choice', { signature: 'v2' });
  };

  const coopCaseId = () => {
    if (/^\/detektivnye-igry-dlya-dvoih\/407\/?$/.test(path)) return 'coop:407';
    if (/^\/detektivnye-igry-dlya-dvoih\/2317\/?$/.test(path)) return 'coop:2317';
    return '';
  };

  const coopScreen = (root) => {
    if (root.querySelector('[data-final-form]')) return 'final';
    if (root.querySelector('[data-action="stage"]')) return 'investigation';
    if (root.querySelector('[data-action="start"]')) return 'lobby';
    if (root.querySelector('[data-action="join"]')) return 'join';
    if (root.querySelector('[data-action="create"]')) return 'create';
    if (root.querySelector('[data-action="create-open"]')) return 'cover';
    return 'loading';
  };

  const enhanceCoopCase = () => {
    const caseId = coopCaseId();
    if (!caseId) return;
    const root = document.querySelector('[data-case2317-app],[data-case407-app]');
    if (!root) return;

    const render = () => {
      const screen = coopScreen(root);
      if (screen !== 'loading') stepView('coop-entry', screen, { case_id: caseId, signature: screen });

      if (screen === 'cover') {
        safeText(root.querySelector('[data-action="create-open"]'), 'Начать вдвоём — создать комнату');
        safeText(root.querySelector('[data-action="join-focus"]'), 'Войти по приглашению');
        const actions = root.querySelector('[data-action="create-open"]')?.closest('.case2317-actions');
        if (actions && !actions.nextElementSibling?.matches?.('.coop-entry-reassure')) {
          actions.insertAdjacentHTML('afterend', '<p class="coop-entry-reassure">Ссылка для второго игрока появится сразу · без регистрации</p>');
        }
      }
    };

    root.addEventListener('click', (event) => {
      const node = event.target.closest('[data-action]');
      if (!node || !root.contains(node)) return;
      const action = String(node.dataset.action || '');
      if (!['create-open', 'join-focus', 'join-code', 'create', 'join', 'share', 'start', 'home'].includes(action)) return;
      const key = `${caseId}:${action}:${Date.now()}`;
      emittedClicks.add(key);
      track('diagnostic_choice', {
        case_id: caseId,
        choice: `${caseId}:entry:${action}`,
        label: (node.textContent || action).replace(/\s+/g, ' ').trim().slice(0, 120),
      }, 'coop-entry');
    }, true);

    const observer = new MutationObserver(() => queueMicrotask(render));
    observer.observe(root, { childList: true, subtree: true });
    render();
  };

  const observeSoloProgressive = () => {
    if (!/^\/detektivnye-igry-dlya-odnogo\/407\/?$/.test(path)) return;
    const root = document.querySelector('[data-solo407-app]');
    if (!root) return;

    const report = () => {
      const overlay = root.querySelector('[data-solo407-progressive]');
      if (overlay) {
        const step = overlay.dataset.progressiveStep || 'unknown';
        const signature = overlay.dataset.progressiveSignature || step;
        stepView('solo-407-progressive', step, { case_id: 'solo:407', signature });
        return;
      }

      let state = {};
      let done = false;
      try { state = JSON.parse(localStorage.getItem('ml:solo:407:v1') || '{}') || {}; } catch {}
      try { done = localStorage.getItem('ml:solo:407:progressive-entry:v1') === 'done'; } catch {}
      if (state.started) {
        const reason = done ? 'done-or-returning' : 'existing-player-bypass';
        stepView('solo-407-progressive', 'bypass', { case_id: 'solo:407', signature: reason, reason });
      }
    };

    const observer = new MutationObserver(() => queueMicrotask(report));
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-progressive-step', 'data-progressive-signature'] });
    report();
    setTimeout(report, 600);
  };

  document.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-coop-format-choice]');
    if (!choice) return;
    const value = String(choice.dataset.coopFormatChoice || '');
    track('format_choice', { choice: value, label: (choice.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) }, `coop-format:${value}`);
    if (value === 'join-existing') {
      setTimeout(() => document.querySelector('[data-duel-action="focus-code"]')?.click(), 120);
    }
  }, true);

  const boot = () => {
    enhanceCoopHub();
    enhanceCoopCase();
    observeSoloProgressive();
    if (/^\/logicheskie-zadachi\/?$/.test(path)) stepView('logic', 'hub', { signature: 'logic-hub' });
    else if (/^\/logicheskie-zadachi\/[^/]+\/?$/.test(path)) stepView('logic', 'puzzle', { signature: path });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
