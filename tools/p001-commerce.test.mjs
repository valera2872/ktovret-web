import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Test actual handler source with all external I/O replaced by fixtures.
// Node >=22.13: --experimental-strip-types. No network, database or bank access.
const base='supabase/functions';
const P='p001-premium-solo', C='P-001', S='solo_investigations_v1', T='tikhaya_noch_v1';
const orderId='11111111-1111-4111-8111-111111111111';
const token='fixture-token';
const hash='a'.repeat(64);
const origin='https://mysterylogic.com';
const tmp=mkdtempSync(join(tmpdir(),'p001-commerce-'));
let seq=0;
async function fixture(slug,{enabled=false,published=false,xp=0,order=null,bankStatus='CONFIRMED',other=null,validSignature=true}={}){
  const writes=[],calls=[];
  const model={
    player_profiles:{xp},
    solo_case_definitions:{status:published?'published':'draft',classification:'PRIVATE_CANON_PRODUCTION',production_eligible:published},
    paid_case_payloads:published?{case_id:C}:null,
    payment_orders:order,
    access_entitlements:null,
  };
  function query(table){
    let op='select', value, filters=[];
    const q={
      select(){return q},eq(k,v){filters.push(['eq',k,v]);return q},neq(k,v){filters.push(['neq',k,v]);return q},order(){return q},limit(){return q},
      insert(v){op='insert';value=v;return q},update(v){op='update';value=v;return q},upsert(v){op='upsert';value=v;return q},
      maybeSingle(){return run()},single(){return run()},then(a,b){return run().then(a,b)}
    };
    async function run(){
      if(op!=='select'){writes.push({table,op,value,filters:[...filters]});return {data:{id:'entitlement-fixture',product_id:value.product_id},error:null}}
      if(table==='payment_orders'&&filters.some(f=>f[1]==='client_request_id'))return {data:null,error:null};
      if(table==='payment_orders'&&filters.some(f=>f[0]==='neq'))return {data:other,error:null};
      return {data:model[table]??null,error:null};
    }
    return q;
  }
  const deps={
    SUPABASE_URL:'https://fixture.invalid',TBANK_TERMINAL_KEY:'fixture-terminal',
    adminClient:()=>({from:query}),cleanOrigin:s=>s,isAllowedOrigin:s=>s===origin,
    json:(status,data)=>new Response(JSON.stringify(data),{status}),corsHeaders:()=>({}),
    sha256:async()=>hash,validAccessToken:s=>s===token,validEmail:()=>true,validUuid:()=>true,
    formatAmount:n=>n.toFixed(2),amountToKopecks:n=>Math.round(Number(n)*100),
    tbankConfigReady:()=>true,verifyTbankToken:async()=>validSignature,
    tbankPaymentMatchesOrder:(payment,o)=>payment.PaymentId===o.provider_payment_id&&payment.OrderId===o.id&&payment.Amount===Math.round(Number(o.amount_value)*100),
    tbankRequest:async(method,body)=>{calls.push({method,body});return method==='Init'?{PaymentId:'fixture-pay',PaymentURL:'https://fixture.invalid/pay',Status:'NEW'}:{PaymentId:order.provider_payment_id,OrderId:order.id,Amount:Math.round(Number(order.amount_value)*100),Status:bankStatus}}
  };
  let handler;
  globalThis.__p001Fixture={deps,Deno:{env:{get:k=>k==='P001_CHECKOUT_ENABLED'&&enabled?'true':undefined},serve:f=>{handler=f}}};
  const source=readFileSync(join(base,slug,'index.ts'),'utf8')
    .replace(/^import[^\n]+\n/gm,'');
  const file=join(tmp,slug+'-'+(++seq)+'.mts');
  writeFileSync(file,'const {deps,Deno}=globalThis.__p001Fixture; const {'+Object.keys(deps).join(',')+'}=deps;\n'+source);
  await import(pathToFileURL(file).href);
  assert.equal(typeof handler,'function');
  return {handler,writes,calls};
}
function checkout(productId){return new Request(origin,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({productId,accessToken:token,requestId:orderId,email:'fixture@example.invalid',offerAccepted:true,privacyAcknowledged:true,returnUrl:origin+'/fixture/',browserKey:'b'.repeat(48)})})}
function status(){return new Request(origin,{method:'POST',headers:{origin,authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({orderId})})}
function webhook(amount=29900){return new Request(origin,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({TerminalKey:'fixture-terminal',OrderId:orderId,PaymentId:'fixture-pay',Amount:amount,Status:'CONFIRMED'})})}
const makeOrder=(product_id=P,amount_value=299)=>({id:orderId,product_id,amount_value,token_hash:hash,status:'pending',provider_payment_id:'fixture-pay',payment_provider:'tbank',metadata:{}});
test('P001 actual handler: release switch and published case both required',async()=>{
  for(const opts of [{enabled:false,published:true},{enabled:true,published:false}]){
    const f=await fixture('create-checkout-solo',opts);assert.equal((await f.handler(checkout(P))).status,403);assert.equal(f.calls.length,0);assert.equal(f.writes.length,0);
  }
});
test('actual checkout handler: existing product prices unchanged and P001 299',async()=>{
  for(const [product,price,xp] of [[S,99,0],[T,249,0],[T,199,240],[P,299,999]]){
    const f=await fixture('create-checkout-solo',{enabled:true,published:true,xp});
    const response=await f.handler(checkout(product));assert.equal(response.status,200);
    assert.equal((await response.json()).amountRub,price);
    const init=f.calls.find(c=>c.method==='Init').body;
    assert.equal(init.Amount,price*100);assert.equal(init.Receipt.Items[0].Amount,price*100);
    const insert=f.writes.find(w=>w.op==='insert');assert.equal(insert.value.product_id,product);
    if(product===P){assert.equal(insert.value.case_id,C);assert.equal(insert.value.metadata.dossier_discount,false)}
  }
});
test('actual status and webhook: P001 purchase is scoped and permanent',async()=>{
  for(const slug of ['payment-status-solo','tbank-webhook-solo']){
    const f=await fixture(slug,{order:makeOrder()});assert.equal((await f.handler(slug==='payment-status-solo'?status():webhook())).status,200);
    const e=f.writes.find(w=>w.table==='access_entitlements'&&w.op==='upsert').value;
    assert.equal(e.product_id,P);assert.equal(e.expires_at,null);assert.deepEqual(e.metadata.allowed_case_ids,[C]);assert.equal(e.metadata.case_id,C);
  }
});
test('actual webhook: bad signature and amount cannot grant access',async()=>{
  for(const [opts,amount,code] of [[{validSignature:false},29900,403],[{},1,409]]){
    const f=await fixture('tbank-webhook-solo',{order:makeOrder(),...opts});
    assert.equal((await f.handler(webhook(amount))).status,code);assert.equal(f.writes.length,0);assert.equal(f.calls.length,0);
  }
});
test('actual refund path: revoke only refunded product, preserve second paid order',async()=>{
  for(const slug of ['payment-status-solo','tbank-webhook-solo']){
    for(const other of [null,{...makeOrder(),id:'other',status:'paid',paid_at:'2026-11-27T00:00:00Z'}]){
      const f=await fixture(slug,{order:makeOrder(),bankStatus:'REFUNDED',other});
      assert.equal((await f.handler(slug==='payment-status-solo'?status():webhook())).status,200);
      const e=f.writes.find(w=>w.table==='access_entitlements');
      if(other){assert.equal(e.op,'upsert');assert.equal(e.value.product_id,P);assert.deepEqual(e.value.metadata.allowed_case_ids,[C])}
      else{assert.equal(e.value.status,'refunded');assert.ok(e.filters.some(x=>x[1]==='product_id'&&x[2]===P))}
    }
  }
});
test.after(()=>{delete globalThis.__p001Fixture;rmSync(tmp,{recursive:true,force:true})});
