import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const siteRoot = path.resolve(siteIndex >= 0 && args[siteIndex + 1] ? args[siteIndex + 1] : '.');

const indexPath = path.join(siteRoot, 'assets/generated/cases-index.json');
if (!fs.existsSync(indexPath)) throw new Error(`Не найден ${indexPath}`);
const catalog = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const failures = [];
const metrics = {
  pages: 0,
  configs: 0,
  witnessCases: 0,
  witnesslessCases: 0,
  multiWitnessCases: 0,
  flattenedStructuredCases: 0,
  maxWitnesses: 0,
  maxOptions: 0,
};

if (catalog.totalCases !== 100 || catalog.cases.length !== 100) failures.push('Редакторский каталог должен содержать ровно 100 дел');

for (const item of catalog.cases) {
  const pagePath = path.join(siteRoot, item.path, 'index.html');
  if (!fs.existsSync(pagePath)) {
    failures.push(`${item.id}: отсутствует ${item.path}index.html`);
    continue;
  }
  metrics.pages += 1;

  const html = fs.readFileSync(pagePath, 'utf8');
  if (/Материалы(, показания)? и решение не загружаются/.test(html)) failures.push(`${item.id}: в редакторской сборке осталась заглушка доступа`);
  if (!html.includes('ktovret-game/assets/app.js')) failures.push(`${item.id}: отсутствует игровой загрузчик`);
  if (!html.includes('assets/case-adapter.js')) failures.push(`${item.id}: отсутствует адаптер дела`);
  if (!html.includes('assets/mobile-scroll-stabilizer.js')) failures.push(`${item.id}: отсутствует мобильный стабилизатор`);

  const match = html.match(/window\.KtoVretWeb=(\{.*?\});window\.KtoVretWeb\.permalink=location\.href;/s);
  if (!match) {
    failures.push(`${item.id}: отсутствует сериализованный игровой конфиг`);
    continue;
  }

  let config;
  try {
    config = JSON.parse(match[1]);
  } catch (error) {
    failures.push(`${item.id}: игровой конфиг не разбирается как JSON: ${error.message}`);
    continue;
  }
  metrics.configs += 1;

  const caseData = config.case || {};
  const witnesses = Array.isArray(caseData.characters) ? caseData.characters : [];
  const stages = Array.isArray(caseData.answerStages) ? caseData.answerStages : [];
  metrics.maxWitnesses = Math.max(metrics.maxWitnesses, witnesses.length);
  if (witnesses.length) metrics.witnessCases += 1;
  else metrics.witnesslessCases += 1;
  if (witnesses.length > 1) metrics.multiWitnessCases += 1;

  if (witnesses.length !== Number(item.witnessCount || 0)) failures.push(`${item.id}: число свидетелей ${witnesses.length} не совпало с каталогом ${item.witnessCount}`);
  if (!caseData.title || !caseData.intro || !caseData.explanation?.fullReason) failures.push(`${item.id}: неполный игровой конфиг`);
  if (stages.length !== 1) failures.push(`${item.id}: веб-движок ожидает один итоговый этап ответа, получено ${stages.length}`);

  for (const stage of stages) {
    const options = Array.isArray(stage.options) ? stage.options : [];
    const correct = Array.isArray(stage.correctOptionIds) ? stage.correctOptionIds : [];
    metrics.maxOptions = Math.max(metrics.maxOptions, options.length);
    if (stage.id === 'complete_conclusion') metrics.flattenedStructuredCases += 1;
    if (options.length < 2) failures.push(`${item.id}: меньше двух итоговых вариантов ответа`);
    if (correct.length !== 1) failures.push(`${item.id}: итоговый веб-этап должен иметь ровно один правильный вариант`);
    const optionIds = new Set(options.map((option) => option.id));
    for (const id of correct) if (!optionIds.has(id)) failures.push(`${item.id}: правильный итоговый вариант ${id} отсутствует среди кнопок`);
  }
}

const report = {
  schemaVersion: 1,
  totalCases: catalog.totalCases,
  ...metrics,
  failureCount: failures.length,
  failures,
};
const reportPath = path.join(siteRoot, 'assets/generated/editorial-qa-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, failures: undefined }, null, 2));

if (failures.length) {
  console.error('\nEditorial QA failures:');
  failures.forEach((value) => console.error(`- ${value}`));
  process.exit(1);
}
