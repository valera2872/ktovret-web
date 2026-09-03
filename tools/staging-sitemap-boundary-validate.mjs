#!/usr/bin/env node
import fs from 'node:fs';

const report=JSON.parse(fs.readFileSync('assets/generated/import-report.json','utf8'));
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
const total=(sitemap.match(/<url>/g)||[]).length;
const fail=message=>{throw new Error(`staging sitemap boundary: ${message}`);};

if(total!==Number(report.indexableUrls)) fail(`sitemap/report mismatch ${total} != ${report.indexableUrls}`);
if(new Set(locs).size!==total) fail(`duplicate URLs: ${locs.length} entries, ${new Set(locs).size} unique`);
if(locs.some(loc=>/\/golovolomki\/[^/]+\/$/.test(loc))) fail('noindex quick puzzle leaked into sitemap');

const specs=[
  ['golovolomki-dlya-detei',Number(report.logicAudienceKids||0)>=8],
  ['igry-dlya-mozga',Number(report.logicAudienceBrain||0)>=8],
  ['detektivnye-golovolomki',Number(report.logicAudienceDetective||0)>=4],
  ['matematicheskie-golovolomki',Number(report.logicAudienceMath||0)>=5],
  ['golovolomki-so-spichkami',Number(report.logicAudienceMatches||0)>=8],
];
let published=0;
for(const [route,shouldPublish] of specs){
  const matches=locs.filter(loc=>loc.endsWith(`/${route}/`));
  if(matches.length>1) fail(`${route}: duplicate collection URL`);
  const inSitemap=matches.length===1;
  if(inSitemap!==shouldPublish) fail(`${route}: sitemap=${inSitemap}, expected=${shouldPublish}`);
  if(inSitemap) published+=1;
}
if(published!==Number(report.logicAudiencePages||0)) fail(`published collection count ${published} != report ${report.logicAudiencePages}`);

console.log(JSON.stringify({ok:true,indexableUrls:total,approvedCollectionRoutes:published,quickPuzzleUrlsInSitemap:0},null,2));