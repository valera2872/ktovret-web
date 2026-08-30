#!/usr/bin/env node
import fs from 'node:fs';

const report=JSON.parse(fs.readFileSync('assets/generated/import-report.json','utf8'));
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
const total=(sitemap.match(/<url>/g)||[]).length;
const fail=message=>{throw new Error(`staging sitemap boundary: ${message}`);};

if(total!==Number(report.indexableUrls)) fail(`sitemap/report mismatch ${total} != ${report.indexableUrls}`);
if(new Set(locs).size!==total) fail(`duplicate URLs: ${locs.length} entries, ${new Set(locs).size} unique`);
const expected=133+Number(report.logicAudiencePages||0);
if(total!==expected) fail(`expected baseline 133 + ${report.logicAudiencePages||0} approved collection routes = ${expected}, found ${total}`);
if(locs.some(loc=>/\/golovolomki\/[^/]+\/$/.test(loc))) fail('noindex quick puzzle leaked into sitemap');
if(locs.some(loc=>loc.endsWith('/golovolomki-so-spichkami/'))) fail('matchstick collection leaked into sitemap');

const specs=[
  ['golovolomki-dlya-detei',Number(report.logicAudienceKids||0)>=8],
  ['igry-dlya-mozga',Number(report.logicAudienceBrain||0)>=8],
  ['detektivnye-golovolomki',Number(report.logicAudienceDetective||0)>=4],
  ['matematicheskie-golovolomki',Number(report.logicAudienceMath||0)>=5],
];
for(const [route,shouldPublish] of specs){
  const inSitemap=locs.some(loc=>loc.endsWith(`/${route}/`));
  if(inSitemap!==shouldPublish) fail(`${route}: sitemap=${inSitemap}, expected=${shouldPublish}`);
}

console.log(JSON.stringify({ok:true,indexableUrls:total,approvedCollectionRoutes:Number(report.logicAudiencePages||0),quickPuzzleUrlsInSitemap:0,matchstickCollection:false},null,2));