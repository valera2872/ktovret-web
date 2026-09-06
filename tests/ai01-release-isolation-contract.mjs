import fs from 'node:fs';
import assert from 'node:assert/strict';

const production=fs.readFileSync('.github/workflows/production-beget.yml','utf8');
const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const promo=fs.readFileSync('assets/ai01-launch-promo.js','utf8');

assert.ok(production.includes('production-web/admin/ai01-live-preview'),'owner Live preview must stay stripped from production');
assert.ok(production.includes('production-web/assets/ai-liveavatar-factory.js'),'LiveAvatar factory must stay stripped from production');
assert.ok(!html.includes('admin/ai01-live-preview'),'public AI-01 must not link into owner preview');
assert.ok(promo.includes("path.includes('/admin/')"),'sitewide promo must skip admin');
assert.ok(html.includes('<meta name="robots" content="noindex,follow">'),'initial public cohort remains isolated from indexing');

console.log('AI-01 release isolation contract OK');