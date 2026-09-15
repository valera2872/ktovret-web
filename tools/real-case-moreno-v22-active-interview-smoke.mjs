#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const client=fs.readFileSync(path.join(root,'assets','real-case-moreno-ai-v6.js'),'utf8');
const anon=client.match(/const SUPABASE_ANON='([^']+)'/)?.[1];if(!anon)throw new Error('anon key missing');
const url='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v8';
const headers={'content-type':'application/json','apikey':anon,'authorization':`Bearer ${anon}`,'origin':'https://mysterylogic.com'};
const nonce=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
async function post(body){const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`v8 ${r.status}: ${JSON.stringify(data)}`);return data}
function op(plan,name,target){return (plan.operations||[]).some(x=>x.op===name&&(!target||x.target===target))}
const sid=`ci-v22-${nonce}`,vid=`v-ci-v22-${nonce}`;
const base={session_id:sid,visitor_id:vid,completed:['people','ballistics','motive'],recent_history:'',memory:{entries:[]}};

const status=await post({action:'status'});
if(status.version!==8||status.interrogation_mode!=='active-witness-first'||status.active_interview_default!=='ask-current-character')throw new Error(`bad v8 status ${JSON.stringify(status)}`);

// Exact owner regression #1: a request addressed to the active boyfriend must remain his question,
// even though it contains the verb "предъявить".
const weaponInspection=await post({...base,focus:'boyfriend',last_target:'boyfriend',action:'plan',command:'вы можете предъявить оружие к досмотру и экспертизе?'});
if(!op(weaponInspection,'ask_witness','boyfriend'))throw new Error(`weapon inspection request escaped active boyfriend interview: ${JSON.stringify(weaponInspection)}`);
if(op(weaponInspection,'clarify'))throw new Error(`weapon inspection request became clarification: ${JSON.stringify(weaponInspection)}`);

// Exact owner regression #2: a natural question during the mother's interview must stay with her,
// not turn into the already-completed global relationship check.
const motherConflict=await post({...base,focus:'mother',last_target:'mother',action:'plan',command:'у них были конфликты?'});
if(!op(motherConflict,'ask_witness','mother'))throw new Error(`mother conflict question escaped active interview: ${JSON.stringify(motherConflict)}`);
if(op(motherConflict,'check_relationships'))throw new Error(`mother conflict question incorrectly became global relationship check: ${JSON.stringify(motherConflict)}`);

// Explicit global orders must still leave the active conversation and go to the planner.
const ballistics=await post({...base,focus:'mother',last_target:'mother',action:'plan',command:'проверь баллистику'});
if(op(ballistics,'ask_witness','mother'))throw new Error(`explicit global ballistics order was stolen by active interview: ${JSON.stringify(ballistics)}`);

// Explicit switch must still route through v7 and activate the requested person.
const switchPlan=await post({...base,focus:'mother',last_target:'mother',action:'plan',command:'вызови на допрос бойфренда старшей дочери'});
if(!op(switchPlan,'start_interview','boyfriend'))throw new Error(`explicit witness switch failed: ${JSON.stringify(switchPlan)}`);

// Explicit evidence presentation remains a confrontation command, not an ordinary question.
const present=await post({...base,focus:'boyfriend',last_target:'boyfriend',action:'plan',command:'предъяви ему результаты баллистики'});
if(op(present,'ask_witness','boyfriend'))throw new Error(`evidence presentation was swallowed as an ordinary witness question: ${JSON.stringify(present)}`);

console.log('Moreno v0.22 active-interview routing smoke passed');
console.log(JSON.stringify({weaponInspection:weaponInspection.operations,motherConflict:motherConflict.operations,ballistics:ballistics.operations,switchPlan:switchPlan.operations,present:present.operations},null,2));
