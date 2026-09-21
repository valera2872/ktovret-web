import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {items,scales} from '../assets/cognitive-profile-preview-data.mjs';

assert.equal(items.length,24,'24 launch items required');
assert.equal(new Set(items.map(x=>x.id)).size,24,'item ids must be unique');

for(const item of items){
  assert.ok(scales[item.scale],`unknown scale ${item.id}`);
  assert.equal(item.options.length,4,`${item.id}: exactly four options`);
  assert.ok(Number.isInteger(item.correct)&&item.correct>=0&&item.correct<4,`${item.id}: valid key`);
}

for(const key of Object.keys(scales)){
  assert.equal(items.filter(x=>x.scale===key).length,4,`${key}: exactly four items`);
}

assert.ok(items.filter(x=>x.visual).length>=14,'at least 14 visual/diagram items');
assert.equal(items.find(x=>x.id==='P1').options[items.find(x=>x.id==='P1').correct],'Контурный треугольник с 3 точками');
assert.equal(items.find(x=>x.id==='D4').options[items.find(x=>x.id==='D4').correct],'12543');
assert.equal(items.find(x=>x.id==='N4').options[items.find(x=>x.id==='N4').correct],'27');

console.log(JSON.stringify({
  ok:true,
  items:items.length,
  scales:Object.keys(scales).length,
  visual:items.filter(x=>x.visual).length
},null,2));

const previewHtml=readFileSync(new URL('../admin/cognitive-profile-preview/index.html',import.meta.url),'utf8');
const runtime=readFileSync(new URL('../assets/cognitive-profile-preview.mjs',import.meta.url),'utf8');
assert.match(previewHtml,/id="resultTime"/);
assert.match(previewHtml,/id="resultAnswered"/);
assert.match(previewHtml,/https:\/\/mysterylogic\.com\/detektivnye-igry-dlya-odnogo\//);
assert.match(previewHtml,/Выбрать бесплатное расследование/);
assert.match(runtime,/scaleNotes=/);
assert.match(runtime,/resultAnswered/);

assert.match(previewHtml,/reference-archive-hero\.svg/);
assert.match(previewHtml,/real-investigations-hero\.svg/);
