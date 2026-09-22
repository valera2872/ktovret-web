import assert from 'node:assert/strict';
import {logicAudiencePuzzles} from '../tools/import-mobile/logic-audience-data.mjs';
import {logicAudienceChunk6} from '../tools/import-mobile/logic-audience-chunk-6.mjs';
import {puzzleBatch as previewBatch} from '../assets/puzzles-q38-q49-preview-data.mjs';
import {puzzleFingerprint} from '../tools/import-mobile/puzzle-editorial-gate.mjs';

assert.equal(logicAudiencePuzzles.length,49,'full quick corpus must contain Q01-Q49');
assert.equal(logicAudienceChunk6.length,12,'chunk 6 must contain Q38-Q49');

const ids=logicAudiencePuzzles.map(p=>p.id);
const slugs=logicAudiencePuzzles.map(p=>p.slug);
assert.equal(new Set(ids).size,49,'quick IDs must be unique');
assert.equal(new Set(slugs).size,49,'quick slugs must be unique');
assert.deepEqual(logicAudienceChunk6.map(p=>p.id),Array.from({length:12},(_,i)=>`quick:${String(38+i).padStart(3,'0')}`));

const fingerprints=logicAudiencePuzzles.map(puzzleFingerprint);
assert.equal(new Set(fingerprints).size,49,'each current source object must have a unique fingerprint');

const previewById=new Map(previewBatch.map(p=>[p.id,p]));
for(const src of logicAudienceChunk6){
  const preview=previewById.get(src.id);
  assert.ok(preview,`preview missing ${src.id}`);
  for(const key of ['slug','number','title','skill','difficulty','time','prompt','hint','explanation']){
    assert.equal(src[key],preview[key],`${src.id} diverged on ${key}`);
  }
  assert.deepEqual(src.collections,preview.collections,`${src.id} collections diverged`);
  assert.deepEqual(src.choices,preview.choices,`${src.id} fallback choices diverged`);
  assert.equal(typeof src.answer,'string',`${src.id} editorial answer must be text`);
  assert.ok(src.answerMode,`${src.id} answerMode missing`);
  assert.ok(src.answerSpec&&typeof src.answerSpec==='object',`${src.id} answerSpec missing`);
}

const directAnswers={
  'quick:038':'→ · точка справа сверху · 3 штриха',
  'quick:039':'Жетон X не латунный',
  'quick:040':'D3, на юг',
  'quick:041':'92',
  'quick:042':'Лист B находился под листом A, когда писали записку',
  'quick:043':'A → C → B → D → E',
  'quick:044':'Горизонтальная линия — и диагональ /',
  'quick:045':'K и 7',
  'quick:046':'С 12:00 до 13:00 не было ни одного полного рабочего цикла',
  'quick:047':'В момент появления кофейного круга лист был развёрнут',
  'quick:048':'1'
};
for(const [id,answer] of Object.entries(directAnswers)){
  const p=logicAudienceChunk6.find(x=>x.id===id);
  assert.equal(p.answer,answer,`${id} answer text drifted`);
  assert.ok(p.choices.includes(answer),`${id} fallback choices do not contain the canonical answer`);
}
const q49=logicAudienceChunk6.find(p=>p.id==='quick:049');
assert.equal(q49.answerMode,'weigh_counts');
assert.equal(q49.answerSpec.constraint,'four_distinct_positive_integers');
assert.deepEqual(q49.answerSpec.example,{A:1,B:2,C:3,D:4});
assert.match(q49.answer,/разные положительные количества/);

console.log(JSON.stringify({
  ok:true,
  total:logicAudiencePuzzles.length,
  chunk6:logicAudienceChunk6.length,
  fingerprints:new Set(fingerprints).size,
  ids:new Set(ids).size,
  slugs:new Set(slugs).size
},null,2));

const adminJs=readFileSync(new URL('../assets/puzzle-admin.js',import.meta.url),'utf8');
const adminHtml=readFileSync(new URL('../admin/puzzles/index.html',import.meta.url),'utf8');
assert.match(adminJs,/const ANSWER_MODES =/);
assert.match(adminJs,/route_builder: 'Построить маршрут'/);
assert.match(adminJs,/weigh_counts: 'Стратегия взвешивания'/);
assert.match(adminJs,/Самостоятельный ответ:/);
assert.match(adminJs,/filterRows\(rows\)\.length === 0/);
assert.match(adminJs,/activeFilter = hasQuick \? 'quick'/);
assert.match(adminHtml,/Quick-задачи на проверке/);
assert.match(adminHtml,/puzzle-admin\.js\?v=1\.4\.0/);
