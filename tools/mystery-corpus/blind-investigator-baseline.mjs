#!/usr/bin/env node
import fs from 'node:fs';

function argsOf(argv) {
  const out={};
  for(let i=0;i<argv.length;i++) {
    const a=argv[i];
    if(!a.startsWith('--')) continue;
    const k=a.slice(2), n=argv[i+1];
    if(!n || n.startsWith('--')) out[k]=true;
    else { out[k]=n; i++; }
  }
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args.packet) {
  console.error('Usage: node blind-investigator-baseline.mjs --packet <blind-player-packet.json> [--persona <label>]');
  process.exit(2);
}

const p=JSON.parse(fs.readFileSync(args.packet,'utf8'));
const persona=String(args.persona||'baseline-evidence-first');

const STOP=new Set([
  'который','которая','которые','этого','этот','эта','есть','было','была','были','после','перед',
  'через','свою','своей','свой','может','могла','могли','роль','дела','участник','материал',
  'with','that','this','from','into','after','before','their','case','role'
]);
function toks(s) {
  return new Set(String(s||'').toLowerCase()
    .match(/[a-zа-яё0-9]{4,}/giu)?.filter(x=>!STOP.has(x))||[]);
}
function overlap(a,b) {
  let n=0;
  for(const x of a) if(b.has(x)) n++;
  return n;
}
function evidenceTokens(e) {
  return toks([e.title,e.content,e.source_context].filter(Boolean).join(' '));
}

const ev=(p.evidence||[]).map(e=>({...e,_t:evidenceTokens(e)}));
const candidates=[];

for(const c of (p.characters||[])) {
  const key=toks([c.name,c.visible_role,c.player_visible_context].join(' '));
  let raw=0;
  const support=[];
  for(const e of ev) {
    const hit=overlap(key,e._t);
    if(hit>0) {
      raw+=hit;
      support.push(e.id);
    }
  }
  candidates.push({
    claim:`${c.name} (${c.visible_role}) может быть связан с ключевым действием или сокрытием обстоятельств.`,
    raw,
    supporting_evidence_ids:support,
    assumptions:['Связь по роли или контексту сама по себе не доказывает вину.']
  });
}

const PROCESS=/ошиб|сбой|журнал|систем|процесс|уч[её]т|план|инвентар|регламент|контрол|авар|тревог|log|system|process|inventory|procedure/iu;
const processSupport=ev.filter(e=>PROCESS.test([e.content,e.source_context].join(' '))).map(e=>e.id);
candidates.push({
  claim:'Инцидент может объясняться ошибкой процесса, учёта или интерпретации без умышленного преступления.',
  raw:processSupport.length*1.2,
  supporting_evidence_ids:processSupport,
  assumptions:['Необходимо отличить человеческий умысел от системной ошибки.']
});

if(!candidates.length) {
  candidates.push({
    claim:'Недостаточно данных для предметной версии.',
    raw:0,
    supporting_evidence_ids:[],
    assumptions:['Нужны дополнительные материалы.']
  });
}

candidates.sort((a,b)=>b.raw-a.raw || a.claim.localeCompare(b.claim,'ru'));
const top=candidates.slice(0,3);
const denom=top.reduce((s,x)=>s+Math.max(0.5,x.raw+0.5),0);
const theories=top.map(x=>({
  claim:x.claim,
  confidence:Number((Math.max(0.5,x.raw+0.5)/denom).toFixed(3)),
  supporting_evidence_ids:x.supporting_evidence_ids,
  contradicting_evidence_ids:[],
  assumptions:x.assumptions
}));

const established=ev.slice(0,8).map(e=>String(e.content||e.title)).filter(Boolean);
const unresolved=[
  'Какая из доступных версий объясняет все материалы с наименьшим числом дополнительных предположений?',
  'Какая проверка способна различить две наиболее сильные версии?'
];

const run={
  schema_version:'blind_run_v1',
  run_id:`${p.case_id}:baseline:${p.stage}`,
  case_id:p.case_id,
  persona,
  checkpoints:[{
    stage:p.stage,
    theories,
    established_facts:established,
    unresolved_questions:unresolved,
    next_action:(p.available_actions||[])[0]?.label||'Запросить следующий доступный материал.',
    confusion:[],
    reasoning_mode:'inference',
    notes:'Deterministic blind baseline. Uses only player packet text; no private CANON or answer labels.'
  }]
};

process.stdout.write(JSON.stringify(run,null,2)+'\n');
