export const P17_CASE_ID='MLP17_PASSENGER';
export const P17_CASE_TITLE='Пассажир №17';
export const P17_CASE_PATH='/ru/cases/passazhir-17/';
export type P17Role='investigator'|'analyst';

export const TRAIN_LOG_ID='train_actual_movement';
export const DOOR_LOG_ID='wagon6_service_door_log';
export const VESTIBULE_ID='wagon6_rear_vestibule';
export const PERSONNEL_ID='lazarev_personnel';
export const LAZAREV_ID='lazarev';
export type P17EvidenceId=typeof TRAIN_LOG_ID|typeof DOOR_LOG_ID|typeof VESTIBULE_ID|typeof PERSONNEL_ID;

export type P17Turn={question:string;answer:string;at:string};
export type EvidenceState={discovered:boolean;shared:boolean;discoveredBy:P17Role|null};
export type P17State={
  version:number;
  started:boolean;
  evidence:Record<P17EvidenceId,EvidenceState>;
  lazarev:{
    disclosureLevel:number;
    evidenceExposure:string[];
    contradictions:string[];
    history:P17Turn[];
  };
  analystHistory:Array<{query:string;intent:string;result:string;at:string}>;
  fieldHistory:Array<{query:string;intent:string;result:string;at:string}>;
};

const emptyEvidence=():EvidenceState=>({discovered:false,shared:false,discoveredBy:null});
export function initialP17State():P17State{
  return{
    version:2,
    started:true,
    evidence:{
      [TRAIN_LOG_ID]:emptyEvidence(),
      [DOOR_LOG_ID]:emptyEvidence(),
      [VESTIBULE_ID]:emptyEvidence(),
      [PERSONNEL_ID]:emptyEvidence(),
    },
    lazarev:{disclosureLevel:0,evidenceExposure:[],contradictions:[],history:[]},
    analystHistory:[],fieldHistory:[],
  };
}

function normalizeEvidence(raw:any):EvidenceState{return{
  discovered:Boolean(raw?.discovered),
  shared:Boolean(raw?.shared),
  discoveredBy:raw?.discoveredBy==='analyst'||raw?.discoveredBy==='investigator'?raw.discoveredBy:null,
}}
export function normalizeP17State(raw:unknown):P17State{
  const base=initialP17State();
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return base;
  const x=raw as Record<string,any>;const e=x.evidence||{};const laz=x.lazarev||{};
  return{
    version:2,started:Boolean(x.started??true),
    evidence:{
      [TRAIN_LOG_ID]:normalizeEvidence(e[TRAIN_LOG_ID]||e.train_actual_movement),
      [DOOR_LOG_ID]:normalizeEvidence(e[DOOR_LOG_ID]),
      [VESTIBULE_ID]:normalizeEvidence(e[VESTIBULE_ID]),
      [PERSONNEL_ID]:normalizeEvidence(e[PERSONNEL_ID]),
    },
    lazarev:{
      disclosureLevel:Math.max(0,Math.min(3,Number(laz.disclosureLevel)||0)),
      evidenceExposure:Array.isArray(laz.evidenceExposure)?laz.evidenceExposure.filter((v:any)=>typeof v==='string').slice(-30):[],
      contradictions:Array.isArray(laz.contradictions)?laz.contradictions.filter((v:any)=>typeof v==='string').slice(-30):[],
      history:Array.isArray(laz.history)?laz.history.slice(-30).map((t:any)=>({question:String(t?.question||'').slice(0,900),answer:String(t?.answer||'').slice(0,1500),at:String(t?.at||'')})).filter((t:any)=>t.question&&t.answer):[],
    },
    analystHistory:Array.isArray(x.analystHistory)?x.analystHistory.slice(-40).map((t:any)=>({query:String(t?.query||'').slice(0,900),intent:String(t?.intent||''),result:String(t?.result||'').slice(0,2400),at:String(t?.at||'')})):[],
    fieldHistory:Array.isArray(x.fieldHistory)?x.fieldHistory.slice(-40).map((t:any)=>({query:String(t?.query||'').slice(0,900),intent:String(t?.intent||''),result:String(t?.result||'').slice(0,2400),at:String(t?.at||'')})):[],
  };
}

export function roleFromDuel(role:string):P17Role{return role==='creator'?'investigator':'analyst'}

export function resolveAnalystIntent(text:string):P17EvidenceId|'unknown'{
  const q=text.toLowerCase().replace(/ё/g,'е');
  const train=/(поезд|состав|рейс|142|вагон)/.test(q),movement=/(останов|стоял|останавли|движен|маршрут|ход|диспетчер|техническ)/.test(q),before=/(берегов|после отправлен|до следующ|ночью|между)/.test(q);
  if((train&&movement)||(movement&&before))return TRAIN_LOG_ID;
  if(/(двер|замок|контроллер|открывал|открыт|срабатыван)/.test(q)&&/(вагон|6|служеб|тамбур|поезд|00:0|ноч)/.test(q))return DOOR_LOG_ID;
  if(/(лазарев|проводник)/.test(q)&&/(кадр|личн.{0,8}дел|дисциплин|взыскан|нарушен|работ|курен)/.test(q))return PERSONNEL_ID;
  return 'unknown';
}

export function resolveFieldIntent(text:string):P17EvidenceId|'unknown'{
  const q=text.toLowerCase().replace(/ё/g,'е');
  if(/(осмотр|осмотреть|провер|тамбур|ступен|выход|служебн.{0,8}двер|задн.{0,8}двер|площадк)/.test(q)&&/(вагон|6|тамбур|двер|выход|ступен)/.test(q))return VESTIBULE_ID;
  return 'unknown';
}

export const EVIDENCE_CATALOG:Record<P17EvidenceId,{id:P17EvidenceId;title:string;source:string;body:string}>={
  [TRAIN_LOG_ID]:{id:TRAIN_LOG_ID,title:'Фактический журнал движения поезда №142',source:'Диспетчерская система движения',body:'23:46:00 — Центральный — отправление\n00:08:47 — пост К-17 — остановка\n00:10:19 — пост К-17 — отправление\n01:42:00 — Береговая — прибытие\n\nПричина остановки К-17: пропуск встречного состава. Пост К-17 не является пассажирской станцией.'},
  [DOOR_LOG_ID]:{id:DOOR_LOG_ID,title:'Журнал дверей вагона №6',source:'Бортовой контроллер дверей',body:'23:46:18 — наружные двери заблокированы\n00:09:21 — задняя служебная дверь: ОТКРЫТА\n00:10:02 — задняя служебная дверь: ЗАКРЫТА\n01:42:31 — наружные двери разблокированы\n\nАварийного срабатывания и ошибки замка в интервале 00:00–01:42 не зафиксировано.'},
  [VESTIBULE_ID]:{id:VESTIBULE_ID,title:'Осмотр заднего тамбура вагона №6',source:'Полевой осмотр',body:'На нижней ступени служебного выхода обнаружены свежая влажная светлая гранитная крошка и частичные следы обуви. Рядом — свежий окурок; запах табака сохраняется. В пассажирской части вагона такой крошки не обнаружено. Замок и ручка двери исправны, следов взлома нет.'},
  [PERSONNEL_ID]:{id:PERSONNEL_ID,title:'Кадровая справка: Сергей Лазарев',source:'Служба эксплуатации поездных бригад',body:'Сергей Лазарев, проводник, стаж 11 лет.\n\nИюль: дисциплинарное взыскание за курение в запрещённом месте во время смены. В служебной отметке указано: повторное аналогичное нарушение может повлечь отстранение от рейсов и рассмотрение вопроса об увольнении.'},
};

export function lazarevStatement(level:number,exposure:string[]=[]){
  const personnel=exposure.includes(PERSONNEL_ID);
  if(level>=3)return `Ты признал: на технической остановке К-17 сам открыл заднюю служебную дверь и вышел на площадку покурить. Ты скрывал это, потому что боялся последствий на работе${personnel?' и следователь уже знает о твоём прежнем взыскании за курение':''}. Ты НЕ помогал Орлову исчезнуть и не видел, как он покинул вагон. Не делай вывод за следователя о том, мог ли Орлов воспользоваться открытой дверью.`;
  if(level===2)return 'Ты признал, что на К-17 сам открыл заднюю служебную дверь. Твоя защитная версия: вышел на минуту к служебному выходу, но не объясняешь истинную причину. Пока НЕ признавай курение. Не признавай помощь Орлову и не утверждай, что видел его выход.';
  if(level===1)return 'Ты признал техническую остановку К-17. Объясняешь прежнее «остановок не было» тем, что имел в виду пассажирские остановки. Пока отрицаешь, что открывал служебную дверь или выходил из вагона.';
  return 'После отправления ты утверждаешь, что до Береговой поезд нигде не останавливался. Пока не признавай техническую остановку, открытие двери или курение.';
}

export function isTrainStopQuestion(text:string){const q=text.toLowerCase().replace(/ё/g,'е');return (/(останов|стоял|останавли|к-?17|техническ)/.test(q)&&/(поезд|состав|там|тогда|00:0|ночью|берегов|говорили|сказали)/.test(q))||(/(журнал|документ|материал|запис)/.test(q)&&/(объясн|говорили|сказали|останов)/.test(q));}
export function isDoorQuestion(text:string){const q=text.toLowerCase().replace(/ё/g,'е');return /(двер|служебн.{0,8}выход|открывал|открыта|тамбур)/.test(q)&&/(почему|зачем|кто|вы|ваша|00:09|к-?17|объясн|говорили|сказали)/.test(q);}
export function isSmokingQuestion(text:string){const q=text.toLowerCase().replace(/ё/g,'е');return /(курил|курен|сигар|окурок|табак|покур)/.test(q)&&/(вы|ваш|зачем|почему|тамбур|ступен|к-?17|объясн)/.test(q);}
