(() => {
  'use strict';

  const cfg = window.KtoVretWeb || {};
  const root = document.querySelector('[data-ktv-root]');
  if (!root || !cfg.case) return;

  const caseData = cfg.case;
  const answerStage = Array.isArray(caseData.answerStages) ? caseData.answerStages[0] : null;
  const storageKey = cfg.storageKey || `ktovret:web:v2:${caseData.id}`;
  const defaultState = {
    accepted: false,
    selectedOptionId: '',
    attempts: 0,
    hintsUsed: 0,
    solved: false,
    firstAnswerCorrect: false,
    importantSourceIds: [],
    note: '',
    startedAt: 0,
    solvedAt: 0,
  };

  const parseStoredState = (value) => {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  let state = { ...defaultState, ...parseStoredState(localStorage.getItem(storageKey)) };
  let feedback = '';

  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
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

  const correctOptionId = answerStage?.correctOptionIds?.[0] || '';
  const options = answerStage?.options || [];
  const hints = [
    caseData.explanation?.reasoningSteps?.[0] || 'Отделите общедоступные факты от скрытых данных.',
    caseData.explanation?.reasoningSteps?.[1] || 'Проверьте, какие детали выводятся из времени, движения и массы.',
    caseData.explanation?.reasoningSteps?.[2] || 'Сравните момент сообщения со временем фактического вскрытия.',
  ];

  const fallbackTimeline = [
    { time: '19:00', title: 'Исходная схема', detail: 'Контейнеры распределены по четырём секциям.', source: 'Общий экран' },
    { time: '19:05', title: 'Первый поворот', detail: 'Стеллаж сместился по часовой стрелке.', source: 'Журнал системы' },
    { time: '19:10', title: 'Второй поворот', detail: 'Стеллаж сместился ещё на одну секцию.', source: 'Журнал системы' },
    { time: '19:12', title: 'Открыта секция №4', detail: 'После открытия один контейнер исчез.', source: 'Общий экран' },
    { time: '19:15', title: 'Западный выход', detail: 'Датчик зафиксировал груз массой 4 кг.', source: 'Датчик' },
    { time: '19:18', title: 'Запись Романа', detail: 'Сотрудник изложил свою версию.', source: 'Служебная запись' },
    { time: '19:42', title: 'Первое вскрытие', detail: 'Внутри синего контейнера обнаружен К-17.', source: 'Протокол вскрытия' },
  ];

  const timeline = Array.isArray(caseData.timeline) && caseData.timeline.length
    ? caseData.timeline
    : fallbackTimeline;

  const fallbackFacts = [
    { label: 'Схема', value: '1 — красный, 2 — синий, 3 — белый, 4 — чёрный' },
    { label: 'Массы', value: 'Красный — 3 кг, синий — 4 кг, белый — 5 кг, чёрный — 6 кг' },
    { label: 'Ограничение', value: 'Содержимое контейнеров на общем экране не показывалось' },
  ];

  const facts = Array.isArray(caseData.facts) && caseData.facts.length
    ? caseData.facts
    : fallbackFacts;

  const progressPercent = () => {
    if (state.solved) return 100;
    if (state.selectedOptionId) return 82;
    if (state.hintsUsed || state.note.trim()) return 66;
    if (state.accepted) return 42;
    return 12;
  };

  const elapsedMinutes = () => {
    if (!state.startedAt) return 0;
    const end = state.solvedAt || Date.now();
    return Math.max(1, Math.round((end - state.startedAt) / 60000));
  };

  const caseRank = () => {
    if (state.firstAnswerCorrect && state.hintsUsed === 0) return 'Следователь I класса';
    if (state.hintsUsed <= 1 && state.attempts <= 2) return 'Старший аналитик';
    return 'Дело раскрыто';
  };

  const renderTopbar = () => `
    <header class="ktv-topbar">
      <button class="ktv-brand" type="button" data-action="scroll-top" aria-label="К началу дела">
        <span class="ktv-mark" aria-hidden="true">КВ</span>
        <span class="ktv-brand-copy">
          <span class="ktv-kicker">Интерактивное расследование</span>
          <strong>Кто врёт?</strong>
        </span>
      </button>
      <span class="ktv-case-status ${state.solved ? 'is-solved' : ''}">
        <span class="ktv-status-dot"></span>
        ${state.solved ? 'Дело закрыто' : state.accepted ? 'Дело в работе' : 'Новое дело'}
      </span>
    </header>
    <div class="ktv-progress" aria-label="Прогресс расследования">
      <span style="--ktv-progress:${progressPercent()}%"></span>
    </div>
  `;

  const renderCover = () => `
    <section class="ktv-cover" aria-labelledby="ktv-cover-title">
      <div class="ktv-cover-grid">
        <div class="ktv-cover-copy">
          <div class="ktv-file-line">
            <span>Досье ${escapeHtml(caseData.caseNumber || '№ 066')}</span>
            <span>Допуск: открытый</span>
          </div>
          <p class="ktv-eyebrow">Вам поручено расследование</p>
          <h1 id="ktv-cover-title">${escapeHtml(caseData.title)}</h1>
          <p class="ktv-cover-lead">Факты в показании могут быть верны. Но один из них выдаёт невозможный источник знания.</p>
          <div class="ktv-cover-actions">
            <button class="ktv-primary ktv-primary-large" type="button" data-action="accept">Принять дело</button>
            <span>Без регистрации · ${escapeHtml(String(caseData.estimatedMinutes || 7))} минут</span>
          </div>
        </div>
        <div class="ktv-cover-seal" aria-hidden="true">
          <strong>КВ</strong>
          <small>Бюро логических расследований</small>
        </div>
      </div>
      <div class="ktv-cover-stats">
        <div><strong>${escapeHtml(String(caseData.witnessCount || 1))}</strong><span>свидетель</span></div>
        <div><strong>${escapeHtml(String(timeline.length))}</strong><span>событий</span></div>
        <div><strong>1</strong><span>точное противоречие</span></div>
      </div>
    </section>
  `;

  const renderStageNav = () => `
    <nav class="ktv-stage-nav" aria-label="Этапы расследования">
      <button type="button" data-action="jump" data-target="#ktv-briefing"><span>01</span> Досье</button>
      <button type="button" data-action="jump" data-target="#ktv-testimony"><span>02</span> Показание</button>
      <button type="button" data-action="jump" data-target="#ktv-answer"><span>03</span> Версия</button>
      <button type="button" data-action="jump" data-target="#ktv-result" ${state.solved ? '' : 'disabled'}><span>04</span> Разбор</button>
    </nav>
  `;

  const renderHero = () => `
    <section class="ktv-hero">
      <div class="ktv-hero-copy">
        <div class="ktv-meta">
          <span class="ktv-chip">${escapeHtml(caseData.difficulty || '')}</span>
          <span class="ktv-chip">${escapeHtml(caseData.category || '')}</span>
          <span class="ktv-chip">${escapeHtml(caseData.logicType || '')}</span>
        </div>
        <p class="ktv-eyebrow">${escapeHtml(caseData.caseNumber || 'Дело № 066')}</p>
        <h1>${escapeHtml(caseData.title)}</h1>
        <p>Не ищите, какой факт звучит подозрительно. Установите, какой факт нельзя было узнать названным способом.</p>
      </div>
      <div class="ktv-hero-stamp ${state.solved ? 'is-solved' : ''}" aria-hidden="true">
        <span>${state.solved ? 'Закрыто' : 'В работе'}</span>
        <small>${state.solved ? 'Логика подтверждена' : 'Материалы выданы'}</small>
      </div>
    </section>
  `;

  const renderTimeline = () => timeline.map((item, index) => `
    <article class="ktv-timeline-item">
      <div class="ktv-timeline-marker"><span>${escapeHtml(item.time || '')}</span></div>
      <div class="ktv-timeline-card">
        <div class="ktv-timeline-head">
          <strong>${escapeHtml(item.title || '')}</strong>
          <span>${escapeHtml(item.source || '')}</span>
        </div>
        <p>${escapeHtml(item.detail || '')}</p>
        <small>Событие ${String(index + 1).padStart(2, '0')}</small>
      </div>
    </article>
  `).join('');

  const renderFacts = () => facts.map((fact) => `
    <div class="ktv-fact-card">
      <span>${escapeHtml(fact.label || '')}</span>
      <p>${escapeHtml(fact.value || '')}</p>
    </div>
  `).join('');

  const renderBriefing = () => `
    <section class="ktv-panel ktv-paper" id="ktv-briefing" tabindex="-1">
      <div class="ktv-section-head">
        <div>
          <p class="ktv-eyebrow">01 · Досье</p>
          <h2>Хронология происшествия</h2>
        </div>
        <span class="ktv-source-badge">Проверенные материалы</span>
      </div>
      <div class="ktv-timeline">${renderTimeline()}</div>
      <div class="ktv-facts">${renderFacts()}</div>
      <details class="ktv-raw-briefing">
        <summary>Открыть исходную сводку целиком</summary>
        <div class="ktv-case-text">${escapeHtml(caseData.intro || '')}</div>
      </details>
    </section>
  `;

  const renderTestimony = () => {
    const testimony = (caseData.characters || []).find((item) => !String(item.id).startsWith('__'));
    if (!testimony) return '';
    const important = state.importantSourceIds.includes(testimony.id);

    return `
      <section class="ktv-panel ktv-testimony" id="ktv-testimony" tabindex="-1">
        <div class="ktv-section-head">
          <div>
            <p class="ktv-eyebrow">02 · Показание</p>
            <h2>Служебная запись сотрудника</h2>
          </div>
          <span class="ktv-recording"><i></i> 19:18 · запись</span>
        </div>
        <article class="ktv-transcript ${important ? 'is-important' : ''}">
          <div class="ktv-person">
            <span class="ktv-avatar">${escapeHtml(initials(testimony.name))}</span>
            <span>
              <strong>${escapeHtml(testimony.name)}</strong>
              <small>${escapeHtml(testimony.role || '')}</small>
            </span>
          </div>
          <div class="ktv-wave" aria-hidden="true">
            ${Array.from({ length: 34 }, (_, index) => `<i style="--h:${18 + ((index * 13) % 48)}%"></i>`).join('')}
          </div>
          <blockquote>«${escapeHtml(testimony.statement || '')}»</blockquote>
          <button class="ktv-small-button" type="button" data-action="important" data-source-id="${escapeHtml(testimony.id)}">
            ${important ? 'Убрать с доски улик' : 'Закрепить на доске улик'}
          </button>
        </article>
      </section>
    `;
  };

  const renderNotebook = () => `
    <aside class="ktv-panel ktv-notebook">
      <div class="ktv-notebook-title">
        <span aria-hidden="true">✎</span>
        <div>
          <p class="ktv-eyebrow">Рабочий инструмент</p>
          <h2>Блокнот аналитика</h2>
        </div>
      </div>
      <p>Зафиксируйте цепочку: что можно вывести, а что требует физического доступа.</p>
      <textarea data-action="note" placeholder="Например: после двух поворотов в секции №4...">${escapeHtml(state.note)}</textarea>
      <small>Сохраняется только в этом браузере</small>
    </aside>
  `;

  const renderOptionButtons = () => options.map((option, index) => {
    const selected = state.selectedOptionId === option.id;
    return `
      <button class="ktv-option ${selected ? 'is-selected' : ''}" type="button" data-action="select" data-option-id="${escapeHtml(option.id)}" aria-pressed="${selected}">
        <span class="ktv-option-index">${String(index + 1).padStart(2, '0')}</span>
        <span class="ktv-option-copy">
          <small>Фрагмент записи</small>
          <strong>${escapeHtml(option.label)}</strong>
        </span>
        <span class="ktv-pin" aria-hidden="true">${selected ? '●' : '○'}</span>
      </button>
    `;
  }).join('');

  const renderHintList = () => hints.slice(0, state.hintsUsed).map((hint, index) => `
    <div class="ktv-hint">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <p><strong>Подсказка ${index + 1}</strong>${escapeHtml(hint)}</p>
    </div>
  `).join('');

  const renderAnswer = () => `
    <section class="ktv-panel ktv-answer ${state.solved ? 'ktv-hidden' : ''}" id="ktv-answer" tabindex="-1">
      <div class="ktv-section-head">
        <div>
          <p class="ktv-eyebrow">03 · Ваша версия</p>
          <h2>${escapeHtml(caseData.question || '')}</h2>
        </div>
        <span class="ktv-source-badge">Ответ однозначен</span>
      </div>
      <p class="ktv-section-copy">${escapeHtml(answerStage?.instruction || answerStage?.prompt || '')}</p>
      <div class="ktv-options">${renderOptionButtons()}</div>
      ${feedback ? `<div class="ktv-feedback" role="status"><strong>Версия не сошлась</strong><p>${escapeHtml(feedback)}</p></div>` : ''}
      <div class="ktv-hints">${renderHintList()}</div>
      <div class="ktv-answer-actions">
        <button class="ktv-primary" type="button" data-action="submit" ${state.selectedOptionId ? '' : 'disabled'}>Передать заключение</button>
        <button class="ktv-secondary" type="button" data-action="hint" ${state.hintsUsed >= hints.length ? 'disabled' : ''}>
          ${state.hintsUsed ? `Открыть подсказку ${state.hintsUsed + 1}` : 'Запросить подсказку'}
        </button>
      </div>
    </section>
  `;

  const renderResult = () => {
    const evidence = caseData.explanation?.evidenceFragments || [];
    const steps = caseData.explanation?.reasoningSteps || [];
    const clean = state.firstAnswerCorrect && state.hintsUsed === 0;

    return `
      <section class="ktv-result" id="ktv-result" tabindex="-1">
        <div class="ktv-result-aura" aria-hidden="true"></div>
        <div class="ktv-result-seal" aria-hidden="true"><span>✓</span></div>
        <p class="ktv-eyebrow">04 · Заключение принято</p>
        <span class="ktv-result-badge">${escapeHtml(caseRank())}</span>
        <h2>${clean ? 'Чистое раскрытие' : 'Источник знания разоблачён'}</h2>
        <p class="ktv-result-lead">${escapeHtml(caseData.explanation?.shortReason || '')}</p>
        <div class="ktv-result-stats">
          <div><strong>${state.attempts}</strong><span>${state.attempts === 1 ? 'попытка' : 'попытки'}</span></div>
          <div><strong>${state.hintsUsed}</strong><span>подсказок</span></div>
          <div><strong>${elapsedMinutes()}</strong><span>минут</span></div>
        </div>
        <div class="ktv-confrontation">
          <div>
            <span>19:18</span>
            <blockquote>«${escapeHtml(evidence[0]?.quote || 'Внутри был пакет К-17')}»</blockquote>
          </div>
          <i aria-hidden="true">≠</i>
          <div>
            <span>19:42</span>
            <blockquote>«${escapeHtml(evidence[1]?.quote || 'впервые вскрыли в 19:42')}»</blockquote>
          </div>
        </div>
        <p class="ktv-result-reason">${escapeHtml(caseData.explanation?.fullReason || '')}</p>
        <ol class="ktv-steps">
          ${steps.map((step) => `<li><span></span><p>${escapeHtml(step)}</p></li>`).join('')}
        </ol>
        <div class="ktv-result-actions">
          <button class="ktv-primary" type="button" data-action="share">Бросить вызов другу</button>
          <button class="ktv-secondary" type="button" data-action="reset">Пройти заново</button>
        </div>
      </section>
    `;
  };

  const renderInvestigation = () => `
    ${renderStageNav()}
    ${renderHero()}
    ${renderBriefing()}
    <div class="ktv-workspace">
      ${renderTestimony()}
      ${renderNotebook()}
    </div>
    ${renderAnswer()}
    ${state.solved ? renderResult() : ''}
    <p class="ktv-footer-note">Решение проверено: ответ однозначно следует из материалов дела.</p>
  `;

  const render = () => {
    root.innerHTML = `
      <div class="ktv-app">
        ${renderTopbar()}
        ${state.accepted ? renderInvestigation() : renderCover()}
      </div>
    `;
  };

  const goTo = (selector) => requestAnimationFrame(() => {
    const element = root.querySelector(selector);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    element?.focus?.({ preventScroll: true });
  });

  const share = async () => {
    const clean = state.firstAnswerCorrect && state.hintsUsed === 0;
    const text = `${clean ? 'Чистое раскрытие' : 'Дело раскрыто'}: «${caseData.title}». Сможете найти невозможную деталь без подсказки?`;
    const url = cfg.permalink || location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Кто врёт?', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Вызов и ссылка скопированы.');
    } catch (error) {
      if (error?.name !== 'AbortError') prompt('Скопируйте вызов:', `${text}\n${url}`);
    }
  };

  root.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const action = button.dataset.action;

    if (action === 'accept') {
      state.accepted = true;
      state.startedAt = state.startedAt || Date.now();
      save();
      render();
      goTo('.ktv-hero');
      return;
    }

    if (action === 'scroll-top') {
      scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (action === 'jump') {
      const target = button.dataset.target;
      if (target) goTo(target);
      return;
    }

    if (action === 'select') {
      state.selectedOptionId = button.dataset.optionId || '';
      feedback = '';
      save();
      render();
      goTo('#ktv-answer');
      return;
    }

    if (action === 'important') {
      const id = button.dataset.sourceId || '';
      state.importantSourceIds = state.importantSourceIds.includes(id)
        ? state.importantSourceIds.filter((item) => item !== id)
        : [...state.importantSourceIds, id];
      save();
      render();
      goTo('#ktv-testimony');
      return;
    }

    if (action === 'hint' && state.hintsUsed < hints.length) {
      state.hintsUsed += 1;
      save();
      render();
      goTo('#ktv-answer');
      return;
    }

    if (action === 'submit' && state.selectedOptionId) {
      const isCorrect = state.selectedOptionId === correctOptionId;
      state.attempts += 1;

      if (isCorrect) {
        state.solved = true;
        state.solvedAt = Date.now();
        state.firstAnswerCorrect = state.attempts === 1;
        feedback = '';
        save();
        render();
        goTo('#ktv-result');
      } else {
        feedback = state.attempts >= 2
          ? 'Проверьте, какая часть записи описывает содержимое, скрытое до физического вскрытия.'
          : 'Часть цепочки восстанавливается по движению стеллажа, времени и массе. Ищите сведения другого типа.';
        save();
        render();
        goTo('#ktv-answer');
      }
      return;
    }

    if (action === 'share') {
      await share();
      return;
    }

    if (action === 'reset') {
      state = { ...defaultState };
      feedback = '';
      save();
      render();
      scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target.matches('[data-action="note"]')) {
      state.note = event.target.value;
      save();
    }
  });

  render();
})();
