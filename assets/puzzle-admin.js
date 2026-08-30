(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/puzzle-editorial';
  const TOKEN_KEY = 'mysterylogic:review-admin-token:v1';
  const COLLECTIONS = {
    kids: { label: 'Для детей', route: '/golovolomki-dlya-detei/' },
    brain: { label: 'Игры для мозга', route: '/igry-dlya-mozga/' },
    detective: { label: 'Детективные', route: '/detektivnye-golovolomki/' },
    math: { label: 'Математические', route: '/matematicheskie-golovolomki/' },
    matches: { label: 'Со спичками', route: null },
  };
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
        ? `<strong>Проверка продолжается:</strong> ${pending} ${pending === 1 ? 'задача ждёт' : 'задач ждут'} решения. Уже утверждено: ${approved}; отклонено: ${rejected}. Утверждённые входят в пул публикации сразу — отклонённые их больше не блокируют.`
        : `<strong>Проверка завершена.</strong> ${approved} задач разрешены к публикации, ${rejected} исключены. Дополнительного подтверждения для утверждённых задач не требуется.`;
    }
  };

  const statusLabel = (status) => ({
    pending: 'На проверке', approved: 'Утверждена', rejected: 'Отклонена',
  }[status] || status);

  const publicTargets = (p = {}) => (Array.isArray(p.collections) ? p.collections : [])
    .filter((key) => COLLECTIONS[key]?.route)
    .map((key) => COLLECTIONS[key]);

  const publicationCopy = (row, p, status) => {
    const isExpert = row.kind === 'expert' || String(row.puzzle_id || '').startsWith('expert:');
    if (isExpert) {
      if (status === 'pending') return '<p class="puzzle-admin-publish-copy is-legacy"><strong>Уже опубликована.</strong> Это ретроспективная проверка Expert-задачи. Пока вы не приняли решение, текущую страницу не снимаем.</p>';
      if (status === 'rejected') return '<p class="puzzle-admin-publish-copy is-rejected"><strong>Отклонена владельцем.</strong> Запись помечена для вывода из Expert-каталога или переработки в следующем редакционном релизе; существующий URL не превращаем автоматически в 404.</p>';
      return '<p class="puzzle-admin-publish-copy is-approved"><strong>Подтверждена владельцем.</strong> Текущая Expert-версия может оставаться публичной в каталоге и поисковом индексе.</p>';
    }
    if (status === 'rejected') return '<p class="puzzle-admin-publish-copy is-rejected">Не публикуется. Запись остаётся только в редакционной истории.</p>';
    if (status === 'pending') return '<p class="puzzle-admin-publish-copy">Сначала примите редакционное решение.</p>';
    const targets = publicTargets(p);
    const targetHtml = targets.length
      ? `<ul class="puzzle-admin-targets">${targets.map((target) => `<li><strong>${esc(target.label)}</strong><span>${esc(target.route)}</span></li>`).join('')}</ul>`
      : '<p class="puzzle-admin-publish-copy">Нет публичной коллекции для этой механики.</p>';
    return `<p class="puzzle-admin-publish-copy is-approved"><strong>Готова к публикации.</strong> Игровой URL создаётся как <code>noindex,follow</code>; SEO-трафик собирают полноценные тематические подборки.</p>${targetHtml}`;
  };

  const renderPublishSummary = (rows = [], status = activeTab) => {
    const box = document.querySelector('[data-publish-summary]');
    if (!box) return;
    if (status !== 'approved') { box.hidden = true; box.innerHTML = ''; return; }
    const quickRows = rows.filter((row) => row.kind !== 'expert');
    const expertRows = rows.filter((row) => row.kind === 'expert');
    const counts = { kids: 0, brain: 0, detective: 0, math: 0, matches: 0, adult: 0 };
    for (const row of quickRows) {
      const p = row.content || {};
      const groups = Array.isArray(p.collections) ? p.collections : [];
      for (const key of ['kids', 'brain', 'detective', 'math', 'matches']) if (groups.includes(key)) counts[key] += 1;
      if (p.age === 'Для взрослых') counts.adult += 1;
    }
    box.hidden = false;
    box.innerHTML = `<div><p class="mla-kicker">Редакционный итог</p><h3>${rows.length} утверждено · ${quickRows.length} новых · ${expertRows.length} Expert</h3><p>Новые задачи автоматически распределяются по тематическим подборкам. Expert — уже существующий каталог: утверждение подтверждает текущую опубликованную версию.</p></div><div class="puzzle-publish-grid"><div><strong>${counts.kids}</strong><span>Для детей</span></div><div><strong>${counts.brain}</strong><span>Игры для мозга</span></div><div><strong>${counts.detective}</strong><span>Детективные</span></div><div><strong>${counts.math}</strong><span>Математические</span></div><div><strong>${counts.adult}</strong><span>Для взрослых</span></div></div><p class="puzzle-publish-foot">Со спичками: ${counts.matches}. Этот формат сейчас исключён из публичного дерева. Expert подтверждено: ${expertRows.length}.</p>`;
  };

  const puzzleCard = (row) => {
    const p = row.content || {};
    const status = String(row.moderation_status || 'pending');
    const isExpert = row.kind === 'expert' || String(row.puzzle_id || '').startsWith('expert:');
    const choices = Array.isArray(p.choices) ? p.choices : [];
    const collections = Array.isArray(p.collections) ? p.collections : [];
    return `<article class="puzzle-admin-card" data-puzzle-id="${esc(row.puzzle_id)}">
      <div>
        <div class="puzzle-admin-meta">
          <span class="puzzle-admin-badge is-status">${esc(statusLabel(status))}</span>
          <span class="puzzle-admin-badge ${isExpert ? 'is-expert' : ''}">${isExpert ? 'Expert' : 'Quick'}</span>
          ${row.published_before_gate ? '<span class="puzzle-admin-badge is-legacy">Уже опубликована</span>' : ''}
          ${p.number ? `<span class="puzzle-admin-badge">${esc(p.number)}</span>` : ''}
          ${p.age ? `<span class="puzzle-admin-badge">${esc(p.age)}</span>` : ''}
          ${p.difficulty ? `<span class="puzzle-admin-badge">${esc(p.difficulty)}</span>` : ''}
          ${p.time ? `<span class="puzzle-admin-badge">${esc(p.time)}</span>` : ''}
          ${p.skill ? `<span class="puzzle-admin-badge">${esc(p.skill)}</span>` : ''}
          ${p.category ? `<span class="puzzle-admin-badge">${esc(p.category)}</span>` : ''}
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
          <div class="mla-kicker">Игровой маршрут</div>
          <span class="puzzle-admin-route">/${esc(row.public_route || '')}</span>
        </div>
        <div>
          <div class="mla-kicker">После решения</div>
          ${publicationCopy(row, p, status)}
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
      const rows = data.puzzles || [];
      renderPublishSummary(rows, status);
      const list = document.querySelector('[data-puzzle-list]');
      const empty = document.querySelector('[data-puzzle-empty]');
      const title = document.querySelector('[data-puzzle-title]');
      if (title) title.textContent = status === 'approved'
        ? 'Утверждённые головоломки'
        : status === 'rejected' ? 'Отклонённые головоломки' : 'Головоломки на проверке';
      if (list) list.innerHTML = rows.map(puzzleCard).join('');
      if (empty) empty.hidden = Boolean(rows.length);
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
