#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const client=fs.readFileSync(path.join(root,'assets','real-case-moreno-ai-v6.js'),'utf8');
const anon=client.match(/const SUPABASE_ANON='([^']+)'/)?.[1];
if(!anon)throw new Error('Could not recover public Supabase anon key from Moreno client');
const url='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v4';
const headers={'content-type':'application/json','apikey':anon,'authorization':`Bearer ${anon}`,'origin':'https://mysterylogic.com'};
async function post(body){const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`v4 ${r.status}: ${JSON.stringify(data)}`);return data}
function oneMemoryOp(data,kind,execution='boyfriend',lookup='boyfriend'){if(!Array.isArray(data.operations)||data.operations.length!==1)throw new Error(`Expected one memory operation: ${JSON.stringify(data)}`);const op=data.operations[0];if(op.op!=='ask_witness'||op.target!==execution||op.question!==`__ML_MEMORY__:${kind}:${lookup}`)throw new Error(`Unexpected memory plan: ${JSON.stringify(op)}`)}
function assertPlayerLed(data,label){const op=data.operations?.[0];const note=String(op?.note||'');if(data.mode!=='player_led_guardrail'||op?.op!=='clarify')throw new Error(`${label} must hit player-led guardrail: ${JSON.stringify(data)}`);if(!note.includes('Вывод остаётся за следователем'))throw new Error(`${label} guardrail wording missing: ${JSON.stringify(data)}`);if(/сне в кресле|спрятал оружие|мужчин.*над ней|калибр/i.test(note))throw new Error(`${label} leaked investigative content: ${note}`)}
const memory={entries:[
 {turn:2,actor_id:'boyfriend',actor:'бойфренд старшей дочери',type:'statement',command:'Где вы были и что делали перед выстрелами?',title:'Ответ: бойфренд старшей дочери',body:'По его версии, он спал в кресле в гостиной, проснулся от звука двух выстрелов, затем вышел на пожарную лестницу и обнаружил там Patricia.'},
 {turn:5,actor_id:'second_floor_witness',actor:'бывший житель второго этажа',type:'statement',command:'Что вы видели после выстрела?',title:'Ответ: бывший житель второго этажа',body:'После громкого звука он видел Patricia и мужчину, стоявшего над ней; затем мужчина отступил обратно в квартиру и закрыл дверь.'},
 {turn:6,actor_id:'boyfriend',actor:'бойфренд старшей дочери',type:'confrontation',command:'Покажи ему результаты баллистики',title:'Ответ: бойфренд старшей дочери',body:'Вы предъявили результат баллистики: извлечённый из тела Patricia снаряд был совместим с выстрелом из оружия калибра .38. В доступных официальных материалах реакция этого собеседника на такое предъявление не зафиксирована.'}
]};
const stamp=Date.now().toString(36);
const base={session_id:`ci-v18-memory-${stamp}`,visitor_id:`v-ci-v18-${stamp}`,completed:['people','interview','alibi','ballistics','witnessLocated','canvass'],focus:'boyfriend',last_target:'boyfriend',recent_history:'',memory};
const status=await post({action:'status'});if(status.version!==4||status.upstream!=='ai-moreno-investigator-v3'||status.player_leads_investigation!==true||!String(status.planner_policy).includes('retrieval-only-memory'))throw new Error(`Unexpected v4 status: ${JSON.stringify(status)}`);
const statementsPlan=await post({...base,action:'plan',command:'Напомни, что он говорил про выстрелы?'});oneMemoryOp(statementsPlan,'statements');
const statements=await post({...base,action:'interrogate',target:'boyfriend',question:'__ML_MEMORY__:statements:boyfriend'});
if(statements.mode!=='memory_recall'||!String(statements.reply).includes('спал в кресле')||!String(statements.reply).startsWith('Память дела:'))throw new Error(`Statement memory failed: ${JSON.stringify(statements)}`);
const confrontationPlan=await post({...base,action:'plan',command:'Что я ему уже предъявлял?'});oneMemoryOp(confrontationPlan,'confrontations');
const confrontations=await post({...base,action:'interrogate',target:'boyfriend',question:'__ML_MEMORY__:confrontations:boyfriend'});
if(confrontations.mode!=='memory_recall'||!String(confrontations.reply).includes('баллистики')||!String(confrontations.reply).includes('калибра .38'))throw new Error(`Confrontation memory failed: ${JSON.stringify(confrontations)}`);
const crossPlan=await post({...base,action:'plan',command:'Напомни, что говорил сосед?'});oneMemoryOp(crossPlan,'statements','boyfriend','second_floor_witness');
const cross=await post({...base,action:'interrogate',target:'boyfriend',question:'__ML_MEMORY__:statements:second_floor_witness'});
if(cross.memory_target!=='second_floor_witness'||!String(cross.reply).includes('мужчину, стоявшего над ней'))throw new Error(`Cross-person memory failed: ${JSON.stringify(cross)}`);
const noFocus=await post({...base,focus:'',last_target:'',action:'plan',command:'Напомни, что говорил бойфренд про выстрелы?'});
if(noFocus.operations?.[0]?.op!=='clarify'||!String(noFocus.operations?.[0]?.note).startsWith('Память дела:')||String(noFocus.operations?.[0]?.note).includes('__ML_MEMORY__'))throw new Error(`Desk memory should return a direct memory card without opening an interview: ${JSON.stringify(noFocus)}`);
assertPlayerLed(await post({...base,action:'plan',command:'Какие здесь расхождения?'}),'automatic contradiction search');
assertPlayerLed(await post({...base,action:'plan',command:'Кто врёт?'}),'who-lies shortcut');
assertPlayerLed(await post({...base,action:'plan',command:'Кто виноват?'}),'guilt shortcut');
for(const text of [statements.reply,confrontations.reply,cross.reply,noFocus.operations?.[0]?.note])if(/виновен|ключевая улика|правильный ответ/i.test(String(text)))throw new Error(`Solution cue leaked into memory: ${text}`);
const forwarded=await post({...base,action:'plan',command:'Покажи ему результаты баллистики'});
if(forwarded.operations?.[0]?.question!=='__ML_PRESENT__:ballistics')throw new Error(`v4 did not preserve v3 confrontation routing: ${JSON.stringify(forwarded)}`);
console.log('Moreno v0.18 retrieval-only investigative memory smoke passed');
