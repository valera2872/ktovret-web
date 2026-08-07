(() => {
  'use strict';

  const cfg = window.KtoVretWeb || {};
  const caseData = cfg.case || {};
  const root = document.querySelector('[data-ktv-root]');
  if (!root) return;

  const options = { childList: true, subtree: true };
  let observer;
  let scheduled = false;
  let activeWitnessId = '';
  let lastTestimonySection = null;
  let stageObserver = null;

  const witnesses = (caseData.characters || []).filter(
    (item) => item?.id && !String(item.id).startsWith('__'),
  );

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const initials = (name = '') => name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const setText = (node, value) => {
    if (node && node.textContent !== value) node.textContent = value;
  };

  const witnessWord = (count) => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'свидетель';
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return 'свидетеля';
    return 'свидетелей';
  };

  const selectedOption = () => root.querySelector('#ktv-answer .ktv-option.is-selected');
  const selectedOptionId = () => selectedOption()?.dataset.optionId || '';
  const selectedOptionLabel = () => selectedOption()?.querySelector('.ktv-option-copy strong')?.textContent?.trim() || '';
  const witnessById = (id) => witnesses.find((item) => item.id === id);

  const witnessWave = () => Array.from(
    { length: 30 },
    (_, index) => `<i style="--h:${18 + ((index * 17) % 54)}%"></i>`,
  ).join('');

  const witnessTabs = (activeId, linkedId) => witnesses.map((witness, index) => {
    const active = witness.id === activeId;
    const linked = witness.id === linkedId;
    return `
      <button
        class="ktv-witness-tab ${active ? 'is-active' : ''} ${linked ? 'is-linked-to-version' : ''}"
        type="button"
        role="tab"
        id="ktv-witness-tab-${escapeHtml(witness.id)}"
        data-witness-id="${escapeHtml(witness.id)}"
        aria-selected="${active}"
        aria-controls="ktv-witness-panel"
        tabindex="${active ? '0' : '-1'}">
        <span class="ktv-witness-tab-avatar" aria-hidden="true">${escapeHtml(initials(witness.name))}</span>
        <span class="ktv-witness-tab-copy">
          <strong>${escapeHtml(witness.name || `Свидетель ${index + 1}`)}</strong>
          <small>${escapeHtml(witness.role || `Показание ${index + 1}`)}</small>
        </span>
      </button>
    `;
  }).join('');

  const witnessPanel = (witness, linkedId) => {
    const linked = witness.id === linkedId;
    const index = witnesses.findIndex((item) => item.id === witness.id);
    return `
      <article
        class="ktv-witness-panel ${linked ? 'is-linked-to-version' : ''}"
        id="ktv-witness-panel"
        role="tabpanel"
        aria-labelledby="ktv-witness-tab-${escapeHtml(witness.id)}">
        <div class="ktv-witness-panel-head">
          <div class="ktv-witness-person">
            <span class="ktv-witness-avatar" aria-hidden="true">${escapeHtml(initials(witness.name))}</span>
            <span class="ktv-witness-person-copy">
              <strong>${escapeHtml(witness.name)}</strong>
              <small>${escapeHtml(witness.role || 'свидетель')}</small>
            </span>
          </div>
          ${linked ? '<span class="ktv-witness-version-badge">Выбран в версии</span>' : ''}
        </div>
        <div class="ktv-witness-wave" aria-hidden="true">${witnessWave()}</div>
        <blockquote class="ktv-witness-quote">«${escapeHtml(witness.statement || '')}»</blockquote>
        <div class="ktv-witness-index">
          <span>Показание ${String(index + 1).padStart(2, '0')}</span>
          <span>${index + 1} из ${witnesses.length}</span>
        </div>
      </article>
    `;
  };

  const adaptTestimony = () => {
    const section = root.querySelector('#ktv-testimony');
    if (!section || !witnesses.length) {
      lastTestimonySection = section || null;
      return;
    }

    const selectedId = selectedOptionId();
    const selectedWitness = witnessById(selectedId);
    const isNewCoreRender = section !== lastTestimonySection;
    lastTestimonySection = section;

    if (isNewCoreRender && selectedWitness) activeWitnessId = selectedWitness.id;
    if (!witnessById(activeWitnessId)) activeWitnessId = selectedWitness?.id || witnesses[0].id;

    setText(section.querySelector('h2'), witnesses.length > 1 ? 'Показания свидетелей' : 'Показание свидетеля');
    setText(
      section.querySelector('.ktv-recording'),
      `${witnesses.length} ${witnessWord(witnesses.length)} · служебные записи`,
    );

    const existingStack = section.querySelector('.ktv-witness-stack');
    const legacyTranscript = section.querySelector('.ktv-transcript');
    if (legacyTranscript) legacyTranscript.remove();
    if (existingStack) existingStack.remove();

    const activeWitness = witnessById(activeWitnessId) || witnesses[0];
    section.insertAdjacentHTML('beforeend', `
      <div class="ktv-witness-stack">
        ${witnesses.length > 1 ? `<div class="ktv-witness-switcher" role="tablist" aria-label="Выберите свидетеля">${witnessTabs(activeWitness.id, selectedId)}</div>` : ''}
        ${witnessPanel(activeWitness, selectedId)}
      </div>
    `);
  };

  const adaptStageNav = () => {
    const nav = root.querySelector('.ktv-stage-nav');
    if (!nav) return;
    const buttons = nav.querySelectorAll('button[data-action="jump"]');
    const second = buttons[1];
    if (!second) return;

    if (!witnesses.length) {
      const facts = root.querySelector('#ktv-briefing .ktv-facts');
      if (facts) facts.id = 'ktv-analysis-materials';
      second.dataset.target = facts ? '#ktv-analysis-materials' : '#ktv-briefing';
      second.innerHTML = '<span>02</span> Условия';
    } else {
      second.dataset.target = '#ktv-testimony';
      second.innerHTML = `<span>02</span> ${witnesses.length > 1 ? 'Показания' : 'Показание'}`;
    }
  };

  const addContinue = (section, from, label, target, solved = false) => {
    if (!section || section.querySelector(`.ktv-stage-continue[data-cycle-from="${from}"]`)) return;
    section.insertAdjacentHTML('beforeend', `
      <div class="ktv-stage-continue" data-cycle-from="${from}">
        <span>${solved ? 'Дело уже раскрыто' : 'Готовы двигаться дальше?'}</span>
        <button type="button" data-action="jump" data-target="${target}">${label} →</button>
      </div>
    `);
  };

  const adaptTransitions = () => {
    const solved = Boolean(root.querySelector('#ktv-result'));
    const briefing = root.querySelector('#ktv-briefing');
    const testimony = root.querySelector('#ktv-testimony');

    if (solved) {
      addContinue(briefing, 'briefing', 'Открыть разбор', '#ktv-result', true);
      addContinue(testimony, 'testimony', 'Открыть разбор', '#ktv-result', true);
      return;
    }

    addContinue(
      briefing,
      'briefing',
      witnesses.length ? 'Перейти к показаниям' : 'Перейти к версии',
      witnesses.length ? '#ktv-testimony' : '#ktv-answer',
    );
    addContinue(testimony, 'testimony', 'Перейти к версии', '#ktv-answer');
  };

  const adaptAnswer = () => {
    root.querySelectorAll('.ktv-option-copy small').forEach((node) => {
      const id = node.closest('.ktv-option')?.dataset.optionId || '';
      setText(node, witnessById(id) ? 'Свидетель' : 'Вариант заключения');
    });

    const submit = root.querySelector('#ktv-answer [data-action="submit"]');
    setText(submit, 'Проверить версию');

    const answer = root.querySelector('#ktv-answer');
    if (!answer) return;
    const previous = answer.querySelector('.ktv-selected-version-summary');
    if (previous) previous.remove();

    const label = selectedOptionLabel();
    const actions = answer.querySelector('.ktv-answer-actions');
    if (label && actions) {
      actions.insertAdjacentHTML('beforebegin', `
        <div class="ktv-selected-version-summary" aria-live="polite">
          <span>Выбранная версия</span>
          <strong>${escapeHtml(label)}</strong>
        </div>
      `);
    }
  };

  const adaptResult = () => {
    const result = root.querySelector('#ktv-result');
    if (!result) return;

    const resultTitle = result.querySelector('h2');
    if (resultTitle && resultTitle.textContent !== 'Чистое раскрытие') {
      setText(resultTitle, 'Противоречие доказано');
    }

    const old = result.querySelector('.ktv-cycle-result-note');
    if (old) old.remove();
    const label = selectedOptionLabel();
    const actions = result.querySelector('.ktv-result-actions');
    if (label && actions) {
      actions.insertAdjacentHTML('beforebegin', `
        <div class="ktv-cycle-result-note">
          <span>Подтверждённая версия</span>
          <strong>${escapeHtml(label)}</strong>
        </div>
      `);
    }
  };

  const adaptConfrontation = () => {
    const confrontation = root.querySelector('.ktv-confrontation');
    if (!confrontation) return;
    const labels = confrontation.querySelectorAll('div > span');
    setText(labels[0], 'Материалы');
    setText(labels[1], witnesses.length > 1 ? 'Показания' : 'Показание');
  };

  const markCurrentStage = (targetId) => {
    root.querySelectorAll('.ktv-stage-nav button[data-action="jump"]').forEach((button) => {
      const current = button.dataset.target === `#${targetId}`;
      button.classList.toggle('is-current', current);
      if (current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  };

  const refreshStageObserver = () => {
    if (stageObserver) stageObserver.disconnect();
    if (!('IntersectionObserver' in window)) return;

    const targets = [...root.querySelectorAll('.ktv-stage-nav button[data-action="jump"]')]
      .map((button) => button.dataset.target)
      .filter((target, index, list) => target && list.indexOf(target) === index)
      .map((target) => root.querySelector(target))
      .filter(Boolean);

    stageObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) markCurrentStage(visible.target.id);
    }, {
      rootMargin: '-24% 0px -58% 0px',
      threshold: [0, 0.05, 0.2, 0.45],
    });

    targets.forEach((target) => stageObserver.observe(target));
  };

  const adapt = () => {
    // The adapter changes DOM itself. Disconnect while applying changes so
    // the observer cannot react to its own mutations forever.
    observer.disconnect();

    try {
      setText(
        root.querySelector('.ktv-cover-lead'),
        'Сопоставьте материалы и все показания. Только одна версия не выдерживает логической проверки.',
      );
      setText(
        root.querySelector('.ktv-hero-copy > p:last-child'),
        witnesses.length
          ? 'Восстановите картину событий, сравните свидетелей и проверьте каждую версию по подтверждённым фактам.'
          : 'Восстановите единственную картину событий и проверьте варианты по подтверждённым условиям.',
      );

      adaptTestimony();
      adaptStageNav();
      adaptTransitions();
      adaptAnswer();
      adaptConfrontation();
      adaptResult();
      refreshStageObserver();
    } finally {
      observer.observe(root, options);
    }
  };

  const scheduleAdapt = () => {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      adapt();
    });
  };

  const activateWitness = (id, focus = false) => {
    if (!witnessById(id)) return;
    activeWitnessId = id;
    adapt();
    if (focus) {
      requestAnimationFrame(() => {
        [...root.querySelectorAll('.ktv-witness-tab')]
          .find((button) => button.dataset.witnessId === id)
          ?.focus();
      });
    }
  };

  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-witness-id]');
    if (!tab || !root.contains(tab)) return;
    activateWitness(tab.dataset.witnessId || '');
  });

  root.addEventListener('keydown', (event) => {
    const tab = event.target.closest('.ktv-witness-tab');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = [...root.querySelectorAll('.ktv-witness-tab')];
    if (!tabs.length) return;
    const current = Math.max(0, tabs.indexOf(tab));
    let next = current;
    if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    event.preventDefault();
    activateWitness(tabs[next].dataset.witnessId || '', true);
  });

  observer = new MutationObserver(scheduleAdapt);
  observer.observe(root, options);
  scheduleAdapt();
})();
