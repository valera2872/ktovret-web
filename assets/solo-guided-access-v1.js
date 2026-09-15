(() => {
  const TOKEN_KEY = 'mysterylogic:guided-preview-token:v1';

  const decode = (value) => {
    try { return decodeURIComponent(String(value || '')); } catch { return String(value || ''); }
  };

  const extractToken = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const direct = decode(raw.replace(/^#/, ''));
    if (direct.startsWith('MLPREVIEW-')) return direct;

    try {
      const parsed = new URL(raw, location.href);
      const hashToken = decode(String(parsed.hash || '').replace(/^#/, ''));
      if (hashToken.startsWith('MLPREVIEW-')) return hashToken;
      const queryToken = decode(parsed.searchParams.get('token') || parsed.searchParams.get('preview') || '');
      if (queryToken.startsWith('MLPREVIEW-')) return queryToken;
    } catch {}

    const match = direct.match(/MLPREVIEW-[A-Za-z0-9._~-]+/);
    return match ? match[0] : '';
  };

  const readToken = () => {
    try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  };

  const saveToken = (token) => {
    try { sessionStorage.setItem(TOKEN_KEY, token); } catch {}
  };

  const tokenFromHash = extractToken(location.hash);
  if (tokenFromHash) saveToken(tokenFromHash);

  let dialog = null;

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'guided-notes';
    dialog.setAttribute('data-access-recovery', '');
    dialog.innerHTML = `
      <button class="guided-notes__close" type="button" data-access-close aria-label="Закрыть">×</button>
      <p class="guided-kicker">Персональный доступ</p>
      <h2>Вернёмся к расследованию</h2>
      <p class="guided-lead">Вставьте целиком персональную ссылку, по которой вы раньше открывали это дело. Можно вставить и сам ключ, начинающийся с MLPREVIEW-.</p>
      <input class="guided-choice" type="text" autocomplete="off" spellcheck="false" data-access-input placeholder="Вставьте персональную ссылку или MLPREVIEW-…">
      <p data-access-error style="min-height:1.4em;color:#f2b3ae;margin:12px 0 0"></p>
      <div class="guided-actions">
        <button class="guided-action" type="button" data-access-save>Продолжить расследование</button>
      </div>`;
    document.body.appendChild(dialog);

    dialog.querySelector('[data-access-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.querySelector('[data-access-input]')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveAndResume();
      }
    });
    dialog.querySelector('[data-access-save]')?.addEventListener('click', saveAndResume);
    return dialog;
  }

  function showRecovery() {
    const recovery = ensureDialog();
    const input = recovery.querySelector('[data-access-input]');
    const error = recovery.querySelector('[data-access-error]');
    if (error) error.textContent = '';
    if (!recovery.open) recovery.showModal();
    setTimeout(() => input?.focus(), 0);
  }

  function saveAndResume() {
    const recovery = ensureDialog();
    const input = recovery.querySelector('[data-access-input]');
    const error = recovery.querySelector('[data-access-error]');
    const token = extractToken(input?.value || '');
    if (!token) {
      if (error) error.textContent = 'В этой строке не найден персональный ключ MLPREVIEW-…';
      return;
    }

    saveToken(token);
    if (error) error.textContent = '';
    recovery.close();

    const retry = document.querySelector('[data-retry]');
    if (retry) {
      retry.click();
      return;
    }
    const enter = document.querySelector('[data-enter]');
    if (enter && !enter.disabled) enter.click();
  }

  document.addEventListener('click', (event) => {
    const enter = event.target.closest?.('[data-enter]');
    if (!enter || readToken() || extractToken(location.hash)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showRecovery();
  }, true);

  const stage = document.querySelector('[data-stage]');
  if (stage) {
    const observer = new MutationObserver(() => {
      const text = stage.textContent || '';
      const needsAccess = text.includes('Откройте расследование по персональной ссылке') || text.includes('Доступ к делу не подтверждён');
      if (!needsAccess) return;
      const actions = stage.querySelector('.guided-actions');
      if (!actions || actions.querySelector('[data-access-open]')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'guided-action secondary';
      button.dataset.accessOpen = '';
      button.textContent = 'Вставить персональную ссылку';
      button.addEventListener('click', showRecovery);
      actions.prepend(button);
    });
    observer.observe(stage, { childList: true, subtree: true, characterData: true });
  }
})();
