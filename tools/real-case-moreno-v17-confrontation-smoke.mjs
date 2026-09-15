#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const client=fs.readFileSync(path.join(root,'assets','real-case-moreno-ai-v6.js'),'utf8');
const anon=client.match(/const SUPABASE_ANON='([^']+)'/)?.[1];
if(!anon)throw new Error('Could not recover public Supabase anon key from Moreno client');
const url='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v3';
const headers={'content-type':'application/json','apikey':anon,'authorization':`Bearer ${anon}`,'origin':'https://mysterylogic.com'};
async function post(body){const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`v3 ${r.status}: ${JSON.stringify(data)}`);return data}
function oneOp(data,marker){if(!Array.isArray(data.operations)||data.operations.length!==1)throw new Error(`Expected one operation: ${JSON.stringify(data)}`);const op=data.operations[0];if(op.op!=='ask_witness'||op.target!=='boyfriend'||op.question!==marker)throw new Error(`Unexpected confrontation plan: ${JSON.stringify(op)}`)}
const base={session_id:'ci-v17-confrontation',visitor_id:'ci-v17',completed:['people','interview','alibi','ballistics'],focus:'boyfriend',last_target:'boyfriend',recent_history:''};
const alibiPlan=await post({...base,action:'plan',command:'Предъяви ему проверку версии о сне в кресле'});oneOp(alibiPlan,'__ML_PRESENT__:alibi');
const ballisticsPlan=await post({...base,action:'plan',command:'Покажи ему результаты баллистики'});oneOp(ballisticsPlan,'__ML_PRESENT__:ballistics');
const alibi=await post({...base,action:'interrogate',target:'boyfriend',question:'__ML_PRESENT__:alibi'});
if(alibi.mode!=='source_grounded_contradiction'||!String(alibi.reply).includes('Это расходится'))throw new Error(`Expected source-grounded contradiction: ${JSON.stringify(alibi)}`);
if(/игра не будет|виновен|ключевая улика|правильный ответ/i.test(String(alibi.reply)))throw new Error(`Meta/solution cue leaked into alibi confrontation: ${alibi.reply}`);
const ballistics=await post({...base,action:'interrogate',target:'boyfriend',question:'__ML_PRESENT__:ballistics'});
if(ballistics.mode!=='source_grounded_confrontation'||!String(ballistics.reply).includes('реакция этого собеседника')||!String(ballistics.reply).includes('не зафиксирована'))throw new Error(`Expected bounded source-grounded confrontation: ${JSON.stringify(ballistics)}`);
console.log('Moreno v0.17 live confrontation smoke passed');
