const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const repoRoot = path.resolve(__dirname, '..');
const context = vm.createContext({ console, Object, Array, Map, Set });

for (const file of [
  'assets/investigations/last-build.ru.js',
  'assets/investigations/last-build-evidence.js',
  'assets/investigations/last-build-timeline.js',
  'assets/investigations/last-build-questions.js',
  'assets/investigations/last-build-debrief.js',
  'assets/investigations/last-build-interrogation.js',
  'assets/investigations/last-build-plain-language.js',
  'assets/investigations/last-build-plain-presentation.js',
]) {
  const source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
  vm.runInContext(source, context, { filename: file });
}

const definition = context.MysteryLogicInvestigationCase;
assert.ok(definition, 'Last Build definition did not load');
assert.equal(definition.plainLanguageVersion, '0.6.0');
assert.equal(definition.plainPresentationVersion, '0.6.1');

const byId = (items, id) => items.find((item) => item.id === id);

assert.match(byId(definition.actions, 'inspect-t17-registry').label, /ночн.*пропуск/i);
assert.match(byId(definition.actions, 'inspect-t17-registry').description, /гостев.*пропуск.*T-17/i);
assert.match(byId(definition.actions, 'inspect-demo-session').label, /общ.*компьютер.*переговор/i);
assert.match(byId(definition.actions, 'trace-guest02').label, /гостев.*ноутбук/i);
assert.match(byId(definition.actions, 'question-timur-backup').label, /резервн.*коп/i);
assert.match(byId(definition.actions, 'trace-aster-serial').description, /флешк.*ASTER-64.*серийн/i);

assert.equal(byId(definition.materials, 'demo-session').type, 'Журнал компьютера');
assert.equal(byId(definition.materials, 'usb-audit').type, 'История подключённых устройств');
assert.equal(byId(definition.materials, 'orbit-source').type, 'Сравнение файлов');
assert.match(byId(definition.materials, 't17-registry').body, /временн.*гостев.*пропуск.*T-17/i);
assert.match(byId(definition.materials, 'guest02-assignment').body, /гостев.*ноутбук.*GUEST-02/i);
assert.match(byId(definition.materials, 'aster-history').body, /флешк.*ASTER-64.*серийн.*A64-7731/i);
assert.match(byId(definition.materials, 'nordlight-compliance').body, /чистую финальную версию игры/i);
assert.match(byId(definition.materials, 'office-morning').body, /папк.*финальн.*верси.*\(RELEASE\)/i);

const screenshotPresentation = byId(definition.materials, 'r03-screenshot').presentation;
assert.equal(screenshotPresentation.sceneTitle, 'Уровень «Северный док»');
assert.equal(screenshotPresentation.marker, 'R-03');
assert.match(screenshotPresentation.caption, /кадр из версии игры.*правом нижнем углу.*R-03/i);

const rendererSource = fs.readFileSync(path.join(repoRoot, 'assets/investigations/evidence-renderers.js'), 'utf8');
assert.ok(rendererSource.includes('mli-ev-game-shot'), 'R-03 evidence must render as a game screenshot');
assert.ok(rendererSource.includes('Найти вход в лабораторию'), 'Game screenshot must contain recognizable gameplay HUD');
assert.ok(!rendererSource.includes('REVIEW BUILD'), 'Unexplained REVIEW BUILD label leaked into screenshot renderer');

const t17Presentation = byId(definition.materials, 't17-registry').presentation;
assert.equal(t17Presentation.kicker, 'ВРЕМЕННЫЙ ГОСТЕВОЙ ПРОПУСК');
assert.equal(t17Presentation.heading, 'T-17');
assert.ok(t17Presentation.fields.some((field) => /Фактический возврат карты/i.test(field.label)));

const guestLaptopPresentation = byId(definition.materials, 'guest02-assignment').presentation;
assert.match(guestLaptopPresentation.kicker, /ГОСТЕВОГО НОУТБУКА/i);
assert.equal(guestLaptopPresentation.heading, 'GUEST-02');

const usbPresentation = byId(definition.materials, 'usb-audit').presentation;
assert.match(usbPresentation.title, /ФЛЕШКИ/i);
assert.ok(usbPresentation.lines.some((line) => /флешка ASTER-64.*серийный номер A64-7731/i.test(line)));
assert.ok(usbPresentation.lines.some((line) => /копирование финальной версии игры/i.test(line)));

const demoPresentation = byId(definition.materials, 'demo-session').presentation;
assert.match(demoPresentation.title, /ОБЩИЙ КОМПЬЮТЕР/i);
assert.ok(demoPresentation.lines.some((line) => /аккаунт Тимура/i.test(line)));

const nightsafePresentation = byId(definition.materials, 'nightsafe').presentation;
assert.match(nightsafePresentation.title, /РЕЗЕРВНАЯ КОПИЯ.*NIGHTSAFE/i);
assert.ok(nightsafePresentation.lines.some((line) => /Создал: Тимур Власов/i.test(line)));

assert.match(byId(definition.investigationQuestions, 't17-user').text, /временн.*гостев.*пропуск.*T-17/i);
assert.match(byId(definition.investigationQuestions, 'timur-account').text, /открыт.*аккаунт.*Тимура/i);
assert.match(byId(definition.timelineEvents, 'demo-wake').label, /общ.*компьютер.*аккаунт Тимура/i);
assert.match(byId(definition.timelineEvents, 'aster-in').label, /флешк.*ASTER-64.*серийн/i);
assert.match(byId(definition.proofFamilies, 'copy-device').label, /финальн.*верси.*флешк.*Роман/i);

const roman = definition.interrogationContracts.roman;
assert.equal(roman.label, 'Допрос Романа');
assert.match(roman.suggestedQuestions[1], /гостев.*пропуск.*T-17/i);
assert.match(byId(roman.topics, 'session').stages[0].response, /аккаунт Тимура.*общ.*компьютер/i);

const playerFacing = [];
const add = (...values) => values.filter(Boolean).forEach((value) => playerFacing.push(String(value)));
const addNested = (value) => {
  if (value == null) return;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach(addNested);
    return;
  }
  if (typeof value === 'object') Object.values(value).forEach(addNested);
};

for (const material of definition.materials) {
  add(material.title, material.type, material.body);
  addNested(material.presentation);
}
for (const action of definition.actions) add(action.label, action.description);
for (const character of definition.characters) {
  add(character.introduction, character.initialStatement, character.responsibility);
  for (const state of character.statementStates || []) add(state.text);
}
for (const proof of definition.proofFamilies || []) add(proof.label, proof.description);
for (const question of definition.investigationQuestions || []) add(question.text);
for (const event of definition.timelineEvents || []) add(event.label, event.source);
for (const item of definition.debrief?.timeline || []) add(item.title, item.text);
for (const item of definition.debrief?.lies || []) add(item.label, item.text);
for (const item of definition.debrief?.reinterpretations || []) add(item.title, item.before, item.after);
add(definition.resultNarrative, roman.label, roman.description, ...(roman.suggestedQuestions || []));
for (const topic of roman.topics || []) {
  add(topic.defaultResponse);
  for (const stage of topic.stages || []) add(stage.response);
}

const combined = playerFacing.join('\n');
for (const forbidden of [
  'Endpoint-аудит',
  'USB-аудит',
  'NIGHTSAFE manifest',
  'backup manifest',
  'clean final build',
  'scan-in',
  'Compliance-письмо',
  'compliance NordLight',
  'Removable device',
  'removable device',
  'removable media audit',
  'workstation GUEST-02',
  'Workstation',
  'client connected',
  'transfer started',
  'transfer completed',
  'session state',
  'REMOTE ACCESS AUDIT',
  'local session',
  'new login event',
  'STATUS     SUCCESS',
  'EXTERNAL   none',
  'SHA-256 · MATCH',
]) {
  assert.ok(!combined.includes(forbidden), `Unexplained technical jargon leaked into player-facing copy: ${forbidden}`);
}

console.log('Last Build plain-language contract OK');
