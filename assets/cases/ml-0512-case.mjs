export const ml0512PublicManifest = Object.freeze({
  id: 'ML-0512',
  version: '0.9.1',
  title: 'Тринадцатая минута',
  mode: 'solo',
  tier: 'premium',
  difficulty: 'hard',
  estimatedMinutes: { min: 50, max: 70 },
  runtimePolicy: 'server-authoritative-private-canon',
  evidenceCount: 24,
  deductionCount: 11,
  locations: [
    { id: 'spectral_hall', title: 'Спектральный зал' },
    { id: 'technical_block', title: 'Технический блок' },
    { id: 'control_room', title: 'Центр управления' },
    { id: 'analysis_block', title: 'Аналитический блок' },
  ],
  people: [
    { id: 'anton', name: 'Антон Руденко', role: 'Главный инженер' },
    { id: 'sofia', name: 'София Марин', role: 'Ведущий астрофизик' },
    { id: 'mila', name: 'Мила Петрович', role: 'Ночной оператор' },
    { id: 'denis', name: 'Денис Воронов', role: 'Аналитик данных' },
  ],
  clientContract: {
    storyUnlockStateMayPersistWithoutContent: true,
    receivesOnlyAuthorizedEvidenceContent: true,
    entitlementEvaluatedServerSide: true,
    deductionAnswersStayServerSide: true,
    characterCanonStaysServerSide: true,
    reconstructionAnswersStayServerSide: true,
    confessionTransitionsStayServerSide: true,
  },
});

export default ml0512PublicManifest;
