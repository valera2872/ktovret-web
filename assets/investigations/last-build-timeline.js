(function (root) {
  'use strict';

  const definition = root.MysteryLogicInvestigationCase;
  if (!definition) return;

  definition.timelineEvents = [
    { id: 'review-r03', sort: '2026-10-15T16:20', date: '15 октября', time: '16:20', label: 'Обзорная сборка R-03 закреплена за Романом', source: 'Реестр обзорных сборок', requiresAllFacts: ['r03_linked_roman'] },
    { id: 'nordlight-warning', sort: '2026-10-17T10:15', date: '17 октября', time: '10:15', label: 'NordLight сообщает о предложении материалов проекта', source: 'Compliance-письмо', requiresAllFacts: ['nordlight_clean_build_promise'] },
    { id: 'port-payment', sort: '2026-10-17T18:12', date: '17 октября', time: '18:12', label: 'Оплата в ресторане «Порт»', source: 'Чек', requiresAllFacts: ['roman_at_port_1812'] },
    { id: 'timur-exit', sort: '2026-10-17T19:26', date: '17 октября', time: '19:26', label: 'Тимур покидает офис', source: 'Контроль доступа', requiresAllFacts: ['timur_exit_1926'] },
    { id: 'alina-close', sort: '2026-10-17T19:35', date: '17 октября', time: '19:35', label: 'Алина закрывает офис', source: 'Контроль доступа', requiresAllFacts: ['alina_closed_1935'] },
    { id: 't17-in', sort: '2026-10-17T20:44', date: '17 октября', time: '20:44', label: 'T-17 открывает боковую дверь', source: 'Контроль доступа', requiresAllFacts: ['t17_entry_2044'] },
    { id: 'rk-pixel', sort: '2026-10-17T20:46', date: '17 октября', time: '20:46', label: 'RK-Pixel подключается к гостевой сети', source: 'KADR17-GUEST', requiresAllFacts: ['rk_pixel_present'] },
    { id: 'demo-wake', sort: '2026-10-17T20:48', date: '17 октября', time: '20:48', label: 'DEMO-04 выходит из сна с открытой локальной сессией', source: 'Endpoint-аудит', requiresAllFacts: ['demo_session_open'] },
    { id: 'aster-in', sort: '2026-10-17T20:51', date: '17 октября', time: '20:51', label: 'Подключён ASTER-64 / A64-7731', source: 'USB-аудит', requiresAllFacts: ['aster_id_known'] },
    { id: 'copy-finished', sort: '2026-10-17T20:57', date: '17 октября', time: '20:57', label: 'Копирование RELEASE на внешний носитель завершено', source: 'USB-аудит', requiresAllFacts: ['copy_before_delete'] },
    { id: 'release-delete', sort: '2026-10-17T20:59', date: '17 октября', time: '20:59', label: 'RELEASE удалена под активной сессией t.vlasov', source: 'Endpoint-аудит', requiresAllFacts: ['delete_t_vlasov_2059'] },
    { id: 't17-out', sort: '2026-10-17T21:02', date: '17 октября', time: '21:02', label: 'T-17 фиксирует выход', source: 'Контроль доступа', requiresAllFacts: ['t17_exit_2102'] },
    { id: 'pavel-in', sort: '2026-10-17T21:10', date: '17 октября', time: '21:10', label: 'Павел возвращается через служебный вход', source: 'Контроль доступа', requiresAllFacts: ['pavel_return_after_crime'] },
    { id: 'orbit-write', sort: '2026-10-17T21:23', date: '17 октября', time: '21:23', label: 'ORBIT-2 получает полный пакет проекта', source: 'USB-аудит', requiresAllFacts: ['orbit_write_2123'] },
    { id: 'deposit', sort: '2026-10-17T21:42', date: '17 октября', time: '21:42', label: 'ORBIT-2 принят в цифровой депозит', source: 'Квитанция «Контур»', requiresAllFacts: ['pavel_safe_deposit'] },
  ];
})(typeof globalThis !== 'undefined' ? globalThis : window);
