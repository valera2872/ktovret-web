import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const prompt=path.join(repo,'tools/mystery-corpus/build-blind-investigator-prompt.mjs');
const validate=path.join(repo,'tools/mystery-corpus/validate-blind-run.mjs');

function packet() {
  return {
    schema_version:'blind_player_packet_v1',
    case_id:'c1',
    stage:1,
    role:{label:'Следователь',brief:'Проверить дело'},
    incident:{summary:'Пропал объект',stakes:'Разобраться'},
    evidence:[
      {id:'E1',type:'document',title:'Журнал',content:'Запись'},
      {id:'E2',type:'image',title:'Фото',content:'Кадр'}
    ],
    characters:[],
    available_actions:[],
    state:{opened_evidence_ids:['E1','E2'],prior_action_ids:[]}
  };
}
function checkpoint(ids=['E1']) {
  return {
    stage:1,
    theories:[{claim:'Версия',confidence:.5,supporting_evidence_ids:ids,contradicting_evidence_ids:[],assumptions:[]}],
    established_facts:['Факт'],
    unresolved_questions:['Вопрос'],
    next_action:'Проверить журнал',
    confusion:[],
    reasoning_mode:'inference',
    notes:''
  };
}

test('prompt contains only supplied player packet and explicit isolation rules',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'blind-prompt-'));
  const file=path.join(dir,'p.json');
  fs.writeFileSync(file,JSON.stringify(packet()));
  const r=spawnSync(process.execPath,[prompt,'--packet',file],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const out=JSON.parse(r.stdout);
  assert.equal(out.player_packet.case_id,'c1');
  assert.ok(out.rules.some(x=>x.includes('ONLY')));
  assert.doesNotMatch(r.stdout,/canonical_hypothesis|private_canon|correct_answer/i);
});

test('validator accepts evidence ids present in packet',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'blind-run-good-'));
  const pf=path.join(dir,'p.json'), rf=path.join(dir,'r.json');
  fs.writeFileSync(pf,JSON.stringify(packet()));
  fs.writeFileSync(rf,JSON.stringify(checkpoint(['E1','E2'])));
  const r=spawnSync(process.execPath,[validate,'--packet',pf,'--run',rf],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/Blind run VALID/);
});

test('validator rejects evidence ids unavailable at current stage',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'blind-run-bad-'));
  const pf=path.join(dir,'p.json'), rf=path.join(dir,'r.json');
  fs.writeFileSync(pf,JSON.stringify(packet()));
  fs.writeFileSync(rf,JSON.stringify(checkpoint(['E99'])));
  const r=spawnSync(process.execPath,[validate,'--packet',pf,'--run',rf],{encoding:'utf8'});
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/unavailable evidence: E99/);
});
