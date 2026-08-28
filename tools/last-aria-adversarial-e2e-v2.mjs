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
fs.writeFileSync(tempFile, source);
try {
  const result = spawnSync(process.execPath, [tempFile], { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  fs.rmSync(tempFile, { force: true });
}
