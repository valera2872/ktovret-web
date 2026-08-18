(function (root) {
  'use strict';

  const definition = root.MysteryLogicInvestigationCase;
  if (!definition) return;

  const proofCopy = {
    presence: {
      label: 'Физическое присутствие',
      description: 'Приложите материалы, которые связывают выбранного вами исполнителя с офисом в критическое ночное окно. Один след сам по себе недостаточен.',
    },
    'borrowed-session': {
      label: 'Почему журнал показывает t.vlasov?',
      description: 'Объясните имя в журнале удаления: был ли владелец учётной записи за компьютером, работал удалённо или его локальная сессия могла быть использована другим человеком.',
    },
    'copy-device': {
      label: 'Кто контролировал носитель с копией?',
      description: 'Свяжите факт копирования RELEASE с конкретным физическим накопителем и независимо установите, с кем этот накопитель был связан.',
    },
    'prior-intent': {
      label: 'Предварительный умысел',
      description: 'Покажите, что получение clean build не было случайным результатом ночного визита, а имело предшествующую историю и цель.',
    },
    'alina-role': {
      label: 'Что скрывала Алина?',
      description: 'Разберите её ложь отдельно от вопроса о краже: какое нарушение она пыталась спрятать и к чему оно привело.',
    },
    'timur-role': {
      label: 'Что скрывал Тимур?',
      description: 'Установите, о каких технических нарушениях он соврал и связано ли это с внешней передачей сборки.',
    },
    'pavel-role': {
      label: 'Что произошло после 21:02?',
      description: 'Восстановите действия Павла после ухода ночного посетителя и судьбу официального носителя ORBIT-2.',
    },
  };

  for (const proof of definition.proofFamilies || []) {
    if (proofCopy[proof.id]) Object.assign(proof, proofCopy[proof.id]);
  }

  if (definition.resultTiers?.B) {
    definition.resultTiers.B.title = 'Версия пока не выдерживает предъявления';
    definition.resultTiers.B.text = 'В обвинительной цепочке остаётся как минимум одно критическое звено, которое не подтверждено приложенными материалами. Это не позволяет считать выбранного исполнителя доказанным.';
  }

  const materialPresentation = {
    'pavel-message': {
      kind: 'chat', title: 'Рабочий чат · команда «Кадр 17»', avatar: 'ПН', status: 'последняя активность 21:27', meta: ['17 октября', 'внутренний мессенджер'],
      messages: [{ author: 'Павел Нестеров', text: 'Презентации не будет. Один из вас уже продал нашу игру.', time: '21:27' }],
      caption: 'Сообщение выражает вывод Павла. Само по себе оно не устанавливает, кто и каким способом получил сборку.',
    },
    'delete-audit': {
      kind: 'log', title: 'DEMO-04 / endpoint audit', meta: ['17 октября', 'локальный аудит'],
      rows: [
        { time: '20:59:07', event: 'REMOVE', detail: '/RELEASE/final_build', critical: true },
        { time: '20:59:07', event: 'HOST', detail: 'DEMO-04' },
        { time: '20:59:07', event: 'SESSION', detail: 't.vlasov' },
      ],
      caption: 'Журнал фиксирует активную локальную сессию. Имя учётной записи не является идентификацией человека за компьютером.',
    },
    'roman-receipt': {
      kind: 'receipt', place: 'ПОРТ', address: 'ресторан · касса 02', paidAt: '18:12', meta: ['17 октября', 'кассовый документ + сообщение'],
      rows: [['Стол', '14'], ['Заказ', '№ 4812'], ['Оплата', 'карта']], messageTime: '20:47', message: 'Я всё ещё в Порту. Чек у Алины.',
      caption: 'Чек надёжно подтверждает оплату в 18:12. Он не подтверждает местонахождение отправителя два с половиной часа спустя.',
    },
    'access-log': {
      kind: 'access', meta: ['17 октября', 'контроллер дверей'],
      rows: [
        { time: '19:26', direction: 'out', subject: 'Тимур Власов', detail: 'постоянная карта', point: 'главный вход' },
        { time: '19:35', direction: 'out', subject: 'Алина Соколова', detail: 'офис закрыт', point: 'главный вход' },
        { time: '20:44', direction: 'in', subject: 'T-17', detail: 'временный пропуск', point: 'боковая дверь', night: true },
        { time: '21:02', direction: 'out', subject: 'T-17', detail: 'временный пропуск', point: 'боковая дверь', night: true },
      ],
      caption: 'Контроллер доказывает использование T-17, но не фотографирует владельца карты.',
    },
    't17-registry': {
      kind: 'registry', title: 'Временные пропуска', subtitle: 'административный реестр', meta: ['T-17', '17 октября'], columns: ['Поле', 'Значение'],
      rows: [
        { cells: [{ text: 'Выдан' }, { text: 'Роман Карский' }], focus: true },
        { cells: [{ text: 'Статус' }, { text: 'возвращён' }] },
        { cells: [{ text: 'Способ' }, { text: 'ручная отметка А. Соколовой' }], focus: true },
        { cells: [{ text: 'Физический scan-in' }, { text: 'отсутствует' }] },
        { cells: [{ text: 'Активен до' }, { text: '23:59 · 17 октября' }] },
      ],
      caption: 'Административная отметка и физическое возвращение пропуска — разные события.',
    },
    'guest-wifi': {
      kind: 'log', title: 'KADR17-GUEST / DHCP session', meta: ['17 октября', 'гостевая сеть'],
      rows: [
        { time: '20:46:03', event: 'CONNECT', detail: 'RK-Pixel', positive: true },
        { time: '20:46:03', event: 'KNOWN GUEST', detail: 'previous registration: Roman Karsky' },
        { time: '21:02:19', event: 'DISCONNECT', detail: 'RK-Pixel', positive: true },
      ],
      caption: 'Wi‑Fi связывает известное устройство с сетью студии в критический интервал, но не является GPS внутри помещения.',
    },
    'demo-session': {
      kind: 'log', title: 'DEMO-04 / session history', meta: ['17 октября', 'endpoint audit'],
      rows: [
        { time: '19:12', event: 'SESSION', detail: 't.vlasov · active' },
        { time: '19:26', event: 'DEV-02', detail: 'workstation leaves network' },
        { time: '20:48', event: 'WAKE', detail: 'DEMO-04 resumes' },
        { time: '20:48', event: 'LOGIN', detail: 'no new user login detected', positive: true },
      ],
      caption: 'Открытая локальная сессия объясняет, почему последующие действия могли записываться под t.vlasov без присутствия Тимура.',
    },
    nightsafe: {
      kind: 'log', title: 'NIGHTSAFE / backup manifest', meta: ['17 октября · 02:00', 'локальное хранилище'],
      rows: [
        { time: '02:00', event: 'JOB', detail: 'NIGHTSAFE backup' },
        { time: '02:00', event: 'STATUS', detail: 'SUCCESS', positive: true },
        { time: '02:00', event: 'OWNER', detail: 't.vlasov' },
        { time: '02:00', event: 'SCOPE', detail: 'final project package' },
        { time: '02:00', event: 'TRANSFER', detail: 'external: none', positive: true },
      ],
      caption: 'Тайный резерв нарушал распоряжение Павла, но журнал не показывает внешней передачи.',
    },
    'usb-audit': {
      kind: 'log', title: 'DEMO-04 / removable media audit', meta: ['17 октября', 'DLP / endpoint audit'],
      rows: [
        { time: '20:51', event: 'CONNECT', detail: 'ASTER-64 · A64-7731', critical: true },
        { time: '20:52', event: 'COPY START', detail: '/RELEASE/final_build → A64-7731', critical: true },
        { time: '20:57', event: 'COPY DONE', detail: '4.8 GB', critical: true },
        { time: '20:59', event: 'REMOVE', detail: '/RELEASE/final_build', critical: true },
        { time: '21:23', event: 'CONNECT', detail: 'ORBIT-2' },
        { time: '21:26', event: 'WRITE DONE', detail: 'full project package', positive: true },
      ],
      caption: 'Хронология важна: полная сборка была скопирована на ASTER-64 до удаления RELEASE.',
    },
    'guest02-assignment': {
      kind: 'registry', title: 'Выдача гостевого оборудования', subtitle: 'asset register', meta: ['15 октября'], columns: ['Устройство', 'Выдано', 'Возврат'],
      rows: [{ cells: [{ text: 'GUEST-02', code: true }, { text: 'Роман Карский' }, { text: '17:35' }], focus: true }],
      caption: 'Этот материал связывает гостевой ноутбук с человеком. Связь самого ASTER с GUEST-02 устанавливается отдельным журналом.',
    },
    'review-registry': {
      kind: 'registry', title: 'Обзорные сборки', subtitle: 'distribution registry', meta: ['15 октября · 16:20'], columns: ['Маркер', 'Получатель'],
      rows: [
        { cells: [{ text: 'A-01', code: true }, { text: 'Алина Соколова' }] },
        { cells: [{ text: 'T-02', code: true }, { text: 'Тимур Власов' }] },
        { cells: [{ text: 'R-03', code: true }, { text: 'Роман Карский' }], focus: true },
      ],
      caption: 'Сборки визуально одинаковы. Маркер нужен только для установления происхождения конкретного экземпляра.',
    },
    'nordlight-compliance': {
      kind: 'email', date: '17 октября · 10:15', subject: 'Compliance notice: KADR17 project materials', from: 'compliance@nordlight.example', to: 'Pavel Nesterov · KADR17', meta: ['внешняя переписка', 'входящее'],
      paragraphs: ['Мы получили предложение материалов проекта вашей студии от неизвестного контакта.', 'В пересланной цепочке контакт подписан инициалами R.K. и обещает предоставить clean final build до 22:00. Просим подтвердить, санкционирована ли передача.'],
      attachment: { name: 'review_capture.png', note: 'на изображении присутствует маркировка R-03' },
      caption: 'NordLight сообщает о предложении ещё до ночного копирования. Письмо не объясняет само по себе, кто физически пришёл в офис вечером.',
    },
    'orbit-source': {
      kind: 'compare', meta: ['21:23–21:26', 'сверка пакетов'],
      left: { label: 'локальный резерв', name: 'NIGHTSAFE/final_build.pkg', hash: 'SHA-256 · 8e9a…31c4' },
      right: { label: 'ORBIT-2', name: 'final_build.pkg', hash: 'SHA-256 · 8e9a…31c4' },
      verdict: 'Контрольные суммы совпадают: пакет на ORBIT-2 соответствует NIGHTSAFE без изменения содержимого.',
      caption: 'Совпадение показывает источник восстановленной копии. Оно не связывает ORBIT-2 с ASTER-64.',
    },
    'pavel-deposit': {
      kind: 'document', title: 'Квитанция цифрового депозита', meta: ['21:42', 'нотариальный офис «Контур»'],
      fields: [['Заявитель', 'Павел Нестеров'], ['Носитель', 'ORBIT-2'], ['Состав', 'пакет проекта, журналы доступа, системные логи'], ['Время приёма', '17 октября · 21:42']],
      caption: 'Материал разрешает судьбу Павла и ORBIT-2. Он не нужен для доказательства ночного исполнителя.',
    },
  };

  for (const material of definition.materials || []) {
    if (materialPresentation[material.id]) material.presentation = materialPresentation[material.id];
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);