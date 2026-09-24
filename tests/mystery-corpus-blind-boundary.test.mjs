import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const repo=process.cwd();
const validator=path.join(repo,'tools/mystery-corpus/validate-blind-boundary.mjs');

function valid() {
  return {
    schema_version:'blind_player_packet_v1',
    case_id:'c',
    stage:1,
    role:{label:'Следователь',brief:'Проверить дело'},
    incident:{summary:'Пропал объект',stakes:'Разобраться'},
    evidence:[{id:'E1',type:'document',title:'Журнал',content:'Запись'}],
    characters:[{id:'P1',name:'Анна',visible_role:'техник'}],
    available_actions:[{id:'A1',type:'inspect',label:'Изучить журнал'}],
    state:{opened_evidence_ids:['E1'],prior_action_ids:[]}
  };
}
function run(data) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'blind-boundary-'));
  const file=path.join(dir,'p.json');
  fs.writeFileSync(file,JSON.stringify(data));
  return spawnSync(process.execPath,[validator,file],{encoding:'utf8'});
}

test('accepts player-only packet',()=>{
  const r=run(valid());
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/Blind boundary VALID/);
});

test('rejects solution-bearing metadata keys',()=>{
  const data=valid();
  data.canonical_hypothesis='P1';
  data.evidence[0].culprit=true;
  const r=run(data);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/forbidden solution-bearing key/);
});

test('rejects author assessment labels on evidence',()=>{
  const data=valid();
  data.evidence[0].supports=['H1'];
  data.evidence[0].reliability='high';
  const r=run(data);
  assert.notEqual(r.status,0);
  assert.match(r.stderr,/hypothesis-support labels are forbidden/);
  assert.match(r.stderr,/author assessment is forbidden/);
});
