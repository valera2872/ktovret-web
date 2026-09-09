#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { applySoloMiniInvestigations } from './import-mobile/solo-mini-postprocess.mjs';

const fail=(message)=>{throw new Error(`solo mini validation: ${message}`)};
const source=fs.readFileSync('assets/solo-mini-cases.js','utf8');
const sandbox={window:{}};
vm.runInNewContext(source,sandbox,{filename:'solo-mini-cases.js'});
const cases=sandbox.window.MysteryLogicSoloMiniCases;
if(!Array.isArray(cases)||cases.length!==10)fail(`expected 10 cases, got ${cases?.length}`);
if(new Set(cases.map(c=>c.id)).size!==10)fail('duplicate case ids');
if(new Set(cases.map(c=>c.slug)).size!==10)fail('duplicate slugs');
for(const item of cases){
  if(!item.title||!item.intro||!item.scene)fail(`${item.id}: narrative fields missing`);
  if(!Array.isArray(item.evidence)||item.evidence.length!==3)fail(`${item.id}: expected 3 evidence items`);
  if(!Array.isArray(item.suspects)||item.suspects.length!==3)fail(`${item.id}: expected 3 suspects`);
  if(!item.suspects.some(s=>s.id===item.culprit))fail(`${item.id}: culprit is not a suspect`);
  if(!item.checkpoint?.correct||!item.checkpoint?.choices?.some(c=>c[0]===item.checkpoint.correct))fail(`${item.id}: checkpoint answer invalid`);
  if(!Array.isArray(item.reconstruction)||item.reconstruction.length<3)fail(`${item.id}: reconstruction too short`);
}

const root=fs.mkdtempSync(path.join(os.tmpdir(),'ml-solo-mini-'));
try{
  const solo=path.join(root,'detektivnye-igry-dlya-odnogo');
  fs.mkdirSync(solo,{recursive:true});
  fs.writeFileSync(path.join(solo,'index.html'),'<!doctype html><html><head></head><body><main><section class="solo407-kv"><h2 id="solo407-kv-title"><em>«Кто врёт?»</em></h2></section></main></body></html>');
  const result=applySoloMiniInvestigations(root);
  if(result.cases!==10||result.routes.length!==11)fail('generator result counts invalid');
  const hub=fs.readFileSync(path.join(root,'detektivnye-igry-dlya-odnogo/mini/index.html'),'utf8');
  if(!hub.includes('data-solo-mini-hub')||!hub.includes('10 бесплатных дел'))fail('hub markers missing');
  const patched=fs.readFileSync(path.join(solo,'index.html'),'utf8');
  if(!patched.includes('data-solo-mini-bridge')||!patched.includes('href="mini/"'))fail('Solo hub bridge missing');
  for(const item of cases){
    const file=path.join(root,'detektivnye-igry-dlya-odnogo/mini',item.slug,'index.html');
    if(!fs.existsSync(file))fail(`${item.id}: generated page missing`);
    const html=fs.readFileSync(file,'utf8');
    if(!html.includes(`data-case-id="${item.id}"`))fail(`${item.id}: runtime id missing`);
    if(!html.includes('<meta name="description"')||!html.includes('<link rel="canonical"'))fail(`${item.id}: SEO metadata missing`);
  }
}finally{fs.rmSync(root,{recursive:true,force:true})}

console.log(JSON.stringify({ok:true,cases:10,routes:11,evidencePerCase:3,suspectsPerCase:3},null,2));
