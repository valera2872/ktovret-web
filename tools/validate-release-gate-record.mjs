#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const files=process.argv.slice(2);
if(!files.length){
  console.error('Usage: node tools/validate-release-gate-record.mjs release-gates/<case>.md [...]');
  process.exit(2);
}

const requiredGates=[
  'G0 Content Freeze',
  'G1 Evidence & Fair Play',
  'G2 Adversarial Countertheories',
  'G3 Blind Spoiler',
  'G4 Solvability & Difficulty',
  'G5 First-Time Player UX',
  'G6 Black-Box Game Flow',
  'G7 Commerce & Security',
  'G8 Regression',
  'G9 Production Artifact',
];
const requiredPasses=[
  'Investigator pass',
  'Defense/countertheory pass',
  'Spoiler-hunter pass',
  'Stuck-player pass',
  'QA/abuse pass',
  'First-time-user pass',
];

let failed=false;
for(const file of files){
  const rel=path.normalize(file);
  if(path.basename(rel).toUpperCase()==='TEMPLATE.MD') continue;
  if(!fs.existsSync(rel)){console.error(`${rel}: missing`);failed=true;continue;}
  const text=fs.readFileSync(rel,'utf8');
  const errors=[];
  if(!/Audit tree SHA:\s*`[0-9a-f]{40}`/i.test(text)) errors.push('missing full 40-char Audit tree SHA');
  if(!/Production artifact SHA-256:\s*`[0-9a-f]{64}`/i.test(text)) errors.push('missing production SHA-256');
  if(!/Content changed after G0:\s*`NO`/i.test(text)) errors.push('Content changed after G0 must be NO');
  for(const gate of requiredGates){
    const escaped=gate.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    if(!new RegExp(`\\|\\s*${escaped}\\s*\\|\\s*PASS\\s*\\|`,'i').test(text)) errors.push(`${gate} is not PASS`);
  }
  for(const pass of requiredPasses){
    const escaped=pass.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    if(!new RegExp(`-\\s*${escaped}:\\s*\\`PASS\\``,'i').test(text)) errors.push(`${pass} is not PASS`);
  }
  if(/\b(NOT RUN|UNKNOWN)\b/i.test(text)) errors.push('record still contains NOT RUN/UNKNOWN');
  if(!/READY TO PUBLISH\s*·\s*Release Gate 10\/10 PASS/i.test(text)) errors.push('final READY TO PUBLISH verdict missing');
  if(errors.length){
    failed=true;
    console.error(`${rel}: INVALID RELEASE GATE`);
    for(const error of errors) console.error(`  - ${error}`);
  }else{
    console.log(`${rel}: Release Gate record valid`);
  }
}
if(failed) process.exit(1);
