const definitions = Object.freeze([
  Object.freeze({
    id: 'kto-vret-free',
    language: 'ru',
    title: 'Бесплатные дела «Кто врёт?»',
    slug: 'kto-vret-free',
    description: 'Бесплатные короткие расследования Mystery Logic, где ответ выводится из противоречий в показаниях, времени и фактах.',
    status: 'published',
    minimum_cases: 3,
    route: 'dela/',
  }),
]);

export const collections = definitions;

export const getCollection = (id) => definitions.find((item) => item.id === id) || null;

export const isCollectionIndexable = (collection, caseEntities = []) => Boolean(
  collection
  && collection.status === 'published'
  && caseEntities.filter((item) => item.collection_id === collection.id && item.status === 'published').length >= collection.minimum_cases
  && String(collection.description || '').trim().length >= 80
);
