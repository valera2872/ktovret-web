(() => {
  'use strict';

  const root = document.querySelector('[data-casearia-app]');
  if (!root || window.__MLCaseAriaInvestigationUXV2) return;
  window.__MLCaseAriaInvestigationUXV2 = true;

  const PREFIX = 'mysterylogic:last-aria:v1:';
  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const roomCode = () => String(new URL(location.href).searchParams.get('room') || '').trim().toUpperCase();
  const visibleStage = () => Number((root.querySelector('.casearia-brief aside small')?.textContent || '').match(/(?:Пакет|Этап)\s+(\d+)/i)?.[1] || 0);

  const install = (data) => {
    if (!data?.stages?.length || root.dataset.caseariaInvestigationUxV2 === '1') return false;
    root.dataset.caseariaInvestigationUxV2 = '1';

    const roleFromScreen = () => {
      const title = root.querySelector('.casearia-room-top>span:nth-child(2) strong')?.textContent?.trim() || '';
      if (title === data.roles?.guest?.title) return 'guest';
      if (title === data.roles?.creator?.title) return 'creator';
      const code = roomCode();
      if (code && localStorage.getItem(`${PREFIX}${code}:guest`) && !localStorage.getItem(`${PREFIX}${code}:creator`)) return 'guest';
      return 'creator';
    };
    const progressKey = () => {
      const code = roomCode();
      if (!code) return '';
      const role = roleFromScreen();
      const preferred = `${PREFIX}${code}:${role}`;
      if (localStorage.getItem(preferred)) return preferred;
      return [`${PREFIX}${code}:creator`, `${PREFIX}${code}:guest`].find((key) => localStorage.getItem(key)) || preferred;
    };
    const readProgress = () => {
      const key = progressKey();
      if (!key) return {};
      try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { return {}; }
    };

    // Cross-role exchanges should merge observations, not perform the deduction for the players.
    const neutralCrosschecks = {
      creator: {
        1: 'Совмещённые данные: архив открыт в 21:49:31; STAIR-18 занимает 14–17 секунд до уже открытой двери с K-12; маршрут со сцены занимает не менее 58 секунд.',
        2: 'Совмещённые данные: три фразы PB-2 совпадают с TAKE-6; MIC-C в это окно не имеет входного сигнала. Значения MIC и PB сверены по бумажной схеме маршрутизации.',
        3: 'Совмещённые данные: в 21:48:54 C-2 фиксирует LOCAL-ARM; панель стационарна, а камера в 21:48:53–21:48:55 показывает у неё Михаила. После ARM три смещения запускает событие Q-17B.'
      },
      guest: {
        1: 'Совмещённые данные: STAIR-18 занимает 14–17 секунд до уже открытой двери с K-12; архив открыт в 21:49:31; маршрут со сцены занимает не менее 58 секунд.',
        2: 'Совмещённые данные: HEEL-43C и CRESCENT-43 совпали по размеру 43, форме ремонта, двум дефектам подошвы и свежей чёрной краске. Эта пара зафиксирована на Михаиле непосредственно до и после blackout.',
        3: 'Совмещённые данные: в RFI-1 находился один закрытый T-6M; MS-1908 отвечает только при этом кофре внутри шкафа. Контрольные пустые сканы до и после дают ноль.'
      }
    };
    for (const [role, stages] of Object.entries(neutralCrosschecks)) {
      for (const [stageId, result] of Object.entries(stages)) {
        if (data.handoffs?.[role]?.[stageId]) data.handoffs[role][stageId].result = result;
      }
    }

    // A mid-case hypothesis is intentionally provisional. The game must not reveal which suspect is right.
    const provisionalFeedback = 'Рабочая версия зафиксирована. Не считайте её подтверждённой: следующий пакет должен либо усилить, либо опровергнуть её независимыми материалами.';
    if (data.decision?.feedback) {
      for (const option of data.decision.options || []) data.decision.feedback[option.id] = provisionalFeedback;
    }

    if (!document.querySelector('[data-casearia-investigation-ux-v2-style]')) {
      const style = document.createElement('style');
      style.dataset.caseariaInvestigationUxV2Style = '1';
      style.textContent = `
        .casearia-facts{display:none!important}
        .casearia-review-nav{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:10px 0 18px;padding:10px 12px;border:1px solid rgba(232,200,138,.16);background:rgba(8,10,12,.78)}
        .casearia-review-nav>span{color:#8d8f89;font-size:.62rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.casearia-review-nav div{display:flex;gap:7px;flex-wrap:wrap}.casearia-review-nav button{min-height:34px;padding:7px 11px;font-size:.7rem}.casearia-review-nav button.is-current{border-color:rgba(216,179,110,.55);color:#ead6a6}.casearia-review-nav button.is-reviewed{border-color:rgba(130,177,142,.38)}
        .casearia-review-package{margin:0 0 18px;padding:18px;border:1px solid rgba(216,179,110,.3);background:linear-gradient(180deg,rgba(29,25,18,.9),rgba(12,14,16,.96))}.casearia-review-package-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}.casearia-review-package-head small{display:block;color:#d8b36e;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.casearia-review-package-head h2{margin:5px 0 6px;font:500 clamp(1.45rem,3vw,2.2rem)/1.05 Georgia,serif}.casearia-review-package-head p{margin:0;color:#aaa79f;line-height:1.55}.casearia-review-crosscheck{margin-top:14px;padding:12px 14px;border-left:3px solid rgba(130,177,142,.55);background:rgba(61,92,69,.13);color:#bcc7bd;line-height:1.5}.casearia-review-crosscheck b{color:#d7e2d8}
        .casearia-decision-note{margin:10px 0 0;padding:10px 12px;border:1px solid rgba(216,179,110,.24);background:rgba(216,179,110,.07);color:#d7cfbd;line-height:1.45}@media(max-width:640px){.casearia-review-package-head{flex-direction:column}.casearia-review-package-head .casearia-button{width:100%}.casearia-review-nav{align-items:flex-start;flex-direction:column}}
      `;
      document.head.appendChild(style);
    }

    const materialHtml = (material, index) => `<article class="casearia-evidence type-${esc(material.type || 'card')}"><header><small>${esc(material.tag || `Материал ${index + 1}`)}</small><h3>${esc(material.title)}</h3></header><div class="casearia-evidence-body">${(material.body || []).map((p) => `<p>${esc(p)}</p>`).join('')}</div>${(material.facts || []).length ? `<div class="casearia-facts">${material.facts.map((f) => `<span>${esc(f)}</span>`).join('')}</div>` : ''}</article>`;
    const closeReview = () => root.querySelector('[data-aria-review-package]')?.remove();
    const renderReview = (stageId) => {
      const progress = readProgress();
      const current = visibleStage();
      const opened = Math.max(1, Number(progress.stage || current || 1));
      if (!stageId || stageId === current || stageId > opened) { closeReview(); return; }
      const stage = data.stages[stageId - 1];
      if (!stage) return;
      const role = roleFromScreen();
      const handoff = data.handoffs?.[role]?.[stageId];
      closeReview();
      const node = document.createElement('section');
      node.className = 'casearia-review-package';
      node.dataset.ariaReviewPackage = String(stageId);
      node.innerHTML = `<div class="casearia-review-package-head"><div><small>Ранее открытый пакет ${stageId}</small><h2>${esc(stage.title)}</h2><p>${esc(stage.objective)}</p></div><button type="button" class="casearia-button" data-aria-review-close>Закрыть пакет</button></div><div class="casearia-evidence-grid">${(stage[role] || []).map(materialHtml).join('')}</div>${progress.handoffs?.[stageId] && handoff?.result ? `<div class="casearia-review-crosscheck"><b>Совместная сверка:</b> ${esc(handoff.result)}</div>` : ''}`;
      const anchor = root.querySelector('.casearia-brief');
      if (anchor) anchor.before(node); else root.prepend(node);
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const ensureReviewNav = () => {
      const brief = root.querySelector('.casearia-brief');
      if (!brief) { closeReview(); return; }
      const current = visibleStage();
      if (!current) return;
      const opened = Math.max(current, Number(readProgress().stage || current));
      let nav = root.querySelector('[data-aria-review-nav]');
      if (!nav) {
        nav = document.createElement('nav');
        nav.className = 'casearia-review-nav';
        nav.dataset.ariaReviewNav = '1';
        nav.setAttribute('aria-label', 'Открытые пакеты расследования');
        const top = root.querySelector('.casearia-room-top');
        if (top) top.after(nav); else brief.before(nav);
      }
      const signature = `${current}:${opened}`;
      if (nav.dataset.ariaReviewSignature === signature) return;
      nav.dataset.ariaReviewSignature = signature;
      nav.innerHTML = `<span>Открытые пакеты</span><div>${data.stages.slice(0, opened).map((stage) => `<button type="button" class="casearia-button ${stage.id === current ? 'is-current' : 'is-reviewed'}" data-aria-review-stage="${stage.id}" ${stage.id === current ? 'disabled' : ''}>${stage.id}. ${esc(stage.title)}</button>`).join('')}</div>`;
    };

    const ensureDecisionState = () => {
      const section = root.querySelector('.casearia-decision');
      if (!section) return;
      const progress = readProgress();
      const handoffDone = Boolean(progress.handoffs?.[data.decision.stage]);
      const chosen = Boolean(progress.decision);
      for (const button of section.querySelectorAll('[data-decision]')) button.disabled = !handoffDone;
      const next = root.querySelector('[data-action="next-stage"]');
      if (next && visibleStage() === Number(data.decision.stage)) next.disabled = !handoffDone || !chosen;
      let note = section.querySelector('[data-aria-decision-note]');
      let text = '';
      if (!handoffDone) text = 'Сначала завершите перекрёстную сверку выше. Рабочая версия должна опираться на материалы двух ролей.';
      else if (chosen) text = 'Это рабочая гипотеза, а не ответ системы. Следующий пакет даст новые материалы — решите сами, выдержала ли версия проверку.';
      if (!text) { note?.remove(); return; }
      if (!note) { note = document.createElement('div'); note.className = 'casearia-decision-note'; note.dataset.ariaDecisionNote = '1'; section.appendChild(note); }
      if (note.textContent !== text) note.textContent = text;
    };

    root.addEventListener('click', (event) => {
      const review = event.target.closest?.('[data-aria-review-stage]');
      if (review) { renderReview(Number(review.dataset.ariaReviewStage || 0)); return; }
      if (event.target.closest?.('[data-aria-review-close]')) { closeReview(); return; }
      const choiceNode = event.target.closest?.('[data-decision]');
      if (!choiceNode || !root.contains(choiceNode)) return;
      const progress = readProgress();
      if (!progress.handoffs?.[data.decision.stage]) {
        event.preventDefault();
        event.stopImmediatePropagation();
        ensureDecisionState();
      }
    }, true);

    let scheduled = false;
    const apply = () => { scheduled = false; ensureReviewNav(); ensureDecisionState(); };
    const schedule = () => { if (scheduled) return; scheduled = true; queueMicrotask(apply); };
    const observer = new MutationObserver(schedule);
    // The game swaps root-level screens. Watching descendants would observe this
    // layer's own nav/note edits and can create a self-sustaining microtask loop.
    observer.observe(root, { childList: true });
    apply();
    return true;
  };

  if (install(window.MLCaseAria)) return;
  const bootObserver = new MutationObserver(() => {
    if (!install(window.MLCaseAria)) return;
    bootObserver.disconnect();
  });
  bootObserver.observe(root, { childList: true, subtree: true });
})();