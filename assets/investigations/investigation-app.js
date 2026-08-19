(function () {
  'use strict';

  const core = globalThis.MysteryLogicInvestigationCore;
  const definition = globalThis.MysteryLogicInvestigationCase;
  const root = document.querySelector('[data-ml-investigation]');
  if (!core || !definition || !root) {
    return;
  }

  const storageKey = `mysterylogic:investigation:v1:${definition.id}`;
  let state = loadState();
  let activeView = 'overview';
  let lastOpenedMaterialId = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(storageKey);
      return core.normalizeState(definition, raw ? JSON.parse(raw) : null);
    } catch (error) {
      console.warn('Mystery Logic investigation progress could not be restored.', error);
      return core.createInitialState(definition);
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatText(value) {
    return escapeHtml(value).replaceAll('\n', '<br>');
  }

  function materialIcon(type) {
    const icons = {
      'Сообщение': '✉',
      'Осмотр места': '⌂',
      'Показания': '◎',
      'Системный журнал': '⌘',
      'Чек + сообщение': '▤',
      'Изображение': '◫',
      'Справка': 'i',
      'Контроль доступа': '⇥',
      'Административный реестр': '▦',
      'Сетевой журнал': '⌁',
      'Повторный опрос': '◉',
      'Сетевой аудит': '⌘',
      'Endpoint-аудит': '⌘',
      'Системный файл': '≡',
      'USB-аудит': '⌁',
      'Реестр устройств': '▦',
      'Реестр оборудования': '▦',
      'Реестр сборок': '▦',
      'Внешняя переписка': '✉',
      'Сверка контрольных сумм': '≋',
      'Документ': '▤',
    };
    return icons[type] || '•';
  }

  function availableMaterialMap() {
    return new Map(core.availableMaterials(definition, state).map((item) => [item.id, item]));
  }

  function viewedMaterials() {
    const viewed = new Set(state.viewedMaterials || []);
    return definition.materials.filter((material) => viewed.has(material.id));
  }

  function render() {
    const progress = core.progress(definition, state);
    root.innerHTML = `
      <section class="mli-case-head">
        <div>
          <p class="mli-kicker">Mystery Logic · расширенное расследование</p>
          <h1>${escapeHtml(definition.title)}</h1>
          <p class="mli-subtitle">${escapeHtml(definition.subtitle)}</p>
        </div>
        <div class="mli-head-meta" aria-label="Параметры дела">
          <span>${escapeHtml(definition.estimatedMinutes)}</span>
          <span>${escapeHtml(definition.difficulty)}</span>
        </div>
      </section>

      <section class="mli-progress-strip" aria-label="Прогресс расследования">
        <div><strong>${progress.viewedMaterials}</strong><span>изучено материалов</span></div>
        <div><strong>${progress.performedActions}</strong><span>проверок проведено</span></div>
        <div><strong>${state.hypothesisHistory.length}</strong><span>смен рабочей версии</span></div>
      </section>

      <div class="mli-workspace">
        <nav class="mli-rail" aria-label="Разделы расследования">
          ${navButton('overview', 'Досье', '⌂')}
          ${navButton('materials', 'Материалы', '▤')}
          ${navButton('people', 'Люди', '◎')}
          ${navButton('theory', 'Версия', '⌘')}
        </nav>
        <main class="mli-main">
          ${renderActiveView()}
        </main>
        ${renderDeskAside()}
      </div>
    `;
    bindEvents();
    if (lastOpenedMaterialId) {
      openMaterialDialog(lastOpenedMaterialId, false);
      lastOpenedMaterialId = null;
    }
  }

  function navButton(view, label, icon) {
    const active = activeView === view;
    return `<button class="mli-rail-button${active ? ' is-active' : ''}" type="button" data-view="${view}" aria-current="${active ? 'page' : 'false'}"><span>${icon}</span><b>${label}</b></button>`;
  }

  function renderActiveView() {
    switch (activeView) {
      case 'materials':
        return renderMaterials();
      case 'people':
        return renderPeople();
      case 'theory':
        return renderTheory();
      default:
        return renderOverview();
    }
  }

  function renderOverview() {
    const actions = core.availableActions(definition, state);
    const generalActions = actions.filter((action) => !action.characterId);
    const materials = core.availableMaterials(definition, state);
    const unread = materials.filter((material) => !state.viewedMaterials.includes(material.id));
    return `
      <section class="mli-section">
        <div class="mli-paper mli-brief">
          <span class="mli-paper-label">Вводная</span>
          <p>${escapeHtml(definition.brief)}</p>
        </div>
      </section>
      <section class="mli-section">
        <div class="mli-section-heading">
          <div><p class="mli-eyebrow">Сейчас доступно</p><h2>Что можно сделать</h2></div>
          <p>Интерфейс не указывает правильный маршрут. Новые проверки появляются только после фактов, которые дают для них основание.</p>
        </div>
        <div class="mli-action-grid">
          ${generalActions.length ? generalActions.slice(0, 6).map(renderActionCard).join('') : renderEmpty('Откройте новые материалы или вернитесь к участникам дела.')}
        </div>
      </section>
      <section class="mli-section">
        <div class="mli-section-heading compact">
          <div><p class="mli-eyebrow">Новые поступления</p><h2>Неизученные материалы</h2></div>
          <button class="mli-text-button" type="button" data-view="materials">Открыть всё дело →</button>
        </div>
        <div class="mli-material-grid">
          ${unread.length ? unread.slice(0, 6).map(renderMaterialCard).join('') : renderEmpty('Все доступные материалы уже просмотрены. Следующие появятся после обоснованных проверок.')}
        </div>
      </section>
    `;
  }

  function renderMaterials() {
    const materials = core.availableMaterials(definition, state);
    const unread = materials.filter((material) => !state.viewedMaterials.includes(material.id));
    const viewed = materials.filter((material) => state.viewedMaterials.includes(material.id));
    const actions = core.availableActions(definition, state).filter((action) => !action.characterId);
    return `
      <section class="mli-section mli-section-first">
        <div class="mli-section-heading">
          <div><p class="mli-eyebrow">Доказательства</p><h2>Материалы дела</h2></div>
          <p>Открытие документа означает, что вы действительно ознакомились с его содержанием. Только просмотренные материалы можно приложить к итоговой версии.</p>
        </div>
        <div class="mli-material-groups">
          <section class="mli-material-group" data-material-group="new">
            <div class="mli-material-subheading"><h3>Новые материалы</h3><span>${unread.length}</span></div>
            <div class="mli-material-grid">${unread.length ? unread.map(renderMaterialCard).join('') : renderEmpty('Новых материалов нет. Продолжайте обоснованные проверки или вернитесь к участникам дела.')}</div>
          </section>
          ${viewed.length ? `
            <details class="mli-viewed-materials" data-material-group="viewed">
              <summary>Изученные материалы <b>${viewed.length}</b></summary>
              <div class="mli-material-grid">${viewed.map(renderMaterialCard).join('')}</div>
            </details>
          ` : ''}
        </div>
      </section>
      <section class="mli-section">
        <div class="mli-section-heading">
          <div><p class="mli-eyebrow">Операции</p><h2>Следственные действия</h2></div>
          <p>Это проверки, для которых у вас уже появилось фактическое основание. Они не отсортированы по «правильности».</p>
        </div>
        <div class="mli-action-grid">${actions.length ? actions.map(renderActionCard).join('') : renderEmpty('Новых общих проверок пока нет. Посмотрите раздел «Люди» — там могут быть доступны уточняющие вопросы.')}</div>
      </section>
    `;
  }

  function renderMaterialCard(material) {
    const viewed = state.viewedMaterials.includes(material.id);
    return `
      <button class="mli-material-card${viewed ? ' is-viewed' : ''}" type="button" data-material="${escapeHtml(material.id)}">
        <span class="mli-material-icon">${materialIcon(material.type)}</span>
        <span class="mli-material-copy">
          <small>${escapeHtml(material.type)}${viewed ? ' · изучено' : ' · новое'}</small>
          <strong>${escapeHtml(material.title)}</strong>
        </span>
        <span class="mli-material-arrow">→</span>
      </button>
    `;
  }

  function renderActionCard(action) {
    return `
      <button class="mli-action-card" type="button" data-action="${escapeHtml(action.id)}">
        <span class="mli-action-mark">+</span>
        <span><strong>${escapeHtml(action.label)}</strong><small>${escapeHtml(action.description || '')}</small></span>
      </button>
    `;
  }

  function renderPeople() {
    const facts = new Set(state.facts || []);
    return `
      <section class="mli-section mli-section-first">
        <div class="mli-section-heading">
          <div><p class="mli-eyebrow">Показания</p><h2>Участники дела</h2></div>
          <p>Показания меняются только тогда, когда вы предъявляете фактическое противоречие. Сильное обвинительное слово само по себе ничего не открывает.</p>
        </div>
        <div class="mli-people-list">
          ${definition.characters.map((character) => {
            const actions = core.availableActions(definition, state).filter((action) => action.characterId === character.id);
            return `
              <article class="mli-person-card">
                <header>
                  <span class="mli-avatar">${characterPortrait(character, 'data-character-portrait')}</span>
                  <div><h3>${escapeHtml(character.name)}</h3><p>${escapeHtml(character.role)}</p></div>
                </header>
                <div class="mli-statement"><small>Текущая версия показаний</small><p>${escapeHtml(core.statementFor(character, facts))}</p></div>
                <div class="mli-person-actions">
                  ${actions.length ? actions.map((action) => `<button type="button" data-action="${escapeHtml(action.id)}"><strong>${escapeHtml(action.label)}</strong><span>${escapeHtml(action.description || '')}</span></button>`).join('') : '<p class="mli-muted-note">Новых обоснованных вопросов пока нет.</p>'}
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  function renderTheory() {
    const viewed = viewedMaterials();
    const tier = state.resultTier;
    return `
      <section class="mli-section mli-section-first">
        <div class="mli-section-heading">
          <div><p class="mli-eyebrow">Рабочая гипотеза</p><h2>Соберите версию</h2></div>
          <p>Здесь мало просто назвать подозреваемого. К каждому причинному звену приложите материалы, которыми вы готовы его доказать.</p>
        </div>

        <div class="mli-suspect-picker" role="group" aria-label="Кто исполнитель">
          ${definition.suspects.map((suspect) => {
            const character = definition.characters.find((item) => item.id === suspect.id) || suspect;
            return `<button type="button" class="${state.selectedSuspectId === suspect.id ? 'is-selected' : ''}" data-suspect="${escapeHtml(suspect.id)}"><span>${characterPortrait(character, 'data-suspect-portrait')}</span><strong>${escapeHtml(suspect.label)}</strong></button>`;
          }).join('')}
        </div>
      </section>

      <section class="mli-section">
        <div class="mli-proof-intro">
          <div><strong>Критические звенья</strong><span>Все четыре нужны для устойчивого обвинения.</span></div>
          <button class="mli-secondary-button" type="button" data-audit-version>Проверить прочность версии</button>
        </div>
        <div class="mli-proof-list">
          ${definition.proofFamilies.filter((proof) => proof.requiredForStrongCase).map((proof, index) => renderProofCard(proof, viewed, index + 1)).join('')}
        </div>
      </section>

      <section class="mli-section">
        <div class="mli-section-heading compact">
          <div><p class="mli-eyebrow">Необязательно для обвинения</p><h2>Полная реконструкция</h2></div>
          <p>Эти звенья объясняют, почему лгали остальные и что стало с Павлом и сборкой.</p>
        </div>
        <div class="mli-proof-list secondary">
          ${definition.proofFamilies.filter((proof) => !proof.requiredForStrongCase).map((proof, index) => renderProofCard(proof, viewed, index + 1)).join('')}
        </div>
      </section>

      <section class="mli-section mli-final-actions">
        <button class="mli-primary-button" type="button" data-finalize ${state.selectedSuspectId ? '' : 'disabled'}>Предъявить итоговую версию</button>
        <button class="mli-text-button" type="button" data-reset>Начать дело заново</button>
      </section>

      ${tier ? renderResult(tier) : ''}
    `;
  }

  function renderProofCard(proof, viewed, ordinal) {
    const selected = new Set(state.proofSelections?.[proof.id] || []);
    return `
      <article class="mli-proof-card">
        <header><span>${String(ordinal).padStart(2, '0')}</span><div><h3>${escapeHtml(proof.label)}</h3><p>${escapeHtml(proof.description)}</p></div></header>
        <details>
          <summary>Приложить доказательства <b data-proof-count>${selected.size ? `· выбрано ${selected.size}` : ''}</b></summary>
          <div class="mli-evidence-picker">
            ${viewed.length ? viewed.map((material) => `
              <label class="${selected.has(material.id) ? 'is-selected' : ''}">
                <input type="checkbox" data-proof="${escapeHtml(proof.id)}" data-evidence="${escapeHtml(material.id)}" ${selected.has(material.id) ? 'checked' : ''}>
                <span><small>${escapeHtml(material.type)}</small><strong>${escapeHtml(material.title)}</strong></span>
              </label>
            `).join('') : '<p class="mli-muted-note">Сначала изучите материалы дела.</p>'}
          </div>
        </details>
      </article>
    `;
  }

  function renderResult(tier) {
    const result = definition.resultTiers[tier];
    const missingCore = core.missingProofs(definition, state, 'strong');
    const missingComplete = core.missingProofs(definition, state, 'complete').filter((proof) => !proof.requiredForStrongCase);
    return `
      <section class="mli-result mli-result-${tier.toLowerCase()}">
        <span class="mli-result-grade">${escapeHtml(tier)}</span>
        <div>
          <p class="mli-eyebrow">Результат предъявления</p>
          <h2>${escapeHtml(result.title)}</h2>
          <p>${escapeHtml(result.text)}</p>
          ${tier === 'B' && missingCore.length ? `<div class="mli-result-note"><strong>Неподтверждённое звено:</strong> ${escapeHtml(missingCore[0].label)}</div>` : ''}
          ${tier === 'A' && missingComplete.length ? `<div class="mli-result-note"><strong>Для полной реконструкции осталось:</strong> ${missingComplete.map((proof) => escapeHtml(proof.label)).join('; ')}</div>` : ''}
          ${tier === 'S' ? `<details class="mli-truth"><summary>Что произошло на самом деле</summary><p>${escapeHtml(definition.resultNarrative)}</p></details>` : ''}
        </div>
      </section>
    `;
  }

  function renderDeskAside() {
    const selected = definition.suspects.find((suspect) => suspect.id === state.selectedSuspectId);
    const available = core.availableActions(definition, state);
    const facts = new Set(state.facts || []);
    const caughtLies = definition.characters.filter((character) =>
      (character.statementStates || []).some((candidate) =>
        (candidate.requiresAllFacts || []).every((fact) => facts.has(fact)),
      ),
    ).length;
    return `
      <aside class="mli-desk-aside">
        <div class="mli-aside-card">
          <small>Рабочая версия</small>
          <strong>${selected ? escapeHtml(selected.label) : 'Не выбрана'}</strong>
          <button type="button" data-view="theory">Открыть версию →</button>
        </div>
        <div class="mli-aside-card">
          <small>Сейчас</small>
          <strong>${available.length}</strong>
          <span>доступных проверок и вопросов</span>
        </div>
        <div class="mli-aside-card">
          <small>Изменили показания</small>
          <strong>${caughtLies}</strong>
          <span>участника дела</span>
        </div>
      </aside>
    `;
  }

  function renderEmpty(text) {
    return `<div class="mli-empty">${escapeHtml(text)}</div>`;
  }

  function initials(name) {
    return String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || '')
      .join('')
      .toUpperCase();
  }

  function characterPortrait(character, dataAttribute) {
    if (!character?.portrait) {
      return initials(character?.name || character?.label || '');
    }
    return `<img src="${escapeHtml(character.portrait)}" alt="" width="160" height="200" loading="lazy" decoding="async" ${dataAttribute}="${escapeHtml(character.id)}">`;
  }

  function bindEvents() {
    root.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', () => {
        activeView = button.dataset.view;
        render();
        window.scrollTo({ top: root.offsetTop - 16, behavior: 'smooth' });
      });
    });

    root.querySelectorAll('[data-material]').forEach((button) => {
      button.addEventListener('click', () => openMaterialDialog(button.dataset.material, true));
    });

    root.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', () => performAction(button.dataset.action));
    });

    root.querySelectorAll('[data-suspect]').forEach((button) => {
      button.addEventListener('click', () => {
        state = core.selectSuspect(state, button.dataset.suspect);
        saveState();
        render();
      });
    });

    root.querySelectorAll('[data-proof][data-evidence]').forEach((input) => {
      input.addEventListener('change', () => {
        const hadResult = Boolean(state.resultTier);
        state = core.toggleEvidence(definition, state, input.dataset.proof, input.dataset.evidence);
        saveState();
        if (hadResult) {
          render();
          return;
        }
        const selected = state.proofSelections?.[input.dataset.proof] || [];
        input.checked = selected.includes(input.dataset.evidence);
        input.closest('label')?.classList.toggle('is-selected', input.checked);
        const counter = input.closest('.mli-proof-card')?.querySelector('[data-proof-count]');
        if (counter) {
          counter.textContent = selected.length ? `· выбрано ${selected.length}` : '';
        }
      });
    });

    root.querySelector('[data-audit-version]')?.addEventListener('click', auditVersion);
    root.querySelector('[data-finalize]')?.addEventListener('click', finalizeVersion);
    root.querySelector('[data-reset]')?.addEventListener('click', resetCase);
  }

  function openMaterialDialog(materialId, markViewed) {
    const material = availableMaterialMap().get(materialId);
    if (!material) {
      return;
    }
    if (markViewed) {
      state = core.openMaterial(definition, state, materialId);
      saveState();
    }
    const dialog = document.querySelector('[data-mli-dialog]');
    if (!dialog) {
      return;
    }
    dialog.innerHTML = `
      <article class="mli-dialog-card">
        <button class="mli-dialog-close" type="button" data-close-dialog aria-label="Закрыть">×</button>
        <p class="mli-eyebrow">${escapeHtml(material.type)}</p>
        <h2>${escapeHtml(material.title)}</h2>
        <div class="mli-document-body">${formatText(material.body)}</div>
      </article>
    `;
    dialog.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    if (markViewed) {
      dialog.addEventListener('close', () => render(), { once: true });
    }
  }

  function performAction(actionId) {
    const outcome = core.performAction(definition, state, actionId);
    if (!outcome.action) {
      return;
    }
    state = outcome.state;
    saveState();
    const revealed = (outcome.action.revealsMaterials || []).map((id) => core.materialById(definition, id)).filter(Boolean);
    render();
    if (revealed.length) {
      openMaterialDialog(revealed[0].id, true);
      return;
    }
    showNotice('Проверка завершена. Новые факты добавлены в дело.');
  }

  function auditVersion() {
    if (!state.selectedSuspectId) {
      showNotice('Сначала выберите рабочую гипотезу: кого вы считаете исполнителем.');
      return;
    }
    const culprit = definition.suspects.find((suspect) => suspect.isCanonicalCulprit);
    if (state.selectedSuspectId !== culprit?.id) {
      showNotice('Текущая гипотеза пока не объясняет совокупность установленных следов. Проверьте физическую возможность, цифровую цепочку и предшествующий умысел.');
      return;
    }
    const missing = core.missingProofs(definition, state, 'strong');
    showNotice(
      missing.length
        ? `Версия уязвима: не подтверждено звено «${missing[0].label}».`
        : 'Все критические звенья версии подтверждены выбранными вами материалами. Можно предъявлять обвинение или продолжить полную реконструкцию.',
    );
  }

  function finalizeVersion() {
    state = core.finalize(definition, state);
    saveState();
    render();
    document.querySelector('.mli-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function resetCase() {
    if (!confirm('Удалить локальный прогресс «Последней сборки» и начать расследование заново?')) {
      return;
    }
    localStorage.removeItem(storageKey);
    state = core.createInitialState(definition);
    activeView = 'overview';
    render();
  }

  function showNotice(text) {
    const notice = document.querySelector('[data-mli-notice]');
    if (!notice) {
      return;
    }
    notice.textContent = text;
    notice.classList.add('is-visible');
    clearTimeout(showNotice.timer);
    showNotice.timer = setTimeout(() => notice.classList.remove('is-visible'), 4200);
  }

  render();
})();
