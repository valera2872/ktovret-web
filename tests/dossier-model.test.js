'use strict';

const assert = require('node:assert/strict');
const model = require('../assets/dossier-model.js');

const makeStorage = (values = {}) => ({
  values: { ...values },
  getItem(key) { return Object.prototype.hasOwnProperty.call(this.values, key) ? this.values[key] : null; },
  removeItem(key) { delete this.values[key]; },
});

const emptySummary = model.summarize(model.readRecords(makeStorage()));
assert.equal(emptySummary.solvedCount, 0);
assert.equal(emptySummary.nextCase.number, '001');
assert.equal(emptySummary.rank, 'Стажёр бюро');
assert.equal(emptySummary.allSolved, false);

const storage = makeStorage({
  [model.cases[0].storageKey]: JSON.stringify({ accepted: true, solved: true, attempts: 1, hintsUsed: 0, firstAnswerCorrect: true, startedAt: 1000, solvedAt: 121000 }),
  [model.cases[0].achievementKey]: JSON.stringify({ firstCompletionAt: 121000, firstCompletionAttempts: 1, firstCompletionHints: 0, firstCompletionClean: true }),
  [model.cases[1].storageKey]: JSON.stringify({ accepted: true, solved: false, attempts: 0, hintsUsed: 1 }),
  [model.cases[5].storageKey]: JSON.stringify({ accepted: true, solved: true, attempts: 2, hintsUsed: 1, firstAnswerCorrect: false, startedAt: 1000, solvedAt: 181000 }),
  [model.cases[5].achievementKey]: JSON.stringify({ firstCompletionAt: 181000, firstCompletionAttempts: 2, firstCompletionHints: 1, firstCompletionClean: false }),
});
const records = model.readRecords(storage);
const summary = model.summarize(records);
assert.equal(summary.solvedCount, 2);
assert.equal(summary.cleanCount, 1);
assert.equal(summary.totalAttempts, 3);
assert.equal(summary.totalHints, 1);
assert.equal(summary.totalMinutes, 5);
assert.equal(summary.activeCase.number, '002');
assert.equal(summary.nextCase.number, '002');
assert.equal(summary.rank, 'Младший аналитик');
assert.equal(model.nextUnsolvedAfter(records, 'volume1_066').number, '002');
assert.equal(model.pickRandomCase(records, 0).number, '002');
assert.equal(model.pickRandomCase(records, 0.999999).number, '005');
assert.match(model.buildShareText(summary), /2 из 6/);

const replayStorage = makeStorage({
  [model.cases[0].storageKey]: JSON.stringify({ solved: true, attempts: 1, hintsUsed: 0, firstAnswerCorrect: true }),
  [model.cases[0].achievementKey]: JSON.stringify({ firstCompletionAt: 100, firstCompletionAttempts: 3, firstCompletionHints: 0, firstCompletionClean: false }),
});
const replayRecord = model.readRecords(replayStorage)[0];
assert.equal(model.isFirstCompletionClean(replayRecord), false, 'clean replay must not rewrite the first completion');
assert.equal(model.summarize(model.readRecords(replayStorage)).cleanCount, 0);

model.clearProgress(storage);
model.cases.forEach((item) => {
  assert.equal(storage.getItem(item.storageKey), null);
  assert.equal(storage.getItem(item.achievementKey), null);
});

const completeStorage = makeStorage(Object.fromEntries(model.cases.flatMap((item) => [
  [item.storageKey, JSON.stringify({ solved: true, attempts: 1, hintsUsed: 0, firstAnswerCorrect: true })],
  [item.achievementKey, JSON.stringify({ firstCompletionAt: 100, firstCompletionAttempts: 1, firstCompletionHints: 0, firstCompletionClean: true })],
])));
const completeSummary = model.summarize(model.readRecords(completeStorage));
assert.equal(completeSummary.allSolved, true);
assert.equal(completeSummary.rank, 'Эксперт Mystery Logic');
assert.equal(completeSummary.cleanCount, 6);
assert.match(model.buildShareText(completeSummary), /завершил/);

console.log('dossier-model tests passed');
