(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/review-moderation';
  const TOKEN_KEY = 'mysterylogic:review-admin-token:v1';
  const login = document.querySelector('[data-admin-login]');
  const app = document.querySelector('[data-admin-app]');
  const loginForm = document.querySelector('[data-admin-login-form]');
  const tokenInput = document.querySelector('[data-admin-token]');
  const loginError = document.querySelector('[data-admin-login-error]');
  const appError = document.querySelector('[data-admin-error]');
  const reviewPanel = document.querySelector('[data-review-panel]');
  const funnelPanel = document.querySelector('[data-funnel-panel]');
  let activeTab = 'pending';
  let token = '';

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const difficultyLabel = (value) => ({
    too_easy: 'Слишком легко',
    just_right: 'В самый раз',
    too_hard: 'Слишком сложно',
  }[value] || 'Сложность не указана');

  const pageLabel = (value) => ({
    home: 'Главная',
    'kto-vret': '«Кто врёт?»',
    catalog: '15 бесплатных дел',
    volume: 'Первый том',
    'short-case': 'Короткое дело',
    'solo-hub': 'Для одного',
    'solo-case': 'Большое solo-дело',
    'coop-hub': 'Для двоих',
    'coop-case': 'Совместное дело',
    'seo-hub': 'SEO-вход',
    challenge: 'Вызов',
    other: 'Другая страница',
  }[value] || value);

  const eventLabel = (value) => ({
    page_view: 'Просмотр страницы',
    engaged_15s: 'Остался 15 секунд',
    engaged_45s: 'Остался 45 секунд',
    scroll_50: 'Долистал до 50%',
    primary_action: 'Главный CTA',
    format_choice: 'Выбрал формат',
    game_open: 'Открыл дело',
    game_accept: 'Принял дело',
    game_answer_attempt: 'Проверил версию',
    game_complete: 'Завершил дело',
    review_view: 'Увидел отзыв',
    review_submit: 'Отправил отзыв',
    checkout_open: 'Открыл оплату',
    checkout_start: 'Начал оплату',
    checkout_success: 'Успешная оплата',
    no_action_45s: '45 секунд без действия',
    diagnostic_choice: 'Ответил на диагностический вопрос',
  }[value] || value);

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
  };

  const reviewCard = (review) => {
    const stars = '★'.repeat(Math.max(0, Math.min(5, Number(review.rating || 0)))) +
      '☆'.repeat(Math.max(0, 5 - Math.min(5, Number(review.rating || 0))));
    const date = new Date(review.created_at);
    const dateLabel = Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date);
    const name = review.display_name ? esc(review.display_name) : 'Без имени';
    const consent = Boolean(review.publication_consent);
    const status = String(review.moderation_status || 'pending');

    return `<article class="mla-review" data-review-id="${esc(review.id)}">
      <div>
        <div class="mla-review-head">
          <div class="mla-review-meta">
            <span class="mla-badge">${esc(review.case_id)}</span>
            <span class="mla-badge">${esc(difficultyLabel(review.difficulty))}</span>
            <span class="mla-badge ${consent ? 'is-consent' : 'is-private'}">${consent ? 'Можно публиковать' : 'Только внутренняя обратная связь'}</span>
          </div>
          <span class="mla-stars" aria-label="${Number(review.rating || 0)} из 5">${stars}</span>
        </div>
        <h3>${name}</h3>
        <blockquote>${esc(review.comment)}</blockquote>
        <time>${esc(dateLabel)}${status !== 'pending' && review.moderated_at ? ` · ${status === 'approved' ? 'одобрено' : 'отклонено'}` : ''}</time>
      </div>
      <aside class="mla-review-side">
        <label><span class="mla-kicker">Внутренняя заметка</span><textarea class="mla-review-note" data-review-note placeholder="Необязательно">${esc(review.moderation_note || '')}</textarea></label>
        <div class="mla-review-buttons">
          ${status !== 'approved' ? '<button class="mla-action" type="button" data-moderate="approved">Одобрить</button>' : ''}
          ${status !== 'rejected' ? '<button class="mla-action is-reject" type="button" data-moderate="rejected">Отклонить</button>' : ''}
          ${status !== 'pending' ? '<button class="mla-action is-reset" type="button" data-moderate="pending">Вернуть в новые</button>' : ''}
        </div>
      </aside>
    </article>`;
  };

  const loadReviews = async (status = activeTab) => {
    setBusy(true); setError('');
    try {
      const data = await request(`?status=${encodeURIComponent(status)}`);
      updateCounts(data.counts || {});
      const list = document.querySelector('[data-review-list]');
      const empty = document.querySelector('[data-review-empty]');
      const title = document.querySelector('[data-review-title]');
      if (title) title.textContent = status === 'approved' ? 'Одобренные отзывы' : status === 'rejected' ? 'Отклонённые отзывы' : 'Новые отзывы';
      if (list) list.innerHTML = (data.reviews || []).map(reviewCard).join('');
      if (empty) empty.hidden = Boolean((data.reviews || []).length);
    } catch (error) {
      setError(error.message || 'Не удалось загрузить отзывы.');
    } finally { setBusy(false); }
  };

  const sumActions = (stats = {}) => Number(stats.primary_action || 0) + Number(stats.format_choice || 0) + Number(stats.game_open || 0) + Number(stats.game_accept || 0);

  const loadFunnel = async () => {
    setBusy(true); setError('');
    try {
      const days = Number(document.querySelector('[data-funnel-days]')?.value || 7);
      const data = await request(`?mode=funnel&days=${days}`);
      const summary = data.summary || {};
      const sessions = Number(summary.sessions || 0);
      const acted = Number(summary.sessionsWithAction || 0);
      const noAction = Number(summary.sessionsWithoutAction || 0);
      const completed = Number(summary.completedSessions || 0);
      const pct = (value, base = sessions) => base ? `${Math.round((value / base) * 100)}%` : '—';
      const cards = document.querySelector('[data-funnel-cards]');
      if (cards) cards.innerHTML = [
        ['Сессии', sessions, `${Number(data.events || 0)} событий`],
        ['С первым действием', acted, pct(acted)],
        ['Без осмысленного действия', noAction, pct(noAction)],
        ['Завершили дело', completed, pct(completed)],
      ].map(([label, value, note]) => `<article class="mla-funnel-card"><small>${label}</small><strong>${value}</strong><span>${note}</span></article>`).join('');

      const tbody = document.querySelector('[data-funnel-pages]');
      const byPage = summary.byPage || {};
      const order = ['home', 'seo-hub', 'kto-vret', 'catalog', 'solo-hub', 'coop-hub', 'short-case', 'solo-case', 'coop-case', 'volume', 'other'];
      const rows = Object.entries(byPage).sort(([a], [b]) => {
        const ai = order.indexOf(a), bi = order.indexOf(b);
        return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
      });
      if (tbody) tbody.innerHTML = rows.map(([group, stats]) => `<tr>
        <td><strong>${esc(pageLabel(group))}</strong></td>
        <td>${Number(stats.page_view || 0)}</td>
        <td>${sumActions(stats)}</td>
        <td>${Number(stats.game_open || 0)}</td>
        <td>${Number(stats.game_accept || 0)}</td>
        <td>${Number(stats.game_complete || 0)}</td>
        <td>${Number(stats.no_action_45s || 0)}</td>
      </tr>`).join('') || '<tr><td colspan="7">Данных пока нет.</td></tr>';

      const events = document.querySelector('[data-funnel-events]');
      if (events) events.innerHTML = Object.entries(summary.byEvent || {})
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .map(([name, count]) => `<div class="mla-event"><span>${esc(eventLabel(name))}</span><b>${Number(count)}</b></div>`).join('') || '<div class="mla-event">Событий пока нет.</div>';
    } catch (error) {
      setError(error.message || 'Не удалось загрузить воронку.');
    } finally { setBusy(false); }
  };

  const showTab = (tab) => {
    activeTab = tab;
    document.querySelectorAll('[data-tab]').forEach((button) => button.classList.toggle('is-active', button.dataset.tab === tab));
    if (reviewPanel) reviewPanel.hidden = tab === 'funnel';
    if (funnelPanel) funnelPanel.hidden = tab !== 'funnel';
    if (tab === 'funnel') loadFunnel(); else loadReviews(tab);
  };

  document.addEventListener('click', async (event) => {
    const tab = event.target.closest?.('[data-tab]');
    if (tab) { showTab(String(tab.dataset.tab || 'pending')); return; }
    if (event.target.closest?.('[data-admin-refresh]')) { showTab(activeTab); return; }
    if (event.target.closest?.('[data-admin-lock]')) { lock(); return; }

    const moderate = event.target.closest?.('[data-moderate]');
    if (!moderate) return;
    const card = moderate.closest('[data-review-id]');
    if (!card) return;
    const status = String(moderate.dataset.moderate || '');
    const note = String(card.querySelector('[data-review-note]')?.value || '').trim();
    moderate.disabled = true;
    setError('');
    try {
      await request('', { method: 'POST', body: JSON.stringify({ action: 'moderate', id: card.dataset.reviewId, status, note }) });
      await loadReviews(activeTab);
    } catch (error) {
      setError(error.message || 'Не удалось изменить статус.');
      moderate.disabled = false;
    }
  });

  document.querySelector('[data-funnel-days]')?.addEventListener('change', loadFunnel);

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
      await loadReviews('pending');
    } catch (error) {
      if (loginError) loginError.textContent = error.message || 'Не удалось войти.';
    }
  });

  try { token = sessionStorage.getItem(TOKEN_KEY) || ''; } catch {}
  if (/^MLADM-[A-Za-z0-9_-]{30,100}$/.test(token)) {
    request('?status=pending').then(() => {
      if (login) login.hidden = true;
      if (app) app.hidden = false;
      loadReviews('pending');
    }).catch(() => lock());
  }
})();
