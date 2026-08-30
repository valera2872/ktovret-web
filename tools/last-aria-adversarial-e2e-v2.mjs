#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceFile = path.join(here, 'last-aria-adversarial-e2e.mjs');
const tempFile = path.join(here, '.last-aria-adversarial-e2e-v2.tmp.mjs');
let source = fs.readFileSync(sourceFile, 'utf8');

const replaceRequired = (from, to, label) => {
  if (!source.includes(from)) throw new Error(`Last Aria adversarial fixture source drift: ${label}`);
  source = source.replace(from, to);
};

replaceRequired(
  '<script src="/assets/case-aria-investigation-ux.js"></script>',
  '<script src="/assets/case-aria-investigation-ux-v2.js"></script>',
  'old investigation UX marker missing',
);

const oldDecisionBlock = `  let p=await progress();
  assert.equal(p.stage,2);
  assert.equal(p.decision,'','legacy wrong decision must be cleared');
  assert.deepEqual(p.decisionHistory,['manager']);
  assert.equal(p.decisionMistakes,1);
  assert.equal(p.decisionPenaltyApplied,true);
  assert.equal(p.attempts,1,'legacy wrong decision must count once');
  assert.equal(p.firstAnswerCorrect,false);
  assert.equal(await evaluate(\`document.querySelector('[data-action="next-stage"]').disabled\`),true,'legacy wrong decision must not unlock stage 3');

  assert.equal(await click('[data-aria-review-stage="1"]'),true);
  await waitFor(\`document.querySelector('[data-aria-review-package="1"]')\`,'package 1 review');
  assert.equal((await progress()).stage,2,'review must not rewind canonical stage');
  await click('[data-aria-review-close]');

  await click('[data-decision="conductor"]');
  await waitFor(\`document.querySelector('[data-action="next-stage"]') && !document.querySelector('[data-action="next-stage"]').disabled\`,'correct decision unlock');
  p=await progress(); assert.equal(p.decision,'conductor');
  await click('[data-action="next-stage"]');`;

const newDecisionBlock = `  let p=await progress();
  assert.equal(p.stage,2);
  assert.equal(p.decision,'manager','valid provisional theory must survive resume');
  assert.equal(Object.prototype.hasOwnProperty.call(p,'decisionHistory'),false,'obsolete rejected-theory history must be removed');
  assert.equal(Object.prototype.hasOwnProperty.call(p,'decisionMistakes'),false,'provisional theory must not be graded as a mistake');
  assert.equal(Object.prototype.hasOwnProperty.call(p,'decisionPenaltyApplied'),false,'provisional theory must not create a score penalty');
  assert.equal(p.attempts,0,'provisional theory must not affect attempts');
  assert.equal(p.firstAnswerCorrect,null,'provisional theory must not affect perfect-final eligibility');
  assert.equal(await evaluate(\`document.querySelector('[data-action="next-stage"]').disabled\`),false,'evidence-backed provisional theory must unlock stage 3');
  assert.equal(await evaluate(\`document.body.textContent.includes('Это рабочая гипотеза, а не ответ системы')\`),true,'UI must not validate the provisional suspect');

  assert.equal(await click('[data-aria-review-stage="1"]'),true);
  await waitFor(\`document.querySelector('[data-aria-review-package="1"]')\`,'package 1 review');
  assert.equal((await progress()).stage,2,'review must not rewind canonical stage');
  await click('[data-aria-review-close]');

  await click('[data-action="next-stage"]');`;
replaceRequired(oldDecisionBlock, newDecisionBlock, 'legacy decision assertion block missing');

const oldHandoff = [
  "  await evaluate(`(()=>{const i=document.querySelector('[data-handoff-input]');i.value='K-12';document.querySelector('[data-action=\"handoff-check\"]').click();})()`);",
  "  await waitFor(`document.querySelector('.casearia-handoff.is-complete')`,'stage 3 handoff');",
].join('\n');
const newHandoff = [
  "  const handoffMeta=await evaluate(`(()=>{const h=window.MLCaseAria?.handoffs?.creator?.[3];const section=document.querySelector('.casearia-handoff');const i=section?.querySelector('[data-handoff-input]');const b=section?.querySelector('[data-action=\"handoff-check\"]');return {expected:h?.expected||'',input:!!i,button:!!b,stage:JSON.parse(localStorage.getItem('mysterylogic:last-aria:v1:ABCDEFGH:creator')||'{}').stage};})()`);",
  "  assert.deepEqual(handoffMeta,{expected:'C-2',input:true,button:true,stage:3},'stage-three handoff fixture/runtime drift');",
  "  const handoffClicked=await evaluate(`(()=>{const section=document.querySelector('.casearia-handoff');const i=section?.querySelector('[data-handoff-input]');const b=section?.querySelector('[data-action=\"handoff-check\"]');if(!i||!b)return false;i.value='C-2';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();return true;})()`);",
  "  assert.equal(handoffClicked,true,'stage-three handoff controls missing at click time');",
  "  await waitFor(`JSON.parse(localStorage.getItem('mysterylogic:last-aria:v1:ABCDEFGH:creator')||'{}').handoffs?.['3']===true`,'stage 3 handoff progress');",
  "  await waitFor(`document.querySelector('.casearia-handoff.is-complete')`,'stage 3 handoff render');",
].join('\n');
replaceRequired(oldHandoff, newHandoff, 'stage-three handoff marker missing');

replaceRequired(
  "    for(const id of ['checkout','playback','footprint','key','tag'])set('evidence',id);",
  "    for(const id of ['prop','checkout','playback','footprint','key','tag'])set('evidence',id);",
  'proof selection marker missing',
);
source = source.replace("assert.equal(await evaluate(`document.querySelectorAll('input[name=\"evidence\"]:checked').length`),5,'wrong final evidence was lost');", "assert.equal(await evaluate(`document.querySelectorAll('input[name=\"evidence\"]:checked').length`),6,'wrong final evidence was lost');");
source = source.replace("assert.equal(p.evidencePicks.length,5);", "assert.equal(p.evidencePicks.length,6);");
source = source.replace("assert.equal(await evaluate(`document.querySelectorAll('input[name=\"evidence\"]:checked').length`),5,'evidence draft did not restore after refresh');", "assert.equal(await evaluate(`document.querySelectorAll('input[name=\"evidence\"]:checked').length`),6,'evidence draft did not restore after refresh');");
replaceRequired(
  "  assert.equal(p.attempts,2,'decision penalty + first wrong final must count exactly twice');",
  "  assert.equal(p.attempts,1,'only the rejected final must count; provisional theories are not mistakes');",
  'wrong-final attempt assertion missing',
);
replaceRequired(
  "  assert.equal(completed.attempts,2,'server completion must receive the decision/final mistake score');",
  "  assert.equal(completed.attempts,2,'server completion must receive rejected + accepted final attempts only');",
  'completion attempt assertion missing',
);
source = source.replace(
  "console.log(JSON.stringify({verdict:'LAST_ARIA_ADVERSARIAL_E2E_PASS',legacySaveMigrated:true,reviewWithoutRewind:true,wrongDecisionBlocked:true,wrongFinalPreserved:true,refreshDraftRestored:true,scorePreserved:true,partnerReveal:true,viewport:'390x844'},null,2));",
  "console.log(JSON.stringify({verdict:'LAST_ARIA_ADVERSARIAL_E2E_PASS',provisionalTheoryPreserved:true,reviewWithoutRewind:true,midCaseAnswerNotRevealed:true,wrongFinalPreserved:true,refreshDraftRestored:true,scorePreserved:true,partnerReveal:true,viewport:'390x844'},null,2));",
);

const oldCleanup = "  fs.rmSync(profile,{recursive:true,force:true});";
const newCleanup = [
  "  await new Promise((resolve)=>{",
  "    if(browser.exitCode!==null) return resolve();",
  "    const timer=setTimeout(()=>{try{browser.kill('SIGKILL');}catch{} resolve();},2000);",
  "    browser.once('exit',()=>{clearTimeout(timer);resolve();});",
  "  });",
  "  try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:100});}catch{}",
].join('\n');
replaceRequired(oldCleanup, newCleanup, 'Chrome profile cleanup marker missing');

fs.writeFileSync(tempFile, source);
try {
  const result = spawnSync(process.execPath, [tempFile], { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  fs.rmSync(tempFile, { force: true });
}