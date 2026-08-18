(function (root) {
  'use strict';
  const definition = root.MysteryLogicInvestigationCase;
  if (!definition) return;

  definition.caseIntro = {
    messageDate: '17 октября · 21:27',
    sender: 'Павел Нестеров',
    message: 'Презентации не будет. Один из вас уже продал нашу игру.',
    morningDate: '18 октября · 08:30',
    morningFacts: [
      'Павел не отвечает.',
      'Его рабочий телефон остался в офисе.',
      'Финальная папка RELEASE удалена.',
      'Официальный накопитель ORBIT-2 отсутствует.',
    ],
    title: 'Последняя сборка',
    subtitle: 'Лгут все. Виновен один.',
    cta: 'Начать расследование',
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
