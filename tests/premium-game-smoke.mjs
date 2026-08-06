import fs from 'node:fs';
import assert from 'node:assert/strict';

const css=fs.readFileSync(new URL('../assets/premium-game.css',import.meta.url),'utf8');
const generator=fs.readFileSync(new URL('../tools/import-mobile/case-pages.mjs',import.meta.url),'utf8');

assert.ok(css.includes('.ktv-timeline-item:only-child'));
assert.ok(css.includes('repeat(auto-fit,minmax'));
assert.ok(css.includes('.ktv-workspace'));
assert.ok(css.includes('.ktv-answer'));
assert.ok(css.includes('.ktv-result'));
assert.ok(!css.includes('repeat(7'));
assert.ok(generator.includes('premium-game.css?v=${version}'));
assert.ok(generator.includes("const version = '1.2.0'"));
assert.ok(generator.includes('class="ktv-case-page"'));
assert.ok(generator.includes('data-premium-game="1.2"'));

console.log('premium game UI smoke checks passed');
