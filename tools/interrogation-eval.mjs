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
const edgeFunctionPath = path.join(root, 'supabase', 'functions', 'interrogate-character', 'index.ts');
const edgeSource = fs.readFileSync(edgeFunctionPath, 'utf8');
const edgeMatch = edgeSource.match(/const topicKeywords:[\s\S]*?=\s*(\{[\s\S]*?\n\});/);
if (!edgeMatch) throw new Error('Could not read topicKeywords from the Edge Function fallback.');
const edgeKeywords = Function(`"use strict"; return (${edgeMatch[1]});`)();
const clientKeywords = Object.fromEntries(contract.topics
  .filter((topic) => topic.id !== contract.fallbackTopicId)
  .map((topic) => [topic.id, topic.keywords || []]));
const keywordTopics = [...new Set([...Object.keys(clientKeywords), ...Object.keys(edgeKeywords)])];
const keywordDrift = keywordTopics.filter((topicId) => (
  JSON.stringify(clientKeywords[topicId] || null) !== JSON.stringify(edgeKeywords[topicId] || null)
));
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
  serverFallbackSynchronized: keywordDrift.length === 0,
  byTopic,
  mismatches,
  keywordDrift,
};

console.log(JSON.stringify(report, null, 2));
if (mismatches.length || keywordDrift.length) process.exitCode = 1;
