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
expect(data?.id==='special:last-aria','case id mismatch');
expect(data.title==='Последняя ария','title mismatch');
expect(data.logicVersion===1,'logic version mismatch');
expect(data.proofRevision==='1.6'&&data.coopRevision==='1.6','investigator fair-play revision missing');
expect(context.window.MLAriaInvestigatorV16?.revision==='1.6','investigator v1.6 proof layer missing');
expect(data.stages?.length===3,'expected three stages');
const materialCount=data.stages.reduce((sum,stage)=>sum+(stage.creator?.length||0)+(stage.guest?.length||0),0);
expect(materialCount===18,`expected 18 materials, got ${materialCount}`);
for(const stage of data.stages) expect(stage.creator?.length===3&&stage.guest?.length===3,`stage ${stage.id} must split 3+3`);

const roleText=(role,stageId)=>JSON.stringify(data.stages[stageId-1]?.[role]||[]).toUpperCase();
for(const role of ['creator','guest']){
  for(const stageId of [1,2,3]){
    const handoff=data.handoffs?.[role]?.[stageId];
    expect(handoff?.expected,`${role} stage ${stageId} handoff missing`);
    const own=roleText(role,stageId);
    expect(!own.includes(String(handoff.expected).toUpperCase()),`${role} stage ${stageId} can read own handoff token ${handoff.expected}`);
    const other=roleText(role==='creator'?'guest':'creator',stageId);
    expect(other.includes(String(handoff.expected).toUpperCase()),`${role} stage ${stageId} handoff token ${handoff.expected} not present on partner screen`);
  }
}

const all=JSON.stringify(data);
const stage1=JSON.stringify(data.stages[0]);
const stage2=JSON.stringify(data.stages[1]);
const stage3=JSON.stringify(data.stages[2]);
expect(stage1.includes('21:49:12.000')&&stage1.includes('21:49:31.604')&&stage1.includes('21:49:43.117')&&stage1.includes('21:50:04.188'),'critical blackout/archive timestamps missing');
expect(stage1.includes('14–17 секунд')&&stage1.includes('не менее 58 секунд'),'investigator route bounds missing');
expect(stage1.includes('14,2')&&stage1.includes('15,6')&&stage1.includes('16,8'),'control walk measurements missing');
expect(stage1.includes('с учебным ключом профиля K-12')&&stage1.includes('дверного контакта уже открытой двери'),'route timing does not include unlocking');
expect(stage1.includes('1,7 м')&&stage1.includes('5,2–6,1 секунды')&&stage1.includes('11,513 секунды'),'archive retrieval geometry/timing missing');
const blackoutStart=21*3600+49*60+12;
const archiveOpen=21*3600+49*60+31.604;
const archiveClose=21*3600+49*60+43.117;
const workingLight=21*3600+50*60+4.188;
const outbound=archiveOpen-blackoutStart;
const archiveDwell=archiveClose-archiveOpen;
const returnWindow=workingLight-archiveClose;
const blackoutWindow=workingLight-blackoutStart;
const routeMin=14,routeMax=17;
const departureDelayMin=outbound-routeMax;
const departureDelayMax=outbound-routeMin;
const fullSlowTrip=routeMax+archiveDwell+routeMax;
const fullSlack=blackoutWindow-fullSlowTrip;
expect(departureDelayMin>=2&&departureDelayMax<=6,`STAIR-18 requires implausible reaction delay: ${departureDelayMin.toFixed(3)}–${departureDelayMax.toFixed(3)}s`);
expect(returnWindow-routeMax>=4,`return STAIR-18 lacks usable slack: ${(returnWindow-routeMax).toFixed(3)}s`);
expect(fullSlack>=6,`full round trip is still edge-timed: ${fullSlack.toFixed(3)}s slack`);
expect(data.handoffs.creator[1].result.includes('открытой двери с K-12')&&data.handoffs.creator[1].result.includes('2,6–5,6 секунды'),'door-to-door reaction inference missing');

expect(stage1.includes('SAFE-L')&&stage1.includes('SAFE-R'),'stage-manager physical hold missing');
expect(stage1.toLowerCase().includes('аварийные кромочные огни')&&stage1.includes('running lights'),'medical/emergency lighting realism missing');
expect(stage1.includes('39–43 секунды')&&stage1.includes('Михаил Карев'),'culprit knowledge of SAFE duration not established');
expect(!data.brief.mission.includes('не доказывает')&&!data.brief.mission.toLowerCase().includes('ложн'),'brief spoils central audio inference');
expect(!data.stages[0].objective.includes('Не считайте голос'),'stage 1 objective spoils central audio inference');

expect(stage2.includes('PB-2')&&stage2.includes('TAKE-6')&&stage2.includes('MIC-C'),'recorded alibi proof incomplete');
expect(stage2.includes('HEEL-43C')&&stage2.includes('CRESCENT-43'),'shoeprint cross-check incomplete');
expect(stage2.includes('треугольный скол')&&stage2.includes('поперечный надрез'),'individualized footwear defects missing');
expect(stage2.includes('21:49:09')&&stage2.includes('21:50:05.6'),'shoe-on-person continuity around blackout missing');
expect(data.handoffs.guest[2].result.includes('двум индивидуальным дефектам')&&data.handoffs.guest[2].result.includes('непосредственно до и сразу после'),'footwear-to-person handoff remains too generic');
expect(stage2.includes('K-12')&&stage2.includes('15:06'),'duplicate key chain incomplete');

expect(stage3.includes('синхронизация механического щелчка PR-17')&&stage3.includes('A-17'),'legitimate prop access rationale missing');
expect(stage3.includes('BR-06')&&stage3.includes('18:36')&&stage3.includes('18:45'),'prop opportunity proof incomplete');
expect(stage3.includes('B-3')&&stage3.includes('P-771')&&stage3.includes('18:47'),'sealed prop chain of custody incomplete');
expect(stage3.includes('21:48:54')&&stage3.includes('C-2')&&stage3.includes('LOCAL-ARM'),'playback local-arm source missing before reveal');
expect(stage3.includes('нет сетевого удалённого входа')&&stage3.includes('встроенного планировщика'),'playback device could still be remotely/scheduled triggered');
expect(stage3.includes('21:48:53')&&stage3.includes('cue-панел'),'independent camera link to playback operator missing');
expect(data.handoffs.creator[3].expected==='C-2'&&data.handoffs.creator[3].result.includes('LOCAL-ARM'),'playback device-to-person handoff missing');
expect(stage3.includes('безымянный латунный дубликат архивного ключа'),'physical key seized from culprit missing');
expect(stage3.includes('31 × 24 × 0,8 см')&&stage3.includes('38 × 29 × 6,4 см')&&stage3.includes('помещается в него без сгиба'),'score/case physical fit missing');
expect(stage3.includes('21:50:07')&&stage3.includes('кремовую папку'),'post-archive object route to T-6M missing');
expect(stage3.includes('RFI-1')&&stage3.includes('экранированный RFID-инспекционный шкаф'),'isolated RFID containment proof missing');
expect(stage3.includes('пустой')&&stage3.includes('Других предметов в камере'),'RFI-1 controls do not exclude nearby-tag coincidence');
expect(stage3.includes('MS-1908')&&stage3.includes('T-6M'),'physical possession chain incomplete');
expect(stage3.includes('20:57')&&stage3.includes('21:51:24')&&stage3.includes('21:53'),'T-6M custody chain incomplete');
expect(stage3.includes('закрытым кодовым замком'),'T-6M pre-blackout lock state missing');
expect(stage3.includes('42 000 EUR')&&stage3.includes('M.KAREV'),'pre-event motive corroboration missing');
expect(stage3.includes('SAFE-L')&&stage3.includes('фойе')&&stage3.includes('LX-4'),'alternative suspect positions missing');

const groups=new Set(data.final?.evidence?.map((item)=>item.group));
for(const group of data.final?.requiredGroups||[]) expect(groups.has(group),`required proof group ${group} has no evidence`);
expect(JSON.stringify(data.final.requiredGroups)===JSON.stringify(['sabotage','culprit-sabotage','alibi','identity','access','possession']),'final proof gate does not separately require sabotage occurrence and culprit link');
expect(data.final.evidence.find((item)=>item.id==='checkout')?.group==='culprit-sabotage','personal sabotage evidence is not a separate required group');
expect((data.final?.requiredGroups||[]).length===6,'final proof board must require six independent links');
expect(data.final.evidence.find((item)=>item.id==='playback')?.label.includes('LOCAL-ARM'),'final audio evidence does not link physical arm action');
expect(data.final.evidence.find((item)=>item.id==='key')?.label.includes('изъят при нём'),'final access evidence lacks physical key custody');
expect(data.final.evidence.find((item)=>item.id==='tag')?.label.includes('RFI-1'),'final possession evidence still relies on tag proximity');
for(const q of data.final?.questions||[]) expect(q.answer&&q.options.some(([id])=>id===q.answer),`final question ${q.id} has invalid answer`);
expect(data.final.questions.find((q)=>q.id==='culprit')?.answer==='mikhail','canonical culprit changed');
expect(data.final.questions.find((q)=>q.id==='anton')?.answer==='victim','victim role changed');

const preFinal=[stage1,stage2,stage3].join(' ');
for(const marker of ['BR-06','Q-17B','SAFE-L','SAFE-R','TAKE-6','PB-2','MIC-C','K-12','HEEL-43C','MS-1908','T-6M','A. Stein','C-2','RFI-1']) expect(preFinal.includes(marker),`reveal marker ${marker} absent before final`);
expect(stage1.includes('Само обозначение PB-2')||stage1.includes('Само обозначение'),'PB source caveat missing');
expect(stage2.includes('Сам по себе размер 43 человека не идентифицирует'),'shoe identity caveat missing');
expect(stage3.includes('Сам журнал фиксирует устройство, а не лицо оператора'),'device-to-person caveat missing for C-2');
expect(stage3.includes('вина следует не из мотива')===false,'reveal language leaked into evidence');
expect(!JSON.stringify(data.stages).includes('ключ доказывает, что Михаил'),'key-owner identity shortcut leaked');
expect(all.includes('опер')||all.includes('театр'),'opera setting missing');
expect(all.includes('партитур')&&all.includes('интерком')&&all.includes('реквизит'),'distinct analog/theatrical evidence mix missing');
expect(!data.brief.lead.includes('автомобил')&&!data.brief.lead.includes('гостини'),'case premise drifted toward existing products');
const postprocess=read('tools/import-mobile/two-player-last-aria-postprocess.mjs');
expect(postprocess.includes('case-aria-investigator-v16.js')&&!postprocess.includes('case-aria-investigator-v15.js'),'generated route does not use only investigator v1.6');

console.log(JSON.stringify({
  id:data.id,
  logicVersion:data.logicVersion,
  proofRevision:data.proofRevision,
  coopRevision:data.coopRevision,
  stages:data.stages.length,
  materials:materialCount,
  handoffs:6,
  requiredProofGroups:data.final.requiredGroups.length,
  outboundSeconds:Number(outbound.toFixed(3)),
  archiveDwellSeconds:Number(archiveDwell.toFixed(3)),
  returnWindowSeconds:Number(returnWindow.toFixed(3)),
  departureDelaySeconds:[Number(departureDelayMin.toFixed(3)),Number(departureDelayMax.toFixed(3))],
  conservativeRoundTripSlackSeconds:Number(fullSlack.toFixed(3)),
  routeIncludesUnlock:true,
  archiveRetrievalMeasured:true,
  folderFitsCase:true,
  isolatedRfidContainment:true,
  localPlaybackArm:true,
  centralTwistSpoilerRemoved:true,
  playbackOperatorLinked:true,
  individualizedFootwear:true,
  emergencyLightingRealism:true,
  verdict:'investigator v1.6: door-to-door timing, measured retrieval, physical fit, isolated custody and six-link proof gate validated'
},null,2));