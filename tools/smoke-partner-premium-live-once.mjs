const SESSION='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/partner-session-v1';
const AI='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/partner-interrogate-v1';
const code='HMG4CZ88';
const archiveKey='7f05224d7ec8e983a1a6999f6a1be863b2e90a950369ece7';
const sourcesKey='236c18796539903b1c9fac1d995f902551103f3e2c524a3e';

async function post(url,body){
  const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json','origin':'https://mysterylogic.com'},body:JSON.stringify(body)});
  const text=await r.text(); let data={}; try{data=JSON.parse(text)}catch{data={raw:text}}
  if(!r.ok)throw new Error(`${r.status}:${JSON.stringify(data)}`); return data;
}
const session=(key,action,extra={})=>post(SESSION,{code,browserKey:key,action,...extra});
const ids=(view)=>view.evidence.map(x=>x.id).sort();
function assert(ok,msg){if(!ok)throw new Error(`ASSERT:${msg}`)}

const a0=await session(archiveKey,'START');
const b0=await session(sourcesKey,'START');
assert(a0.role==='archive','creator must map to archive');
assert(b0.role==='sources','guest must map to sources');
assert(ids(a0).join(',')==='E01,E03,E04','archive initial evidence scope');
assert(ids(b0).join(',')==='E02,E05','sources initial evidence scope');
assert(!JSON.stringify(a0).includes('Интервью Елены Мирской'),'archive must not leak source raw evidence');
assert(!JSON.stringify(b0).includes('Журнал печати'),'sources must not leak archive raw evidence');

for(const [key,id,fid] of [[archiveKey,'E04','F04'],[sourcesKey,'E05','F05']]){
  await session(key,'OPEN_EVIDENCE',{evidence_id:id});
  await session(key,'PUBLISH_FINDING',{evidence_id:id,finding_id:fid});
}
await session(archiveKey,'ATTEMPT_DEDUCTION',{deduction_id:'D_FINANCE_CONTRADICTION',selected:'finance_conflict'});
let a=await session(archiveKey,'SNAPSHOT'); let b=await session(sourcesKey,'SNAPSHOT');
assert(ids(a).includes('E06'),'finance contradiction unlocks E06 for archive');
assert(!ids(b).includes('E06'),'E06 stays private to archive');

await session(archiveKey,'OPEN_EVIDENCE',{evidence_id:'E06'});
await session(archiveKey,'PUBLISH_FINDING',{evidence_id:'E06',finding_id:'F06'});
b=await session(sourcesKey,'SNAPSHOT');
assert(['E07','E08','E09'].every(id=>ids(b).includes(id)),'metadata finding unlocks source audios');
for(const id of ['E07','E08','E09']){
  await session(sourcesKey,'OPEN_EVIDENCE',{evidence_id:id});
  await session(sourcesKey,'PUBLISH_FINDING',{evidence_id:id,finding_id:`F${id.slice(1)}`});
}
await session(sourcesKey,'ATTEMPT_DEDUCTION',{deduction_id:'D_AUDIO_FABRICATION',selected:'montage'});
a=await session(archiveKey,'SNAPSHOT'); b=await session(sourcesKey,'SNAPSHOT');
assert(ids(a).includes('E10'),'audio proof unlocks Roman invoice for archive');
assert(a.roman.available&&b.roman.available,'Roman becomes available to both players');

await session(archiveKey,'OPEN_EVIDENCE',{evidence_id:'E10'});
await session(archiveKey,'PRESENT_EVIDENCE',{evidence_id:'E10',character_id:'roman'});
await session(sourcesKey,'PRESENT_EVIDENCE',{evidence_id:'E07',character_id:'roman'});
b=await session(sourcesKey,'SNAPSHOT');
assert(b.roman.statementVersion>=3&&b.roman.canChallenge,'partner evidence must advance shared Roman state');

const ai=await post(AI,{code,browserKey:sourcesKey,character_id:'roman',question:'Вы работали с записью Нины?',recent_history:[]});
assert(typeof ai.reply==='string'&&ai.reply.length>5,'Roman AI reply');

await session(sourcesKey,'CHALLENGE_ROMAN');
a=await session(archiveKey,'SNAPSHOT');
assert(ids(a).includes('E11'),'Roman contradiction unlocks alibi evidence for archive');
await session(archiveKey,'OPEN_EVIDENCE',{evidence_id:'E11'});
await session(archiveKey,'PUBLISH_FINDING',{evidence_id:'E11',finding_id:'F11'});
await session(archiveKey,'ATTEMPT_DEDUCTION',{deduction_id:'D_ROMAN_MURDER',selected:'not_present'});
a=await session(archiveKey,'SNAPSHOT'); b=await session(sourcesKey,'SNAPSHOT');
assert(a.sliceComplete&&b.sliceComplete,'vertical slice completes for both');
assert(!ids(b).includes('E10')&&!ids(b).includes('E11'),'archive-only evidence remains hidden from sources');
assert(a.board.some(x=>x.id==='P_AUDIO')&&b.board.some(x=>x.id==='P_AUDIO'),'shared board synchronized');

console.log('LIVE PARTNER SMOKE OK');
console.log(JSON.stringify({revision:a.revision,archiveEvidence:ids(a),sourcesEvidence:ids(b),roman:a.roman,sliceComplete:a.sliceComplete,aiReply:ai.reply.slice(0,160)},null,2));
