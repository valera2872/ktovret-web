import fs from 'node:fs';
import assert from 'node:assert/strict';

const migration=fs.readFileSync('supabase/migrations/20260830113713_ai_server_canon_store.sql','utf8');

assert.match(migration,/create table if not exists public\.ai_case_canon/,'AI canon store must exist');
assert.match(migration,/case_id text primary key references public\.paid_case_payloads\(case_id\) on delete cascade/,'private canon must be attached to a real paid case');
assert.match(migration,/status text not null default 'draft' check \(status in \('draft','published','retired'\)\)/,'canon lifecycle must be explicit');
assert.match(migration,/canon jsonb not null check \(jsonb_typeof\(canon\) = 'object'\)/,'canon must be structured server data');
assert.match(migration,/alter table public\.ai_case_canon enable row level security/,'canon table must use RLS defense in depth');
assert.match(migration,/revoke all on table public\.ai_case_canon from public, anon, authenticated/,'browser-facing roles must have no direct canon privileges');
assert.match(migration,/grant select, insert, update, delete on table public\.ai_case_canon to service_role/,'only trusted server code may manage canon records');
assert.match(migration,/Never returned to the browser/,'schema documentation must preserve the private-canon boundary');
assert.doesNotMatch(migration,/grant .*ai_case_canon.* to anon|grant .*ai_case_canon.* to authenticated/i,'canon must never be granted to public client roles');

console.log('AI server canon contract: ok');
