(function (root) {
  'use strict';

  const definition = root.MysteryLogicInvestigationCase;
  if (!definition) return;

  const roman = {
    characterId: 'roman',
    label: 'Свободный допрос · пилот',
    description: 'Задайте вопрос своими словами. Роман отвечает только в пределах уже созданной авторской истины дела.',
    fallbackTopicId: 'unknown',
    suggestedQuestions: [
      'Где вы были после 18:30?',
      'Когда вы вернули T-17?',
      'Что означает маркировка R-03?',
    ],
    topics: [
      {
        id: 'aster',
        keywords: ['aster', 'a64-7731', 'накопител', 'флешк', 'usb', 'guest-02'],
        actionId: 'confront-roman-aster',
        materialId: 'roman-aster-response',
        afterActionStance: 'evasion',
        defaultResponse: 'Я не понимаю, о каком накопителе вы говорите. Назовите конкретный серийный номер и источник сведений.',
        stages: [
          {
            requiresAnyFacts: ['aster_id_known', 'aster_seen_guest02'],
            stance: 'denial',
            response: 'Серийный номер в журнале доказывает подключение устройства, но не личность человека, который держал его той ночью.',
          },
          {
            requiresAllFacts: ['guest02_assigned_roman'],
            stance: 'evasion',
            response: 'В реестре указано, что устройство было связано со мной на прежней встрече. Это ещё ничего не говорит о 20:51 семнадцатого октября.',
          },
        ],
      },
      {
        id: 'access',
        keywords: ['t-17', 't17', 'пропуск', 'стойк', 'проход', 'карт', 'карта доступа', 'турникет'],
        defaultResponse: 'T-17 я оставил на стойке ещё днём и сообщил об этом Алине. После 18:30 этим пропуском не пользовался.',
        stages: [
          {
            requiresAllFacts: ['t17_linked_roman'],
            stance: 'evasion',
            response: 'Да, T-17 был выдан мне. Но запись о ночном проходе не показывает лицо человека, который приложил пропуск.',
          },
          {
            requiresAllFacts: ['roman_return_admitted', 'roman_claimed_t17_left_in_chat'],
            stance: 'admission',
            response: 'Я признал, что возвращался. T-17 оставался у меня, хотя Алине я написал, что положил его на стойку.',
          },
        ],
      },
      {
        id: 'presence',
        keywords: ['офис', 'вернул', 'возвращал', 'приехал обратно', 'приехали обратно', 'ночью', '18:30', '20:47', 'порт', 'ресторан', 'алиби', 'ужин', 'rk-pixel', 'соврал'],
        actionId: 'confront-roman-presence',
        materialId: 'roman-presence-correction',
        afterActionStance: 'admission',
        defaultResponse: 'После 18:30 в офис я не возвращался. Ужинал в «Порту»; чек у вас есть.',
        stages: [
          {
            requiresAnyFacts: ['t17_linked_roman', 'rk_pixel_present'],
            stance: 'evasion',
            response: 'Вы показываете отдельные косвенные следы. Ни пропуск, ни имя телефона сами по себе не доказывают, что в офисе был именно я.',
          },
          {
            requiresAllFacts: ['roman_return_admitted'],
            stance: 'admission',
            response: 'Да, я коротко возвращался за вещами из переговорной. Присутствие я скрыл, но кражу не признаю.',
          },
        ],
      },
      {
        id: 'session',
        keywords: ['t.vlasov', 'тимур', 'сесси', 'demo-04', 'удален', 'удалил', 'release'],
        defaultResponse: 'Системами студии управлял Тимур. Почему журнал показывает его имя — вопрос к нему, не ко мне.',
        stages: [
          {
            requiresAllFacts: ['demo_session_open'],
            stance: 'evasion',
            response: 'Открытая сессия объясняет только то, почему компьютер записал имя Тимура. Она не устанавливает, кто сидел за DEMO-04.',
          },
        ],
      },
      {
        id: 'nordlight',
        keywords: ['nordlight', 'r-03', 'r03', 'clean build', 'обзорн', 'утечк', 'r.k.'],
        defaultResponse: 'У меня была обзорная версия проекта, как и у других участников подготовки. Никакой финальной сборки мне не передавали.',
        stages: [
          {
            requiresAllFacts: ['r03_linked_roman'],
            stance: 'evasion',
            response: 'R-03 была моей обзорной копией. Это служебная маркировка получателя, а не доказательство того, кто переслал изображение.',
          },
          {
            requiresAllFacts: ['nordlight_clean_build_promise', 'nordlight_rk_contact'],
            stance: 'denial',
            response: 'Инициалы R.K. и обещание в чужой переписке — ещё не установленная личность. Я не признаю, что писал это сообщение.',
          },
        ],
      },
      {
        id: 'motive',
        keywords: ['мотив', 'зачем', 'почему', 'продал', 'продаж', 'сделк', 'инвестор', 'деньг', 'транш'],
        defaultResponse: 'Я консультант инвестора. Обсуждение рисков сделки — моя работа, а не признание в продаже материалов.',
        stages: [
          {
            requiresAllFacts: ['deal_pressure_context_known'],
            stance: 'evasion',
            response: 'Да, я считал, что новый транш надолго закроет разговор о продаже. Это деловая позиция; из неё не следует кража сборки.',
          },
        ],
      },
      {
        id: 'pavel',
        keywords: ['павел', 'действиях павла', 'orbit', 'nightsafe', 'депозит', 'исчез'],
        defaultResponse: 'Я не знаю, куда уехал Павел после своего сообщения. Его действия после моего ухода мне неизвестны.',
        stages: [
          {
            requiresAnyFacts: ['pavel_return_after_crime', 'pavel_safe_deposit'],
            stance: 'boundary',
            response: 'Вы уже восстановили действия Павла по журналам и документам. Я не могу добавить к ним сведений, которых у меня нет.',
          },
        ],
      },
      {
        id: 'unknown',
        keywords: [],
        defaultResponse: 'Не понимаю, к какому обстоятельству дела относится вопрос. Спросите о времени, пропуске, устройстве, сборке или внешних контактах.',
        stages: [],
      },
    ],
  };

  definition.interrogationContracts = { ...(definition.interrogationContracts || {}), roman };
  root.MysteryLogicInterrogationConfig = Object.freeze({
    classifierMode: 'local',
    endpoint: 'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/interrogate-character',
    timeoutMs: 4500,
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
