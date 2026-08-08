import { estimate } from '../import-mobile/common.mjs';

const PILOT_IDS = Object.freeze([
  'first_r3_001_four_archive_entries',
  'first_r3_002_unsynced_logs',
  'first_r3_003_five_folders_gap',
]);

const clean = (value = '') => String(value).replace(/\s+/g, ' ').trim();
const clip = (value, max = 158) => {
  const text = clean(value);
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const safe = slice.replace(/\s+\S*$/, '').trim();
  return `${safe || slice.trim()}…`;
};
const slugFor = (item) => item?.slug || String(item?.path || '').split('/').filter(Boolean).at(-1) || '';

const shortDescription = (item) => {
  const intro = clean(item.intro);
  const sentence = intro.match(/^(.{40,190}?[.!?])(?:\s|$)/u)?.[1] || intro;
  return clip(sentence, 176);
};

const answerShape = (item) => {
  const stages = Array.isArray(item.answerStages) && item.answerStages.length
    ? item.answerStages
    : [{
      id: 'liar',
      selectionMode: 'single',
      options: item.characters || [],
      correctOptionIds: [item.correctOptionId].filter(Boolean),
    }];
  return stages.map((stage) => ({
    id: stage.id || 'answer',
    selectionMode: stage.selectionMode || 'single',
    correctOptionIds: [...(stage.correctOptionIds || [])],
  }));
};

export const seoNativePilotIds = new Set(PILOT_IDS);

export const isSeoNativePilotCase = (itemOrId) => seoNativePilotIds.has(
  typeof itemOrId === 'string' ? itemOrId : itemOrId?.id,
);

export const buildCaseEntity = (item, {
  language = 'ru',
  status = 'published',
  related = [],
  collectionId = 'kto-vret-free',
} = {}) => {
  const slug = slugFor(item);
  if (!item?.id || !item?.title || !slug) throw new Error('Case entity requires id, title and stable slug');
  const route = `${language}/cases/${slug}/`;
  const description = shortDescription(item);
  const characters = (item.characters || []).map((character) => ({
    id: character.id,
    name: character.name || 'Свидетель',
    role: character.role || '',
  }));
  const statements = (item.characters || []).map((character) => ({
    character_id: character.id,
    text: character.statement || '',
  }));

  return Object.freeze({
    id: item.id,
    number: item.number,
    title: item.title,
    slug,
    short_description: description,
    story: item.intro,
    characters,
    statements,
    correct_answer: answerShape(item),
    explanation: item.explanation,
    difficulty: item.difficulty || 'Среднее',
    category: item.category || 'Логика',
    age_group: item.ageGroup || item.age_group || null,
    language,
    access: item.access,
    free: item.access === 'free',
    paid: item.access === 'premium',
    image: item.cover || item.image || null,
    cover: item.cover || item.image || null,
    related_cases: related.map((value) => value.id),
    collection_id: collectionId,
    status,
    estimated_minutes: estimate(item.difficulty),
    routes: Object.freeze({
      canonical: route,
      legacy: item.path,
    }),
    seo: Object.freeze({
      title: `${item.title} — детективная задача «Кто врёт?» | Mystery Logic`,
      description: clip(`${description} Решите дело онлайн без регистрации.`, 158),
      og_title: `${item.title} — интерактивное расследование`,
      og_description: clip(`${description} Проверьте свою версию по материалам дела.`, 170),
    }),
  });
};

export const buildPilotCaseEntities = (cases) => {
  const selected = cases.filter((item) => isSeoNativePilotCase(item));
  if (selected.length !== PILOT_IDS.length) throw new Error(`SEO pilot requires ${PILOT_IDS.length} cases, found ${selected.length}`);
  return selected.map((item) => {
    const related = selected.filter((value) => value.id !== item.id).slice(0, 3);
    return buildCaseEntity(item, { related });
  });
};

export const canonicalPublicPathFor = (item) => isSeoNativePilotCase(item)
  ? `ru/cases/${slugFor(item)}/`
  : item.path;
