(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/puzzle-editorial';
  const TOKEN_KEY = 'mysterylogic:review-admin-token:v1';
  const COLLECTIONS = {
    kids: { label: 'Для детей', route: '/golovolomki-dlya-detei/' },
    brain: { label: 'Игры для мозга', route: '/igry-dlya-mozga/' },
    detective: { label: 'Детективные', route: '/detektivnye-golovolomki/' },
    math: { label: 'Математические', route: '/matematicheskie-golovolomki/' },
    matches: { label: 'Со спичками', route: '/golovolomki-so-spichkami/' },
  };
  const login = document.querySelector('[data-admin-login]');
  const app = document.querySelector('[data-admin-app]');
  const loginForm = document.querySelector('[data-admin-login-form]');
  const tokenInput = document.querySelector('[data-admin-token]');
  const loginError = document.querySelector('[data-admin-login-error]');
  const appError = document.querySelector('[data-admin-error]');
  let activeTab = 'pending';
  let activeFilter = 'matches';
  let actionablePendingCount = null;
  let token = '';

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const setBusy = (busy) => app?.classList.toggle('mla-loading', Boolean(busy));
  const setError = (message = '') => { if (appError) appError.textContent = message; };
  const isExpertRow = (row = {}) => row.kind === 'expert' || String(row.puzzle_id || '').startsWith('expert:');
  const isMatchRow = (row = {}) => {
    const p = row.content || {};
    const collections = Array.isArray(p.collections) ? p.collections : [];
    return Boolean(p.match) || collections.includes('matches');
  };

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

  const updateCounts = (counts = {}, rows = [], status = activeTab) => {
    if (status === 'pending') {
      actionablePendingCount = rows.filter((row) => !isExpertRow(row)).length;
    }
    for (const key of ['pending', 'approved', 'rejected']) {
      const node = document.querySelector(`[data-count="${key}"]`);
      if (!node) continue;
      if (key === 'pending' && actionablePendingCount !== null) node.textContent = String(actionablePendingCount);
      else node.textContent = String(Number(counts[key] || 0));
    }

    const gate = document.querySelector('[data-gate-note]');
    if (!gate) return;
    const approved = Number(counts.approved || 0);
    const rejected = Number(counts.rejected || 0);
    if (status === 'pending') {
      const newPending = rows.filter((row) => !isExpertRow(row)).length;
      const legacyPending = rows.filter(isExpertRow).length;
      const matchPending = rows.filter(isMatchRow).length;
      gate.innerHTML = `<strong>Сейчас нужно решить ${newPending} новых задач.</strong> Из них <strong>${matchPending} — со спичками</strong>. Ещё ${legacyPending} Expert-задач уже опубликованы и вынесены в отдельную ретропроверку; они не мешают работе со спичками. Уже утверждено: ${approved}; отклонено: ${rejected}.`;
    } else {
      gate.innerHTML = `<strong>${status === 'approved' ? 'Утверждённые' : 'Отклонённые'}:</strong> используйте фильтры ниже, чтобы смотреть только нужный тип задач. Всего утверждено: ${approved}; отклонено: ${rejected}.`;
    }
  };

  const statusLabel = (status) => ({
    pending: 'На проверке', approved: 'Утверждена', rejected: 'Отклонена',
  }[status] || status);

  const publicTargets = (p = {}) => (Array.isArray(p.collections) ? p.collections : [])
    .filter((key) => COLLECTIONS[key]?.route)
    .map((key) => COLLECTIONS[key]);

  const publicationCopy = (row, p, status) => {
    const isExpert = isExpertRow(row);
    const isMatch = isMatchRow(row);
    if (isExpert) {
      if (status === 'pending') return '<p class="puzzle-admin-publish-copy is-legacy"><strong>Уже опубликована.</strong> Это отдельная ретроспективная проверка Expert-задачи. Она не относится к новой очереди со спичками.</p>';
      if (status === 'rejected') return '<p class="puzzle-admin-publish-copy is-rejected"><strong>Отклонена владельцем.</strong> Запись помечена для вывода из Expert-каталога или переработки в следующем редакционном релизе; существующий URL не превращаем автоматически в 404.</p>';
      return '<p class="puzzle-admin-publish-copy is-approved"><strong>Подтверждена владельцем.</strong> Текущая Expert-версия может оставаться публичной в каталоге и поисковом индексе.</p>';
    }
    if (status === 'rejected') return '<p class="puzzle-admin-publish-copy is-rejected">Не публикуется. Запись остаётся только в редакционной истории.</p>';
    if (status === 'pending' && isMatch) return '<p class="puzzle-admin-publish-copy"><strong>Ждёт вашего решения.</strong> После утверждения задача попадёт в пул раздела «Головоломки со спичками». SEO-хаб открываем после минимум 8 утверждённых визуальных задач.</p>';
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
    const quickRows = rows.filter((row) => !isExpertRow(row));
    const expertRows = rows.filter(isExpertRow);
    const counts = { kids: 0, brain: 0, detective: 0, math: 0, matches: 0, adult: 0 };
    for (const row of quickRows) {
      const p = row.content || {};
      const groups = Array.isArray(p.collections) ? p.collections : [];
      for (const key of ['kids', 'brain', 'detective', 'math', 'matches']) if (groups.includes(key)) counts[key] += 1;
      if (p.age === 'Для взрослых') counts.adult += 1;
    }
    box.hidden = false;
    box.innerHTML = `<div><p class="mla-kicker">Редакционный итог</p><h3>${rows.length} утверждено · ${quickRows.length} Quick · ${expertRows.length} Expert</h3><p>Утверждённые Quick автоматически распределяются по тематическим подборкам. Expert — уже существующий каталог.</p></div><div class="puzzle-publish-grid"><div><strong>${counts.kids}</strong><span>Для детей</span></div><div><strong>${counts.brain}</strong><span>Игры для мозга</span></div><div><strong>${counts.detective}</strong><span>Детективные</span></div><div><strong>${counts.math}</strong><span>Математические</span></div><div><strong>${counts.adult}</strong><span>Для взрослых</span></div></div><p class="puzzle-publish-foot">Со спичками утверждено: ${counts.matches}. SEO-хаб /golovolomki-so-spichkami/ создаём после минимум 8 утверждённых визуальных задач.</p>`;
  };

  const matchPreview = (p = {}) => {
    if (!p.match) return '';
    const answerEquation = typeof p.answer === 'string' && p.answer.includes('=') ? p.answer : '';
    return `<section class="puzzle-admin-match-review" aria-label="Визуальная проверка головоломки со спичками">
      <div class="puzzle-admin-match-review-head"><span class="mla-kicker">Визуальная проверка</span><strong>Так игрок увидит спички</strong></div>
      <div class="puzzle-admin-match-grid">
        <div><span class="puzzle-admin-match-label">Условие</span><div data-match-equation="${esc(p.match)}"></div></div>
        ${answerEquation ? `<div><span class="puzzle-admin-match-label">Решение после одного хода</span><div data-match-equation="${esc(answerEquation)}"></div></div>` : ''}
      </div>
    </section>`;
  };

  const puzzleCard = (row) => {
    const p = row.content || {};
    const status = String(row.moderation_status || 'pending');
    const isExpert = isExpertRow(row);
    const isMatch = isMatchRow(row);
    const choices = Array.isArray(p.choices) ? p.choices : [];
    const collections = Array.isArray(p.collections) ? p.collections : [];
    return `<article class="puzzle-admin-card ${isMatch ? 'is-match' : ''}" data-puzzle-id="${esc(row.puzzle_id)}">
      <div>
        <div class="puzzle-admin-meta">
          <span class="puzzle-admin-badge is-status">${esc(statusLabel(status))}</span>
          ${isMatch ? '<span class="puzzle-admin-badge is-match">Спички</span>' : ''}
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
        ${matchPreview(p)}
        <div class="puzzle-admin-prompt">${esc(p.prompt || 'Для этой записи доступен только маршрут ранее опубликованной задачи.')}</div>
        ${choices.length ? `<ol class="puzzle-admin-choices">${choices.map((choice, index) => `<li>${index + 1}. ${esc(choice)}</li>`).join('')}</ol>` : ''}
        <div class="puzzle-admin-details">
          ${p.answer ? `<details class="is-answer" ${isMatch ? 'open' : ''}><summary>Правильный ответ</summary><p>${esc(p.answer)}</p></details>` : ''}
          ${p.hint ? `<details><summary>Подсказка</summary><p>${esc(p.hint)}</p></details>` : ''}
          ${p.explanation ? `<details ${isMatch ? 'open' : ''}><summary>Разбор решения</summary><p>${esc(p.explanation)}</p></details>` : ''}
          ${p.match ? `<details><summary>Исходное равенство текстом</summary><p>${esc(p.match)}</p></details>` : ''}
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

  const rowType = (row) => {
    if (isMatchRow(row)) return 'matches';
    if (isExpertRow(row)) return 'expert';
    return 'quick';
  };

  const filterRows = (rows = []) => {
    if (activeFilter === 'all') return rows;
    return rows.filter((row) => rowType(row) === activeFilter);
  };

  const renderFilterBar = (rows = []) => {
    const bar = document.querySelector('[data-puzzle-filters]');
    if (!bar) return;
    const counts = {
      matches: rows.filter(isMatchRow).length,
      quick: rows.filter((row) => !isMatchRow(row) && !isExpertRow(row)).length,
      expert: rows.filter(isExpertRow).length,
      all: rows.length,
    };
    for (const key of ['matches', 'quick', 'expert', 'all']) {
      const button = bar.querySelector(`[data-filter="${key}"]`);
      if (!button) continue;
      button.classList.toggle('is-active', activeFilter === key);
      button.hidden = key !== 'all' && counts[key] === 0;
      const count = button.querySelector('[data-filter-count]');
      if (count) count.textContent = String(counts[key]);
    }
  };

  const titleFor = (status, filter) => {
    if (status === 'pending' && filter === 'matches') return 'Спички на проверке';
    if (status === 'pending' && filter === 'expert') return 'Expert — ретропроверка';
    if (status === 'pending' && filter === 'quick') return 'Quick-задачи на проверке';
    if (status === 'approved') return filter === 'all' ? 'Утверждённые головоломки' : 'Утверждённые — выбранный тип';
    if (status === 'rejected') return filter === 'all' ? 'Отклонённые головоломки' : 'Отклонённые — выбранный тип';
    return 'Головоломки на проверке';
  };

  const load = async (status = activeTab) => {
    setBusy(true); setError('');
    try {
      const data = await request(`?status=${encodeURIComponent(status)}`);
      const rows = data.puzzles || [];
      updateCounts(data.counts || {}, rows, status);
      renderPublishSummary(rows, status);
      renderFilterBar(rows);
      const visibleRows = filterRows(rows);
      const list = document.querySelector('[data-puzzle-list]');
      const empty = document.querySelector('[data-puzzle-empty]');
      const title = document.querySelector('[data-puzzle-title]');
      if (title) title.textContent = titleFor(status, activeFilter);
      if (list) {
        list.innerHTML = visibleRows.map(puzzleCard).join('');
        window.MysteryLogicMatchsticks?.renderAll?.(list);
      }
      if (empty) {
        empty.hidden = Boolean(visibleRows.length);
        empty.textContent = activeFilter === 'matches' ? 'В этом статусе нет задач со спичками.' : 'В этом разделе пока пусто.';
      }
    } catch (error) {
      setError(error.message || 'Не удалось загрузить очередь головоломок.');
    } finally { setBusy(false); }
  };

  const showTab = (tab) => {
    activeTab = tab;
    activeFilter = tab === 'pending' ? 'matches' : 'all';
    document.querySelectorAll('[data-tab]').forEach((button) => button.classList.toggle('is-active', button.dataset.tab === tab));
    load(tab);
  };

  document.addEventListener('click', async (event) => {
    const tab = event.target.closest?.('[data-tab]');
    if (tab) { showTab(String(tab.dataset.tab || 'pending')); return; }
    const filter = event.target.closest?.('[data-filter]');
    if (filter) {
      activeFilter = String(filter.dataset.filter || 'all');
      load(activeTab);
      return;
    }
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
      activeTab = 'pending';
      activeFilter = 'matches';
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
      activeTab = 'pending';
      activeFilter = 'matches';
      load('pending');
    }).catch(() => lock());
  }
})();
