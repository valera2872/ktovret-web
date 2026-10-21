(function (root) {
  'use strict';
  const definition = root.MysteryLogicInvestigationCase;
  if (!definition) return;

  definition.investigationQuestions = [
    {
      id: 'release-fate',
      text: 'Что произошло с финальной сборкой до удаления RELEASE?',
      requiresAllFacts: ['delete_demo04_2059'],
      resolvedWhenAllFacts: ['copy_before_delete'],
    },
    {
      id: 'timur-account',
      text: 'Кто мог действовать под t.vlasov после ухода Тимура?',
      requiresAllFacts: ['delete_t_vlasov_2059'],
      resolvedWhenAllFacts: ['timur_exit_1926', 'timur_no_remote_after_exit', 'demo_session_open'],
    },
    {
      id: 't17-user',
      text: 'Кто воспользовался T-17 в 20:44?',
      requiresAllFacts: ['t17_entry_2044'],
      resolvedWhenAllFacts: ['roman_return_admitted'],
    },
    {
      id: 'r03-meaning',
      text: 'Что означает маркировка R-03 на обзорном скриншоте?',
      requiresAllFacts: ['r03_visible'],
      resolvedWhenAllFacts: ['r03_linked_roman'],
    },
    {
      id: 'delete-purpose',
      text: 'Зачем удалять RELEASE после того, как копирование уже завершилось?',
      requiresAllFacts: ['copy_before_delete'],
      resolvedWhenAllFacts: ['nordlight_clean_build_promise', 'deal_pressure_context_known'],
    },
    {
      id: 'orbit-source-question',
      text: 'Откуда взялась полная сборка на ORBIT-2 после удаления RELEASE?',
      requiresAllFacts: ['orbit_write_2123'],
      resolvedWhenAllFacts: ['orbit_from_nightsafe'],
    },
    {
      id: 'pavel-where',
      text: 'Что Павел сделал с ORBIT-2 после восстановления проекта?',
      requiresAllFacts: ['pavel_return_after_crime', 'orbit_from_nightsafe'],
      resolvedWhenAllFacts: ['pavel_safe_deposit'],
      optional: true,
    },
  ];
})(typeof globalThis !== 'undefined' ? globalThis : window);
