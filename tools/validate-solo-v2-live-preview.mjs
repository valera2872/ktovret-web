#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const html=fs.readFileSync(new URL('../admin/solo-v2-live-preview/index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../assets/solo-v2-client.mjs',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../assets/solo-v2-client.css',import.meta.url),'utf8');

assert.match(html,/meta name="robots" content="noindex,nofollow,noarchive"/,'live preview must be noindex');
assert.match(html,/solo-v2-client\.mjs/,'preview must load generic Solo V2 client');
assert.match(html,/solo-v2-client\.css/,'preview must load Premium Solo visual system');
assert.match(js,/solo-session-v2/,'client must use server-authoritative Solo endpoint');
assert.match(js,/puzzle-editorial/,'internal preview must verify owner key');
assert.match(js,/OPEN_EVIDENCE/,'client must support opening evidence through server action');
assert.match(js,/PRESENT_EVIDENCE/,'client must support evidence presentation through server action');
assert.match(js,/ATTEMPT_DEDUCTION/,'client must submit deductions to server');
assert.match(js,/ADD_HYPOTHESIS/,'client must support working hypotheses');
assert.match(js,/TRIGGER_INTERACTION/,'client must support explicit server interactions');
assert.match(js,/SUBMIT_RECONSTRUCTION/,'client must support server-checked reconstruction');
assert.match(js,/localStorage\.setItem\(sessionStorageKey/,'session token must persist for refresh recovery');
assert(!/localStorage\.setItem\([^\n]*accessToken/.test(js),'entitlement token must never persist in localStorage');
assert(!/sessionStorage\.setItem\([^\n]*accessToken/.test(js),'entitlement token must never persist in sessionStorage');

const syntax=spawnSync(process.execPath,['--check',new URL('../assets/solo-v2-client.mjs',import.meta.url).pathname],{encoding:'utf8'});
assert.equal(syntax.status,0,`Solo V2 client syntax invalid:\n${syntax.stderr||syntax.stdout}`);

const publicBundle=`${html}\n${js}\n${css}`;
const forbidden=[
  'SOFIA_PUSHED_LEV',
  'ANTON_REDIRECTED_B2',
  'LEV_INTENDED_TO_BLAME_SOFIA',
  'PUSH_AND_FALL',
  'EMERGENCY_HANDSET_STRIKE',
  'COVERT_CANARY_TRAP',
  'MIRROR_REPACK',
  'D-7A31',
  'F-04',
  'd.voronov',
  'correct_choice',
  'effects_on_confirm',
  'canonicalTruth',
  'expectedReconstruction'
];
for(const token of forbidden)assert(!publicBundle.includes(token),`public live preview leaks private canon token: ${token}`);

assert(css.length>12000,'Premium Solo stylesheet unexpectedly small');
assert(!/<script[^>]*>[^<]+<\/script>/i.test(html),'preview should not embed case logic in inline scripts');

console.log(JSON.stringify({
  verdict:'SOLO_V2_LIVE_PREVIEW_PASS',
  noindex:true,
  ownerGate:true,
  serverAuthoritative:true,
  entitlementNotPersisted:true,
  privateCanonTokens:false,
  clientSyntax:true
},null,2));
