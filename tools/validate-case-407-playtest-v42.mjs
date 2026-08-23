#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const read = (file) => fs.readFileSync(path.join(repo, file), 'utf8');
const expect = (condition, message) => { if (!condition) throw new Error(`Room 407 blind-playtest validation failed: ${message}`); };

const context = { window: {} };
vm.runInNewContext(read('assets/case-407-data.js'), context, { filename: 'case-407-data.js' });
vm.runInNewContext(read('assets/case-407-detective-audit-v4.js'), context, { filename: 'case-407-detective-audit-v4.js' });
vm.runInNewContext(read('assets/case-407-detective-proof-v4.js'), context, { filename: 'case-407-detective-proof-v4.js' });
const data = context.window.MLCase407;
expect(data?.playtestRevision === '4.2', 'playtest revision 4.2 did not apply');

const s1i = JSON.stringify(data.stages[0].investigator);
const s2i = JSON.stringify(data.stages[1].investigator);
const s3a = JSON.stringify(data.stages[2].analyst);
const chat = data.stages[2].analyst[2].messages.flat().join(' ');

expect(!s1i.includes('журнал показывает, что в 00:54'), 'Investigator still receives Analyst key-card log inference');
expect(s1i.includes('Ключ-карты Марты здесь нет'), 'key-card absence fact disappeared');
expect(!s2i.includes('актуальные события доступа находятся в отдельном журнале безопасности'), 'stage2 plan still names the correct operational request');
expect(s2i.includes('Текущее состояние служебной двери на плане не видно'), 'stage2 plan no longer preserves uncertainty');
expect(s2i.includes('Телефон подключён к питанию в 00:51:50'), 'phone timestamp missing from Investigator packet');
expect(!s2i.includes('через восемь секунд после входа Елены'), 'Investigator still receives Analyst timing join pre-solved');
expect(!s3a.includes('Значит, в 01:14 она физически не могла держать HK-44'), 'access report still states the token-transfer deduction');
expect(s3a.includes('Первое использование HK-44 у SVC-407 в 01:14:26 приходится внутрь этого же временного интервала'), 'neutral synchronized access/CCTV facts missing');
expect(chat.includes('Если начинаем в 01:12') && chat.includes('четырёх минут'), 'pre-event coordination window disappeared from recovered chat');
expect(chat.includes('Телефон оставляю') && chat.includes('06:40'), 'phone/flight coordination disappeared from recovered chat');
expect(!chat.includes('сигнал') && !chat.includes('лифт'), 'recovered chat narrates the alarm mechanic or escape route instead of merely proving planning');

const ux = read('assets/case-407-playtest-ux-v42.js');
for (const marker of [
  "revision: '4.2'",
  'каждый подтвердите тот же вариант на своём экране',
  'Сначала сообщите Аналитику заводской H-код',
  "picks.includes('night_mgr')",
  'не заменяет независимое доказательство личного действия Елены'
]) expect(ux.includes(marker), `co-op UX hardening missing: ${marker}`);

const generator = read('tools/import-mobile/two-player-407-postprocess.mjs');
expect(generator.includes('case-407-playtest-ux-v42.js'), 'production generator does not load playtest UX hardening');
expect(generator.indexOf('case-407.js') < generator.indexOf('case-407-playtest-ux-v42.js'), 'playtest UX loads before main runtime');
expect(generator.indexOf('case-407-playtest-ux-v42.js') < generator.indexOf('case-407-evidence-v2.js'), 'playtest UX load order is unexpected');

console.log(JSON.stringify({
  case: data.title,
  playtestRevision: data.playtestRevision,
  roleInferenceLeakStage1: false,
  roleInferenceLeakStage2: false,
  stage2RequestTelegraph: false,
  stage3TokenDeductionPreSolved: false,
  stage3ChatNarratesRoute: false,
  pairedDecisionCopy: true,
  independentElenaActionRequiredAtFinal: true
}, null, 2));
