#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceFile = path.join(here, 'last-aria-adversarial-e2e.mjs');
const tempFile = path.join(here, '.last-aria-adversarial-e2e-v2.tmp.mjs');
let source = fs.readFileSync(sourceFile, 'utf8');
const oldScript = '<script src="/assets/case-aria-investigation-ux.js"></script>';
const newScript = '<script src="/assets/case-aria-investigation-ux-v2.js"></script>';
if (!source.includes(oldScript)) throw new Error('Last Aria adversarial fixture source drift: old investigation UX marker missing');
source = source.replace(oldScript, newScript);

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
if (!source.includes(oldHandoff)) throw new Error('Last Aria adversarial fixture source drift: stage-three handoff marker missing');
source = source.replace(oldHandoff, newHandoff);

fs.writeFileSync(tempFile, source);
try {
  const result = spawnSync(process.execPath, [tempFile], { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  fs.rmSync(tempFile, { force: true });
}
