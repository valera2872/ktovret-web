#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applySoloPaidInvestigations } from './import-mobile/solo-paid-investigations-postprocess.mjs';

const fail=(m)=>{throw new Error(`solo paid investigations validation: ${m}`)};
const sourceDir='content/solo-investigations/volume-1';
const files=fs.readdirSync(sourceDir).filter(n=>/^case-\d+\.json$/.test(n)).sort();
if(files.length!==10)fail(`expected 10 source cases, got ${files.length}`);
const ids=new Set();
for(const name of files){
  const item=JSON.parse(fs.readFileSync(path.join(sourceDir,name),'utf8'));
  if(ids.has(item.id))fail(`duplicate id ${item.id}`);ids.add(item.id);
  if((item.answerStages||[]).length<3)fail(`${name}: needs >=3 answer stages`);
  if((item.facts||[]).length<5)fail(`${name}: needs >=5 facts`);
  if((item.timeline||[]).length<5)fail(`${name}: needs >=5 timeline events`);
  if((item.explanation?.reasoningSteps||[]).length<6)fail(`${name}: needs >=6 reasoning steps`);
}
for(const required of ['assets/solo-paid-access-config.js','assets/solo-investigations-checkout.js','assets/solo-investigations-player.js','assets/solo-paid-investigations.css','tools/release/generate-solo-v1-supabase-seed.mjs'])if(!fs.existsSync(required))fail(`missing ${required}`);
const cfg=fs.readFileSync('assets/solo-paid-access-config.js','utf8');
if(!cfg.includes("productId:'solo_investigations_v1'"))fail('wrong product id');
if(!cfg.includes('priceRub:99'))fail('wrong price');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-solo-paid-'));
try{
  fs.mkdirSync(path.join(tmp,'detektivnye-igry-dlya-odnogo'),{recursive:true});
  fs.writeFileSync(path.join(tmp,'detektivnye-igry-dlya-odnogo/index.html'),'<html><head></head><body><section class="solo407-kv"></section></body></html>');
  fs.mkdirSync(path.join(tmp,'content/solo-investigations/volume-1'),{recursive:true});
  for(const name of files)fs.copyFileSync(path.join(sourceDir,name),path.join(tmp,sourceDir,name));
  const result=applySoloPaidInvestigations(tmp);
  if(result.cases!==10||result.priceRub!==99)fail('generator result mismatch');
  const hub=path.join(tmp,'detektivnye-igry-dlya-odnogo/rassledovaniya/index.html');
  if(!fs.existsSync(hub))fail('hub not generated');
  const html=fs.readFileSync(hub,'utf8');
  if(!html.includes('Открыть Том I за 99 ₽'))fail('checkout copy missing');
  const routes=fs.readdirSync(path.dirname(hub),{withFileTypes:true}).filter(d=>d.isDirectory()).length;
  if(routes!==10)fail(`expected 10 case routes, got ${routes}`);
}finally{fs.rmSync(tmp,{recursive:true,force:true});}
console.log(JSON.stringify({ok:true,cases:10,productId:'solo_investigations_v1',priceRub:99,publicationGate:'owner-authorized-release'},null,2));
