import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {P17_CASE_ID,P17_CASE_PATH,TRAIN_LOG_ID,isTrainStopQuestion,lazarevStatement,normalizeP17State,roleFromDuel,type P17State} from '../_shared/passenger17-v1.ts';

const SUPABASE_URL=Deno.env.get('SUPABASE_URL')||'';
const SERVICE_ROLE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const OPENAI_API_KEY=Deno.env.get('OPENAI_API_KEY')||'';
const MODEL=Deno.env.get('AI_DETECTIVE_MODEL')||'gpt-5.6-luna';
const ALLOWED_ORIGINS=new Set((Deno.env.get('ALLOWED_ORIGINS')||'https://mysterylogic.com,https://www.mysterylogic.com,https://valera2872.github.io,https://rawcdn.githack.com').split(',').map(v=>v.trim().replace(/\/$/,'')).filter(Boolean));
const CODE_RE=/^[A-HJ-NP-Z2-9]{8}$/;
const KEY_RE=/^[a-f0-9]{48}$/;
function clean(v:unknown,max=1600){return typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max):''}
function obj(v:unknown):Record<string,any>{return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>: {}}
function cors(o:string){return{...(o?{'access-control-allow-origin':o}:{}),'access-control-allow-headers':'content-type','access-control-allow-methods':'POST, OPTIONS','content-type':'application/json; charset=utf-8','cache-control':'private, no-store','vary':'Origin'}}
function json(o:string,s:number,b:unknown){return new Response(JSON.stringify(b),{status:s,headers:cors(o)})}
async function digest(v:string){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return[...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function serviceHeaders(extra:Record<string,string>={}){return{apikey:SERVICE_ROLE_KEY,authorization:`Bearer ${SERVICE_ROLE_KEY}`,'content-type':'application/json',...extra}}
async function rest(path:string,init:RequestInit={}){const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{...serviceHeaders(),...(init.headers||{})}});const text=await r.text();let body:any=null;if(text){try{body=JSON.parse(text)}catch{body=text}}if(!r.ok)throw new Error(`store_${r.status}:${clean(typeof body==='string'?body:JSON.stringify(body),220)}`);return body}
async function load(code:string,key:string){
  const rooms=await rest(`duel_rooms?select=id,case_id,case_path,status,expires_at&code=eq.${encodeURIComponent(code)}&limit=1`),room=Array.isArray(rooms)?rooms[0]:null;
  if(!room||room.case_id!==P17_CASE_ID||room.case_path!==P17_CASE_PATH||room.status!=='active'||new Date(room.expires_at).getTime()<=Date.now())throw new Error('room_not_found');
  const hash=await digest(key),players=await rest(`duel_room_players?select=id,role,player_key_hash&room_id=eq.${encodeURIComponent(room.id)}`),me=(Array.isArray(players)?players:[]).find((p:any)=>p.player_key_hash===hash);
  if(!me||roleFromDuel(String(me.role))!=='investigator')throw new Error('role_forbidden');
  const rows=await rest(`partner_room_states?select=state,revision,case_id&room_id=eq.${encodeURIComponent(room.id)}&limit=1`),row=Array.isArray(rows)?rows[0]:null;
  if(!row||row.case_id!==P17_CASE_ID)throw new Error('state_missing');
  return{roomId:String(room.id),state:normalizeP17State(row.state),revision:Number(row.revision)||0};
}
async function save(roomId:string,revision:number,state:P17State){const rows=await rest(`partner_room_states?room_id=eq.${encodeURIComponent(roomId)}&revision=eq.${revision}&select=revision`,{method:'PATCH',headers:{prefer:'return=representation'},body:JSON.stringify({state,revision:revision+1,updated_at:new Date().toISOString()})});const row=Array.isArray(rows)?rows[0]:null;if(!row)throw new Error('state_conflict');return Number(row.revision)||revision+1}
function instructions(state:P17State){const shown=state.lazarev.evidenceExposure.includes(TRAIN_LOG_ID)?'Следователь уже предъявил фактический журнал: поезд стоял на техническом посту К-17 с 00:08:47 до 00:10:19.':'Следователь пока не предъявлял документ, подтверждающий техническую остановку.';return `Ты Сергей Лазарев, 46 лет, проводник вагона №6 поезда №142. Это свободный допрос в детективном деле «Пассажир №17». Отвечай от первого лица, по-русски, обычно 1–4 предложениями, как живой человек. Не подсказывай следователю следующие действия. Используй только сведения ниже и не добавляй новых людей, мест, документов или событий. Если ответа в разрешённых сведениях нет, честно скажи, что не знаешь или не помнишь.\n\nТы лично проверял билет и паспорт Павла Орлова после посадки.\n${shown}\n\nРазрешённая на текущем этапе версия:\n${lazarevStatement(state.lazarev.disclosureLevel)}\n\nНе сообщай сведения следующих этапов расследования раньше их раскрытия.`}
function dialogue(state:P17State,question:string){const h=state.lazarev.history.slice(-8).map(t=>`Следователь: ${t.question}\nЛазарев: ${t.answer}`).join('\n');return `${h||'(начало допроса)'}\n\nСледователь: ${question}`}
Deno.serve(async(req:Request)=>{
  const origin=(req.headers.get('origin')||'').replace(/\/$/,'');const allowed=!origin||ALLOWED_ORIGINS.has(origin);
  if(req.method==='OPTIONS')return new Response(null,{status:allowed?204:403,headers:cors(origin)});
  if(req.method!=='POST')return json(origin,405,{error:'method_not_allowed'});if(!allowed)return json('',403,{error:'origin_not_allowed'});if(!SUPABASE_URL||!SERVICE_ROLE_KEY||!OPENAI_API_KEY)return json(origin,503,{error:'interrogation_not_configured'});
  let body:Record<string,any>={};try{body=obj(await req.json())}catch{return json(origin,400,{error:'invalid_request'})}
  const code=clean(body.code,16).toUpperCase(),key=clean(body.browserKey,80).toLowerCase(),question=clean(body.question,900);if(!CODE_RE.test(code)||!KEY_RE.test(key)||!question)return json(origin,400,{error:'invalid_request'});
  try{
    const ctx=await load(code,key);const state=ctx.state;
    if(state.lazarev.disclosureLevel===0&&state.lazarev.evidenceExposure.includes(TRAIN_LOG_ID)&&isTrainStopQuestion(question)){state.lazarev.disclosureLevel=1;if(!state.lazarev.contradictions.includes('STOP_DENIAL'))state.lazarev.contradictions.push('STOP_DENIAL')}
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:`Bearer ${OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify({model:MODEL,instructions:instructions(state),input:dialogue(state,question),store:false,max_output_tokens:220,reasoning:{effort:'none'},text:{verbosity:'low'}})});
    if(!response.ok){console.error('passenger17_openai',response.status,clean(await response.text(),300));return json(origin,502,{error:'model_unavailable'})}
    const data=await response.json();const reply=clean(data.output_text||data.output?.flatMap((o:any)=>o.content||[]).find((c:any)=>c.type==='output_text')?.text||'',1500);if(!reply)return json(origin,502,{error:'empty_model_response'});
    state.lazarev.history.push({question,answer:reply,at:new Date().toISOString()});state.lazarev.history=state.lazarev.history.slice(-24);const revision=await save(ctx.roomId,ctx.revision,state);
    return json(origin,200,{ok:true,reply,disclosureLevel:state.lazarev.disclosureLevel,revision});
  }catch(e){const code=clean((e instanceof Error?e.message:String(e)).split(':')[0],100)||'interrogation_failed';console.error('passenger17_interrogate',String(e));return json(origin,code==='state_conflict'?409:code==='room_not_found'?404:code==='role_forbidden'?403:400,{error:code})}
});
