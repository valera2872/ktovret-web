import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const page=readFileSync(new URL('realnye-dela/pozharnaya-lestnica-1991-premium/index.html',root),'utf8');
const css=readFileSync(new URL('assets/real-case-moreno-v05-compat.css',root),'utf8');
const brief=readFileSync(new URL('assets/real-case-moreno-v05-brief.js',root),'utf8');

assert.match(page, /class="ml-brand-strip"/);
assert.match(page, /real-case-moreno-sandbox\.css/);
assert.match(page, /real-case-moreno-v6\.css/);
assert.match(page, /real-case-moreno-ai-v6\.js/);
assert.match(page, /real-case-moreno-ai-router-v23\.js/);
assert.match(page, /real-case-moreno-reference-v18\.js/);
assert.match(page, /real-case-moreno-final-v25\.js/);
assert.match(page, /real-case-moreno-final-v25-relaxed\.js/);
assert.match(page, /real-case-moreno-v05-brief\.js/);
assert.match(page, /rel="canonical"/);
assert.doesNotMatch(page,/class="ref10-topbar"/);
assert.doesNotMatch(page,/real-case-moreno-intro-v20\.js/);
assert.doesNotMatch(page,/real-case-moreno-reference-v11\.js/);
assert.doesNotMatch(page,/real-case-moreno-reference-v13\.js/);
assert.doesNotMatch(page,/real-case-moreno-reference-v10\.css/);
assert.doesNotMatch(page,/real-case-moreno-production-v26\.css/);
assert.match(css,/\.v4-composer\{position:relative;bottom:auto\}/);
assert.match(brief,/Исходные обстоятельства и правила расследования/);
assert.match(brief,/Рабочей папке/);
console.log('PASS Moreno v0.5 restored visual contract with modern game engine');
