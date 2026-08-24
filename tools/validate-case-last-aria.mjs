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
const data=context.window.MLCaseAria;
expect(data?.id==='special:last-aria','case id mismatch');
expect(data.title==='Последняя ария','title mismatch');
expect(data.logicVersion===1,'logic version mismatch');
expect(data.proofRevision==='1.1'&&data.coopRevision==='1.1','fair-play revision missing');
expect(data.stages?.length===3,'expected three stages');
const materialCount=data.stages.reduce((sum,stage)=>sum+(stage.creator?.length||0)+(stage.guest?.length||0),0);
expect(materialCount===18,`expected 18 materials, got ${materialCount}`);
for(const stage of data.stages){expect(stage.creator?.length===3&&stage.guest?.length===3,`stage ${stage.id} must split 3+3`);}

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
expect(stage1.includes('21:49:12.000')&&stage1.includes('21:49:31.604'),'critical blackout/archive timestamps missing');
expect(stage1.includes('16–20 секунд')&&stage1.includes('не менее 58 секунд'),'physical route bounds missing');
expect(data.handoffs.creator[1].result.includes('19,6 секунды'),'physical overlap inference missing');
expect(stage1.includes('SAFE-L')&&stage1.includes('SAFE-R'),'stage-manager physical hold missing');
expect(stage2.includes('PB-2')&&stage2.includes('TAKE-6')&&stage2.includes('MIC-C'),'recorded alibi proof incomplete');
expect(stage2.includes('HEEL-43C')&&stage2.includes('CRESCENT-43'),'shoeprint cross-check incomplete');
expect(stage3.includes('BR-06')&&stage3.includes('18:36')&&stage3.includes('18:45'),'prop opportunity proof incomplete');
expect(stage3.includes('K-12')&&stage3.includes('15:06'),'duplicate key chain incomplete');
expect(stage3.includes('MS-1908')&&stage3.includes('T-6M'),'physical possession chain incomplete');
expect(stage3.includes('42 000 EUR')&&stage3.includes('M.KAREV'),'pre-event motive corroboration missing');
expect(stage3.includes('SAFE-L')&&stage3.includes('фойе')&&stage3.includes('LX-4'),'alternative suspect positions missing');

const groups=new Set(data.final?.evidence?.map((item)=>item.group));
for(const group of data.final?.requiredGroups||[])expect(groups.has(group),`required proof group ${group} has no evidence`);
expect((data.final?.requiredGroups||[]).length>=5,'final proof board too weak');
for(const q of data.final?.questions||[])expect(q.answer&&q.options.some(([id])=>id===q.answer),`final question ${q.id} has invalid answer`);
expect(data.final.questions.find((q)=>q.id==='culprit')?.answer==='mikhail','canonical culprit changed');
expect(data.final.questions.find((q)=>q.id==='anton')?.answer==='victim','victim role changed');

// No critical reveal-only facts: every canonical marker named in the debrief must exist in pre-final evidence.
const preFinal=[stage1,stage2,stage3].join(' ');
for(const marker of ['BR-06','Q-17B','SAFE-L','SAFE-R','TAKE-6','PB-2','MIC-C','K-12','HEEL-43C','MS-1908','T-6M','A. Stein']){
  expect(preFinal.includes(marker),`reveal marker ${marker} absent before final`);
}

// Ownership/credentials are not allowed to stand in for identity.
expect(stage1.includes('Само обозначение PB-2')||stage1.includes('Само обозначение'),'PB source caveat missing');
expect(stage2.includes('Сам по себе размер обуви человека не идентифицирует'),'shoe size identity caveat missing');
expect(stage3.includes('вина следует не из мотива')===false,'reveal language leaked into evidence');
expect(!JSON.stringify(data.stages).includes('ключ доказывает, что Михаил'),'key-owner identity shortcut leaked');

// Deliberately different product DNA from existing cases.
expect(all.includes('опер')||all.includes('театр'),'opera setting missing');
expect(all.includes('партитур')&&all.includes('интерком')&&all.includes('реквизит'),'distinct analog/theatrical evidence mix missing');
expect(!data.brief.lead.includes('автомобил')&&!data.brief.lead.includes('гостини'),'case premise drifted toward existing products');

console.log(JSON.stringify({
  id:data.id,logicVersion:data.logicVersion,proofRevision:data.proofRevision,coopRevision:data.coopRevision,
  stages:data.stages.length,materials:materialCount,handoffs:6,requiredProofGroups:data.final.requiredGroups.length,
  verdict:'fair-play structure, physical timing and cross-role boundaries validated'
},null,2));
