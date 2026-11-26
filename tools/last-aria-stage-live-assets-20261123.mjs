#!/usr/bin/env node
// Runtime-only staging of EXACT LIVE Beget Last Aria assets into ephemeral
// GitHub runner checkout. No commit, no deploy, no authenticated API calls.
import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
const paths=['assets/mysterylogic.css','assets/premium.css','assets/case-aria.css','assets/case-aria-materials-v2.css','assets/case-aria-layout-v2.css','assets/case-aria-data.js','assets/case-aria-fairplay-v2.js','assets/case-aria-investigator-v16.js','assets/case-aria.js','assets/case-aria-materials-v2.js'];
const sha=x=>createHash('sha256').update(x).digest('hex');
const summary=[];
for(const path of paths){
 const r=await fetch('https://mysterylogic.com/'+path,{signal:AbortSignal.timeout(17000),headers:{'cache-control':'no-cache'}});
 if(!r.ok)throw Error('Missing LIVE asset '+path+': HTTP '+r.status);
 const type=r.headers.get('content-type')||'';
 if(!/javascript|text\/css|application\/octet-stream|text\/plain/i.test(type))throw Error('Unexpected mime '+path+' '+type);
 const bytes=Buffer.from(await r.arrayBuffer()),local=await fs.readFile(path);
 summary.push({path,liveSha256:sha(bytes),mainSha256:sha(local),identical:sha(bytes)===sha(local),bytes:bytes.length});
 await fs.writeFile(path,bytes);
 console.log('LIVE STAGED',path,'length',bytes.length,'identicalToMain',sha(bytes)===sha(local));
}
await fs.mkdir('artifacts/last-aria-live-source-qa',{recursive:true});
await fs.writeFile('artifacts/last-aria-live-source-qa/staged.json',JSON.stringify(summary,null,2));
console.log('LIVE STAGING COMPLETE: 10 exact deployed assets, no server mutations');
