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

const audienceCollections=[
  'golovolomki-dlya-detei',
  'igry-dlya-mozga',
  'detektivnye-golovolomki',
  'matematicheskie-golovolomki',
  'golovolomki-so-spichkami',
];

if(ready){
  assert(report.logicAudienceEditorialExactApproved===33,'ready release requires 33 exact approvals');
  assert(report.logicAudiencePages===38,'ready release must expose 38 audience routes');
  assert(report.logicAudiencePuzzles===33,'ready release must expose 33 quick puzzles');
  assert(report.logicAudienceCollections===5,'ready release must expose 5 collections');
  assert(report.logicAudienceKids===22,'kids count mismatch');
  assert(report.logicAudienceBrain===29,'brain count mismatch');
  assert(report.logicAudienceDetective===8,'detective count mismatch');
  assert(report.logicAudienceMath===14,'math count mismatch');
  assert(report.logicAudienceMatches===8,'matches count mismatch');
  assert(report.indexableUrls===87,'Beget ready release must have 87 indexable URLs');
  assert(countDirs('golovolomki')===33,'ready release must contain 33 quick puzzle directories');
  for(const route of audienceCollections){
    assert(exists(`${route}/index.html`),`ready collection missing: ${route}`);
    assert(sitemap.includes(`<loc>https://mysterylogic.com/${route}/</loc>`),`ready sitemap missing: ${route}`);
  }
  assert(exists('golovolomki/tri-korobki/index.html'),'ready first puzzle missing');
  assert(exists('golovolomki/spichki-1-6-5/index.html'),'ready match puzzle missing');
  assert(sitemap.includes('<loc>https://mysterylogic.com/golovolomki/tri-korobki/</loc>'),'ready puzzle sitemap missing');
  console.log('Puzzle editorial release READY: 33/33 exact owner approvals.');
}else{
  assert(report.logicAudiencePages===0,'pending release must expose zero audience routes');
  assert(report.logicAudiencePuzzles===0,'pending release must expose zero quick puzzles');
  assert(report.logicAudienceCollections===0,'pending release must expose zero audience collections');
  assert(report.indexableUrls===49,'Beget pending release must remain at 49 indexable URLs');
  assert(!exists('golovolomki'),'pending release must not contain quick puzzle directory');
  for(const route of audienceCollections){
    assert(!exists(route),`pending release must not contain collection: ${route}`);
    assert(!sitemap.includes(`<loc>https://mysterylogic.com/${route}/</loc>`),`pending sitemap leaked collection: ${route}`);
  }
  assert(!sitemap.includes('https://mysterylogic.com/golovolomki/'),'pending sitemap leaked quick puzzles');
  console.log(`Puzzle editorial release LOCKED: ${report.logicAudienceEditorialExactApproved||0}/33 exact approvals; public quick puzzle pages excluded.`);
}
