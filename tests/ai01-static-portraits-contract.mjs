import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const css=fs.readFileSync('assets/ai01-static-portraits.css','utf8');
const js=fs.readFileSync('assets/ai01-static-portraits.js','utf8');
const image=fs.readFileSync('assets/ai01-suspects-strip.jpg');

assert.ok(html.includes('data-ai01-static-portrait'),'portrait layer is missing from AI-01');
assert.ok(html.includes('data-avatar-video'),'Live-compatible video layer must remain present');
assert.ok(css.includes('background-size:300% 100%'),'three-person sprite mapping missing');
for(const suspect of ['marina','anton','lev'])assert.ok(css.includes(`data-suspect="${suspect}"`),`portrait mapping missing: ${suspect}`);
assert.ok(js.includes("ai01-suspects-strip.jpg"),'portrait image loader missing');
assert.ok(js.includes("stage.hidden=false"),'Text mode must expose portrait stage');
assert.ok(js.includes("has-live-video"),'private Live overlay compatibility missing');
assert.ok(image.length>10000,'portrait image too small');
assert.deepEqual([...image.subarray(0,3)],[0xff,0xd8,0xff],'portrait image is not JPEG');

console.log('AI-01 static portraits contract OK');