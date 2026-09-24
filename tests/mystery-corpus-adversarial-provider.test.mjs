import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';

const repo=process.cwd();
const runner=path.join(repo,'tools/mystery-corpus/run-adversarial-provider.mjs');

function packet() {
  return {
    schema_version:'blind_player_packet_v1',
    case_id:'adv-provider-test',
    stage:2,
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
function theories(eid='E1') {
  return [{
    schema_version:'adversarial_theory_v1',
    theory_id:'ALT1',
    claim:'Ошибка учёта',
    explains_evidence_ids:[eid],
    conflicts_evidence_ids:['E2'],
    assumptions:['Журнал может отражать процесс, а не фактическое наличие объекта'],
    requires_new_answer_fact:false,
    discriminating_checks:[{question:'Сверить источник записи',expected_difference:'При ошибке учёта источник не подтвердит физическое перемещение',available_before_reveal:true}],
    origin:'solution-isolated-provider'
  }];
}
async function withServer(handler,fn) {
  const server=http.createServer(handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const {port}=server.address();
    await fn(`http://127.0.0.1:${port}/adv`);
  } finally {
    await new Promise(resolve=>server.close(resolve));
  }
}
function run(endpoint,file,env={}) {
  return new Promise(resolve=>{
    const child=spawn(process.execPath,[runner,'--packet',file,'--endpoint',endpoint],{
      cwd:repo,env:{...process.env,...env},stdio:['ignore','pipe','pipe']
    });
    let stdout='',stderr='';
    child.stdout.on('data',d=>stdout+=d);
    child.stderr.on('data',d=>stderr+=d);
    child.on('close',code=>resolve({code,stdout,stderr}));
  });
}

test('adversarial provider sees only player-visible packet',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'adv-provider-good-'));
  const pf=path.join(dir,'packet.json');
  fs.writeFileSync(pf,JSON.stringify(packet()));
  let captured='';
  await withServer((req,res)=>{
    let body='';
    req.on('data',d=>body+=d);
    req.on('end',()=>{
      captured=body;
      res.writeHead(200,{'content-type':'application/json'});
      res.end(JSON.stringify({theories:theories()}));
    });
  },async endpoint=>{
    const r=await run(endpoint,pf,{PRIVATE_CANON_CANARY:'HIDDEN_CULPRIT_X88'});
    assert.equal(r.code,0,r.stderr);
    assert.match(r.stdout,/ALT1/);
  });
  assert.match(captured,/Видимая|Запись/);
  assert.doesNotMatch(captured,/HIDDEN_CULPRIT_X88/);
});

test('adversarial provider response cannot cite hidden evidence',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'adv-provider-bad-'));
  const pf=path.join(dir,'packet.json');
  fs.writeFileSync(pf,JSON.stringify(packet()));
  await withServer((req,res)=>{
    req.resume();
    req.on('end',()=>{
      res.writeHead(200,{'content-type':'application/json'});
      res.end(JSON.stringify({theories:theories('E99')}));
    });
  },async endpoint=>{
    const r=await run(endpoint,pf);
    assert.notEqual(r.code,0);
    assert.match(r.stderr,/unavailable evidence: E99/);
  });
});
