#!/usr/bin/env node
// Historical v0.5 full investigation routing regression against the ACTUAL
// existing v1 Edge Function. Isolated identity, no customer data, no deployment.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const js=fs.readFileSync(new URL('../assets/real-case-moreno-ai-v05-rollback.js',import.meta.url),'utf8');
const anon=js.match(/const SUPABASE_ANON='([^']+)'/)?.[1];
assert.ok(anon);
const url='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v1';
const headers={'content-type':'application/json',apikey:anon,authorization:'Bearer '+anon,origin:'https://mysterylogic.com'};
const id='ci-v05-e2e-'+Math.random().toString(36).slice(2,12);
const base={session_id:id,visitor_id:'visitor-'+id,completed:[],focus:'',last_target:''};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let calls=0;
async function call(body){
  if(calls++)await wait(5500); // v1 session/network RPM guards
  const r=await fetch(url,{method:'POST',headers,body:JSON.stringify({...base,...body}),signal:AbortSignal.timeout(30000)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error('API response '+r.status+' / '+String(data.error||'HTTP error'));
  return data;
}
async function intent(command,expected,target){
  const x=await call({action:'interpret',command});
  console.log('Step',++n,'expected',expected,'received',String(x.intent||'?'),'target',String(x.target||''),'mode',String(x.mode||''));
  assert.equal(x.intent,expected,'Wrong intent for: '+command);
  if(target)assert.equal(x.target,target,'Wrong target for: '+command);
  return x;
}
async function interrogate(target,question,expectedTopic){
  const x=await call({action:'interrogate',target,question});
  console.log('Step',++n,'witness',target,'topic',String(x.topic||'?'),'mode',String(x.mode||'?'));
  assert.equal(x.topic,expectedTopic);
  assert.ok(typeof x.reply==='string'&&x.reply.length>=16,'Missing source-limited reply');
  assert.ok(x.mode==='ai_classified'||x.mode==='source_limit');
}
let n=0;
await intent('Поручаю осмотреть место происшествия','inspect_scene');base.completed.push('scene');
await intent('Установите, кто жил и находился в квартире','identify_people');base.completed.push('people');
await intent('Найдите соседей, которые могли быть свидетелями','locate_witnesses');base.completed.push('witnessLocated');
await intent('Вызовите на допрос бойфренда старшей дочери','start_interview','boyfriend');base.focus='boyfriend';base.last_target='boyfriend';
await interrogate('boyfriend','Где вы находились ночью, когда были слышны выстрелы?','sequence');base.completed.push('interview');
base.focus=''; // closing the active interview is handled by historical client
await intent('Вызовите на допрос соседа со второго этажа','start_interview','second_floor_witness');base.focus='second_floor_witness';base.last_target='second_floor_witness';
await interrogate('second_floor_witness','Что вы видели на лестнице после выстрела?','observation');base.completed.push('canvass');
base.focus='';
await intent('Назначьте баллистическую экспертизу пули','forensic_ballistics');base.completed.push('ballistics');
await intent('Проверьте траекторию выстрела','forensic_trajectory');base.completed.push('trajectory');
await intent('Проверьте наличие оружия у бойфренда старшей дочери','check_weapon','boyfriend');base.completed.push('weapon');
await intent('Проверьте мотив бойфренда старшей дочери','check_motive','boyfriend');base.completed.push('motive');
await intent('Проверьте алиби бойфренда старшей дочери','check_alibi','boyfriend');base.completed.push('alibi');
await intent('Сопоставьте описание свидетеля с установленным кругом лиц','compare_description');base.completed.push('witnessDescription');
await intent('Моя версия: виноват бойфренд старшей дочери','record_hypothesis');
await intent('Передать дело прокурору для завершения расследования','submit_case');
console.log('PASS historical v0.5 v1 real API full path:',n,'live model calls; no canon payload logged');
