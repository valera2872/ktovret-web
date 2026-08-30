(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/puzzle-editorial';
  const TOKEN_KEY = 'mysterylogic:review-admin-token:v1';
  const login = document.querySelector('[data-admin-login]');
  const app = document.querySelector('[data-admin-app]');
  const loginForm = document.querySelector('[data-admin-login-form]');
  const tokenInput = document.querySelector('[data-admin-token]');
  const loginError = document.querySelector('[data-admin-login-error]');
  const appError = document.querySelector('[data-admin-error]');
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

  const updateCounts = (counts = {}) => {
    for (const status of ['pending', 'approved', 'rejected']) {
      const node = document.querySelector(`[data-count="${status}"]`);
      if (node) node.textContent = String(Number(counts[status] || 0));
    }
    const gate = document.querySelector('[data-gate-note]');
    if (gate) {
      const pending = Number(counts.pending || 0);
      const approved = Number(counts.approved || 0);
      const rejected = Number(counts.rejected || 0);
      gate.innerHTML = pending
        ? `<strong>Публикация закрыта:</strong> ${pending} ${pending === 1 ? 'задача ждёт' : 'задач ждут'} решения. Утверждено: ${approved}. Отклонено: ${rejected}.`
        : `<strong>Очередь разобрана.</strong> Утверждено: ${approved}. Отклонено: ${rejected}.`;
    }
  };

  const statusLabel = (status) => ({
    pending: 'На проверке', approved: 'Утверждена', rejected: 'Отклонена',
  }[status] || status);

  const puzzleCard = (row) => {
    const p = row.content || {};
    const status = String(row.moderation_status || 'pending');
    const choices = Array.isArray(p.choices) ? p.choices : [];
    const collections = Array.isArray(p.collections) ? p.collections : [];
    return `<article class="puzzle-admin-card" data-puzzle-id="${esc(row.puzzle_id)}">
      <div>
        <div class="puzzle-admin-meta">
          <span class="puzzle-admin-badge is-status">${esc(statusLabel(status))}</span>
          ${p.number ? `<span class="puzzle-admin-badge">${esc(p.number)}</span>` : ''}
          ${p.age ? `<span class="puzzle-admin-badge">${esc(p.age)}</span>` : ''}
          ${p.difficulty ? `<span class="puzzle-admin-badge">${esc(p.difficulty)}</span>` : ''}
          ${p.time ? `<span class="puzzle-admin-badge">${esc(p.time)}</span>` : ''}
          ${p.skill ? `<span class="puzzle-admin-badge">${esc(p.skill)}</span>` : ''}
        </div>
        <h3>${esc(row.title || p.title || row.puzzle_id)}</h3>
        <div class="puzzle-admin-id">${esc(row.puzzle_id)}${collections.length ? ` · ${esc(collections.join(' · '))}` : ''}</div>
        <div class="puzzle-admin-prompt">${esc(p.prompt || 'Для этой записи доступен только маршрут ранее опубликованной задачи.')}</div>
        ${choices.length ? `<ol class="puzzle-admin-choices">${choices.map((choice, index) => `<li>${index + 1}. ${esc(choice)}</li>`).join('')}</ol>` : ''}
        <div class="puzzle-admin-details">
          ${p.answer ? `<details class="is-answer"><summary>Правильный ответ</summary><p>${esc(p.answer)}</p></details>` : ''}
          ${p.hint ? `<details><summary>Подсказка</summary><p>${esc(p.hint)}</p></details>` : ''}
          ${p.explanation ? `<details><summary>Разбор решения</summary><p>${esc(p.explanation)}</p></details>` : ''}
          ${p.match ? `<details><summary>Исходное равенство</summary><p>${esc(p.match)}</p></details>` : ''}
        </div>
      </div>
      <aside class="puzzle-admin-side">
        <div>
          <div class="mla-kicker">Публикация</div>
          <span class="puzzle-admin-route">/${esc(row.public_route || '')}</span>
        </div>
        <label><span class="mla-kicker">Редакторская заметка</span><textarea class="mla-review-note" data-puzzle-note placeholder="Например: изменить формулировку, слишком легко, спорный ответ…">${esc(row.moderation_note || '')}</textarea></label>
        <div class="puzzle-admin-actions">
          ${status !== 'approved' ? '<button class="mla-action puzzle-admin-approve" type="button" data-moderate="approved">Утвердить</button>' : ''}
          ${status !== 'rejected' ? '<button class="mla-action puzzle-admin-reject" type="button" data-moderate="rejected">Отклонить</button>' : ''}
          ${status !== 'pending' ? '<button class="mla-action puzzle-admin-reset" type="button" data-moderate="pending">Вернуть на проверку</button>' : ''}
        </div>
        <div class="puzzle-admin-save-state" data-save-state></div>
      </aside>
    </article>`;
  };

  const load = async (status = activeTab) => {
    setBusy(true); setError('');
    try {
      const data = await request(`?status=${encodeURIComponent(status)}`);
      updateCounts(data.counts || {});
      const list = document.querySelector('[data-puzzle-list]');
      const empty = document.querySelector('[data-puzzle-empty]');
      const title = document.querySelector('[data-puzzle-title]');
      if (title) title.textContent = status === 'approved'
        ? 'Утверждённые головоломки'
        : status === 'rejected' ? 'Отклонённые головоломки' : 'Головоломки на проверке';
      if (list) list.innerHTML = (data.puzzles || []).map(puzzleCard).join('');
      if (empty) empty.hidden = Boolean((data.puzzles || []).length);
    } catch (error) {
      setError(error.message || 'Не удалось загрузить очередь головоломок.');
    } finally { setBusy(false); }
  };

  const showTab = (tab) => {
    activeTab = tab;
    document.querySelectorAll('[data-tab]').forEach((button) => button.classList.toggle('is-active', button.dataset.tab === tab));
    load(tab);
  };

  document.addEventListener('click', async (event) => {
    const tab = event.target.closest?.('[data-tab]');
    if (tab) { showTab(String(tab.dataset.tab || 'pending')); return; }
    if (event.target.closest?.('[data-admin-refresh]')) { load(activeTab); return; }
    if (event.target.closest?.('[data-admin-lock]')) { lock(); return; }

    const moderate = event.target.closest?.('[data-moderate]');
    if (!moderate) return;
    const card = moderate.closest('[data-puzzle-id]');
    if (!card) return;
    const status = String(moderate.dataset.moderate || '');
    const note = String(card.querySelector('[data-puzzle-note]')?.value || '').trim();
    const state = card.querySelector('[data-save-state]');
    card.classList.add('is-busy');
    if (state) state.textContent = 'Сохраняю…';
    setError('');
    try {
      await request('', { method: 'POST', body: JSON.stringify({ action: 'moderate', id: card.dataset.puzzleId, status, note }) });
      await load(activeTab);
    } catch (error) {
      card.classList.remove('is-busy');
      if (state) state.textContent = '';
      setError(error.message || 'Не удалось изменить статус задачи.');
    }
  });

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const candidate = String(tokenInput?.value || '').trim();
    if (!/^MLADM-[A-Za-z0-9_-]{30,100}$/.test(candidate)) {
      if (loginError) loginError.textContent = 'Проверьте ключ модератора.';
      return;
    }
    token = candidate;
    if (loginError) loginError.textContent = '';
    try {
      await request('?status=pending');
      try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
      if (login) login.hidden = true;
      if (app) app.hidden = false;
      await load('pending');
    } catch (error) {
      if (loginError) loginError.textContent = error.message || 'Не удалось войти.';
    }
  });

  try { token = sessionStorage.getItem(TOKEN_KEY) || ''; } catch {}
  if (/^MLADM-[A-Za-z0-9_-]{30,100}$/.test(token)) {
    request('?status=pending').then(() => {
      if (login) login.hidden = true;
      if (app) app.hidden = false;
      load('pending');
    }).catch(() => lock());
  }
})();
