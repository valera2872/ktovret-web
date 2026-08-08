'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/generated/cases-index.json'),'utf8'));
const html=fs.readFileSync(path.join(root,'dela/index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'assets/catalog-experience.js'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/catalog-experience.css'),'utf8');

assert.equal(catalog.totalCases,100);
assert.equal(catalog.freeCount,15);
assert.equal(catalog.premiumCount,85);
assert.equal((html.match(/class="case-card /g)||[]).length,100,'catalog must render 100 case cards');
assert.equal((html.match(/data-access="free"/g)||[]).length,15,'catalog must render 15 free cards');
assert.equal((html.match(/data-access="premium"/g)||[]).length,85,'catalog must render 85 premium cards');
assert.ok(html.includes('data-catalog-progress'),'command center is missing');
assert.ok(html.includes('data-catalog-continue'),'continue action is missing');
assert.ok(html.includes('data-catalog-random'),'random free case action is missing');
assert.ok(html.includes('id="case-difficulty"'),'difficulty filter is missing');
assert.ok(html.includes('id="case-category"'),'category filter is missing');
assert.ok(html.includes('id="case-unsolved"'),'unsolved-only filter is missing');
assert.ok(html.includes('catalog-experience.css?v=1.6.0'),'catalog 1.6 stylesheet is not versioned');
assert.ok(html.includes('catalog-experience.js?v=1.6.0'),'catalog 1.6 script is not versioned');
assert.ok(!html.includes('full-catalog.js?v='),'legacy filter script must not compete with catalog 1.6');
assert.ok(js.includes('MysteryLogicDossier'),'catalog must read dossier progress');
assert.ok(js.includes("card.dataset.progress=solved?'solved':active?'active':'new'"),'case progress states are missing');
assert.ok(js.includes('pickRandomCase'),'random unsolved selection is missing');
assert.ok(js.includes("injectedProgress?.remove()"),'old duplicate progress panel is not suppressed');
assert.ok(js.includes("card.querySelectorAll('.case-state')"),'legacy duplicate case-state badges are not removed');
assert.ok(css.includes('.catalog-command'),'command center styling is missing');
assert.ok(css.includes('.case-card.is-solved'),'solved case styling is missing');
assert.ok(css.includes('.case-card.is-active-case'),'active case styling is missing');

const originSmoke=spawnSync(process.execPath,[path.join(root,'tests/site-origin.test.mjs')],{cwd:root,encoding:'utf8'});
assert.equal(originSmoke.status,0,`site origin 1.9 smoke failed: ${originSmoke.stderr||originSmoke.stdout}`);
assert.ok(originSmoke.stdout.includes('site origin 1.9 smoke passed'),'site origin smoke did not confirm production migration');

const paidClientSyntax=spawnSync(process.execPath,['--check',path.join(root,'assets/paid-access-client.js')],{cwd:root,encoding:'utf8'});
assert.equal(paidClientSyntax.status,0,`paid access client syntax failed: ${paidClientSyntax.stderr||paidClientSyntax.stdout}`);
const paidBoundary=spawnSync(process.execPath,[path.join(root,'tests/paid-access-boundary.test.js')],{cwd:root,encoding:'utf8'});
assert.equal(paidBoundary.status,0,`paid access 1.10.1 boundary failed: ${paidBoundary.stderr||paidBoundary.stdout}`);
assert.ok(paidBoundary.stdout.includes('paid access 1.10.1 boundary passed'),'paid access security gate did not confirm the live backend boundary');

console.log('catalog experience 1.6 + site origin 1.9 + paid access 1.10.1 tests passed');
