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
if(!args.case || args.stage===undefined) {
  console.error('Usage: node build-blind-packet.mjs --case <case-dna.json> --stage <n> [--out <packet.json>]');
  process.exit(2);
}

const d=JSON.parse(fs.readFileSync(args.case,'utf8'));
const stage=Number(args.stage);
if(!Number.isInteger(stage)||stage<0) {
  console.error('--stage must be a non-negative integer');
  process.exit(2);
}

const visible=(d.evidence||[])
  .filter(e=>Number(e.availability_stage||0)<=stage)
  .map(e=>({
    id:String(e.id),
    type:String(e.type||'other'),
    title:`Материал ${e.id}`,
    content:String(e.fact||''),
    source_context:String(e.provenance||'')
  }));

const chars=(d.characters||[]).map((c,i)=>({
  id:String(c.id||`P${i+1}`),
  name:`Участник ${i+1}`,
  visible_role:String(c.role||'участник дела'),
  player_visible_context:''
}));

const packet={
  schema_version:'blind_player_packet_v1',
  case_id:String(d.case_id||'unknown-case'),
  stage,
  role:{
    label:'Следователь',
    brief:'Изучайте только доступные материалы, формируйте несколько версий и отделяйте факты от предположений.'
  },
  incident:{
    summary:String(d.incident?.surface_problem||''),
    stakes:String(d.incident?.stakes||'')
  },
  evidence:visible,
  characters:chars,
  available_actions:visible.map(e=>({
    id:`inspect:${e.id}`,
    type:'inspect',
    label:`Перепроверить материал ${e.id}`,
    target_id:e.id
  })),
  state:{
    opened_evidence_ids:visible.map(e=>e.id),
    prior_action_ids:[],
    player_notes:[]
  }
};

const text=JSON.stringify(packet,null,2)+'\n';
if(args.out) fs.writeFileSync(args.out,text);
else process.stdout.write(text);
