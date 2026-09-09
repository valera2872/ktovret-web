#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { loadLibrary } from './import-mobile/load-active.mjs';
import { buildPaidGameConfig } from './import-mobile/paid-game-config.mjs';

const tokens = process.argv.slice(2);
const args = {};
for (let index = 0; index < tokens.length; index += 1) {
  if (!tokens[index].startsWith('--')) continue;
  const key = tokens[index].slice(2);
  args[key] = tokens[index + 1] && !tokens[index + 1].startsWith('--') ? tokens[++index] : 'true';
}

const sourceRoot = path.resolve(args.source || '../mobile-source');
const output = path.resolve(args.out || '.secure-backend/paid-case-payloads.json');
const sourceCommit = args.commit || '51c178f4dceba7bdb859e1e5d0c3244150438c0d';
const library = loadLibrary(sourceRoot, sourceCommit);
const premium = library.cases.filter((item) => item.access === 'premium');
if (premium.length !== 100) throw new Error(`Ожидалось 100 платных дел, найдено ${premium.length}`);

const volume1 = premium.filter((item) => item.productId === 'volume1');
const volume2 = premium.filter((item) => item.productId === 'volume2');
if (volume1.length !== 50 || volume2.length !== 50) {
  throw new Error(`Ожидалось 50 + 50 дел, найдено volume1=${volume1.length}, volume2=${volume2.length}`);
}

const items = premium.map((item) => ({
  case_id: item.id,
  product_id: item.productId,
  language: item.language || 'ru',
  status: 'published',
  payload_version: 1,
  payload: buildPaidGameConfig(item),
}));

for (const item of items) {
  if (!item.payload?.case?.id || item.payload.case.id !== item.case_id) throw new Error(`Неверный payload ${item.case_id}`);
  if (!Array.isArray(item.payload.case.answerStages) || !item.payload.case.answerStages.length) throw new Error(`Нет answerStages ${item.case_id}`);
  if (!item.payload.case.explanation?.fullReason) throw new Error(`Нет explanation ${item.case_id}`);
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({
  schemaVersion: 2,
  sourceCommit,
  totalCases: items.length,
  products: { volume1: volume1.length, volume2: volume2.length },
  generatedAt: new Date().toISOString(),
  items,
}, null, 2));

console.log(JSON.stringify({ output, totalCases: items.length, volume1: volume1.length, volume2: volume2.length, sourceCommit }, null, 2));
