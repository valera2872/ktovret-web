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
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

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

  const photoGateHtml = (state) => {
    const ui = state.case?.checkpointUi?.photo_observation;
    if (!ui || state.state?.shared?.photoComparisonSolved) return '';
    const own = gateState(state, 'photo_observation');
    if (own?.correct) {
      return `<section class="partner-v2-gate" data-partner-v2-gate data-checkpoint="photo_observation">
        <p class="partner-v2-kicker">Совместная проверка</p>
        <h3>${escapeHtml(ui.title)}</h3>
        ${notice('pending', 'Ваши наблюдения подтверждены. Ждем проверку напарника.')}
      </section>`;
    }

    const fields = (ui.fields || []).map((field) => `
      <label class="partner-v2-observation-row">
        <span>${escapeHtml(field.label)}</span>
        <select data-photo-field="${escapeHtml(field.id)}">
          <option value="">Выберите</option>
          ${(ui.options || []).map((option) => `<option value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</option>`).join('')}
        </select>
      </label>`).join('');

    return `<section class="partner-v2-gate" data-partner-v2-gate data-checkpoint="photo_observation">
      <p class="partner-v2-kicker">Совместная проверка</p>
      <h3>${escapeHtml(ui.title)}</h3>
      <p>${escapeHtml(ui.lead)}</p>
      ${own && own.correct === false ? notice('wrong', 'Наблюдения пока не подтверждают различие корпусов. Сверьте нижнюю правую часть и область под номером с напарником.') : ''}
      <div class="partner-v2-observation-grid">${fields}</div>
      <div class="partner-v2-actions"><button class="partner-v2-button is-primary" type="button" data-partner-v2-action="photo-submit">Зафиксировать наблюдения</button></div>
    </section>`;
  };

  const linkGateHtml = (state) => {
    const ui = state.case?.checkpointUi?.t04391_link;
    if (!ui || state.state?.shared?.t04391Linked) return '';
    const own = gateState(state, 't04391_link');
    if (own?.correct) {
      return `<section class="partner-v2-gate" data-partner-v2-gate data-checkpoint="t04391_link">
        <p class="partner-v2-kicker">Передача между ролями</p>
        <h3>${escapeHtml(ui.title)}</h3>
        ${notice('pending', 'Ваша часть связи подтверждена. Ждем вывод напарника.')}
      </section>`;
    }

    return `<section class="partner-v2-gate" data-partner-v2-gate data-checkpoint="t04391_link">
      <p class="partner-v2-kicker">Передача между ролями</p>
      <h3>${escapeHtml(ui.title)}</h3>
      <p>${escapeHtml(ui.lead)}</p>
      ${own && own.correct === false ? notice('wrong', 'Эта связь не подтверждается вашим пакетом. Не угадывайте, обсудите номер задания с напарником.') : ''}
      <div class="partner-v2-link-options">
        ${(ui.options || []).map((option) => `<button class="partner-v2-option" type="button" data-partner-v2-action="link-submit" data-value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</button>`).join('')}
      </div>
    </section>`;
  };

  const solvedHtml = (state) => {
    if (state.state?.chapter === 3 && state.state?.shared?.photoComparisonSolved) {
      return `<section class="partner-v2-gate is-solved" data-partner-v2-gate>
        <p class="partner-v2-kicker">Ключевой вывод</p>
        <h3>Один номер. Два физических объекта.</h3>
        <p>Контейнер при отправлении и контейнер при прибытии имеют одинаковую маркировку, но различаются по устойчивым признакам корпуса.</p>
      </section>`;
    }
    if (state.state?.chapter >= 4 && state.state?.shared?.t04391Linked) {
      return `<section class="partner-v2-gate is-solved" data-partner-v2-gate>
        <p class="partner-v2-kicker">Связь подтверждена</p>
        <h3>Т-04391 соединяет ТК-0 и R-4.</h3>
        <p>Рыбаков выполнял задание на перемещение ТК-0 именно в интервал остановки состава. Теперь проверьте физику операции и источник команды.</p>
      </section>`;
    }
    return '';
  };

  const gateHtml = (state) => {
    const chapter = Number(state.state?.chapter || 1);
    if (chapter === 2 && !state.state?.shared?.photoComparisonSolved) return photoGateHtml(state);
    if (chapter === 3 && !state.state?.shared?.t04391Linked) return linkGateHtml(state);
    return solvedHtml(state);
  };

  const mountGate = (state) => {
    const main = root.querySelector('.partner-v2-game-grid main');
    if (!main) return;
    existingGate()?.remove();
    const html = gateHtml(state);
    if (!html) return;
    main.insertAdjacentHTML('beforeend', html);
  };

  const refreshGate = async () => {
    if (!ENDPOINT || busy || !roomCode() || !root.querySelector('.partner-v2-game-grid')) return;
    try {
      const state = await api({ action: 'status', code: roomCode() });
      mountGate(state);
    } catch {}
  };

  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (!existingGate() && root.querySelector('.partner-v2-game-grid')) refreshGate();
    }, 40);
  };

  const submitWithRetry = async (checkpointId, value, state, retry = true) => {
    try {
      return await api({
        action: 'submit_checkpoint',
        code: state.room.code,
        checkpointId,
        value,
        clientRevision: state.state.revision,
      });
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
        gate.querySelector('.partner-v2-gate-notice')?.remove();
        gate.insertAdjacentHTML('beforeend', notice('wrong', 'Отметьте оба признака перед фиксацией.'));
        return;
      }
      value[select.dataset.photoField] = select.value;
    }

    busy = true;
    try {
      const state = await api({ action: 'status', code: roomCode() });
      const next = await submitWithRetry('photo_observation', value, state);
      mountGate(next);
      if (next.checkpointResult?.correct === false) {
        const mounted = existingGate();
        mounted?.insertAdjacentHTML('beforeend', notice('wrong', 'Проверьте признаки еще раз. Важны повреждения корпуса, а не номер.'));
      }
    } catch {
      gate.insertAdjacentHTML('beforeend', notice('wrong', 'Не удалось сохранить вывод. Состояние комнаты не потеряно, попробуйте еще раз.'));
    } finally {
      busy = false;
    }
  };

  const submitLink = async (value, gate) => {
    busy = true;
    try {
      const state = await api({ action: 'status', code: roomCode() });
      const next = await submitWithRetry('t04391_link', value, state);
      mountGate(next);
      if (next.checkpointResult?.correct === false) {
        const mounted = existingGate();
        mounted?.insertAdjacentHTML('beforeend', notice('wrong', 'Эта связь не подтверждается вашим документом. Сверьте Т-04391 с напарником.'));
      }
    } catch {
      gate.insertAdjacentHTML('beforeend', notice('wrong', 'Не удалось сохранить вывод. Попробуйте еще раз.'));
    } finally {
      busy = false;
    }
  };

  root.addEventListener('click', (event) => {
    const target = event.target.closest?.('[data-partner-v2-action]');
    if (!target || busy) return;
    const gate = target.closest('[data-partner-v2-gate]');
    if (!gate) return;
    const action = target.dataset.partnerV2Action;
    if (action === 'photo-submit') submitPhoto(gate);
    else if (action === 'link-submit') submitLink(target.dataset.value || '', gate);
  });

  const observer = new MutationObserver(scheduleRefresh);
  observer.observe(root, { childList: true, subtree: true });
  scheduleRefresh();
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
    clearTimeout(refreshTimer);
  });
})();
