#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('realnye-dela/pozharnaya-lestnica-1991-premium/index.html');
const css=read('assets/real-case-moreno-v05-compat.css');
const engine=read('assets/real-case-moreno-ai-v6.js');
const backend=read('supabase/functions/ai-moreno-investigator-v8/index.ts');
for(const item of ['<header class="ml-brand-strip">','class="moreno-body"','real-case-moreno-sandbox.css',
  'real-case-moreno-v05-compat.css','real-case-moreno-v05-brief.js',
  'real-case-moreno-ai-v6.js','real-case-moreno-ai-router-v23.js',
  'real-case-moreno-final-v25.js','real-case-moreno-final-v25-relaxed.js',
  'sitewide-menu-20261010-v3.css','sitewide-menu-20261010-v3.js',
  'funnel-analytics-20261010-v2.js','conversion-ux-analytics.js',
  'legal.css','typography-polish.css','rel="canonical" href="https://mysterylogic.com/realnye-dela/pozharnaya-lestnica-1991-premium/"',
  'ym(111664459','content="index,follow,max-image-preview:large"'])
  assert.ok(html.includes(item),'Required live source element omitted: '+item);
for(const forbidden of ['real-case-moreno-production-v26.css','real-case-moreno-reference-v11.js',
  'real-case-moreno-reference-v13.js','real-case-moreno-intro-v20.js','ref10-topbar','real-case-moreno-ai-v5.js'])
  assert.ok(!html.includes(forbidden),'Obsolete layer or engine reintroduced: '+forbidden);
const localStyles=[...html.matchAll(/<link rel="stylesheet" href="..\/..\/assets\/real-case-moreno[^"]+">/g)];
assert.equal(localStyles.length,6,'Only 6 original+compat case styles are allowed');
assert.match(css,/\.v4-composer\{position:relative;bottom:auto\}/,'Composer must not hide first instruction');
assert.match(css,/ml-site-menu-header/,'Beget menu needs scoped compatibility');
assert.match(engine,/const KEY='ml-realcase-moreno-ai-v6'/,'Current progress key must not change');
assert.match(engine,/OLD_KEYS=\['ml-realcase-moreno-ai-v5'/,'Legacy progress migration must remain');
assert.match(backend,/function indirectInterviewSwitchPlan/,'Witness switch fix missing from isolated branch');
console.log('PASS Moreno v0.5 modern integration + exact-Beget preservation static contract');
