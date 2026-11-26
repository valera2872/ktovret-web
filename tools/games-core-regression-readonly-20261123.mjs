#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
const out='artifacts/game-engine-regression-20261123';
await fs.mkdir(out,{recursive:true});
const tests=[
  ['Last Aria canon/fairplay','tools/validate-case-last-aria.mjs'],
  ['Last Aria countertheories','tools/validate-case-last-aria-countertheories.mjs'],
  ['Last Aria backend contract (source)','tools/validate-coop-last-aria-backend.mjs'],
  ['Last Aria two-role browser / final','tools/last-aria-browser-smoke.mjs'],
  ['Mini solo 10 cases','tools/solo-mini-validate.mjs'],
  ['Solo paid 10-case contract','tools/solo-paid-investigations-validate.mjs'],
  ['Solo 407 source/game flow','tools/validate-solo-407.mjs'],
  ['Solo 407 browser / final','tools/solo-407-browser-smoke.mjs'],
  ['Partner 23:17 logic','tools/validate-case-2317-detective-v3.mjs'],
  ['Partner 23:17 countertheories','tools/validate-case-2317-countertheories-v3.mjs'],
  ['Partner 23:17 playtest','tools/validate-case-2317-playtest-v3.mjs'],
  ['Partner 407 logic','tools/validate-case-407.mjs'],
  ['Partner 407 evidence','tools/validate-case-407-evidence-v2.mjs'],
  ['Partner 407 deduction','tools/validate-case-407-detective-v4.mjs'],
  ['Partner 407 countertheories','tools/validate-case-407-countertheories-v4.mjs'],
  ['Partner 407 blind playtest','tools/validate-case-407-playtest-v42.mjs']
];
const result=[];
for(const [label,file] of tests){
 const start=Date.now();
 const r=spawnSync(process.execPath,[file],{encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024,env:{...process.env,CHROME_BIN:'/usr/bin/google-chrome'}});
 const item={label,file,ok:r.status===0&&!r.error,exitCode:r.status,durationMs:Date.now()-start,stdout:(r.stdout||'').slice(-2000),stderr:(r.stderr||'').slice(-2200),error:r.error?.message||''};
 result.push(item);
 console.log(item.ok?'PASS':'FAIL',label,'exit',item.exitCode,'durationMs',item.durationMs);
 if(!item.ok)console.log((item.error||item.stderr||item.stdout).slice(-1200));
}
await fs.writeFile(out+'/report.json',JSON.stringify(result,null,2));
await fs.writeFile(out+'/SUMMARY.md','# Mystery Logic — source contract + local browser regressions\n\nThese tests run **on GitHub main working tree, NOT the deployed Beget file bytes**. They DO NOT purchase anything, create live rooms, or access real customer data.\n\n'+result.map(x=>'- '+(x.ok?'PASS':'FAIL')+' **'+x.label+'** ('+x.file+')'+(x.ok?'':' — '+(x.stderr||x.error||x.stdout).slice(-350).replace(/\n/g,' '))).join('\n')+'\n');
console.log('SUMMARY',{passed:result.filter(x=>x.ok).length,total:result.length});
if(result.some(x=>!x.ok))process.exitCode=1;
