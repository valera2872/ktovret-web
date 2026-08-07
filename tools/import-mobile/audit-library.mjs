import fs from 'node:fs';
import path from 'node:path';
import { loadLibrary } from './load-active.mjs';

const args = process.argv.slice(2);
const readArg = (name, fallback = '') => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const sourceRoot = path.resolve(readArg('source', '../mobile-source'));
const sourceCommit = readArg('commit', '51c178f4dceba7bdb859e1e5d0c3244150438c0d');
const outPath = path.resolve(readArg('out', 'assets/generated/qa-report.json'));

const lib = loadLibrary(sourceRoot, sourceCommit);

const warnings = [];
const failures = [];
let witnesslessCases = 0;
let witnessCases = 0;
let multiWitnessCases = 0;
let structuredCases = 0;
let multiStageCases = 0;
let multipleSelectionCases = 0;
let maxWitnesses = 0;
let maxAnswerOptions = 0;
let maxCombinationCount = 0;

const combinationsForStage = (stage) => {
  const optionCount = (stage.options || []).length;
  const min = Number(stage.minSelections || 1);
  const max = Number(stage.maxSelections || 1);
  const choose = (n, k) => {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    let result = 1;
    for (let i = 1; i <= k; i += 1) result = (result * (n - k + i)) / i;
    return Math.round(result);
  };
  let total = 0;
  for (let k = min; k <= max; k += 1) total += choose(optionCount, k);
  return total;
};

for (const item of lib.cases) {
  const label = `${item.id} (${item.title})`;
  const characters = item.characters || [];
  const stages = Array.isArray(item.answerStages) ? item.answerStages : [];

  if (!item.title?.trim()) failures.push(`${label}: пустое название`);
  if (!item.intro?.trim()) failures.push(`${label}: пустые обстоятельства дела`);
  if (!item.explanation?.fullReason?.trim()) failures.push(`${label}: отсутствует полный разбор`);

  if (characters.length === 0) witnesslessCases += 1;
  else witnessCases += 1;
  if (characters.length > 1) multiWitnessCases += 1;
  maxWitnesses = Math.max(maxWitnesses, characters.length);

  const characterIds = new Set();
  for (const character of characters) {
    if (!character.id) failures.push(`${label}: свидетель без id`);
    if (characterIds.has(character.id)) failures.push(`${label}: повтор id свидетеля ${character.id}`);
    characterIds.add(character.id);
    if (!String(character.name || '').trim()) failures.push(`${label}: свидетель ${character.id} без имени`);
    if (!String(character.statement || '').trim()) warnings.push(`${label}: у свидетеля ${character.name || character.id} пустое показание`);
    if (String(character.statement || '').length > 1400) warnings.push(`${label}: длинное показание ${character.name || character.id} (${character.statement.length} знаков)`);
  }

  if (item.title.length > 90) warnings.push(`${label}: длинное название (${item.title.length} знаков)`);
  if (item.intro.length > 1800) warnings.push(`${label}: длинные обстоятельства (${item.intro.length} знаков)`);

  if (stages.length) structuredCases += 1;
  if (stages.length > 1) multiStageCases += 1;
  if (stages.some((stage) => (stage.maxSelections || 1) > 1 || (stage.selectionMode || 'single') === 'multiple')) multipleSelectionCases += 1;

  const checkedStages = stages.length
    ? stages
    : [{ id: 'liar', options: characters, correctOptionIds: [item.correctOptionId].filter(Boolean), minSelections: 1, maxSelections: 1 }];

  let combinationCount = 1;
  for (const stage of checkedStages) {
    const options = stage.options || [];
    const optionIds = new Set();
    const correct = stage.correctOptionIds || [];
    const min = Number(stage.minSelections || 1);
    const max = Number(stage.maxSelections || 1);

    maxAnswerOptions = Math.max(maxAnswerOptions, options.length);
    if (options.length < 2) failures.push(`${label}: этап ${stage.id || '?'} имеет меньше двух вариантов`);
    if (!correct.length) failures.push(`${label}: этап ${stage.id || '?'} не имеет правильного ответа`);
    if (min < 1 || max < min || max > options.length) failures.push(`${label}: этап ${stage.id || '?'} имеет неверные границы выбора ${min}..${max}`);

    for (const option of options) {
      if (!option.id) failures.push(`${label}: вариант без id в этапе ${stage.id || '?'}`);
      if (optionIds.has(option.id)) failures.push(`${label}: повтор id варианта ${option.id} в этапе ${stage.id || '?'}`);
      optionIds.add(option.id);
      const optionLabel = String(option.label || option.name || '');
      if (!optionLabel.trim()) warnings.push(`${label}: пустая подпись варианта ${option.id || '?'}`);
      if (optionLabel.length > 220) warnings.push(`${label}: длинный вариант ответа ${option.id || '?'} (${optionLabel.length} знаков)`);
    }

    for (const id of correct) if (!optionIds.has(id)) failures.push(`${label}: правильный id ${id} отсутствует среди вариантов этапа ${stage.id || '?'}`);
    combinationCount *= combinationsForStage({ ...stage, options });
  }

  maxCombinationCount = Math.max(maxCombinationCount, combinationCount);
  if (combinationCount > 240) failures.push(`${label}: ${combinationCount} итоговых комбинаций, лимит веб-конвертера 240`);

  for (const step of item.explanation?.reasoningSteps || []) {
    if (String(step).length > 700) warnings.push(`${label}: длинный шаг разбора (${String(step).length} знаков)`);
  }
}

const report = {
  schemaVersion: 1,
  sourceCommit,
  totalCases: lib.cases.length,
  freeCases: lib.cases.filter((item) => item.access === 'free').length,
  premiumCases: lib.cases.filter((item) => item.access === 'premium').length,
  witnesslessCases,
  witnessCases,
  multiWitnessCases,
  structuredCases,
  multiStageCases,
  multipleSelectionCases,
  maxWitnesses,
  maxAnswerOptions,
  maxCombinationCount,
  warningCount: warnings.length,
  failureCount: failures.length,
  warnings,
  failures,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, warnings: undefined, failures: undefined }, null, 2));

if (failures.length) {
  console.error('\nQA failures:');
  failures.forEach((value) => console.error(`- ${value}`));
  process.exit(1);
}
