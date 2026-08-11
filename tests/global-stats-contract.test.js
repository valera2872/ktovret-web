const fs = require('fs');
const assert = require('assert');

const read = (path) => fs.readFileSync(path, 'utf8');

const app = read('ktovret-game/assets/app.js');
const client = read('ktovret-game/assets/global-stats-client.js');
const edge = read('supabase/functions/case-stats/index.ts');
const migration = read('supabase/migrations/20260812005000_case_first_results.sql');

assert(app.includes('global-stats-client.js?v=${assetVersion}'), 'app loader must attach global stats client with runtime cache key');
assert(client.includes('functions/v1/case-stats'), 'client must use server stats endpoint');
assert(client.includes("mysterylogic:challenge:client-key"), 'global stats and Challenge must share one anonymous browser identity');
assert(client.includes('sampleSufficient'), 'UI must avoid unstable percentile claims for tiny samples');
assert(client.includes('Топ ${top}%'), 'result UI must expose percentile after enough results');
assert(client.includes('Элитное раскрытие'), 'top-ten performance should receive a non-monetary elite status');
assert(client.includes('elapsedSeconds > 5400'), 'abandoned short-case tabs must not distort timing stats');

assert(migration.includes('primary key (case_id, player_key_hash)'), 'one immutable first result per browser and case is required');
assert(migration.includes('enable row level security'), 'raw stats table must be protected by RLS');
assert(migration.includes('get_case_first_result_stats'), 'aggregate stats must be computed server-side');
assert(migration.includes("v_total >= 20"), 'percentile needs a minimum sample size');

assert(edge.includes("insertError.code !== '23505'"), 'replays must not overwrite the first submitted result');
assert(edge.includes("rpc('get_case_first_result_stats'"), 'edge function must return server-computed rank and aggregate rates');
assert(!edge.includes('.upsert('), 'first-result endpoint must never upsert/overwrite performance');

console.log('global stats contract: ok');
