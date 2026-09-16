import {
  CHARACTERS_V2,
  DEDUCTIONS_V2,
  EVIDENCE_V2,
  FULL_PARTNER_CASE_ID,
  FULL_PARTNER_CASE_TITLE,
  type CharacterId,
  type PartnerRole,
} from './partner-ne-publikovat-content-v2.ts';

export type BoardType = 'fact' | 'contradiction' | 'hypothesis' | 'proven' | 'disproven' | 'event';
export type EvidenceState = { unlocked:boolean; opened:boolean; findings_published:string[]; presented_to:CharacterId[] };
export type BoardItem = { id:string; type:BoardType; label:string; source_role:PartnerRole|'system'; evidence_ids:string[]; created_sequence:number };
export type CharacterState = {
  available:boolean;
  state:number;
  statement_version:number;
  disclosure_level:number;
  global_stress:number;
  evidence_exposure:string[];
  contradictions:string[];
  trust:Record<PartnerRole,number>;
  cooperation_state:'guarded'|'cooperative';
};
export type DeductionState = { result:'untried'|'confirmed'|'contradicted'|'insufficient'; attempts:number; selected:string|null };
export type ReconstructionState = { available:boolean; status:'locked'|'open'|'conflict'|'complete'; attempts:number; conflicts:string[]; last_answers:Record<string,unknown> };
export type FullPartnerState = {
  schema_version:2;
  case_id:string;
  narrative_state:string;
  milestones:string[];
  facts:string[];
  evidence:Record<string,EvidenceState>;
  board:BoardItem[];
  deductions:Record<string,DeductionState>;
  characters:Record<CharacterId,CharacterState>;
  sequence:number;
  location:{status:'locked'|'candidate'|'ready'|'submitted'; evidence_ids:string[]};
  rescue:{status:'not_started'|'dispatched'|'confirmed'; message:string|null};
  reconstruction:ReconstructionState;
  publication_decision:string|null;
  completed:boolean;
};
export type FullPartnerAction = Record<string,unknown> & { type?:string };

const EVIDENCE = new Map(EVIDENCE_V2.map((e)=>[e.id,e]));
const DEDUCTIONS = DEDUCTIONS_V2 as Record<string,{prompt:string;options:readonly (readonly [string,string])[];expected:string}>;
const CHARACTER_IDS = Object.keys(CHARACTERS_V2) as CharacterId[];

function unique<T>(items:T[]):T[]{return [...new Set(items)]}
function addUnique<T>(items:T[],value:T){if(!items.includes(value))items.push(value)}
function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,Math.round(value)))}
function hasAll(state:FullPartnerState,...facts:string[]){return facts.every((f)=>state.facts.includes(f))}
function milestone(state:FullPartnerState,id:string){addUnique(state.milestones,id)}
function boardHas(state:FullPartnerState,id:string){return state.board.some((x)=>x.id===id)}
function addBoard(state:FullPartnerState,item:Omit<BoardItem,'created_sequence'>){if(boardHas(state,item.id))return;state.sequence+=1;state.board.push({...item,created_sequence:state.sequence})}
function unlock(state:FullPartnerState,...ids:string[]){for(const id of ids)if(state.evidence[id])state.evidence[id].unlocked=true}
function character(id:CharacterId){return CHARACTERS_V2[id]}
function charState(state:FullPartnerState,id:CharacterId){return state.characters[id]}
function exposed(state:FullPartnerState,id:CharacterId,evidenceId:string){return state.characters[id].evidence_exposure.includes(evidenceId)}

function initialEvidence():Record<string,EvidenceState>{
  const out:Record<string,EvidenceState>={};
  for(const item of EVIDENCE_V2)out[item.id]={unlocked:false,opened:false,findings_published:[],presented_to:[]};
  for(const id of ['E01','E02','E03','E04','E05'])out[id].unlocked=true;
  return out;
}
function initialCharacter():CharacterState{return{available:false,state:0,statement_version:1,disclosure_level:0,global_stress:25,evidence_exposure:[],contradictions:[],trust:{archive:35,sources:35},cooperation_state:'guarded'}}

export function mapDuelRoleToFullPartner(rawRole:string):PartnerRole{return rawRole==='creator'?'archive':'sources'}
export function createInitialFullPartnerState():FullPartnerState{
  return{
    schema_version:2,case_id:FULL_PARTNER_CASE_ID,narrative_state:'STATE_02_SUICIDE_CASE',milestones:['CASE_STARTED'],facts:[],evidence:initialEvidence(),board:[],
    deductions:Object.fromEntries(Object.keys(DEDUCTIONS).map((id)=>[id,{result:'untried',attempts:0,selected:null}])),
    characters:{roman:initialCharacter(),pavel:initialCharacter(),artyom:initialCharacter(),elena:initialCharacter(),mikhail:initialCharacter()},
    sequence:0,location:{status:'locked',evidence_ids:[]},rescue:{status:'not_started',message:null},
    reconstruction:{available:false,status:'locked',attempts:0,conflicts:[],last_answers:{}},publication_decision:null,completed:false,
  };
}

function normalizeChar(raw:any):CharacterState{
  return{available:Boolean(raw?.available),state:clamp(Number(raw?.state)||0,0,10),statement_version:clamp(Number(raw?.statement_version)||1,1,10),disclosure_level:clamp(Number(raw?.disclosure_level)||0,0,7),global_stress:clamp(Number(raw?.global_stress)||25,0,100),evidence_exposure:unique(Array.isArray(raw?.evidence_exposure)?raw.evidence_exposure.filter((x:any)=>typeof x==='string'):[]),contradictions:unique(Array.isArray(raw?.contradictions)?raw.contradictions.filter((x:any)=>typeof x==='string'):[]),trust:{archive:clamp(Number(raw?.trust?.archive)||35,0,100),sources:clamp(Number(raw?.trust?.sources)||35,0,100)},cooperation_state:raw?.cooperation_state==='cooperative'?'cooperative':'guarded'};
}

export function normalizeFullPartnerState(value:unknown):FullPartnerState{
  const raw=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,any>:{};
  if(Number(raw.schema_version)!==2||raw.case_id!==FULL_PARTNER_CASE_ID)return createInitialFullPartnerState();
  const s=createInitialFullPartnerState();
  s.narrative_state=typeof raw.narrative_state==='string'?raw.narrative_state.slice(0,100):s.narrative_state;
  s.milestones=unique(Array.isArray(raw.milestones)?raw.milestones.filter((x:any)=>typeof x==='string').slice(0,200):s.milestones);
  s.facts=unique(Array.isArray(raw.facts)?raw.facts.filter((x:any)=>typeof x==='string').slice(0,300):[]);
  s.sequence=Number.isInteger(raw.sequence)&&raw.sequence>=0?raw.sequence:0;
  s.completed=Boolean(raw.completed);
  s.publication_decision=typeof raw.publication_decision==='string'?raw.publication_decision.slice(0,80):null;
  for(const item of EVIDENCE_V2){const r=raw.evidence?.[item.id]||{},dst=s.evidence[item.id];dst.unlocked=Boolean(r.unlocked)||dst.unlocked;dst.opened=Boolean(r.opened);dst.findings_published=unique(Array.isArray(r.findings_published)?r.findings_published.filter((x:any)=>typeof x==='string'):[]);dst.presented_to=unique(Array.isArray(r.presented_to)?r.presented_to.filter((x:any)=>CHARACTER_IDS.includes(x)):[])}
  s.board=Array.isArray(raw.board)?raw.board.slice(0,300).map((x:any)=>({id:String(x?.id||'').slice(0,100),type:['fact','contradiction','hypothesis','proven','disproven','event'].includes(x?.type)?x.type:'fact',label:String(x?.label||'').slice(0,800),source_role:['archive','sources','system'].includes(x?.source_role)?x.source_role:'system',evidence_ids:Array.isArray(x?.evidence_ids)?x.evidence_ids.filter((v:any)=>typeof v==='string').slice(0,30):[],created_sequence:Number(x?.created_sequence)||0})).filter((x:BoardItem)=>x.id&&x.label):[];
  for(const id of Object.keys(DEDUCTIONS)){const r=raw.deductions?.[id]||{};s.deductions[id]={result:['untried','confirmed','contradicted','insufficient'].includes(r.result)?r.result:'untried',attempts:Number.isInteger(r.attempts)?Math.max(0,r.attempts):0,selected:typeof r.selected==='string'?r.selected.slice(0,100):null}}
  for(const id of CHARACTER_IDS)s.characters[id]=normalizeChar(raw.characters?.[id]);
  s.location={status:['locked','candidate','ready','submitted'].includes(raw.location?.status)?raw.location.status:'locked',evidence_ids:unique(Array.isArray(raw.location?.evidence_ids)?raw.location.evidence_ids.filter((x:any)=>typeof x==='string'):[])};
  s.rescue={status:['not_started','dispatched','confirmed'].includes(raw.rescue?.status)?raw.rescue.status:'not_started',message:typeof raw.rescue?.message==='string'?raw.rescue.message.slice(0,600):null};
  s.reconstruction={available:Boolean(raw.reconstruction?.available),status:['locked','open','conflict','complete'].includes(raw.reconstruction?.status)?raw.reconstruction.status:'locked',attempts:Number(raw.reconstruction?.attempts)||0,conflicts:Array.isArray(raw.reconstruction?.conflicts)?raw.reconstruction.conflicts.filter((x:any)=>typeof x==='string').slice(0,20):[],last_answers:raw.reconstruction?.last_answers&&typeof raw.reconstruction.last_answers==='object'?raw.reconstruction.last_answers:{}};
  return recomputeFullPartnerState(s);
}

function setCharLevel(state:FullPartnerState,id:CharacterId,next:number,statement?:number){const c=charState(state,id);if(next>c.state)c.state=next;c.disclosure_level=Math.max(c.disclosure_level,next);if(statement)c.statement_version=Math.max(c.statement_version,statement);else c.statement_version=Math.max(c.statement_version,next+1)}

function recomputeCharacters(state:FullPartnerState){
  const roman=charState(state,'roman');
  if(state.milestones.includes('AUDIO_FABRICATION_PROVEN'))roman.available=true;
  const sourceAudio=['E07','E08','E09'].some((id)=>exposed(state,'roman',id));
  if(exposed(state,'roman','E10')||sourceAudio)setCharLevel(state,'roman',1,2);
  if(exposed(state,'roman','E10')&&sourceAudio)setCharLevel(state,'roman',2,3);
  if(roman.contradictions.includes('ROMAN_AUDIO_DENIAL')){setCharLevel(state,'roman',3,4);milestone(state,'ROMAN_CONFESSED_EDIT')}
  if(state.milestones.includes('CANARY_CONFIRMED')&&exposed(state,'roman','E17')&&exposed(state,'roman','E20'))setCharLevel(state,'roman',4,4);
  if(roman.contradictions.includes('ROMAN_LEAK_DENIAL')){setCharLevel(state,'roman',5,5);milestone(state,'ROMAN_LEAK_CONFESSED')}
  if(state.milestones.includes('VERA_ALIVE')){setCharLevel(state,'roman',6,6);roman.cooperation_state='cooperative'}

  const pavel=charState(state,'pavel');
  if(state.milestones.includes('ROMAN_MURDER_THEORY_WEAKENED'))pavel.available=true;
  if(exposed(state,'pavel','E13')||exposed(state,'pavel','E14'))setCharLevel(state,'pavel',1,2);
  if(exposed(state,'pavel','E13')&&exposed(state,'pavel','E14'))setCharLevel(state,'pavel',2,3);
  if(pavel.contradictions.includes('PAVEL_LETTER')){setCharLevel(state,'pavel',3,4);milestone(state,'PAVEL_CONFESSED')}

  const artyom=charState(state,'artyom');
  if(state.evidence.E34?.unlocked||state.evidence.E35?.unlocked)artyom.available=true;
  if(exposed(state,'artyom','E34')||exposed(state,'artyom','E35'))setCharLevel(state,'artyom',1,2);
  if(artyom.contradictions.includes('ARTYOM_MEETING')){setCharLevel(state,'artyom',2,3);milestone(state,'ARTYOM_MEETING_CONFESSED')}

  const elena=charState(state,'elena');
  if(state.milestones.includes('VERA_ALIVE'))elena.available=true;
  if(exposed(state,'elena','E20')||exposed(state,'elena','E23'))setCharLevel(state,'elena',1,2);
  if(exposed(state,'elena','E25')&&exposed(state,'elena','E26'))setCharLevel(state,'elena',2,3);
  if(exposed(state,'elena','E27')&&exposed(state,'elena','E28'))setCharLevel(state,'elena',3,4);
  if(elena.contradictions.includes('ELENA_PREPARATION'))setCharLevel(state,'elena',4,5);
  if(exposed(state,'elena','E29')&&exposed(state,'elena','E30'))setCharLevel(state,'elena',5,6);
  if(exposed(state,'elena','E31')&&exposed(state,'elena','E32'))setCharLevel(state,'elena',6,6);
  if(elena.contradictions.includes('ELENA_PAST')){setCharLevel(state,'elena',7,7);milestone(state,'ELENA_FAILURE_TO_AID_DISCLOSED')}

  const mikhail=charState(state,'mikhail');
  if(state.evidence.E30?.unlocked){mikhail.available=true;setCharLevel(state,'mikhail',1,1)}
}

export function recomputeFullPartnerState(input:FullPartnerState):FullPartnerState{
  const s=input;
  if(s.milestones.includes('ELENA_FINANCE_CONTRADICTION'))unlock(s,'E06');
  if(s.facts.includes('F06'))unlock(s,'E07','E08','E09');
  if(s.milestones.includes('AUDIO_FABRICATION_PROVEN')){unlock(s,'E10');s.narrative_state='STATE_05_ROMAN'}
  if(s.milestones.includes('ROMAN_CONFESSED_EDIT'))unlock(s,'E11');
  if(s.milestones.includes('ROMAN_MURDER_THEORY_WEAKENED')){unlock(s,'E12','E13','E14');s.narrative_state='STATE_07_PAVEL'}
  if(s.milestones.includes('PAVEL_FAKE_PROVEN')){unlock(s,'E15','E16','E17','E34','E35');s.narrative_state='STATE_09_DUAL_DOCUMENTS'}
  if(s.milestones.includes('DUAL_DOCUMENTS_PROVEN'))unlock(s,'E18','E19');
  if(s.milestones.includes('CANARY_CONFIRMED')){unlock(s,'E20');s.narrative_state='STATE_10_CANARY_TRAP'}
  if(s.milestones.includes('LEAK_CONFIRMED')){unlock(s,'E21');s.narrative_state='STATE_11_LEAK'}
  if(s.milestones.includes('VERA_ALIVE')){unlock(s,'E22','E23','E24');s.narrative_state='STATE_12_VERA_ALIVE';s.location.status='candidate'}
  if(s.milestones.includes('LOCATION_CANDIDATE_CONFIRMED')){unlock(s,'E25');s.location.status='ready';s.narrative_state='STATE_13_LOCATION_SEARCH'}
  if(s.milestones.includes('LOCATION_SUBMITTED')){unlock(s,'E26','E27','E28');s.location.status='submitted';s.rescue.status='dispatched';s.rescue.message='Местоположение передано аварийному контакту Веры. Подтверждение ожидается.';s.narrative_state='STATE_14_PRINTING_HOUSE'}
  if(s.milestones.includes('VERA_PREPARATION_PROVEN')){unlock(s,'E29','E30','E31','E32');s.narrative_state='STATE_15_FINAL_ELENA_CONTACT'}
  if(s.milestones.includes('ELENA_NINA_CHAIN_PROVEN')){unlock(s,'E33');s.reconstruction.available=true;s.reconstruction.status=s.reconstruction.status==='locked'?'open':s.reconstruction.status;s.rescue.status='confirmed';s.rescue.message='Аварийный контакт подтвердил вход в старую типографию. Вера Ланская найдена живой.';milestone(s,'VERA_FOUND');s.narrative_state='STATE_16_VERA_FOUND'}
  if(s.milestones.includes('RECONSTRUCTION_COMPLETE')){s.reconstruction.available=true;s.reconstruction.status='complete';s.narrative_state='STATE_18_EPILOGUE'}
  if(s.publication_decision){s.completed=true;s.narrative_state='STATE_19_CLOSED'}
  recomputeCharacters(s);
  return s;
}

function ownedEvidence(state:FullPartnerState,role:PartnerRole,id:string){const def=EVIDENCE.get(id);if(!def||def.owner!==role||!state.evidence[id]?.unlocked)throw new Error('partner_evidence_access_denied');return def}
function deductionAvailable(s:FullPartnerState,id:string){
  if(id==='D_FINANCE_CONTRADICTION')return hasAll(s,'F04','F05');
  if(id==='D_AUDIO_FABRICATION')return hasAll(s,'F06','F07','F08','F09');
  if(id==='D_ROMAN_MURDER')return hasAll(s,'F11');
  if(id==='D_PAVEL_FAKE')return hasAll(s,'F13','F14');
  if(id==='D_DUAL_DOCUMENTS')return hasAll(s,'F16','F17');
  if(id==='D_CANARY')return hasAll(s,'F16','F17','F18','F19');
  if(id==='D_LEAK')return hasAll(s,'F17','F20')&&s.milestones.includes('ROMAN_LEAK_CONFESSED');
  if(id==='D_VERA_ALIVE')return hasAll(s,'F21');
  if(id==='D_LOCATION')return hasAll(s,'F21','F22','F24');
  if(id==='D_PREPARATION')return hasAll(s,'F23','F26','F27','F28');
  if(id==='D_NINA_ELENA')return hasAll(s,'F29','F30','F31','F32');
  return false;
}

function applyConfirmedDeduction(s:FullPartnerState,id:string){
  if(id==='D_FINANCE_CONTRADICTION'){milestone(s,'ELENA_FINANCE_CONTRADICTION');addBoard(s,{id:'C01',type:'contradiction',label:'Нина работала с внутренним аудитом, хотя Елена публично утверждала обратное.',source_role:'system',evidence_ids:['E04','E05']});s.narrative_state='STATE_03_AUDIO_SUSPICIOUS'}
  if(id==='D_AUDIO_FABRICATION'){milestone(s,'AUDIO_FABRICATION_PROVEN');addBoard(s,{id:'P_AUDIO',type:'proven',label:'«Прощальная запись» была собрана после смерти Нины из более ранних голосовых материалов.',source_role:'system',evidence_ids:['E06','E07','E08','E09']});s.narrative_state='STATE_04_AUDIO_FABRICATED'}
  if(id==='D_ROMAN_MURDER'){milestone(s,'ROMAN_MURDER_THEORY_WEAKENED');addBoard(s,{id:'D_ROMAN_KILLER',type:'disproven',label:'Роман связан с фальсификацией, но данные о местоположении противоречат версии, что он лично столкнул Нину.',source_role:'system',evidence_ids:['E10','E11']});s.narrative_state='STATE_06_ROMAN_ALIBI'}
  if(id==='D_PAVEL_FAKE'){milestone(s,'PAVEL_FAKE_PROVEN');addBoard(s,{id:'D_PAVEL_LETTER',type:'disproven',label:'Письмо «ищи Е.М.» создано спустя годы после смерти Нины и не является её реальным сообщением.',source_role:'system',evidence_ids:['E13','E14']});s.narrative_state='STATE_08_PAVEL_FAKE'}
  if(id==='D_DUAL_DOCUMENTS'){milestone(s,'DUAL_DOCUMENTS_PROVEN');addBoard(s,{id:'H_DUAL',type:'hypothesis',label:'Вера сознательно создала две валидные версии одного документа с разными адресами.',source_role:'system',evidence_ids:['E16','E17']})}
  if(id==='D_CANARY'){milestone(s,'CANARY_CONFIRMED');addBoard(s,{id:'P_CANARY',type:'proven',label:'TERMINAL и ORION — canary trap: разные люди получили разные факты для поиска утечки.',source_role:'system',evidence_ids:['E16','E17','E18','E19']})}
  if(id==='D_LEAK'){milestone(s,'LEAK_CONFIRMED');addBoard(s,{id:'P_LEAK',type:'proven',label:'Утечка ORION прошла по цепочке Вера → Роман → Елена.',source_role:'system',evidence_ids:['E17','E20']})}
  if(id==='D_VERA_ALIVE'){milestone(s,'VERA_ALIVE');addBoard(s,{id:'EVENT_VERA_ALIVE',type:'event',label:'Вера была жива после исчезновения. Расследование становится поисково-спасательным.',source_role:'system',evidence_ids:['E21']})}
  if(id==='D_LOCATION'){milestone(s,'LOCATION_CANDIDATE_CONFIRMED');addBoard(s,{id:'H_LOCATION',type:'hypothesis',label:'Старая типография — наиболее вероятное место удержания Веры.',source_role:'system',evidence_ids:['E21','E22','E24']})}
  if(id==='D_PREPARATION'){milestone(s,'VERA_PREPARATION_PROVEN');addBoard(s,{id:'P_PREPARATION',type:'proven',label:'До ORION Елена уже готовилась как минимум к контролю над Верой и использованию старой типографии.',source_role:'system',evidence_ids:['E23','E26','E27','E28']})}
  if(id==='D_NINA_ELENA'){milestone(s,'ELENA_NINA_CHAIN_PROVEN');addBoard(s,{id:'P_NINA_ELENA',type:'proven',label:'Елена присутствовала при конфликте и падении Нины и не вызвала экстренную помощь в доступное временное окно.',source_role:'system',evidence_ids:['E29','E30','E31','E32']})}
}

function challengeAvailable(s:FullPartnerState,characterId:CharacterId,challengeId:string){
  const c=s.characters[characterId];
  if(!c.available||c.contradictions.includes(challengeId))return false;
  if(characterId==='roman'&&challengeId==='ROMAN_AUDIO_DENIAL')return exposed(s,'roman','E10')&&['E07','E08','E09'].some((id)=>exposed(s,'roman',id));
  if(characterId==='roman'&&challengeId==='ROMAN_LEAK_DENIAL')return s.milestones.includes('CANARY_CONFIRMED')&&exposed(s,'roman','E17')&&exposed(s,'roman','E20');
  if(characterId==='pavel'&&challengeId==='PAVEL_LETTER')return exposed(s,'pavel','E13')&&exposed(s,'pavel','E14');
  if(characterId==='artyom'&&challengeId==='ARTYOM_MEETING')return exposed(s,'artyom','E34')&&exposed(s,'artyom','E35');
  if(characterId==='elena'&&challengeId==='ELENA_PREPARATION')return exposed(s,'elena','E27')&&exposed(s,'elena','E28');
  if(characterId==='elena'&&challengeId==='ELENA_PAST')return exposed(s,'elena','E29')&&exposed(s,'elena','E31')&&exposed(s,'elena','E32');
  return false;
}
function availableChallenges(s:FullPartnerState,id:CharacterId){
  const all:Record<CharacterId,{id:string;label:string}[]>={roman:[{id:'ROMAN_AUDIO_DENIAL',label:'Зафиксировать: сначала Роман отрицал участие в создании аудио'},{id:'ROMAN_LEAK_DENIAL',label:'Зафиксировать: Роман отрицал передачу ORION Елене'}],pavel:[{id:'PAVEL_LETTER',label:'Зафиксировать: версия Павла о происхождении письма не выдерживает цифровую проверку'}],artyom:[{id:'ARTYOM_MEETING',label:'Зафиксировать: Артём отрицал встречу, но парковочный лог её подтверждает'}],elena:[{id:'ELENA_PREPARATION',label:'Зафиксировать: подготовка к типографии началась до ORION'},{id:'ELENA_PAST',label:'Зафиксировать: Елена была с Ниной при падении и не вызвала помощь'}],mikhail:[]};
  return all[id].filter((x)=>challengeAvailable(s,id,x.id));
}

const LOCATION_EVIDENCE=new Set(['E21','E22','E24','E25']);
function submitLocation(s:FullPartnerState,ids:string[]){
  const accepted=unique(ids.filter((id)=>LOCATION_EVIDENCE.has(id)&&s.evidence[id]?.opened&&s.evidence[id]?.findings_published.length));
  if(accepted.length<3||!accepted.includes('E25'))throw new Error('partner_location_insufficient');
  s.location={status:'submitted',evidence_ids:accepted};milestone(s,'LOCATION_SUBMITTED');addBoard(s,{id:'EVENT_LOCATION_SENT',type:'event',label:'Доказательный пакет по старой типографии передан аварийному контакту Веры.',source_role:'system',evidence_ids:accepted});
}

const RECON_EXPECTED={nina:'elena_conflict_fall_fail_aid',audio:'roman_montage',pavel:'fake_letter',canary:'roman_orion',vera:'elena_abduction_printing',motive:'protect_fund'} as const;
function attemptReconstruction(s:FullPartnerState,answers:Record<string,unknown>){
  if(!s.reconstruction.available)throw new Error('partner_reconstruction_locked');
  const conflicts:string[]=[];
  if(answers.nina!==RECON_EXPECTED.nina)conflicts.push('Версия смерти Нины не объясняет одновременно конфликт на лестнице, присутствие Елены и отсутствие вызова помощи.');
  if(answers.audio!==RECON_EXPECTED.audio)conflicts.push('Версия аудио не объясняет исходные голосовые фрагменты, дату файла и оплату Роману.');
  if(answers.pavel!==RECON_EXPECTED.pavel)conflicts.push('Версия письма Павла конфликтует с независимой цифровой историей файла.');
  if(answers.canary!==RECON_EXPECTED.canary)conflicts.push('Версия утечки не объясняет, почему ORION достался именно Роману и почему затем был звонок Елене.');
  if(answers.vera!==RECON_EXPECTED.vera)conflicts.push('Версия исчезновения Веры не объясняет ORION, MAYAK-04, телематику и типографию.');
  if(answers.motive!==RECON_EXPECTED.motive)conflicts.push('Мотив не объясняет финансовую схему, страх публикации и поведение Елены в обоих временных слоях.');
  s.reconstruction.attempts+=1;s.reconstruction.last_answers=answers;s.reconstruction.conflicts=conflicts;
  if(conflicts.length){s.reconstruction.status='conflict';return}
  s.reconstruction.status='complete';milestone(s,'RECONSTRUCTION_COMPLETE');addBoard(s,{id:'P_RECONSTRUCTION',type:'proven',label:'Дело реконструировано: два временных слоя и ложь всех ключевых участников сведены в одну доказательную цепочку.',source_role:'system',evidence_ids:[]});
}

export function processFullPartnerAction(input:FullPartnerState,role:PartnerRole,action:FullPartnerAction):FullPartnerState{
  const s=normalizeFullPartnerState(structuredClone(input));if(s.completed)throw new Error('partner_case_completed');const type=String(action.type||'').trim().toUpperCase();if(!type||type==='START'||type==='SNAPSHOT')return s;
  if(type==='OPEN_EVIDENCE'){const id=String(action.evidence_id||'');ownedEvidence(s,role,id);s.evidence[id].opened=true;return recomputeFullPartnerState(s)}
  if(type==='PUBLISH_FINDING'){const id=String(action.evidence_id||''),fid=String(action.finding_id||''),def=ownedEvidence(s,role,id);if(!s.evidence[id].opened)throw new Error('partner_evidence_not_opened');const f=def.findings.find((x)=>x.id===fid);if(!f)throw new Error('partner_finding_invalid');addUnique(s.evidence[id].findings_published,fid);addUnique(s.facts,fid);addBoard(s,{id:fid,type:'fact',label:f.label,source_role:role,evidence_ids:[id]});return recomputeFullPartnerState(s)}
  if(type==='ATTEMPT_DEDUCTION'){const id=String(action.deduction_id||''),selected=String(action.selected||''),def=DEDUCTIONS[id];if(!def)throw new Error('partner_deduction_invalid');const rt=s.deductions[id];if(rt.result==='confirmed')return s;rt.attempts+=1;rt.selected=selected;if(!deductionAvailable(s,id)){rt.result='insufficient';return s}if(selected!==def.expected){rt.result='contradicted';return s}rt.result='confirmed';applyConfirmedDeduction(s,id);return recomputeFullPartnerState(s)}
  if(type==='PRESENT_EVIDENCE'){const id=String(action.evidence_id||''),cid=String(action.character_id||'') as CharacterId;if(!CHARACTER_IDS.includes(cid)||!s.characters[cid].available)throw new Error('partner_character_unavailable');ownedEvidence(s,role,id);if(!s.evidence[id].opened)throw new Error('partner_evidence_not_opened');addUnique(s.evidence[id].presented_to,cid);addUnique(s.characters[cid].evidence_exposure,id);s.characters[cid].global_stress=clamp(s.characters[cid].global_stress+12,0,100);return recomputeFullPartnerState(s)}
  if(type==='CHALLENGE_CHARACTER'){const cid=String(action.character_id||'') as CharacterId,challenge=String(action.challenge_id||'');if(!CHARACTER_IDS.includes(cid)||!challengeAvailable(s,cid,challenge))throw new Error('partner_challenge_unavailable');addUnique(s.characters[cid].contradictions,challenge);s.characters[cid].global_stress=clamp(s.characters[cid].global_stress+18,0,100);addBoard(s,{id:`C_${challenge}`,type:'contradiction',label:`Противоречие в показаниях: ${availableChallengeLabel(cid,challenge)}`,source_role:'system',evidence_ids:s.characters[cid].evidence_exposure.slice()});return recomputeFullPartnerState(s)}
  if(type==='SUBMIT_LOCATION'){const ids=Array.isArray(action.evidence_ids)?action.evidence_ids.filter((x):x is string=>typeof x==='string'):[];submitLocation(s,ids);return recomputeFullPartnerState(s)}
  if(type==='ATTEMPT_RECONSTRUCTION'){attemptReconstruction(s,action.answers&&typeof action.answers==='object'?action.answers as Record<string,unknown>:{});return recomputeFullPartnerState(s)}
  if(type==='CHOOSE_PUBLICATION'){if(!s.milestones.includes('RECONSTRUCTION_COMPLETE'))throw new Error('partner_epilogue_locked');const choice=String(action.choice||'');if(!['publish_all','protect_recipients','transition'].includes(choice))throw new Error('partner_publication_invalid');s.publication_decision=choice;milestone(s,'EPILOGUE_CHOSEN');return recomputeFullPartnerState(s)}
  throw new Error('partner_action_invalid');
}
function availableChallengeLabel(cid:CharacterId,id:string){const m=({ROMAN_AUDIO_DENIAL:'Роман отрицал участие в создании аудио',ROMAN_LEAK_DENIAL:'Роман отрицал передачу ORION Елене',PAVEL_LETTER:'Павел менял версию происхождения письма',ARTYOM_MEETING:'Артём отрицал сегодняшнюю встречу',ELENA_PREPARATION:'Елена утверждала, что всё после ORION было импровизацией',ELENA_PAST:'Елена отрицала присутствие при критическом окне смерти Нины'} as Record<string,string>);return m[id]||id}

export function safeFullPartnerView(stateInput:FullPartnerState,role:PartnerRole,partner:{joined:boolean;name:string|null},revision:number){
  const s=normalizeFullPartnerState(stateInput);
  const evidence=EVIDENCE_V2.filter((e)=>e.owner===role&&s.evidence[e.id]?.unlocked).map((e)=>({id:e.id,kind:e.kind,kicker:e.kicker,title:e.title,teaser:e.teaser,body:s.evidence[e.id].opened?e.body:'',opened:s.evidence[e.id].opened,findings:e.findings.map((f)=>({...f,published:s.evidence[e.id].findings_published.includes(f.id)})),presentedTo:s.evidence[e.id].presented_to.slice()}));
  const characters=CHARACTER_IDS.map((id)=>{const c=s.characters[id],canon=character(id);return{id,name:canon.name,role:canon.role,available:c.available,disclosureLevel:c.disclosure_level,statementVersion:c.statement_version,stressBand:c.global_stress>=86?'crisis':c.global_stress>=71?'high':c.global_stress>=51?'defensive':c.global_stress>=26?'cautious':'calm',cooperationState:c.cooperation_state,challenges:availableChallenges(s,id)}}).filter((c)=>c.available);
  return{caseId:FULL_PARTNER_CASE_ID,title:FULL_PARTNER_CASE_TITLE,role,roleLabel:role==='archive'?'АРХИВ':'ИСТОЧНИКИ',partner,revision,narrativeState:s.narrative_state,milestones:s.milestones,board:s.board,evidence,deductions:Object.fromEntries(Object.entries(DEDUCTIONS).map(([id,d])=>[id,{id,prompt:d.prompt,options:d.options.map(([value,label])=>({value,label})),available:deductionAvailable(s,id),result:s.deductions[id].result,attempts:s.deductions[id].attempts}])),characters,location:s.location,rescue:s.rescue,reconstruction:{available:s.reconstruction.available,status:s.reconstruction.status,attempts:s.reconstruction.attempts,conflicts:s.reconstruction.conflicts,options:reconstructionOptions()},publication:{available:s.milestones.includes('RECONSTRUCTION_COMPLETE'),selected:s.publication_decision},completed:s.completed};
}
function reconstructionOptions(){return{nina:[['elena_conflict_fall_fail_aid','Конфликт Елены и Нины → борьба за телефон → падение → помощь не вызвана'],['suicide','Самоубийство'],['roman_attack','Роман напал на Нину']],audio:[['roman_montage','Роман собрал запись из старых фрагментов'],['authentic','Запись Нины подлинная']],pavel:[['fake_letter','Павел сам создал письмо'],['authentic_letter','Письмо Нины настоящее']],canary:[['roman_orion','ORION → Роман → Елена'],['artyom_terminal','TERMINAL → Артём → Елена']],vera:[['elena_abduction_printing','Елена увезла Веру с ORION в старую типографию'],['artyom_abduction','Артём увёз Веру']],motive:[['protect_fund','Скрыть финансовую схему и сохранить фонд'],['personal_profit','Скрыть личное присвоение €186 400']]};}

export function characterSpeakingContext(stateInput:FullPartnerState,id:CharacterId){
  const s=normalizeFullPartnerState(stateInput),c=s.characters[id],canon=character(id);if(!c.available)return{available:false};
  const shown=c.evidence_exposure.map((eid)=>EVIDENCE.get(eid)).filter(Boolean).map((e)=>({id:e!.id,title:e!.title,body:e!.body}));
  return{available:true,id,name:canon.name,role:canon.role,coreTruth:canon.coreTruth,motive:canon.motive,statementVersion:c.statement_version,statement:canon.statementVersions[c.statement_version]||canon.statementVersions[Math.max(...Object.keys(canon.statementVersions).map(Number))],stress:c.global_stress,disclosureLevel:c.disclosure_level,cooperationState:c.cooperation_state,contradictions:c.contradictions.slice(),shown};
}
