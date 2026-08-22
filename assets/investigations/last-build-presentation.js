(function (root) {
  'use strict';

  const definition = root.MysteryLogicInvestigationCase;
  if (!definition) {
    return;
  }

  const copy = {
    presence: {
      label: 'Физическое присутствие',
      description:
        'Приложите материалы, которые связывают выбранного вами исполнителя с офисом в критическое ночное окно. Один след сам по себе недостаточен.',
    },
    'borrowed-session': {
      label: 'Почему журнал показывает t.vlasov?',
      description:
        'Объясните имя в журнале удаления: был ли владелец учётной записи за компьютером, работал удалённо или его локальная сессия могла быть использована другим человеком.',
    },
    'copy-device': {
      label: 'Кто контролировал носитель с копией?',
      description:
        'Свяжите факт копирования RELEASE с конкретным физическим накопителем и независимо установите, с кем этот накопитель был связан.',
    },
    'prior-intent': {
      label: 'Предварительный умысел',
      description:
        'Покажите, что получение clean build не было случайным результатом ночного визита, а имело предшествующую историю и цель.',
    },
    'alina-role': {
      label: 'Что скрывала Алина?',
      description:
        'Разберите её ложь отдельно от вопроса о краже: какое нарушение она пыталась спрятать и к чему оно привело.',
    },
    'timur-role': {
      label: 'Что скрывал Тимур?',
      description:
        'Установите, о каких технических нарушениях он соврал и связано ли это с внешней передачей сборки.',
    },
    'pavel-role': {
      label: 'Что произошло после 21:02?',
      description:
        'Восстановите действия Павла после ухода ночного посетителя и судьбу официального носителя ORBIT-2.',
    },
  };

  for (const proof of definition.proofFamilies || []) {
    if (copy[proof.id]) {
      proof.label = copy[proof.id].label;
      proof.description = copy[proof.id].description;
    }
  }

  if (definition.resultTiers?.B) {
    definition.resultTiers.B.title = 'Версия пока не выдерживает предъявления';
    definition.resultTiers.B.text =
      'В обвинительной цепочке остаётся как минимум одно критическое звено, которое не подтверждено приложенными материалами. Это не позволяет считать выбранного исполнителя доказанным.';
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);