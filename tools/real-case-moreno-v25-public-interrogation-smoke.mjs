#!/usr/bin/env node
const url='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v11';
const headers={'content-type':'application/json','x-ml-client-version':'moreno-public-v23','origin':'https://rawcdn.githack.com'};
const nonce=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const session=`front-${nonce}`,visitor=`v-front-${nonce}`;
async function post(body){const r=await fetch(url,{method:'POST',headers,body:JSON.stringify({session_id:session,visitor_id:visitor,recent_history:'',memory:{entries:[]},...body})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`public front door ${r.status}: ${JSON.stringify(data)}`);return data}
function op(plan,name,target){return (plan.operations||[]).some(x=>x.op===name&&(!target||x.target===target))}
const plan=await post({action:'plan',command:'что вы слышали в ту ночь?',completed:['people'],focus:'boyfriend',last_target:'boyfriend'});
if(!op(plan,'ask_witness','boyfriend'))throw new Error(`active interview did not stay with boyfriend: ${JSON.stringify(plan)}`);
const answer=await post({action:'interrogate',target:'boyfriend',question:'что вы слышали в ту ночь?',completed:['people'],focus:'boyfriend',last_target:'boyfriend'});
if(answer.mode!=='ai_character'||answer.character!=='boyfriend'||!String(answer.reply||'').trim())throw new Error(`public interrogation failed: ${JSON.stringify(answer)}`);
console.log('Moreno v0.25 public interrogation smoke passed');
console.log(JSON.stringify({plan:plan.operations,reply:answer.reply,mode:answer.mode,character:answer.character},null,2));
