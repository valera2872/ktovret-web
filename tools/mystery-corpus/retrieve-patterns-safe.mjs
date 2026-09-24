#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';

function argsOf(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--')) continue;
    const k=argv[i].slice(2),n=argv[i+1];
    if(!n||n.startsWith('--')) out[k]=true;
    else {out[k]=n;i++;}
  }
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args.manifest || !args.query){
  console.error('Usage: node retrieve-patterns-safe.mjs --manifest <layers.json> --query <text> [--mode approved|shadow] [--limit 8]');
  process.exit(2);
}
const mode=String(args.mode||'approved');
if(!['approved','shadow'].includes(mode)){
  console.error('--mode must be approved or shadow');
  process.exit(2);
}
const manifest=JSON.parse(fs.readFileSync(args.manifest,'utf8'));
if(manifest.schema_version!=='corpus_layer_manifest_v1'){
  console.error('invalid corpus layer manifest schema');
  process.exit(1);
}
const selected=[];
const approvedStatus=new Set(['approved_legacy','approved_reviewed']);
for(const layer of manifest.layers||[]){
  if(layer.retrieval_allowed!==true) continue;
  if(approvedStatus.has(layer.status)){
    selected.push({...layer,role:'approved'});
    continue;
  }
  if(mode==='shadow' && layer.shadow_only===true && ['needs_review','candidate'].includes(layer.status)){
    selected.push({...layer,role:'shadow'});
  }
}
if(mode==='approved' && selected.some(x=>x.role!=='approved')){
  console.error('approved retrieval cannot include unapproved layers');
  process.exit(1);
}
if(!selected.length){
  console.error('no retrieval layers selected');
  process.exit(1);
}

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-safe-retrieval-'));
const merged=path.join(tmp,'cases');fs.mkdirSync(merged);
const origin=new Map();
let copied=0;
for(const layer of selected){
  const dir=path.resolve(path.dirname(args.manifest),layer.path);
  if(!fs.existsSync(dir)||!fs.statSync(dir).isDirectory()){
    console.error(`layer path not found: ${layer.layer_id} -> ${dir}`);
    process.exit(1);
  }
  for(const name of fs.readdirSync(dir).filter(x=>x.endsWith('.json')).sort()){
    let d;try{d=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));}catch{continue}
    if(d.schema_version!=='case_dna_v1') continue;
    const outName=`${layer.layer_id}__${name}`;
    fs.copyFileSync(path.join(dir,name),path.join(merged,outName));
    origin.set(d.case_id,{layer_id:layer.layer_id,status:layer.status,role:layer.role});
    copied++;
  }
}
if(!copied){
  console.error('selected layers contain no case_dna_v1 records');
  process.exit(1);
}
const retriever=path.join(path.dirname(new URL(import.meta.url).pathname),'retrieve-patterns.mjs');
const r=spawnSync(process.execPath,[retriever,'--dir',merged,'--query',String(args.query),'--limit',String(args.limit||8),'--max-per-family',String(args['max-per-family']||3)],{encoding:'utf8'});
if(r.status!==0){
  console.error((r.stderr||r.stdout||'retriever failed').trim());
  process.exit(r.status||1);
}
const payload=JSON.parse(r.stdout);
payload.mode=mode;
payload.corpus_layers=selected.map(x=>({layer_id:x.layer_id,status:x.status,role:x.role}));
payload.results=(payload.results||[]).map(x=>({...x,corpus_origin:origin.get(x.case_id)||null}));
payload.warning=mode==='shadow'
  ?'Shadow results may include unapproved needs_review/candidate records and must not be treated as corpus truth.'
  :'Approved mode excludes needs_review/candidate layers.';
process.stdout.write(JSON.stringify(payload,null,2)+'\n');
