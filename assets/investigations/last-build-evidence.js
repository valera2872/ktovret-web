(function (root) {
  'use strict';

  const definition = root.MysteryLogicInvestigationCase;
  if (!definition) return;
  const byId = new Map((definition.materials || []).map((item) => [item.id, item]));
  const set = (id, presentation) => { const item = byId.get(id); if (item) item.presentation = presentation; };

  set('pavel-message', {
    kind: 'message', app: 'Командный чат · Кадр 17', date: '17 октября',
    messages: [{ sender: 'Павел Нестеров', time: '21:27', text: 'Презентации не будет. Один из вас уже продал нашу игру.' }],
  });
  set('office-morning', {
    kind: 'scene', monitor: 'включён', image: '../../../assets/investigations/last-build-art/office-morning.webp',
    imageAlt: 'Офис студии утром 18 октября: рабочая станция включена, на столе открыт пустой футляр накопителя.',
    notes: ['DEMO-04 — общий компьютер для презентаций', 'Телефон Павла оставлен на зарядке', 'Папка RELEASE с готовой игрой удалена', 'Футляр официальной флешки ORBIT-2 пуст'],
  });
  set('initial-statements', {
    kind: 'statements',
    date: '18 октября · утро',
    place: 'Офис студии «Кадр 17»',
    lead: 'Сначала установите, кто перед вами и как каждый связан с проектом. Затем сопоставляйте их рассказ о вечере с уликами.',
    identityQuestion: 'Для протокола: представьтесь и объясните, как вы связаны со студией и этой игрой.',
    items: [
      {
        id: 'alina', number: '01', initials: 'АС', name: 'Алина Соколова',
        role: 'Операционный менеджер', relationship: 'Сотрудница студии',
        introduction: 'Я отвечаю за работу офиса: пропуска, документы, встречи и подготовку презентаций. Вечером закрывала помещение последней.',
        eventsQuestion: 'Что происходило с офисом и гостевыми пропусками вечером 17 октября?',
        text: 'Я закрыла офис около 19:35. К этому моменту все временные пропуска были возвращены. После закрытия я не возвращалась.',
      },
      {
        id: 'timur', number: '02', initials: 'ТВ', name: 'Тимур Власов',
        role: 'Технический руководитель', relationship: 'Сотрудник студии',
        introduction: 'Я отвечаю за техническую часть проекта и финальную версию игры. DEMO-04 — общий компьютер в переговорной, на котором утром должны были показать игру инвестору.',
        eventsQuestion: 'В каком состоянии вы оставили готовую версию игры перед уходом?',
        text: 'Я ушёл в 19:26. Готовую версию игры оставил на DEMO-04, свою сессию закрыл. Других копий не делал.',
      },
      {
        id: 'roman', number: '03', initials: 'РК', name: 'Роман Карский',
        role: 'Консультант инвестора', relationship: 'Не сотрудник студии',
        introduction: 'Я консультирую компанию, которая вкладывает деньги в игру. В студию приезжал проверить готовность проекта перед презентацией.',
        eventsQuestion: 'Когда вы покинули офис и какой доступ к материалам игры у вас оставался?',
        text: 'После 18:30 в офис я не возвращался. Ужинал в «Порту». Гостевой пропуск T-17 оставил на стойке ещё днём. У меня была только неполная версия игры для ознакомления.',
      },
    ],
  });
  set('delete-audit', {
    kind: 'terminal', title: 'КОМПЬЮТЕР DEMO-04 · ЖУРНАЛ ДЕЙСТВИЙ',
    lines: ['20:59:07  Папка удалена', 'Компьютер  DEMO-04', 'Сессия     t.vlasov', 'Путь       /RELEASE/final_build'],
    note: 'Журнал фиксирует активную локальную сессию, а не личность человека за клавиатурой.',
  });
  set('roman-receipt', {
    kind: 'receipt', venue: 'ПОРТ',
    lines: [{ label: 'Дата', value: '17 октября' }, { label: 'Оплата', value: '18:12' }],
    note: 'Кассовый документ', messageLabel: 'Сообщение Романа', messageTime: '20:47', message: 'Я всё ещё в Порту. Чек у Алины.',
    caution: 'Чек подтверждает оплату в 18:12. Он не подтверждает местонахождение в 20:47.',
  });
  set('r03-screenshot', {
    kind: 'screenshot', sceneTitle: 'закрытый уровень · preview', marker: 'review / R-03',
    caption: 'Маркировка находится на самом изображении и доступна с начала дела. Её значение пока неизвестно.',
  });
  set('studio-brief', {
    kind: 'web', url: 'kadr17.studio / team', kicker: 'ИГРОВАЯ СТУДИЯ · ЗАКРЫТАЯ ПРЕЗЕНТАЦИЯ', heading: 'Кадр 17',
    lead: 'Небольшая игровая студия готовит закрытую презентацию готовой версии игры утром 18 октября.',
    cards: [
      { title: 'Павел Нестеров', text: 'основатель и руководитель студии' }, { title: 'Тимур Власов', text: 'отвечает за техническую часть игры' },
      { title: 'Алина Соколова', text: 'отвечает за офис, документы и пропуска' }, { title: 'Роман Карский', text: 'представляет инвестора, не работает в студии' },
    ],
  });
  set('access-log', {
    kind: 'access', system: 'KADR17 · ACCESS CONTROL', period: '17 октября · вечер', status: 'LOG EXPORT', rows: [
      { left: '19:26', middle: 'Тимур Власов', right: 'выход · главный вход' },
      { left: '19:35', middle: 'Алина Соколова', right: 'выход · офис закрыт' },
      { left: '20:44', middle: 'T-17', right: 'вход · боковая дверь', emphasis: true },
      { left: '21:02', middle: 'T-17', right: 'выход · боковая дверь', emphasis: true },
    ],
  });
  set('t17-registry', {
    kind: 'registry', kicker: 'TEMPORARY ACCESS', heading: 'T-17', fields: [
      { label: 'Выдан', value: 'Роман Карский', emphasis: true }, { label: 'Статус', value: 'возвращён' },
      { label: 'Способ возврата', value: 'ручная отметка А. Соколовой', emphasis: true },
      { label: 'Физический scan-in', value: 'отсутствует' }, { label: 'Контроллер', value: 'активен до 23:59 17 октября' },
    ],
  });
  set('guest-wifi', {
    kind: 'terminal', title: 'KADR17-GUEST · session log',
    lines: ['20:46:03  client connected', 'Client     RK-Pixel', 'Known guest Roman Karsky', 'Previous registration: 16 Oct', '', '21:02:19  disconnected'],
    note: 'Это сетевой след устройства, а не GPS-координата человека.',
  });
  set('alina-correction', {
    kind: 'interview', initials: 'АС', name: 'Алина Соколова', role: 'операционный менеджер',
    quote: 'Никто мне T-17 в руки не отдавал. Роман написал, что оставил его на стойке. Я была завалена делами и просто отметила возврат вручную. Утром соврала, потому что испугалась ответственности.',
  });
  set('remote-audit', {
    kind: 'terminal', title: 'REMOTE ACCESS AUDIT · t.vlasov',
    lines: ['19:26  DEV-02 leaves corporate network', '19:26–21:10  VPN: none', '19:26–21:10  RDP: none', '19:26–21:10  remote-shell: none'],
    note: 'Отрицательный результат — тоже доказательство: сценарий дистанционного удаления Тимуром не получает поддержки.',
  });
  set('demo-session', {
    kind: 'terminal', title: 'DEMO-04 · session state',
    lines: ['19:12  local session t.vlasov ACTIVE', '19:26  DEV-02 leaves network', '20:48  DEMO-04 resumes from sleep', '20:48  new login event: NONE'],
    note: 'Локальная сессия t.vlasov оставалась открытой.',
  });
  set('timur-session-correction', {
    kind: 'interview', initials: 'ТВ', name: 'Тимур Власов', role: 'технический руководитель',
    quote: 'Да, сессию оставил открытой. На машине шёл ночной процесс, а блокировка мешала. Утром увидел t.vlasov в журнале удаления и соврал, потому что понял, как это выглядит.',
  });
  set('nightsafe', {
    kind: 'terminal', title: 'NIGHTSAFE · backup manifest',
    lines: ['17 Oct 02:00', 'JOB        NIGHTSAFE', 'STATUS     SUCCESS', 'OWNER      t.vlasov', 'SCOPE      final project package', 'LOCATION   local encrypted storage', 'EXTERNAL   none'],
    note: 'Резерв существует, но журнал не показывает его внешнюю передачу.',
  });
  set('timur-backup-correction', {
    kind: 'interview', initials: 'ТВ', name: 'Тимур Власов', role: 'технический руководитель',
    quote: 'NIGHTSAFE сделал я. Павел запретил локальные резервы, но я не согласился с единственной копией перед презентацией. Резерв никуда наружу не уходил.',
  });
  set('usb-audit', {
    kind: 'terminal', title: 'DEMO-04 · removable media audit',
    lines: ['20:51  ASTER-64 / A64-7731 connected', '20:52  transfer started: /RELEASE/final_build', '20:57  transfer completed: 4.8 GB', '20:59  /RELEASE/final_build removed', '', '21:23  ORBIT-2 connected', '21:26  full project package written'],
    note: 'Копирование на ASTER завершается до удаления RELEASE.',
  });
  set('aster-history', {
    kind: 'registry', kicker: 'DEVICE HISTORY', heading: 'A64-7731', fields: [
      { label: 'Дата', value: '15 октября · 16:08' }, { label: 'Событие', value: 'removable device connected' }, { label: 'Workstation', value: 'GUEST-02', emphasis: true },
    ],
  });
  set('guest02-assignment', {
    kind: 'registry', kicker: 'EQUIPMENT ISSUE', heading: 'GUEST-02', fields: [
      { label: 'Дата', value: '15 октября' }, { label: 'Выдан', value: 'Роман Карский', emphasis: true }, { label: 'Личное устройство', value: 'ASTER-64 / A64-7731', emphasis: true }, { label: 'Возвращён', value: '17:35' },
    ],
  });
  set('review-registry', {
    kind: 'registry', kicker: 'REVIEW BUILD DISTRIBUTION', heading: '15 октября · 16:20', fields: [
      { label: 'A-01', value: 'Алина Соколова' }, { label: 'T-02', value: 'Тимур Власов' }, { label: 'R-03', value: 'Роман Карский', emphasis: true },
    ], note: 'Визуально одинаковые сборки получили индивидуальные служебные маркеры.',
  });
  set('nordlight-compliance', {
    kind: 'email', from: 'compliance@nordlight', to: 'Павел Нестеров', time: '17 октября · 10:15', subject: 'Materials offered under Kadr 17 project',
    paragraphs: ['Неизвестный контакт предлагает материалы проекта студии «Кадр 17». Во вложении находится скриншот с маркировкой R-03.'],
    attachments: ['review_R-03.png'], forward: 'R.K.: clean final build смогу предоставить до 22:00.',
  });
  set('roman-presence-correction', {
    kind: 'interview', initials: 'РК', name: 'Роман Карский', role: 'консультант инвестора',
    context: 'После предъявления совокупности T-17, RK-Pixel и проблем позднего ресторанного алиби.',
    quote: 'Да, я коротко возвращался в офис. Забрать вещи из переговорной. Соврал только потому, что понимал, как будет выглядеть ночной визит.',
  });
  set('roman-aster-response', {
    kind: 'interview', initials: 'РК', name: 'Роман Карский', role: 'консультант инвестора',
    quote: 'Вы доказали, что этот накопитель был у меня раньше. Не кто держал его в 20:51.',
  });
  set('pavel-access', {
    kind: 'access', system: 'KADR17 · ACCESS / ENDPOINT', period: 'после 21:02', status: 'CORRELATION', rows: [
      { left: '21:02', middle: 'T-17', right: 'выход' }, { left: '21:10', middle: 'Павел Нестеров', right: 'служебный вход', emphasis: true }, { left: '21:14', middle: 'DEMO-04', right: 'активность' },
    ], note: 'Павел возвращается после копирования и удаления RELEASE.',
  });
  set('orbit-source', {
    kind: 'comparison', leftLabel: 'Локальный резерв', leftValue: 'NIGHTSAFE / final_build.pkg', leftHash: 'SHA-256 · MATCH',
    rightLabel: 'Официальный носитель', rightValue: 'ORBIT-2 / final_build.pkg', rightHash: 'SHA-256 · MATCH',
    note: 'Пакет на ORBIT-2 соответствует NIGHTSAFE. Это устанавливает источник восстановленной копии.',
  });
  set('pavel-deposit', {
    kind: 'document', office: 'Нотариальный офис «Контур»', heading: 'Квитанция цифрового депозита', number: '17 OCT · 21:42', fields: [
      { label: 'Заявитель', value: 'Павел Нестеров' }, { label: 'Носитель', value: 'ORBIT-2' }, { label: 'Состав', value: 'пакет проекта, журналы доступа, системные логи' },
    ], note: 'Позже юрист подтверждает, что Павел в безопасности и фиксировал авторство и доказательства.', stamp: 'ДЕПОЗИТ ПРИНЯТ',
  });
  set('alina-roman-t17-chat', {
    kind: 'message', app: 'Рабочий чат', date: '16 октября', messages: [
      { sender: 'Роман', time: '13:02', text: 'Я уже выехал. T-17 оставил у тебя на стойке.' }, { sender: 'Алина', time: '13:03', text: 'Ок, отмечу.', outgoing: true },
    ],
  });
  set('pavel-timur-backup-chat', {
    kind: 'message', app: 'Рабочий чат · engineering', date: 'до финальной сборки', messages: [
      { sender: 'Павел', text: 'После финальной сборки никаких локальных копий. Только RELEASE и официальный носитель.' },
      { sender: 'Тимур', text: 'Одна копия перед презентацией — это не контроль, а азартная игра.', outgoing: true },
      { sender: 'Павел', text: 'Мы это уже обсуждали.' }, { sender: 'Тимур', text: 'Именно поэтому я и не согласен.', outgoing: true },
    ],
  });
  set('roman-deal-context', {
    kind: 'email', from: 'рабочая переписка инвестора', to: 'Роман Карский', time: '16 октября', subject: 'Завтрашняя презентация / окно сделки',
    paragraphs: ['Контакт: Если они завтра закроют следующий транш, Павел опять снимет вопрос продажи.', 'Роман: Именно. Потом минимум полгода никто не будет обсуждать условия всерьёз.', 'Контакт: NordLight ещё заинтересованы?', 'Роман: Пока да.'],
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
