(function (root) {
  'use strict';

  const definition = root.MysteryLogicInvestigationCase;
  if (!definition) return;

  const materialIds = new Set((definition.materials || []).map((item) => item.id));
  const actionIds = new Set((definition.actions || []).map((item) => item.id));

  const materials = [
    {
      id: 'alina-roman-t17-chat',
      title: 'Переписка о возврате T-17',
      type: 'Сообщение',
      body: '16 октября · 13:02\n\nРоман: «Я уже выехал. T-17 оставил у тебя на стойке.»\nАлина: «Ок, отмечу.»',
      grantsFacts: ['roman_claimed_t17_left_in_chat'],
      peopleRefs: ['alina', 'roman'],
    },
    {
      id: 'pavel-timur-backup-chat',
      title: 'Спор Павла и Тимура о резервных копиях',
      type: 'Сообщение',
      body: 'Рабочий чат\n\nПавел: «После финальной сборки никаких локальных копий. Только RELEASE и официальный носитель.»\nТимур: «Одна копия перед презентацией — это не контроль, а азартная игра.»\nПавел: «Мы это уже обсуждали.»\nТимур: «Именно поэтому я и не согласен.»',
      grantsFacts: ['timur_backup_conflict_known'],
      peopleRefs: ['pavel', 'timur'],
    },
    {
      id: 'roman-deal-context',
      title: 'Деловая переписка перед презентацией',
      type: 'Внешняя переписка',
      body: '16 октября\n\nКонтакт инвестора: «Если они завтра закроют следующий транш, Павел опять снимет вопрос продажи.»\nРоман: «Именно. Потом минимум полгода никто не будет обсуждать условия всерьёз.»\nКонтакт: «NordLight ещё заинтересованы?»\nРоман: «Пока да.»',
      grantsFacts: ['deal_pressure_context_known'],
      peopleRefs: ['roman', 'pavel'],
    },
  ];

  const actions = [
    {
      id: 'inspect-t17-chat',
      label: 'Проверить переписку по возврату T-17',
      description: 'Ручная отметка возврата должна иметь рабочее основание: кто и что сообщил Алине.',
      requiresAllFacts: ['t17_manual_return'],
      revealsMaterials: ['alina-roman-t17-chat'],
    },
    {
      id: 'inspect-backup-conflict',
      label: 'Проверить предысторию спора о резервных копиях',
      description: 'Тайный NIGHTSAFE мог быть не разовой импровизацией, а продолжением рабочего конфликта.',
      requiresAnyFacts: ['nightsafe_exists', 'timur_admits_session_open'],
      revealsMaterials: ['pavel-timur-backup-chat'],
    },
    {
      id: 'inspect-deal-context',
      label: 'Проверить деловой контекст перед презентацией',
      description: 'Обещание clean build объясняет что хотели получить. Отдельно стоит понять, почему важен именно этот вечер.',
      requiresAllFacts: ['nordlight_clean_build_promise'],
      revealsMaterials: ['roman-deal-context'],
    },
  ];

  for (const material of materials) {
    if (!materialIds.has(material.id)) definition.materials.push(material);
  }
  for (const action of actions) {
    if (!actionIds.has(action.id)) definition.actions.push(action);
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
