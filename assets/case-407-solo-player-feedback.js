(() => {
  'use strict';

  const root = document.querySelector('[data-solo407-app]');
  if (!root) return;

  const STORAGE_KEY = 'ml:solo:407:v1';
  const plans = {
    1: { initial: ['s1-i0', 's1-i1', 's1-a0'], requests: ['s1-a1', 's1-i2', 's1-a2'] },
    2: { initial: ['s2-i0', 's2-a0'], requests: ['s2-i1', 's2-a1', 's2-i2', 's2-a2'] },
    3: { initial: ['s3-a0', 's3-i0'], requests: ['s3-a1', 's3-i1', 's3-a2', 's3-i2'] },
  };

  const readState = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch { return {}; }
  };

  const maxUnlockedStage = (state) => {
    if (state?.checkpoints?.['2'] === true) return 3;
    if (state?.checkpoints?.['1'] === true) return 2;
    return 1;
  };

  const contextHtml = (compact = false) => `
    <section class="solo407-context" data-solo407-context>
      <p class="solo407-context-kicker">${compact ? 'Вводные перед стартом' : 'Кто есть кто · без спойлеров'}</p>
      <h3>Сначала — люди и пространство</h3>
      <div class="solo407-cast">
        <div class="solo407-person"><b>МО</b><div><strong>Марта Орлова</strong><span>Хранительница сапфира «Северная звезда». Она отвечает за ценность и исчезает после тихой тревоги.</span></div></div>
        <div class="solo407-person"><b>ЕР</b><div><strong>Елена Раева</strong><span>Ночной менеджер отеля. По должности имеет мастер-доступ и сопровождает охрану при тревоге.</span></div></div>
        <div class="solo407-person"><b>ПЗ</b><div><strong>Павел Зорин</strong><span>Начальник ночной смены охраны. Именно его группа первой открывает комнату после сигнала.</span></div></div>
        <div class="solo407-person"><b>ДЛ</b><div><strong>Денис Левин</strong><span>Оценщик сапфира. Незадолго до исчезновения спорил с Мартой; его роль ещё нужно проверить.</span></div></div>
      </div>
      <div class="solo407-relation-note"><strong>Связь Марты и Елены на старте — рабочая.</strong> Марта отвечает за сапфир, Елена — за ночную работу отеля и служебный доступ. Всё остальное устанавливается только по материалам дела.</div>
      <div class="solo407-scene" aria-label="Упрощённая схема коридора">
        <div class="solo407-scene-door"><strong>Дверь «407»</strong><span>табличка в коридоре</span></div>
        <div class="solo407-scene-door"><strong>Дверь «409»</strong><span>соседняя дверь</span></div>
        <div class="solo407-scene-camera">Камера C4<br>видит обе двери</div>
        <div class="solo407-scene-lift">Лифты →</div>
        <p class="solo407-scene-caption">Схема показывает только то, что видно в коридоре. Не считайте номер на табличке доказанным физическим номером комнаты.</p>
      </div>
    </section>`;

  const codeGuideHtml = () => `
    <details class="solo407-code-guide" data-solo407-code-guide open>
      <summary>Как читать обозначения в материалах</summary>
      <div class="solo407-code-grid">
        <div><b>407 / 409</b> — номер, который человек видит на табличке двери.</div>
        <div><b>L‑407 / L‑409</b> — идентификатор дверного контроллера, то есть электроники замка.</div>
        <div><b>H‑...</b> — заводская маркировка самой номерной таблички.</div>
        <div><b>S‑407</b> — обозначение сейфа; <b>C4</b> — камера коридора.</div>
        <div><b>STAFF / LOADING / WEST</b> — Wi‑Fi зоны. Рядом с кодом будет написано, что это за место.</div>
        <div><b>SVC / HK / ER</b> — служебная дверь, мастер‑токен и служебный телефон. Мы подписываем их прямо в тексте.</div>
      </div>
    </details>`;

  const humanize = (value) => {
    let text = String(value || '');
    text = text.replace(/\b([0-2]\d:[0-5]\d):[0-5]\d\b/g, '$1');

    text = text
      .replace(/контроллеры L-407 и L-409/g, 'дверные контроллеры L‑407 и L‑409')
      .replace(/контроллер L-407/g, 'дверной контроллер L‑407')
      .replace(/контроллер L-409/g, 'дверной контроллер L‑409')
      .replace(/сейф S-407/g, 'сейф S‑407')
      .replace(/L-407/g, 'L‑407 [контроллер двери]')
      .replace(/L-409/g, 'L‑409 [контроллер двери]')
      .replace(/H-409/g, 'H‑409 [маркировка таблички]')
      .replace(/S-407/g, 'S‑407 [сейф]')
      .replace(/WEST-4/g, 'WEST‑4 [гостевая Wi‑Fi зона]')
      .replace(/STAFF-4/g, 'STAFF‑4 [служебная Wi‑Fi зона]')
      .replace(/LOADING-B1/g, 'LOADING‑B1 [погрузочная зона]')
      .replace(/SVC-407/g, 'SVC‑407 [служебная дверь]')
      .replace(/HK-44/g, 'HK‑44 [мастер‑токен]')
      .replace(/ER-02/g, 'ER‑02 [служебный телефон Елены]')
      .replace(/NIGHT-MGR/g, 'NIGHT‑MGR [учётная запись ночного менеджера]');
    return text;
  };

  const humanizeTextNodes = () => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (node.parentElement?.closest?.('[data-solo407-context], [data-solo407-code-guide], [data-solo407-recall]')) continue;
      const next = humanize(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
  };

  const fixStageNavigation = (state) => {
    const maxStage = maxUnlockedStage(state);
    const nav = root.querySelector('.solo407-rail nav');
    if (!nav) return;
    nav.querySelectorAll('[data-stage-nav]').forEach((button) => {
      const stage = Number(button.dataset.stageNav || 0);
      button.disabled = stage > maxStage;
      if (stage <= maxStage) button.removeAttribute('aria-disabled');
    });
    if (!nav.parentElement?.querySelector('[data-stage-nav-note]')) {
      nav.insertAdjacentHTML('afterend', '<span class="solo407-stage-nav-note" data-stage-nav-note>К пройденным этапам можно возвращаться в любой момент — открытые этапы не блокируются.</span>');
    }
  };

  const fixEvidenceOrder = (state) => {
    const active = root.querySelector('[data-stage-nav].is-active');
    const stage = Number(active?.dataset?.stageNav || state.stage || 1);
    const plan = plans[stage];
    const list = root.querySelector('.solo407-evidence-list');
    if (!plan || !list) return;

    const requestedInActualOrder = (state.unlocked || []).filter((id) => plan.requests.includes(id));
    const desired = [...plan.initial, ...requestedInActualOrder];
    const current = [...list.querySelectorAll('[data-evidence]')].map((card) => card.dataset.evidence);
    const visibleDesired = desired.filter((id) => current.includes(id));
    if (current.join('|') === visibleDesired.join('|')) return;
    for (const id of visibleDesired) {
      const card = list.querySelector(`[data-evidence="${id}"]`);
      if (card) list.appendChild(card);
    }
  };

  const injectRecall = () => {
    const cart = root.querySelector('[data-evidence="s3-i0"]');
    if (!cart || cart.querySelector('[data-solo407-recall]')) return;
    const head = cart.querySelector('.solo407-evidence-head');
    if (!head) return;
    head.insertAdjacentHTML('afterend', '<div class="solo407-recall" data-solo407-recall><strong>Напоминание из этапа 2.</strong> Ночная горничная Нина Круглова видела бельевую тележку у служебной зоны четвёртого этажа около 01:05 и отметила, что ночью её там обычно не оставляют.</div>');
  };

  const injectContext = () => {
    const entryCopy = root.querySelector('.solo407-entry-copy');
    if (entryCopy && !entryCopy.querySelector('[data-solo407-context]')) {
      const lead = entryCopy.querySelector('.solo407-entry-lead');
      if (lead) lead.insertAdjacentHTML('afterend', contextHtml(true));
    }

    const brief = root.querySelector('.solo407-brief');
    if (brief && !brief.querySelector('[data-solo407-context]')) {
      brief.insertAdjacentHTML('beforeend', contextHtml(false));
    }

    const stageCard = root.querySelector('.solo407-stage-card');
    if (stageCard && !stageCard.querySelector('[data-solo407-code-guide]')) {
      const heading = stageCard.querySelector('.solo407-stage-heading');
      if (heading) heading.insertAdjacentHTML('afterend', codeGuideHtml());
    }
    injectRecall();
  };

  let scheduled = false;
  const apply = () => {
    scheduled = false;
    const state = readState();
    injectContext();
    fixStageNavigation(state);
    fixEvidenceOrder(state);
    humanizeTextNodes();
  };

  const scheduleApply = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(apply);
  };

  const observer = new MutationObserver(scheduleApply);
  observer.observe(root, { childList: true, subtree: true });
  apply();
})();
