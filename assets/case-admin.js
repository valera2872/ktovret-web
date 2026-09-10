(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/puzzle-editorial';
  const TOKEN_KEY = 'mysterylogic:review-admin-token:v1';
  const KIND = 'who_lied_case';
  const login = document.querySelector('[data-admin-login]');
  const app = document.querySelector('[data-admin-app]');
  const loginForm = document.querySelector('[data-admin-login-form]');
  const tokenInput = document.querySelector('[data-admin-token]');
  const loginError = document.querySelector('[data-admin-login-error]');
  const appError = document.querySelector('[data-admin-error]');
  const list = document.querySelector('[data-case-list]');
  const empty = document.querySelector('[data-case-empty]');
  const title = document.querySelector('[data-case-title]');
  const gate = document.querySelector('[data-gate-note]');
  let activeTab = 'pending';
  let token = '';

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const setBusy = (busy) => app?.classList.toggle('mla-loading', Boolean(busy));
  const setError = (message = '') => { if (appError) appError.textContent = message; };

  const lock = () => {
    token = '';
    try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
    if (app) app.hidden = true;
    if (login) login.hidden = false;
    if (tokenInput) tokenInput.value = '';
  };

  const request = async (path = '', options = {}) => {
    const response = await fetch(`${ENDPOINT}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
      cache: 'no-store',
      credentials: 'omit',
    });
    let body = {};
    try { body = await response.json(); } catch {}
    if (response.status === 401) {
      lock();
      throw new Error('Ключ не принят или был отключён.');
    }
    if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
    return body;
  };

  const statusLabel = (status) => ({
    pending: 'На проверке', approved: 'Утверждено', rejected: 'Отклонено',
  }[status] || status);

  const charName = (p, id) => {
    const row = (Array.isArray(p.characters) ? p.characters : []).find((item) => item.id === id);
    return row?.name || id || '—';
  };

  const factsHtml = (facts = []) => facts.length
    ? `<div class="case-admin-facts">${facts.map((item) => `<div><strong>${esc(item.label)}</strong><span>${esc(item.value)}</span></div>`).join('')}</div>`
    : '';

  const timelineHtml = (items = []) => items.length
    ? `<div class="case-admin-timeline">${items.map((item) => `<div><time>${esc(item.time)}</time><p><strong>${esc(item.title)}</strong><span>${esc(item.detail)}</span><small>${esc(item.source || '')}</small></p></div>`).join('')}</div>`
    : '';

  const charactersHtml = (items = [], correctId = '') => items.length
    ? `<div class="case-admin-statements">${items.map((item) => `<article class="${item.id === correctId ? 'is-answer' : ''}"><div><strong>${esc(item.name)}</strong><span>${esc(item.role)}</span></div><p>${esc(item.statement)}</p></article>`).join('')}</div>`
    : '';

  const caseCard = (row) => {
    const p = row.content || {};
    const status = String(row.moderation_status || 'pending');
    const explanation = p.explanation || {};
    const number = String(row.puzzle_id || '').split(':').pop() || '';
    const steps = Array.isArray(explanation.reasoningSteps) ? explanation.reasoningSteps : [];
    return `<article class="puzzle-admin-card case-admin-card" data-case-id="${esc(row.puzzle_id)}">
      <div>
        <div class="puzzle-admin-meta">
          <span class="puzzle-admin-badge is-status">${esc(statusLabel(status))}</span>
          <span class="puzzle-admin-badge">Дело №${esc(number)}</span>
          ${p.difficulty ? `<span class="puzzle-admin-badge">${esc(p.difficulty)}</span>` : ''}
          ${p.category ? `<span class="puzzle-admin-badge">${esc(p.category)}</span>` : ''}
          ${p.logicType ? `<span class="puzzle-admin-badge">${esc(p.logicType)}</span>` : ''}
          ${p.ageGroup ? `<span class="puzzle-admin-badge">${esc(p.ageGroup)}</span>` : ''}
        </div>
        <h3>${esc(row.title || p.title || row.puzzle_id)}</h3>
        <p class="case-admin-short">${esc(p.shortDescription || '')}</p>
        <section class="case-admin-section"><h4>Условие</h4><p>${esc(p.intro || '')}</p><p class="case-admin-question"><strong>${esc(p.question || 'Кто врёт?')}</strong></p></section>
        <section class="case-admin-section"><h4>Факты</h4>${factsHtml(Array.isArray(p.facts) ? p.facts : [])}</section>
        <section class="case-admin-section"><h4>Хронология</h4>${timelineHtml(Array.isArray(p.timeline) ? p.timeline : [])}</section>
        <section class="case-admin-section"><h4>Показания</h4>${charactersHtml(Array.isArray(p.characters) ? p.characters : [], explanation.correctOptionId)}</section>
        <details class="case-admin-solution" open>
          <summary>Правильный ответ и проверка логики</summary>
          <p><strong>Лжёт: ${esc(charName(p, explanation.correctOptionId))}.</strong> ${esc(explanation.shortReason || '')}</p>
          <p>${esc(explanation.fullReason || '')}</p>
          ${steps.length ? `<ol>${steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>` : ''}
        </details>
      </div>
      <aside class="puzzle-admin-side">
        <div><div class="mla-kicker">Статус публикации</div><p class="case-admin-publish ${status === 'approved' ? 'is-approved' : status === 'rejected' ? 'is-rejected' : ''}">${status === 'approved' ? 'Утверждено владельцем. Можно включать в следующий релиз после синхронизации контента.' : status === 'rejected' ? 'Не публикуется. Остаётся только в редакционной истории.' : 'Не опубликовано. Ждёт вашего решения.'}</p></div>
        <label><span class="mla-kicker">Редакторская заметка</span><textarea class="mla-review-note" data-case-note placeholder="Что исправить, спорная логика, слишком легко…">${esc(row.moderation_note || '')}</textarea></label>
        <div class="puzzle-admin-actions">
          ${status !== 'approved' ? '<button class="mla-action puzzle-admin-approve" type="button" data-moderate="approved">Утвердить</button>' : ''}
          ${status !== 'rejected' ? '<button class="mla-action puzzle-admin-reject" type="button" data-moderate="rejected">Отклонить</button>' : ''}
          ${status !== 'pending' ? '<button class="mla-action puzzle-admin-reset" type="button" data-moderate="pending">Вернуть на проверку</button>' : ''}
        </div>
        <div class="puzzle-admin-save-state" data-save-state></div>
      </aside>
    </article>`;
  };

  const updateCounts = (counts = {}) => {
    for (const key of ['pending', 'approved', 'rejected']) {
      const node = document.querySelector(`[data-count="${key}"]`);
      if (node) node.textContent = String(Number(counts[key] || 0));
    }
    if (gate) gate.innerHTML = `<strong>${Number(counts.pending || 0)} на проверке</strong> · ${Number(counts.approved || 0)} утверждено · ${Number(counts.rejected || 0)} отклонено. Публичный набор 101–110 обновляем только после вашего утверждения.`;
  };

  const load = async () => {
    setBusy(true); setError('');
    try {
      const body = await request(`?status=${encodeURIComponent(activeTab)}&kind=${encodeURIComponent(KIND)}`);
      const rows = Array.isArray(body.puzzles) ? body.puzzles : [];
      updateCounts(body.counts || {});
      if (title) title.textContent = activeTab === 'pending' ? 'Новые дела на проверке' : activeTab === 'approved' ? 'Утверждённые дела' : 'Отклонённые дела';
      if (list) list.innerHTML = rows.map(caseCard).join('');
      if (empty) empty.hidden = rows.length > 0;
    } catch (error) {
      setError(error?.message || 'Не удалось загрузить очередь.');
    } finally { setBusy(false); }
  };

  const unlock = async (rawToken) => {
    token = String(rawToken || '').trim();
    if (!/^MLADM-[A-Za-z0-9_-]{30,100}$/.test(token)) throw new Error('Неверный формат ключа.');
    await request(`?status=pending&kind=${encodeURIComponent(KIND)}`);
    try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
    if (login) login.hidden = true;
    if (app) app.hidden = false;
    await load();
  };

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (loginError) loginError.textContent = '';
    try { await unlock(tokenInput?.value || ''); }
    catch (error) { if (loginError) loginError.textContent = error?.message || 'Не удалось открыть панель.'; }
  });

  document.addEventListener('click', async (event) => {
    const tab = event.target.closest?.('[data-tab]');
    if (tab) {
      activeTab = String(tab.dataset.tab || 'pending');
      document.querySelectorAll('[data-tab]').forEach((node) => node.classList.toggle('is-active', node === tab));
      await load();
      return;
    }
    if (event.target.closest?.('[data-admin-refresh]')) { await load(); return; }
    if (event.target.closest?.('[data-admin-lock]')) { lock(); return; }
    const action = event.target.closest?.('[data-moderate]');
    if (!action) return;
    const card = action.closest('[data-case-id]');
    if (!card) return;
    const id = String(card.dataset.caseId || '');
    const note = card.querySelector('[data-case-note]')?.value || '';
    const state = card.querySelector('[data-save-state]');
    action.disabled = true;
    if (state) state.textContent = 'Сохраняю…';
    try {
      await request('', { method: 'POST', body: JSON.stringify({ action: 'moderate', id, status: action.dataset.moderate, note }) });
      if (state) state.textContent = 'Сохранено.';
      await load();
    } catch (error) {
      if (state) state.textContent = error?.message || 'Ошибка сохранения.';
      action.disabled = false;
    }
  });

  try {
    const saved = sessionStorage.getItem(TOKEN_KEY) || '';
    if (saved) unlock(saved).catch(lock);
  } catch {}
})();
