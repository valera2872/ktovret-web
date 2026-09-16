import crypto from 'node:crypto';
const DUEL='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/duel-room';
const S='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/partner-session-v2';
const AI='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/partner-interrogate-v2';
const CASE_ID='MLP001_NE_PUBLIKOVAT',CASE_TITLE='Не публиковать — Full v2 smoke',CASE_PATH='/ru/cases/ne-publikovat/';
const A=crypto.randomBytes(24).toString('hex'),B=crypto.randomBytes(24).toString('hex');let code='';
async function post(url,body){const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json','origin':'https://mysterylogic.com'},body:JSON.stringify(body)});const text=await r.text();let d={};try{d=JSON.parse(text)}catch{d={raw:text}}if(!r.ok)throw new Error(`${r.status}:${JSON.stringify(d)}`);return d}
const duel=(key,action,extra={})=>post(DUEL,{action,browserKey:key,code:code||undefined,...extra});
const s=(key,action,extra={})=>post(S,{code,browserKey:key,action,...extra});
const ids=v=>(v.evidence||[]).map(x=>x.id).sort();const has=(v,id)=>ids(v).includes(id);const ch=(v,id)=>(v.characters||[]).find(x=>x.id===id);function ok(x,m){if(!x)throw new Error(`ASSERT:${m}`)}
async function openPub(key,id,fid=`F${id.slice(1)}`){await s(key,'OPEN_EVIDENCE',{evidence_id:id});return s(key,'PUBLISH_FINDING',{evidence_id:id,finding_id:fid})}
async function ded(key,id,selected){return s(key,'ATTEMPT_DEDUCTION',{deduction_id:id,selected})}
async function present(key,eid,cid){await s(key,'OPEN_EVIDENCE',{evidence_id:eid}).catch(()=>{});return s(key,'PRESENT_EVIDENCE',{evidence_id:eid,character_id:cid})}
const created=await duel(A,'create',{caseId:CASE_ID,caseTitle:CASE_TITLE,casePath:CASE_PATH,playerName:'Full Smoke Archive'});code=created.room.code;await duel(B,'join',{playerName:'Full Smoke Sources'});console.log(`SMOKE_ROOM=${code}`);
let a=await s(A,'START'),b=await s(B,'START');
ok(a.role==='archive'&&b.role==='sources','roles');ok(ids(a).join(',')==='E01,E03,E04','archive initial scope');ok(ids(b).join(',')==='E02,E05','sources initial scope');ok(!JSON.stringify(a).includes('Интервью Елены Мирской'),'no source raw leak to archive');ok(!JSON.stringify(b).includes('Журнал печати'),'no archive raw leak to sources');

await openPub(A,'E04');await openPub(B,'E05');await ded(A,'D_FINANCE_CONTRADICTION','finance_conflict');a=await s(A,'SNAPSHOT');ok(has(a,'E06'),'E06 unlocked');
await openPub(A,'E06');b=await s(B,'SNAPSHOT');ok(['E07','E08','E09'].every(x=>has(b,x)),'source audios unlocked');for(const id of ['E07','E08','E09'])await openPub(B,id);await ded(B,'D_AUDIO_FABRICATION','montage');a=await s(A,'SNAPSHOT');b=await s(B,'SNAPSHOT');ok(has(a,'E10')&&ch(b,'roman')?.available,'Roman stage');
await present(A,'E10','roman');await present(B,'E07','roman');b=await s(B,'SNAPSHOT');ok(ch(b,'roman')?.challenges?.some(x=>x.id==='ROMAN_AUDIO_DENIAL'),'Roman audio challenge');
const romanBefore=await post(AI,{code,browserKey:B,character_id:'roman',question:'Вы сами собирали финальный файл?',recent_history:[]});ok(romanBefore.reply?.length>5,'Roman AI early reply');
await s(B,'CHALLENGE_CHARACTER',{character_id:'roman',challenge_id:'ROMAN_AUDIO_DENIAL'});a=await s(A,'SNAPSHOT');ok(has(a,'E11'),'E11 unlocked');await openPub(A,'E11');await ded(A,'D_ROMAN_MURDER','not_present');a=await s(A,'SNAPSHOT');b=await s(B,'SNAPSHOT');ok(has(a,'E14')&&has(b,'E13')&&ch(a,'pavel')?.available,'Pavel stage');

await openPub(B,'E13');await openPub(A,'E14');await ded(B,'D_PAVEL_FAKE','fake');a=await s(A,'SNAPSHOT');b=await s(B,'SNAPSHOT');ok(has(a,'E16')&&has(b,'E17')&&ch(a,'artyom')?.available,'dual docs stage');
await openPub(A,'E16');await openPub(B,'E17');await ded(A,'D_DUAL_DOCUMENTS','two_versions');a=await s(A,'SNAPSHOT');b=await s(B,'SNAPSHOT');ok(has(a,'E18')&&has(b,'E19'),'canary evidence');await openPub(A,'E18');await openPub(B,'E19');await ded(B,'D_CANARY','canary');a=await s(A,'SNAPSHOT');ok(has(a,'E20'),'E20 call log unlocked');
await openPub(A,'E20');await present(B,'E17','roman');await present(A,'E20','roman');b=await s(B,'SNAPSHOT');ok(ch(b,'roman')?.challenges?.some(x=>x.id==='ROMAN_LEAK_DENIAL'),'Roman leak challenge shared');await s(A,'CHALLENGE_CHARACTER',{character_id:'roman',challenge_id:'ROMAN_LEAK_DENIAL'});await ded(B,'D_LEAK','roman_elena');b=await s(B,'SNAPSHOT');ok(has(b,'E21'),'Vera buffer unlocked');

await openPub(B,'E21');await ded(B,'D_VERA_ALIVE','alive');a=await s(A,'SNAPSHOT');b=await s(B,'SNAPSHOT');ok(has(a,'E22')&&has(a,'E23')&&has(a,'E24')&&ch(b,'elena')?.available,'Vera alive transition');ok((a.milestones||[]).every(x=>x==='VERA_ALIVE'),'internal milestones hidden');
const elenaEarly=await post(AI,{code,browserKey:B,character_id:'elena',question:'Вы знаете, где сейчас Вера?',recent_history:[]});ok(elenaEarly.reply?.length>5,'Elena AI early reply');
await openPub(A,'E22');await openPub(A,'E24');await ded(A,'D_LOCATION','printing');a=await s(A,'SNAPSHOT');ok(has(a,'E25')&&a.location.status==='ready','E25/location ready');await openPub(A,'E25');await s(A,'SUBMIT_LOCATION',{evidence_ids:['E21','E22','E24','E25']});a=await s(A,'SNAPSHOT');b=await s(B,'SNAPSHOT');ok(a.rescue.status==='dispatched'&&has(b,'E26')&&has(b,'E27')&&has(a,'E28'),'rescue dispatched/new evidence');

await openPub(A,'E23');await openPub(B,'E26');await openPub(B,'E27');await openPub(A,'E28');
await present(A,'E25','elena');await present(B,'E26','elena');await present(B,'E27','elena');await present(A,'E28','elena');
a=await s(A,'SNAPSHOT');ok(ch(a,'elena')?.challenges?.some(x=>x.id==='ELENA_PREPARATION'),'Elena preparation challenge');
const elenaPreparation=await post(AI,{code,browserKey:A,character_id:'elena',question:'Почему вы ещё до ORION открывали карточку старой типографии?',recent_history:[]});ok(elenaPreparation.reply?.length>5,'Elena preparation AI reply');
await s(A,'CHALLENGE_CHARACTER',{character_id:'elena',challenge_id:'ELENA_PREPARATION'});await ded(A,'D_PREPARATION','prepared_restraint');a=await s(A,'SNAPSHOT');b=await s(B,'SNAPSHOT');ok(has(a,'E29')&&has(b,'E30')&&has(b,'E31')&&has(a,'E32'),'old-case final evidence');ok(ch(b,'elena')?.statementVersion>=5,'Elena staged disclosure after preparation conflict');

await openPub(A,'E29');await openPub(B,'E30');await openPub(B,'E31');await openPub(A,'E32');
await present(A,'E29','elena');await present(B,'E30','elena');await present(B,'E31','elena');await present(A,'E32','elena');
b=await s(B,'SNAPSHOT');ok(ch(b,'elena')?.challenges?.some(x=>x.id==='ELENA_PAST'),'Elena past challenge required');ok(b.deductions?.D_NINA_ELENA?.available===false,'final old-case deduction locked before confrontation');
const elenaPast=await post(AI,{code,browserKey:B,character_id:'elena',question:'Вы были рядом с Ниной после падения и не вызвали помощь?',recent_history:[]});ok(elenaPast.reply?.length>5,'Elena pre-confession AI reply');
await s(B,'CHALLENGE_CHARACTER',{character_id:'elena',challenge_id:'ELENA_PAST'});a=await s(A,'SNAPSHOT');ok(ch(a,'elena')?.statementVersion>=7&&ch(a,'elena')?.disclosureLevel>=7,'Elena final disclosure after confrontation');ok(a.deductions?.D_NINA_ELENA?.available===true,'old-case deduction unlocks after confrontation');
await ded(B,'D_NINA_ELENA','present_failed_aid');a=await s(A,'SNAPSHOT');b=await s(B,'SNAPSHOT');ok(has(a,'E33')&&a.rescue.status==='confirmed'&&a.reconstruction.available,'Vera found/reconstruction unlocked');await openPub(A,'E33');

const wrong={nina:'suicide',audio:'authentic',pavel:'authentic_letter',canary:'artyom_terminal',vera:'artyom_abduction',motive:'personal_profit'};a=await s(A,'ATTEMPT_RECONSTRUCTION',{answers:wrong});ok(a.reconstruction.status==='conflict'&&a.reconstruction.conflicts.length>=4,'reconstruction conflict feedback');
const correct={nina:'elena_conflict_fall_fail_aid',audio:'roman_montage',pavel:'fake_letter',canary:'roman_orion',vera:'elena_abduction_printing',motive:'protect_fund'};a=await s(A,'ATTEMPT_RECONSTRUCTION',{answers:correct});ok(a.reconstruction.status==='complete'&&a.publication.available,'reconstruction complete');a=await s(A,'CHOOSE_PUBLICATION',{choice:'protect_recipients'});b=await s(B,'SNAPSHOT');ok(a.completed&&b.completed,'case closes for both');ok(!has(b,'E33'),'final archive raw remains private');ok(a.board.length===b.board.length,'shared board');
console.log('FULL V2 SECURE LIVE SMOKE OK');console.log(JSON.stringify({room:code,revision:a.revision,archiveEvidence:ids(a).length,sourcesEvidence:ids(b).length,board:a.board.length,roman:ch(a,'roman'),elena:ch(a,'elena'),rescue:a.rescue,reconstruction:a.reconstruction.status,publication:a.publication.selected,completed:a.completed,romanAI:romanBefore.reply.slice(0,120),elenaEarlyAI:elenaEarly.reply.slice(0,120),elenaPreparationAI:elenaPreparation.reply.slice(0,120),elenaPastAI:elenaPast.reply.slice(0,120)},null,2));
