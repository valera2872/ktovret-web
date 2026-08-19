#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(import.meta.url);
const interrogation = require('../assets/investigations/interrogation-core.js');
require('../assets/investigations/last-build.ru.js');
require('../assets/investigations/last-build-human-layer.js');
require('../assets/investigations/last-build-interrogation.js');

const definition = globalThis.MysteryLogicInvestigationCase;
const contract = definition.interrogationContracts.roman;
const datasetPath = path.join(root, 'tests', 'fixtures', 'last-build-interrogation-eval.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
const results = dataset.map((sample) => ({
  ...sample,
  actualTopicId: interrogation.classifyLocal(contract, sample.question),
}));
const mismatches = results.filter((sample) => sample.actualTopicId !== sample.topicId);
const byTopic = Object.fromEntries(contract.topics.map((topic) => {
  const samples = results.filter((sample) => sample.topicId === topic.id);
  return [topic.id, {
    samples: samples.length,
    correct: samples.filter((sample) => sample.actualTopicId === sample.topicId).length,
  }];
}));
const report = {
  classifier: 'authored-local-fallback',
  samples: results.length,
  correct: results.length - mismatches.length,
  accuracy: Number(((results.length - mismatches.length) / results.length).toFixed(4)),
  byTopic,
  mismatches,
};

console.log(JSON.stringify(report, null, 2));
if (mismatches.length) process.exitCode = 1;
