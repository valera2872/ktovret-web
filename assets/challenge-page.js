(() => {
  'use strict';

  const ENDPOINT = 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/challenge';
  const root = document.querySelector('[data-challenge-page]');
  if (!root) return;

  const code = new URL(location.href).searchParams.get('c')?.trim().toUpperCase() || '';

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const formatTime = (seconds) => {
    const value = Math.max(0, Number(seconds || 0));
    return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  };

  const hintLabel = (value) => Number(value) === 0 ? 'Без подсказок' : `Подсказок: ${Number(value)}`;
  const attemptLabel = (value) => Number(value) === 1 ? 'С первой попытки' : `Попыток: ${Number(value)}`;

  const renderError = (title, text) => {
    root.innerHTML = `
      <section class="challenge-card">
        <span class="challenge-kicker">Mystery Logic</span>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(text)}</p>
        <a class="challenge-button" href="../">На главную</a>
      </section>
    `;
  };

  const load = async () => {
    if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code)) {
      renderError('Вызов не найден', 'Ссылка неполная или повреждена. Попросите друга отправить её ещё раз.');
      return;
    }

    try {
      const response = await fetch(`${ENDPOINT}?code=${encodeURIComponent(code)}`, {
        headers: { accept: 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);

      const target = new URL(data.casePath, location.origin);
      target.searchParams.set('challenge', code);

      root.innerHTML = `
        <section class="challenge-card">
          <span class="challenge-kicker">Вам бросили вызов</span>
          <h1>${escapeHtml(data.caseTitle)}</h1>
          <p><strong>${escapeHtml(data.challenger.name)}</strong> уже раскрыл это дело. Правильный ответ и решение вам не показываются.</p>
          <div class="challenge-stats">
            <div><strong>${escapeHtml(formatTime(data.challenger.elapsedSeconds))}</strong><span>время</span></div>
            <div><strong>${escapeHtml(hintLabel(data.challenger.hintsUsed))}</strong><span>подсказки</span></div>
            <div><strong>${escapeHtml(attemptLabel(data.challenger.attempts))}</strong><span>точность</span></div>
          </div>
          <p class="challenge-question">Сможете расследовать лучше?</p>
          <a class="challenge-button" href="${escapeHtml(target.href)}">Принять вызов</a>
          <small>Без регистрации · сравнение появится после вашего решения</small>
        </section>
      `;
    } catch (error) {
      renderError(
        'Вызов больше недоступен',
        error?.message === 'challenge_expired'
          ? 'Срок этого вызова истёк. Откройте другое бесплатное дело Mystery Logic.'
          : 'Вызов не удалось загрузить. Сам сайт и обычные расследования продолжают работать.',
      );
    }
  };

  load();
})();
