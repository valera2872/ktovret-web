#!/usr/bin/env node
// Compare LIVE Beget JS/CSS used by central cases to GitHub main at this run.
// Differences are deployment drift, NOT automatically regressions. Read-only.
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const BASE='https://mysterylogic.com',OUT='artifacts/game-live-parity-20261123';
await fs.mkdir(OUT,{recursive:true});
const PAGES=[
 '/kto-vret/','/dela/','/detektivnye-igry-dlya-odnogo/mini/',
 '/detektivnye-igry-dlya-odnogo/rassledovaniya/','/detektivnye-igry-dlya-odnogo/407/',
 '/detektivnye-igry-dlya-odnogo/tihaya-noch/',
 '/detektivnye-igry-dlya-dvoih/2317/','/detektivnye-igry-dlya-dvoih/407/',
 '/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/',
 '/ai-investigation/','/realnye-dela/pozharnaya-lestnica-1991-premium/'
];
const sha=x=>createHash('sha256').update(x).digest('hex');
const found=new Map();
for(const page of PAGES){
 const response=await fetch(BASE+page,{signal:AbortSignal.timeout(16000)});
 if(!response.ok){console.log('PAGE_ERR',response.status,page);continue;}
 const s=await response.text();
 for(const tag of s.match(/<(?:link|script)\b[^>]*>/gi)||[]){
   if(tag.startsWith('<link')&&!/rel=["']stylesheet/i.test(tag))continue;
   const ref=(tag.match(/\b(?:src|href)\s*=\s*["']([^"']+)["']/i)||[])[1];
   if(!ref)continue;
   const u=new URL(ref,BASE+page);
   if(u.origin!==BASE||!/\/assets\/.*\.(?:js|css)$/i.test(u.pathname))continue;
   if(!found.has(u.pathname))found.set(u.pathname,{path:u.pathname,from:[page],url:u.href});
   else found.get(u.pathname).from.push(page);
 }
}
let total=0;
const rows=[];
for(const asset of found.values()){
 const local='.'+asset.path;
 const exists=existsSync(local);
 let localHash=null,liveHash=null,code=0,error='';
 if(exists)localHash=sha(await fs.readFile(local));
 try{
  const r=await fetch(asset.url,{signal:AbortSignal.timeout(17000)});
  code=r.status;
  if(r.ok)liveHash=sha(Buffer.from(await r.arrayBuffer()));
 }catch(e){error=String(e).slice(0,200)}
 const status=!exists?'main-missing':code!==200?'LIVE-HTTP-'+code:localHash===liveHash?'byte-identical':'DRIFT';
 rows.push({path:asset.path,status,liveHttp:code,localHash,liveHash,from:asset.from,error});
 console.log('PARITY',status,asset.path);
 total++;
}
await fs.writeFile(OUT+'/report.json',JSON.stringify(rows,null,2));
const counts=rows.reduce((o,r)=>(o[r.status]=(o[r.status]||0)+1,o),{});
await fs.writeFile(OUT+'/SUMMARY.md','# Mystery Logic — LIVE asset parity (read-only)\n\n'+Object.entries(counts).map(([k,v])=>'- '+k+': **'+v+'**').join('\n')+'\n\n'+rows.filter(x=>x.status!=='byte-identical').map(x=>'- '+x.status+' '+x.path).join('\n')+'\n\nA GitHub main vs LIVE hash difference by itself is neither a defect nor permission to replace LIVE. Current_release.json and uploaded Beget files remain deployment source of truth.\n');
console.log('SUMMARY',counts,'ASSETS',total);
if(rows.some(x=>x.status.startsWith('LIVE-HTTP-')))process.exitCode=1;
