import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const css=fs.readFileSync('assets/ai01-static-portraits.css','utf8');
const js=fs.readFileSync('assets/ai01-static-portraits.js','utf8');
const data=fs.readFileSync('assets/ai01-suspects-strip.b64.txt','utf8').trim();

assert.ok(html.includes('data-ai01-static-portrait'),'portrait layer is missing from AI-01');
assert.ok(html.includes('data-avatar-video'),'Live-compatible video layer must remain present');
assert.ok(css.includes('background-size:300% 100%'),'three-person sprite mapping missing');
for(const suspect of ['marina','anton','lev'])assert.ok(css.includes(`data-suspect="${suspect}"`),`portrait mapping missing: ${suspect}`);
assert.ok(js.includes("fetch('../assets/ai01-suspects-strip.b64.txt'"),'portrait data loader missing');
assert.ok(js.includes("stage.hidden=false"),'Text mode must expose portrait stage');
assert.ok(js.includes("has-live-video"),'private Live overlay compatibility missing');
assert.ok(data.length>20000,'portrait payload too small');
assert.match(data,/^[A-Za-z0-9+/=]+$/,'portrait payload is not base64');

console.log('AI-01 static portraits contract OK');