#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const source=fs.readFileSync(new URL('../supabase/functions/ai-moreno-investigator-v11/index.ts',import.meta.url),'utf8').replace(/^import "jsr:[^"]+";\s*/,'');
let serve,fetchCount=0;
vm.runInNewContext(stripTypeScriptTypes(source,{mode:'strip'}),{
  Deno:{env:{get:()=> 'test-anon-key'},serve:f=>{serve=f;}},Request,Response,Headers,console,
  fetch:async()=>{fetchCount++;return new Response(JSON.stringify({operations:[{op:'ask_witness',target:'boyfriend'}],mode:'test_upstream'}),{status:200})}
},{filename:'moreno-v11/index.ts'});
assert.ok(typeof serve==='function');
async function post(command,other={},headers={}){
  const request=new Request('https://mysterylogic.com/functions/v1/ai-moreno-investigator-v11',{
    method:'POST',headers:{origin:'https://mysterylogic.com','x-ml-client-version':'moreno-public-v23','content-type':'application/json',...headers},
    body:JSON.stringify({action:'plan',focus:'boyfriend',completed:['people','witnessLocated'],command,...other}),
  });
  const response=await serve(request);return {status:response.status,data:await response.json()};
}
const positives=[
 'нужны экспертиза с рук бойфренда, стрелял ли он, может есть следы пороха?',
 'Проверьте следы пороха на руках бойфренда',
 'Проведите экспертизу продуктов выстрела на кистях подозреваемого',
 'Назначьте анализ смывов с рук бойфренда'
];
for(const command of positives){
 const {status,data}=await post(command);
 assert.equal(status,200);assert.equal(data.operations[0]?.op,'unsupported_forensic',JSON.stringify(data));
 assert.equal(data.mode,'player_requested_source_limited_forensic');
 assert.equal(data.player_led,true);
 assert.equal(data.automatic_solution_inference,false);
 assert.equal(data.automatic_evidence_ranking,false);
 assert.equal(data.operations[0]?.note,command);
}
assert.equal(fetchCount,0,'Specific forensic must be handled without LLM for stable source limit');
const negatives=[
 'Вы стреляли? На ваших руках были следы пороха?',
 'Назначьте баллистическую экспертизу извлеченной пули',
 'Можете проверить траекторию выстрела?',
 'Вызываю экспертов',
 'Проверьте доступ бойфренда к пистолетам'
];
for(const command of negatives){
 const {status,data}=await post(command);
 assert.equal(status,200);assert.equal(data.mode,'test_upstream','Do not hijack '+command);
}
assert.equal(fetchCount,negatives.length);
const badOrigin=await post(positives[0],{}, {origin:'https://example.invalid'});
assert.equal(badOrigin.status,403);
const badAuth=await post(positives[0],{}, {'x-ml-client-version':'not-authorized'});
assert.equal(badAuth.status,401);
const final=await post('Передаю итоговую реконструкцию. Подозреваемый: свидетель');
assert.equal(final.data.mode,'player_final_reconstruction');
console.log('PASS Moreno v11 GSR evidence limitation: 4 positive, 5 negative, guard/auth/final; no server state writes');
