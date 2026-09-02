#!/usr/bin/env node

const API_URL=process.env.API_URL||'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-interrogation-v1';
const ANON_KEY=process.env.ANON_KEY||'';
const RUN_SUFFIX=process.env.RUN_SUFFIX||`${Date.now()}`;
const VISITOR_ID=process.env.VISITOR_ID||`ci-ai-resistance-${RUN_SUFFIX}`;
if(!ANON_KEY)throw new Error('ANON_KEY is required');

const headers={
  Origin:'https://valera2872.github.io',
  Authorization:`Bearer ${ANON_KEY}`,
  apikey:ANON_KEY,
  'Content-Type':'application/json'
};

async function call(body){
  const payload={...body,visitor_id:VISITOR_ID,session_id:`${body.session_id}-${RUN_SUFFIX}`};
  const response=await fetch(API_URL,{method:'POST',headers,body:JSON.stringify(payload)});
  const text=await response.text();
  let data;try{data=JSON.parse(text)}catch{throw new Error(`HTTP ${response.status}: ${text}`)}
  if(!response.ok)throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  const allow=response.headers.get('access-control-allow-origin');
  if(allow!=='https://valera2872.github.io')throw new Error(`bad CORS allow origin: ${allow}`);
  return data;
}

function assert(condition,message,data){if(!condition)throw new Error(`${message}\n${JSON.stringify(data,null,2)}`)}
function hasConfession(data){return Array.isArray(data.notes)&&data.notes.some(note=>note?.id==='N-MARINA-CONFESSION')}
function replyConfesses(data){return /я\s+(взяла|украла|похитила)\s+письмо|письмо\s+взяла\s+я/i.test(String(data.reply||''))}

const status=await call({action:'status',session_id:'status',resistance_level:'medium'});
assert(status.ai_ready===true&&status.metering_ready===true,'AI status must be ready',status);
assert(status.resistance_level==='medium','medium must be default/selected status',status);
assert(JSON.stringify(status.resistance_levels)==='["easy","medium","hard"]','all resistance levels must be advertised',status);

// Easy still must not be a one-question confession button.
const easy=await call({
  action:'interrogate',session_id:'easy',suspect_id:'marina',resistance_level:'easy',
  question:'Это вы взяли письмо? Признайтесь.',evidence_id:'',history:[],
  discovered_evidence_ids:['E01','E02','E03'],discovered_note_ids:[],
  question_counts:{marina:1,anton:0,lev:0}
});
assert(easy.mode==='ai','easy must use real AI',easy);
assert(easy.resistance_level==='easy','easy level must round-trip',easy);
assert(!hasConfession(easy)&&!replyConfesses(easy),'easy must not confess on first accusation',easy);

// Medium: accumulated established pressure + direct accusation is enough; no magic four-line sentence.
const medium=await call({
  action:'interrogate',session_id:'medium',suspect_id:'marina',resistance_level:'medium',
  question:'Марина, доказательства уже разрушили вашу версию. Письмо взяли вы. Вы это признаёте?',evidence_id:'',history:[],
  discovered_evidence_ids:['E01','E02','E03','E04','E05','E06','E07'],
  discovered_note_ids:['N-ANTON-WINDOW','N-MARINA-ACCESS','N-MARINA-LOCATION'],
  question_counts:{marina:4,anton:4,lev:1}
});
assert(medium.resistance_level==='medium','medium level must round-trip',medium);
assert(hasConfession(medium),'medium must confess after earned pressure plus direct accusation',medium);
assert(medium.interrogation_stage==='confessed','medium must expose confessed stage',medium);
assert(replyConfesses(medium),'medium reply must be an unambiguous first-person confession',medium);

// Hard: the same short accusation must not be enough even with the evidence already collected.
const hardShort=await call({
  action:'interrogate',session_id:'hard-short',suspect_id:'marina',resistance_level:'hard',
  question:'Все улики против вас. Это вы взяли письмо?',evidence_id:'',history:[],
  discovered_evidence_ids:['E01','E02','E03','E04','E05','E06','E07'],
  discovered_note_ids:['N-ANTON-WINDOW','N-MARINA-ACCESS','N-MARINA-LOCATION','N-MARINA-WINDOW'],
  question_counts:{marina:6,anton:4,lev:1}
});
assert(hardShort.resistance_level==='hard','hard level must round-trip',hardShort);
assert(!hasConfession(hardShort)&&!replyConfesses(hardShort),'hard must reject a short generic accusation',hardShort);

// Hard preserves the old full synthesis requirement.
const hardFull=await call({
  action:'interrogate',session_id:'hard-full',suspect_id:'marina',resistance_level:'hard',
  question:'Антон и Лев исключены подтверждёнными алиби. Вы солгали про двор: телефон до 21:34 оставался внутри Archive-2. В 21:31 фонд открыли вашей E-14 с вашим PIN, а точное окно камеры вы заранее выяснили у Антона. Вы взяли письмо?',evidence_id:'',history:[],
  discovered_evidence_ids:['E01','E02','E03','E04','E05','E06','E07'],
  discovered_note_ids:['N-ANTON-WINDOW','N-MARINA-ACCESS','N-MARINA-LOCATION','N-MARINA-WINDOW'],
  question_counts:{marina:6,anton:4,lev:1}
});
assert(hasConfession(hardFull),'hard full synthesis must confess',hardFull);
assert(hardFull.interrogation_stage==='confessed','hard full synthesis must expose confessed stage',hardFull);
assert(replyConfesses(hardFull),'hard full synthesis reply must confess',hardFull);

console.log(JSON.stringify({ok:true,status:status.resistance_levels,easy:easy.interrogation_stage,medium:medium.interrogation_stage,hardShort:hardShort.interrogation_stage,hardFull:hardFull.interrogation_stage},null,2));
