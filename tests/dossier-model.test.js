'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/generated/cases-index.json'),'utf8'));

assert.equal(catalog.totalCases,100);
assert.equal(catalog.freeCount,15);
assert.equal(catalog.premiumCount,85);
assert.equal(catalog.cases.length,100);
assert.equal(catalog.freeCases.length,15);
assert.equal(new Set(catalog.cases.map(item=>item.id)).size,100);
assert.equal(new Set(catalog.cases.map(item=>item.path)).size,100);

global.KtoVretCatalog=catalog;
delete require.cache[require.resolve('../assets/dossier-model.js')];
const model=require('../assets/dossier-model.js');
assert.equal(model.cases.length,15);
const empty={getItem:()=>null,removeItem:()=>undefined};
assert.equal(model.summarize(model.readRecords(empty)).totalCases,15);

const premiumGamePath=path.join(root,'assets/premium-game.css');
assert.ok(fs.existsSync(premiumGamePath),'premium game stylesheet is missing');
const premiumGameCss=fs.readFileSync(premiumGamePath,'utf8');
assert.ok(premiumGameCss.includes('repeat(auto-fit,minmax'),'timeline must adapt to the real number of events');
assert.ok(!premiumGameCss.includes('repeat(7'),'premium layer must not force seven empty timeline columns');
assert.ok(premiumGameCss.includes('.ktv-timeline-item:only-child'),'single-event dossier layout is missing');
assert.ok(premiumGameCss.includes('.ktv-workspace'),'investigator workspace layout is missing');
assert.ok(premiumGameCss.includes('.ktv-answer'),'version board styling is missing');

const compatPath=path.join(root,'assets/premium-game-compat.css');
assert.ok(fs.existsSync(compatPath),'premium compatibility stylesheet is missing');
const compatCss=fs.readFileSync(compatPath,'utf8');
assert.ok(compatCss.includes('grid-template-columns:minmax(0,1fr)!important'),'single-event full-width rule is missing');
assert.ok(compatCss.includes(':has(.ktv-timeline-item:nth-child(2))'),'two-column timeline rule is missing');
assert.ok(compatCss.includes('position:relative!important'),'desktop non-overlapping stage navigation rule is missing');

for(const item of catalog.freeCases){
  const pagePath=path.join(root,item.path,'index.html');
  assert.ok(fs.existsSync(pagePath),`missing free page ${item.path}`);
  const html=fs.readFileSync(pagePath,'utf8');
  assert.ok(html.includes('premium-game.css?v=1.2.1'),`premium UI is not connected to ${item.path}`);
  assert.ok(html.includes('premium-game-compat.css?v=1.2.1'),`compatibility layer is not connected to ${item.path}`);
  assert.ok(html.includes('class="ktv-case-page"'),`case page body class is missing in ${item.path}`);
  assert.ok(html.includes('data-premium-game="1.2.1"'),`premium interface marker is missing in ${item.path}`);
}

for(const item of catalog.cases.filter(entry=>entry.access==='premium')){
  const html=fs.readFileSync(path.join(root,item.path,'index.html'),'utf8');
  assert.ok(!html.includes('window.KtoVretWeb='),`premium case leaked into ${item.path}`);
}

console.log('generated library tests passed: 100 total, 15 free with premium UI 1.2.1, 85 locked');
