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
export const LAZAREV_ID='lazarev';
export type P17EvidenceId=typeof TRAIN_LOG_ID|typeof DOOR_LOG_ID|typeof VESTIBULE_ID|typeof PERSONNEL_ID|typeof VORONINA_ID|typeof K17_MAP_ID|typeof PHONE_ROUTE_ID|typeof OFFICE_LOG_ID;

export type P17Turn={question:string;answer:string;at:string};
export type EvidenceState={discovered:boolean;shared:boolean;discoveredBy:P17Role|null};
export type P17State={version:number;started:boolean;evidence:Record<P17EvidenceId,EvidenceState>;lazarev:{disclosureLevel:number;evidenceExposure:string[];contradictions:string[];history:P17Turn[]};analystHistory:Array<{query:string;intent:string;result:string;at:string}>;fieldHistory:Array<{query:string;intent:string;result:string;at:string}>};
const emptyEvidence=():EvidenceState=>({discovered:false,shared:false,discoveredBy:null});
export function initialP17State():P17State{return{version:3,started:true,evidence:{[TRAIN_LOG_ID]:emptyEvidence(),[DOOR_LOG_ID]:emptyEvidence(),[VESTIBULE_ID]:emptyEvidence(),[PERSONNEL_ID]:emptyEvidence(),[VORONINA_ID]:emptyEvidence(),[K17_MAP_ID]:emptyEvidence(),[PHONE_ROUTE_ID]:emptyEvidence(),[OFFICE_LOG_ID]:emptyEvidence()},lazarev:{disclosureLevel:0,evidenceExposure:[],contradictions:[],history:[]},analystHistory:[],fieldHistory:[]}}
function normalizeEvidence(raw:any):EvidenceState{return{discovered:Boolean(raw?.discovered),shared:Boolean(raw?.shared),discoveredBy:raw?.discoveredBy==='analyst'||raw?.discoveredBy==='investigator'?raw.discoveredBy:null}}
export function normalizeP17State(raw:unknown):P17State{const base=initialP17State();if(!raw||typeof raw!=='object'||Array.isArray(raw))return base;const x=raw as Record<string,any>,e=x.evidence||{},l=x.lazarev||{};return{version:3,started:Boolean(x.started??true),evidence:{[TRAIN_LOG_ID]:normalizeEvidence(e[TRAIN_LOG_ID]||e.train_actual_movement),[DOOR_LOG_ID]:normalizeEvidence(e[DOOR_LOG_ID]),[VESTIBULE_ID]:normalizeEvidence(e[VESTIBULE_ID]),[PERSONNEL_ID]:normalizeEvidence(e[PERSONNEL_ID]),[VORONINA_ID]:normalizeEvidence(e[VORONINA_ID]),[K17_MAP_ID]:normalizeEvidence(e[K17_MAP_ID]),[PHONE_ROUTE_ID]:normalizeEvidence(e[PHONE_ROUTE_ID]),[OFFICE_LOG_ID]:normalizeEvidence(e[OFFICE_LOG_ID])},lazarev:{disclosureLevel:Math.max(0,Math.min(3,Number(l.disclosureLevel)||0)),evidenceExposure:Array.isArray(l.evidenceExposure)?l.evidenceExposure.filter((v:any)=>typeof v==='string').slice(-40):[],contradictions:Array.isArray(l.contradictions)?l.contradictions.filter((v:any)=>typeof v==='string').slice(-40):[],history:Array.isArray(l.history)?l.history.slice(-30).map((t:any)=>({question:String(t?.question||'').slice(0,900),answer:String(t?.answer||'').slice(0,1500),at:String(t?.at||'')})).filter((t:any)=>t.question&&t.answer):[]},analystHistory:Array.isArray(x.analystHistory)?x.analystHistory.slice(-50).map((t:any)=>({query:String(t?.query||'').slice(0,900),intent:String(t?.intent||''),result:String(t?.result||'').slice(0,2600),at:String(t?.at||'')})):[],fieldHistory:Array.isArray(x.fieldHistory)?x.fieldHistory.slice(-50).map((t:any)=>({query:String(t?.query||'').slice(0,900),intent:String(t?.intent||''),result:String(t?.result||'').slice(0,2600),at:String(t?.at||'')})):[]}}

export function roleFromDuel(role:string):P17Role{return role==='creator'?'investigator':'analyst'}

export function resolveAnalystIntent(text:string):P17EvidenceId|'unknown'{const q=text.toLowerCase().replace(/ё/g,'е');
 const train=/(поезд|состав|рейс|142|вагон)/.test(q),movement=/(останов|стоял|останавли|движен|маршрут|ход|диспетчер|техническ)/.test(q),before=/(берегов|после отправлен|до следующ|ночью|между)/.test(q);if((train&&movement)||(movement&&before))return TRAIN_LOG_ID;
 if(/(двер|замок|контроллер|открывал|открыт|срабатыван)/.test(q)&&/(вагон|6|служеб|тамбур|поезд|00:0|ноч)/.test(q))return DOOR_LOG_ID;
 if(/(лазарев|проводник)/.test(q)&&/(кадр|личн.{0,8}дел|дисциплин|взыскан|нарушен|работ|курен)/.test(q))return PERSONNEL_ID;
 if(/(к-?17|техническ.{0,8}пост|пост)/.test(q)&&/(карт|схем|план|дорог|подъезд|площадк|вагон|расстоян)/.test(q))return K17_MAP_ID;
 if(/(телефон|мобильн|смартфон|сим|imei|геолокац|базов.{0,8}станц|оператор)/.test(q)&&/(орлов|павел|маршрут|где|перемещ|движ|00:|ноч)/.test(q))return PHONE_ROUTE_ID;
 if(/(офис|нордв?проект|пропуск|турникет|доступ|архив|шкаф|pin|пин)/.test(q)&&/(орлов|00:58|ноч|вход|выход|лог|журнал|систем)/.test(q))return OFFICE_LOG_ID;
 return 'unknown';}

export function resolveFieldIntent(text:string):P17EvidenceId|'unknown'{const q=text.toLowerCase().replace(/ё/g,'е');
 if(/(опрос|опросить|поговор|свидетел|пассажир|соседн.{0,8}купе|кто видел|очевидц)/.test(q)&&/(орлов|павел|купе|после отправ|поезд|вагон|пассажир|свидетел)/.test(q))return VORONINA_ID;
 if(/(осмотр|осмотреть|провер|тамбур|ступен|выход|служебн.{0,8}двер|задн.{0,8}двер|площадк)/.test(q)&&/(вагон|6|тамбур|двер|выход|ступен)/.test(q))return VESTIBULE_ID;
 return 'unknown';}

export const EVIDENCE_CATALOG:Record<P17EvidenceId,{id:P17EvidenceId;title:string;source:string;body:string}>={
 [TRAIN_LOG_ID]:{id:TRAIN_LOG_ID,title:'Фактический журнал движения поезда №142',source:'Диспетчерская система движения',body:'23:46:00 — Центральный — отправление\n00:08:47 — пост К-17 — остановка\n00:10:19 — пост К-17 — отправление\n01:42:00 — Береговая — прибытие\n\nПричина остановки К-17: пропуск встречного состава. Пост К-17 не является пассажирской станцией.'},
 [DOOR_LOG_ID]:{id:DOOR_LOG_ID,title:'Журнал дверей вагона №6',source:'Бортовой контроллер дверей',body:'23:46:18 — наружные двери заблокированы\n00:09:21 — задняя служебная дверь: ОТКРЫТА\n00:10:02 — задняя служебная дверь: ЗАКРЫТА\n01:42:31 — наружные двери разблокированы\n\nАварийного срабатывания и ошибки замка в интервале 00:00–01:42 не зафиксировано.'},
 [VESTIBULE_ID]:{id:VESTIBULE_ID,title:'Осмотр заднего тамбура вагона №6',source:'Полевой осмотр',body:'На нижней ступени служебного выхода обнаружены свежая влажная светлая гранитная крошка и частичные следы обуви. Рядом — свежий окурок; запах табака сохраняется. В пассажирской части вагона такой крошки не обнаружено. Замок и ручка двери исправны, следов взлома нет.'},
 [PERSONNEL_ID]:{id:PERSONNEL_ID,title:'Кадровая справка: Сергей Лазарев',source:'Служба эксплуатации поездных бригад',body:'Сергей Лазарев, проводник, стаж 11 лет.\n\nИюль: дисциплинарное взыскание за курение в запрещённом месте во время смены. В служебной отметке указано: повторное аналогичное нарушение может повлечь отстранение от рейсов и рассмотрение вопроса об увольнении.'},
 [VORONINA_ID]:{id:VORONINA_ID,title:'Первичный опрос: Елена Воронина, купе №5',source:'Полевой опрос пассажиров',body:'Елена Воронина сообщает: примерно в 23:55, уже после отправления поезда, видела Павла Орлова в коридоре вагона №6. Он обращался к проводнику и просил кипяток. После предъявления фотографии Воронина уверенно узнаёт Орлова. Других подробностей его дальнейших перемещений не видела.'},
 [K17_MAP_ID]:{id:K17_MAP_ID,title:'Схема технического поста К-17',source:'Инфраструктурная схема участка',body:'К-17 — технический пост без пассажирской платформы. В момент остановки вагон №6 находился напротив короткой служебной площадки. От задней части вагона до служебной дороги — около 35 м. Дорога выходит к шлагбауму и далее на городское направление.'},
 [PHONE_ROUTE_ID]:{id:PHONE_ROUTE_ID,title:'Маршрут основного телефона Павла Орлова',source:'Данные оператора и сетевые события',body:'23:50 — устройство следует по железнодорожному коридору после Центрального.\n00:10 — зарегистрировано в секторе К-17.\n00:31 — продолжает движение по маршруту поезда.\n00:58 — устройство всё ещё движется вдоль железной дороги, далеко от офиса «НордПроект».\n01:18 — устройство в секторе текущего положения поезда.\n\nТелефон впоследствии найден в купе Орлова подключённым к зарядке. Данные относятся к устройству, а не подтверждают местонахождение владельца.'},
 [OFFICE_LOG_ID]:{id:OFFICE_LOG_ID,title:'Система доступа «НордПроект»',source:'Контроль доступа офиса',body:'00:58:14 — вход: идентификатор Павла Орлова\n00:58:19 — персональный PIN подтверждён\n01:00:46 — зона архива\n01:01:42 — шкаф AUDIT: открыт\n01:03:08 — выход из офиса\n\nОшибок считывания и аварийного режима системы в этот интервал не зафиксировано.'},
};

export function lazarevStatement(level:number,exposure:string[]=[]){const personnel=exposure.includes(PERSONNEL_ID);if(level>=3)return `Ты признал: на технической остановке К-17 сам открыл заднюю служебную дверь и вышел на площадку покурить. Ты скрывал это, потому что боялся последствий на работе${personnel?' и следователь уже знает о твоём прежнем взыскании за курение':''}. Ты НЕ помогал Орлову исчезнуть и не видел, как он покинул вагон. Не делай вывод за следователя о том, мог ли Орлов воспользоваться открытой дверью.`;if(level===2)return 'Ты признал, что на К-17 сам открыл заднюю служебную дверь. Твоя защитная версия: вышел на минуту к служебному выходу, но не объясняешь истинную причину. Пока НЕ признавай курение. Не признавай помощь Орлову и не утверждай, что видел его выход.';if(level===1)return 'Ты признал техническую остановку К-17. Объясняешь прежнее «остановок не было» тем, что имел в виду пассажирские остановки. Пока отрицаешь, что открывал служебную дверь или выходил из вагона.';return 'После отправления ты утверждаешь, что до Береговой поезд нигде не останавливался. Пока не признавай техническую остановку, открытие двери или курение.'}
export function isTrainStopQuestion(text:string){const q=text.toLowerCase().replace(/ё/g,'е');return (/(останов|стоял|останавли|к-?17|техническ)/.test(q)&&/(поезд|состав|там|тогда|00:0|ночью|берегов|говорили|сказали)/.test(q))||(/(журнал|документ|материал|запис)/.test(q)&&/(объясн|говорили|сказали|останов)/.test(q));}
export function isDoorQuestion(text:string){const q=text.toLowerCase().replace(/ё/g,'е');return /(двер|служебн.{0,8}выход|открывал|открыта|тамбур)/.test(q)&&/(почему|зачем|кто|вы|ваша|00:09|к-?17|объясн|говорили|сказали)/.test(q);}
export function isSmokingQuestion(text:string){const q=text.toLowerCase().replace(/ё/g,'е');return /(курил|курен|сигар|окурок|табак|покур)/.test(q)&&/(вы|ваш|зачем|почему|тамбур|ступен|к-?17|объясн)/.test(q);}
