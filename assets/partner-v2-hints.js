(() => {
  'use strict';

  const root = document.querySelector('[data-partner-v2-app]');
  if (!root) return;

  const roomCode = () => {
    const value = String(new URL(location.href).searchParams.get('room') || '').trim().toUpperCase();
    return /^[A-HJ-NP-Z2-9]{8}$/.test(value) ? value : 'local';
  };
  const storageKey = () => `mysterylogic:partner-v2:${roomCode()}:photo-attempts`;
  const attempts = () => Math.max(0, Number(sessionStorage.getItem(storageKey()) || 0) || 0);
  const setAttempts = (value) => sessionStorage.setItem(storageKey(), String(Math.max(0, value)));
  const chapter = () => {
    const text = root.querySelector('.partner-v2-chapter-head small')?.textContent || '';
    const match = text.match(/\d+/);
    return match ? Number(match[0]) : 1;
  };

  const applyPhotoHint = () => {
    if (chapter() >= 3) {
      sessionStorage.removeItem(storageKey());
      return;
    }

    const gate = root.querySelector('[data-partner-v2-gate][data-checkpoint="photo_observation"]');
    const notice = gate?.querySelector('.partner-v2-gate-notice.is-wrong');
    if (!notice) return;

    const count = attempts();
    if (count >= 3) {
      notice.textContent = 'Сравните нижнюю правую часть корпуса и область под номером.';
      notice.dataset.hintLevel = '3';
      return;
    }
    if (count >= 2) {
      notice.textContent = 'Вы пока не доказали, что перед вами разные физические объекты. Обсудите повреждения корпуса. Номер контейнера в этой проверке бесполезен.';
      notice.dataset.hintLevel = '2';
    }
  };

  root.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-partner-v2-action="photo-submit"]');
    if (!button) return;
    const gate = button.closest('[data-partner-v2-gate][data-checkpoint="photo_observation"]');
    if (!gate) return;
    const fields = [...gate.querySelectorAll('[data-photo-field]')];
    if (fields.length < 3 || fields.some((field) => !field.value)) return;
    setAttempts(attempts() + 1);
  }, true);

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      applyPhotoHint();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  schedule();
  window.addEventListener('beforeunload', () => observer.disconnect());
})();
