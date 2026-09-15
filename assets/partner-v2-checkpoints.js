(() => {
  'use strict';

  const root = document.querySelector('[data-partner-v2-app]');
  if (!root) return;

  const ENDPOINT = root.dataset.partnerEndpoint || '';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  const CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;
  let busy = false;
  let refreshTimer = null;

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
      error.payload = payload;
      throw error;
    }
    return payload;
  };

  const existingGate = () => root.querySelector('[data-partner-v2-gate]');
  const gateState = (state, checkpointId) => state.me?.checkpoints?.[checkpointId] || null;
  const notice = (kind, text) => `<div class="partner-v2-gate-notice is-${kind}">${escapeHtml(text)}</div>`;

  const waitingGate = (kicker, title, text) => `<section class="partner-v2-gate" data-partner-v2-gate>
    <p class="partner-v2-kicker">${escapeHtml(kicker)}</p><h3>${escapeHtml(title)}</h3>${notice('pending', text)}
  </section>`;

  const photoGateHtml = (state) => {
    const ui = state.case?.checkpointUi?.photo_observation;
    if (!ui || state.state?.shared?.photoComparisonSolved) return '';
    const own = gateState(state, 'photo_observation');
    if (own?.correct) return waitingGate('Совместная проверка', ui.title, 'Ваши наблюдения подтверждены. Ждем проверку напарника.');

    const fields = (ui.fields || []).map((field) => `
      <label class="partner-v2-observation-row">
        <span>${escapeHtml(field.label)}</span>
        <select data-photo-field="${escapeHtml(field.id)}">
          <option value="">Выберите</option>
          ${(ui.options || []).map((option) => `<option value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</option>`).join('')}
        </select>
      </label>`).join('');

    return `<section class="partner-v2-gate" data-partner-v2-gate data-checkpoint="photo_observation">
      <p class="partner-v2-kicker">Совместная проверка</p><h3>${escapeHtml(ui.title)}</h3><p>${escapeHtml(ui.lead)}</p>
      ${own && own.correct === false ? notice('wrong', 'Наблюдения пока не подтверждают различие корпусов. Сверьте повреждения, а не номер.') : ''}
      <div class="partner-v2-observation-grid">${fields}</div>
      <div class="partner-v2-actions"><button class="partner-v2-button is-primary" type="button" data-partner-v2-action="photo-submit">Зафиксировать наблюдения</button></div>
    </section>`;
  };

  const optionGateHtml = (state, checkpointId, kicker, wrongText) => {
    const ui = state.case?.checkpointUi?.[checkpointId];
    if (!ui) return '';
    const own = gateState(state, checkpointId);
    if (own?.correct) return waitingGate(kicker, ui.title, 'Ваша часть вывода подтверждена. Ждем вывод напарника.');
    return `<section class="partner-v2-gate" data-partner-v2-gate data-checkpoint="${escapeHtml(checkpointId)}">
      <p class="partner-v2-kicker">${escapeHtml(kicker)}</p><h3>${escapeHtml(ui.title)}</h3><p>${escapeHtml(ui.lead)}</p>
      ${own && own.correct === false ? notice('wrong', wrongText) : ''}
      <div class="partner-v2-link-options">
        ${(ui.options || []).map((option) => `<button class="partner-v2-option" type="button" data-partner-v2-action="option-submit" data-checkpoint="${escapeHtml(checkpointId)}" data-value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</button>`).join('')}
      </div>
    </section>`;
  };

  const solvedHtml = (state) => {
    if (Number(state.state?.chapter || 1) >= 5 && state.state?.shared?.endpoint184Linked) {
      return `<section class="partner-v2-gate is-solved" data-partner-v2-gate><p class="partner-v2-kicker">Финальный узел открыт</p><h3>Подготовка, физическая подмена и временное окно связаны.</h3><p>Теперь отделите исполнителя от организатора и соберите общую реконструкцию.</p></section>`;
    }
    if (state.state?.shared?.physicalSwapProven) {
      return `<section class="partner-v2-gate is-solved" data-partner-v2-gate><p class="partner-v2-kicker">Физика операции доказана</p><h3>На площадке заменили два тяжелых объекта сопоставимой массы.</h3><p>Осталось установить, кто создал окно для этой операции.</p></section>`;
    }
    if (state.state?.shared?.t04391Linked) {
      return `<section class="partner-v2-gate is-solved" data-partner-v2-gate><p class="partner-v2-kicker">Связь подтверждена</p><h3>Т-04391 соединяет ТК-0 и R-4.</h3><p>Рыбаков работал с ТК-0 в интервал остановки состава.</p></section>`;
    }
    if (state.state?.shared?.photoComparisonSolved) {
      return `<section class="partner-v2-gate is-solved" data-partner-v2-gate><p class="partner-v2-kicker">Ключевой вывод</p><h3>Один номер. Два физических объекта.</h3><p>Маркировка совпадает, но устойчивые признаки корпуса различаются.</p></section>`;
    }
    return '';
  };

  const gateHtml = (state) => {
    const chapter = Number(state.state?.chapter || 1);
    const shared = state.state?.shared || {};
    if (chapter === 2 && !shared.photoComparisonSolved) return photoGateHtml(state);
    if (chapter === 3 && !shared.t04391Linked) return optionGateHtml(state, 't04391_link', 'Передача между ролями', 'Эта связь не подтверждается вашим документом. Сверьте Т-04391 с напарником.');
    if (chapter === 4 && !shared.physicalSwapProven) return optionGateHtml(state, 'physical_operation', 'Физическая реконструкция', 'Версия не согласуется с массой объектов. Сопоставьте телеметрию R-4 и данные ТК-0.');
    if (chapter === 4 && shared.physicalSwapProven && !shared.endpoint184Linked) return optionGateHtml(state, 'endpoint_link', 'Источник команды', 'Связь не подтверждается журналами. Сверьте Endpoint 184, L-14 и время активной сессии.');
    return solvedHtml(state);
  };

  const mountGate = (state) => {
    const main = root.querySelector('.partner-v2-game-grid main');
    if (!main) return;
    existingGate()?.remove();
    const html = gateHtml(state);
    if (html) main.insertAdjacentHTML('beforeend', html);
  };

  const refreshGate = async () => {
    if (!ENDPOINT || busy || !roomCode() || !root.querySelector('.partner-v2-game-grid')) return;
    try { mountGate(await api({ action: 'status', code: roomCode() })); } catch {}
  };
  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (!existingGate() && root.querySelector('.partner-v2-game-grid')) refreshGate();
    }, 50);
  };

  const submitWithRetry = async (checkpointId, value, state, retry = true) => {
    try {
      return await api({ action: 'submit_checkpoint', code: state.room.code, checkpointId, value, clientRevision: state.state.revision });
    } catch (error) {
      if (retry && error.message === 'state_conflict') {
        const fresh = await api({ action: 'status', code: state.room.code });
        if (fresh.me?.checkpoints?.[checkpointId]?.correct) return fresh;
        return submitWithRetry(checkpointId, value, fresh, false);
      }
      throw error;
    }
  };

  const submitPhoto = async (gate) => {
    const value = {};
    for (const select of gate.querySelectorAll('[data-photo-field]')) {
      if (!select.value) {
        gate.insertAdjacentHTML('beforeend', notice('wrong', 'Отметьте оба признака перед фиксацией.'));
        return;
      }
      value[select.dataset.photoField] = select.value;
    }
    busy = true;
    try {
      const state = await api({ action: 'status', code: roomCode() });
      mountGate(await submitWithRetry('photo_observation', value, state));
    } catch {
      gate.insertAdjacentHTML('beforeend', notice('wrong', 'Не удалось сохранить вывод. Попробуйте еще раз.'));
    } finally { busy = false; }
  };

  const submitOption = async (checkpointId, value, gate) => {
    busy = true;
    try {
      const state = await api({ action: 'status', code: roomCode() });
      mountGate(await submitWithRetry(checkpointId, value, state));
    } catch (error) {
      const text = error.message === 'checkpoint_locked' ? 'Сначала завершите предыдущую совместную проверку.' : 'Не удалось сохранить вывод. Попробуйте еще раз.';
      gate.insertAdjacentHTML('beforeend', notice('wrong', text));
    } finally { busy = false; }
  };

  root.addEventListener('click', (event) => {
    const target = event.target.closest?.('[data-partner-v2-action]');
    if (!target || busy) return;
    const gate = target.closest('[data-partner-v2-gate]');
    if (!gate) return;
    if (target.dataset.partnerV2Action === 'photo-submit') submitPhoto(gate);
    if (target.dataset.partnerV2Action === 'option-submit') submitOption(target.dataset.checkpoint || '', target.dataset.value || '', gate);
  });

  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(root, { childList: true, subtree: true });
  scheduleRefresh();
  window.addEventListener('beforeunload', () => { observer.disconnect(); clearTimeout(refreshTimer); });
})();
