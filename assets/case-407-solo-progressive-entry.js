(() => {
  'use strict';

  const root = document.querySelector('[data-solo407-app]');
  if (!root || !window.MLCase407) return;

  const STATE_KEY = 'ml:solo:407:v1';
  const DONE_KEY = 'ml:solo:407:progressive-entry:v1';
  const NEXT_ACTIONS = [
    { id: 's1-i1', key: 'security', eyebrow: 'Люди', title: 'Опросить охрану', copy: 'Кто открыл номер и что именно увидела смена охраны?', selector: '[data-open="s1-i1"]' },
    { id: 's1-i2', key: 'door', eyebrow: 'Место', title: 'Осмотреть дверь', copy: 'Проверить табличку, крепления и физические следы у входа.', selector: '[data-request="s1-i2"]' },
    { id: 's1-a0', key: 'lock', eyebrow: 'Системы', title: 'Запросить журнал замка', copy: 'Сверить физическую дверь с тем, что записал контроллер.', selector: '[data-open="s1-a0"]' },
  ];

  const readState = () => {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || 'null') || {}; }
    catch { return {}; }
  };
  const isDone = () => {
    try { return localStorage.getItem(DONE_KEY) === 'done'; }
    catch { return false; }
  };
  const markDone = () => {
    try { localStorage.setItem(DONE_KEY, 'done'); } catch {}
  };
  const emitStep = (step, extra = {}) => {
    try {
      window.MysteryLogicFunnel?.track?.('diagnostic_choice', {
        case_id: 'solo:407',
        choice: `progressive:${step}`,
        ...extra,
      }, 'solo-407-progressive-entry');
    } catch {}
    try {
      if (typeof window.ym === 'function') {
        window.ym(111664459, 'reachGoal', 'ml_solo_progressive_step', { step, ...extra });
      }
    } catch {}
  };

  const firstEvidence = () => window.MLCase407?.stages?.[0]?.investigator?.[0] || null;
  const openedSet = (state) => new Set(Array.isArray(state.opened) ? state.opened : []);
  const completedNext = (state) => {
    const opened = openedSet(state);
    return NEXT_ACTIONS.filter((item) => opened.has(item.id));
  };

  const shouldSkipForExistingPlayer = (state) => {
    if (!state.started) return false;
    if (Number(state.stage || 1) > 1) return true;
    if (state.solved) return true;
    if (state.checkpoints && Object.values(state.checkpoints).some(Boolean)) return true;
    const opened = Array.isArray(state.opened) ? state.opened : [];
    if (!isDone() && opened.length > 0 && !opened.includes('s1-i0')) return true;
    return false;
  };

  const overlay = () => root.querySelector('[data-solo407-progressive]');
  const removeOverlay = () => {
    overlay()?.remove();
    root.classList.remove('solo407-progressive-active');
  };

  const finishProgressive = (state) => {
    if (isDone()) return false;
    if (openedSet(state).has('s1-i0') && completedNext(state).length >= 2) {
      markDone();
      emitStep('desk-reveal', { completed_actions: completedNext(state).map((item) => item.key) });
      removeOverlay();
      requestAnimationFrame(() => root.querySelector('.solo407-stage-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return true;
    }
    return false;
  };

  const factHtml = (evidence) => {
    const facts = Array.isArray(evidence?.facts) ? evidence.facts : [];
    const fallback = [
      'Телефон Марты остался в комнате',
      'Сейф открыт без повреждений',
      'Окно закрыто изнутри',
      'Следов борьбы нет',
    ];
    const merged = [...facts];
    if (!merged.some((fact) => /окн/i.test(fact))) merged.push(fallback[2]);
    if (!merged.some((fact) => /борьб/i.test(fact))) merged.push(fallback[3]);
    return merged.slice(0, 4).map((fact) => `<li>${fact}</li>`).join('');
  };

  const introHtml = (evidence) => `
    <section class="solo407-progressive" data-solo407-progressive data-progressive-step="scene" data-progressive-signature="scene" aria-label="Первичный осмотр номера 407">
      <div class="solo407-progressive-time"><span>01:19</span><b>Охрана только что открыла номер</b></div>
      <div class="solo407-progressive-scene">
        <figure>
          <img src="${evidence?.image || '/assets/room-407-evidence.webp'}" alt="${evidence?.alt || 'Гостиничный номер 407 после тревоги'}">
          <figcaption>Место происшествия · до прибытия полиции обстановку не меняли</figcaption>
        </figure>
        <div class="solo407-progressive-copy">
          <p class="solo407-kicker">Первичный выезд</p>
          <h1>Вы вошли в номер.</h1>
          <p class="solo407-progressive-lead">Комната пуста. Марта Орлова исчезла. Камера коридора не зафиксировала её выхода.</p>
          <p class="solo407-progressive-note">Сначала зафиксируйте то, что действительно находится перед вами. Версии появятся позже.</p>
          <button class="solo407-primary solo407-progressive-inspect" type="button" data-solo407-progressive-inspect>Осмотреть номер</button>
        </div>
      </div>
    </section>`;

  const choiceHtml = (evidence, state) => {
    const opened = openedSet(state);
    const actions = NEXT_ACTIONS.map((item) => {
      const done = opened.has(item.id);
      return `<button type="button" class="solo407-progressive-action${done ? ' is-done' : ''}" data-solo407-progressive-action="${item.key}" ${done ? 'disabled' : ''}>
        <span>${item.eyebrow}</span><strong>${done ? '✓ ' : ''}${item.title}</strong><small>${item.copy}</small>
      </button>`;
    }).join('');
    const signature = completedNext(state).map((item) => item.key).sort().join(',') || 'none';
    return `
      <section class="solo407-progressive" data-solo407-progressive data-progressive-step="choice" data-progressive-signature="${signature}" aria-label="Выбор следующего следственного действия">
        <div class="solo407-progressive-time"><span>01:19</span><b>Первичный осмотр</b></div>
        <div class="solo407-progressive-observed">
          <div class="solo407-progressive-photo"><img src="${evidence?.image || '/assets/room-407-evidence.webp'}" alt="${evidence?.alt || 'Гостиничный номер 407 после тревоги'}"></div>
          <div>
            <p class="solo407-kicker">Зафиксировано без интерпретаций</p>
            <h1>Что известно прямо сейчас</h1>
            <ul>${factHtml(evidence)}</ul>
          </div>
        </div>
        <div class="solo407-progressive-next">
          <div><p class="solo407-kicker">Следственный выбор</p><h2>Что проверить дальше?</h2><p>Правильного порядка нет. Выберите направление, которое считаете наиболее полезным.</p></div>
          <div class="solo407-progressive-actions">${actions}</div>
          <p class="solo407-progressive-counter">Проверено направлений: <strong>${completedNext(state).length} из 3</strong>. После двух действий откроется полный следственный стол.</p>
        </div>
      </section>`;
  };

  const renderProgressive = () => {
    const state = readState();
    if (!state.started) {
      removeOverlay();
      return;
    }
    if (shouldSkipForExistingPlayer(state)) {
      markDone();
      removeOverlay();
      return;
    }
    if (isDone()) {
      removeOverlay();
      return;
    }
    if (finishProgressive(state)) return;

    const evidence = firstEvidence();
    const inspected = openedSet(state).has('s1-i0');
    root.classList.add('solo407-progressive-active');
    const html = inspected ? choiceHtml(evidence, state) : introHtml(evidence);
    const existing = overlay();
    const desiredStep = inspected ? 'choice' : 'scene';
    const desiredSignature = inspected ? (completedNext(state).map((item) => item.key).sort().join(',') || 'none') : 'scene';
    if (existing?.dataset.progressiveStep === desiredStep && existing?.dataset.progressiveSignature === desiredSignature) return;
    if (existing) { existing.outerHTML = html; return; }
    root.insertAdjacentHTML('beforeend', html);
  };

  const clickUnderlying = (selector) => {
    const node = root.querySelector(selector);
    if (!node) return false;
    node.click();
    return true;
  };

  root.addEventListener('click', (event) => {
    const inspect = event.target.closest('[data-solo407-progressive-inspect]');
    if (inspect) {
      if (clickUnderlying('[data-open="s1-i0"]')) emitStep('inspect-room');
      return;
    }
    const action = event.target.closest('[data-solo407-progressive-action]');
    if (!action || action.disabled) return;
    const item = NEXT_ACTIONS.find((candidate) => candidate.key === action.dataset.solo407ProgressiveAction);
    if (!item) return;
    if (clickUnderlying(item.selector)) emitStep(item.key, { evidence_id: item.id });
  });

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      renderProgressive();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  window.addEventListener('storage', (event) => {
    if (event.key === STATE_KEY || event.key === DONE_KEY) schedule();
  });
  schedule();
})();
