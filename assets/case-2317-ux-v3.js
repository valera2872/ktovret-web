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

  const patchHandoff = (section) => {
    const input = section.querySelector('input[data-handoff-key]');
    const done = section.classList.contains('is-complete');
    const r = role();
    const s = stage();
    const copy = directParagraph(section);
    const result = section.querySelector('.case2317-handoff-result strong');

    if (s === 1 && r === 'creator') {
      if (!done && copy) copy.textContent = 'У Аналитика есть ID исходного пакета камеры квартала. Получите его и запросите немаскированный кадр водителя.';
      if (input) input.placeholder = 'ID пакета камеры';
      if (done) {
        if (copy) copy.textContent = 'Исходный кадр Q7-29 / CAM-N2 · 23:12:18: Илья Кравцов лично выходит из водительской двери своего автомобиля и направляется к дому Веры. Лицо открыто и подтверждено по контрольной фотографии.';
        if (result) result.textContent = 'Q7-29: личность водителя установлена';
      }
    }

    if (s === 1 && r === 'guest') {
      if (!done && copy) copy.textContent = 'Следователь слышит в линии 112 два сигнала замка и тяжёлую дверь. Попросите назвать точное время этого звука по расшифровке.';
      if (input) input.placeholder = 'Например, 23:17:43';
      if (done) {
        if (copy) copy.textContent = '23:17:43.6 — дверь лестничного узла D-2147 открыта изнутри. Это совпадает со звуком линии 112. Дворовая дверь — отдельное событие: 23:21:06, QR Марины.';
        if (result) result.textContent = '23:17:43 сопоставлено с D-2147';
      }
    }

    if (s === 3 && r === 'creator') {
      if (!done && copy) copy.textContent = 'У Аналитика есть ID метки технического шлагбаума. Получите его и запросите исходную запись сервисной камеры за минуту до открытия.';
      if (input) input.placeholder = 'ID сервисной метки';
      if (done) {
        if (copy) copy.textContent = 'CAM-S2 · 23:30:52: Роман Белов лично входит в техническую зону и садится за руль автомобиля Веры. 23:31:44 шлагбаум открывается RB-17. Камера фиксирует лицо Романа до начала поездки; метка используется только как дополнительное совпадение.';
        if (result) result.textContent = 'CAM-S2: Роман лично у автомобиля';
      }
    }

    if (s === 3 && r === 'guest') {
      if (!done && copy) copy.textContent = 'Следователь нашёл серийный номер маяка под автомобилем. Получите его и проверьте резервную копию телефона Ильи.';
      if (done && result) result.textContent = '4F-7719 найден в приложении Ильи';
    }
  };

  const patchDecision = (section) => {
    const title = section.querySelector('h3')?.textContent || '';
    if (!title.includes('Куда направить срочный запрос')) return;
    const copy = directParagraph(section);
    if (copy) copy.textContent = 'Одна линия даст наиболее сильный новый факт о пока не установленном участнике. Обсудите, какой пробел в реконструкции сейчас самый опасный.';
    const labels = {
      ilya: ['Квартал после 23:29', 'Проверить, куда ушёл Илья после выезда его автомобиля.'],
      marina: ['Маршрут Веры и Марины', 'Получить дополнительную фиксацию их движения после кафе.'],
      parking: ['Техническая зона паркинга', 'Установить, кто получил физический доступ к машине Веры.']
    };
    section.querySelectorAll('[data-decision]').forEach((button) => {
      const item = labels[button.dataset.decision];
      if (!item) return;
      const strong = button.querySelector('strong');
      if (strong) strong.textContent = item[0];
      [...button.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).forEach((n) => n.remove());
      button.append(document.createTextNode(item[1]));
    });
    const feedback = section.querySelector('.case2317-decision-feedback');
    if (feedback) {
      const text = feedback.textContent || '';
      if (text.includes('Алиби Ильи уже разрушено')) feedback.textContent = 'После 23:29 новые кадры Ильи не объясняют, кто получил доступ к автомобилю Веры. Линия полезна для контроля, но ключевой пробел остаётся.';
      else if (text.includes('Камера кафе подтверждает')) feedback.textContent = 'Маршрут Веры и Марины подтверждается дополнительным кадром, но личность водителя автомобиля Веры всё ещё не установлена.';
      else if (text.includes('Новый пакет получен')) feedback.textContent = 'Получен пакет технической зоны: RB-17 открывает шлагбаум, а исходную сервисную камеру можно запросить через обмен с напарником.';
    }
    const drop = section.querySelector('.case2317-drop strong');
    if (drop) drop.textContent = 'Технический шлагбаум · RB-17 · пакет CAM-S2 доступен для сверки';
  };

  const patchFinal = (scope) => {
    const labels = {
      ilya_camera: 'Q7-29 + 4F-7719: Илья лично у дома и независимо связан с маяком',
      tracker: '00:16 + 00:18: Вера лично с Мариной и подтверждает безопасность',
      roman_route: 'CAM-S2 + пешие камеры: Роман лично связан с началом и концом маршрута машины',
      tea: '23:43: Вера и Марина вместе в кафе «Север»',
      seat: 'Кресло автомобиля отодвинуто на 11 см',
      draft: 'Черновик Веры о запасном выходе и оставленной машине'
    };
    scope.querySelectorAll('input[name="evidence"]').forEach((input) => {
      const label = input.closest('label');
      const text = labels[input.value];
      if (!label || !text) return;
      const span = label.querySelector('span');
      if (span) span.textContent = text;
    });
    const head = scope.querySelector('.case2317-final-evidence h3');
    const lead = scope.querySelector('.case2317-final-evidence > p');
    if (head) head.textContent = 'Выберите 3 доказательные цепочки';
    if (lead) lead.textContent = 'Нужна одна независимая цепочка на каждый критический тезис: Илья, безопасность Веры и водитель её автомобиля. Косвенный факт не заменяет личную идентификацию.';
  };

  const patchAudioUi = (scope) => {
    scope.querySelectorAll('[data-audio-marker] strong').forEach((node) => { if (node.textContent === 'D-2147') node.textContent = '23:17:43'; });
    scope.querySelectorAll('[data-audio-marker] .case2317-marker-note').forEach((node) => { node.textContent = 'Передайте Аналитику точное время звука. Он сможет сопоставить его с журналом дверей.'; });
    scope.querySelectorAll('[data-audio-cue]').forEach((node) => {
      if (node.textContent.includes('план Б')) node.textContent = 'Вера: «Не могу. Здесь есть другой выход. Марина уже знает».';
      if (node.textContent.includes('собирается выйти через двор')) node.textContent = 'Диспетчер просит оставаться внутри. Вера слышит дверь.';
    });
  };

  const patch = () => {
    root.querySelectorAll('.case2317-handoff').forEach(patchHandoff);
    root.querySelectorAll('.case2317-decision').forEach(patchDecision);
    patchFinal(root);
    patchAudioUi(root);
  };

  // The legacy verifier still stores the internal D-2147 token. Users exchange the real timestamp.
  root.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-action="handoff"][data-handoff-key="stage1"]');
    if (!button || role() !== 'guest' || stage() !== 1) return;
    const input = root.querySelector('input[data-handoff-key="stage1"]');
    if (input && String(input.value).trim().replace(/\s+/g, '') === '23:17:43') input.value = 'D-2147';
  }, true);

  // Correct the spoken reconstruction without changing browser/voice dependencies.
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

  new MutationObserver(patch).observe(root, { childList: true, subtree: true });
  patch();
  window.ML2317DetectiveV3 = Object.freeze({ revision: '3.0', fairPlay: true, personalIdentityRequired: true });
})();