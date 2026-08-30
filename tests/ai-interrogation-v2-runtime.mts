import assert from 'node:assert/strict';
import {
  appendTranscriptTurn,
  applyInterrogationTurn,
  checkTheory,
  normalizeStoredState,
  parsePrivateCanon,
  parsePublicAiCase,
  transcriptForPrompt,
  type AiCaseRuntime,
} from '../supabase/functions/_shared/ai-case-runtime.ts';

const publicCase=parsePublicAiCase({ai_case:{
  schema_version:1,
  max_turns:5,
  suspects:[
    {id:'anna',name:'Анна',role:'куратор',opening:'Я ушла раньше.'},
    {id:'boris',name:'Борис',role:'охранник',opening:'Я был у поста.'},
  ],
  initial_evidence:[{id:'E01',code:'ДВЕРЬ',title:'Журнал двери',body:'Вход зафиксирован в 22:10.'}],
}});

const canon=parsePrivateCanon({
  schema_version:1,
  suspects:{
    anna:{persona:'Сдержанная и осторожная.',base_facts:['Анна знает время своего ухода.'],admissions:{N01:['После предъявления журнала Анна признаёт, что вернулась.']}},
    boris:{persona:'Отвечает коротко и точно.',base_facts:['Борис находился у поста.'],admissions:{}},
  },
  evidence:{E02:{code:'СЕТЬ',title:'Сетевой лог',body:'Телефон Анны был внутри здания.'}},
  rules:[{
    id:'R01',suspect_id:'anna',
    when:{min_questions:2,presented_evidence_ids:['E01'],any_terms:['вернулись','возвращались']},
    grants:{note:{id:'N01',source:'Анна · противоречие',text:'Анна признаёт возвращение.'},evidence_ids:['E02']},
    stage:'cornered'
  }],
  theory:{culprit_id:'anna',required_evidence_ids:['E01','E02'],required_note_ids:['N01'],any_terms:['вернулась'],success_title:'Дело раскрыто',success_explanation:'Журнал и сетевой лог опровергают алиби.'}
},publicCase);

const runtime:AiCaseRuntime={caseId:'AI-TEST',productId:'ai-test',payloadVersion:1,canonVersion:1,publicCase,canon,entitlement:{id:'11111111-1111-4111-8111-111111111111',experienceTier:'text'}};

let state=normalizeStoredState({successful_turns:0,evidence_ids:[],question_counts:{},stages:{},transcripts:{}},runtime);
assert.deepEqual(state.evidence_ids,['E01'],'initial evidence must be restored even from incomplete storage');
assert.deepEqual(state.transcripts.anna,[{role:'assistant',text:'Я ушла раньше.'}],'opening statement must be restored server-side');

let turn=applyInterrogationTurn(runtime,state,{suspectId:'anna',question:'Где вы были после ухода?'});
assert.equal(turn.newNotes.length,0,'rule must not unlock before its threshold and evidence presentation');
state=appendTranscriptTurn(runtime,turn.state,{suspectId:'anna',question:'Где вы были после ухода?',reply:'Я уже сказала: ушла.'});
assert.deepEqual(transcriptForPrompt(runtime,state,'anna').slice(-2),[
  {role:'user',text:'Где вы были после ухода?'},
  {role:'assistant',text:'Я уже сказала: ушла.'},
]);

turn=applyInterrogationTurn(runtime,state,{suspectId:'anna',question:'Вы возвращались после ухода?',presentedEvidenceId:'E01'});
assert.deepEqual(turn.newNotes.map(n=>n.id),['N01']);
assert.deepEqual(turn.newEvidence.map(e=>e.id),['E02']);
assert.equal(turn.stage,'cornered');
state=appendTranscriptTurn(runtime,turn.state,{suspectId:'anna',question:'Вы возвращались после ухода?',reply:'Да, я вернулась.'});

const replay=applyInterrogationTurn(runtime,state,{suspectId:'anna',question:'Вы опять говорите, что возвращались?',presentedEvidenceId:'E01'});
assert.equal(replay.newNotes.length,0,'one-shot rule must not grant the same discovery twice');
assert.equal(replay.newEvidence.length,0,'one-shot rule must not grant the same hidden evidence twice');
state=replay.state;

assert.deepEqual(checkTheory(runtime,state,{suspectId:'anna',reason:'Анна вернулась, что подтверждают журналы.'}),{
  correct:true,title:'Дело раскрыто',explanation:'Журнал и сетевой лог опровергают алиби.'
});
assert.equal(checkTheory(runtime,state,{suspectId:'boris',reason:'Борис вернулся и виноват.'}).correct,false);

assert.throws(()=>parsePrivateCanon({
  schema_version:1,
  suspects:{anna:{persona:'x',base_facts:['x'],admissions:{}},boris:{persona:'x',base_facts:['x'],admissions:{}}},
  evidence:{},rules:[{id:'R',suspect_id:'anna',when:{},grants:{},stage:'defensive'}],
  theory:{culprit_id:'anna',required_evidence_ids:['E01'],required_note_ids:[],success_title:'x',success_explanation:'x'}
},publicCase),/ai_canon_rule_when_invalid/,'ungated rules must be rejected');

assert.throws(()=>parsePrivateCanon({
  schema_version:1,
  suspects:{anna:{persona:'x',base_facts:['x'],admissions:{}},boris:{persona:'x',base_facts:['x'],admissions:{}}},
  evidence:{},rules:[{id:'R',suspect_id:'anna',when:{required_evidence_ids:['MISSING']},grants:{},stage:'defensive'}],
  theory:{culprit_id:'anna',required_evidence_ids:['E01'],required_note_ids:[],success_title:'x',success_explanation:'x'}
},publicCase),/ai_canon_rule_reference_invalid/,'rules must not reference unknown evidence');

assert.throws(()=>parsePrivateCanon({
  schema_version:1,
  suspects:{anna:{persona:'x',base_facts:['x'],admissions:{}},boris:{persona:'x',base_facts:['x'],admissions:{}}},
  evidence:{},rules:[{id:'R',suspect_id:'anna',when:{min_questions:2},grants:{note:{id:'N',source:'Анна',text:'Анна призналась.'}},terminal:'confession'}],
  theory:{culprit_id:'anna',required_evidence_ids:['E01'],required_note_ids:['N'],success_title:'x',success_explanation:'x'}
},publicCase),/ai_canon_confession_contract_required/,'terminal confession must have both a canonical note and exact spoken reply');

state={...state,successful_turns:publicCase.max_turns};
assert.throws(()=>applyInterrogationTurn(runtime,state,{suspectId:'anna',question:'Ещё вопрос'}),/session_limit/,'runtime must enforce max turns independently of the endpoint');

console.log('AI interrogation v2 runtime: ok');
