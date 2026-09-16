import fs from 'node:fs';

const required = [
  'admin/partner-premium-preview/index.html',
  'assets/partner-premium-v1.js',
  'assets/partner-premium-v1.css',
  'supabase/functions/_shared/partner-ne-publikovat-v1.ts',
  'supabase/functions/partner-session-v1/index.ts',
  'supabase/functions/partner-interrogate-v1/index.ts',
  'supabase/migrations/20260916074100_partner_room_states.sql',
];
for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`missing:${file}`);
}

const runtime = fs.readFileSync('supabase/functions/_shared/partner-ne-publikovat-v1.ts','utf8');
const client = fs.readFileSync('assets/partner-premium-v1.js','utf8');
const html = fs.readFileSync('admin/partner-premium-preview/index.html','utf8');
const session = fs.readFileSync('supabase/functions/partner-session-v1/index.ts','utf8');
const ai = fs.readFileSync('supabase/functions/partner-interrogate-v1/index.ts','utf8');

const mustContain = (source, values, label) => {
  for (const value of values) if (!source.includes(value)) throw new Error(`${label}:missing:${value}`);
};

mustContain(runtime, [
  "PARTNER_CASE_ID = 'MLP001_NE_PUBLIKOVAT_PREVIEW'",
  "owner: 'archive'",
  "owner: 'sources'",
  'AUDIO_FABRICATION_PROVEN',
  'ROMAN_DENIED_AUDIO_ROLE',
  'ROMAN_MURDER_THEORY_WEAKENED',
  "unlock(state, 'E11')",
  'evidence_exposure',
  'trust: { archive: 35, sources: 35 }',
], 'runtime');

for (const id of ['E01','E02','E03','E04','E05','E06','E07','E08','E09','E10','E11']) {
  if (!runtime.includes(`id: '${id}'`)) throw new Error(`runtime:missing-evidence:${id}`);
}

mustContain(session, [
  'duel_room_players',
  'partner_room_states',
  'compareAndSave',
  'partner_partner_required',
  'safePartnerView',
], 'session');

mustContain(ai, [
  'romanSpeakingContext',
  'Материал, показанный вторым расследователем',
  'ai_detective_claim_turn',
  'store:false',
], 'ai');

mustContain(client, [
  "const CASE_ID = 'MLP001_NE_PUBLIKOVAT_PREVIEW'",
  "action:'create'",
  "act('PRESENT_EVIDENCE'",
  "act('CHALLENGE_ROMAN'",
  'recent_history:chatHistory.slice(-8)',
  'setInterval(syncSnapshot, 2200)',
], 'client');

mustContain(html, [
  '2 игрока',
  '2 устройства',
  'data-board',
  'data-role-intro',
], 'html');
if (!html.includes('data-roman') && !html.includes('data-characters')) throw new Error('html:missing:interrogation-surface');

if (/partner\.evidence/i.test(client)) throw new Error('client must not expose partner raw evidence');
if (/correct_choice|expected.*snapshot/i.test(client)) throw new Error('client must not receive deduction answers');

console.log('Partner Premium v1 contract OK (preview shell compatible)');
