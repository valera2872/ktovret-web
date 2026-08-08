'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');

const root=path.resolve(__dirname,'..');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'assets/generated/cases-index.json'),'utf8'));
const report=JSON.parse(fs.readFileSync(path.join(root,'assets/generated/import-report.json'),'utf8'));
const client=fs.readFileSync(path.join(root,'assets/paid-access-client.js'),'utf8');
const runtime=fs.readFileSync(path.join(root,'assets/paid-access-config.js'),'utf8');
const edge=fs.readFileSync(path.join(root,'supabase/functions/case-access/index.ts'),'utf8');
const migration=fs.readFileSync(path.join(root,'supabase/migrations/20260808181000_paid_access.sql'),'utf8');
const gitignore=fs.readFileSync(path.join(root,'.gitignore'),'utf8');

const premium=catalog.cases.filter((item)=>item.access==='premium');
const free=catalog.cases.filter((item)=>item.access==='free');
assert.equal(premium.length,85,'premium boundary must remain 85');
assert.equal(free.length,15,'free boundary must remain 15');
assert.equal(report.paidGatewayPages,85,'all 85 locked pages need the gateway');

for(const item of premium){
  const html=fs.readFileSync(path.join(root,item.legacyPath,'index.html'),'utf8');
  assert.ok(html.includes('data-paid-case-gateway="1.10.0"'),`${item.id} needs paid gateway marker`);
  assert.ok(html.includes('data-paid-access-panel'),`${item.id} needs paid access panel`);
  assert.ok(html.includes('paid-access-client.js?v=1.10.0'),`${item.id} needs paid access client`);
  assert.ok(html.includes('paid-access-config.js?v=1.10.0'),`${item.id} needs paid access runtime config`);
  assert.ok(!html.includes('window.KtoVretWeb='),`${item.id} must not expose paid game config publicly`);
}

for(const item of free){
  const html=fs.readFileSync(path.join(root,item.path,'index.html'),'utf8');
  assert.ok(html.includes('window.KtoVretWeb='),`${item.id} free case must remain directly playable`);
  assert.ok(!html.includes('data-paid-case-gateway='),`${item.id} free case must not get paywall gateway`);
}

assert.ok(runtime.includes("endpoint:''"),'backend endpoint must stay disabled until backend deploy');
assert.ok(runtime.includes("productId:'volume1'"),'volume1 product id missing');
assert.ok(client.includes('authorization: `Bearer ${token}`'),'browser must use bearer entitlement token');
assert.ok(client.includes('localStorage.setItem(storageKey, token)'),'browser must persist the opaque access token only');
assert.ok(!client.includes('SERVICE_ROLE'),'service-role secret must never be present in browser code');
assert.ok(edge.includes("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"),'edge function must keep service role server-side');
assert.ok(edge.includes("crypto.subtle.digest(\n  'SHA-256'"),'edge function must hash opaque token before lookup');
assert.ok(edge.includes(".from('access_entitlements')"),'edge function must verify entitlement');
assert.ok(edge.includes(".from('paid_case_payloads')"),'edge function must read paid payload only after access check');
assert.ok(edge.includes("'cache-control': 'private, no-store, max-age=0'"),'paid payload responses must not be publicly cached');
assert.ok(migration.includes('enable row level security'),'paid tables must have RLS enabled');
assert.ok(migration.includes('revoke all on table public.paid_case_payloads from anon, authenticated'),'paid payload table must deny browser roles');
assert.ok(migration.includes('revoke all on table public.access_entitlements from anon, authenticated'),'entitlements table must deny browser roles');
assert.ok(gitignore.includes('.secure-backend/'),'secure payload export must be gitignored');
assert.ok(!fs.existsSync(path.join(root,'.secure-backend')),'secure backend export must not exist in public build tree');

console.log('paid access 1.10 boundary passed: 15 public playable / 85 server-gated locked pages');
