(() => {
  'use strict';
  const root = document.querySelector('[data-case2317-app]');
  if (!root) return;

  const role = () => (root.querySelector('.case2317-role-label b')?.textContent || '').includes('Аналитик') ? 'guest' : 'creator';
  const stage = () => {
    const active = root.querySelector('.case2317-stage-tabs button.is-active')?.textContent || '';
    return Number(active.match(/^\s*(\d+)/)?.[1] || 1);
  };
  const directParagraph = (section) => [...section.children].find((n) => n.tagName === 'P' && !n.classList.contains('case2317-eyebrow'));
  const setText = (node, text) => { if (node && node.textContent !== text) node.textContent = text; };

  const patchHandoff = (section) => {
    const input = section.querySelector('input[data-handoff-key]');
    const done = section.classList.contains('is-complete');
    const r = role();
    const s = stage();
    const stateKey = `${r}-${s}-${done ? 'done' : 'open'}`;
    if (section.dataset.mlV3Handoff === stateKey) return;
    section.dataset.mlV3Handoff = stateKey;
    const copy = directParagraph(section);
    const result = section.querySelector('.case2317-handoff-result strong');

    if (s === 1 && r === 'creator') {
      if (!done) setText(copy, 'У Аналитика есть ID исходного пакета камеры квартала. Получите его и запросите немаскированный кадр водителя.');
      if (input && input.placeholder !== 'ID пакета камеры') input.placeholder = 'ID пакета камеры';
      if (done) {
        setText(copy, 'Исходный кадр Q7-29 / CAM-N2 · 23:12:18: Илья Кравцов лично выходит из водительской двери своего автомобиля и направляется к дому Веры. Лицо открыто и подтверждено по контрольной фотографии.');
        setText(result, 'Q7-29: личность водителя установлена');
      }
    }

    if (s === 1 && r === 'guest') {
      if (!done) setText(copy, 'Следователь слышит в линии 112 два сигнала замка и тяжёлую дверь. Попросите назвать точное время этого звука по расшифровке.');
      if (input && input.placeholder !== 'Например, 23:17:43') input.placeholder = 'Например, 23:17:43';
      if (done) {
        setText(copy, '23:17:43.6 — дверь лестничного узла D-2147 открыта изнутри. Это совпадает со звуком линии 112. Дворовая дверь — отдельное событие: 23:21:06, QR Марины.');
        setText(result, '23:17:43 сопоставлено с D-2147');
      }
    }

    if (s === 3 && r === 'creator') {
      if (!done) setText(copy, 'У Аналитика есть ID метки технического шлагбаума. Получите его и запросите исходные сервисные камеры перед открытием.');
      if (input && input.placeholder !== 'ID сервисной метки') input.placeholder = 'ID сервисной метки';
      if (done) {
        setText(copy, 'CAM-S1 · 23:27:14: Марина Соболева у сервисной двери передаёт Роману Белову чёрный ключ-брелок с оранжевым тканевым хлястиком; лица обоих открыты. CAM-S2 · 23:30:52: Роман нажимает брелок с тем же оранжевым хлястиком — автомобиль Веры мигает габаритами и отпирается, после чего Роман садится за руль. В 23:31:44 шлагбаум открывается RB-17.');
        setText(result, 'CAM-S1/S2: переданный брелок открывает машину Веры');
      }
    }

    if (s === 3 && r === 'guest') {
      if (!done) setText(copy, 'Следователь нашёл серийный номер физического маяка под автомобилем. Получите номер и выполните точный поиск по резервной копии телефона Ильи.');
      if (input && input.placeholder !== 'Серийный номер маяка') input.placeholder = 'Серийный номер маяка';
      if (done) {
        setText(copy, 'Точный поиск по 4F-7719: в приложении мониторинга Ильи устройство записано как «CAR-V». История карточки показывает запрос координат в 23:05:48, а последний сохранённый экран в 23:06 — карту квартала Веры. Физический маяк и запись резервной копии совпадают по серийному номеру.');
        setText(result, '4F-7719: физический маяк совпал с «CAR-V»');
      }
    }
  };

  const patchDecision = (section) => {
    const title = section.querySelector('h3')?.textContent || '';
    if (!title.includes('Куда направить срочный запрос') || section.dataset.mlV3Decision === '1') return;
    section.dataset.mlV3Decision = '1';
    setText(directParagraph(section), 'Одна линия даст наиболее сильный новый факт о пока не установленном участнике. Обсудите, какой пробел в реконструкции сейчас самый опасный.');
    const labels = {
      ilya: ['Квартал после 23:29', 'Проверить, куда ушёл Илья после выезда его автомобиля.'],
      marina: ['Маршрут Веры и Марины', 'Получить дополнительную фиксацию их движения после кафе.'],
      parking: ['Техническая зона паркинга', 'Установить, кто получил физический доступ к машине Веры.']
    };
    section.querySelectorAll('[data-decision]').forEach((button) => {
      const item = labels[button.dataset.decision];
      if (!item) return;
      setText(button.querySelector('strong'), item[0]);
      const currentTail = [...button.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.nodeValue).join('').trim();
      if (currentTail !== item[1]) {
        [...button.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).forEach((n) => n.remove());
        button.append(document.createTextNode(item[1]));
      }
    });
    const feedback = section.querySelector('.case2317-decision-feedback');
    if (feedback) {
      const text = feedback.textContent || '';
      if (text.includes('Алиби Ильи уже разрушено')) setText(feedback, 'После 23:29 новые кадры Ильи не объясняют, кто получил доступ к автомобилю Веры. Линия полезна для контроля, но ключевой пробел остаётся.');
      else if (text.includes('Камера кафе подтверждает')) setText(feedback, 'Дополнительный маршрут Веры и Марины не устанавливает водителя автомобиля Веры. Ключевой пробел остаётся.');
      else if (text.includes('Новый пакет получен')) setText(feedback, 'Получен пакет технической зоны: RB-17 открывает шлагбаум, а исходные сервисные камеры можно запросить через обмен с напарником.');
    }
    setText(section.querySelector('.case2317-drop strong'), 'Технический шлагбаум · RB-17 · пакет CAM-S1/S2 доступен для сверки');
  };

  const patchFinal = (scope) => {
    const labels = {
      ilya_camera: 'Q7-29 · исходный кадр CAM-N2, 23:12:18',
      tracker: '4F-7719 · физический маяк и карточка резервной копии',
      roman_route: 'CAM-S1/S2 + SP-3 · сервисная зона и последующий маршрут',
      tea: 'Кафе «Север» · операция по карте и фототаблица',
      seat: 'Осмотр автомобиля · кресло, зеркало и грунт',
      draft: 'Черновик Веры · 22:52'
    };
    scope.querySelectorAll('input[name="evidence"]').forEach((input) => {
      const text = labels[input.value];
      if (text) setText(input.closest('label')?.querySelector('span'), text);
    });
    setText(scope.querySelector('.case2317-final-evidence h3'), 'Выберите 3 опоры вашей версии');
    setText(scope.querySelector('.case2317-final-evidence > p'), 'Выберите любые три материала, на которых держится ваша версия. Это не тест на «правильную тройку»: качество выбора станет видно только после раскрытия.');
  };

  const patchAudioUi = (scope) => {
    scope.querySelectorAll('[data-audio-marker] strong').forEach((node) => { if (node.textContent === 'D-2147') setText(node, '23:17:43'); });
    scope.querySelectorAll('[data-audio-marker] .case2317-marker-note').forEach((node) => setText(node, 'Передайте Аналитику точное время звука. Он сможет сопоставить его с журналом дверей.'));
    scope.querySelectorAll('[data-audio-cue]').forEach((node) => {
      if (node.textContent.includes('план Б')) setText(node, 'Вера: «Не могу. Здесь есть другой выход. Марина уже знает».');
      if (node.textContent.includes('собирается выйти через двор')) setText(node, 'Диспетчер просит оставаться внутри. Вера слышит дверь.');
    });
  };

  const patchLegacyToast = () => {
    document.querySelectorAll('.case2317-toast').forEach((node) => {
      if ((node.textContent || '').includes('D-2147')) {
        setText(node, 'В записи отмечен звук двери в 23:17:43. Передайте Аналитику точное время.');
      }
    });
  };

  const patch = () => {
    root.querySelectorAll('.case2317-handoff').forEach(patchHandoff);
    root.querySelectorAll('.case2317-decision').forEach(patchDecision);
    patchFinal(root);
    patchAudioUi(root);
    patchLegacyToast();
  };

  root.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-action="handoff"][data-handoff-key="stage1"]');
    if (!button || role() !== 'guest' || stage() !== 1) return;
    const input = root.querySelector('input[data-handoff-key="stage1"]');
    if (input && String(input.value).trim().replace(/\s+/g, '') === '23:17:43') input.value = 'D-2147';
  }, true);

  try {
    const synth = window.speechSynthesis;
    if (synth?.speak && !synth.__ml2317v3) {
      const original = synth.speak.bind(synth);
      synth.speak = (utterance) => {
        try {
          if (utterance?.text === 'Если я не отвечу через десять минут, скажите Марине, что план Б.') utterance.text = 'Не могу. Здесь есть другой выход. Марина уже знает.';
          if (utterance?.text === 'Я должна уйти через двор. Подождите.') utterance.text = 'Подождите. Я слышу дверь.';
        } catch {}
        return original(utterance);
      };
      synth.__ml2317v3 = true;
    }
  } catch {}

  let scheduled = false;
  const schedulePatch = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; patch(); });
  };
  new MutationObserver(schedulePatch).observe(root, { childList: true, subtree: true });
  patch();
  window.ML2317DetectiveV3 = Object.freeze({ revision: '3.7', fairPlay: true, personalIdentityRequired: true, coordinationProved: true, transferredKeyProved: true, serialHandoffRequired: true, legacyCodeHidden: true, idempotentDomPatch: true, spoilerNeutralFinal: true });
})();
