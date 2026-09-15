#!/usr/bin/env node
const url='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v10';
const headers={'content-type':'application/json','x-ml-client-version':'moreno-public-v23','origin':'https://mysterylogic.com'};
const nonce=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
let seq=0;
async function post(body){seq++;const identity={session_id:`sem-${nonce}-${seq}`,visitor_id:`v-sem-${nonce}`};const r=await fetch(url,{method:'POST',headers,body:JSON.stringify({...identity,...body})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`semantic front door ${r.status}: ${JSON.stringify(data)}`);return data}
function op(plan,name,target){return (plan.operations||[]).some(x=>x.op===name&&(!target||x.target===target))}
const known=['people','witnessLocated'];
const base={completed:known,focus:'boyfriend',last_target:'boyfriend',recent_history:'',memory:{entries:[]},action:'plan'};

const status=await post({action:'status'});
if(status.version!==9||status.semantic_entity_parser!==true||status.bounded_character_registry!==true||status.solution_inference_forbidden!==true)throw new Error(`bad v9 status ${JSON.stringify(status)}`);

const neighbor=await post({...base,command:'мне нужен тот сосед, который жил этажом ниже. хочу с ним поговорить'});
if(neighbor.mode!=='semantic_entity_routing'||!op(neighbor,'start_interview','second_floor_witness'))throw new Error(`semantic neighbor paraphrase failed: ${JSON.stringify(neighbor)}`);

const boyfriend=await post({...base,focus:'mother',last_target:'mother',command:'дайте мне поговорить с парнем старшей дочери'});
if(boyfriend.mode!=='semantic_entity_routing'||!op(boyfriend,'start_interview','boyfriend'))throw new Error(`semantic boyfriend paraphrase failed: ${JSON.stringify(boyfriend)}`);

const mother=await post({...base,command:'можно пригласить приемную мать Patricia для разговора'});
if(mother.mode!=='semantic_entity_routing'||!op(mother,'start_interview','mother'))throw new Error(`semantic mother paraphrase failed: ${JSON.stringify(mother)}`);

const older=await post({...base,command:'старшую дочь приемной матери пригласите, хочу задать пару вопросов'});
if(older.mode!=='semantic_entity_routing'||!op(older,'start_interview','older_daughter'))throw new Error(`semantic older daughter paraphrase failed: ${JSON.stringify(older)}`);

const younger=await post({...base,command:'младшую дочь можно сюда для разговора?'});
if(younger.mode!=='semantic_entity_routing'||!op(younger,'start_interview','younger_daughter'))throw new Error(`semantic younger daughter paraphrase failed: ${JSON.stringify(younger)}`);

const unknownMan=await post({...base,command:'вызовите мужчину, который стоял над Patricia'});
if(op(unknownMan,'start_interview','boyfriend'))throw new Error(`solution inference leaked unknown man -> boyfriend: ${JSON.stringify(unknownMan)}`);
if(!op(unknownMan,'clarify'))throw new Error(`unknown man should require player clarification: ${JSON.stringify(unknownMan)}`);

const killer=await post({...base,command:'позовите убийцу на допрос'});
if((killer.operations||[]).some(x=>x.op==='start_interview'))throw new Error(`solution inference leaked killer -> known person: ${JSON.stringify(killer)}`);
if(!op(killer,'clarify'))throw new Error(`unknown killer should require player clarification: ${JSON.stringify(killer)}`);

const questionAboutBoyfriend=await post({...base,focus:'mother',last_target:'mother',command:'вы видели бойфренда старшей дочери той ночью?'});
if(!op(questionAboutBoyfriend,'ask_witness','mother'))throw new Error(`question about boyfriend incorrectly switched away from mother: ${JSON.stringify(questionAboutBoyfriend)}`);
if(op(questionAboutBoyfriend,'start_interview','boyfriend'))throw new Error(`question about boyfriend became witness switch: ${JSON.stringify(questionAboutBoyfriend)}`);

const ballistics=await post({...base,command:'пригласите специалиста по оружию и пуле'});
if(ballistics.mode!=='semantic_expert_routing'||!op(ballistics,'forensic_ballistics'))throw new Error(`semantic ballistics expert failed: ${JSON.stringify(ballistics)}`);

const medical=await post({...base,command:'мне нужен судмедэксперт, пусть изучит материалы вскрытия'});
if(medical.mode!=='semantic_expert_routing'||!op(medical,'autopsy'))throw new Error(`semantic medical expert failed: ${JSON.stringify(medical)}`);

const genericExpert=await post({...base,command:'позовите какого-нибудь эксперта'});
if(genericExpert.mode!=='semantic_expert_clarification'||!op(genericExpert,'clarify'))throw new Error(`generic expert should ask player for task: ${JSON.stringify(genericExpert)}`);

console.log('Moreno v0.23 semantic entity routing smoke passed');
console.log(JSON.stringify({neighbor:neighbor.operations,boyfriend:boyfriend.operations,mother:mother.operations,older:older.operations,younger:younger.operations,unknownMan:unknownMan.operations,killer:killer.operations,questionAboutBoyfriend:questionAboutBoyfriend.operations,ballistics:ballistics.operations,medical:medical.operations,genericExpert:genericExpert.operations},null,2));
