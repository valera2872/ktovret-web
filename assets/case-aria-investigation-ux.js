(() => {
  'use strict';

  const root = document.querySelector('[data-casearia-app]');
  if (!root || window.__MLCaseAriaInvestigationUX) return;
  window.__MLCaseAriaInvestigationUX = true;

  const PREFIX = 'mysterylogic:last-aria:v1:';
  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const roomCode = () => String(new URL(location.href).searchParams.get('room') || '').trim().toUpperCase();
  const visibleStage = () => {
    const text = root.querySelector('.casearia-brief aside small')?.textContent || '';
    return Number(text.match(/(?:Пакет|Этап)\s+(\d+)/i)?.[1] || 0);
  };

  const install = (data) => {
    if (!data?.stages?.length || root.dataset.caseariaInvestigationUxInstalled === '1') return false;
    root.dataset.caseariaInvestigationUxInstalled = '1';

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
      const candidates = [`${PREFIX}${code}:creator`, `${PREFIX}${code}:guest`];
      return candidates.find((key) => localStorage.getItem(key)) || preferred;
    };
    const readProgress = () => {
      const key = progressKey();
      if (!key) return {};
      try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
      catch { return {}; }
    };
    const writeProgress = (progress) => {
      const key = progressKey();
      if (!key) return;
      try { localStorage.setItem(key, JSON.stringify(progress)); } catch {}
    };

    const ensureStyle = () => {
      if (document.querySelector('[data-casearia-investigation-ux-style]')) return;
      const style = document.createElement('style');
      style.dataset.caseariaInvestigationUxStyle = '1';
      style.textContent = `
        .casearia-review-nav{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:10px 0 18px;padding:10px 12px;border:1px solid rgba(232,200,138,.16);background:rgba(8,10,12,.78)}
        .casearia-review-nav>span{color:#8d8f89;font-size:.62rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
        .casearia-review-nav div{display:flex;gap:7px;flex-wrap:wrap}.casearia-review-nav button{min-height:34px;padding:7px 11px;font-size:.7rem}
        .casearia-review-nav button.is-current{border-color:rgba(216,179,110,.55);color:#ead6a6}.casearia-review-nav button.is-reviewed{border-color:rgba(130,177,142,.38)}
        .casearia-review-package{margin:0 0 18px;padding:18px;border:1px solid rgba(216,179,110,.3);background:linear-gradient(180deg,rgba(29,25,18,.9),rgba(12,14,16,.96))}
        .casearia-review-package-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:14px}.casearia-review-package-head small{display:block;color:#d8b36e;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.casearia-review-package-head h2{margin:5px 0 6px;font:500 clamp(1.45rem,3vw,2.2rem)/1.05 Georgia,serif}.casearia-review-package-head p{margin:0;color:#aaa79f;line-height:1.55}
        .casearia-review-package .casearia-evidence-grid{margin-top:10px}.casearia-review-crosscheck{margin-top:14px;padding:12px 14px;border-left:3px solid rgba(130,177,142,.55);background:rgba(61,92,69,.13);color:#bcc7bd;line-height:1.5}.casearia-review-crosscheck b{color:#d7e2d8}
        .casearia-decision-note{margin:10px 0 0;padding:10px 12px;border:1px solid rgba(191,96,76,.3);background:rgba(83,29,22,.14);color:#d7c2bc;line-height:1.45}.casearia-decision-option.is-rejected{opacity:.52;text-decoration:none}.casearia-decision-option.is-rejected strong:after{content:' · линия закрыта';color:#c98c7e;font-size:.72em;font-weight:700}
        @media(max-width:640px){.casearia-review-package-head{flex-direction:column}.casearia-review-package-head .casearia-button{width:100%}.casearia-review-nav{align-items:flex-start;flex-direction:column}}
      `;
      document.head.appendChild(style);
    };

    const materialHtml = (material, index) => {
      const body = (material.body || []).map((p) => `<p>${esc(p)}</p>`).join('');
      const facts = (material.facts || []).map((f) => `<span>${esc(f)}</span>`).join('');
      return `<article class="casearia-evidence type-${esc(material.type || 'card')}"><header><small>${esc(material.tag || `Материал ${index + 1}`)}</small><h3>${esc(material.title)}</h3></header><div class="casearia-evidence-body">${body}</div>${facts ? `<div class="casearia-facts">${facts}</div>` : ''}</article>`;
    };

    const closeReview = () => root.querySelector('[data-aria-review-package]')?.remove();
    const renderReview = (stageId) => {
      const progress = readProgress();
      const current = visibleStage();
      const opened = Math.max(1, Number(progress.stage || current || 1));
      if (!stageId || stageId === current || stageId > opened) { closeReview(); return; }
      const role = roleFromScreen();
      const stage = data.stages[stageId - 1];
      if (!stage) return;
      const materials = stage[role] || [];
      const handoff = data.handoffs?.[role]?.[stageId];
      const done = Boolean(progress.handoffs?.[stageId]);
      closeReview();
      const node = document.createElement('section');
      node.className = 'casearia-review-package';
      node.dataset.ariaReviewPackage = String(stageId);
      node.innerHTML = `<div class="casearia-review-package-head"><div><small>Ранее открытый пакет ${stageId}</small><h2>${esc(stage.title)}</h2><p>${esc(stage.objective)}</p></div><button type="button" class="casearia-button" data-aria-review-close>Закрыть пакет</button></div><div class="casearia-evidence-grid">${materials.map(materialHtml).join('')}</div>${done && handoff?.result ? `<div class="casearia-review-crosscheck"><b>Совместная сверка:</b> ${esc(handoff.result)}</div>` : ''}`;
      const anchor = root.querySelector('.casearia-brief');
      if (anchor) anchor.before(node); else root.prepend(node);
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const ensureReviewNav = () => {
      const brief = root.querySelector('.casearia-brief');
      if (!brief) { closeReview(); return; }
      const current = visibleStage();
      if (!current) return;
      const progress = readProgress();
      const opened = Math.max(current, Number(progress.stage || current));
      let nav = root.querySelector('[data-aria-review-nav]');
      if (!nav) {
        nav = document.createElement('nav');
        nav.className = 'casearia-review-nav';
        nav.dataset.ariaReviewNav = '1';
        nav.setAttribute('aria-label', 'Открытые пакеты расследования');
        const top = root.querySelector('.casearia-room-top');
        if (top) top.after(nav); else brief.before(nav);
      }
      nav.innerHTML = `<span>Открытые пакеты</span><div>${data.stages.slice(0, opened).map((stage) => `<button type="button" class="casearia-button ${stage.id === current ? 'is-current' : 'is-reviewed'}" data-aria-review-stage="${stage.id}" ${stage.id === current ? 'disabled' : ''}>${stage.id}. ${esc(stage.title)}</button>`).join('')}</div>`;
    };

    const decisionHistory = (progress) => Array.isArray(progress.decisionHistory) ? progress.decisionHistory : [];
    const ensureDecisionState = () => {
      const section = root.querySelector('.casearia-decision');
      if (!section) return;
      const progress = readProgress();
      const history = decisionHistory(progress);
      const handoffDone = Boolean(progress.handoffs?.[data.decision.stage]);
      const solved = progress.decision === data.decision.correct || history.includes(data.decision.correct);
      for (const button of section.querySelectorAll('[data-decision]')) {
        const choice = button.dataset.decision || '';
        const rejected = history.includes(choice) && choice !== data.decision.correct;
        button.classList.toggle('is-rejected', rejected);
        button.disabled = solved || !handoffDone || rejected;
      }
      let note = section.querySelector('[data-aria-decision-note]');
      if (!handoffDone) {
        if (!note) { note = document.createElement('div'); note.className = 'casearia-decision-note'; note.dataset.ariaDecisionNote = '1'; section.appendChild(note); }
        note.textContent = 'Сначала завершите перекрёстную сверку выше. Решение должно опираться на материалы двух ролей.';
      } else if (!solved && history.length) {
        if (!note) { note = document.createElement('div'); note.className = 'casearia-decision-note'; note.dataset.ariaDecisionNote = '1'; section.appendChild(note); }
        const last = history[history.length - 1];
        note.textContent = `${data.decision.feedback?.[last] || 'Эта линия не выдержала проверку.'} Линия закрыта — выберите следующую версию.`;
      } else {
        note?.remove();
      }
    };

    const trackDecisionWrong = (choice, mistakes) => {
      try {
        window.MysteryLogicFunnel?.track?.('diagnostic_choice', {
          case_id: 'coop:last-aria',
          choice: 'coop:last-aria:decision-wrong',
          label: data.decision.options?.find((item) => item.id === choice)?.title || choice,
          position: Number(data.decision.stage || 2),
          attempt: mistakes
        }, 'coop-cognitive');
      } catch {}
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
        return;
      }
      const choice = choiceNode.dataset.decision || '';
      if (!choice || choice === data.decision.correct) {
        if (choice === data.decision.correct) {
          const history = decisionHistory(progress);
          if (!history.includes(choice)) progress.decisionHistory = [...history, choice];
          writeProgress(progress);
        }
        return;
      }
      const history = decisionHistory(progress);
      if (history.includes(choice)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      progress.decisionHistory = [...history, choice];
      progress.decisionMistakes = Number(progress.decisionMistakes || 0) + 1;
      writeProgress(progress);
      trackDecisionWrong(choice, progress.decisionMistakes);
      ensureDecisionState();
    }, true);

    root.addEventListener('submit', (event) => {
      const form = event.target.closest?.('.casearia-final-form[data-final-form]');
      if (!form) return;
      const progress = readProgress();
      const mistakes = Number(progress.decisionMistakes || 0);
      if (!mistakes || progress.decisionPenaltyApplied) return;
      progress.attempts = Number(progress.attempts || 0) + mistakes;
      progress.decisionPenaltyApplied = true;
      if (progress.firstAnswerCorrect === null || typeof progress.firstAnswerCorrect === 'undefined') progress.firstAnswerCorrect = false;
      writeProgress(progress);
    }, true);

    let scheduled = false;
    const apply = () => {
      scheduled = false;
      ensureStyle();
      ensureReviewNav();
      ensureDecisionState();
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(apply);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
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
