#!/usr/bin/env node
const url='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v8';
const headers={'content-type':'application/json','x-ml-client-version':'moreno-public-v23','origin':'https://mysterylogic.com'};
const nonce=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
async function post(body){const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`v8 ${r.status}: ${JSON.stringify(data)}`);return data}
function op(plan,name,target){return (plan.operations||[]).some(x=>x.op===name&&(!target||x.target===target))}
const sid=`ci-v22-${nonce}`,vid=`v-ci-v22-${nonce}`;
const base={session_id:sid,visitor_id:vid,completed:['people','ballistics','motive'],recent_history:'',memory:{entries:[]}};

const status=await post({action:'status'});
if(status.version!==8||status.interrogation_mode!=='active-witness-first'||status.active_interview_default!=='ask-current-character'||status.neighboring_floor_aliases!==true||status.explicit_expert_calls!==true)throw new Error(`bad v8 status ${JSON.stringify(status)}`);

const weaponInspection=await post({...base,focus:'boyfriend',last_target:'boyfriend',action:'plan',command:'вы можете предъявить оружие к досмотру и экспертизе?'});
if(!op(weaponInspection,'ask_witness','boyfriend'))throw new Error(`weapon inspection request escaped active boyfriend interview: ${JSON.stringify(weaponInspection)}`);
if(op(weaponInspection,'clarify'))throw new Error(`weapon inspection request became clarification: ${JSON.stringify(weaponInspection)}`);

const motherConflict=await post({...base,focus:'mother',last_target:'mother',action:'plan',command:'у них были конфликты?'});
if(!op(motherConflict,'ask_witness','mother'))throw new Error(`mother conflict question escaped active interview: ${JSON.stringify(motherConflict)}`);
if(op(motherConflict,'check_relationships'))throw new Error(`mother conflict question incorrectly became global relationship check: ${JSON.stringify(motherConflict)}`);

const ballistics=await post({...base,focus:'mother',last_target:'mother',action:'plan',command:'проверь баллистику'});
if(op(ballistics,'ask_witness','mother'))throw new Error(`explicit global ballistics order was stolen by active interview: ${JSON.stringify(ballistics)}`);

const expertCall=await post({...base,focus:'second_floor_witness',last_target:'second_floor_witness',action:'plan',command:'вызываю экспертов'});
if(op(expertCall,'ask_witness','second_floor_witness'))throw new Error(`expert call was swallowed by active witness interview: ${JSON.stringify(expertCall)}`);

const switchPlan=await post({...base,focus:'mother',last_target:'mother',action:'plan',command:'вызови на допрос бойфренда старшей дочери'});
if(!op(switchPlan,'start_interview','boyfriend'))throw new Error(`explicit witness switch failed: ${JSON.stringify(switchPlan)}`);

const neighboringFloor=await post({...base,completed:['people','ballistics','motive','witnessLocated'],focus:'boyfriend',last_target:'boyfriend',action:'plan',command:'вызываю свидетеля с соседнего этажа'});
if(op(neighboringFloor,'ask_witness','boyfriend'))throw new Error(`neighboring-floor switch was swallowed by active boyfriend interview: ${JSON.stringify(neighboringFloor)}`);
if(!op(neighboringFloor,'start_interview','second_floor_witness'))throw new Error(`neighboring-floor witness was not activated: ${JSON.stringify(neighboringFloor)}`);

const neighboringFloorCold=await post({...base,completed:['people','ballistics','motive'],focus:'boyfriend',last_target:'boyfriend',action:'plan',command:'вызвать свидетеля с соседнего этажа'});
if(!op(neighboringFloorCold,'locate_witnesses')||!op(neighboringFloorCold,'start_interview','second_floor_witness'))throw new Error(`neighboring-floor witness prerequisite routing failed: ${JSON.stringify(neighboringFloorCold)}`);

const present=await post({...base,focus:'boyfriend',last_target:'boyfriend',action:'plan',command:'предъяви ему результаты баллистики'});
if(op(present,'ask_witness','boyfriend'))throw new Error(`evidence presentation was swallowed as an ordinary witness question: ${JSON.stringify(present)}`);

console.log('Moreno v0.22 active-interview routing smoke passed');
console.log(JSON.stringify({weaponInspection:weaponInspection.operations,motherConflict:motherConflict.operations,ballistics:ballistics.operations,expertCall:expertCall.operations,switchPlan:switchPlan.operations,neighboringFloor:neighboringFloor.operations,neighboringFloorCold:neighboringFloorCold.operations,present:present.operations},null,2));
