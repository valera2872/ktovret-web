export const SEO_POLICY = {
  defaultLanguage: 'ru',
  publishFreeCases: true,
  collections: [
    {
      id: 'free-detective-cases',
      title: '15 бесплатных детективных дел «Кто врёт?»',
      shortTitle: 'Бесплатные детективные дела',
      route: 'ru/besplatnye-detektivnye-dela/',
      language: 'ru',
      status: 'published',
      indexable: true,
      minimumCases: 6,
      source: 'free',
      description: '15 коротких интерактивных детективных дел Mystery Logic, которые можно пройти бесплатно в браузере без регистрации.',
      intro: 'В этой подборке собраны все бесплатные расследования «Кто врёт?». В каждом деле нужно сопоставить обстоятельства, показания и ограничения ситуации, выбрать единственную доказуемую версию и сразу проверить её.',
    },
  ],
};

export const isSeoPublishedCase = ({ access, status = 'published' } = {}) => (
  SEO_POLICY.publishFreeCases && access === 'free' && status === 'published'
);

export function buildEditorialCollections(cases, sourceCollections = []) {
  const collections = sourceCollections.map((collection) => ({ ...collection, indexable: false }));
  for (const policy of SEO_POLICY.collections) {
    const members = policy.source === 'free'
      ? cases.filter((item) => item.access === 'free' && item.status === 'published')
      : [];
    collections.push({
      ...policy,
      indexable: policy.indexable === true && policy.status === 'published' && members.length >= policy.minimumCases,
      caseIds: members.map((item) => item.id),
      kind: 'editorial',
    });
  }
  return collections;
}
