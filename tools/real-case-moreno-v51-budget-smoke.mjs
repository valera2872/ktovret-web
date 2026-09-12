#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'realnye-dela/pozharnaya-lestnica-1991/index.html'),'utf8');
const bridge=fs.readFileSync(path.join(root,'assets/real-case-moreno-budget-v51.js'),'utf8');
const ai=fs.readFileSync(path.join(root,'assets/real-case-moreno-ai-v5.js'),'utf8');
for(const x of ['real-case-moreno-budget-v51.js?v=0.5.1','real-case-moreno-ai-v5.js?v=0.5.1'])if(!html.includes(x))throw new Error(`route missing ${x}`);
if(html.indexOf('real-case-moreno-budget-v51.js')>html.indexOf('real-case-moreno-ai-v5.js'))throw new Error('budget bridge must load before AI client');
for(const x of ['ml-ai-detective-visitor-v1','visitor_id','response.status!==429','quotaPayload'])if(!bridge.includes(x))throw new Error(`budget bridge missing ${x}`);
for(const banned of ['OPENAI_API_KEY','SUPABASE_SERVICE_ROLE_KEY','api.openai.com/v1/responses'])if(bridge.includes(banned)||ai.includes(banned)||html.includes(banned))throw new Error(`secret leak ${banned}`);
const anon=(ai.match(/const SUPABASE_ANON='([^']+)'/)||[])[1];if(!anon)throw new Error('anon key missing');
const endpoint='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v1';
const seed=Date.now().toString(36)+Math.random().toString(36).slice(2,10);
const session=`moreno-ci-${seed}`;
const visitor=`v-ci-${seed}`;
async function live(body){const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','apikey':anon,'authorization':`Bearer ${anon}`,'origin':'https://rawcdn.githack.com'},body:JSON.stringify({session_id:session,visitor_id:visitor,...body})});const text=await r.text();if(!r.ok)throw new Error(`live ${r.status}: ${text.slice(0,500)}`);return JSON.parse(text)}
const status=await live({action:'status'});if(!status.ai_ready||!status.budget_ready)throw new Error(`AI/budget not ready: ${JSON.stringify(status)}`);
const limits=status.limits||{};for(const [k,v] of [['session',120],['visitor_daily',160],['network_daily',600],['daily_budget_usd',0.5]])if(Number(limits[k])!==v)throw new Error(`unexpected ${k}: ${limits[k]}`);
const understood=await live({action:'interpret',command:'вызвать этого свидетеля',completed:['witnessLocated'],focus:'',last_target:'second_floor_witness'});if(understood.intent!=='start_interview'||understood.target!=='second_floor_witness')throw new Error(`context failed: ${JSON.stringify(understood)}`);
const witness=await live({action:'interrogate',target:'second_floor_witness',question:'Что вы слышали или видели после громкого звука?',completed:['witnessLocated']});if(witness.topic!=='observation'||!String(witness.reply||'').includes('мужчин'))throw new Error(`interrogation failed: ${JSON.stringify(witness)}`);
fs.mkdirSync(path.join(root,'artifacts','real-case-moreno-v5'),{recursive:true});
const report={version:'0.5.1',hardBudget:true,aiReady:true,budgetReady:true,limits,contextIntent:understood.intent,witnessTopic:witness.topic};
fs.writeFileSync(path.join(root,'artifacts','real-case-moreno-v5','budget-smoke.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
