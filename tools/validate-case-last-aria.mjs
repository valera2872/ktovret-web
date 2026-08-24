#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'..');
const read=(file)=>fs.readFileSync(path.join(repo,file),'utf8');
const expect=(condition,message)=>{if(!condition)throw new Error(`Last Aria validation failed: ${message}`);};
const context={window:{}};
vm.runInNewContext(read('assets/case-aria-data.js'),context,{filename:'case-aria-data.js'});
vm.runInNewContext(read('assets/case-aria-fairplay-v2.js'),context,{filename:'case-aria-fairplay-v2.js'});
vm.runInNewContext(read('assets/case-aria-investigator-v16.js'),context,{filename:'case-aria-investigator-v16.js'});
const data=context.window.MLCaseAria;
const investigator=context.window.MLAriaInvestigatorV16;
expect(data?.id==='special:last-aria','case id mismatch');
expect(data.title==='Последняя ария','title mismatch');
expect(data.logicVersion===1,'logic version mismatch');
expect(data.proofRevision==='1.6'&&data.coopRevision==='1.6','investigator fair-play revision missing');
expect(investigator?.revision==='1.6','investigator v1.6 proof layer missing');
expect(data.stages?.length===3,'expected three stages');
const materialCount=data.stages.reduce((sum,stage)=>sum+(stage.creator?.length||0)+(stage.guest?.length||0),0);
expect(materialCount===18,`expected 18 materials, got ${materialCount}`);
for(const stage of data.stages) expect(stage.creator?.length===3&&stage.guest?.length===3,`stage ${stage.id} must split 3+3`);

const roleText=(role,stageId)=>JSON.stringify(data.stages[stageId-1]?.[role]||[]).toUpperCase();
for(const role of ['creator','guest']) for(const stageId of [1,2,3]){
  const handoff=data.handoffs?.[role]?.[stageId];
  expect(handoff?.expected,`${role} stage ${stageId} handoff missing`);
  expect(!roleText(role,stageId).includes(String(handoff.expected).toUpperCase()),`${role} stage ${stageId} can read own handoff token ${handoff.expected}`);
  expect(roleText(role==='creator'?'guest':'creator',stageId).includes(String(handoff.expected).toUpperCase()),`${role} stage ${stageId} token ${handoff.expected} absent on partner screen`);
}

const all=JSON.stringify(data),stage1=JSON.stringify(data.stages[0]),stage2=JSON.stringify(data.stages[1]),stage3=JSON.stringify(data.stages[2]);

// Physical chronology: blackout, door, retrieval, return.
for(const t of ['21:49:12.000','21:49:31.604','21:49:43.117','21:50:04.188']) expect(stage1.includes(t),`critical timestamp missing ${t}`);
expect(stage1.includes('14–17 секунд')&&stage1.includes('не менее 58 секунд'),'route bounds missing');
expect(stage1.includes('14,2')&&stage1.includes('15,6')&&stage1.includes('16,8'),'control walk measurements missing');
expect(stage1.includes('с учебным ключом профиля K-12')&&stage1.includes('дверного контакта уже открытой двери'),'route timing must include unlocking');
expect(stage1.includes('1,7 м')&&stage1.includes('5,2–6,1 секунды')&&stage1.includes('11,513 секунды'),'archive retrieval reconstruction missing');
const blackoutStart=21*3600+49*60+12,archiveOpen=21*3600+49*60+31.604,archiveClose=21*3600+49*60+43.117,workingLight=21*3600+50*60+4.188;
const outbound=archiveOpen-blackoutStart,archiveDwell=archiveClose-archiveOpen,returnWindow=workingLight-archiveClose,blackoutWindow=workingLight-blackoutStart;
const routeMin=14,routeMax=17,departureDelayMin=outbound-routeMax,departureDelayMax=outbound-routeMin,fullSlack=blackoutWindow-(routeMax+archiveDwell+routeMax);
expect(departureDelayMin>=2&&departureDelayMax<=6,`implausible reaction delay ${departureDelayMin.toFixed(3)}–${departureDelayMax.toFixed(3)}s`);
expect(returnWindow-routeMax>=4,`return route lacks slack ${(returnWindow-routeMax).toFixed(3)}s`);
expect(fullSlack>=6,`round trip remains edge-timed ${fullSlack.toFixed(3)}s`);
expect(investigator?.routeSeconds?.includesUnlock===true,'investigator marker does not declare unlock-inclusive route');
expect(investigator?.archiveRetrievalSeconds?.doorOpen===11.513,'archive dwell marker missing');

// Realistic show-stop / emergency-light behavior and no briefing spoiler.
expect(stage1.includes('SAFE-L')&&stage1.includes('SAFE-R'),'SAFE physical hold missing');
expect(stage1.toLowerCase().includes('аварийные кромочные огни')&&stage1.includes('running lights'),'emergency-light realism missing');
expect(stage1.includes('39–43 секунды')&&stage1.includes('Михаил Карев'),'pre-known SAFE window missing');
expect(!data.brief.mission.includes('не доказывает')&&!data.brief.mission.toLowerCase().includes('ложн'),'brief spoils central audio inference');
expect(!data.stages[0].objective.includes('Не считайте голос'),'stage 1 objective spoils central inference');

// Audio: recording, physical arm, cue trigger, exact offsets. No hidden live operator needed.
expect(stage2.includes('PB-2')&&stage2.includes('TAKE-6')&&stage2.includes('MIC-C'),'recorded-alibi proof incomplete');
expect(stage2.includes('состояние ARMED')&&stage2.includes('21:48:54'),'TAKE-6 pre-blackout ARMED state missing');
expect(stage2.includes('Макрос привязан к следующему событию Q-17B'),'Q-17B trigger relationship missing');
for(const offset of ['+10,0','+16,0','+23,0']) expect(stage2.includes(offset),`playback offset missing ${offset}`);
expect(stage2.includes('Q-17B стартует в 21:49:12.000'),'cue start missing from audio chain');
for(const t of ['21:49:22','21:49:28','21:49:35']) expect(stage2.includes(t),`observed phrase time missing ${t}`);
expect(stage2.includes('присутствие человека у панели уже не требуется'),'audio automation still implies live operator');
expect(stage3.includes('21:48:54')&&stage3.includes('C-2')&&stage3.includes('LOCAL-ARM'),'physical playback arm source missing');
expect(stage3.includes('нет сетевого удалённого входа')&&stage3.includes('таймерного планировщика'),'C-2 remote/timer exclusion missing');
expect(stage3.includes('Q-17B запускает заранее сохранённые offsets'),'post-arm cue execution missing');
expect(stage3.includes('21:48:53')&&stage3.includes('cue-панел'),'camera-to-C-2 person link missing');
expect(data.handoffs.creator[3].expected==='C-2'&&data.handoffs.creator[3].result.includes('Q-17B сам запускает offsets'),'cross-role audio person/automation link missing');
expect(investigator?.playbackCueTrigger==='Q-17B','investigator playback trigger marker wrong');

// Individual identity and access must not collapse device/object into person.
expect(stage2.includes('HEEL-43C')&&stage2.includes('CRESCENT-43'),'shoe cross-check incomplete');
expect(stage2.includes('треугольный скол')&&stage2.includes('поперечный надрез')&&stage2.includes('свежая матовая чёрная краска'),'individual footwear defects missing');
expect(stage2.includes('21:49:09')&&stage2.includes('21:50:05.6'),'shoe continuity around blackout missing');
expect(stage2.includes('K-12')&&stage2.includes('15:06'),'duplicate-key origin missing');
expect(stage3.includes('безымянный латунный дубликат архивного ключа'),'physical key seizure missing');

// Sabotage chain: legitimate access alone is neutral; later evidence creates personal link.
expect(stage3.includes('синхронизация механического щелчка PR-17')&&stage3.includes('A-17'),'legitimate prop-access rationale missing');
expect(stage3.includes('B-3')&&stage3.includes('BR-06')&&stage3.includes('P-771')&&stage3.includes('18:47'),'sealed sabotage chain incomplete');

// Original score path and isolated containment.
expect(stage3.includes('31 × 24 × 0,8 см')&&stage3.includes('38 × 29 × 6,4 см')&&stage3.includes('помещается в него без сгиба'),'folder/case geometry missing');
expect(stage3.includes('21:50:07')&&stage3.includes('кремовую папку')&&stage3.includes('21:51:24')&&stage3.includes('21:53'),'post-archive folder/case chain incomplete');
expect(stage3.includes('RFI-1')&&stage3.includes('экранированный RFID-инспекционный шкаф'),'isolated RFID proof missing');
expect(stage3.includes('пустой')&&stage3.includes('Других предметов в камере'),'RFI-1 control scans missing');
expect(stage3.includes('MS-1908')&&stage3.includes('T-6M'),'possession identifiers missing');
expect(stage3.includes('42 000 EUR')&&stage3.includes('M.KAREV'),'pre-event motive corroboration missing');
expect(stage3.includes('SAFE-L')&&stage3.includes('фойе')&&stage3.includes('LX-4'),'alternative suspect positions missing');

// Final answer must require independent evidentiary classes, not merely correct guessing.
const required=['sabotage','culprit-sabotage','alibi','identity','access','possession'];
expect(JSON.stringify(data.final.requiredGroups)===JSON.stringify(required),'six-link final gate changed');
const groups=new Set(data.final.evidence.map((item)=>item.group));for(const group of required)expect(groups.has(group),`proof group absent ${group}`);
expect(data.final.evidence.find((item)=>item.id==='checkout')?.group==='culprit-sabotage','sabotage actor not separately required');
expect(data.final.evidence.find((item)=>item.id==='playback')?.label.includes('cue-trigger Q-17B'),'final audio label lacks cue trigger');
expect(data.final.evidence.find((item)=>item.id==='key')?.label.includes('изъят при нём'),'final key proof lacks physical custody');
expect(data.final.evidence.find((item)=>item.id==='tag')?.label.includes('RFI-1'),'final possession proof relies on tag proximity');
for(const q of data.final.questions)expect(q.answer&&q.options.some(([id])=>id===q.answer),`invalid final answer ${q.id}`);
expect(data.final.questions.find((q)=>q.id==='culprit')?.answer==='mikhail','canonical culprit changed');
expect(data.final.questions.find((q)=>q.id==='anton')?.answer==='victim','victim role changed');

// No critical reveal-only fact or identity shortcut.
const preFinal=[stage1,stage2,stage3].join(' ');for(const marker of ['BR-06','Q-17B','SAFE-L','SAFE-R','TAKE-6','PB-2','MIC-C','K-12','HEEL-43C','MS-1908','T-6M','A. Stein','C-2','RFI-1'])expect(preFinal.includes(marker),`reveal marker absent pre-final ${marker}`);
expect(stage2.includes('Сам по себе размер 43 человека не идентифицирует'),'shoe identity caveat missing');
expect(stage3.includes('Сам журнал фиксирует устройство, а не лицо оператора'),'device/person caveat missing');
expect(!JSON.stringify(data.stages).includes('ключ доказывает, что Михаил'),'key-owner identity shortcut leaked');
expect(all.includes('партитур')&&all.includes('интерком')&&all.includes('реквизит'),'theatrical evidence mix missing');
const postprocess=read('tools/import-mobile/two-player-last-aria-postprocess.mjs');
expect(postprocess.includes('case-aria-investigator-v16.js')&&!postprocess.includes('case-aria-investigator-v15.js'),'generated route not v1.6-only');

console.log(JSON.stringify({id:data.id,proofRevision:data.proofRevision,coopRevision:data.coopRevision,materials:materialCount,handoffs:6,requiredProofGroups:required.length,outboundSeconds:Number(outbound.toFixed(3)),archiveDwellSeconds:Number(archiveDwell.toFixed(3)),conservativeRoundTripSlackSeconds:Number(fullSlack.toFixed(3)),routeIncludesUnlock:true,archiveRetrievalMeasured:true,playbackCueTriggered:true,playbackOffsetsSeconds:[10,16,23],folderFitsCase:true,isolatedRfidContainment:true,centralTwistSpoilerRemoved:true,verdict:'investigator v1.6: physical, temporal, audio-trigger, identity and custody chains validated without reveal-only jumps'},null,2));