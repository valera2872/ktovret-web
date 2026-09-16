(() => {
  'use strict';

  if (new URL(location.href).searchParams.get('demo') !== '1') return;

  const ROOT = document.querySelector('[data-partner-v2-app]');
  if (!ROOT) return;

  const ENDPOINT = ROOT.dataset.partnerEndpoint || '/__partner-v2-demo';
  const ROOM_CODE = 'TEST2026';
  const CASE_ID = 'partner:zero-container';
  const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key';
  const ROLE_STORAGE = 'mysterylogic:partner-v2:demo-role';
  const STATE_STORAGE = 'mysterylogic:partner-v2:zero-container:demo-state:v1';
  const CREATOR_KEY = '111111111111111111111111111111111111111111111111';
  const GUEST_KEY = '222222222222222222222222222222222222222222222222';

  const roleMeta = {
    creator: { title: 'Маршрут', mark: 'МР', short: 'Движение состава, инфраструктура, техника, связь' },
    guest: { title: 'Груз', mark: 'ГР', short: 'Документы, склад, персонал, заявки, доступ' },
  };

  const chapters = [
    { id: 1, title: 'Прибытие', objective: 'Проверьте маршрут, исходные документы и первые противоречия. Затем независимо зафиксируйте первую версию.' },
    { id: 2, title: '16 минут', objective: 'Отделите движение поезда от судьбы груза. Затем сравните физические признаки контейнера на двух устройствах.' },
    { id: 3, title: 'ТК-0', objective: 'Свяжите техническую заявку с объектом и исполнителем. Один экран знает, что перемещали, второй знает, кто это сделал.' },
    { id: 4, title: 'Операция', objective: 'Теперь докажите физическую подмену и выясните, откуда пришла команда, создавшая временное окно.' },
    { id: 5, title: 'Кто создал схему', objective: 'Отделите исполнителя от организатора. Проверьте подготовку ТК-0, доступ к данным цели, создание временного окна и то, зачем понадобился оригинальный груз.' },
    { id: 6, title: 'Дело раскрыто', objective: 'Сверьте восстановленную операцию с полной хронологией.' },
  ];

  const evidence = {
    M01: { id:'M01', role:'creator', chapter:1, type:'map', tag:'Схема участка', title:'Узел Вектор-12', body:['Петля Б используется для временного удержания грузовых составов и технологического обслуживания.','Рядом с петлей проходит твердая техническая площадка, на которой может работать контейнерная техника.','Промышленная ветка подключается отдельной стрелкой 12Б.'], facts:['Петля Б','Техническая площадка рядом','Отдельная промышленная ветка'], payload:{ points:[{id:'main',label:'Главный путь'},{id:'loop_b',label:'Петля Б'},{id:'industrial',label:'Промышленная ветка'},{id:'tech_b',label:'Техническая площадка Б'},{id:'box3',label:'Сервисный бокс 3'},{id:'gate',label:'Сервисные ворота'}] } },
    M02: { id:'M02', role:'creator', chapter:1, type:'log', tag:'GPS локомотива', title:'Маршрут состава №214', body:['00:52 - Северный терминал, отправление.','01:31 - Пост 7, движение.','02:06 - Вектор-12, петля Б, остановка.','02:22 - Вектор-12, петля Б, движение.','02:51 - Пост 19, движение.','03:08 - Южный терминал, прибытие.'], facts:['Потеря GPS-сигнала: 0 сек.','Отклонение от маршрута: не зарегистрировано'] },
    M03: { id:'M03', role:'creator', chapter:1, type:'log', tag:'Журнал стрелок', title:'Вектор-12, 01:55-02:27', body:['Стрелка 12А: положение ПЕТЛЯ Б.','Стрелка 12Б: промышленная ветка, состояние БЛОКИРОВКА.','Стрелка 14: положение ГЛАВНЫЙ ПУТЬ.','Нештатные переключения: 0.'], facts:['Состав не уходил на промышленную ветку'] },
    G01: { id:'G01', role:'guest', chapter:1, type:'document', tag:'Грузовая накладная', title:'CAXU 771204 2', body:['Вагон: 06.','Груз: 8 промышленных оптических измерительных модулей в транспортных рамах.','Масса брутто: 8 410 кг.','Пломба: S-417.','Получатель: лаборатория Vectoris, Южный терминал.'], facts:['8 410 кг','Пломба S-417','Вагон 06'] },
    G02: { id:'G02', role:'guest', chapter:1, type:'photo', tag:'Контрольное фото', title:'Контейнер перед отправлением, 00:39:51', body:['Изображение сохранено системой отправочного контроля. Сравнивайте номер и физические особенности корпуса.'], facts:[], payload:{ imageKey:'zero-container-departure', observationProfile:'departure' } },
    G03: { id:'G03', role:'guest', chapter:1, type:'access', tag:'Контроль доступа', title:'Складская зона С', body:['00:12:03 - N. SAVELIEV, вход.','00:18:41 - GUEST-07, вход.','00:25:19 - GUEST-07, выход.','00:28:02 - N. SAVELIEV, выход.'], quote:'Савельев: После закрытия зоны никто посторонний туда не входил.', facts:['GUEST-07 находился в зоне 6 минут 38 секунд','Показание Савельева противоречит журналу'] },
    M04: { id:'M04', role:'creator', chapter:2, type:'audio-transcript', tag:'Диспетчерская связь', title:'Остановка на Векторе-12', body:['02:04:18. Волкова: Двести четырнадцатый, после входного приготовьтесь к остановке на петле Б.','Машинист: Принял. Причина?','Волкова: Контроль осевого оборудования. Несколько минут.','02:19:46. Машинист: Вектор, стоим уже тринадцать минут. Что у вас?','Волкова: Ожидайте.','02:21:37. Волкова: Двести четырнадцатый, движение разрешаю.'], facts:['Фактическая остановка: 16 минут 11 секунд'] },
    M05: { id:'M05', role:'creator', chapter:2, type:'photo', tag:'Камера въезда', title:'Контейнер на Южном терминале, 03:07:41', body:['Система распознавания уверенно читает номер CAXU 771204 2. Сравните с описанием корпуса, которое есть только у напарника.'], facts:['Номер распознан: CAXU 771204 2','Уверенность OCR: 99,2 %'], payload:{ imageKey:'zero-container-arrival', observationProfile:'arrival' } },
    G04: { id:'G04', role:'guest', chapter:2, type:'weighing', tag:'Контрольное взвешивание', title:'Масса почти не изменилась', body:['Отправление: 8 410 кг.','Прибытие: 8 420 кг.','Допустимое отклонение оборудования: ±20 кг.','Статус: контроль пройден.'], facts:['Разница: +10 кг','Крупная потеря груза не отразилась на общей массе'] },
    M06: { id:'M06', role:'creator', chapter:3, type:'machine-log', tag:'Терминальная техника', title:'R-4, журнал задания', body:['02:08:11 - оператор D. RYBAKOV, авторизация.','02:09:02 - принято задание Т-04391.','02:19:14 - задание завершено.','Зона: Вектор-12, техническая площадка Б.'], facts:['Исполнитель Т-04391: Денис Рыбаков','Машина: R-4'] },
    G05: { id:'G05', role:'guest', chapter:3, type:'document', tag:'Внутренняя заявка', title:'Т-04391', body:['Создано: 01:49:03.','Пользователь: OPS.SHARED.','Объект: ТК-0.','Операция: ПЕРЕМЕЩЕНИЕ.','Откуда: подготовительная площадка.','Куда: техническая площадка Б.','Окно выполнения: 02:05-02:20.'], facts:['Объект Т-04391: ТК-0'] },
    G06: { id:'G06', role:'guest', chapter:3, type:'reference', tag:'Внутренний справочник', title:'Что такое ТК-0', body:['Технический контейнерный корпус без международной регистрации.','Используется для учебных, ремонтных и технологических операций.','Собственная масса пустого корпуса: около 2,2 т.'], facts:['ТК-0 не отслеживается как коммерческий груз','Пустой корпус: около 2,2 т'] },
    M07: { id:'M07', role:'creator', chapter:4, type:'comms', tag:'Внутренняя связь', title:'01:47:12, служебный вызов', body:['Источник: ENDPOINT 184.','Получатель: Вектор-12 / дежурная.','Продолжительность: 01:36.','Тип: внутренний голосовой вызов.'], facts:['Вызов совершен за 18 минут до ручной команды HOLD для состава №214'] },
    M08: { id:'M08', role:'creator', chapter:4, type:'telemetry', tag:'Телеметрия R-4', title:'Два тяжелых подъема', body:['02:11:22 - подъем, около 8,4 т.','02:13:17 - разгрузка.','02:15:48 - подъем, около 8,4 т.','02:18:03 - разгрузка.','Данные массы округлены системой до 0,1 т.'], facts:['R-4 переместил два тяжелых объекта примерно одинаковой массы'] },
    G07: { id:'G07', role:'guest', chapter:4, type:'account', tag:'Учетная запись', title:'OPS.SHARED', body:['Тип: оперативная общая учетная запись.','Назначение: создание внутренних технических заявок.','Персональное закрепление: нет.','Доступ в текущую смену: Ирина Маркова и Павел Нестеров.'], facts:['Т-04391 нельзя автоматически приписать одному сотруднику только по имени OPS.SHARED'] },
    G08: { id:'G08', role:'guest', chapter:4, type:'registry', tag:'Реестр рабочих мест', title:'Endpoint 184', body:['L-12 - Endpoint 181.','L-13 - Endpoint 183.','L-14 - Endpoint 184.','L-15 - Endpoint 186.'], facts:['Endpoint 184 = рабочее место L-14'] },
    G09: { id:'G09', role:'guest', chapter:4, type:'sessions', tag:'Локальные сессии', title:'Рабочее место L-14', body:['01:21:09 - P. NESTEROV, вход.','01:38:22 - P. NESTEROV, выход.','01:42:51 - I. MARKOVA, вход.','01:51:16 - I. MARKOVA, выход.','01:54:03 - P. NESTEROV, вход.','02:17:40 - P. NESTEROV, выход.'], facts:['В 01:47 и 01:49 на L-14 активна сессия Ирины Марковой'] },
    M09: { id:'M09', role:'creator', chapter:5, type:'service-log', tag:'Сервисный бокс 3', title:'История ТК-0 и сервисного вывоза', body:['За 3 дня, 18:19 - ТК-0 принят в сервисный бокс 3.','Основание: внутренняя заявка. Инициатор: I. MARKOVA.','За 3 дня, 18:11 - создан сервисный пропуск RET-184: ВОЗВРАТ ПУСТОГО КОРПУСА / СЕРВИС. Пользователь: I. MARKOVA. Получатель: DELTA CALIBRATION.','В ночь происшествия, 01:32 - ТК-0 выдан из бокса. Получатель: D. RYBAKOV.','02:13:17 - R-4 устанавливает снятый с вагона CAXU 771204 2 на ожидающее дорожное шасси K-17 у технической площадки Б.','02:24:31 - шасси K-17 с CAXU 771204 2 покидает техническую площадку Б и направляется к сервисным воротам 2.','02:36:08 - шасси K-17 покидает Вектор-12 через сервисные ворота 2 по пропуску RET-184.','Сервисный выезд не проходил коммерческий контроль груза.'], facts:['Маркова заранее переместила ТК-0 в сервисный бокс','Вывоз оригинального CAXU был оформлен до ночи происшествия','В ночь операции ТК-0 получил Рыбаков'] },
    M10: { id:'M10', role:'creator', chapter:5, type:'system-log', tag:'Вектор-12', title:'Остановка была ручной', body:['02:05:41 - HOLD / TRAIN 214.','Источник: MANUAL.','Оператор: A. VOLKOVA.','Автоматических аварийных сигналов в этот момент не зарегистрировано.'], quote:'Волкова ранее утверждала, что состав остановила автоматика.', facts:['Причина остановки в первоначальном показании Волковой ложна'] },
    G10: { id:'G10', role:'guest', chapter:5, type:'audit', tag:'История доступа', title:'CAXU 771204 2: аудит доступа', body:['За 3 дня, 17:48 - I. MARKOVA открывает карточку CAXU 771204 2.','Просмотрены: маршрут, вагон, масса, номер пломбы, контрольные фотографии.','За 3 дня, 18:03 - OPS.SHARED оформляет перемещение ТК-0 в сервисный бокс 3 под основанием ИНВЕНТАРИЗАЦИЯ.','Персональный идентификатор автора в этой записи отсутствует.','В ночь происшествия, 00:37 - I. MARKOVA повторно открывает маршрут, вагон, массу и пломбу CAXU 771204 2.'], facts:['Маркова просматривала параметры цели за 3 дня и в ночь происшествия','Через 15 минут после первого просмотра OPS.SHARED оформил перемещение ТК-0'] },
    G11: { id:'G11', role:'guest', chapter:5, type:'audit', tag:'Проверка альтернативы', title:'Павел Нестеров', body:['Нестеров действительно пользовался OPS.SHARED этой ночью.','В 01:54 он снова вошел в L-14 и позже создал техническую заявку по автомобильной перевозке на другом терминале.','Карточку CAXU 771204 2 он не открывал.','К ТК-0 и сервисному боксу 3 его действия не привязаны.','Его первая сессия L-14 завершилась в 01:38, следующая началась в 01:54.'], facts:['Звонок 01:47 и Т-04391 01:49 не попадают в сессии Нестерова'] },
    G12: { id:'G12', role:'guest', chapter:5, type:'interview', tag:'Повторный опрос', title:'Денис Рыбаков', body:['Рыбаков подтверждает, что получил Т-04391 и работал с ТК-0.','Он называет ТК-0 пустым техническим корпусом и утверждает, что не знал о грузе.','Но оператор R-4 видит нагрузку во время подъема, а телеметрия показывает около 8,4 т дважды.','После предъявления телеметрии Рыбаков меняет формулировку: ему якобы сказали, что это внутренний тест.'], facts:['Рыбаков сознательно скрывает характер операции','Его участие как исполнителя доказано, роль организатора еще требует проверки'] },
    G13: { id:'G13', role:'guest', chapter:5, type:'commercial', tag:'Внешний запрос', title:'Delta Calibration ищет восемь модулей', body:['За 4 дня до происшествия в общий операционный ящик терминала поступил запрос Delta Calibration.','Требуется: 8 промышленных оптических измерительных модулей той же серии, что отправлены лаборатории Vectoris в CAXU 771204 2.','Условие покупателя: оборудование принимается без заводских транспортных рам и без документации происхождения.','Предложенная цена: 38 000 евро за модуль.','Легального заказа Vectoris или терминала на поставку Delta Calibration не зарегистрировано.','Журнал общего ящика не хранит персонального идентификатора пользователя, который впервые прочитал сообщение.'], facts:['Внешний покупатель искал ровно восемь модулей нужной серии до подготовки ТК-0','Сам по себе запрос не показывает, кто из сотрудников связал его с конкретным контейнером'] },
  };

  const initialHypothesisOptions = [
    { id:'before_departure', label:'До отправления' }, { id:'while_moving', label:'Во время движения' },
    { id:'during_stop', label:'Во время остановки' }, { id:'after_arrival', label:'После прибытия' },
    { id:'insufficient', label:'Пока недостаточно данных' },
  ];

  const photoUi = {
    id:'photo_observation', title:'Проверка идентичности контейнера',
    lead:'Опишите напарнику повреждения корпуса и независимо отметьте, что видно на вашем изображении.',
    fields:[{id:'patch',label:'Сварная заплата справа внизу'},{id:'scratch',label:'Длинная царапина под номером'},{id:'door_deformation',label:'Деформация правой створки двери'}],
    options:[{id:'present',label:'Есть'},{id:'absent',label:'Нет'},{id:'unsure',label:'Не уверен'}],
  };

  const roleOptions = {
    t04391_link: {
      creator:[{id:'rybakov_r4',label:'R-4 / Денис Рыбаков'},{id:'volkova',label:'Анна Волкова'},{id:'train214',label:'Состав №214'}],
      guest:[{id:'tk0',label:'ТК-0'},{id:'caxu',label:'CAXU 771204 2'},{id:'s417',label:'Пломба S-417'}],
    },
    physical_operation: {
      creator:[{id:'two_loaded_objects',label:'R-4 переместил два тяжелых объекта примерно одинаковой массы'},{id:'one_object_twice',label:'Один контейнер просто переставили дважды'},{id:'sensor_fault',label:'Телеметрия R-4 неисправна'}],
      guest:[{id:'mass_compensated',label:'ТК-0 был заранее загружен балластом до массы исходного контейнера'},{id:'empty_tk0',label:'ТК-0 оставался пустым корпусом около 2,2 т'},{id:'scale_forged',label:'Все весовые данные были просто подделаны'}],
    },
    endpoint_link: {
      creator:[{id:'endpoint184_call',label:'В 01:47 на Вектор-12 звонил Endpoint 184'},{id:'rybakov_call',label:'Звонок шел с терминальной машины R-4'},{id:'automatic_hold',label:'Никакого звонка не было, сработала автоматика'}],
      guest:[{id:'l14_markova',label:'Endpoint 184 = L-14, в 01:47 активна сессия Марковой'},{id:'l14_nesterov',label:'Endpoint 184 = L-14, в 01:47 активна сессия Нестерова'},{id:'l15_markova',label:'Endpoint 184 = L-15, в 01:47 активна сессия Марковой'}],
    },
  };

  const checkpointUiMeta = {
    t04391_link:{ id:'t04391_link', title:'Свяжите Т-04391', lead:'У каждого игрока есть только половина ответа. Сначала обсудите документы, затем выберите свою часть связи.' },
    physical_operation:{ id:'physical_operation', title:'Что физически произошло на площадке Б', lead:'Сопоставьте телеметрию R-4 с массой ТК-0 и данными груза. У каждого игрока своя часть физической картины.' },
    endpoint_link:{ id:'endpoint_link', title:'Кто создал временное окно', lead:'Один экран знает источник звонка на Вектор-12. Второй знает, какому рабочему месту принадлежит этот endpoint и чья сессия была активна.' },
  };

  const checkpointRules = {
    photo_observation:{ chapter:2, sharedKey:'photoComparisonSolved', unlockChapter:3, expected:{ creator:{patch:'absent',scratch:'absent',door_deformation:'present'}, guest:{patch:'present',scratch:'present',door_deformation:'absent'} } },
    t04391_link:{ chapter:3, sharedKey:'t04391Linked', unlockChapter:4, expected:{creator:'rybakov_r4',guest:'tk0'} },
    physical_operation:{ chapter:4, sharedKey:'physicalSwapProven', unlockChapter:4, expected:{creator:'two_loaded_objects',guest:'mass_compensated'} },
    endpoint_link:{ chapter:4, sharedKey:'endpoint184Linked', unlockChapter:5, requiresShared:['physicalSwapProven'], expected:{creator:'endpoint184_call',guest:'l14_markova'} },
  };

  const finalUi = {
    title:'Восстановите операцию',
    lead:'Сначала каждый соберите свою версию. В демо ответы двух ролей сравниваются так же, как на сервере.',
    fields:[
      {id:'replacement',label:'Что использовали как замену',options:[{id:'tk0',label:'Подготовленный ТК-0'},{id:'another_wagon',label:'Другой вагон состава №214'},{id:'warehouse_pallets',label:'Складские паллеты'}]},
      {id:'place',label:'Где произошла подмена',options:[{id:'vector12_loop_b',label:'Вектор-12, петля Б'},{id:'warehouse_c',label:'Складская зона С до отправления'},{id:'industrial_branch',label:'Промышленная ветка'},{id:'south_terminal',label:'Южный терминал после прибытия'}]},
      {id:'window',label:'Когда прошла основная операция',options:[{id:'0206_0222',label:'02:06-02:22'},{id:'0018_0041',label:'00:18-00:41'},{id:'0147_0149',label:'01:47-01:49'},{id:'0308_0321',label:'03:08-03:21'}]},
      {id:'method',label:'Что именно сделали',options:[{id:'whole_container_swap',label:'Заменили контейнер целиком подготовленным двойником'},{id:'contents_transfer',label:'Вскрыли контейнер и переложили содержимое'},{id:'documents_only',label:'Подменили только документы и пломбу'},{id:'train_diversion',label:'Увели весь состав на скрытую ветку'}]},
      {id:'executor',label:'Кто физически выполнил замену',options:[{id:'rybakov',label:'Денис Рыбаков'},{id:'volkova',label:'Анна Волкова'},{id:'saveliev',label:'Николай Савельев'},{id:'nesterov',label:'Павел Нестеров'}]},
      {id:'organizer',label:'Кто организовал схему — и зачем',options:[{id:'markova',label:'Ирина Маркова — перепродажа модулей заранее найденному покупателю'},{id:'markova_sabotage',label:'Ирина Маркова — срыв поставки лаборатории Vectoris'},{id:'rybakov_resale',label:'Денис Рыбаков — самостоятельная перепродажа груза'},{id:'volkova_cover',label:'Анна Волкова — сокрытие ошибки в работе Вектора-12'},{id:'nesterov_resale',label:'Павел Нестеров — перепродажа через OPS.SHARED'}]},
    ],
    minEvidencePerPlayer:2,
  };

  const finalTruth = { replacement:'tk0', place:'vector12_loop_b', window:'0206_0222', method:'whole_container_swap', executor:'rybakov', organizer:'markova' };
  const categories = { M05:['identity'], G02:['identity'], M08:['physical_execution'], M06:['physical_execution'], G04:['physical_execution'], G05:['physical_execution'], G06:['physical_execution'], M09:['preparation','motive_egress'], G10:['preparation'], G13:['motive_market'], M07:['coordination'], G08:['coordination'], G09:['coordination'], M10:['opportunity'] };
  const requiredCategories = ['identity','physical_execution','preparation','coordination','motive_egress','motive_market'];
  const reveal = {
    title:'Правильный номер на неправильном контейнере',
    timeline:[['За 4 дня','Delta Calibration запрашивает восемь модулей той же серии и предлагает теневую цену.'],['За 3 дня, 17:48','Маркова изучает параметры CAXU 771204 2.'],['За 3 дня, 18:03','ТК-0 отправляется в сервисный бокс 3 для подготовки двойника.'],['За 3 дня, 18:11','Маркова заранее создает сервисный пропуск RET-184 для вывоза оригинального CAXU к Delta Calibration.'],['01:47','С L-14 звонят на Вектор-12.'],['01:49','С того же рабочего места создается Т-04391 на ТК-0.'],['02:06','Состав №214 останавливают на петле Б.'],['02:11','R-4 снимает оригинальный CAXU с шестого вагона и ставит его на ожидающее шасси K-17.'],['02:15','R-4 поднимает подготовленный ТК-0 с балластом.'],['02:18','Двойник устанавливают на шестой вагон.'],['02:22','Состав продолжает маршрут.'],['02:24','K-17 с оригинальным CAXU уходит с технической площадки к сервисным воротам.'],['02:36','Настоящий контейнер с восемью модулями покидает узел по заранее оформленному сервисному пропуску.'],['03:08','На Южный терминал прибывает правильный номер на неправильном контейнере.']],
    closing:'Маркова выбрала дорогостоящий груз под заранее найденного покупателя, подготовила ТК-0 как двойник и создала маршрут вывоза оригинала. GPS контролировал локомотив, железная дорога — вагон, грузовая база — номер, весы — массу, а сервисные ворота — только заранее оформленный пропуск. Ни одна система не проверила всю цепочку как единое событие.',
  };

  const freshState = () => ({
    revision:1,
    chapter:1,
    shared:{ initialHypothesesComplete:false, photoComparisonSolved:false, t04391Linked:false, physicalSwapProven:false, endpoint184Linked:false, finalConsensus:false, finalSolved:false },
    players:{
      creator:{ firstHypothesis:null, checkpoints:{}, finalDraft:null },
      guest:{ firstHypothesis:null, checkpoints:{}, finalDraft:null },
    },
  });

  const loadState = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STATE_STORAGE) || 'null');
      if (parsed?.players?.creator && parsed?.players?.guest && parsed?.shared) return parsed;
    } catch {}
    return freshState();
  };
  let demo = loadState();
  const saveState = () => localStorage.setItem(STATE_STORAGE, JSON.stringify(demo));
  const bump = () => { demo.revision = Number(demo.revision || 0) + 1; saveState(); };

  const currentRole = () => localStorage.getItem(ROLE_STORAGE) === 'guest' ? 'guest' : 'creator';
  const keyForRole = (role) => role === 'guest' ? GUEST_KEY : CREATOR_KEY;
  const roleForKey = (key) => key === GUEST_KEY ? 'guest' : 'creator';

  const checkpointUiForRole = (role) => {
    if (demo.chapter === 2 && !demo.shared.photoComparisonSolved) return { photo_observation:photoUi };
    if (demo.chapter === 3 && !demo.shared.t04391Linked) return { t04391_link:{...checkpointUiMeta.t04391_link,options:roleOptions.t04391_link[role]} };
    if (demo.chapter === 4 && !demo.shared.physicalSwapProven) return { physical_operation:{...checkpointUiMeta.physical_operation,options:roleOptions.physical_operation[role]} };
    if (demo.chapter === 4 && demo.shared.physicalSwapProven && !demo.shared.endpoint184Linked) return { endpoint_link:{...checkpointUiMeta.endpoint_link,options:roleOptions.endpoint_link[role]} };
    return {};
  };

  const buildView = (role) => {
    const other = role === 'creator' ? 'guest' : 'creator';
    const me = demo.players[role];
    const visible = Object.values(evidence).filter((item) => item.role === role && Number(item.chapter) <= Number(demo.chapter));
    return {
      ok:true,
      case:{
        id:CASE_ID, version:1, title:'Нулевой контейнер', subtitle:'Асимметричное расследование для двух игроков', duration:'40-50 минут', difficulty:'Выше средней', access:'free',
        brief:{ kicker:'Дело ML-ZC01', lead:'03:21. Южный грузовой терминал. Состав №214 прибыл без отклонений от маршрута. Контейнер CAXU 771204 2 на месте, пломба совпадает, масса почти совпадает. Внутри вместо восьми промышленных оптических модулей лежит балласт.', mission:'Восстановите, где и как исчез настоящий груз. У вас разные материалы, поэтому обсуждайте факты вслух.' },
        chapters:chapters.filter((item) => item.id <= demo.chapter),
        initialHypothesisOptions:demo.chapter === 1 ? initialHypothesisOptions : [],
        checkpointUi:checkpointUiForRole(role),
        finalUi:demo.chapter >= 5 ? finalUi : null,
      },
      room:{ code:ROOM_CODE, caseId:CASE_ID, caseTitle:'Нулевой контейнер', casePath:location.pathname, roomUrl:location.href, createdAt:new Date().toISOString(), expiresAt:'2099-12-31T23:59:59.000Z' },
      me:{ role, roleTitle:roleMeta[role].title, roleMark:roleMeta[role].mark, roleShort:roleMeta[role].short, name:`Демо · ${roleMeta[role].title}`, started:true, completed:Boolean(demo.shared.finalSolved), firstHypothesis:me.firstHypothesis, checkpoints:me.checkpoints, finalDraft:me.finalDraft },
      opponent:{ joined:true, role:other, name:`Демо · ${roleMeta[other].title}`, started:true, completed:Boolean(demo.shared.finalSolved) },
      bothJoined:true, bothStarted:true,
      state:{ chapter:demo.chapter, revision:demo.revision, shared:{...demo.shared} },
      evidence:visible,
      resolution:demo.shared.finalSolved ? reveal : null,
    };
  };

  const jsonResponse = (status, body) => new Response(JSON.stringify(body), { status, headers:{ 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' } });
  const matches = (actual, expected) => {
    if (typeof expected === 'string') return String(actual || '') === expected;
    if (!actual || typeof actual !== 'object') return false;
    return Object.entries(expected).every(([key,value]) => actual[key] === value);
  };
  const photoScore = (actual, expected) => ['patch','scratch','door_deformation'].filter((key) => actual?.[key] === expected[key]).length;
  const finalDiff = (a,b) => finalUi.fields.filter((field) => String(a[field.id] || '') !== String(b[field.id] || '')).map((field) => ({ field:field.id, label:field.label, mine:a[field.id] || '', partner:b[field.id] || '' }));
  const contradiction = (a) => {
    if (a.method !== finalTruth.method || a.replacement !== finalTruth.replacement) return 'BODY_IDENTITY_UNEXPLAINED';
    if (a.place !== finalTruth.place || a.window !== finalTruth.window) return 'STOP_WINDOW_UNEXPLAINED';
    if (a.executor !== finalTruth.executor) return 'PHYSICAL_EXECUTION_UNEXPLAINED';
    if (a.organizer !== finalTruth.organizer) return 'ORGANIZER_LACKS_PREPARATION_ACCESS';
    return '';
  };
  const missingCategory = (ids) => {
    const found = new Set();
    for (const id of ids) for (const category of categories[id] || []) found.add(category);
    return requiredCategories.find((category) => !found.has(category)) || '';
  };

  const handleApi = (body) => {
    const role = roleForKey(String(body.browserKey || ''));
    const action = String(body.action || '');

    if (action === 'preview') return [200,{ ok:true, room:{code:ROOM_CODE,caseId:CASE_ID,caseTitle:'Нулевой контейнер'}, creatorName:'Демо · Маршрут', roomFull:true }];
    if (action === 'create' || action === 'join' || action === 'start' || action === 'status') return [200,buildView(role)];

    if (action === 'submit_checkpoint') {
      const id = String(body.checkpointId || '');
      if (id === 'initial_hypothesis') {
        const value = String(body.value || '');
        if (demo.chapter !== 1) {
          if (demo.players[role].firstHypothesis === value) return [200,buildView(role)];
          return [409,{error:'checkpoint_locked',requiredChapter:1}];
        }
        demo.players[role].firstHypothesis = value;
        if (demo.players.creator.firstHypothesis && demo.players.guest.firstHypothesis) {
          demo.shared.initialHypothesesComplete = true;
          demo.chapter = 2;
        }
        bump();
        return [200,{...buildView(role),checkpointResult:{id,correct:true,sharedUnlocked:demo.shared.initialHypothesesComplete}}];
      }

      const rule = checkpointRules[id];
      if (!rule) return [400,{error:'unsupported_checkpoint'}];
      if (demo.chapter !== rule.chapter) {
        const stored = demo.players[role].checkpoints[id];
        if (stored?.correct) return [200,{...buildView(role),checkpointResult:{id,correct:true,sharedUnlocked:Boolean(demo.shared[rule.sharedKey])}}];
        return [409,{error:'checkpoint_locked',requiredChapter:rule.chapter}];
      }
      for (const key of rule.requiresShared || []) if (!demo.shared[key]) return [409,{error:'checkpoint_locked',required:key}];

      const value = body.value ?? null;
      const correct = id === 'photo_observation' ? photoScore(value,rule.expected[role]) >= 2 : matches(value,rule.expected[role]);
      demo.players[role].checkpoints[id] = { value, correct };
      const other = role === 'creator' ? 'guest' : 'creator';
      if (correct && demo.players[other].checkpoints[id]?.correct) {
        demo.shared[rule.sharedKey] = true;
        demo.chapter = Math.max(demo.chapter,rule.unlockChapter);
      }
      bump();
      return [200,{...buildView(role),checkpointResult:{id,correct,sharedUnlocked:Boolean(demo.shared[rule.sharedKey])}}];
    }

    if (action === 'submit_final') {
      if (demo.chapter < 5) return [409,{error:'final_locked'}];
      const answers = body.answers && typeof body.answers === 'object' ? {...body.answers} : null;
      const ids = Array.isArray(body.evidenceIds) ? [...new Set(body.evidenceIds.map(String))] : [];
      if (!answers || finalUi.fields.some((field) => !answers[field.id])) return [400,{error:'final_incomplete'}];
      const allowed = new Set(Object.values(evidence).filter((item) => item.role === role && item.chapter <= 5).map((item) => item.id));
      if (ids.length < finalUi.minEvidencePerPlayer || ids.some((id) => !allowed.has(id))) return [400,{error:'invalid_final_evidence'}];
      demo.players[role].finalDraft = { answers, evidenceIds:ids };
      const other = role === 'creator' ? 'guest' : 'creator';
      const otherDraft = demo.players[other].finalDraft;
      bump();
      if (!otherDraft) return [200,{...buildView(role),finalResult:{status:'waiting_partner'}}];
      const diffs = finalDiff(answers,otherDraft.answers || {});
      if (diffs.length) {
        demo.shared.finalConsensus = false;
        saveState();
        return [200,{...buildView(role),finalResult:{status:'disagreement',differences:diffs}}];
      }
      demo.shared.finalConsensus = true;
      const hole = contradiction(answers);
      if (hole) { saveState(); return [200,{...buildView(role),finalResult:{status:'contradiction',code:hole}}]; }
      const gap = missingCategory([...new Set([...ids,...(otherDraft.evidenceIds || [])])]);
      if (gap) { saveState(); return [200,{...buildView(role),finalResult:{status:'evidence_gap',category:gap}}]; }
      demo.shared.finalSolved = true;
      demo.chapter = 6;
      bump();
      return [200,{...buildView(role),finalResult:{status:'solved'}}];
    }

    return [400,{error:'invalid_action'}];
  };

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!String(url).includes(ENDPOINT)) return nativeFetch(input,init);
    let body = {};
    try { body = JSON.parse(String(init?.body || '{}')); } catch { return jsonResponse(400,{error:'invalid_json'}); }
    const [status,payload] = handleApi(body);
    return jsonResponse(status,payload);
  };

  const setRole = (role) => {
    localStorage.setItem(ROLE_STORAGE,role);
    localStorage.setItem(CLIENT_KEY_STORAGE,keyForRole(role));
    const joinedKey = `mysterylogic:partner-v2:${CASE_ID}:joined:${ROOM_CODE}`;
    localStorage.setItem(joinedKey,'1');
  };

  const resetDemo = () => {
    demo = freshState();
    saveState();
    setRole('creator');
    sessionStorage.removeItem(`mysterylogic:partner-v2:${ROOM_CODE}:photo-attempts`);
    location.reload();
  };

  const addDemoBar = () => {
    document.body.classList.add('partner-v2-demo-mode');
    const style = document.createElement('style');
    style.textContent = `
      .partner-v2-demo-bar{position:sticky;top:0;z-index:1000;display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;padding:10px 14px;background:#f3b33d;color:#111;font:700 14px/1.2 system-ui,sans-serif;border-bottom:1px solid #be7d00}
      .partner-v2-demo-bar strong{letter-spacing:.04em}.partner-v2-demo-bar span{font-weight:600;opacity:.8}
      .partner-v2-demo-bar button{border:1px solid rgba(0,0,0,.3);background:#fff;color:#111;border-radius:9px;padding:9px 13px;min-height:40px;font:700 13px system-ui,sans-serif;cursor:pointer}
      .partner-v2-demo-bar button[aria-pressed="true"]{background:#111;color:#fff}
      .partner-v2-demo-bar .is-reset{background:transparent}
      .partner-v2-demo-mode [data-action="copy"],.partner-v2-demo-mode [data-action="share"]{display:none!important}
      @media(max-width:620px){.partner-v2-demo-bar{justify-content:flex-start}.partner-v2-demo-bar span{width:100%}}
    `;
    document.head.appendChild(style);
    const bar = document.createElement('div');
    bar.className = 'partner-v2-demo-bar';
    bar.innerHTML = `<strong>ДЕМО-РЕЖИМ</strong><span>Одна партия · переключайтесь между двумя экранами</span><button type="button" data-demo-role="creator">МАРШРУТ</button><button type="button" data-demo-role="guest">ГРУЗ</button><button type="button" class="is-reset" data-demo-reset>Сбросить демо</button>`;
    document.body.prepend(bar);
    const active = currentRole();
    for (const button of bar.querySelectorAll('[data-demo-role]')) button.setAttribute('aria-pressed',button.dataset.demoRole === active ? 'true' : 'false');
    bar.addEventListener('click',(event) => {
      const roleButton = event.target.closest?.('[data-demo-role]');
      if (roleButton) {
        setRole(roleButton.dataset.demoRole === 'guest' ? 'guest' : 'creator');
        location.reload();
        return;
      }
      if (event.target.closest?.('[data-demo-reset]') && confirm('Сбросить демо и начать расследование заново?')) resetDemo();
    });
  };

  const role = new URL(location.href).searchParams.get('role') === 'guest' ? 'guest' : currentRole();
  setRole(role);
  saveState();
  const url = new URL(location.href);
  url.searchParams.set('demo','1');
  url.searchParams.set('room',ROOM_CODE);
  url.searchParams.delete('role');
  history.replaceState(null,'',url);
  addDemoBar();
})();