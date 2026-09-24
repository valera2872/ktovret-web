#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

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
if(!args['batch-dir'] || !args['reviewer-id']){
  console.error('Usage: node run-openai-review-batch.mjs --batch-dir <unpacked-batch> --reviewer-id <id> [--out report.json]');
  process.exit(2);
}
if(!process.env.OPENAI_API_KEY){
  console.error('OPENAI_API_KEY is required for independent OpenAI review execution.');
  process.exit(2);
}

const here=path.dirname(new URL(import.meta.url).pathname);
const adapter=path.join(here,'openai-reviewer-adapter.mjs');
const batch=path.join(here,'run-review-batch-provider.mjs');
const outFile=args.out?path.resolve(args.out):path.resolve('corpus-review-batch-report.json');

function waitForAdapter(child){
  return new Promise((resolve,reject)=>{
    let stderr='';
    let buffer='';
    const timer=setTimeout(()=>{
      reject(new Error('OpenAI reviewer adapter did not become ready'));
    },15000);
    const cleanup=()=>clearTimeout(timer);

    child.stderr.on('data',d=>stderr+=d);
    child.stdout.on('data',d=>{
      buffer+=d.toString();
      const lines=buffer.split('\n');
      buffer=lines.pop()||'';
      for(const line of lines){
        if(!line.trim()) continue;
        try{
          const msg=JSON.parse(line);
          if(msg.status==='listening'&&msg.port){
            cleanup();
            resolve({port:msg.port,stderr});
            return;
          }
        }catch{}
      }
    });
    child.on('exit',code=>{
      cleanup();
      reject(new Error(`OpenAI reviewer adapter exited before ready (code ${code}): ${stderr.trim()}`));
    });
  });
}

function runBatch(endpoint){
  return new Promise(resolve=>{
    const child=spawn(process.execPath,[
      batch,
      '--batch-dir',path.resolve(args['batch-dir']),
      '--reviewer-id',String(args['reviewer-id']),
      '--endpoint',endpoint,
      '--out',outFile
    ],{
      cwd:process.cwd(),
      env:process.env,
      stdio:['ignore','pipe','pipe']
    });
    let stdout='',stderr='';
    child.stdout.on('data',d=>stdout+=d);
    child.stderr.on('data',d=>stderr+=d);
    child.on('close',code=>resolve({code,stdout,stderr}));
  });
}

const adapterChild=spawn(process.execPath,[adapter],{
  cwd:process.cwd(),
  env:{...process.env,CORPUS_REVIEWER_PORT:'0'},
  stdio:['ignore','pipe','pipe']
});

let exitCode=1;
try{
  const ready=await waitForAdapter(adapterChild);
  const endpoint=`http://127.0.0.1:${ready.port}/review`;
  const r=await runBatch(endpoint);
  if(fs.existsSync(outFile)){
    const report=JSON.parse(fs.readFileSync(outFile,'utf8'));
    console.log(JSON.stringify({
      status:r.code===0?'completed':'completed_with_blocks',
      report:outFile,
      reviewer_id:report.reviewer_id,
      summary:report.summary
    },null,2));
  }else{
    console.error(r.stderr||r.stdout||'Batch runner did not create a report');
  }
  if(r.stderr?.trim()) console.error(r.stderr.trim());
  exitCode=r.code??1;
}catch(error){
  console.error(String(error?.message||error));
  exitCode=1;
}finally{
  adapterChild.kill('SIGTERM');
  setTimeout(()=>adapterChild.kill('SIGKILL'),1000).unref();
}
process.exitCode=exitCode;
