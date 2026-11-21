#!/usr/bin/env node
// One isolated live diagnostic session for historical Moreno v0.5's v1 endpoint.
// No production source mutation, no real customer identifiers, and no persistence outside the rate-limit ledger.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const client=fs.readFileSync(new URL('../assets/real-case-moreno-ai-v5.js',import.meta.url),'utf8');
const anon=client.match(/const SUPABASE_ANON='([^']+)'/)?.[1];
assert.ok(anon,'historical v0.5 public key missing');
const url='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v1';
const headers={'content-type':'application/json',apikey:anon,authorization:'Bearer '+anon,origin:'https://mysterylogic.com'};
const id='ci-moreno-v05-'+Math.random().toString(36).slice(2,12);
const base={session_id:id,visitor_id:'visitor-'+id,completed:[],focus:'',last_target:''};
async function post(x){
  const r=await fetch(url,{method:'POST',headers,body:JSON.stringify({...base,...x}),signal:AbortSignal.timeout(25000)});
  const data=await r.json().catch(()=>({}));
  console.log('LIVE V1',x.action,'HTTP',r.status,'mode',String(data.mode||''),'error',String(data.error||''),'intent',String(data.intent||''),'topic',String(data.topic||''));
  if(!r.ok)throw new Error('v1 '+x.action+' failed: '+r.status+' / '+String(data.error||'HTTP error'));
  return data;
}
const st=await post({action:'status'});
assert.equal(st.ai_ready,true,'V1 AI API key not configured');
assert.equal(st.budget_ready,true,'V1 budget ledger not configured');
const command=await post({action:'interpret',command:'Осмотреть место происшествия'});
assert.ok(['inspect_scene','clarify'].includes(command.intent), 'V1 did not interpret scene action safely: '+String(command.intent));
const witness=await post({action:'interrogate',target:'boyfriend',completed:['people'],question:'Где вы были ночью, когда произошёл выстрел?'});
assert.ok(typeof witness.reply==='string'&&witness.reply.length>20,'V1 witness did not provide a source-grounded answer');
assert.ok(['ai_classified','source_limit'].includes(witness.mode), 'V1 witness returned unexpected mode: '+String(witness.mode));
console.log('PASS historical Moreno v0.5 v1 real backend smoke: AI configured, intent, witness reply');
