import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('staging-previews/ai02/index.html','utf8');
const css=fs.readFileSync('assets/ai02-premium.css','utf8');
const js=fs.readFileSync('assets/ai02-investigator-workspace.js','utf8');

assert.ok(html.includes('ai02-investigator-workspace.js'),'investigator layer must be connected to AI-02 staging');
for(const id of ['AI02-NK-EASY','AI02-NK-STANDARD','AI02-NK-HARD'])assert.ok(js.includes(id),'all three server difficulty variants must be exposed');

const features=[
  'injectDifficulty',
  'injectInvestigationTabs',
  'injectSceneHotspots',
  'renderTimeline',
  'renderBoard',
  'injectInterrogationActions',
  'renderStatementHistory',
  'injectNotebook',
  'injectReconstruction'
];
for(const feature of features)assert.ok(js.includes('function '+feature),'missing investigator feature '+feature);

assert.ok(js.includes("data-ai02-subview=\"timeline\"")||js.includes('data-ai02-subview="timeline"'),'timeline control missing');
assert.ok(js.includes('Доска расследования'),'investigation board missing');
assert.ok(js.includes('Связать факты'),'manual contradiction/link builder missing');
assert.ok(js.includes('Рабочая версия'),'working hypotheses missing');
assert.ok(js.includes('Протокол показаний'),'statement history missing');
assert.ok(js.includes('Предъявить улику'),'evidence confrontation action missing');
assert.ok(js.includes('Прижать противоречием'),'contradiction pressure action missing');
assert.ok(js.includes('КАК СКРЫВАЛ'),'structured reconstruction missing');
assert.ok(js.includes('Ключевые доказательства'),'final evidence selection missing');
assert.ok(js.includes('Показываются только уже открытые факты'),'timeline must be discovery-only');
assert.ok(!/E\d{2}/.test(js),'public investigator layer must not hard-code private evidence IDs');

const marker='/* 2026-10-03 investigator workspace';
const idx=css.indexOf(marker);
assert.ok(idx>=0,'investigator CSS marker missing');
const investigatorCss=css.slice(idx);
assert.ok(!/\.aid-app\s*\{/.test(investigatorCss),'investigator layer must not redefine approved app shell');
assert.ok(!/\.aid-workspace\s*\{/.test(investigatorCss),'investigator layer must not redefine approved workspace grid');
assert.ok(investigatorCss.includes('.ai02-board-grid'),'board styles missing');
assert.ok(investigatorCss.includes('.ai02-reconstruction'),'reconstruction styles missing');

console.log('AI-02 investigator workspace contract OK');
