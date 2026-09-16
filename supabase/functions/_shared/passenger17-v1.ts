export const P17_CASE_ID='MLP17_PASSENGER';
export const P17_CASE_TITLE='Пассажир №17';
export const P17_CASE_PATH='/ru/cases/passazhir-17/';
export type P17Role='investigator'|'analyst';

export const TRAIN_LOG_ID='train_actual_movement';
export const DOOR_LOG_ID='wagon6_service_door_log';
export const VESTIBULE_ID='wagon6_rear_vestibule';
export const PERSONNEL_ID='lazarev_personnel';
export const VORONINA_ID='voronina_statement';
export const K17_MAP_ID='k17_site_map';
export const PHONE_ROUTE_ID='orlov_phone_route';
export const OFFICE_LOG_ID='nordproject_access_log';
export const K17_CCTV_ID='k17_service_road_cctv';
export const AUDIT3_ID='audit3_internal_report';
export const MARINA_STATEMENT_ID='marina_initial_statement';
export const MARINA_CHAT_ID='marina_divorce_chat';
export const LAZAREV_ID='lazarev';
export type P17EvidenceId=typeof TRAIN_LOG_ID|typeof DOOR_LOG_ID|typeof VESTIBULE_ID|typeof PERSONNEL_ID|typeof VORONINA_ID|typeof K17_MAP_ID|typeof PHONE_ROUTE_ID|typeof OFFICE_LOG_ID|typeof K17_CCTV_ID|typeof AUDIT3_ID|typeof MARINA_STATEMENT_ID|typeof MARINA_CHAT_ID;

export type P17Turn={question:string;answer:string;at:string};
export type EvidenceState={discovered:boolean;shared:boolean;discoveredBy:P17Role|null};
export type P17State={version:number;started:boolean;evidence:Record<P17EvidenceId,EvidenceState>;lazarev:{disclosureLevel:number;evidenceExposure:string[];contradictions:string[];history:P17Turn[]};analystHistory:Array<{query:string;intent:string;result:string;at:string}>;fieldHistory:Array<{query:string;intent:string;result:string;at:string}>};
const emptyEvidence=():EvidenceState=>({discovered:false,shared:false,discoveredBy:null});
const IDS:P17EvidenceId[]=[TRAIN_LOG_ID,DOOR_LOG_ID,VESTIBULE_ID,PERSONNEL_ID,VORONINA_ID,K17_MAP_ID,PHONE_ROUTE_ID,OFFICE_LOG_ID,K17_CCTV_ID,AUDIT3_ID,MARINA_STATEMENT_ID,MARINA_CHAT_ID];
export function initialP17State():P17State{const evidence={} as Record<P17EvidenceId,EvidenceState>;for(const id of IDS)evidence[id]=emptyEvidence();return{version:4,started:true,evidence,lazarev:{disclosureLevel:0,evidenceExposure:[],contradictions:[],history:[]},analystHistory:[],fieldHistory:[]}}
function normalizeEvidence(raw:any):EvidenceState{return{discovered:Boolean(raw?.discovered),shared:Boolean(raw?.shared),discoveredBy:raw?.discoveredBy==='analyst'||raw?.discoveredBy==='investigator'?raw.discoveredBy:null}}
export function normalizeP17State(raw:unknown):P17State{const base=initialP17State();if(!raw||typeof raw!=='object'||Array.isArray(raw))return base;const x=raw as Record<string,any>,e=x.evidence||{},l=x.lazarev||{};const evidence={} as Record<P17EvidenceId,EvidenceState>;for(const id of IDS)evidence[id]=normalizeEvidence(e[id]||(id===TRAIN_LOG_ID?e.train_actual_movement:null));return{version:4,started:Boolean(x.started??true),evidence,lazarev:{disclosureLevel:Math.max(0,Math.min(3,Number(l.disclosureLevel)||0)),evidenceExposure:Array.isArray(l.evidenceExposure)?l.evidenceExposure.filter((v:any)=>typeof v==='string').slice(-50):[],contradictions:Array.isArray(l.contradictions)?l.contradictions.filter((v:any)=>typeof v==='string').slice(-50):[],history:Array.isArray(l.history)?l.history.slice(-30).map((t:any)=>({question:String(t?.question||'').slice(0,900),answer:String(t?.answer||'').slice(0,1500),at:String(t?.at||'')})).filter((t:any)=>t.question&&t.answer):[]},analystHistory:Array.isArray(x.analystHistory)?x.analystHistory.slice(-60).map((t:any)=>({query:String(t?.query||'').slice(0,900),intent:String(t?.intent||''),result:String(t?.result||'').slice(0,3000),at:String(t?.at||'')})):[],fieldHistory:Array.isArray(x.fieldHistory)?x.fieldHistory.slice(-60).map((t:any)=>({query:String(t?.query||'').slice(0,900),intent:String(t?.intent||''),result:String(t?.result||'').slice(0,3000),at:String(t?.at||'')})):[]}}

export function roleFromDuel(role:string):P17Role{return role==='creator'?'investigator':'analyst'}

export function resolveAnalystIntent(text:string):P17EvidenceId|'unknown'{const q=text.toLowerCase().replace(/ё/g,'е');
 const train=/(поезд|состав|рейс|142|вагон)/.test(q),movement=/(останов|стоял|останавли|движен|маршрут|ход|диспетчер|техническ)/.test(q),before=/(берегов|после отправлен|до следующ|ночью|между)/.test(q);if((train&&movement)||(movement&&before))return TRAIN_LOG_ID;
 if(/(двер|замок|контроллер|открывал|открыт|срабатыван)/.test(q)&&/(вагон|6|служеб|тамбур|поезд|00:0|ноч)/.test(q))return DOOR_LOG_ID;
 if(/(лазарев|проводник)/.test(q)&&/(кадр|личн.{0,8}дел|дисциплин|взыскан|нарушен|работ|курен)/.test(q))return PERSONNEL_ID;
 if(/(к-?17|техническ.{0,8}пост|пост)/.test(q)&&/(карт|схем|план|дорог|подъезд|площадк|вагон|расстоян)/.test(q))return K17_MAP_ID;
 if(/(телефон|мобильн|смартфон|сим|imei|геолокац|базов.{0,8}станц|оператор)/.test(q)&&/(орлов|павел|маршрут|где|перемещ|движ|00:|ноч)/.test(q))return PHONE_ROUTE_ID;
 if(/(офис|нордв?проект|пропуск|турникет|доступ|архив|шкаф|pin|пин)/.test(q)&&/(орлов|00:58|ноч|вход|выход|лог|журнал|систем)/.test(q))return OFFICE_LOG_ID;
 if(/(камер|видео|видеонаблюд|cctv|запис)/.test(q)&&/(к-?17|служебн.{0,8}дорог|шлагбаум|дорог|00:1|машин|автомоб)/.test(q))return K17_CCTV_ID;
 if(/(audit|аудит|внутренн.{0,8}проверк|вектор-?м|платеж|подрядчик|финанс|шкаф)/.test(q)&&/(3|орлов|нордпроект|архив|документ|отчет|отчёт|папк|платеж)/.test(q))return AUDIT3_ID;
 if(/(марин|жена|супруг|орлов)/.test(q)&&/(переписк|сообщен|чат|развод|расстав|отношен|семь)/.test(q))return MARINA_CHAT_ID;
 return 'unknown';}

export function resolveFieldIntent(text:string):P17EvidenceId|'unknown'{const q=text.toLowerCase().replace(/ё/g,'е');
 if(/(опрос|опросить|поговор|допрос|бесед)/.test(q)&&/(марин|жен|супруг)/.test(q))return MARINA_STATEMENT_ID;
 if(/(опрос|опросить|поговор|свидетел|пассажир|соседн.{0,8}купе|кто видел|очевидц)/.test(q)&&/(орлов|павел|купе|после отправ|поезд|вагон|пассажир|свидетел)/.test(q))return VORONINA_ID;
 if(/(осмотр|осмотреть|провер|тамбур|ступен|выход|служебн.{0,8}двер|задн.{0,8}двер|площадк)/.test(q)&&/(вагон|6|тамбур|двер|выход|ступен)/.test(q))return VESTIBULE_ID;
 return 'unknown';}

export const EVIDENCE_CATALOG:Record<P17EvidenceId,{id:P17EvidenceId;title:string;source:string;body:string}>={
 [TRAIN_LOG_ID]:{id:TRAIN_LOG_ID,title:'Фактический журнал движения поезда №142',source:'Диспетчерская система движения',body:'23:46:00 — Центральный — отправление\n00:08:47 — пост К-17 — остановка\n00:10:19 — пост К-17 — отправление\n01:42:00 — Береговая — прибытие\n\nПричина остановки К-17: пропуск встречного состава. Пост К-17 не является пассажирской станцией.'},
 [DOOR_LOG_ID]:{id:DOOR_LOG_ID,title:'Журнал дверей вагона №6',source:'Бортовой контроллер дверей',body:'23:46:18 — наружные двери заблокированы\n00:09:21 — задняя служебная дверь: ОТКРЫТА\n00:10:02 — задняя служебная дверь: ЗАКРЫТА\n01:42:31 — наружные двери разблокированы\n\nАварийного срабатывания и ошибки замка в интервале 00:00–01:42 не зафиксировано.'},
 [VESTIBULE_ID]:{id:VESTIBULE_ID,title:'Осмотр заднего тамбура вагона №6',source:'Полевой осмотр',body:'На нижней ступени служебного выхода обнаружены свежая влажная светлая гранитная крошка и частичные следы обуви. Рядом — свежий окурок; запах табака сохраняется. В пассажирской части вагона такой крошки не обнаружено. Замок и ручка двери исправны, следов взлома нет.'},
 [PERSONNEL_ID]:{id:PERSONNEL_ID,title:'Кадровая справка: Сергей Лазарев',source:'Служба эксплуатации поездных бригад',body:'Сергей Лазарев, проводник, стаж 11 лет.\n\nИюль: дисциплинарное взыскание за курение в запрещённом месте во время смены. В служебной отметке указано: повторное аналогичное нарушение может повлечь отстранение от рейсов и рассмотрение вопроса об увольнении.'},
 [VORONINA_ID]:{id:VORONINA_ID,title:'Первичный опрос: Елена Воронина, купе №5',source:'Полевой опрос пассажиров',body:'Примерно в 23:55, уже после отправления, Воронина видела Павла Орлова в коридоре вагона №6. Он обращался к проводнику и просил кипяток. После предъявления фотографии уверенно узнаёт Орлова.'},
 [K17_MAP_ID]:{id:K17_MAP_ID,title:'Схема технического поста К-17',source:'Инфраструктурная схема участка',body:'К-17 — технический пост без пассажирской платформы. Вагон №6 находился напротив короткой служебной площадки. От задней части вагона до служебной дороги — около 35 м. Дорога выходит к шлагбауму и далее на городское направление.'},
 [PHONE_ROUTE_ID]:{id:PHONE_ROUTE_ID,title:'Маршрут основного телефона Павла Орлова',source:'Данные оператора и сетевые события',body:'00:10 — устройство в секторе К-17.\n00:31 — продолжает движение по маршруту поезда.\n00:58 — устройство всё ещё движется вдоль железной дороги, далеко от офиса «НордПроект».\n01:18 — устройство в секторе текущего положения поезда.\n\nТелефон впоследствии найден в купе Орлова подключённым к зарядке. Данные относятся к устройству, а не подтверждают местонахождение владельца.'},
 [OFFICE_LOG_ID]:{id:OFFICE_LOG_ID,title:'Система доступа «НордПроект»',source:'Контроль доступа офиса',body:'00:58:14 — вход: идентификатор Павла Орлова\n00:58:19 — персональный PIN подтверждён\n01:00:46 — зона архива\n01:01:42 — шкаф AUDIT: открыт\n01:03:08 — выход из офиса\n\nОшибок считывания и аварийного режима системы в этот интервал не зафиксировано.'},
 [K17_CCTV_ID]:{id:K17_CCTV_ID,title:'Камера служебной дороги К-17',source:'Архив видеонаблюдения технического поста',body:'00:16:04 — тёмный легковой автомобиль выезжает со служебной дороги К-17 в городском направлении. На записи различимы водитель и как минимум один пассажир. Номер читается частично: последние символы «…47». Лиц пассажиров камера не различает.'},
 [AUDIT3_ID]:{id:AUDIT3_ID,title:'AUDIT-3 — внутренняя проверка «НордПроект»',source:'Реестр внутреннего аудита и резервная электронная копия',body:'AUDIT-3 содержит материалы о серии платежей подрядчику ООО «Вектор-М», которые внутренний аудит признал требующими независимой проверки. Учредитель «Вектор-М» — Алексей Мельников, давний знакомый Павла Орлова. Бумажный оригинал AUDIT-3 хранился в шкафу AUDIT. Передача материалов независимым аудиторам была назначена на 09:00 следующего утра. После ночного входа Орлова бумажный экземпляр AUDIT-3 в шкафу отсутствует.'},
 [MARINA_STATEMENT_ID]:{id:MARINA_STATEMENT_ID,title:'Первичный опрос: Марина Орлова',source:'Полевой опрос супруги',body:'Марина Орлова утверждает, что серьёзного конфликта между супругами не было и Павел не собирался уходить из семьи. По её словам, в последние дни он был напряжён из-за работы. Последнее необычное сообщение от него: «После завтрашнего утра всё закончится». О планах исчезнуть или ехать ночью в офис она, по её словам, ничего не знала.'},
 [MARINA_CHAT_ID]:{id:MARINA_CHAT_ID,title:'Переписка Павла и Марины Орловых',source:'Синхронизированная копия семейного мессенджера',body:'За две недели до поездки супруги несколько раз обсуждают раздельное проживание и оформление развода. В одном сообщении Марина пишет: «После поездки спокойно подпишем всё, как договорились». Павел отвечает: «Да. Только сначала мне надо закрыть историю с проверкой». Переписка противоречит утверждению Марины о том, что серьёзного семейного конфликта и планов развода не было.'},
};

export function lazarevStatement(level:number,exposure:string[]=[]){const personnel=exposure.includes(PERSONNEL_ID);if(level>=3)return `Ты признал: на технической остановке К-17 сам открыл заднюю служебную дверь и вышел на площадку покурить. Ты скрывал это, потому что боялся последствий на работе${personnel?' и следователь уже знает о твоём прежнем взыскании за курение':''}. Ты НЕ помогал Орлову исчезнуть и не видел, как он покинул вагон. Не делай вывод за следователя о том, мог ли Орлов воспользоваться открытой дверью.`;if(level===2)return 'Ты признал, что на К-17 сам открыл заднюю служебную дверь. Твоя защитная версия: вышел на минуту к служебному выходу, но не объясняешь истинную причину. Пока НЕ признавай курение. Не признавай помощь Орлову и не утверждай, что видел его выход.';if(level===1)return 'Ты признал техническую остановку К-17. Объясняешь прежнее «остановок не было» тем, что имел в виду пассажирские остановки. Пока отрицаешь, что открывал служебную дверь или выходил из вагона.';return 'После отправления ты утверждаешь, что до Береговой поезд нигде не останавливался. Пока не признавай техническую остановку, открытие двери или курение.'}
export function isTrainStopQuestion(text:string){const q=text.toLowerCase().replace(/ё/g,'е');return (/(останов|стоял|останавли|к-?17|техническ)/.test(q)&&/(поезд|состав|там|тогда|00:0|ночью|берегов|говорили|сказали)/.test(q))||(/(журнал|документ|материал|запис)/.test(q)&&/(объясн|говорили|сказали|останов)/.test(q));}
export function isDoorQuestion(text:string){const q=text.toLowerCase().replace(/ё/g,'е');return /(двер|служебн.{0,8}выход|открывал|открыта|тамбур)/.test(q)&&/(почему|зачем|кто|вы|ваша|00:09|к-?17|объясн|говорили|сказали)/.test(q);}
export function isSmokingQuestion(text:string){const q=text.toLowerCase().replace(/ё/g,'е');return /(курил|курен|сигар|окурок|табак|покур)/.test(q)&&/(вы|ваш|зачем|почему|тамбур|ступен|к-?17|объясн)/.test(q);}
