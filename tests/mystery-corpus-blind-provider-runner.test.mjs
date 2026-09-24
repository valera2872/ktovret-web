import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';

const repo=process.cwd();
const runner=path.join(repo,'tools/mystery-corpus/run-blind-provider.mjs');

function packet() {
  return {
    schema_version:'blind_player_packet_v1',
    case_id:'provider-test',
    stage:1,
    role:{label:'Следователь',brief:'Проверить дело'},
    incident:{summary:'Пропал объект',stakes:'Разобраться'},
    evidence:[{id:'E1',type:'document',title:'Журнал',content:'Видимая запись'}],
    characters:[{id:'P1',name:'Участник 1',visible_role:'техник'}],
    available_actions:[],
    state:{opened_evidence_ids:['E1'],prior_action_ids:[]}
  };
}
function validCheckpoint() {
  return {
    stage:1,
    theories:[{claim:'Ошибка процесса',confidence:.6,supporting_evidence_ids:['E1'],contradicting_evidence_ids:[],assumptions:[]}],
    established_facts:['Есть запись E1'],
    unresolved_questions:['Что отличит ошибку от умысла?'],
    next_action:'Проверить источник записи',
    confusion:[],
    reasoning_mode:'inference',
    notes:''
  };
}
async function withServer(handler,fn) {
  const server=http.createServer(handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const {port}=server.address();
    await fn(`http://127.0.0.1:${port}/blind`);
  } finally {
    await new Promise(resolve=>server.close(resolve));
  }
}
function run(endpoint,file,env={}) {
  return new Promise(resolve=>{
    const child=spawn(process.execPath,[runner,'--packet',file,'--endpoint',endpoint],{
      cwd:repo,
      env:{...process.env,...env},
      stdio:['ignore','pipe','pipe']
    });
    let stdout='',stderr='';
    child.stdout.on('data',d=>stdout+=d);
    child.stderr.on('data',d=>stderr+=d);
    child.on('close',code=>resolve({code,stdout,stderr}));
  });
}

test('provider request contains blind packet but never unrelated private canary env',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'provider-good-'));
  const pf=path.join(dir,'packet.json');
  fs.writeFileSync(pf,JSON.stringify(packet()));
  let captured='';
  await withServer((req,res)=>{
    let body='';
    req.on('data',d=>body+=d);
    req.on('end',()=>{
      captured=body;
      res.writeHead(200,{'content-type':'application/json'});
      res.end(JSON.stringify({checkpoint:validCheckpoint()}));
    });
  },async endpoint=>{
    const r=await run(endpoint,pf,{BLIND_PRIVATE_CANON_CANARY:'SECRET_CANON_X77'});
    assert.equal(r.code,0,r.stderr);
    assert.match(r.stdout,/Ошибка процесса/);
  });
  assert.match(captured,/blind_provider_request_v1/);
  assert.match(captured,/Видимая запись/);
  assert.doesNotMatch(captured,/SECRET_CANON_X77/);
});

test('provider response is rejected when it cites unavailable evidence',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'provider-bad-'));
  const pf=path.join(dir,'packet.json');
  fs.writeFileSync(pf,JSON.stringify(packet()));
  await withServer((req,res)=>{
    req.resume();
    req.on('end',()=>{
      const bad=validCheckpoint();
      bad.theories[0].supporting_evidence_ids=['E99'];
      res.writeHead(200,{'content-type':'application/json'});
      res.end(JSON.stringify({checkpoint:bad}));
    });
  },async endpoint=>{
    const r=await run(endpoint,pf);
    assert.notEqual(r.code,0);
    assert.match(r.stderr,/unavailable evidence: E99/);
  });
});
