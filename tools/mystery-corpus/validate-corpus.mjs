#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node tools/mystery-corpus/validate-corpus.mjs <cases-directory>');
  process.exit(2);
}
if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error('Cases directory not found: ' + dir);
  process.exit(2);
}

const validator = new URL('./validate-case-dna.mjs', import.meta.url);
const files = fs.readdirSync(dir)
  .filter(name => name.endsWith('.json'))
  .sort();

if (!files.length) {
  console.error('No Case DNA JSON files found in ' + dir);
  process.exit(1);
}

const ids = new Map();
const failures = [];
const sourceTypes = new Map();
const rights = new Map();

for (const name of files) {
  const file = path.join(dir, name);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    failures.push({file:name, reason:'invalid JSON: ' + error.message});
    continue;
  }

  if (ids.has(data.case_id)) {
    failures.push({file:name, reason:'duplicate case_id: ' + data.case_id + ' (also ' + ids.get(data.case_id) + ')'});
  } else {
    ids.set(data.case_id, name);
  }

  const child = spawnSync(process.execPath, [validator.pathname, file], {encoding:'utf8'});
  if (child.status !== 0) {
    failures.push({file:name, reason:(child.stderr || child.stdout || 'validator failed').trim()});
    continue;
  }

  const sourceType = data.source?.source_type || 'unknown';
  const rightsStatus = data.source?.rights_status || 'unknown';
  sourceTypes.set(sourceType, (sourceTypes.get(sourceType) || 0) + 1);
  rights.set(rightsStatus, (rights.get(rightsStatus) || 0) + 1);
}

if (failures.length) {
  console.error('Mystery Corpus INVALID');
  for (const f of failures) console.error('- ' + f.file + ': ' + f.reason);
  process.exit(1);
}

console.log('Mystery Corpus VALID');
console.log(JSON.stringify({
  files: files.length,
  unique_case_ids: ids.size,
  source_types: Object.fromEntries(sourceTypes),
  rights_status: Object.fromEntries(rights)
}, null, 2));
