import fs from 'node:fs';
import assert from 'node:assert/strict';

const migration=fs.readFileSync('supabase/migrations/20260830115500_ai_case_session_state.sql','utf8');
const runtime=fs.readFileSync('supabase/functions/_shared/ai-case-runtime.ts','utf8');

assert.match(migration,/create table if not exists public\.ai_case_sessions/,'v2 needs server-authoritative session state');
assert.match(migration,/session_key text primary key check \(session_key ~ '\^\[0-9a-f\]\{64\}\$'\)/,'session key must be a server-derived SHA-256 digest');
assert.match(migration,/case_id text not null references public\.ai_case_canon\(case_id\) on delete cascade/,'session must belong to a private canon case');
assert.match(migration,/entitlement_id uuid not null references public\.access_entitlements\(id\) on delete cascade/,'session must belong to a verified entitlement');
assert.match(migration,/unique \(case_id, entitlement_id\)/,'one purchase must have one authoritative progress state per case');
assert.match(migration,/"rule_ids":\[\]/,'applied canon rules must be persisted for one-shot unlock semantics');
assert.match(migration,/revision integer not null default 0/,'session state needs optimistic concurrency control');
assert.match(migration,/alter table public\.ai_case_sessions enable row level security/,'session state must have RLS defense in depth');
assert.match(migration,/revoke all on table public\.ai_case_sessions from public, anon, authenticated/,'browser roles must not read or mutate authoritative progress');
assert.match(migration,/grant select, insert, update, delete on table public\.ai_case_sessions to service_role/,'only trusted server code may manage v2 progress');

assert.match(runtime,/paid_case_payloads\?select=case_id,product_id,status,payload,payload_version/,'runtime must load player-visible case data server-side');
assert.match(runtime,/ai_case_canon\?select=case_id,status,canon_version,canon/,'runtime must load private canon separately');
assert.match(runtime,/status=eq\.published/,'only published case/canon records may run');
assert.match(runtime,/const tokenHash=await digestHex\(token\)/,'opaque purchase token must be hashed before entitlement lookup');
assert.doesNotMatch(runtime,/token_hash.*accessToken|access_token.*ai_case_sessions/,'plaintext access tokens must never be persisted as session state');
assert.match(runtime,/ai-v2-session:\$\{caseId\}:\$\{entitlementId\}/,'server session scope must depend only on purchased entitlement and case');
assert.doesNotMatch(runtime,/clientSessionId|client_session_id/,'clearing browser storage must not create a fresh paid investigation budget');
assert.match(runtime,/case_id=eq\.\$\{encodeURIComponent\(input\.runtime\.caseId\)\}&entitlement_id=eq\.\$\{input\.runtime\.entitlement\.id\}/,'authoritative progress must be restored by case and entitlement');
assert.match(runtime,/revision=eq\.\$\{input\.expectedRevision\}/,'state writes must reject stale concurrent revisions');
assert.match(runtime,/evidence_not_discovered/,'browser may present only evidence already unlocked server-side');
assert.match(runtime,/state\.rule_ids\.includes\(rule\.id\)/,'unlock rules must not be replayed repeatedly');
assert.match(runtime,/ai_canon_rule_when_invalid/,'a canon rule with no real gate must be rejected');
assert.match(runtime,/ai_canon_rule_reference_invalid/,'canon rule references must resolve to known notes/evidence');
assert.match(runtime,/ai_canon_rule_self_reference/,'a rule cannot require the note it grants itself');
assert.match(runtime,/state\.successful_turns>=runtime\.publicCase\.max_turns/,'runtime itself must enforce the case turn limit');
assert.match(runtime,/unique\(\[\.\.\.initialEvidenceIds,\.\.\.storedEvidence\]\)/,'initial evidence must survive corrupted/partial persisted state');
assert.match(runtime,/safeSessionPayload/,'the endpoint needs a dedicated safe projection rather than returning canon/state internals');
assert.doesNotMatch(runtime,/discovered_evidence_ids|discovered_note_ids/,'v2 must not accept v1-style browser-authoritative discovery claims');

console.log('AI interrogation v2 foundation contract: ok');
