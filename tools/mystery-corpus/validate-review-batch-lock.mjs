#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const fileURLToPathname = url => new URL(url).pathname;

function argsOf(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--')) continue;
    const k=argv[i].slice(2),n=argv[i+1];
    if(!n||n.startsWith('--')) out[k]=true; else {out[k]=n;i++;}
  }
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args['batch-dir']){
  console.error('Usage: node validate-review-batch-lock.mjs --batch-dir <dir>');
  process.exit(2);
}
const here=path.dirname(fileURLToPathname(import.meta.url));
const tool=path.join(here,'build-review-batch-lock.mjs');
const r=spawnSync(process.execPath,[tool,'--batch-dir',path.resolve(args['batch-dir']),'--verify-only'],{encoding:'utf8'});
if(r.status!==0){
  process.stderr.write(r.stderr||r.stdout||'Review batch lock invalid\n');
  process.exit(r.status||1);
}
process.stdout.write(r.stdout);
