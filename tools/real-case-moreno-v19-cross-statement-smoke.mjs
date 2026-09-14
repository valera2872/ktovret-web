#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const client=fs.readFileSync(path.join(root,'assets','real-case-moreno-ai-v6.js'),'utf8');
const anon=client.match(/const SUPABASE_ANON='([^']+)'/)?.[1];if(!anon)throw new Error('anon key missing');
const url='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v5';
const headers={'content-type':'application/json','apikey':anon,'authorization':`Bearer ${anon}`,'origin':'https://mysterylogic.com'};
const nonce=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
async function post(body){const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`v5 ${r.status}: ${JSON.stringify(data)}`);return data}
const memory={entries:[
 {entry_id:'t2-i1',turn:2,actor_id:'boyfriend',actor:'бойфренд старшей дочери',type:'statement',command:'Где вы были?',title:'Ответ: бойфренд старшей дочери',body:'По его версии, он спал в кресле в гостиной, проснулся от звука двух выстрелов, затем вышел на пожарную лестницу и обнаружил там Patricia.'},
 {entry_id:'t3-i1',turn:3,actor_id:'boyfriend',actor:'бойфренд старшей дочери',type:'statement',command:'Кто стрелял?',title:'Ответ: бойфренд старшей дочери',body:'Он утверждает, что не видел момент выстрела и не знает, кто стрелял.'},
 {entry_id:'t5-i1',turn:5,actor_id:'second_floor_witness',actor:'бывший житель второго этажа',type:'statement',command:'Что вы видели?',title:'Ответ: бывший житель второго этажа',body:'После громкого звука он видел Patricia и мужчину, стоявшего над ней; затем мужчина отступил обратно в квартиру и закрыл дверь.'}
]};
const base={session_id:`ci-v19-${nonce}`,visitor_id:`v-ci-v19-${nonce}`,completed:['people','interview','witnessLocated','canvass','ballistics'],focus:'boyfriend',last_target:'boyfriend',recent_history:'',memory};
const status=await post({action:'status'});if(status.version!==5||status.upstream!=='ai-moreno-investigator-v4'||status.player_leads_investigation!==true||status.automatic_contradiction_detection!==false)throw new Error(`bad v5 status ${JSON.stringify(status)}`);
const plan=await post({...base,action:'plan',command:'Предъяви ему показания соседа'});
if(plan.mode!=='manual_statement_confrontation_plan'||plan.operations?.length!==1)throw new Error(`active-focus manual confrontation plan failed: ${JSON.stringify(plan)}`);
const op=plan.operations[0];if(op.op!=='ask_witness'||op.target!=='boyfriend'||op.question!=='__ML_STATEMENT_PRESENT__:second_floor_witness:t5-i1')throw new Error(`wrong statement selected: ${JSON.stringify(op)}`);
const presented=await post({...base,action:'interrogate',target:'boyfriend',question:op.question});
if(presented.mode!=='manual_statement_confrontation'||presented.statement_source!=='second_floor_witness'||!String(presented.reply).includes('мужчину, стоявшего над ней')||!String(presented.reply).includes('реакция этого собеседника')||!String(presented.reply).includes('не зафиксирована'))throw new Error(`manual statement confrontation failed: ${JSON.stringify(presented)}`);
if(/расходит|противореч|винов|ключевая|правильн/i.test(String(presented.reply)))throw new Error(`system interpreted the selected statement instead of only presenting it: ${presented.reply}`);
const explicitTarget=await post({...base,focus:'',last_target:'second_floor_witness',action:'plan',command:'Предъяви бойфренду показания соседа'});
if(explicitTarget.operations?.length!==2||explicitTarget.operations[0]?.op!=='start_interview'||explicitTarget.operations[0]?.target!=='boyfriend'||explicitTarget.operations[1]?.question!=='__ML_STATEMENT_PRESENT__:second_floor_witness:t5-i1')throw new Error(`explicit target should open that interview then present: ${JSON.stringify(explicitTarget)}`);
const ambiguous=await post({...base,focus:'second_floor_witness',last_target:'second_floor_witness',action:'plan',command:'Предъяви соседу показания бойфренда'});
if(ambiguous.mode!=='manual_statement_selection_required'||ambiguous.operations?.[0]?.op!=='clarify'||!String(ambiguous.operations?.[0]?.note).includes('Выберите конкретный')||!String(ambiguous.operations?.[0]?.note).includes('1)')||!String(ambiguous.operations?.[0]?.note).includes('2)'))throw new Error(`ambiguous source statements were auto-selected: ${JSON.stringify(ambiguous)}`);
const second=await post({...base,focus:'second_floor_witness',last_target:'second_floor_witness',action:'plan',command:'Предъяви соседу второе показание бойфренда'});
if(second.operations?.length!==1||second.operations[0]?.question!=='__ML_STATEMENT_PRESENT__:boyfriend:t3-i1')throw new Error(`explicit ordinal selection failed: ${JSON.stringify(second)}`);
const noTarget=await post({...base,focus:'',last_target:'boyfriend',action:'plan',command:'Предъяви показания соседа'});
if(noTarget.mode!=='manual_statement_selection_required'||!String(noTarget.operations?.[0]?.note).includes('кому предъявить'))throw new Error(`missing recipient should not be inferred: ${JSON.stringify(noTarget)}`);
const playerLed=await post({...base,action:'plan',command:'Кто врёт?'});if(playerLed.mode!=='player_led_guardrail'||!String(playerLed.operations?.[0]?.note).includes('Вывод остаётся за следователем'))throw new Error(`v5 bypassed v4 player-led guardrail: ${JSON.stringify(playerLed)}`);
const evidence=await post({...base,action:'plan',command:'Покажи ему результаты баллистики'});if(evidence.operations?.[0]?.question!=='__ML_PRESENT__:ballistics')throw new Error(`v5 intercepted ordinary evidence presentation: ${JSON.stringify(evidence)}`);
console.log('Moreno v0.19 live player-led cross-statement smoke passed');
