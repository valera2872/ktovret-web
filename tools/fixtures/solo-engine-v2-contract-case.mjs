const premiumRule = { entitlement: ['owned', 'club', 'admin'] };
const premiumAfterDemo = { all: [premiumRule, { milestoneReached: 'DEMO_INSIGHT' }] };

const evidence = [
  { id: 'A01', type: 'log' },
  { id: 'A02', type: 'data' },
  { id: 'A03', type: 'diagram', unlockRule: { deductionConfirmed: 'Q01' } },
  { id: 'A04', type: 'data', unlockRule: { deductionConfirmed: 'Q01' } },
  { id: 'A05', type: 'log', unlockRule: { deductionConfirmed: 'Q01' } },
  { id: 'A06', type: 'statement' },
  { id: 'A07', type: 'statement' },
  { id: 'B01', type: 'log', unlockRule: premiumAfterDemo },
  { id: 'B02', type: 'evidence_bundle', unlockRule: { milestoneReached: 'ALPHA_VIOLATION_EXPOSED' } },
  { id: 'B03', type: 'wearable_data', unlockRule: premiumAfterDemo },
  { id: 'B04', type: 'evidence_bundle', unlockRule: premiumAfterDemo, sections: ['summary', 'hidden_detail'] },
  { id: 'B05', type: 'document', unlockRule: premiumAfterDemo },
  { id: 'B06', type: 'photo', unlockRule: premiumAfterDemo },
  { id: 'B07', type: 'medical', unlockRule: { all: [premiumRule, { evidenceOpened: 'B06' }] } },
];

const characters = [
  {
    id: 'alpha',
    states: [
      { id: 0, statementVersion: 1, disclosureLevel: 0 },
      {
        id: 1,
        statementVersion: 1,
        disclosureLevel: 1,
        enterRule: { evidencePresented: { evidenceId: 'B01', characterId: 'alpha' } },
        effects: [{ type: 'ADD_CONTRADICTION', characterId: 'alpha', contradictionId: 'ALPHA_DENIAL' }],
      },
      {
        id: 2,
        statementVersion: 2,
        disclosureLevel: 2,
        enterRule: { all: [{ deductionConfirmed: 'Q03' }, { evidencePresented: { evidenceId: 'B01', characterId: 'alpha' } }] },
        effects: [{ type: 'SET_MILESTONE', id: 'ALPHA_VIOLATION_EXPOSED' }],
      },
    ],
  },
  {
    id: 'beta',
    states: [
      { id: 0, statementVersion: 1, disclosureLevel: 0 },
      {
        id: 1,
        statementVersion: 2,
        disclosureLevel: 1,
        enterRule: { evidencePresented: { evidenceId: 'B04', characterId: 'beta' } },
        effects: [{ type: 'UNLOCK_EVIDENCE_SECTION', evidenceId: 'B04', section: 'hidden_detail' }],
      },
      {
        id: 5,
        statementVersion: 3,
        disclosureLevel: 5,
        enterRule: {
          all: [
            { proofClass: 'presence' },
            { proofClass: 'motive' },
            { proofClass: 'mechanism' },
            { fact: 'FINAL_BETA_CONFRONTATION_STARTED' },
          ],
        },
        effects: [
          { type: 'SET_MILESTONE', id: 'CONFESSION_OBTAINED' },
          { type: 'UNLOCK_RECONSTRUCTION', id: 'FINAL_RECONSTRUCTION' },
        ],
      },
    ],
  },
];

const deductions = [
  {
    id: 'Q01',
    unlockRule: { all: [{ evidenceOpened: 'A01' }, { evidenceOpened: 'A02' }] },
    choices: ['POWER_OK', 'SYSTEM_IMPOSSIBLE', 'RANDOM_ERROR'],
    correctChoice: 'SYSTEM_IMPOSSIBLE',
    contradictedChoices: ['POWER_OK'],
    effectsOnConfirm: [{ type: 'SET_MILESTONE', id: 'STARTING_CONTRADICTION' }],
  },
  {
    id: 'Q02',
    unlockRule: { all: [{ evidenceOpened: 'A03' }, { evidenceOpened: 'A04' }, { evidenceOpened: 'A05' }] },
    choices: ['SOURCE_X', 'SOURCE_Y', 'UNKNOWN'],
    correctChoice: 'SOURCE_Y',
    effectsOnConfirm: [{ type: 'SET_MILESTONE', id: 'DEMO_INSIGHT' }],
  },
  {
    id: 'Q03',
    unlockRule: { all: [{ deductionConfirmed: 'Q02' }, { evidenceOpened: 'B01' }] },
    choices: ['ALPHA_CHANGED_ROUTE', 'AUTOMATIC_CHANGE', 'NO_CHANGE'],
    correctChoice: 'ALPHA_CHANGED_ROUTE',
    effectsOnConfirm: [{ type: 'ADD_FACT', id: 'ALPHA_CHANGED_ROUTE' }],
  },
  {
    id: 'Q04',
    unlockRule: { all: [{ deductionConfirmed: 'Q03' }, { evidenceOpened: 'B02' }, { evidenceOpened: 'B03' }] },
    choices: ['ALPHA_AT_SCENE', 'ALPHA_ELIMINATED', 'UNKNOWN'],
    correctChoice: 'ALPHA_ELIMINATED',
    effectsOnConfirm: [
      { type: 'SET_MILESTONE', id: 'ALPHA_ELIMINATED' },
      { type: 'DISPROVE_HYPOTHESIS', matcher: { subjectId: 'alpha', claim: 'CAUSED_INCIDENT' }, by: 'Q04' },
    ],
  },
  {
    id: 'Q05',
    unlockRule: { evidenceSectionOpened: { evidenceId: 'B04', section: 'hidden_detail' } },
    choices: ['BETA_PRESENT', 'BETA_ABSENT', 'UNKNOWN'],
    correctChoice: 'BETA_PRESENT',
    effectsOnConfirm: [{ type: 'SET_MILESTONE', id: 'BETA_PRESENCE_ESTABLISHED' }],
  },
  {
    id: 'Q06',
    unlockRule: { all: [{ deductionConfirmed: 'Q05' }, { evidenceOpened: 'B05' }] },
    choices: ['BETA_MOTIVE', 'NO_MOTIVE', 'UNKNOWN'],
    correctChoice: 'BETA_MOTIVE',
    effectsOnConfirm: [{ type: 'SET_MILESTONE', id: 'BETA_MOTIVE_ESTABLISHED' }],
  },
  {
    id: 'Q07',
    unlockRule: { all: [{ evidenceOpened: 'B06' }, { evidenceOpened: 'B07' }] },
    choices: ['MECHANISM_MATCHES', 'MECHANISM_EXCLUDED', 'UNKNOWN'],
    correctChoice: 'MECHANISM_MATCHES',
    effectsOnConfirm: [{ type: 'SET_MILESTONE', id: 'MECHANISM_ESTABLISHED' }],
  },
];

const proofClasses = {
  presence: {
    satisfiedBy: { all: [{ deductionConfirmed: 'Q05' }, { evidencePresented: { evidenceId: 'B04', characterId: 'beta' } }] },
  },
  motive: {
    satisfiedBy: { all: [{ deductionConfirmed: 'Q06' }, { evidencePresented: { evidenceId: 'B05', characterId: 'beta' } }] },
  },
  mechanism: {
    satisfiedBy: { all: [{ deductionConfirmed: 'Q07' }, { evidencePresented: { evidenceId: 'B07', characterId: 'beta' } }] },
  },
};

const timeline = [
  { id: 'R01', time: '00:01', visibilityRule: { evidenceOpened: 'A01' } },
  { id: 'R02', time: '00:02', visibilityRule: { deductionConfirmed: 'Q03' } },
  { id: 'R03', time: '00:03', visibilityRule: { deductionConfirmed: 'Q05' } },
];

const milestoneRules = [
  { id: 'DEMO_COMPLETE', when: { milestoneReached: 'DEMO_INSIGHT' } },
  { id: 'PREMIUM_UNLOCKED', when: premiumRule },
  {
    id: 'FINAL_INTERROGATION_AVAILABLE',
    when: { all: [{ proofClass: 'presence' }, { proofClass: 'motive' }, { proofClass: 'mechanism' }] },
  },
];

const interactions = [
  {
    id: 'FINAL_BETA_CONFRONTATION',
    characterId: 'beta',
    unlockRule: { milestoneReached: 'FINAL_INTERROGATION_AVAILABLE' },
    effects: [{ type: 'ADD_FACT', id: 'FINAL_BETA_CONFRONTATION_STARTED' }],
  },
];

const expectedReconstruction = {
  event: { actor: 'beta', mechanism: 'MECHANISM_MATCHES' },
  falseLead: { actor: 'alpha', truth: 'ALPHA_CHANGED_ROUTE' },
};

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export const soloEngineV2ContractCase = {
  id: 'ENGINE-V2-CONTRACT',
  version: '1.0.0',
  initialEvidence: ['A01', 'A02', 'A06', 'A07'],
  evidence,
  characters,
  deductions,
  proofClasses,
  timeline,
  milestoneRules,
  interactions,
  expectedReconstruction,
  isReconstructionCorrect: (answers) => deepEqual(answers, expectedReconstruction),
};

export default soloEngineV2ContractCase;
