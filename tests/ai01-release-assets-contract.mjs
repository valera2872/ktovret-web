import fs from 'node:fs';
import assert from 'node:assert/strict';
for(const file of ['assets/ai01-static-portraits.css','assets/ai01-static-portraits.js','assets/ai01-suspects-strip.b64.txt','assets/ai01-voice-input.css','assets/ai01-voice-input.js','assets/ai01-launch-promo.css','assets/ai01-launch-promo.js']){
  assert.ok(fs.existsSync(file),`release asset missing: ${file}`);
}
console.log('AI-01 release assets contract OK');