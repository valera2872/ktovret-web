import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {P17_CASE_ID,P17_CASE_PATH,P17_CASE_TITLE,TRAIN_LOG,TRAIN_LOG_ID,initialP17State,normalizeP17State,resolveInvestigationIntent,roleFromDuel,type P17State,type P17Role} from '../_shared/passenger17-v1.ts';

const SUPABASE_URL=Deno.env.get('SUPABASE_URL')||'';
const SERVICE_ROLE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const ALLOWED_ORIGINS=new Set((Deno.env.get('ALLOWED_ORIGINS')||'https://mysterylogic.com,https://www.mysterylogic.com,https://valera2872.github.io,https://rawcdn.githack.com').split(',').map(v=>v.trim().replace(/\/$/,'')).filter(Boolean));
const CODE_RE=/^[A-HJ-NP-Z2-9]{8}$/;const BROWSER_KEY_RE=/^[a-f0-9]{48}$/;
function clean(v:unknown,max=1200){return typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max):''}
function record(v:unknown):Record<string,any>{return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>: {}}
function cors(origin:string){return{...(origin?{'access-control-allow-origin':origin}:{}),'access-control-allow-headers':'content-type','access-control-allow-methods':'POST, OPTIONS','content-type':'application/json; charset=utf-8','cache-control':'private, no-store, max-age=0','vary':'Origin'}}
function json(origin:string,status:number,body:unknown){return new Response(JSON.stringify(body),{status,headers:cors(origin)})}
async function digest(value:string){const out=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return[...new Uint8Array(out)].map(v=>v.toString(16).padStart(2,'0')).join('')}
function headers(extra:Record<string,string>={}){return{apikey:SERVICE_ROLE_KEY,authorization:`Bearer ${SERVICE_ROLE_KEY}`,'content-type':'application/json',...extra}}
async function rest(path:string,init:RequestInit={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{...headers(),...(init.headers||{})}});const text=await r.text();let body:any=null;if(text){try{body=JSON.parse(text)}catch{body=text}}if(!r.ok)throw new Error(`store_${r.status}:${clean(typeof body==='string'?body:JSON.stringify(body),240)}`);return body}
async function context(code:string,browserKey:string){
 const rooms=await rest(`duel_rooms?select=id,code,case_id,case_title,case_path,status,expires_at&code=eq.${encodeURIComponent(code)}&limit=1`),room=Array.isArray(rooms)?rooms[0]:null;
 if(!room)throw new Error('room_not_found');if(room.case_id!==P17_CASE_ID||room.case_path!==P17_CASE_PATH)throw new Error('wrong_case');if(room.status!=='active'||new Date(room.expires_at).getTime()<=Date.now())throw new Error('room_inactive');
 const hash=await digest(browserKey),players=await rest(`duel_room_players?select=id,role,player_key_hash,player_name&room_id=eq.${encodeURIComponent(room.id)}&order=role.asc`),list=Array.isArray(players)?players:[],me=list.find((p:any)=>p.player_key_hash===hash),other=list.find((p:any)=>p.id!==me?.id)||null;
 if(!me)throw new Error('not_joined');return{room,role:roleFromDuel(String(me.role)),meName:String(me.player_name||''),partner:{joined:Boolean(other),name:other?.player_name?String(other.player_name):null}};
}
async function readState(roomId:string){const rows=await rest(`partner_room_states?select=state,revision,case_id&room_id=eq.${encodeURIComponent(roomId)}&limit=1`),row=Array.isArray(rows)?rows[0]:null;if(!row)return null;if(row.case_id!==P17_CASE_ID)throw new Error('wrong_state_case');return{state:normalizeP17State(row.state),revision:Number(row.revision)||0}}
async function loadOrCreate(roomId:string){
 const existing=await readState(roomId);if(existing)return existing;
 const state=initialP17State();
 try{const made=await rest('partner_room_states?select=state,revision,case_id',{method:'POST',headers:{prefer:'return=representation'},body:JSON.stringify({room_id:roomId,case_id:P17_CASE_ID,state,revision:0,entitlement_id:null})});const first=Array.isArray(made)?made[0]:null;if(first)return{state:normalizeP17State(first.state),revision:Number(first.revision)||0};}catch(error){const raw=error instanceof Error?error.message:String(error);if(!raw.startsWith('store_409'))throw error;}
 const raced=await readState(roomId);if(!raced)throw new Error('state_create_failed');return raced;
}
async function save(roomId:string,revision:number,state:P17State){const rows=await rest(`partner_room_states?room_id=eq.${encodeURIComponent(roomId)}&revision=eq.${revision}&select=state,revision`,{method:'PATCH',headers:{prefer:'return=representation'},body:JSON.stringify({state,revision:revision+1,updated_at:new Date().toISOString()})});const row=Array.isArray(rows)?rows[0]:null;if(!row)throw new Error('state_conflict');return{state:normalizeP17State(row.state),revision:Number(row.revision)||revision+1}}
function evidenceFor(state:P17State,role:P17Role){const e=state.evidence.train_actual_movement;if(!e.discovered)return[];if(role==='analyst'||e.shared)return[{...TRAIN_LOG,shared:e.shared,canShare:role==='analyst'&&!e.shared,presented:state.lazarev.evidenceExposure.includes(TRAIN_LOG_ID)}];return[]}
function view(state:P17State,role:P17Role,partner:any,revision:number,lastAction:any=null){return{ok:true,room:{caseId:P17_CASE_ID,caseTitle:P17_CASE_TITLE},role,roleLabel:role==='investigator'?'Следователь':'Аналитик',partner,revision,evidence:evidenceFor(state,role),lazarev:role==='investigator'?{available:true,name:'Сергей Лазарев',role:'проводник вагона №6',disclosureLevel:state.lazarev.disclosureLevel,history:state.lazarev.history}:null,analystHistory:role==='analyst'?state.analystHistory:[],lastAction}}
Deno.serve(async(req:Request)=>{
 const origin=(req.headers.get('origin')||'').replace(/\/$/,'');const allowed=!origin||ALLOWED_ORIGINS.has(origin);if(req.method==='OPTIONS')return new Response(null,{status:allowed?204:403,headers:cors(origin)});if(req.method!=='POST')return json(origin,405,{error:'method_not_allowed'});if(!allowed)return json('',403,{error:'origin_not_allowed'});if(!SUPABASE_URL||!SERVICE_ROLE_KEY)return json(origin,503,{error:'store_not_configured'});
 let body:Record<string,any>={};try{body=record(await req.json())}catch{return json(origin,400,{error:'invalid_request'})}const action=clean(body.action,40).toUpperCase()||'SNAPSHOT',code=clean(body.code,16).toUpperCase(),browserKey=clean(body.browserKey,80).toLowerCase();if(!CODE_RE.test(code)||!BROWSER_KEY_RE.test(browserKey))return json(origin,400,{error:'invalid_request'});
 try{const c=await context(code,browserKey);if(action!=='SNAPSHOT'&&action!=='START'&&!c.partner.joined)throw new Error('partner_required');let {state,revision}=await loadOrCreate(String(c.room.id));let lastAction:any=null;
  if(action==='INVESTIGATE'){
   if(c.role!=='analyst')throw new Error('role_forbidden');const query=clean(body.query,900);if(!query)throw new Error('invalid_request');const intent=resolveInvestigationIntent(query);
   if(intent===TRAIN_LOG_ID){state.evidence.train_actual_movement={discovered:true,shared:state.evidence.train_actual_movement.shared,discoveredBy:'analyst'};lastAction={status:'RESULT',intent,title:TRAIN_LOG.title,body:TRAIN_LOG.body};}
   else lastAction={status:'NO_RESULT',intent:'unknown',title:'Запрос не дал результата',body:'По сформулированному запросу подтверждённых данных в доступных источниках не найдено. Попробуйте точнее определить источник или объект проверки.'};
   state.analystHistory.push({query,intent,result:lastAction.body,at:new Date().toISOString()});state.analystHistory=state.analystHistory.slice(-30);({state,revision}=await save(String(c.room.id),revision,state));
  }else if(action==='SHARE_EVIDENCE'){
   if(c.role!=='analyst'||clean(body.evidence_id,80)!==TRAIN_LOG_ID||!state.evidence.train_actual_movement.discovered)throw new Error('evidence_forbidden');state.evidence.train_actual_movement.shared=true;({state,revision}=await save(String(c.room.id),revision,state));
  }else if(action==='PRESENT_EVIDENCE'){
   if(c.role!=='investigator'||clean(body.evidence_id,80)!==TRAIN_LOG_ID||!state.evidence.train_actual_movement.shared)throw new Error('evidence_forbidden');if(!state.lazarev.evidenceExposure.includes(TRAIN_LOG_ID))state.lazarev.evidenceExposure.push(TRAIN_LOG_ID);({state,revision}=await save(String(c.room.id),revision,state));lastAction={status:'PRESENTED',evidenceId:TRAIN_LOG_ID};
  }else if(action!=='SNAPSHOT'&&action!=='START')throw new Error('invalid_action');
  return json(origin,200,view(state,c.role,c.partner,revision,lastAction));
 }catch(e){const code=clean((e instanceof Error?e.message:String(e)).split(':')[0],100)||'request_failed';const status=code==='room_not_found'?404:code==='room_inactive'?410:['partner_required','role_forbidden','evidence_forbidden','wrong_case','wrong_state_case'].includes(code)?403:code==='state_conflict'?409:400;console.error('passenger17_session',String(e));return json(origin,status,{error:code});}
});
