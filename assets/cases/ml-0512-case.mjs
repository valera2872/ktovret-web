const premiumRule = { entitlement: ['owned', 'club', 'admin'] };
const premiumAfterSource = { all: [premiumRule, { milestoneReached: 'SOURCE_IDENTIFIED_AS_B2' }] };

const evidence = [
  ['E01','incident','spectral_hall',null,[]],
  ['E02','map',null,null,[]],
  ['E03','medical','spectral_hall',null,['DEATH_WINDOW_0220_0230','HEAD_TRAUMA']],
  ['E04','log','technical_block',null,['SP4_DETECTOR_POWER_OFF_021608','SP4_NO_BACKUP_POWER']],
  ['E05','data','technical_block',null,['SP4_LABELLED_FILES_CONTINUE_AFTER_SHUTDOWN']],
  ['E06','statement',null,null,['ANTON_DENIES_SP4_INTERVENTION']],
  ['E07','statement',null,null,['SOFIA_CLAIMS_ANALYSIS_BLOCK','SOFIA_REPORTS_RAW_TRANSIENT']],
  ['E08','statement',null,null,['MILA_DENIES_MANUAL_DOOR_OPEN']],
  ['E09','statement',null,null,['DENIS_DENIES_ARCHIVE_EXPORT']],
  ['E10','chat','technical_block',{ any:[{ evidenceOpened:'E04' },{ deductionConfirmed:'D01' }] },['LEV_THREATENED_ANTON_ACCESS','ANTON_UNAUTHORIZED_UPDATE']],
  ['E11','log','technical_block',premiumAfterSource,['ANTON_ROUTE_OVERRIDE_B2_TO_SP4']],
  ['E12','diagram','technical_block',{ deductionConfirmed:'D01' },['SP4_AND_B2_SHARE_INGEST_SYSTEM']],
  ['E13','data','technical_block',{ deductionConfirmed:'D01' },['SP4_UNIQUE_DETECTOR_FINGERPRINT']],
  ['E14','data','technical_block',{ deductionConfirmed:'D01' },['ANOMALOUS_FILE_NOT_MATCH_SP4']],
  ['E15','log','technical_block',{ deductionConfirmed:'D01' },['B2_ACTIVE_0217_0230','ANOMALOUS_FILE_MATCH_B2']],
  ['E16','evidence_bundle','technical_block',{ milestoneReached:'ANTON_VIOLATION_EXPOSED' },['ANTON_IN_TECH_ZONE_022443_022701','ANTON_FIXED_INTERCOM_022519','MILA_FIXED_INTERCOM_022525']],
  ['E17','wearable_data','spectral_hall',premiumAfterSource,['LEV_FATAL_FALL_022536']],
  ['E18','evidence_bundle','spectral_hall',premiumAfterSource,['ANALYSIS_LIVEVIEW_OFFLINE_0218_0231','RAW_TRANSIENT_AT_022514','RAW_TRANSIENT_REMOVED_FROM_ARCHIVE','RAW_FEED_ONLY_SPECTRAL_HALL']],
  ['E19','access_log','control_room',premiumAfterSource,['DOOR_S3_MANUAL_OPEN_022005','NO_EXIT_BEFORE_FATAL_FALL','NEXT_EXIT_022609']],
  ['E20','photo','spectral_hall',premiumAfterSource,['OPTICAL_BASE_FRESH_DAMAGE','PAPERS_ON_FLOOR','CHAIR_OVERTURNED']],
  ['E21','medical','spectral_hall',{ all:[premiumRule,{ evidenceOpened:'E17' },{ evidenceOpened:'E20' }] },['INJURY_COMPATIBLE_WITH_OPTICAL_BASE','FALL_OR_PUSH_NOT_DISTINGUISHABLE_MEDICALLY']],
  ['E22','calendar','analysis_block',premiumAfterSource,['LEV_MEETING_SOFIA_0220_LOGS']],
  ['E23','evidence_bundle','analysis_block',premiumAfterSource,['DENIS_EXPORTED_ARCHIVE_0151','DENIS_EXTERNAL_SESSION_022306_022741']],
  ['E24','document','analysis_block',{ all:[premiumRule,{ milestoneReached:'HISTORICAL_FRAUD_FOUND' }] },['LEV_DRAFT_BLAMES_SOFIA','LEV_ADMIN_SESSIONS_PRESENT','SP4_GRANT_PERFORMANCE_RELEVANT']],
].map(([id,type,locationId,unlockRule,facts]) => ({ id,type,locationId,unlockRule,facts }));

evidence.find((e)=>e.id==='E16').sections=['local_service_log','building_access_controller','service_intercom'];
evidence.find((e)=>e.id==='E18').sections=['analysis_liveview_status','raw_service_buffer','archive_processed_file'];
evidence.find((e)=>e.id==='E23').sections=['export_manifest','external_work_session','historical_observations'];

const characters = [
  {
    id:'anton',
    canon:{truth:['ANTON_UNAUTHORIZED_UPDATE','ANTON_CAUSED_SP4_FAILURE','ANTON_ROUTE_OVERRIDE_B2_TO_SP4'],lies:['ANTON_DENIES_SP4_INTERVENTION'],motives:['FEAR_OF_DISMISSAL'],neverKnows:['SOFIA_PUSHED_LEV']},
    states:[
      {id:0,statementVersion:1,disclosureLevel:0},
      {id:1,statementVersion:1,disclosureLevel:1,enterRule:{evidencePresented:{evidenceId:'E11',characterId:'anton'}},effects:[{type:'ADD_CONTRADICTION',characterId:'anton',contradictionId:'ANTON_INTERVENTION_DENIAL'}]},
      {id:2,statementVersion:2,disclosureLevel:2,enterRule:{all:[{deductionConfirmed:'D03'},{evidencePresented:{evidenceId:'E11',characterId:'anton'}}]},effects:[{type:'SET_MILESTONE',id:'ANTON_VIOLATION_EXPOSED'}]},
    ],
  },
  {
    id:'mila',
    canon:{truth:['MILA_OPENED_DOOR_FOR_SOFIA'],lies:['MILA_DENIES_MANUAL_DOOR_OPEN'],motives:['HIDE_ACCESS_PROTOCOL_VIOLATION'],neverKnows:['SOFIA_PUSHED_LEV','LEV_FRAUD_DETAILS']},
    states:[
      {id:0,statementVersion:1,disclosureLevel:0},
      {id:1,statementVersion:1,disclosureLevel:0,enterRule:{evidencePresented:{evidenceId:'E19',characterId:'mila'}}},
      {id:2,statementVersion:2,disclosureLevel:2,enterRule:{all:[{evidencePresented:{evidenceId:'E19',characterId:'mila'}},{evidenceOpened:'E22'}]},effects:[{type:'ADD_FACT',id:'SOFIA_ENTERED_SPECTRAL_ZONE'},{type:'SET_MILESTONE',id:'SOFIA_ENTRY_CONFIRMED'}]},
    ],
  },
  {
    id:'denis',
    canon:{truth:['DENIS_EXPORTED_ARCHIVE','DENIS_FOUND_HISTORICAL_ANOMALIES'],lies:['DENIS_DENIES_ARCHIVE_EXPORT'],motives:['HIDE_UNAUTHORIZED_EXPORT'],neverKnows:['SOFIA_PUSHED_LEV']},
    states:[
      {id:0,statementVersion:1,disclosureLevel:0},
      {id:1,statementVersion:2,disclosureLevel:2,enterRule:{evidencePresented:{evidenceId:'E23',characterId:'denis'}},effects:[{type:'ADD_CONTRADICTION',characterId:'denis',contradictionId:'DENIS_EXPORT_DENIAL'},{type:'UNLOCK_EVIDENCE_SECTION',evidenceId:'E23',section:'historical_observations'}]},
    ],
  },
  {
    id:'sofia',
    canon:{truth:['SOFIA_ENTERED_SPECTRAL_ZONE','SOFIA_PRESENT_AT_FATAL_FALL','SOFIA_PUSHED_LEV'],lies:['SOFIA_CLAIMS_ANALYSIS_BLOCK','SOFIA_CLAIMS_LEFT_BEFORE_DEATH'],motives:['LEV_INTENDED_TO_BLAME_SOFIA'],knows:['RAW_TRANSIENT_AT_022514','LEV_DRAFT_BLAMES_SOFIA'],neverKnows:['ANTON_ROUTE_OVERRIDE_B2_TO_SP4','WHY_ANALYSIS_LIVEVIEW_FAILED']},
    states:[
      {id:0,statementVersion:1,disclosureLevel:0},
      {id:1,statementVersion:1,disclosureLevel:0,enterRule:{deductionConfirmed:'D05'}},
      {id:2,statementVersion:2,disclosureLevel:2,enterRule:{all:[{milestoneReached:'SOFIA_ENTRY_CONFIRMED'},{evidencePresented:{evidenceId:'E19',characterId:'sofia'}}]},effects:[{type:'ADD_CONTRADICTION',characterId:'sofia',contradictionId:'SOFIA_LOCATION_VERSION_1'}]},
      {id:5,statementVersion:3,disclosureLevel:5,enterRule:{all:[{proofClass:'presence'},{proofClass:'contradiction'},{proofClass:'time'},{proofClass:'motive'},{proofClass:'mechanism'}]},effects:[{type:'SET_MILESTONE',id:'CONFESSION_OBTAINED'},{type:'UNLOCK_RECONSTRUCTION',id:'FINAL_RECONSTRUCTION'}]},
    ],
  },
];

const deductions = [
  {id:'D01',unlockRule:{all:[{evidenceOpened:'E04'},{evidenceOpened:'E05'}]},choices:['SP4_BACKUP_POWER','DELAYED_FILE_WRITE','SP4_COULD_NOT_CREATE_FILES','ARCHIVE_RANDOM_ERROR'],correctChoice:'SP4_COULD_NOT_CREATE_FILES',contradictedChoices:['SP4_BACKUP_POWER','DELAYED_FILE_WRITE'],effectsOnConfirm:[{type:'SET_MILESTONE',id:'IMPOSSIBLE_DATA_ESTABLISHED'}]},
  {id:'D02',unlockRule:{all:[{evidenceOpened:'E13'},{evidenceOpened:'E14'},{evidenceOpened:'E15'}]},choices:['SP4_CHANGED','DATA_CAME_FROM_B2','ARCHIVE_RANDOM_ERROR'],correctChoice:'DATA_CAME_FROM_B2',effectsOnConfirm:[{type:'SET_MILESTONE',id:'SOURCE_IDENTIFIED_AS_B2'}]},
  {id:'D03',unlockRule:{all:[{deductionConfirmed:'D02'},{evidenceOpened:'E11'}]},choices:['ANTON_REDIRECTED_B2','LEV_REDIRECTED_B2','AUTOMATIC_FAILOVER'],correctChoice:'ANTON_REDIRECTED_B2',effectsOnConfirm:[{type:'ADD_FACT',id:'ANTON_REDIRECTED_B2'}]},
  {id:'D04',unlockRule:{all:[{deductionConfirmed:'D03'},{evidenceOpened:'E16'},{evidenceOpened:'E17'}]},choices:['ANTON_AT_DEATH_LOCATION','ANTON_NOT_AT_DEATH_LOCATION','LOCATION_UNKNOWN'],correctChoice:'ANTON_NOT_AT_DEATH_LOCATION',effectsOnConfirm:[{type:'SET_MILESTONE',id:'ANTON_ELIMINATED_FROM_DEATH'},{type:'DISPROVE_HYPOTHESIS',matcher:{subjectId:'anton',claim:'CAUSED_DEATH'},by:'D04'}]},
  {id:'D05',unlockRule:{all:[{evidenceOpened:'E07'},{evidenceOpened:'E18'}]},choices:['SOFIA_SAW_FROM_ANALYSIS','SOFIA_COULD_NOT_SEE_RAW_EVENT_FROM_ANALYSIS','RAW_EVENT_WAS_IN_ARCHIVE'],correctChoice:'SOFIA_COULD_NOT_SEE_RAW_EVENT_FROM_ANALYSIS',effectsOnConfirm:[{type:'ADD_CONTRADICTION',characterId:'sofia',contradictionId:'SOFIA_RAW_KNOWLEDGE'},{type:'SET_MILESTONE',id:'SOFIA_LOCATION_CONTRADICTION'}]},
  {id:'D06',unlockRule:{all:[{evidenceOpened:'E13'},{evidenceSectionUnlocked:{evidenceId:'E23',section:'historical_observations'}}]},choices:['HISTORICAL_FILES_VALID','HISTORICAL_FILES_REATTRIBUTED','DENIS_CREATED_FILES'],correctChoice:'HISTORICAL_FILES_REATTRIBUTED',effectsOnConfirm:[{type:'SET_MILESTONE',id:'HISTORICAL_FRAUD_FOUND'}]},
  {id:'D07',unlockRule:{milestoneReached:'SOFIA_ENTRY_CONFIRMED'},choices:['SOFIA_ENTERED','MILA_ENTERED','UNKNOWN_ENTRY'],correctChoice:'SOFIA_ENTERED',effectsOnConfirm:[{type:'ADD_FACT',id:'SOFIA_ENTERED_CONFIRMED'}]},
  {id:'D08',unlockRule:{all:[{deductionConfirmed:'D05'},{deductionConfirmed:'D07'}]},choices:['SOFIA_INITIAL_ALIBI_VALID','SOFIA_INITIAL_ALIBI_FALSE','TIMEZONE_ERROR'],correctChoice:'SOFIA_INITIAL_ALIBI_FALSE',effectsOnConfirm:[{type:'ADD_CONTRADICTION',characterId:'sofia',contradictionId:'SOFIA_INITIAL_ALIBI_FALSE'}]},
  {id:'D09',unlockRule:{all:[{deductionConfirmed:'D05'},{deductionConfirmed:'D07'},{evidenceOpened:'E17'},{evidenceOpened:'E19'}]},choices:['SOFIA_LEFT_BEFORE_FALL','SOFIA_PRESENT_AT_DEATH','PRESENCE_UNKNOWN'],correctChoice:'SOFIA_PRESENT_AT_DEATH',effectsOnConfirm:[{type:'SET_MILESTONE',id:'SOFIA_PRESENT_AT_DEATH'}]},
  {id:'D10',unlockRule:{all:[{deductionConfirmed:'D06'},{evidenceOpened:'E24'}]},choices:['LEV_PROTECTED_SOFIA','LEV_INTENDED_TO_BLAME_SOFIA','DENIS_BLAMED_SOFIA'],correctChoice:'LEV_INTENDED_TO_BLAME_SOFIA',effectsOnConfirm:[{type:'SET_MILESTONE',id:'SOFIA_MOTIVE_ESTABLISHED'}]},
  {id:'D11',unlockRule:{all:[{evidenceOpened:'E20'},{evidenceOpened:'E21'}]},choices:['INJURY_FROM_OPTICAL_BASE','POISONING','WEAPON_UNKNOWN'],correctChoice:'INJURY_FROM_OPTICAL_BASE',effectsOnConfirm:[{type:'SET_MILESTONE',id:'DEATH_MECHANISM_KNOWN'}]},
];

const proofClasses = {
  presence:{satisfiedBy:{all:[{deductionConfirmed:'D09'},{evidencePresented:{evidenceId:'E19',characterId:'sofia'}}]}},
  contradiction:{satisfiedBy:{all:[{deductionConfirmed:'D05'},{characterStateAtLeast:['sofia',2]}]}},
  time:{satisfiedBy:{all:[{deductionConfirmed:'D09'},{evidencePresented:{evidenceId:'E17',characterId:'sofia'}}]}},
  motive:{satisfiedBy:{all:[{deductionConfirmed:'D10'},{evidencePresented:{evidenceId:'E24',characterId:'sofia'}}]}},
  mechanism:{satisfiedBy:{all:[{deductionConfirmed:'D11'},{evidencePresented:{evidenceId:'E21',characterId:'sofia'}}]}},
};

const timeline = [
  {id:'T01',time:'02:16:08',visibilityRule:{evidenceOpened:'E04'}},
  {id:'T02',time:'02:17:19',visibilityRule:{deductionConfirmed:'D03'}},
  {id:'T03',time:'02:20:05',visibilityRule:{milestoneReached:'SOFIA_ENTRY_CONFIRMED'}},
  {id:'T04',time:'02:25:14',visibilityRule:{deductionConfirmed:'D05'}},
  {id:'T05',time:'02:25:36',visibilityRule:{evidenceOpened:'E17'}},
  {id:'T06',time:'02:26:09',visibilityRule:{deductionConfirmed:'D09'}},
  {id:'T07',time:'02:30:11',visibilityRule:{deductionConfirmed:'D03'}},
];

const milestoneRules = [
  {id:'DEMO_COMPLETE',when:{milestoneReached:'SOURCE_IDENTIFIED_AS_B2'}},
  {id:'PREMIUM_UNLOCKED',when:premiumRule},
  {id:'FINAL_INTERROGATION_AVAILABLE',when:{all:[{proofClass:'presence'},{proofClass:'contradiction'},{proofClass:'time'},{proofClass:'motive'},{proofClass:'mechanism'}]}},
];

const expectedReconstruction = {
  thirteen_minutes:{actor:'anton',source:'B2',declaredSource:'SP4',motive:'HIDE_UNAUTHORIZED_FAILURE'},
  death:{actor:'sofia',location:'spectral_hall',mechanism:'PUSH_AND_FALL',object:'OPTICAL_BASE',time:'022536'},
  lev_fraud:{scheme:'REATTRIBUTE_OBSERVATIONS',purpose:'SP4_GRANT_PERFORMANCE',scapegoat:'sofia'},
  other_lies:{anton:'DENIED_INTERVENTION',mila:'DENIED_DOOR_OPEN',denis:'DENIED_ARCHIVE_EXPORT',sofia:'FALSE_LOCATION'},
};

const deepEqual = (a,b) => {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>deepEqual(v,b[i]));
  const ak=Object.keys(a).sort(), bk=Object.keys(b).sort();
  return ak.length===bk.length&&ak.every((k,i)=>k===bk[i]&&deepEqual(a[k],b[k]));
};

export const ml0512Case = {
  id:'ML-0512',
  version:'0.8.0',
  schemaVersion:1,
  metadata:{titleKey:'case.ML0512.title',mode:'solo',tier:'premium',difficulty:'hard',estimatedMinutes:{min:50,max:70}},
  locations:[
    {id:'spectral_hall',evidenceIds:['E01','E03','E17','E18','E20','E21']},
    {id:'technical_block',evidenceIds:['E04','E05','E10','E11','E12','E13','E14','E15','E16']},
    {id:'control_room',evidenceIds:['E08','E19']},
    {id:'analysis_block',evidenceIds:['E07','E09','E22','E23','E24']},
  ],
  initialEvidence:['E01','E02','E03','E04','E05','E06','E07','E08','E09'],
  evidence,
  characters,
  deductions,
  proofClasses,
  timeline,
  milestoneRules,
  demo:{enabled:true,endCondition:{milestoneReached:'SOURCE_IDENTIFIED_AS_B2'},gateId:'full_case'},
  expectedReconstruction,
  isReconstructionCorrect:(answers)=>deepEqual(answers,expectedReconstruction),
  canonicalTruth:{death:{responsible:'sofia',intentionalMurder:false},thirteenMinutes:{responsible:'anton'},historicalFraud:{responsible:'lev'}},
};

export default ml0512Case;
