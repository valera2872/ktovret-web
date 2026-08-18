(function (root) {
  'use strict';

  root.MysteryLogicInvestigationCase = {
    id: 'last_build_ru_web',
    title: 'Последняя сборка',
    subtitle: 'Лгут все. Виновен один.',
    estimatedMinutes: '25–35 минут',
    difficulty: 'Экспертное расследование',
    brief:
      '17 октября в 21:27 руководитель игровой студии «Кадр 17» Павел Нестеров пишет команде: «Презентации не будет. Один из вас уже продал нашу игру». Утром Павел не отвечает, его рабочий телефон остаётся в офисе, финальная папка RELEASE удалена, а официальный накопитель ORBIT-2 исчез. В деле три человека, которые скрывают правду. Только один из них сознательно украл финальную сборку.',
    initialFacts: ['case_started'],
    suspects: [
      { id: 'alina', label: 'Алина Соколова' },
      { id: 'timur', label: 'Тимур Власов' },
      { id: 'roman', label: 'Роман Карский', isCanonicalCulprit: true },
      { id: 'pavel', label: 'Павел Нестеров' },
    ],
    characters: [
      {
        id: 'alina',
        name: 'Алина Соколова',
        role: 'операционный менеджер',
        initialStatement:
          'Я закрыла офис около 19:35. К этому моменту временные пропуска были возвращены. После закрытия я не возвращалась.',
        statementStates: [
          {
            requiresAllFacts: ['alina_admits_manual_return'],
            text:
              'T-17 физически я не получила. Роман написал, что оставил его на стойке, и я вручную отметила возврат. Утром испугалась, что вся история началась из-за моей ошибки, поэтому сказала, что пропуска были возвращены.',
          },
        ],
      },
      {
        id: 'timur',
        name: 'Тимур Власов',
        role: 'технический руководитель',
        initialStatement:
          'Я ушёл в 19:26. Финальную сборку выложил на DEMO-04, сессию закрыл. Других копий не делал.',
        statementStates: [
          {
            requiresAllFacts: ['timur_admits_session_open'],
            text:
              'Сессию на DEMO-04 я оставил активной — там шёл ночной процесс. Соврал утром, потому что увидел своё имя напротив удаления RELEASE и понял, как это выглядит.',
          },
          {
            requiresAllFacts: ['timur_admits_session_open', 'timur_admits_nightsafe'],
            text:
              'Да, NIGHTSAFE сделал я. Павел запретил локальные резервы, но оставлять единственную рабочую копию перед презентацией я считал безумием. Сессию тоже оставил открытой. Оба нарушения я скрыл.',
          },
        ],
      },
      {
        id: 'roman',
        name: 'Роман Карский',
        role: 'консультант инвестора',
        initialStatement:
          'После 18:30 в офис я не возвращался. Ужинал в «Порту». T-17 оставил на стойке ещё днём. У меня была только обзорная версия проекта.',
        statementStates: [
          {
            requiresAllFacts: ['roman_return_admitted'],
            text:
              'Хорошо. Я заезжал примерно на пятнадцать минут — забрать вещи из переговорной. О присутствии соврал, потому что после сообщения Павла любой ночной посетитель выглядел бы виновным. Но присутствие ещё не доказывает кражу.',
          },
        ],
      },
      {
        id: 'pavel',
        name: 'Павел Нестеров',
        role: 'руководитель студии',
        initialStatement: 'Недоступен. Его рабочий телефон найден в офисе.',
        statementStates: [],
      },
    ],
    materials: [
      {
        id: 'pavel-message',
        title: 'Последнее сообщение Павла',
        type: 'Сообщение',
        availableFromStart: true,
        body:
          '17 октября · 21:27\n\nПавел Нестеров:\n«Презентации не будет. Один из вас уже продал нашу игру.»',
        grantsFacts: ['pavel_says_sold'],
        peopleRefs: ['pavel'],
      },
      {
        id: 'office-morning',
        title: 'Офис утром 18 октября',
        type: 'Осмотр места',
        availableFromStart: true,
        body:
          'DEMO-04 включён. Рабочий телефон Павла стоит на зарядке. На столе — пустой футляр ORBIT-2. Финальная папка RELEASE на DEMO-04 отсутствует. Следов взлома дверей нет.',
        grantsFacts: ['orbit_missing', 'pavel_phone_left', 'demo04_on'],
      },
      {
        id: 'initial-statements',
        title: 'Первичные показания',
        type: 'Показания',
        availableFromStart: true,
        body:
          'Алина: все временные пропуска были возвращены.\n\nТимур: ушёл в 19:26, сессию на DEMO-04 закрыл, других копий нет.\n\nРоман: после 18:30 не возвращался, T-17 оставил на стойке, финальной сборки не имел.',
        grantsFacts: [
          'alina_claims_badges_returned',
          'timur_claims_session_closed',
          'timur_claims_no_backups',
          'roman_claims_no_return',
          'roman_claims_t17_left',
        ],
      },
      {
        id: 'delete-audit',
        title: 'Первичный аудит удаления',
        type: 'Системный журнал',
        availableFromStart: true,
        body:
          '20:59:07   Directory removed\nHost        DEMO-04\nUser        t.vlasov\nPath        /RELEASE/final_build\n\nЗапись фиксирует имя активной локальной сессии, а не личность человека за компьютером.',
        grantsFacts: ['delete_t_vlasov_2059', 'delete_demo04_2059'],
        peopleRefs: ['timur'],
      },
      {
        id: 'roman-receipt',
        title: 'Алиби Романа',
        type: 'Чек + сообщение',
        availableFromStart: true,
        body:
          'Ресторан «Порт»\nОплата: 18:12\n\nСообщение Романа, 20:47:\n«Я всё ещё в Порту. Чек у Алины.»\n\nЧек подтверждает ужин в 18:12, но сам по себе ничего не говорит о местонахождении Романа в 20:47.',
        grantsFacts: ['roman_at_port_1812', 'roman_claims_port_2047'],
        peopleRefs: ['roman'],
      },
      {
        id: 'r03-screenshot',
        title: 'Скриншот обзорной сборки',
        type: 'Изображение',
        availableFromStart: true,
        body:
          'Скриншот из рабочих материалов Павла. В правом нижнем углу видна малозаметная служебная маркировка: review / R-03.',
        grantsFacts: ['r03_visible'],
      },
      {
        id: 'studio-brief',
        title: 'Справка о студии «Кадр 17»',
        type: 'Справка',
        availableFromStart: true,
        body:
          'На утро 18 октября назначена закрытая презентация финальной сборки. Павел Нестеров — руководитель студии, Тимур Власов — технический лидер, Алина Соколова — operations, Роман Карский — консультант инвестора.',
        grantsFacts: ['presentation_next_day', 'roman_investor_consultant'],
      },
      {
        id: 'access-log',
        title: 'Журнал проходов за вечер',
        type: 'Контроль доступа',
        body:
          '19:26 — Тимур Власов — выход через главный вход\n19:35 — Алина Соколова — выход / офис закрыт\n20:44 — T-17 — вход через боковую дверь\n21:02 — T-17 — выход через боковую дверь',
        grantsFacts: [
          'timur_exit_1926',
          'alina_closed_1935',
          't17_entry_2044',
          't17_exit_2102',
        ],
      },
      {
        id: 't17-registry',
        title: 'История временного пропуска T-17',
        type: 'Административный реестр',
        body:
          'T-17\nВыдан: Роман Карский\nСтатус: «возвращён»\nСпособ возврата: ручная отметка А. Соколовой\nФизический scan-in возврата отсутствует.\nКонтроллер: пропуск активен до 23:59 17 октября.',
        grantsFacts: ['t17_linked_roman', 't17_manual_return', 't17_active_2359'],
        peopleRefs: ['alina', 'roman'],
      },
      {
        id: 'guest-wifi',
        title: 'Гостевая сеть KADR17-GUEST',
        type: 'Сетевой журнал',
        body:
          '20:46:03 — client connected\nClient: RK-Pixel\nPrevious guest registration: Roman Karsky\n\n21:02:19 — disconnected',
        grantsFacts: ['rk_pixel_present'],
        peopleRefs: ['roman'],
      },
      {
        id: 'alina-correction',
        title: 'Уточнение Алины о T-17',
        type: 'Повторный опрос',
        body:
          'Алина: «Никто мне T-17 в руки не отдавал. Роман написал, что оставил его на стойке. Я была завалена делами и просто отметила возврат вручную. Утром соврала, потому что испугалась ответственности.»',
        grantsFacts: ['alina_admits_manual_return', 'alina_never_received_t17'],
        peopleRefs: ['alina', 'roman'],
      },
      {
        id: 'remote-audit',
        title: 'Проверка удалённых подключений Тимура',
        type: 'Сетевой аудит',
        body:
          'После выхода Тимура в 19:26 его рабочая станция DEV-02 не подключалась к корпоративной сети. VPN/RDP/remote-shell с его учётными данными до 21:10 не зарегистрированы.',
        grantsFacts: ['timur_no_remote_after_exit'],
        peopleRefs: ['timur'],
      },
      {
        id: 'demo-session',
        title: 'Состояние DEMO-04',
        type: 'Endpoint-аудит',
        body:
          '19:12 — локальная сессия t.vlasov активна\n19:26 — рабочая станция Тимура покидает сеть\n20:48 — DEMO-04 выходит из сна\nНового входа пользователя не зарегистрировано: локальная сессия t.vlasov оставалась открытой.',
        grantsFacts: ['demo_session_open', 'delete_used_open_session'],
      },
      {
        id: 'timur-session-correction',
        title: 'Уточнение Тимура о DEMO-04',
        type: 'Повторный опрос',
        body:
          'Тимур: «Да, сессию оставил открытой. На машине шёл ночной процесс, а блокировка мешала. Утром увидел t.vlasov в журнале удаления и соврал, потому что понял, как это выглядит.»',
        grantsFacts: ['timur_admits_session_open'],
        peopleRefs: ['timur'],
      },
      {
        id: 'nightsafe',
        title: 'NIGHTSAFE manifest',
        type: 'Системный файл',
        body:
          '17 октября · 02:00\nNIGHTSAFE backup job\nStatus: SUCCESS\nOwner: t.vlasov\nScope: final project package\nLocation: local encrypted storage\nExternal transfer: none',
        grantsFacts: ['nightsafe_exists', 'nightsafe_local', 'nightsafe_no_external_transfer'],
        peopleRefs: ['timur'],
      },
      {
        id: 'timur-backup-correction',
        title: 'Уточнение Тимура о резерве',
        type: 'Повторный опрос',
        body:
          'Тимур: «NIGHTSAFE сделал я. Павел запретил локальные резервы, но я не согласился с единственной копией перед презентацией. Резерв никуда наружу не уходил.»',
        grantsFacts: ['timur_admits_nightsafe'],
        peopleRefs: ['timur'],
      },
      {
        id: 'usb-audit',
        title: 'Аудит внешних накопителей DEMO-04',
        type: 'USB-аудит',
        body:
          '20:51 — ASTER-64 / A64-7731 connected\n20:52 — transfer started: /RELEASE/final_build\n20:57 — transfer completed: 4.8 GB\n20:59 — /RELEASE/final_build removed\n\n21:23 — ORBIT-2 connected\n21:26 — full project package written',
        grantsFacts: ['aster_id_known', 'copy_before_delete', 'orbit_write_2123'],
      },
      {
        id: 'aster-history',
        title: 'История накопителя A64-7731',
        type: 'Реестр устройств',
        body:
          '15 октября · 16:08\nRemovable device A64-7731 connected to workstation GUEST-02.',
        grantsFacts: ['aster_seen_guest02'],
      },
      {
        id: 'guest02-assignment',
        title: 'Журнал выдачи GUEST-02',
        type: 'Реестр оборудования',
        body:
          '15 октября\nGUEST-02\nВыдан: Роман Карский\nЗарегистрированное личное устройство: ASTER-64 / A64-7731\nВозвращён: 17:35',
        grantsFacts: ['guest02_assigned_roman'],
        peopleRefs: ['roman'],
      },
      {
        id: 'review-registry',
        title: 'Реестр обзорных сборок',
        type: 'Реестр сборок',
        body:
          '15 октября · 16:20\nA-01 — Алина Соколова\nT-02 — Тимур Власов\nR-03 — Роман Карский\n\nКаждому получателю отправлялась визуально одинаковая обзорная сборка с собственной скрытой маркировкой.',
        grantsFacts: ['r03_linked_roman'],
        peopleRefs: ['roman'],
      },
      {
        id: 'nordlight-compliance',
        title: 'Письмо compliance NordLight',
        type: 'Внешняя переписка',
        body:
          '17 октября · 10:15\nNordLight сообщает Павлу: неизвестный контакт предлагает материалы игры «Кадра 17». Во вложении — скриншот с маркировкой R-03. В пересланной переписке контакт подписан инициалами R.K. и обещает предоставить clean final build до 22:00.',
        grantsFacts: ['nordlight_clean_build_promise', 'nordlight_rk_contact', 'leaked_r03'],
        peopleRefs: ['pavel', 'roman'],
      },
      {
        id: 'roman-presence-correction',
        title: 'Роман меняет показания',
        type: 'Повторный опрос',
        body:
          'После предъявления T-17, сетевого следа RK-Pixel и несостоятельности позднего «ресторанного» алиби Роман признаёт: «Да, я коротко возвращался в офис. Забрать вещи из переговорной. Соврал только потому, что понимал, как будет выглядеть ночной визит.»',
        grantsFacts: ['roman_return_admitted'],
        peopleRefs: ['roman'],
      },
      {
        id: 'roman-aster-response',
        title: 'Ответ Романа по ASTER-64',
        type: 'Повторный опрос',
        body:
          'Роман подтверждает, что пользовался ASTER-64 на прежней встрече, но отказывается признавать ночное копирование: «Вы доказали, что этот накопитель был у меня раньше. Не кто держал его в 20:51.»',
        grantsFacts: ['roman_acknowledges_aster_prior_use'],
        peopleRefs: ['roman'],
      },
      {
        id: 'pavel-access',
        title: 'Возвращение Павла',
        type: 'Контроль доступа',
        body:
          '21:02 — T-17 покидает офис.\n21:10 — служебный вход: Павел Нестеров.\n21:14 — активность у DEMO-04.\n\nПавел возвращается уже после копирования и удаления RELEASE.',
        grantsFacts: ['pavel_return_after_crime'],
        peopleRefs: ['pavel'],
      },
      {
        id: 'orbit-source',
        title: 'Источник копии на ORBIT-2',
        type: 'Сверка контрольных сумм',
        body:
          'Файлы, записанные на ORBIT-2 в 21:23–21:26, совпадают по контрольным суммам с локальным NIGHTSAFE. Это не копия с ASTER-64 и не исходная удалённая папка RELEASE.',
        grantsFacts: ['orbit_from_nightsafe'],
        peopleRefs: ['pavel', 'timur'],
      },
      {
        id: 'pavel-deposit',
        title: 'Квитанция цифрового депозита',
        type: 'Документ',
        body:
          '21:42 — нотариальный офис «Контур».\nПринят цифровой депозит: ORBIT-2, пакет проекта, журналы доступа и системные логи. Заявитель: Павел Нестеров.\n\nПозже юрист подтверждает: Павел в безопасности; он фиксировал авторство и доказательства до разговора с командой.',
        grantsFacts: ['pavel_safe_deposit'],
        peopleRefs: ['pavel'],
      },
    ],
    actions: [
      {
        id: 'request-access-log',
        label: 'Запросить вечерний журнал проходов',
        description: 'Проверить, кто физически мог оказаться в офисе после закрытия.',
        requiresAnyFacts: ['delete_demo04_2059', 'roman_claims_no_return', 'alina_claims_badges_returned'],
        revealsMaterials: ['access-log'],
      },
      {
        id: 'inspect-t17-registry',
        label: 'Проверить, кому выдавался T-17',
        description: 'Ночной вход есть. Нужно установить происхождение пропуска.',
        requiresAllFacts: ['t17_entry_2044'],
        revealsMaterials: ['t17-registry'],
      },
      {
        id: 'request-guest-wifi',
        label: 'Запросить журнал гостевой Wi‑Fi',
        description: 'Проверить, какие персональные устройства появились в офисе около 20:44.',
        requiresAllFacts: ['t17_entry_2044'],
        revealsMaterials: ['guest-wifi'],
      },
      {
        id: 'question-alina-t17',
        label: 'Спросить Алину, кто физически вернул T-17',
        description: 'Ручная отметка возврата противоречит её первоначальной уверенности.',
        requiresAllFacts: ['t17_manual_return'],
        characterId: 'alina',
        revealsMaterials: ['alina-correction'],
      },
      {
        id: 'inspect-demo-session',
        label: 'Проверить состояние сессии DEMO-04',
        description: 'Имя t.vlasov в журнале ещё не означает, что Тимур был за компьютером.',
        requiresAllFacts: ['delete_t_vlasov_2059'],
        revealsMaterials: ['demo-session'],
      },
      {
        id: 'check-remote-access',
        label: 'Проверить удалённые подключения Тимура',
        description: 'Тимур вышел до удаления. Нужно проверить дистанционный сценарий.',
        requiresAllFacts: ['delete_t_vlasov_2059', 'timur_exit_1926'],
        revealsMaterials: ['remote-audit'],
      },
      {
        id: 'question-timur-session',
        label: 'Предъявить Тимуру открытую локальную сессию',
        description: 'Его первоначальные показания о закрытой сессии не совпадают с endpoint-аудитом.',
        requiresAllFacts: ['demo_session_open'],
        characterId: 'timur',
        revealsMaterials: ['timur-session-correction'],
      },
      {
        id: 'inspect-backup-jobs',
        label: 'Проверить фоновые задания и локальные резервы',
        description: 'Открытая сессия и пропавший ORBIT дают основание проверить, существовала ли ещё полная копия.',
        requiresAnyFacts: ['demo_session_open', 'orbit_write_2123'],
        revealsMaterials: ['nightsafe'],
      },
      {
        id: 'question-timur-backup',
        label: 'Предъявить Тимуру NIGHTSAFE',
        description: 'Его фраза «других копий нет» требует уточнения.',
        requiresAllFacts: ['nightsafe_exists'],
        characterId: 'timur',
        revealsMaterials: ['timur-backup-correction'],
      },
      {
        id: 'inspect-usb-history',
        label: 'Проверить внешние накопители DEMO-04',
        description: 'Если сборку украли, перед удалением должна была появиться копия или канал вывода.',
        requiresAnyFacts: ['delete_demo04_2059', 'orbit_missing'],
        revealsMaterials: ['usb-audit'],
      },
      {
        id: 'trace-aster-serial',
        label: 'Найти прежние появления A64-7731',
        description: 'Серийный номер накопителя позволяет искать независимую историю устройства.',
        requiresAllFacts: ['aster_id_known'],
        revealsMaterials: ['aster-history'],
      },
      {
        id: 'trace-guest02',
        label: 'Установить, кому выдавали GUEST-02',
        description: 'ASTER-64 раньше появлялся на гостевом ноутбуке. Нужно установить пользователя ноутбука.',
        requiresAllFacts: ['aster_seen_guest02'],
        revealsMaterials: ['guest02-assignment'],
      },
      {
        id: 'check-r03-registry',
        label: 'Сверить маркировку R-03 с реестром обзорных сборок',
        description: 'Маркировка видна с самого начала, но её смысл ещё неизвестен.',
        requiresAllFacts: ['r03_visible'],
        revealsMaterials: ['review-registry'],
      },
      {
        id: 'contact-nordlight',
        label: 'Проверить внешние контакты по проекту',
        description: 'Фраза Павла о продаже игры и/или найденная маркировка дают основание проверить внешнюю сторону.',
        requiresAnyFacts: ['pavel_says_sold', 'r03_linked_roman'],
        revealsMaterials: ['nordlight-compliance'],
      },
      {
        id: 'confront-roman-presence',
        label: 'Предъявить Роману совокупность следов присутствия',
        description: 'Один T-17 или один телефон недостаточны. Здесь проверяется именно совокупность независимых следов.',
        requiresAllFacts: ['t17_linked_roman', 'rk_pixel_present', 'roman_claims_port_2047'],
        characterId: 'roman',
        revealsMaterials: ['roman-presence-correction'],
      },
      {
        id: 'confront-roman-aster',
        label: 'Спросить Романа об ASTER-64',
        description: 'Проверить, как он объяснит прежнюю связь с тем же серийным номером.',
        requiresAllFacts: ['roman_return_admitted', 'copy_before_delete', 'guest02_assigned_roman'],
        characterId: 'roman',
        revealsMaterials: ['roman-aster-response'],
      },
      {
        id: 'reconstruct-pavel-return',
        label: 'Проверить, когда Павел вернулся в офис',
        description: 'ORBIT появляется после удаления. Это позволяет проверить гипотезу постановки или восстановления.',
        requiresAllFacts: ['orbit_write_2123', 't17_exit_2102'],
        revealsMaterials: ['pavel-access'],
      },
      {
        id: 'compare-orbit-source',
        label: 'Сравнить ORBIT-2 с NIGHTSAFE',
        description: 'Понять, откуда Павел получил полную копию после удаления RELEASE.',
        requiresAllFacts: ['orbit_write_2123', 'nightsafe_exists'],
        revealsMaterials: ['orbit-source'],
      },
      {
        id: 'find-pavel-trail',
        label: 'Проверить, куда Павел увёз ORBIT-2',
        description: 'Это не требуется для обвинения исполнителя, но закрывает судьбу Павла и проекта.',
        requiresAllFacts: ['orbit_from_nightsafe', 'pavel_return_after_crime'],
        revealsMaterials: ['pavel-deposit'],
      },
    ],
    proofFamilies: [
      {
        id: 'presence',
        label: 'Роман физически вернулся в офис',
        description: 'Не просто пропуск или телефон: нужна устойчивая совокупность следов и сломанное алиби.',
        requiredForStrongCase: true,
        requiredForCompleteCase: true,
        allOf: ['t17_linked_roman', 'rk_pixel_present', 'roman_return_admitted'],
        anyOfGroups: [],
      },
      {
        id: 'borrowed-session',
        label: 'Имя Тимура в журнале — маска открытой локальной сессии',
        description: 'Нужно объяснить, почему удаление записано как t.vlasov, не делая из имени пользователя доказательство личности.',
        requiredForStrongCase: true,
        requiredForCompleteCase: true,
        allOf: ['timur_exit_1926', 'timur_no_remote_after_exit', 'demo_session_open'],
        anyOfGroups: [],
      },
      {
        id: 'copy-device',
        label: 'ASTER-64 скопировал RELEASE до удаления и связан с Романом',
        description: 'Сам факт копирования и независимая история серийного номера должны сойтись.',
        requiredForStrongCase: true,
        requiredForCompleteCase: true,
        allOf: ['copy_before_delete', 'aster_seen_guest02', 'guest02_assigned_roman'],
        anyOfGroups: [],
      },
      {
        id: 'prior-intent',
        label: 'У Романа был предшествующий план получить и передать clean build',
        description: 'Это отделяет ночной визит от случайного возвращения за вещами.',
        requiredForStrongCase: true,
        requiredForCompleteCase: true,
        allOf: ['r03_linked_roman', 'nordlight_clean_build_promise', 'nordlight_rk_contact'],
        anyOfGroups: [],
      },
      {
        id: 'alina-role',
        label: 'Ложь Алины скрывала нарушение с пропуском, а не кражу',
        description: 'Дополнительная реконструкция роли Алины.',
        requiredForStrongCase: false,
        requiredForCompleteCase: true,
        allOf: ['t17_manual_return', 'alina_admits_manual_return'],
        anyOfGroups: [],
      },
      {
        id: 'timur-role',
        label: 'Ложь Тимура скрывала открытую сессию и запрещённый локальный резерв',
        description: 'Дополнительная реконструкция роли Тимура и причины, почему проект удалось восстановить.',
        requiredForStrongCase: false,
        requiredForCompleteCase: true,
        allOf: [
          'timur_admits_session_open',
          'nightsafe_exists',
          'nightsafe_no_external_transfer',
          'timur_admits_nightsafe',
        ],
        anyOfGroups: [],
      },
      {
        id: 'pavel-role',
        label: 'Павел вернулся после преступления, восстановил сборку и зафиксировал доказательства',
        description: 'Дополнительная реконструкция судьбы Павла и ORBIT-2.',
        requiredForStrongCase: false,
        requiredForCompleteCase: true,
        allOf: ['pavel_return_after_crime', 'orbit_from_nightsafe', 'pavel_safe_deposit'],
        anyOfGroups: [],
      },
    ],
    resultNarrative:
      'Роман сохранил доступ через T-17, вернулся после закрытия офиса, попал в сеть своим RK-Pixel, использовал оставленную Тимуром открытую сессию t.vlasov, скопировал clean build на ASTER-64 и затем удалил RELEASE. Ранее именно выданная Роману обзорная сборка R-03 утекла во внешнюю переписку, где контакт R.K. обещал clean final build до 22:00. Алина лгала из-за скрытого нарушения с пропуском. Тимур — из-за открытой сессии и запрещённого NIGHTSAFE. Его резерв, однако, позволил Павлу восстановить проект. Павел вернулся уже после ухода ночного посетителя, записал восстановленную копию и доказательства на ORBIT-2 и зафиксировал их в цифровом депозите.',
    resultTiers: {
      S: {
        title: 'Полная реконструкция',
        text: 'Вы доказали исполнителя, самостоятельно собрали все ключевые причинные звенья и разобрались, почему остальные тоже лгали.',
      },
      A: {
        title: 'Обвинение доказано',
        text: 'Критическая цепочка против исполнителя собрана. Часть вторичных обстоятельств и чужих секретов осталась нераскрытой.',
      },
      B: {
        title: 'Версия пока не выдерживает предъявления',
        text: 'Вы выбрали канонического исполнителя, но хотя бы одно ключевое причинное звено не подтверждено теми материалами, которые вы приложили к версии.',
      },
      C: {
        title: 'Обвинение противоречит делу',
        text: 'Выбранный исполнитель не объясняет установленную совокупность физических и цифровых следов. Вернитесь к фактам и проверьте альтернативную гипотезу.',
      },
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
