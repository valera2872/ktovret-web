#!/usr/bin/env node
import fs from 'node:fs/promises';import {existsSync} from 'node:fs';import {createHash} from 'node:crypto';
const files=['case-aria.js','case-aria-data.js','case-aria-fairplay-v2.js','case-aria-investigator-v16.js','case-aria-storefront.js','case-aria-first-buyer-recovery.js','case-aria-paid-auth.js','case-aria-resilience.js','case-aria-final-feedback.js','case-aria-final-feedback-loader.js','case-aria-investigation-ux-v2.js','case-aria-materials-v2.js'];
const hash=x=>createHash('sha256').update(x).digest('hex');const result=[];
for(const name of files){
 const path='assets/'+name;
 if(!existsSync(path)){result.push({file:name,status:'missing_GitHub_main'});continue;}
 const localHash=hash(await fs.readFile(path));
 try{
  const res=await fetch('https://mysterylogic.com/'+path,{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(18000)});
  const liveHash=res.ok?hash(Buffer.from(await res.arrayBuffer())):null;
  const status=!res.ok?'LIVE_HTTP_'+res.status:localHash===liveHash?'identical':'LIVE_DIFFERS_FROM_MAIN';
  result.push({file:name,status,liveHttp:res.status,liveHash,mainHash:localHash});
  console.log(status,name);
 }catch(e){result.push({file:name,status:'request_error',error:String(e).slice(0,200)})}
}
await fs.mkdir('artifacts/last-aria-dynamic-parity',{recursive:true});await fs.writeFile('artifacts/last-aria-dynamic-parity/report.json',JSON.stringify(result,null,2));
console.log('SUMMARY',result.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{}));
if(result.some(x=>x.status.startsWith('LIVE_HTTP_')||x.status==='request_error'))process.exitCode=1;
