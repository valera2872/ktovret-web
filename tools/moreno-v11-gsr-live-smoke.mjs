#!/usr/bin/env node
import assert from 'node:assert/strict';
const url='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v11';
const headers={'content-type':'application/json','x-ml-client-version':'moreno-public-v23','origin':'https://mysterylogic.com'};
const marker='qa-gsr-'+Date.now().toString(36);
async function plan(command){
 const r=await fetch(url,{method:'POST',headers,body:JSON.stringify({action:'plan',command,focus:'boyfriend',last_target:'boyfriend',completed:['people','witnessLocated','interview'],session_id:marker,visitor_id:'v-'+marker}),signal:AbortSignal.timeout(22000)});
 const d=await r.json().catch(()=>({}));
 assert.ok(r.ok,'Live v11 error '+r.status);
 return d;
}
const direct='нужны экспертиза с рук бойфренда, стрелял ли он, может есть следы пороха?';
const gsr=await plan(direct);
console.log('LIVE GSR',gsr.mode,JSON.stringify((gsr.operations||[]).map(x=>x.op)));
assert.equal(gsr.mode,'player_requested_source_limited_forensic',JSON.stringify(gsr));
assert.ok(gsr.operations?.some(x=>x.op==='unsupported_forensic'&&x.note===direct));
const witness=await plan('Вы стреляли? На ваших руках были следы пороха?');
console.log('LIVE WITNESS',witness.mode,JSON.stringify((witness.operations||[]).map(x=>x.op)));
assert.ok(witness.operations?.some(x=>x.op==='ask_witness'&&x.target==='boyfriend'));
const ball=await plan('Проведите баллистическую экспертизу извлеченной пули');
console.log('LIVE BALLISTICS',ball.mode,JSON.stringify((ball.operations||[]).map(x=>x.op)));
assert.ok(ball.operations?.some(x=>x.op==='forensic_ballistics'));
console.log('PASS Moreno v11 live gunshot-residue clarification vs valid ballistics and witness question');
