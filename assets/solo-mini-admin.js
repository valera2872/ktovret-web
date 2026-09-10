(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/puzzle-editorial';
  const TOKEN_KEY = 'mysterylogic:review-admin-token:v1';
  const KIND = 'solo_mini_case';
  const login = document.querySelector('[data-admin-login]');
  const app = document.querySelector('[data-admin-app]');
  const loginForm = document.querySelector('[data-admin-login-form]');
  const tokenInput = document.querySelector('[data-admin-token]');
  const loginError = document.querySelector('[data-admin-login-error]');
  const appError = document.querySelector('[data-admin-error]');
  const list = document.querySelector('[data-mini-list]');
  const empty = document.querySelector('[data-mini-empty]');
  let token = '';
  let activeTab = 'pending';

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

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
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
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

  const statusLabel = (status) => ({ pending: 'На проверке', approved: 'Утверждено', rejected: 'Отклонено' }[status] || status);
  const evidenceBlock = (items = []) => items.length ? `<div class="smra-evidence">${items.map((item) => `<article><small>${esc(item.label || 'Улика')}</small><strong>${esc(item.title || '')}</strong><div>${esc(item.body || item.value || '')}</div></article>`).join('')}</div>` : '';
  const factsBlock = (items = []) => items.length ? `<div class="smra-facts">${items.map((item) => `<div class="smra-fact"><small>${esc(item.label || 'Материал')}</small>${esc(item.value || item.body || '')}</div>`).join('')}</div>` : '';
  const checkpointBlock = (checkpoint = null) => {
    if (!checkpoint) return '';
    const choices = Array.isArray(checkpoint.choices) ? checkpoint.choices : [];
    return `<div class="smra-checkpoint"><strong>Промежуточный вывод</strong><p>${esc(checkpoint.prompt || '')}</p>${choices.length ? `<ul>${choices.map((choice) => `<li class="${choice[0] === checkpoint.correct ? 'correct' : ''}">${esc(choice[1] || choice[0])}${choice[0] === checkpoint.correct ? ' ✓' : ''}</li>`).join('')}</ul>` : ''}${checkpoint.success ? `<p class="correct">${esc(checkpoint.success)}</p>` : ''}</div>`;
  };
  const roundsBlock = (rounds = []) => rounds.length ? `<section class="smra-section"><h4>Раунды расследования</h4>${rounds.map((round, index) => `<div class="smra-round"><strong>${index + 1}. ${esc(round.title || `Раунд ${index + 1}`)}</strong>${evidenceBlock(round.evidence || [])}${checkpointBlock(round.checkpoint)}${round.redHerring ? `<div class="smra-redherring"><strong>${esc(round.redHerring.title || 'Ложный след')}</strong><div>${esc(round.redHerring.body || '')}</div></div>` : ''}</div>`).join('')}</section>` : '';
  const suspectsBlock = (p = {}) => {
    const suspects = Array.isArray(p.suspects) ? p.suspects : (Array.isArray(p.characters) ? p.characters : []);
    if (!suspects.length) return '';
    return `<section class="smra-section"><h4>Люди и показания</h4><div class="smra-suspects">${suspects.map((s) => `<article class="smra-suspect"><strong>${esc(s.name || '')}</strong><em>${esc(s.role || '')}</em><p>${esc(s.statement || '')}</p></article>`).join('')}</div></section>`;
  };
  const timelineBlock = (items = []) => items.length ? `<section class="smra-section"><h4>Хронология</h4><div class="smra-timeline">${items.map((item) => `<div class="smra-time"><time>${esc(item.time || '')}</time><div><strong>${esc(item.title || '')}</strong>${item.detail ? `<div>${esc(item.detail)}</div>` : ''}</div></div>`).join('')}</div></section>` : '';
  const solutionBlock = (p = {}) => {
    const explanation = p.explanation || {};
    const steps = Array.isArray(p.reconstruction) ? p.reconstruction : (Array.isArray(explanation.reasoningSteps) ? explanation.reasoningSteps : []);
    const reason = p.reveal || explanation.fullReason || '';
    const verdict = p.verdict || explanation.shortReason || '';
    return `<section class="smra-section"><h4>Финальная реконструкция</h4><div class="smra-solution">${p.culprit ? `<p><strong>Ключевой персонаж:</strong> ${esc(p.culprit)}</p>` : ''}${verdict ? `<p><strong>Вердикт:</strong> ${esc(verdict)}</p>` : ''}${reason ? `<p>${esc(reason)}</p>` : ''}${steps.length ? `<ol>${steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>` : ''}${p.lesson ? `<p><strong>Принцип:</strong> ${esc(p.lesson)}</p>` : ''}${p.lessonCopy ? `<p>${esc(p.lessonCopy)}</p>` : ''}</div></section>`;
  };

  const card = (row) => {
    const p = row.content || {};
    const status = String(row.moderation_status || 'pending');
    const blocked = Boolean(p.editorialWarning);
    const number = String(row.puzzle_id || '').split(':').pop() || '';
    return `<article class="smra-card is-${esc(status)}" data-case-id="${esc(row.puzzle_id)}">
      <header class="smra-card-head">
        <div><div class="smra-number">MINI ${esc(number)}</div><h3>${esc(row.title || p.title || row.puzzle_id)}</h3><p class="smra-subtitle">${esc(p.subtitle || p.shortDescription || '')}</p></div>
        <div class="smra-badges"><span class="smra-badge status-${esc(status)}">${esc(statusLabel(status))}</span>${p.difficulty ? `<span class="smra-badge">${esc(p.difficulty)}</span>` : ''}${p.duration ? `<span class="smra-badge">${esc(p.duration)}</span>` : ''}${p.category ? `<span class="smra-badge">${esc(p.category)}</span>` : ''}</div>
      </header>
      <div class="smra-card-grid">
        <div class="smra-content">
          ${p.editorialWarning ? `<div class="smra-editor-warning">⚠ ${esc(p.editorialWarning)}</div>` : ''}
          ${p.intro ? `<p class="smra-intro">${esc(p.intro)}</p>` : ''}
          ${p.question ? `<section class="smra-section"><h4>Задача игрока</h4><div class="smra-question">${esc(p.question)}</div></section>` : ''}
          ${roundsBlock(Array.isArray(p.rounds) ? p.rounds : [])}
          ${Array.isArray(p.facts) && p.facts.length ? `<section class="smra-section"><h4>Материалы дела</h4>${factsBlock(p.facts)}</section>` : ''}
          ${timelineBlock(Array.isArray(p.timeline) ? p.timeline : [])}
          ${suspectsBlock(p)}
          ${solutionBlock(p)}
        </div>
        <aside class="smra-side">
          <p class="mla-kicker">Редакторское решение</p>
          <label>Заметка<textarea data-case-note placeholder="Что изменить, усилить или проверить…">${esc(row.moderation_note || '')}</textarea></label>
          <div class="smra-actions">
            ${status !== 'approved' ? `<button type="button" class="smra-approve" data-moderate="approved" ${blocked ? 'disabled title="Сначала исправьте отмеченное противоречие"' : ''}>${blocked ? 'Сначала исправить дефект' : 'Утвердить дело'}</button>` : ''}
            ${status !== 'rejected' ? '<button type="button" class="smra-reject" data-moderate="rejected">Отклонить</button>' : ''}
            ${status !== 'pending' ? '<button type="button" class="smra-reset" data-moderate="pending">Вернуть на проверку</button>' : ''}
          </div>
          <div class="smra-state" data-save-state></div>
          <div class="smra-release-note"><strong>Публикация:</strong> ${status === 'approved' ? 'решение сохранено, но дело всё ещё не публикуется автоматически.' : 'закрыта до вашего утверждения.'}<br>Fingerprint фиксирует именно содержимое <code>content</code>.</div>
        </aside>
      </div>
    </article>`;
  };

  const updateCounts = (counts = {}) => {
    for (const key of ['pending', 'approved', 'rejected']) {
      const node = document.querySelector(`[data-count="${key}"]`);
      if (node) node.textContent = String(Number(counts[key] || 0));
    }
    const progress = document.querySelector('[data-review-progress]');
    if (progress) progress.textContent = `${Number(counts.approved || 0) + Number(counts.rejected || 0)}/10`;
    const warning = document.querySelector('[data-global-warning]');
    if (warning) {
      const approved = Number(counts.approved || 0);
      warning.hidden = approved !== 10;
      if (approved === 10) warning.textContent = 'Все 10 дел утверждены. Это всё ещё не публикация: следующий релиз обязан сверить fingerprints и только после этого создать публичные страницы.';
    }
  };

  const load = async () => {
    if (appError) appError.textContent = '';
    app?.classList.add('mla-loading');
    try {
      const body = await request(`?status=${encodeURIComponent(activeTab)}&kind=${encodeURIComponent(KIND)}`);
      const rows = Array.isArray(body.puzzles) ? body.puzzles : [];
      updateCounts(body.counts || {});
      if (list) list.innerHTML = rows.map(card).join('');
      if (empty) empty.hidden = rows.length !== 0;
    } catch (error) {
      if (appError) appError.textContent = error.message || String(error);
    } finally {
      app?.classList.remove('mla-loading');
    }
  };

  const moderate = async (article, status) => {
    const id = article?.dataset.caseId || '';
    const note = article?.querySelector('[data-case-note]')?.value || '';
    const state = article?.querySelector('[data-save-state]');
    if (!id) return;
    if (state) state.textContent = 'Сохраняю…';
    try {
      await request('', { method: 'POST', body: JSON.stringify({ action: 'moderate', id, status, note }) });
      if (state) state.textContent = 'Сохранено';
      await load();
    } catch (error) {
      if (state) state.textContent = error.message || String(error);
    }
  };

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const value = String(tokenInput?.value || '').trim();
    if (!/^MLADM-[A-Za-z0-9_-]{30,100}$/.test(value)) {
      if (loginError) loginError.textContent = 'Проверьте формат ключа.';
      return;
    }
    token = value;
    try {
      const test = await request(`?status=pending&kind=${encodeURIComponent(KIND)}`);
      try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
      if (loginError) loginError.textContent = '';
      if (login) login.hidden = true;
      if (app) app.hidden = false;
      updateCounts(test.counts || {});
      if (list) list.innerHTML = (test.puzzles || []).map(card).join('');
      if (empty) empty.hidden = Boolean((test.puzzles || []).length);
    } catch (error) {
      if (loginError) loginError.textContent = error.message || String(error);
    }
  });

  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-tab]');
    if (tab) {
      activeTab = tab.dataset.tab || 'pending';
      document.querySelectorAll('[data-tab]').forEach((node) => node.classList.toggle('is-active', node === tab));
      load();
      return;
    }
    if (event.target.closest('[data-admin-refresh]')) { load(); return; }
    if (event.target.closest('[data-admin-lock]')) { lock(); return; }
    const button = event.target.closest('[data-moderate]');
    if (button && !button.disabled) moderate(button.closest('[data-case-id]'), button.dataset.moderate);
  });

  try {
    const saved = sessionStorage.getItem(TOKEN_KEY) || '';
    if (/^MLADM-[A-Za-z0-9_-]{30,100}$/.test(saved)) {
      token = saved;
      if (login) login.hidden = true;
      if (app) app.hidden = false;
      load();
    }
  } catch {}
})();
