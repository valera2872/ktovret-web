#!/usr/bin/env node
// REAL, isolated AI-route regression for the Free Moreno case. No changes to
// live code/schema, no customer IDs, no analytics; only labelled QA traffic.
import assert from 'node:assert/strict';
const ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v11';
const H={'content-type':'application/json','x-ml-client-version':'moreno-public-v23','origin':'https://mysterylogic.com'};
const nonce=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const session='qa-free-moreno-'+nonce,visitor='v-qa-free-moreno-'+nonce;
const completed=new Set(),history=[];let focus='',last_target='',requests=0;
const nap=ms=>new Promise(r=>setTimeout(r,ms));
async function post(input){
  if(requests++)await nap(5500);
  const body={session_id:session,visitor_id:visitor,completed:[...completed],focus,last_target,
    recent_history:history.slice(-5).join('\n').slice(-1800),memory:{entries:[]},...input};
  const res=await fetch(ENDPOINT,{method:'POST',headers:H,body:JSON.stringify(body),signal:AbortSignal.timeout(35000)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error('LIVE AI HTTP '+res.status+' action='+input.action+' error='+String(data.error||''));
  return data;
}
function found(data,op,target){
  return (data.operations||[]).find(x=>x.op===op&&(!target||x.target===target));
}
async function plan(command,expect,target,flag){
  const d=await post({action:'plan',command});
  const op=found(d,expect,target);
  console.log('REAL '+String(requests).padStart(2,'0'),expect,target||'', 'mode='+d.mode,
    'received='+String((d.operations||[]).map(x=>x.op+(x.target?':'+x.target:''))));
  assert.ok(op,'Failed live intent '+expect+' for '+command+' (actual '+String((d.operations||[]).map(x=>x.op))+')');
  history.push(command);
  if(flag)completed.add(flag);
  if(expect==='start_interview'){focus=target;last_target=target;}
  else if(expect==='end_interview'){focus='';}
  return d;
}
async function ask(question,target,flag){
  await plan(question,'ask_witness',target);
  const d=await post({action:'interrogate',target,question});
  assert.equal(d.mode,'ai_character','Real character API must answer');
  assert.equal(d.character,target);
  assert.ok(typeof d.reply==='string'&&d.reply.trim().length>12,'Empty live answer');
  console.log('REAL '+String(requests).padStart(2,'0'),'answer',target,'mode='+d.mode,'characters='+d.reply.length);
  history.push('Ответ '+target+': '+d.reply.slice(0,130));
  if(flag)completed.add(flag);
  return d;
}
await plan('Осмотрите место происшествия','inspect_scene',undefined,'scene');
await plan('Установите круг лиц в квартире','identify_people',undefined,'people');
await plan('Найдите бывшего жильца второго этажа, который мог быть свидетелем','locate_witnesses',undefined,'witnessLocated');
await plan('Пригласите бойфренда старшей дочери на допрос','start_interview','boyfriend');
await ask('Где вы были в ночь выстрелов?','boyfriend','interview');
await plan('мне нужен тот сосед, который жил этажом ниже. хочу с ним поговорить','start_interview','second_floor_witness');
await ask('Что вы видели на пожарной лестнице?','second_floor_witness','canvass');
await plan('можно пригласить приемную мать Patricia для разговора','start_interview','mother');
await ask('Вы слышали выстрелы той ночью?','mother');
await plan('пригласите специалиста по оружию и пуле','forensic_ballistics',undefined,'ballistics');
await plan('Проведите криминалистическую реконструкцию траектории выстрела','forensic_trajectory',undefined,'trajectory');
await plan('Проверьте доступ бойфренда старшей дочери к оружию','check_weapon',undefined,'weapon');
await plan('Проверьте отношения и угрозы в отношении Patricia','check_relationships',undefined,'motive');
await plan('Проверьте алиби бойфренда старшей дочери: спал ли он в кресле','check_alibi',undefined,'alibi');
await plan('Сопоставьте описание мужчины со стороны свидетеля с установленным кругом лиц','compare_description',undefined,'witnessDescription');
await plan('Моя версия: стрелял бойфренд старшей дочери','record_hypothesis');
await plan('Передаю итоговую реконструкцию. Подозреваемый: бойфренд старшей дочери. Версия: он стрелял в Patricia из квартиры','submit_case');
console.log('PASS real Moreno Free full investigation and AI routing',requests,'requests;',completed.size,'distinct evidence categories');
