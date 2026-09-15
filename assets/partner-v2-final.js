(() => {
  'use strict';

  const root = document.querySelector('[data-partner-v2-app]');
  if (!root) return;
  const ENDPOINT = root.dataset.partnerEndpoint || '';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
  let busy = false;
  let refreshTimer = null;
  let lastResult = null;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const browserKey = () => localStorage.getItem(CLIENT_KEY_STORAGE) || '';
  const roomCode = () => {
    const value = String(new URL(location.href).searchParams.get('room') || '').trim().toUpperCase();
    return CODE_RE.test(value) ? value : '';
  };
  const api = async (body) => {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ ...body, browserKey: browserKey() }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.error || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return payload;
  };

  const optionLabel = (state, fieldId, value) => {
    const field = state.case?.finalUi?.fields?.find((item) => item.id === fieldId);
    return field?.options?.find((item) => item.id === value)?.label || value || 'не выбрано';
  };
  const contradictionText = (code) => ({
    BODY_IDENTITY_UNEXPLAINED: 'Ваша версия не объясняет, почему корпус при отправлении и корпус при прибытии физически различаются.',
    STOP_WINDOW_UNEXPLAINED: 'Ваша версия не объясняет 16-минутную остановку состава на Векторе-12.',
    PHYSICAL_EXECUTION_UNEXPLAINED: 'Ваша версия не объясняет телеметрию R-4 и два тяжелых подъема.',
    ORGANIZER_LACKS_PREPARATION_ACCESS: 'Ваша версия объясняет исполнение, но не объясняет подготовку ТК-0, доступ к параметрам груза и создание временного окна.'
  }[code] || 'В общей версии остается противоречие. Вернитесь к доказанным фактам и пересоберите реконструкцию.');
  const categoryText = (category) => ({
    identity: 'Нужно доказательство, что отправленный и прибывший контейнеры не являются одним физическим объектом.',
    physical_execution: 'Нужно физическое доказательство самой операции подмены.',
    preparation: 'Нужно доказательство предварительной подготовки ТК-0.',
    coordination: 'Нужно доказательство связи временного окна с организатором.'
  }[category] || 'Не хватает независимого класса доказательств.');

  const resolutionHtml = (state) => {
    const reveal = state.resolution;
    if (!reveal) return '';
    return `<section class="partner-v2-final is-solved" data-partner-v2-final>
      <p class="partner-v2-kicker">Дело раскрыто</p>
      <h2>${escapeHtml(reveal.title)}</h2>
      <div class="partner-v2-resolution-timeline">
        ${(reveal.timeline || []).map(([time, text]) => `<div><b>${escapeHtml(time)}</b><span>${escapeHtml(text)}</span></div>`).join('')}
      </div>
      <p class="partner-v2-resolution-closing">${escapeHtml(reveal.closing || '')}</p>
    </section>`;
  };

  const resultHtml = (state) => {
    const result = lastResult;
    if (!result) {
      if (state.me?.finalDraft && !state.state?.shared?.finalSolved) {
        if (state.state?.shared?.finalConsensus) return '<div class="partner-v2-final-notice is-warn">Ваши версии совпали, но реконструкция еще не закрывает все факты. Обсудите доказательства и при необходимости измените версию.</div>';
        return '<div class="partner-v2-final-notice">Ваша версия сохранена. Если напарник еще не отправил свою, дождитесь его решения.</div>';
      }
      return '';
    }
    if (result.status === 'waiting_partner') return '<div class="partner-v2-final-notice">Ваша версия сохранена. Ждем реконструкцию напарника.</div>';
    if (result.status === 'disagreement') {
      return `<div class="partner-v2-final-notice is-warn"><strong>У следственной группы нет единой версии.</strong>
        ${(result.differences || []).map((item) => `<div class="partner-v2-final-diff"><span>${escapeHtml(item.label)}</span><small>Вы: ${escapeHtml(optionLabel(state, item.field, item.mine))}<br>Напарник: ${escapeHtml(optionLabel(state, item.field, item.partner))}</small></div>`).join('')}
        <p>Игра не сообщает, кто прав. Обсудите расхождения и отправьте новую общую версию.</p></div>`;
    }
    if (result.status === 'contradiction') return `<div class="partner-v2-final-notice is-warn"><strong>В реконструкции осталась логическая дыра.</strong><p>${escapeHtml(contradictionText(result.code))}</p></div>`;
    if (result.status === 'evidence_gap') return `<div class="partner-v2-final-notice is-warn"><strong>Версия выглядит цельной, но доказательств недостаточно.</strong><p>${escapeHtml(categoryText(result.category))}</p></div>`;
    return '';
  };

  const finalFormHtml = (state) => {
    const ui = state.case?.finalUi;
    if (!ui) return '';
    const draft = state.me?.finalDraft || {};
    const answers = draft.answers || {};
    const selectedEvidence = new Set(draft.evidenceIds || []);
    const fields = (ui.fields || []).map((field) => `
      <label class="partner-v2-final-field">
        <span>${escapeHtml(field.label)}</span>
        <select data-final-field="${escapeHtml(field.id)}">
          <option value="">Выберите</option>
          ${(field.options || []).map((option) => `<option value="${escapeHtml(option.id)}" ${answers[field.id] === option.id ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
        </select>
      </label>`).join('');

    const evidence = (state.evidence || []).filter((item) => Number(item.chapter) <= 5).map((item) => `
      <label class="partner-v2-proof-option">
        <input type="checkbox" value="${escapeHtml(item.id)}" data-final-evidence ${selectedEvidence.has(item.id) ? 'checked' : ''}>
        <span><b>${escapeHtml(item.id)}</b>${escapeHtml(item.title)}</span>
      </label>`).join('');

    return `<section class="partner-v2-final" data-partner-v2-final>
      <p class="partner-v2-kicker">Общая реконструкция</p>
      <h2>${escapeHtml(ui.title)}</h2>
      <p>${escapeHtml(ui.lead)}</p>
      ${resultHtml(state)}
      <div class="partner-v2-final-fields">${fields}</div>
      <div class="partner-v2-proof-box">
        <h3>Доказательства вашей роли</h3>
        <p>Выберите минимум ${Number(ui.minEvidencePerPlayer || 2)} материала. В финале доказательства обоих игроков объединяются.</p>
        <div class="partner-v2-proof-grid">${evidence}</div>
      </div>
      <div class="partner-v2-actions"><button type="button" class="partner-v2-button is-primary" data-partner-v2-final-submit>Отправить свою реконструкцию</button></div>
    </section>`;
  };

  const mount = (state) => {
    const main = root.querySelector('.partner-v2-game-grid main');
    if (!main) return;
    root.querySelector('[data-partner-v2-final]')?.remove();
    root.querySelector('.partner-v2-next-slice')?.remove();
    const packetTitle = root.querySelector('.partner-v2-new-packet > h2');
    const currentChapter = state.case?.chapters?.find((item) => Number(item.id) === Number(state.state?.chapter));
    if (packetTitle && currentChapter) packetTitle.textContent = currentChapter.title;

    if (state.state?.shared?.finalSolved) {
      main.insertAdjacentHTML('beforeend', resolutionHtml(state));
      return;
    }
    if (Number(state.state?.chapter || 1) >= 5) main.insertAdjacentHTML('beforeend', finalFormHtml(state));
  };

  const refresh = async () => {
    if (!ENDPOINT || busy || !roomCode() || !root.querySelector('.partner-v2-game-grid')) return;
    try { mount(await api({ action: 'status', code: roomCode() })); } catch {}
  };

  const submit = async (section) => {
    if (busy) return;
    const answers = {};
    for (const select of section.querySelectorAll('[data-final-field]')) {
      if (!select.value) {
        section.querySelector('.partner-v2-final-notice')?.remove();
        section.insertAdjacentHTML('afterbegin', '<div class="partner-v2-final-notice is-warn">Заполните все части реконструкции.</div>');
        return;
      }
      answers[select.dataset.finalField] = select.value;
    }
    const evidenceIds = [...section.querySelectorAll('[data-final-evidence]:checked')].map((node) => node.value);
    busy = true;
    try {
      let state = await api({ action: 'status', code: roomCode() });
      if (evidenceIds.length < Number(state.case?.finalUi?.minEvidencePerPlayer || 2)) {
        lastResult = { status: 'evidence_gap', category: '' };
        mount(state);
        return;
      }
      const post = async (fresh, retry = true) => {
        try {
          return await api({ action: 'submit_final', code: fresh.room.code, answers, evidenceIds, clientRevision: fresh.state.revision });
        } catch (error) {
          if (retry && error.message === 'state_conflict') return post(await api({ action: 'status', code: fresh.room.code }), false);
          throw error;
        }
      };
      state = await post(state);
      lastResult = state.finalResult || null;
      mount(state);
    } catch {
      section.insertAdjacentHTML('afterbegin', '<div class="partner-v2-final-notice is-warn">Не удалось сохранить финальную версию. Состояние комнаты не потеряно, попробуйте еще раз.</div>');
    } finally { busy = false; }
  };

  root.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-partner-v2-final-submit]');
    if (!button) return;
    const section = button.closest('[data-partner-v2-final]');
    if (section) submit(section);
  });

  const observer = new MutationObserver(() => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (!root.querySelector('[data-partner-v2-final]') && root.querySelector('.partner-v2-game-grid')) refresh();
    }, 70);
  });
  observer.observe(root, { childList: true, subtree: true });
  refresh();
  window.addEventListener('beforeunload', () => { observer.disconnect(); clearTimeout(refreshTimer); });
})();
