'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/generated/cases-index.json'),'utf8'));
const report=JSON.parse(fs.readFileSync(path.join(root,'assets/generated/import-report.json'),'utf8'));

assert.equal(catalog.totalCases,100);
assert.equal(catalog.freeCount,15);
assert.equal(catalog.premiumCount,85);
assert.equal(catalog.cases.length,100);
assert.equal(catalog.freeCases.length,15);
assert.equal(new Set(catalog.cases.map(item=>item.id)).size,100);
assert.equal(new Set(catalog.cases.map(item=>item.path)).size,100);
assert.equal(report.witnessEnhancedPages,report.mode==='editorial'?100:15);

global.KtoVretCatalog=catalog;
delete require.cache[require.resolve('../assets/dossier-model.js')];
const model=require('../assets/dossier-model.js');
assert.equal(model.cases.length,15);
const empty={getItem:()=>null,removeItem:()=>undefined};
assert.equal(model.summarize(model.readRecords(empty)).totalCases,15);

const premiumGamePath=path.join(root,'assets/premium-game.css');
assert.ok(fs.existsSync(premiumGamePath),'premium game stylesheet is missing');
const premiumGameCss=fs.readFileSync(premiumGamePath,'utf8');
assert.ok(premiumGameCss.includes('repeat(auto-fit,minmax'),'premium editorial timeline base is missing');
assert.ok(!premiumGameCss.includes('repeat(7'),'premium layer must not force seven empty timeline columns');
assert.ok(premiumGameCss.includes('.ktv-timeline-item:only-child'),'single-event dossier styling is missing');
assert.ok(premiumGameCss.includes('.ktv-workspace'),'investigator workspace layout is missing');
assert.ok(premiumGameCss.includes('.ktv-answer'),'version board styling is missing');

const compatPath=path.join(root,'assets/premium-game-compat.css');
assert.ok(fs.existsSync(compatPath),'premium compatibility stylesheet is missing');
const compatCss=fs.readFileSync(compatPath,'utf8');
assert.ok(compatCss.includes('grid-template-columns:minmax(0,1fr)!important'),'hard full-width timeline grid is missing');
assert.ok(compatCss.includes('grid-column:1 / -1!important'),'timeline item must span the complete dossier width');
assert.ok(compatCss.includes('width:100%!important'),'timeline/card full-width rule is missing');
assert.ok(!compatCss.includes(':has(.ktv-timeline-item:nth-child(2))'),'hard compatibility layer must not depend on :has');
assert.ok(compatCss.includes('position:relative!important'),'desktop non-overlapping stage navigation rule is missing');

const witnessCssPath=path.join(root,'assets/witness-cycle.css');
assert.ok(fs.existsSync(witnessCssPath),'witness/cycle stylesheet is missing');
const witnessCss=fs.readFileSync(witnessCssPath,'utf8');
assert.ok(witnessCss.includes('.ktv-witness-switcher'),'witness switcher styles are missing');
assert.ok(witnessCss.includes('.ktv-witness-tab.is-linked-to-version'),'selected witness linkage style is missing');
assert.ok(witnessCss.includes('.ktv-stage-nav button.is-current'),'active investigation stage style is missing');
assert.ok(witnessCss.includes('.ktv-selected-version-summary'),'selected-version summary style is missing');
assert.ok(witnessCss.includes('overflow-wrap:anywhere'),'long-content protection is missing');

const adapter=fs.readFileSync(path.join(root,'assets/case-adapter.js'),'utf8');
assert.ok(adapter.includes('data-witness-id'),'individual witness interaction is missing');
assert.ok(adapter.includes('role="tablist"'),'accessible witness tablist is missing');
assert.ok(adapter.includes('Выбран в версии'),'witness/version linkage copy is missing');
assert.ok(adapter.includes('Проверить версию'),'clear version-check CTA is missing');
assert.ok(adapter.includes('IntersectionObserver'),'active stage observer is missing');
assert.ok(adapter.includes('ktv-stage-continue'),'stage-to-stage transitions are missing');
assert.ok(adapter.includes('ktv-cycle-result-note'),'result confirmation block is missing');

let multiWitnessPages=0;
let witnessPages=0;
for(const item of catalog.freeCases){
  const pagePath=path.join(root,item.path,'index.html');
  assert.ok(fs.existsSync(pagePath),`missing free page ${item.path}`);
  const html=fs.readFileSync(pagePath,'utf8');
  assert.ok(html.includes('witness-cycle.css?v=1.4.0'),`witness/cycle UI is not connected to ${item.path}`);
  assert.ok(html.includes('case-adapter.js?v=1.4.0'),`fresh case adapter is not connected to ${item.path}`);
  assert.ok(html.includes('data-witness-ui="1.3"'),`witness UI marker is missing in ${item.path}`);
  assert.ok(html.includes('data-cycle-polish="1.4"'),`cycle polish marker is missing in ${item.path}`);
  assert.ok(html.includes('class="ktv-case-page"'),`case page body class is missing in ${item.path}`);

  const match=html.match(/window\.KtoVretWeb=(\{.*?\});window\.KtoVretWeb\.permalink=location\.href;/s);
  assert.ok(match,`generated config is missing in ${item.path}`);
  const config=JSON.parse(match[1]);
  const characters=config.case.characters||[];
  assert.equal(characters.length,item.witnessCount,`witness count drift in ${item.path}`);
  assert.equal(Number(root?html.match(/data-witness-count="(\d+)"/)?.[1]:-1),item.witnessCount,`witness marker drift in ${item.path}`);
  characters.forEach((character)=>{
    assert.ok(character.id,`witness id missing in ${item.path}`);
    assert.ok(character.name,`witness name missing in ${item.path}`);
    assert.equal(typeof character.statement,'string',`witness statement type invalid in ${item.path}`);
  });
  if(characters.length){witnessPages+=1;assert.ok(!characters.some(character=>character.id==='dossier'&&character.name==='Показания'),`collapsed testimony leaked into ${item.path}`);}
  if(characters.length>1)multiWitnessPages+=1;

  const appIndex=html.indexOf('ktovret-game/assets/app.js');
  const performanceIndex=html.indexOf('ktovret-game/assets/performance.js');
  const adapterIndex=html.indexOf('assets/case-adapter.js');
  assert.ok(appIndex>=0&&performanceIndex>appIndex&&adapterIndex>performanceIndex,`stable script order changed in ${item.path}`);
}
assert.ok(witnessPages>0,'free dossier unexpectedly has no witness-based cases');
assert.ok(multiWitnessPages>0,'free dossier unexpectedly has no multi-witness cases');

for(const item of catalog.cases.filter(entry=>entry.access==='premium')){
  const html=fs.readFileSync(path.join(root,item.path,'index.html'),'utf8');
  assert.ok(!html.includes('window.KtoVretWeb='),`premium case leaked into ${item.path}`);
  assert.ok(!html.includes('witness-cycle.css'),`interactive witness layer leaked into locked ${item.path}`);
}

console.log(`generated library tests passed: 100 total, 15 free, ${witnessPages} witness cases, ${multiWitnessPages} multi-witness, 85 locked`);
