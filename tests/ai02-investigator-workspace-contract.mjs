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
  'injectMobileEvidenceDrawer',
  'renderMobileEvidenceDrawer',
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
assert.ok(js.includes('Опорные материалы'),'final evidence selection missing');
assert.ok(!js.includes('кто авторизовал постановку QC-файла'),'scene hotspot must not hand the player the decisive attribution query');
assert.ok(js.includes('Проверь рабочую станцию Studio 3: какие действия и системные события зарегистрированы в критический период?'),'console hotspot must stay generic before the playback twist');
assert.ok(!js.includes("['console','Консоль','Проверь рабочую станцию и очередь воспроизведения QC-файлов.']"),'console hotspot must not name the playback queue');
assert.ok(!js.includes("['audio','Аудио','Проверь QC_031"),'audio hotspot must not name undiscovered QC_031');
assert.ok(!js.includes('Надёжность: '+"'"+'+esc(meta.reliability)'), 'UI must not score evidence reliability for the player');
assert.ok(js.includes('До начала расследования'),'difficulty must be presented before the investigation starts');
assert.ok(js.includes('Выберите уровень сложности'),'prestart difficulty heading missing');
assert.ok(js.includes('Канон, виновный и набор фактов одинаковы'),'difficulty explanation must state what does not change');
assert.ok(js.includes('setupAutoStart'),'selected difficulty must survive the case-variant reload into start');
assert.ok(!js.includes("const tools=qs('[data-investigation-tools]');\n  const tabs=qs('[data-ai02-investigation-tabs]');\n  if(tools)"),'difficulty must not be placed inside investigation tools');
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
assert.ok(css.includes('.ai02-prestart-difficulty'),'prestart difficulty styles missing');
assert.ok(css.includes('.ai02-prestart-difficulty-grid'),'prestart difficulty cards missing');

console.log('AI-02 investigator workspace contract OK');

assert.ok(js.includes('data-ai02-mobile-evidence-trigger'),'mobile evidence trigger missing');
assert.ok(js.includes('data-ai02-mobile-evidence-id'),'mobile evidence selection missing');
assert.ok(css.includes('.ai02-mobile-evidence-drawer'),'mobile evidence drawer styles missing');
assert.ok(css.includes('@media(max-width:800px)'),'mobile evidence drawer must be mobile-scoped');
