import { estimate } from '../import-mobile/common.mjs';

const splitFacts = (intro) => String(intro || '')
  .split(/\n+|(?<=[.!?])\s+/u)
  .map((value) => value.replace(/^[•\-]\s*/, '').trim())
  .filter(Boolean)
  .filter((value) => !/^известно\s*:?$/iu.test(value))
  .slice(0, 6)
  .map((value, index) => ({ label: `Факт ${index + 1}`, value }));

const reasoningSteps = (item) => Array.isArray(item.explanation?.reasoningSteps)
  && item.explanation.reasoningSteps.length
  ? item.explanation.reasoningSteps.slice(0, 5)
  : String(item.explanation?.fullReason || '')
    .split(/(?<=[.!?])\s+/u)
    .filter(Boolean)
    .slice(0, 4);

const choose = (items, min, max, start = 0, picked = [], result = []) => {
  if (picked.length >= min && picked.length <= max) result.push([...picked]);
  if (picked.length === max) return result;
  for (let index = start; index < items.length; index += 1) {
    choose(items, min, max, index + 1, [...picked, items[index]], result);
  }
  return result;
};

const normalizeStage = (stage) => ({
  id: stage.id,
  prompt: stage.prompt,
  instruction: stage.instruction || '',
  selectionMode: stage.selectionMode || 'single',
  minSelections: stage.minSelections || 1,
  maxSelections: stage.maxSelections || 1,
  options: (stage.options || []).map((option) => ({
    id: option.id,
    label: option.label,
    detail: option.detail || '',
  })),
  correctOptionIds: stage.correctOptionIds || [],
});

const flattenStages = (item) => {
  const characters = item.characters || [];
  const source = Array.isArray(item.answerStages) && item.answerStages.length
    ? item.answerStages.map(normalizeStage)
    : [{
      id: 'liar',
      prompt: item.question || 'Кто говорит неправду?',
      instruction: 'Сопоставьте материалы дела со всеми показаниями.',
      selectionMode: 'single',
      minSelections: 1,
      maxSelections: 1,
      options: characters.map((character) => ({ id: character.id, label: character.name, detail: '' })),
      correctOptionIds: [item.correctOptionId],
    }];

  if (source.length === 1 && source[0].maxSelections === 1 && source[0].selectionMode !== 'multiple') return source;

  const variants = source.map((stage) => choose(
    stage.options,
    stage.minSelections,
    stage.maxSelections,
  ).map((selection) => ({
    label: `${stage.prompt}: ${selection.map((option) => option.label).join(', ')}`,
    correct: selection.length === stage.correctOptionIds.length
      && stage.correctOptionIds.every((id) => selection.some((option) => option.id === id)),
  })));

  let combinations = [[]];
  for (const list of variants) combinations = combinations.flatMap((prefix) => list.map((value) => [...prefix, value]));
  if (combinations.length > 240) throw new Error(`Слишком много веб-комбинаций в ${item.id}: ${combinations.length}`);

  const options = combinations.map((parts, index) => ({
    id: `conclusion_${index + 1}`,
    label: parts.map((part) => part.label).join(' · '),
    detail: '',
    correct: parts.every((part) => part.correct),
  }));
  const correct = options.filter((option) => option.correct);
  if (correct.length !== 1) throw new Error(`Неоднозначная итоговая комбинация в ${item.id}`);

  return [{
    id: 'complete_conclusion',
    prompt: item.question || 'Выберите полное заключение',
    instruction: 'Выберите вариант, который правильно объединяет все этапы ответа.',
    selectionMode: 'single',
    minSelections: 1,
    maxSelections: 1,
    options: options.map(({ correct: ignored, ...option }) => option),
    correctOptionIds: [correct[0].id],
  }];
};

export const buildGameConfig = (item) => {
  const timeline = Array.isArray(item.timeline) && item.timeline.length
    ? item.timeline
    : [{ time: 'Досье', title: 'Обстоятельства дела', detail: item.intro, source: 'Материалы бюро' }];
  const facts = Array.isArray(item.facts) && item.facts.length ? item.facts : splitFacts(item.intro);
  const characters = (item.characters || []).map((character) => ({
    id: character.id,
    name: character.name || 'Свидетель',
    role: character.role || '',
    statement: character.statement || '',
  }));

  return {
    storageKey: item.storageKey,
    permalink: '',
    siteName: 'Mystery Logic',
    case: {
      id: item.id,
      title: item.title,
      caseNumber: `№ ${item.number}`,
      estimatedMinutes: estimate(item.difficulty),
      witnessCount: characters.length,
      difficulty: item.difficulty || 'Среднее',
      category: item.category || 'Логика',
      logicType: item.logicType || item.category || 'Логическое противоречие',
      materialsLabel: item.materialsLabel || 'Материалы дела',
      intro: item.intro,
      question: item.question || 'Кто говорит неправду?',
      timeline,
      facts,
      characters,
      answerStages: flattenStages(item),
      explanation: {
        shortReason: item.explanation?.shortReason || item.explanation?.fullReason || '',
        fullReason: item.explanation?.fullReason || '',
        reasoningSteps: reasoningSteps(item),
        evidenceFragments: item.explanation?.evidenceFragments || [],
      },
    },
  };
};
