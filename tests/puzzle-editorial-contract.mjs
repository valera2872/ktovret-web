import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const assert=(condition,message)=>{if(!condition)throw new Error(`puzzle editorial contract: ${message}`)};

const migration=read('supabase/migrations/20260830123554_puzzle_editorial_queue.sql');
const edge=read('supabase/functions/puzzle-editorial/index.ts');
const admin=read('admin/puzzles/index.html');
const client=read('assets/puzzle-admin.js');
const gate=read('tools/import-mobile/puzzle-editorial-gate.mjs');
const importer=read('tools/import-mobile-cases.mjs');

assert(migration.includes('alter table public.puzzle_editorial_queue enable row level security'),'RLS missing');
assert(migration.includes('revoke all on table public.puzzle_editorial_queue from anon, authenticated'),'client grants not revoked');
assert(migration.includes('grant select, insert, update, delete on table public.puzzle_editorial_queue to service_role'),'service role grant missing');
assert(edge.includes("url.searchParams.get('mode') === 'approved-manifest'"),'approved manifest missing');
assert(edge.includes(".eq('moderation_status', 'approved')"),'manifest is not approved-only');
assert(edge.includes('fingerprint: await sha256(canonical(row.content))'),'manifest fingerprint missing');
assert(!/approved-manifest[\s\S]{0,900}content:\s*row\.content/.test(edge),'public manifest leaks puzzle content');
assert(edge.includes('if (!(await authorize(req, admin)))'),'owner authorization missing');
assert(edge.includes(".from('review_moderation_access')"),'shared moderator access table missing');
assert(admin.includes('noindex,nofollow,noarchive'),'admin robots guard missing');
assert(admin.includes('На проверке')&&admin.includes('Утверждены')&&admin.includes('Отклонены'),'admin moderation tabs missing');
assert(client.includes('mysterylogic:review-admin-token:v1'),'admin does not reuse owner token session');
assert(client.includes('data-moderate="approved"')&&client.includes('data-moderate="rejected"'),'individual approve/reject actions missing');
assert(!client.includes('Утвердить все'),'bulk approval must not exist');
assert(gate.includes("crypto.createHash('sha256')"),'build fingerprint validation missing');
assert(gate.includes('exact.length===source.length'),'release must require every current quick puzzle');
assert(importer.includes('await resolvePuzzleEditorialGate()'),'public generator does not consult editorial gate');
assert(importer.includes("reason:'editorial_preview'"),'editorial QA bypass missing');
assert(importer.includes('puzzleEditorial.ready')&&importer.includes('routes:[]'),'fail-closed generator fallback missing');
console.log('Puzzle editorial contract OK');
