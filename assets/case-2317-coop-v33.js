(() => {
  'use strict';
  const root = document.querySelector('[data-case2317-app]');
  if (!root) return;

  const roomCode = () => (new URL(location.href).searchParams.get('room') || 'preview').trim().toUpperCase();
  const role = () => (root.querySelector('.case2317-role-label b')?.textContent || '').includes('Аналитик') ? 'guest' : 'creator';
  const stage = () => {
    const active = root.querySelector('.case2317-stage-tabs button.is-active')?.textContent || '';
    return Number(active.match(/^\s*(\d+)/)?.[1] || 1);
  };
  const hintKey = () => `mysterylogic:2317:v3:hints:${roomCode()}:${role()}`;
  const readHints = () => {
    try { return JSON.parse(localStorage.getItem(hintKey()) || '{}') || {}; }
    catch { return {}; }
  };
  const saveHints = (state) => { try { localStorage.setItem(hintKey(), JSON.stringify(state)); } catch {} };

  const HINTS = {
    creator: {
      1: [
        'В записи 112 важна не только речь. Сверьте точное время звука двери с тем, что может найти Аналитик.',
        'Если у напарника есть автомобиль Ильи в квартале, спросите: фиксирует ли его источник самого водителя или только машину?'
      ],
      2: [
        'Глина связывает автомобиль с технической зоной, но не с конкретным человеком. Для личности водителя нужен другой тип источника.',
        'Спросите Аналитика, есть ли момент, когда Вера и её автомобиль одновременно фиксируются в разных местах.'
      ],
      3: [
        'Серийный номер маяка полезен только вместе с независимым источником, который связывает этот номер с конкретным человеком.',
        'RB-17 указывает, где искать. Для обвинения Романа нужен исходный материал, который показывает его лично у автомобиля.'
      ]
    },
    guest: {
      1: [
        'Сотовый сектор показывает движение аппарата, а не человека. Для личности ищите независимый визуальный источник.',
        'Камеры квартала пока подтверждают автомобиль Ильи. Исходный пакет может дать Следователю более сильный факт.'
      ],
      2: [
        'Сведите по секундам камеру кафе и камеру Сервисного проезда. Один временной нахлёст меняет реконструкцию.',
        'RB-17 зарегистрирована на Романа, но владельца метки нельзя автоматически считать её носителем.'
      ],
      3: [
        'Пешеходный маршрут после оставленной машины сам по себе не доказывает, кто был за рулём. Нужен факт до начала поездки.',
        'Телефон Веры выключен в 23:47. Проверьте, есть ли независимый контакт с самой Верой после этого времени.'
      ]
    }
  };

  const currentHint = () => {
    const counts = readHints();
    const s = stage();
    const count = Math.max(0, Math.min(2, Number(counts[s]) || 0));
    return count ? HINTS[role()]?.[s]?.[count - 1] || '' : '';
  };
  const renderHint = () => {
    const actions = root.querySelector('.case2317-stage-actions');
    if (!actions) return;
    const s = stage();
    const counts = readHints();
    const count = Math.max(0, Math.min(2, Number(counts[s]) || 0));
    let box = root.querySelector('[data-v3-stage-hint]');
    if (count > 0) {
      if (!box) {
        box = document.createElement('div');
        box.className = 'case2317-hint';
        box.dataset.v3StageHint = '1';
        actions.insertAdjacentElement('beforebegin', box);
      }
      const text = currentHint();
      box.innerHTML = `<strong>Подсказка ${count}:</strong> ${text}`;
    } else box?.remove();
    const button = actions.querySelector('[data-action="hint"]');
    if (button) {
      button.disabled = count >= 2;
      button.textContent = count === 0 ? 'Нужна подсказка' : count === 1 ? 'Ещё одна подсказка' : 'Подсказки этапа использованы';
    }
  };

  const patchDecision = () => {
    root.querySelectorAll('.case2317-decision').forEach((section) => {
      if (!(section.querySelector('h3')?.textContent || '').includes('Куда направить срочный запрос')) return;
      const copy = [...section.children].find((node) => node.tagName === 'P' && !node.classList.contains('case2317-eyebrow'));
      const text = 'Сначала договоритесь с напарником об одном запросе; затем каждый подтвердите тот же вариант на своём экране. Выбирайте линию, которая закрывает самый опасный пробел в текущей реконструкции.';
      if (copy && copy.textContent !== text) copy.textContent = text;
    });
  };

  root.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-action="hint"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const counts = readHints();
    const s = stage();
    const current = Math.max(0, Math.min(2, Number(counts[s]) || 0));
    if (current >= 2) return;
    counts[s] = current + 1;
    saveHints(counts);
    renderHint();
    try { window.ym?.(111664459, 'reachGoal', 'coop_2317_hint_v3', { page_type: 'coop_2317', stage: s, role: role(), hint: counts[s] }); } catch {}
  }, true);

  let scheduled = false;
  const patch = () => { patchDecision(); renderHint(); };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; patch(); });
  };
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  patch();
  window.ML2317CoopV33 = Object.freeze({ revision: '3.3', stageScopedHints: true, pairedDecisionConfirmation: true });
})();