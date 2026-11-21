#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';

// Execute the actual Edge Function with mocked Deno/fetch, not a copied regex.
const source=readFileSync(new URL('../supabase/functions/ai-moreno-investigator-v8/index.ts',import.meta.url),'utf8')
  .replace(/^import "jsr:[^"]+";\s*/,'');
let handler=null;
const sandbox={
  Deno:{env:{get:()=>''},serve:fn=>{handler=fn}},
  Request,Response,Headers,console,
  fetch:async()=>{throw new Error('Unexpected network request from deterministic contract')},
};
vm.runInNewContext(stripTypeScriptTypes(source,{mode:'strip'}),sandbox,{filename:'moreno-v8/index.ts'});
assert.equal(typeof handler,'function','Deno Edge handler must register');

const known=['people','witnessLocated'];
const common={action:'plan',focus:'boyfriend',last_target:'boyfriend',completed:known};
async function post(body,overrideHeaders={}){
  const request=new Request('https://mysterylogic.com/functions/v1/ai-moreno-investigator-v8',{
    method:'POST',
    headers:{origin:'https://mysterylogic.com','x-ml-client-version':'moreno-public-v23','content-type':'application/json',...overrideHeaders},
    body:JSON.stringify({...common,...body}),
  });
  const response=await handler(request);
  return {status:response.status,body:await response.json()};
}
function hasOp(data,op,target){
  return (data.operations||[]).some(item=>item.op===op&&(!target||item.target===target));
}
function checkSwitch(result,target){
  assert.equal(result.status,200,JSON.stringify(result));
  assert.equal(result.body.mode,'semantic_entity_routing',JSON.stringify(result.body));
  assert.ok(hasOp(result.body,'start_interview',target),JSON.stringify(result.body));
  assert.equal(result.body.player_led,true);
  assert.equal(result.body.automatic_contradiction_detection,false);
}

checkSwitch(await post({command:'мне нужен тот сосед, который жил этажом ниже. хочу с ним поговорить'}),'second_floor_witness');
checkSwitch(await post({command:'мне нужен тот сосед, который жил этажом ниже. хочу с ним поговорить о бойфренде'}),'second_floor_witness');
checkSwitch(await post({focus:'mother',last_target:'mother',command:'хочу поговорить с парнем старшей дочери'}),'boyfriend');
checkSwitch(await post({command:'дайте мне поговорить с приемной матерью Patricia'}),'mother');
checkSwitch(await post({command:'мне нужна старшая дочь, хочу её допросить'}),'older_daughter');

const notFound=await post({completed:['people'],command:'мне нужен тот сосед, который жил этажом ниже. хочу с ним поговорить'});
assert.equal(notFound.body.mode,'semantic_entity_clarification',JSON.stringify(notFound.body));
assert.ok(hasOp(notFound.body,'clarify'));
assert.ok(!hasOp(notFound.body,'start_interview'));
const notIdentified=await post({focus:'mother',completed:[],command:'хочу поговорить с парнем старшей дочери'});
assert.equal(notIdentified.body.mode,'semantic_entity_clarification',JSON.stringify(notIdentified.body));
assert.ok(!hasOp(notIdentified.body,'start_interview'));

for(const command of [
  'мне нужен убийца, хочу с ним поговорить',
  'хочу поговорить с мужчиной, которого видели на лестнице'
]){
  const result=await post({command});
  assert.equal(result.body.mode,'semantic_entity_clarification',JSON.stringify(result.body));
  assert.ok(hasOp(result.body,'clarify'));
  assert.equal(result.body.automatic_identity_inference,false);
  assert.ok(!hasOp(result.body,'start_interview'));
}
for(const command of [
  'вы видели бойфренда старшей дочери той ночью?',
  'вы помните соседа, который жил этажом ниже?',
  'мне нужен сосед, чтобы проверить его алиби',
  'хочу поговорить с вами о бойфренде старшей дочери'
]){
  const focus=command.includes('бойфренда старшей дочери')||command.includes('с вами о бойфренде')?'mother':'boyfriend';
  const result=await post({focus,last_target:focus,command});
  assert.equal(result.body.mode,'deterministic_active_interview',JSON.stringify(result.body));
  assert.ok(hasOp(result.body,'ask_witness',focus),JSON.stringify(result.body));
  assert.ok(!hasOp(result.body,'start_interview'));
}
const auth=await post({command:'мне нужен тот сосед, который жил этажом ниже. хочу с ним поговорить'},{'x-ml-client-version':'invalid'});
assert.equal(auth.status,401);
const origin=await post({command:'мне нужен тот сосед, который жил этажом ниже. хочу с ним поговорить'},{origin:'https://example.invalid'});
assert.equal(origin.status,403);
const status=await post({action:'status'});
assert.equal(status.body.version,8);
console.log('PASS Moreno v8 live-source-compatible witness switch: 5 valid, 2 gated, 2 unknown guarded, 4 non-switch, auth/origin/status');
