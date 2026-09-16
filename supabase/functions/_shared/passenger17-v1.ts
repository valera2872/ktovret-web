export const P17_CASE_ID='MLP17_PASSENGER';
export const P17_CASE_TITLE='Пассажир №17';
export const P17_CASE_PATH='/ru/cases/passazhir-17/';
export type P17Role='investigator'|'analyst';

export const TRAIN_LOG_ID='train_actual_movement';
export const LAZAREV_ID='lazarev';

export type P17Turn={question:string;answer:string;at:string};
export type P17State={
  version:number;
  started:boolean;
  evidence:{
    train_actual_movement:{discovered:boolean;shared:boolean;discoveredBy:P17Role|null};
  };
  lazarev:{
    disclosureLevel:number;
    evidenceExposure:string[];
    contradictions:string[];
    history:P17Turn[];
  };
  analystHistory:Array<{query:string;intent:string;result:string;at:string}>;
};

export function initialP17State():P17State{
  return{
    version:1,
    started:true,
    evidence:{train_actual_movement:{discovered:false,shared:false,discoveredBy:null}},
    lazarev:{disclosureLevel:0,evidenceExposure:[],contradictions:[],history:[]},
    analystHistory:[],
  };
}

export function normalizeP17State(raw:unknown):P17State{
  const base=initialP17State();
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return base;
  const x=raw as Record<string,any>;
  const evidence=x.evidence?.train_actual_movement||{};
  const laz=x.lazarev||{};
  return{
    version:1,
    started:Boolean(x.started??true),
    evidence:{train_actual_movement:{
      discovered:Boolean(evidence.discovered),
      shared:Boolean(evidence.shared),
      discoveredBy:evidence.discoveredBy==='analyst'||evidence.discoveredBy==='investigator'?evidence.discoveredBy:null,
    }},
    lazarev:{
      disclosureLevel:Math.max(0,Math.min(1,Number(laz.disclosureLevel)||0)),
      evidenceExposure:Array.isArray(laz.evidenceExposure)?laz.evidenceExposure.filter((v:any)=>typeof v==='string').slice(-20):[],
      contradictions:Array.isArray(laz.contradictions)?laz.contradictions.filter((v:any)=>typeof v==='string').slice(-20):[],
      history:Array.isArray(laz.history)?laz.history.slice(-24).map((t:any)=>({question:String(t?.question||'').slice(0,900),answer:String(t?.answer||'').slice(0,1500),at:String(t?.at||'')})).filter((t:any)=>t.question&&t.answer):[],
    },
    analystHistory:Array.isArray(x.analystHistory)?x.analystHistory.slice(-30).map((t:any)=>({query:String(t?.query||'').slice(0,900),intent:String(t?.intent||''),result:String(t?.result||'').slice(0,2000),at:String(t?.at||'')})):[],
  };
}

export function roleFromDuel(role:string):P17Role{return role==='creator'?'investigator':'analyst'}

export function resolveInvestigationIntent(text:string){
  const q=text.toLowerCase().replace(/ё/g,'е');
  const train=/(поезд|состав|рейс|142|вагон)/.test(q);
  const movement=/(останов|стоял|останавли|движен|маршрут|ход|диспетчер|техническ)/.test(q);
  const beforeBeregovaya=/(берегов|после отправлен|до следующ|ночью|между)/.test(q);
  if((train&&movement)||(movement&&beforeBeregovaya))return TRAIN_LOG_ID;
  return 'unknown';
}

export const TRAIN_LOG={
  id:TRAIN_LOG_ID,
  title:'Фактический журнал движения поезда №142',
  source:'Диспетчерская система движения',
  body:'23:46:00 — Центральный — отправление\n00:08:47 — пост К-17 — остановка\n00:10:19 — пост К-17 — отправление\n01:42:00 — Береговая — прибытие\n\nПричина остановки К-17: пропуск встречного состава. Пост К-17 не является пассажирской станцией.',
};

export function lazarevStatement(level:number){
  if(level>=1)return 'Ты уже признал, что в 00:08:47 поезд сделал техническую остановку на посту К-17. Твоя текущая защитная версия: когда раньше говорил «остановок не было», ты имел в виду пассажирские остановки. НЕ признавай открытие двери, курение, деньги Орлова, его выход из вагона или автомобиль: для этого ещё нет разрешённого раскрытия.';
  return 'Твоя текущая защитная версия: после отправления до Береговой поезд нигде не останавливался. Ты уверенно это утверждаешь. НЕ признавай техническую остановку К-17, открытие двери, курение, деньги Орлова, выход Орлова или автомобиль, пока правило раскрытия не сработало.';
}

export function isTrainStopQuestion(text:string){
  const q=text.toLowerCase().replace(/ё/g,'е');
  return /(останов|стоял|останавли|к-?17|техническ)/.test(q)&&/(поезд|состав|там|тогда|00:0|ночью|берегов|вы сказали|говорили)/.test(q);
}
