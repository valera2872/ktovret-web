#!/usr/bin/env node
// LIVE short-case catalog audit: all 100 published case routes and SEOs.
// Read-only HTTP GET; no purchase, no gameplay session write.
import fs from 'node:fs/promises';
const ROOT='https://mysterylogic.com',OUT='artifacts/live-100-cases-audit-20261123';
await fs.mkdir(OUT,{recursive:true});
const url=ROOT+'/assets/generated/cases-index.js';
const catRes=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'cache-control':'no-cache'}});
if(!catRes.ok)throw Error('Live 100-case catalog unavailable HTTP '+catRes.status);
const js=(await catRes.text()).trim();const mark='window.KtoVretCatalog=';
if(!js.startsWith(mark))throw Error('Unknown live catalog format');
const catalog=JSON.parse(js.slice(mark.length).replace(/;\s*$/,''));
const cases=catalog.cases;
if(!Array.isArray(cases)||cases.length!==100)throw Error('100-case catalog count changed: '+cases?.length);
const urls=new Map();
for(const item of cases){
 for(const key of ['path','seoPath','legacyPath']){
  const p='/'+String(item[key]||'').replace(/^\/+/,'');
  if(!item[key])continue;
  if(!urls.has(p))urls.set(p,{path:p,cases:[],kind:key});
  urls.get(p).cases.push({number:item.number,access:item.access,kind:key});
 }
}
const paths=[...urls.values()],checks=[];
for(let i=0;i<paths.length;i+=12){
 const rows=await Promise.all(paths.slice(i,i+12).map(async x=>{
  try{
   const r=await fetch(ROOT+x.path,{signal:AbortSignal.timeout(16000),redirect:'follow',headers:{'cache-control':'no-cache'}});
   const txt=await r.text(),title=(txt.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]?.replace(/<[^>]*>/g,'').trim()||'';
   const can=(txt.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)||[])[1]||'';
   return {...x,status:r.status,redirect:r.url!==ROOT+x.path,bytes:Buffer.byteLength(txt),title,canonical:can,hasTitle:!!title};
  }catch(e){return {...x,status:0,error:String(e).slice(0,150)};}
 }));
 checks.push(...rows);
}
const counts={catalogCount:cases.length,free:cases.filter(x=>x.access==='free').length,premium:cases.filter(x=>x.access==='premium').length,
  paths:checks.length,ok:checks.filter(x=>x.status===200).length,broken:checks.filter(x=>x.status!==200).length,
  untitled:checks.filter(x=>!x.hasTitle&&x.status===200).length};
await fs.writeFile(OUT+'/report.json',JSON.stringify({totals:counts,broken:checks.filter(x=>x.status!==200),cases:cases.map(x=>({number:x.number,access:x.access,path:x.path,seoPath:x.seoPath,legacyPath:x.legacyPath})),paths:checks},null,2));
await fs.writeFile(OUT+'/SUMMARY.md','# Mystery Logic LIVE — 100 short cases\n\n'+Object.entries(counts).map(([k,v])=>'- '+k+': '+v).join('\n')+'\n\n## Non-200\n'+checks.filter(x=>x.status!==200).map(x=>'- '+x.status+' '+x.path).join('\n')+'\n');
console.log('CASE_CATALOG',JSON.stringify(counts));for(const v of checks.filter(x=>x.status!==200))console.log('NON_200',v.status,v.path);
if(counts.broken||counts.untitled||counts.free!==15||counts.premium!==85)process.exitCode=1;
