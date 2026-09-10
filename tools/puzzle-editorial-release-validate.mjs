#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const tokens=process.argv.slice(2),args={};
for(let i=0;i<tokens.length;i++) if(tokens[i].startsWith('--')) args[tokens[i].slice(2)]=tokens[i+1]&&!tokens[i+1].startsWith('--')?tokens[++i]:'true';
const root=path.resolve(args.site||'.');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(root,rel));
const assert=(condition,message)=>{if(!condition)throw new Error(`puzzle editorial release: ${message}`)};
const countDirs=rel=>exists(rel)?fs.readdirSync(path.join(root,rel),{withFileTypes:true}).filter(item=>item.isDirectory()).length:0;
const BASE_INDEXABLE_URLS=44;
const canonical=value=>{
  if(Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if(value&&typeof value==='object') return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
};
const fingerprint=value=>crypto.createHash('sha256').update(canonical(value)).digest('hex');

const report=JSON.parse(read('assets/generated/import-report.json'));
const sitemap=read('sitemap.xml');
const home=read('index.html');
const ready=report.logicAudienceEditorialReady===true;

assert(report.logicAudienceEditorialTotal===37,'editorial total must stay 37 for release v2');
assert(Array.isArray(report.logicAudienceEditorialMismatched),'mismatched list missing');
assert(Array.isArray(report.logicAudienceEditorialMissing),'missing list missing');
assert(home.includes('data-logic-home-launch'),'homepage logic launch marker missing');
assert(exists('golovolomki-onlayn/index.html'),'main logic hub missing');
assert(exists('zagadki-na-logiku-dlya-vzroslyh/index.html'),'adult logic hub missing');
assert(exists('logicheskie-zadachi/index.html'),'Expert hub missing');
assert(countDirs('logicheskie-zadachi')===20,'Expert corpus must remain 20 pages');

const collections={
  kids:{route:'golovolomki-dlya-detei',count:Number(report.logicAudienceKids||0),min:8},
  brain:{route:'igry-dlya-mozga',count:Number(report.logicAudienceBrain||0),min:8},
  detective:{route:'detektivnye-golovolomki',count:Number(report.logicAudienceDetective||0),min:4},
  math:{route:'matematicheskie-golovolomki',count:Number(report.logicAudienceMath||0),min:5},
  matches:{route:'golovolomki-so-spichkami',count:Number(report.logicAudienceMatches||0),min:8},
};
const expectedPublished=Object.values(collections).filter(item=>item.count>=item.min);

if(ready){
  assert(Number(report.logicAudienceEditorialExactApproved||0)>0,'ready release requires at least one exact approval');
  assert(Number(report.logicAudiencePuzzles||0)>0,'ready release must expose approved quick puzzles');
  assert(report.logicAudiencePages===expectedPublished.length,'indexable collection route count mismatch');
  assert(report.logicAudienceCollections===expectedPublished.length,'collection count mismatch');
  assert(report.indexableUrls===BASE_INDEXABLE_URLS+expectedPublished.length,'final sitemap count must equal baseline plus strong collections');
  assert(countDirs('golovolomki')===report.logicAudiencePuzzles,'approved quick task directory count mismatch');
  for(const [kind,item] of Object.entries(collections)){
    const shouldPublish=item.count>=item.min;
    if(shouldPublish){
      assert(exists(`${item.route}/index.html`),`published collection missing: ${kind}`);
      assert(sitemap.includes(`<loc>https://mysterylogic.com/${item.route}/</loc>`),`sitemap missing collection: ${kind}`);
      if(kind==='matches'){
        const html=read(`${item.route}/index.html`);
        assert(html.includes('<h1>Головоломки со спичками онлайн</h1>'),'matchstick H1 missing');
        assert(html.includes('data-match-equation=')&&html.includes('matchstick-visual.css')&&html.includes('matchstick-visual.js'),'matchstick visual contract missing');
      }
    }else{
      assert(!exists(`${item.route}/index.html`),`thin collection leaked: ${kind}`);
      assert(!sitemap.includes(`<loc>https://mysterylogic.com/${item.route}/</loc>`),`thin collection leaked to sitemap: ${kind}`);
    }
  }
  assert(!sitemap.includes('https://mysterylogic.com/golovolomki/'),'quick task URLs must not enter sitemap');
  for(const entry of fs.readdirSync(path.join(root,'golovolomki'),{withFileTypes:true})){
    if(!entry.isDirectory())continue;
    const file=`golovolomki/${entry.name}/index.html`;
    assert(exists(file),`quick task missing index: ${entry.name}`);
    assert(read(file).includes('<meta name="robots" content="noindex,follow">'),`quick task must be noindex: ${entry.name}`);
  }
  console.log(`Puzzle editorial release READY: ${report.logicAudiencePuzzles} exact approved tasks; ${expectedPublished.length} strong collections indexable.`);
}else{
  assert(report.logicAudiencePages===0,'locked release must expose zero audience collection routes');
  assert(report.logicAudiencePuzzles===0,'locked release must expose zero quick puzzles');
  assert(report.logicAudienceCollections===0,'locked release must expose zero audience collections');
  assert(report.indexableUrls===BASE_INDEXABLE_URLS,'locked release must remain at the baseline indexable URL count');
  assert(!exists('golovolomki'),'locked release must not contain quick puzzle directory');
  for(const item of Object.values(collections)){
    assert(!exists(item.route),`locked release must not contain collection: ${item.route}`);
    assert(!sitemap.includes(`<loc>https://mysterylogic.com/${item.route}/</loc>`),`locked sitemap leaked collection: ${item.route}`);
  }
  assert(!sitemap.includes('https://mysterylogic.com/golovolomki/'),'locked sitemap leaked quick puzzles');
  console.log(`Puzzle editorial release LOCKED: ${report.logicAudienceEditorialExactApproved||0}/37 exact approvals; no publishable approved subset.`);
}

const productionWhoLiedGate=process.env.GITHUB_WORKFLOW==='Build Mystery Logic production bundle for Beget'&&process.env.GITHUB_EVENT_NAME==='push';
if(productionWhoLiedGate){
  assert(exists('content/who-lied-volume-2-supplement.json'),'Who Lied supplement file missing');
  const supplement=JSON.parse(read('content/who-lied-volume-2-supplement.json'));
  const cases=Array.isArray(supplement.cases)?supplement.cases:[];
  assert(cases.length===10,'Who Lied production supplement must contain exactly 10 reviewed cases');
  const response=await fetch('https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/puzzle-editorial?mode=approved-manifest&kind=who_lied_case',{headers:{accept:'application/json'}});
  assert(response.ok,`Who Lied approval manifest unavailable: HTTP ${response.status}`);
  const manifest=await response.json();
  assert(manifest?.kind==='who_lied_case','Who Lied approval manifest kind mismatch');
  assert(Number(manifest?.count||0)===10,'Who Lied production release requires exactly 10 approved cases');
  const approved=new Set((manifest.puzzles||[]).map(item=>String(item.fingerprint||'')));
  for(const item of cases){
    assert(approved.has(fingerprint(item)),`unapproved Who Lied case in production supplement: ${item.id||item.title||'unknown'}`);
  }
  console.log('Who Lied editorial gate READY: all 10 production supplement cases match owner-approved drafts.');
}