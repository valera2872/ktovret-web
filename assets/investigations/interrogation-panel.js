(function () {
  'use strict';

  const interrogation = globalThis.MysteryLogicInterrogationCore;
  const core = globalThis.MysteryLogicInvestigationCore;
  const definition = globalThis.MysteryLogicInvestigationCase;
  const config = globalThis.MysteryLogicInterrogationConfig || {};
  if (!interrogation || !core || !definition || !document.querySelector('[data-ml-investigation]')) return;

  const storageKey = `mysterylogic:investigation:v1:${definition.id}`;
  const transcriptPrefix = `mysterylogic:interrogation:v1:${definition.id}:`;
  const maximumTurns = 12;

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function readState() {
    try {
      const raw = localStorage.getItem(storageKey);
      return core.normalizeState(definition, raw ? JSON.parse(raw) : null);
    } catch (error) {
      console.warn('Interrogation state could not be restored.', error);
      return core.createInitialState(definition);
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('Interrogation state could not be saved.', error);
    }
  }

  function readTranscript(characterId) {
    try {
      const value = JSON.parse(sessionStorage.getItem(`${transcriptPrefix}${characterId}`) || '[]');
      return Array.isArray(value) ? value.slice(-maximumTurns) : [];
    } catch {
      return [];
    }
  }

  function saveTranscript(characterId, turns) {
    try {
      sessionStorage.setItem(`${transcriptPrefix}${characterId}`, JSON.stringify(turns.slice(-maximumTurns)));
    } catch {
      // The interrogation still works if private browsing blocks session storage.
    }
  }

  function renderTranscript(panel, turns) {
    const target = panel.querySelector('[data-interrogation-transcript]');
    if (!target) return;
    target.innerHTML = turns.length
      ? turns.map((turn) => `
          <div class="mli-interrogation-turn ${turn.speaker === 'player' ? 'is-player' : 'is-character'}">
            <small>${turn.speaker === 'player' ? 'Вы' : 'Роман Карский'}${turn.unlocked ? ' · показания изменены' : ''}</small>
            <p>${escapeHtml(turn.text)}</p>
          </div>
        `).join('')
      : '<p class="mli-interrogation-empty">Протокол пока пуст. Вопросы можно задавать в любой формулировке.</p>';
    target.scrollTop = target.scrollHeight;
  }

  async function classifyQuestion(contract, question) {
    if (config.classifierMode !== 'remote' || !config.endpoint) {
      return interrogation.classifyLocal(contract, question);
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), Number(config.timeoutMs) || 4500);
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ caseId: definition.id, characterId: contract.characterId, question }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Interrogation classifier returned ${response.status}`);
      const payload = await response.json();
      if (!(contract.topics || []).some((topic) => topic.id === payload.topicId)) {
        throw new Error('Interrogation classifier returned an unknown topic');
      }
      return payload.topicId;
    } catch (error) {
      console.warn('Remote interrogation classification unavailable; using authored local fallback.', error);
      return interrogation.classifyLocal(contract, question);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function panelMarkup(contract) {
    return `
      <section class="mli-interrogation" data-interrogation-character="${escapeHtml(contract.characterId)}">
        <header class="mli-interrogation-head">
          <div><small>Экспериментальная механика</small><h4>${escapeHtml(contract.label)}</h4></div>
          <span>Без команд</span>
        </header>
        <p class="mli-interrogation-description">${escapeHtml(contract.description)}</p>
        <div class="mli-interrogation-transcript" data-interrogation-transcript aria-live="polite"></div>
        <div class="mli-interrogation-suggestions" aria-label="Примеры вопросов">
          ${(contract.suggestedQuestions || []).map((question) => `<button type="button" data-interrogation-suggestion="${escapeHtml(question)}">${escapeHtml(question)}</button>`).join('')}
        </div>
        <form class="mli-interrogation-form" data-interrogation-form>
          <label><span class="sr-only">Вопрос Роману Карскому</span><textarea rows="2" minlength="2" maxlength="500" required placeholder="Задайте вопрос своими словами…" data-interrogation-question></textarea></label>
          <button type="submit">Спросить</button>
        </form>
        <p class="mli-interrogation-boundary">Ответы ограничены материалами дела. Допрос не создаёт новых фактов.</p>
      </section>
    `;
  }

  function mountContract(contract) {
    const card = document.querySelector(`[data-character="${CSS.escape(contract.characterId)}"]`);
    if (!card || card.querySelector(`[data-interrogation-character="${CSS.escape(contract.characterId)}"]`)) return;
    card.insertAdjacentHTML('beforeend', panelMarkup(contract));
    const panel = card.querySelector(`[data-interrogation-character="${CSS.escape(contract.characterId)}"]`);
    const form = panel.querySelector('[data-interrogation-form]');
    const questionInput = panel.querySelector('[data-interrogation-question]');
    let turns = readTranscript(contract.characterId);
    renderTranscript(panel, turns);

    panel.querySelectorAll('[data-interrogation-suggestion]').forEach((button) => {
      button.addEventListener('click', () => {
        questionInput.value = button.dataset.interrogationSuggestion || '';
        form.requestSubmit();
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const question = questionInput.value.trim();
      if (question.length < 2 || form.dataset.busy === 'true') return;
      form.dataset.busy = 'true';
      form.querySelector('button').disabled = true;
      turns.push({ speaker: 'player', text: question });
      turns = turns.slice(-maximumTurns);
      saveTranscript(contract.characterId, turns);
      renderTranscript(panel, turns);
      questionInput.value = '';

      const topicId = await classifyQuestion(contract, question);
      const state = readState();
      const resolved = interrogation.resolveTurn(core, definition, state, contract, question, topicId);
      const outcome = interrogation.applyTurn(core, definition, state, contract, resolved);
      if (outcome.state !== state) saveState(outcome.state);
      turns.push({ speaker: 'character', text: outcome.turn.response, unlocked: Boolean(outcome.turn.unlocked) });
      turns = turns.slice(-maximumTurns);
      saveTranscript(contract.characterId, turns);
      renderTranscript(panel, turns);
      form.dataset.busy = 'false';
      form.querySelector('button').disabled = false;
      questionInput.focus();

      if (outcome.turn.unlocked) {
        window.dispatchEvent(new CustomEvent('mysterylogic:interrogation-state-changed', {
          detail: { characterId: contract.characterId, materialId: outcome.turn.materialId },
        }));
      }
    });
  }

  function mount() {
    Object.values(definition.interrogationContracts || {}).forEach(mountContract);
  }

  const observer = new MutationObserver(mount);
  observer.observe(document.querySelector('[data-ml-investigation]'), { childList: true, subtree: true });
  mount();
})();
