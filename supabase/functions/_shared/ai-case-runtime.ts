const CASE_ID_RE=/^[A-Za-z0-9_:-]{3,160}$/;
const ID_RE=/^[A-Za-z0-9_:-]{1,80}$/;
const TOKEN_HASH_RE=/^[0-9a-f]{64}$/;
const SESSION_RE=/^[A-Za-z0-9-]{8,96}$/;
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STAGES=new Set(['composed','defensive','cornered','breaking','confessed']);
const encoder=new TextEncoder();

export type ExperienceTier='text'|'live';
export type InterrogationStage='composed'|'defensive'|'cornered'|'breaking'|'confessed';
export type PublicNote={id:string;source:string;text:string};
export type PublicEvidence={id:string;code:string;title:string;body:string};
export type PublicSuspect={id:string;name:string;role:string;opening:string};

export type AiPublicCase={
  schema_version:1;
  max_turns:number;
  suspects:PublicSuspect[];
  initial_evidence:PublicEvidence[];
};

type RuleWhen={
  min_questions?:number;
  all_terms?:string[];
  any_terms?:string[];
  required_evidence_ids?:string[];
  required_note_ids?:string[];
  presented_evidence_ids?:string[];
};

type CanonRule={
  id:string;
  suspect_id:string;
  when:RuleWhen;
  grants:{note?:PublicNote;evidence_ids?:string[]};
  stage?:InterrogationStage;
  terminal?:'confession';
};

type CanonSuspect={
  persona:string;
  base_facts:string[];
  admissions:Record<string,string[]>;
};

export type AiPrivateCanon={
  schema_version:1;
  suspects:Record<string,CanonSuspect>;
  evidence:Record<string,PublicEvidence>;
  rules:CanonRule[];
  theory:{
    culprit_id:string;
    required_evidence_ids:string[];
    required_note_ids:string[];
    all_terms?:string[];
    any_terms?:string[];
    success_title:string;
    success_explanation:string;
  };
};

export type AiCaseState={
  successful_turns:number;
  question_counts:Record<string,number>;
  evidence_ids:string[];
  note_ids:string[];
  rule_ids:string[];
  stages:Record<string,InterrogationStage>;
};

export type AiCaseRuntime={
  caseId:string;
  productId:string;
  payloadVersion:number;
  canonVersion:number;
  publicCase:AiPublicCase;
  canon:AiPrivateCanon;
  entitlement:{id:string;experienceTier:ExperienceTier};
};

function clean(value:unknown,max=600){return typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max):''}
function stringList(value:unknown,maxItems=64,maxLen=120){return Array.isArray(value)?value.map(v=>clean(v,maxLen)).filter(Boolean).slice(0,maxItems):[]}
function record(value:unknown):Record<string,any>{return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,any>:{} }
function boundedInt(value:unknown,min:number,max:number,fallback:number){const n=Number(value);return Number.isInteger(n)&&n>=min&&n<=max?n:fallback}
function unique(values:string[]){return [...new Set(values)]}
function hasAll(haystack:Iterable<string>,needles:string[]){const set=haystack instanceof Set?haystack:new Set(haystack);return needles.every(v=>set.has(v))}
function normalizedText(value:string){return value.normalize('NFKC').toLocaleLowerCase('ru-RU')}
function termsMatch(text:string,terms:string[],mode:'all'|'any'){if(!terms.length)return true;const normalized=normalizedText(text);const matches=terms.map(term=>normalized.includes(normalizedText(term)));return mode==='all'?matches.every(Boolean):matches.some(Boolean)}

export function normalizeCaseId(value:unknown){const id=clean(value,160);return CASE_ID_RE.test(id)?id:null}
export function validClientSession(value:unknown){const id=clean(value,96);return SESSION_RE.test(id)?id:null}
export function experienceTier(metadata:unknown):ExperienceTier{return String(record(metadata).experience_tier||'').toLowerCase()==='live'?'live':'text'}
export function entitlementAllowsCase(metadata:unknown,caseId:string){const m=record(metadata);const allowed=stringList(m.allowed_case_ids,100,160);if(allowed.length)return allowed.includes(caseId);const scoped=clean(m.case_id,160);return !scoped||scoped===caseId}

export async function digestHex(value:string){const digest=await crypto.subtle.digest('SHA-256',encoder.encode(value));return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')}

function serverHeaders(serviceRole:string,extra:Record<string,string>={}){return {apikey:serviceRole,authorization:`Bearer ${serviceRole}`,'content-type':'application/json',...extra}}
async function restJson(base:string,serviceRole:string,path:string,init:RequestInit={}){
  const response=await fetch(`${base}/rest/v1/${path}`,{...init,headers:{...serverHeaders(serviceRole),...(init.headers||{})}});
  const text=await response.text();let body:any=null;try{body=text?JSON.parse(text):null}catch{}
  if(!response.ok){console.error('ai_case_rest_error',response.status,path.slice(0,180),text.slice(0,400));throw new Error('ai_case_store_unavailable')}
  return body;
}

function validatePublicEvidence(value:unknown):PublicEvidence|null{
  const item=record(value);const id=clean(item.id,80);const code=clean(item.code,120);const title=clean(item.title,180);const body=clean(item.body,1200);
  return ID_RE.test(id)&&title&&body?{id,code,title,body}:null;
}
function validatePublicSuspect(value:unknown):PublicSuspect|null{
  const item=record(value);const id=clean(item.id,80);const name=clean(item.name,180);const role=clean(item.role,180);const opening=clean(item.opening,1200);
  return ID_RE.test(id)&&name&&role&&opening?{id,name,role,opening}:null;
}
export function parsePublicAiCase(payload:unknown):AiPublicCase{
  const ai=record(record(payload).ai_case);
  if(Number(ai.schema_version)!==1)throw new Error('ai_public_schema_invalid');
  const suspects=Array.isArray(ai.suspects)?ai.suspects.map(validatePublicSuspect).filter(Boolean) as PublicSuspect[]:[];
  const initialEvidence=Array.isArray(ai.initial_evidence)?ai.initial_evidence.map(validatePublicEvidence).filter(Boolean) as PublicEvidence[]:[];
  if(suspects.length<2||suspects.length>8||new Set(suspects.map(s=>s.id)).size!==suspects.length)throw new Error('ai_public_suspects_invalid');
  if(initialEvidence.length<1||initialEvidence.length>24||new Set(initialEvidence.map(e=>e.id)).size!==initialEvidence.length)throw new Error('ai_public_evidence_invalid');
  return {schema_version:1,max_turns:boundedInt(ai.max_turns,5,60,30),suspects,initial_evidence:initialEvidence};
}

function validateNote(value:unknown):PublicNote|null{const n=record(value);const id=clean(n.id,80);const source=clean(n.source,180);const text=clean(n.text,900);return ID_RE.test(id)&&source&&text?{id,source,text}:null}
function validateCanonEvidence(value:unknown,id:string):PublicEvidence|null{const parsed=validatePublicEvidence({...record(value),id});return parsed?.id===id?parsed:null}
function validateWhen(value:unknown):RuleWhen{
  const w=record(value);
  return {
    min_questions:boundedInt(w.min_questions,0,60,0),
    all_terms:stringList(w.all_terms,20,80),
    any_terms:stringList(w.any_terms,20,80),
    required_evidence_ids:stringList(w.required_evidence_ids,32,80).filter(v=>ID_RE.test(v)),
    required_note_ids:stringList(w.required_note_ids,32,80).filter(v=>ID_RE.test(v)),
    presented_evidence_ids:stringList(w.presented_evidence_ids,16,80).filter(v=>ID_RE.test(v)),
  };
}
function whenHasPredicate(when:RuleWhen){return (when.min_questions||0)>0||!!when.all_terms?.length||!!when.any_terms?.length||!!when.required_evidence_ids?.length||!!when.required_note_ids?.length||!!when.presented_evidence_ids?.length}

export function parsePrivateCanon(value:unknown,publicCase:AiPublicCase):AiPrivateCanon{
  const raw=record(value);if(Number(raw.schema_version)!==1)throw new Error('ai_canon_schema_invalid');
  const publicSuspectIds=new Set(publicCase.suspects.map(s=>s.id));
  const suspectsRaw=record(raw.suspects);const suspects:Record<string,CanonSuspect>={};
  for(const id of publicSuspectIds){
    const src=record(suspectsRaw[id]);const persona=clean(src.persona,1600);const baseFacts=stringList(src.base_facts,64,900);const admissionsRaw=record(src.admissions);const admissions:Record<string,string[]>={};
    for(const [noteId,facts] of Object.entries(admissionsRaw)){if(ID_RE.test(noteId))admissions[noteId]=stringList(facts,32,900)}
    if(!persona||!baseFacts.length)throw new Error('ai_canon_suspect_invalid');
    suspects[id]={persona,base_facts:baseFacts,admissions};
  }
  if(Object.keys(suspectsRaw).some(id=>!publicSuspectIds.has(id)))throw new Error('ai_canon_unknown_suspect');

  const evidence:Record<string,PublicEvidence>={};const initialIds=new Set(publicCase.initial_evidence.map(e=>e.id));
  for(const [id,item] of Object.entries(record(raw.evidence))){
    if(!ID_RE.test(id)||initialIds.has(id))throw new Error('ai_canon_evidence_invalid');
    const parsed=validateCanonEvidence(item,id);if(!parsed)throw new Error('ai_canon_evidence_invalid');evidence[id]=parsed;
  }

  const rules:CanonRule[]=[];const ruleIds=new Set<string>();const noteIds=new Set<string>();
  for(const item of Array.isArray(raw.rules)?raw.rules:[]){
    const r=record(item);const id=clean(r.id,80);const suspectId=clean(r.suspect_id,80);const grantsRaw=record(r.grants);const note=grantsRaw.note?validateNote(grantsRaw.note):null;const evidenceIds=stringList(grantsRaw.evidence_ids,16,80);
    const stage=STAGES.has(String(r.stage))?String(r.stage) as InterrogationStage:undefined;
    const terminal=r.terminal==='confession'?'confession' as const:undefined;
    const when=validateWhen(r.when);
    if(!ID_RE.test(id)||ruleIds.has(id)||!publicSuspectIds.has(suspectId))throw new Error('ai_canon_rule_invalid');
    if(!whenHasPredicate(when))throw new Error('ai_canon_rule_when_invalid');
    if(note&&noteIds.has(note.id))throw new Error('ai_canon_note_duplicate');
    if(evidenceIds.some(eid=>!evidence[eid]))throw new Error('ai_canon_rule_evidence_invalid');
    if(!note&&!evidenceIds.length&&!stage&&!terminal)throw new Error('ai_canon_rule_empty');
    ruleIds.add(id);if(note)noteIds.add(note.id);
    rules.push({id,suspect_id:suspectId,when,grants:{...(note?{note}:{}),...(evidenceIds.length?{evidence_ids:unique(evidenceIds)}:{})},...(stage?{stage}:{}),...(terminal?{terminal}:{})});
  }
  if(!rules.length||rules.length>80)throw new Error('ai_canon_rules_invalid');

  const allEvidenceIds=new Set([...initialIds,...Object.keys(evidence)]);
  for(const rule of rules){
    const evidenceRefs=[...(rule.when.required_evidence_ids||[]),...(rule.when.presented_evidence_ids||[])];
    if(evidenceRefs.some(id=>!allEvidenceIds.has(id))||(rule.when.required_note_ids||[]).some(id=>!noteIds.has(id)))throw new Error('ai_canon_rule_reference_invalid');
    if(rule.grants.note&&(rule.when.required_note_ids||[]).includes(rule.grants.note.id))throw new Error('ai_canon_rule_self_reference');
  }
  for(const suspect of Object.values(suspects))for(const noteId of Object.keys(suspect.admissions))if(!noteIds.has(noteId))throw new Error('ai_canon_admission_note_unknown');

  const theoryRaw=record(raw.theory);const culprit=clean(theoryRaw.culprit_id,80);const requiredEvidence=stringList(theoryRaw.required_evidence_ids,32,80);const requiredNotes=stringList(theoryRaw.required_note_ids,32,80);
  if(!publicSuspectIds.has(culprit)||requiredEvidence.some(id=>!allEvidenceIds.has(id))||requiredNotes.some(id=>!noteIds.has(id)))throw new Error('ai_canon_theory_invalid');
  const successTitle=clean(theoryRaw.success_title,240);const successExplanation=clean(theoryRaw.success_explanation,1600);if(!successTitle||!successExplanation)throw new Error('ai_canon_theory_copy_invalid');

  return {schema_version:1,suspects,evidence,rules,theory:{culprit_id:culprit,required_evidence_ids:unique(requiredEvidence),required_note_ids:unique(requiredNotes),all_terms:stringList(theoryRaw.all_terms,24,80),any_terms:stringList(theoryRaw.any_terms,24,80),success_title:successTitle,success_explanation:successExplanation}};
}

export async function loadPaidAiCaseRuntime(input:{supabaseUrl:string;serviceRole:string;caseId:string;accessToken:string}):Promise<AiCaseRuntime>{
  const {supabaseUrl,serviceRole,caseId,accessToken}=input;if(!supabaseUrl||!serviceRole)throw new Error('ai_store_not_configured');if(!normalizeCaseId(caseId))throw new Error('invalid_case_id');
  const token=clean(accessToken,512);if(token.length<32)throw new Error('access_required');
  const paidRows=await restJson(supabaseUrl,serviceRole,`paid_case_payloads?select=case_id,product_id,status,payload,payload_version&case_id=eq.${encodeURIComponent(caseId)}&status=eq.published&limit=1`);
  const paid=Array.isArray(paidRows)?paidRows[0]:null;if(!paid)throw new Error('case_not_found');
  const productId=clean(paid.product_id,160);if(!productId)throw new Error('case_product_invalid');
  const tokenHash=await digestHex(token);if(!TOKEN_HASH_RE.test(tokenHash))throw new Error('access_invalid');
  const entitlementRows=await restJson(supabaseUrl,serviceRole,`access_entitlements?select=id,product_id,status,starts_at,expires_at,revoked_at,metadata&token_hash=eq.${tokenHash}&product_id=eq.${encodeURIComponent(productId)}&status=eq.active&limit=1`);
  const entitlement=Array.isArray(entitlementRows)?entitlementRows[0]:null;if(!entitlement||!UUID_RE.test(String(entitlement.id||'')))throw new Error('access_denied');
  const now=Date.now();if(entitlement.revoked_at)throw new Error('access_revoked');if(entitlement.starts_at&&new Date(entitlement.starts_at).getTime()>now)throw new Error('access_not_started');if(entitlement.expires_at&&new Date(entitlement.expires_at).getTime()<=now)throw new Error('access_expired');if(!entitlementAllowsCase(entitlement.metadata,caseId))throw new Error('access_wrong_case');
  const canonRows=await restJson(supabaseUrl,serviceRole,`ai_case_canon?select=case_id,status,canon_version,canon&case_id=eq.${encodeURIComponent(caseId)}&status=eq.published&limit=1`);
  const canonRow=Array.isArray(canonRows)?canonRows[0]:null;if(!canonRow)throw new Error('ai_case_not_ready');
  const publicCase=parsePublicAiCase(paid.payload);const canon=parsePrivateCanon(canonRow.canon,publicCase);
  return {caseId,productId,payloadVersion:boundedInt(paid.payload_version,1,100000,1),canonVersion:boundedInt(canonRow.canon_version,1,100000,1),publicCase,canon,entitlement:{id:String(entitlement.id),experienceTier:experienceTier(entitlement.metadata)}};
}

export async function deriveScopedSessionKey(caseId:string,entitlementId:string,clientSessionId:string){if(!normalizeCaseId(caseId)||!UUID_RE.test(entitlementId)||!validClientSession(clientSessionId))throw new Error('invalid_session');return digestHex(`ai-v2-session:${caseId}:${entitlementId}:${clientSessionId}`)}

export function initialCaseState(runtime:AiCaseRuntime):AiCaseState{
  const question_counts:Record<string,number>={};const stages:Record<string,InterrogationStage>={};for(const s of runtime.publicCase.suspects){question_counts[s.id]=0;stages[s.id]='composed'}
  return {successful_turns:0,question_counts,evidence_ids:runtime.publicCase.initial_evidence.map(e=>e.id),note_ids:[],rule_ids:[],stages};
}
export function normalizeStoredState(value:unknown,runtime:AiCaseRuntime):AiCaseState{
  const raw=record(value);const allowedSuspects=new Set(runtime.publicCase.suspects.map(s=>s.id));const initialEvidenceIds=runtime.publicCase.initial_evidence.map(e=>e.id);const allowedEvidence=new Set([...initialEvidenceIds,...Object.keys(runtime.canon.evidence)]);const allowedNotes=new Set(runtime.canon.rules.map(r=>r.grants.note?.id).filter(Boolean) as string[]);const allowedRules=new Set(runtime.canon.rules.map(r=>r.id));
  const question_counts:Record<string,number>={};const stages:Record<string,InterrogationStage>={};for(const id of allowedSuspects){question_counts[id]=boundedInt(record(raw.question_counts)[id],0,60,0);const stage=String(record(raw.stages)[id]||'composed');stages[id]=STAGES.has(stage)?stage as InterrogationStage:'composed'}
  const storedEvidence=stringList(raw.evidence_ids,80,80).filter(id=>allowedEvidence.has(id));
  return {successful_turns:boundedInt(raw.successful_turns,0,runtime.publicCase.max_turns,0),question_counts,evidence_ids:unique([...initialEvidenceIds,...storedEvidence]),note_ids:unique(stringList(raw.note_ids,80,80).filter(id=>allowedNotes.has(id))),rule_ids:unique(stringList(raw.rule_ids,100,80).filter(id=>allowedRules.has(id))),stages};
}

export async function loadOrCreateCaseSession(input:{supabaseUrl:string;serviceRole:string;runtime:AiCaseRuntime;clientSessionId:string}){
  const sessionKey=await deriveScopedSessionKey(input.runtime.caseId,input.runtime.entitlement.id,input.clientSessionId);
  const path=`ai_case_sessions?select=session_key,case_id,entitlement_id,state,revision&session_key=eq.${sessionKey}&limit=1`;
  let rows=await restJson(input.supabaseUrl,input.serviceRole,path);let row=Array.isArray(rows)?rows[0]:null;
  if(!row){
    const state=initialCaseState(input.runtime);await restJson(input.supabaseUrl,input.serviceRole,'ai_case_sessions',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({session_key:sessionKey,case_id:input.runtime.caseId,entitlement_id:input.runtime.entitlement.id,state})});
    rows=await restJson(input.supabaseUrl,input.serviceRole,path);row=Array.isArray(rows)?rows[0]:null;
  }
  if(!row||String(row.case_id)!==input.runtime.caseId||String(row.entitlement_id)!==input.runtime.entitlement.id)throw new Error('session_state_invalid');
  return {sessionKey,state:normalizeStoredState(row.state,input.runtime),revision:boundedInt(row.revision,0,100000000,0)};
}

export async function saveCaseSession(input:{supabaseUrl:string;serviceRole:string;runtime:AiCaseRuntime;sessionKey:string;expectedRevision:number;state:AiCaseState}){
  const next=normalizeStoredState(input.state,input.runtime);const path=`ai_case_sessions?session_key=eq.${input.sessionKey}&entitlement_id=eq.${input.runtime.entitlement.id}&revision=eq.${input.expectedRevision}`;
  const rows=await restJson(input.supabaseUrl,input.serviceRole,path,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({state:next,revision:input.expectedRevision+1,last_success_at:new Date().toISOString(),updated_at:new Date().toISOString()})});
  const row=Array.isArray(rows)?rows[0]:null;if(!row)throw new Error('session_state_conflict');return {state:next,revision:input.expectedRevision+1};
}

function ruleMatches(rule:CanonRule,suspectId:string,question:string,presentedEvidenceId:string,state:AiCaseState,nextQuestionCount:number){
  if(rule.suspect_id!==suspectId||state.rule_ids.includes(rule.id))return false;const when=rule.when;
  if((when.min_questions||0)>nextQuestionCount)return false;
  if(!hasAll(state.evidence_ids,when.required_evidence_ids||[])||!hasAll(state.note_ids,when.required_note_ids||[]))return false;
  if((when.presented_evidence_ids||[]).length&&!(presentedEvidenceId&&(when.presented_evidence_ids||[]).includes(presentedEvidenceId)))return false;
  if((when.all_terms||[]).length&&!termsMatch(question,when.all_terms||[],'all'))return false;
  if((when.any_terms||[]).length&&!termsMatch(question,when.any_terms||[],'any'))return false;
  return true;
}

export function applyInterrogationTurn(runtime:AiCaseRuntime,state:AiCaseState,input:{suspectId:string;question:string;presentedEvidenceId?:string}){
  const suspectId=clean(input.suspectId,80);const question=clean(input.question,600);const evidenceId=clean(input.presentedEvidenceId,80);if(!runtime.canon.suspects[suspectId]||question.length<2)throw new Error('invalid_interrogation');if(state.successful_turns>=runtime.publicCase.max_turns)throw new Error('session_limit');if(evidenceId&&!state.evidence_ids.includes(evidenceId))throw new Error('evidence_not_discovered');
  const next:AiCaseState={...state,successful_turns:state.successful_turns+1,question_counts:{...state.question_counts},evidence_ids:[...state.evidence_ids],note_ids:[...state.note_ids],rule_ids:[...state.rule_ids],stages:{...state.stages}};
  const nextCount=(next.question_counts[suspectId]||0)+1;next.question_counts[suspectId]=nextCount;
  const triggered:CanonRule[]=[];
  for(const rule of runtime.canon.rules){if(triggered.length>=4)break;if(!ruleMatches(rule,suspectId,question,evidenceId,state,nextCount))continue;triggered.push(rule);next.rule_ids.push(rule.id);if(rule.grants.note)next.note_ids.push(rule.grants.note.id);if(rule.grants.evidence_ids)next.evidence_ids.push(...rule.grants.evidence_ids);if(rule.stage)next.stages[suspectId]=rule.stage;if(rule.terminal==='confession')next.stages[suspectId]='confessed'}
  next.rule_ids=unique(next.rule_ids);next.note_ids=unique(next.note_ids);next.evidence_ids=unique(next.evidence_ids);
  return {state:normalizeStoredState(next,runtime),triggeredRules:triggered.map(r=>r.id),newNotes:triggered.map(r=>r.grants.note).filter(Boolean) as PublicNote[],newEvidence:triggered.flatMap(r=>(r.grants.evidence_ids||[]).map(id=>runtime.canon.evidence[id])).filter(Boolean),stage:next.stages[suspectId]||'composed'};
}

export function visibleEvidence(runtime:AiCaseRuntime,state:AiCaseState){const initial=new Map(runtime.publicCase.initial_evidence.map(e=>[e.id,e]));return state.evidence_ids.map(id=>initial.get(id)||runtime.canon.evidence[id]).filter(Boolean) as PublicEvidence[]}
export function visibleNotes(runtime:AiCaseRuntime,state:AiCaseState){const notes=new Map<string,PublicNote>();for(const rule of runtime.canon.rules)if(rule.grants.note)notes.set(rule.grants.note.id,rule.grants.note);return state.note_ids.map(id=>notes.get(id)).filter(Boolean) as PublicNote[]}
export function suspectKnowledge(runtime:AiCaseRuntime,state:AiCaseState,suspectId:string){const suspect=runtime.canon.suspects[suspectId];if(!suspect)throw new Error('suspect_not_found');const out=[...suspect.base_facts];for(const noteId of state.note_ids)if(suspect.admissions[noteId])out.push(...suspect.admissions[noteId]);return unique(out)}

export function checkTheory(runtime:AiCaseRuntime,state:AiCaseState,input:{suspectId:string;reason:string}){
  const theory=runtime.canon.theory;const suspectId=clean(input.suspectId,80);const reason=clean(input.reason,1200);if(!runtime.canon.suspects[suspectId]||reason.length<8)throw new Error('invalid_theory');
  const evidenceReady=hasAll(state.evidence_ids,theory.required_evidence_ids);const notesReady=hasAll(state.note_ids,theory.required_note_ids);const wordingReady=(!(theory.all_terms||[]).length||termsMatch(reason,theory.all_terms||[],'all'))&&(!(theory.any_terms||[]).length||termsMatch(reason,theory.any_terms||[],'any'));
  const correct=suspectId===theory.culprit_id&&evidenceReady&&notesReady&&wordingReady;
  return correct?{correct:true,title:theory.success_title,explanation:theory.success_explanation}:{correct:false,ready:evidenceReady&&notesReady,code:suspectId!==theory.culprit_id?'wrong_suspect':!evidenceReady||!notesReady?'insufficient_evidence':'insufficient_reason'};
}

export function safeSessionPayload(runtime:AiCaseRuntime,state:AiCaseState){return {case_id:runtime.caseId,experience_tier:runtime.entitlement.experienceTier,max_turns:runtime.publicCase.max_turns,successful_turns:state.successful_turns,question_counts:state.question_counts,evidence:visibleEvidence(runtime,state),notes:visibleNotes(runtime,state),stages:state.stages}}
