#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const tokens=process.argv.slice(2),args={};
for(let i=0;i<tokens.length;i++) if(tokens[i].startsWith('--')) args[tokens[i].slice(2)]=tokens[i+1]&&!tokens[i+1].startsWith('--')?tokens[++i]:'true';
const root=path.resolve(args.site||'.');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(root,rel));
const assert=(condition,message)=>{if(!condition)throw new Error(`puzzle editorial release: ${message}`)};
const countDirs=rel=>exists(rel)?fs.readdirSync(path.join(root,rel),{withFileTypes:true}).filter(item=>item.isDirectory()).length:0;

const report=JSON.parse(read('assets/generated/import-report.json'));
const sitemap=read('sitemap.xml');
const home=read('index.html');
const ready=report.logicAudienceEditorialReady===true;

assert(report.logicAudienceEditorialTotal===33,'editorial total must stay 33 for release v1');
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
};
const expectedPublished=Object.values(collections).filter(item=>item.count>=item.min);

if(ready){
  assert(Number(report.logicAudienceEditorialExactApproved||0)>0,'ready release requires at least one exact approval');
  assert(Number(report.logicAudiencePuzzles||0)>0,'ready release must expose approved quick puzzles');
  assert(report.logicAudiencePages===expectedPublished.length,'indexable collection route count mismatch');
  assert(report.logicAudienceCollections===expectedPublished.length,'collection count mismatch');
  assert(report.logicAudienceMatches===0,'matchstick puzzles must stay outside current public release');
  assert(report.indexableUrls===49+expectedPublished.length,'final sitemap count must equal baseline plus strong collections');
  assert(countDirs('golovolomki')===report.logicAudiencePuzzles,'approved quick task directory count mismatch');
  for(const [kind,item] of Object.entries(collections)){
    const shouldPublish=item.count>=item.min;
    if(shouldPublish){
      assert(exists(`${item.route}/index.html`),`published collection missing: ${kind}`);
      assert(sitemap.includes(`<loc>https://mysterylogic.com/${item.route}/</loc>`),`sitemap missing collection: ${kind}`);
    }else{
      assert(!exists(`${item.route}/index.html`),`thin collection leaked: ${kind}`);
      assert(!sitemap.includes(`<loc>https://mysterylogic.com/${item.route}/</loc>`),`thin collection leaked to sitemap: ${kind}`);
    }
  }
  assert(!exists('golovolomki-so-spichkami/index.html'),'matchstick collection must not publish');
  assert(!sitemap.includes('<loc>https://mysterylogic.com/golovolomki-so-spichkami/</loc>'),'matchstick collection leaked to sitemap');
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
  assert(report.indexableUrls===49,'locked release must remain at 49 indexable URLs');
  assert(!exists('golovolomki'),'locked release must not contain quick puzzle directory');
  for(const item of Object.values(collections)){
    assert(!exists(item.route),`locked release must not contain collection: ${item.route}`);
    assert(!sitemap.includes(`<loc>https://mysterylogic.com/${item.route}/</loc>`),`locked sitemap leaked collection: ${item.route}`);
  }
  assert(!exists('golovolomki-so-spichkami'),'locked release must not contain matchstick collection');
  assert(!sitemap.includes('https://mysterylogic.com/golovolomki/'),'locked sitemap leaked quick puzzles');
  console.log(`Puzzle editorial release LOCKED: ${report.logicAudienceEditorialExactApproved||0}/33 exact approvals; no publishable approved subset.`);
}