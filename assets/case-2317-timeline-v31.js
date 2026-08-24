(() => {
  const data = window.MLCase2317;
  if (!data?.stages?.[2]) return;
  data.proofRevision = '3.2';
  data.coopRevision = '3.3';

  data.stages[0].objective = 'Сведите по секундам звонок, камеры и цифровые следы. Отмечайте, что каждый источник фиксирует напрямую, а что пока остаётся только версией.';
  const stage1Phone = data.stages[0].analyst.find((x) => x.type === 'log');
  if (stage1Phone) stage1Phone.facts = ['23:24 — телефон покидает домашнюю зону', '23:44 — сектор М-7', 'Кто несёт телефон — пока неизвестно'];
  const stage1Car = data.stages[0].analyst.find((x) => x.type === 'camera');
  if (stage1Car) stage1Car.facts = ['23:08–23:29 — автомобиль Ильи', 'Пакет исходника: Q7-29', 'Личность водителя на этом пакете не установлена'];

  data.stages[1].objective = 'Разведите по времени три линии: Веру, её телефон и её автомобиль. Найдите момент, после которого первоначальная картина перестаёт сходиться.';
  data.stages[2].title = 'Последний маршрут';
  data.stages[2].objective = 'Последние материалы должны связать людей с ключевыми действиями и закрыть временной разрыв после выключения телефона Веры.';

  const car = data.stages[1].analyst.find((x) => x.type === 'camera');
  const cafe = data.stages[1].analyst.find((x) => x.type === 'receipt');
  if (car) {
    car.title = '23:38–23:44 · автомобиль Веры';
    car.body = [
      '23:38:02 — камера на выезде из квартала фиксирует автомобиль Веры в направлении Сервисного проезда.',
      '23:44:36 — камера SP-3 на Сервисном проезде фиксирует тот же автомобиль в движении. Лицо водителя закрыто стойкой кузова.',
      'Светлая рабочая куртка встречается у нескольких сотрудников и сама по себе не определяет водителя.'
    ];
    car.facts = ['23:38–23:44 — автомобиль в движении', '23:44:36 — SP-3', 'Водитель пока не установлен'];
  }
  if (cafe) {
    cafe.title = '23:43:51–23:45:12 · Марина и Вера';
    cafe.body = [
      '23:43:51 — карта Марины Соболевой: кафе «Север», две чашки чая, вода и кабель USB-C.',
      'Фронтальная камера непрерывно показывает обеих посетительниц до 23:45:12. Марина и Вера узнаваемы по открытым лицам.',
      'В 23:44:36 Вера всё ещё видна в кафе. В эту же секунду другой источник фиксирует её автомобиль на Сервисном проезде.'
    ];
    cafe.facts = ['23:43:51–23:45:12 — Вера на камере кафе', '23:44:36 — одновременная фиксация автомобиля', 'Сопоставьте два источника по времени'];
  }

  const route = data.stages[2].analyst.find((x) => x.type === 'route');
  if (route) {
    route.body = [
      '23:44:36 — SP-3 фиксирует автомобиль Веры в движении; лицо водителя не видно.',
      '23:49:16 — камера у пешеходного моста фиксирует человека в рабочей куртке, идущего от участка, где позже найдена машина.',
      '23:55:04 — следующая камера даёт фронтальный кадр Романа Белова. CAM-S2 у Следователя содержит независимый фрагмент начала этого маршрута.'
    ];
    route.facts = ['23:44:36 — автомобиль на Сервисном проезде', '23:55:04 — Роман на пешем маршруте', 'Для начала маршрута нужен материал Следователя'];
  }

  const safety = data.stages[2].analyst.find((x) => x.type === 'call');
  if (safety) {
    safety.title = '00:18:32 · повторный звонок по карточке обращения';
    safety.body = [
      'В 00:18:32 с телефона Марины поступает обратный звонок по номеру обращения Веры. Оператор соединяет его с той же карточкой инцидента.',
      'Голос совпадает с записью 23:17. Звонившая называет адрес вызова и фразу, которую произнесла оператору до обрыва, после чего сообщает, что находится с Мариной в безопасном месте и просит проверить оставленный автомобиль.',
      'Камера дорожного пункта в 00:16 показывает Марину за рулём и Веру на пассажирском месте.'
    ];
    safety.facts = ['00:16 — фронтальный кадр Веры и Марины', '00:18 — голосовая проверка по карточке вызова', 'Контакт после 23:47 подтверждён'];
  }

  data.reveal.body[2] = 'RB-17 сама по себе не устанавливает личность. CAM-S2 лично фиксирует Романа у автомобиля Веры перед открытием шлагбаума, а камеры Сервисного проезда затем фиксируют его пеший возврат. Одновременно в 23:44:36 Вера всё ещё находится на фронтальной камере кафе, поэтому сама вести автомобиль она не могла.';

  if (typeof document === 'undefined') return;
  const root = document.querySelector('[data-case2317-app]');
  if (!root) return;
  const roomCode = () => (new URL(location.href).searchParams.get('room') || 'preview').trim().toUpperCase();
  const role = () => (root.querySelector('.case2317-role-label b')?.textContent || '').includes('Аналитик') ? 'guest' : 'creator';
  const stage = () => {
    const active = root.querySelector('.case2317-stage-tabs button.is-active')?.textContent || '';
    return Number(active.match(/^\s*(\d+)/)?.[1] || 1);
  };
  const hintKey = () => `mysterylogic:2317:v3:hints:${roomCode()}:${role()}`;
  const readHints = () => { try { return JSON.parse(localStorage.getItem(hintKey()) || '{}') || {}; } catch { return {}; } };
  const saveHints = (state) => { try { localStorage.setItem(hintKey(), JSON.stringify(state)); } catch {} };
  const HINTS = {
    creator: {
      1: ['В записи 112 важна не только речь. Сверьте точное время звука двери с тем, что может найти Аналитик.', 'Если у напарника есть автомобиль Ильи в квартале, спросите: фиксирует ли его источник самого водителя или только машину?'],
      2: ['Глина связывает автомобиль с технической зоной, но не с конкретным человеком. Для личности водителя нужен другой тип источника.', 'Спросите Аналитика, есть ли момент, когда Вера и её автомобиль одновременно фиксируются в разных местах.'],
      3: ['Серийный номер маяка полезен только вместе с независимым источником, который связывает этот номер с конкретным человеком.', 'RB-17 указывает, где искать. Для обвинения Романа нужен исходный материал, который показывает его лично у автомобиля.']
    },
    guest: {
      1: ['Сотовый сектор показывает движение аппарата, а не человека. Для личности ищите независимый визуальный источник.', 'Камеры квартала пока подтверждают автомобиль Ильи. Исходный пакет может дать Следователю более сильный факт.'],
      2: ['Сведите по секундам камеру кафе и камеру Сервисного проезда. Один временной нахлёст меняет реконструкцию.', 'RB-17 зарегистрирована на Романа, но владельца метки нельзя автоматически считать её носителем.'],
      3: ['Пешеходный маршрут после оставленной машины сам по себе не доказывает, кто был за рулём. Нужен факт до начала поездки.', 'Телефон Веры выключен в 23:47. Проверьте, есть ли независимый контакт с самой Верой после этого времени.']
    }
  };
  const renderHint = () => {
    const actions = root.querySelector('.case2317-stage-actions');
    if (!actions) return;
    const s = stage();
    const counts = readHints();
    const count = Math.max(0, Math.min(2, Number(counts[s]) || 0));
    let box = root.querySelector('[data-v3-stage-hint]');
    root.querySelectorAll('.case2317-hint:not([data-v3-stage-hint])').forEach((node) => node.remove());
    if (count > 0) {
      if (!box) {
        box = document.createElement('div');
        box.className = 'case2317-hint';
        box.dataset.v3StageHint = '1';
        actions.insertAdjacentElement('beforebegin', box);
      }
      const text = HINTS[role()]?.[s]?.[count - 1] || '';
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
  const patchCoop = () => { patchDecision(); renderHint(); };
  const scheduleCoop = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; patchCoop(); });
  };
  new MutationObserver(scheduleCoop).observe(root, { childList: true, subtree: true });
  patchCoop();
})();