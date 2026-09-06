import fs from 'node:fs';
import assert from 'node:assert/strict';

const promo=fs.readFileSync('assets/ai01-launch-promo.js','utf8');
const post=fs.readFileSync('tools/import-mobile/logic-sitewide-postprocess.mjs','utf8');

assert.match(promo,/const PUBLIC_LAUNCH = true;/,'AI-01 promo must be public in release candidate');
assert.ok(promo.includes("path.includes('/admin/')"),'admin routes must be excluded');
assert.ok(promo.includes('/detektivnaya-igra-s-ii/'),'AI-01 target route missing');
assert.ok(promo.includes('голосом или текстом'),'public value proposition must mention voice or text');
assert.ok(post.includes("const VERSION='3.3.1'"),'sitewide cache-bust version not bumped');
assert.ok(post.includes('ai01PromoPublic:true'),'sitewide build report must mark AI-01 promo public');
assert.ok(post.includes('data-ai01-launch-promo-style'),'promo stylesheet injection missing');
assert.ok(post.includes('data-ai01-launch-promo-script'),'promo script injection missing');

console.log('AI-01 sitewide launch contract OK');