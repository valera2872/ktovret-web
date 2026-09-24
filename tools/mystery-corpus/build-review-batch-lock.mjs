#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function argsOf(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--')) continue;
    const k=argv[i].slice(2),n=argv[i+1];
    if(!n||n.startsWith('--')) out[k]=true; else {out[k]=n;i++;}
  }
  return out;
}
function sha(file){
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
function walk(dir,root,out=[]){
  for(const name of fs.readdirSync(dir).sort()){
    const full=path.join(dir,name);
    const rel=path.relative(root,full).replaceAll(path.sep,'/');
    const st=fs.statSync(full);
    if(st.isDirectory()) walk(full,root,out);
    else if(rel!=='review-batch.lock.json' && !rel.startsWith('.')) out.push(rel);
  }
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args['batch-dir']){
  console.error('Usage: node build-review-batch-lock.mjs --batch-dir <dir> [--verify-only]');
  process.exit(2);
}
const root=path.resolve(args['batch-dir']);
const lockFile=path.join(root,'review-batch.lock.json');
if(!fs.existsSync(root)||!fs.statSync(root).isDirectory()){
  console.error('batch dir not found');
  process.exit(2);
}
if(args['verify-only']){
  if(!fs.existsSync(lockFile)){
    console.error('Review Batch Lock INVALID\n- missing review-batch.lock.json');
    process.exit(1);
  }
  const lock=JSON.parse(fs.readFileSync(lockFile,'utf8'));
  const errors=[];
  const actual=walk(root,root);
  const listed=new Map((lock.files||[]).map(x=>[x.path,x]));
  for(const rel of actual){
    const meta=listed.get(rel);
    if(!meta){errors.push(`unlocked file present: ${rel}`);continue}
    const full=path.join(root,rel);
    const h=sha(full),size=fs.statSync(full).size;
    if(h!==meta.sha256) errors.push(`hash mismatch: ${rel}`);
    if(size!==meta.size_bytes) errors.push(`size mismatch: ${rel}`);
  }
  for(const rel of listed.keys()){
    if(!actual.includes(rel)) errors.push(`locked file missing: ${rel}`);
  }
  if(errors.length){
    console.error('Review Batch Lock INVALID');
    for(const e of errors) console.error('- '+e);
    process.exit(1);
  }
  console.log('Review Batch Lock VALID');
  console.log(JSON.stringify({batch_id:lock.batch_id||null,files:actual.length,lock_sha256:sha(lockFile)},null,2));
  process.exit(0);
}

const manifestFile=path.join(root,'batch-manifest.json');
if(!fs.existsSync(manifestFile)){
  console.error('batch-manifest.json not found');
  process.exit(1);
}
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
const files=walk(root,root).map(rel=>{
  const full=path.join(root,rel);
  return {path:rel,size_bytes:fs.statSync(full).size,sha256:sha(full)};
});
const lock={
  schema_version:'corpus_review_batch_lock_v1',
  batch_id:manifest.batch_id||null,
  batch_version:manifest.version||null,
  generated_at:new Date().toISOString(),
  algorithm:'sha256',
  files
};
fs.writeFileSync(lockFile,JSON.stringify(lock,null,2)+'\n');
console.log(JSON.stringify({status:'LOCK_CREATED',batch_id:lock.batch_id,files:files.length,lock_file:lockFile,lock_sha256:sha(lockFile)},null,2));
