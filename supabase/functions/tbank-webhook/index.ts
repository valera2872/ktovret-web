import { adminClient } from 'https://raw.githubusercontent.com/valera2872/ktovret-web/3216728a009086db452885a62df180cd044faac6/supabase/functions/_shared/payment.ts';
import { TBANK_TERMINAL_KEY, amountToKopecks, tbankConfigReady, tbankPaymentMatchesOrder, tbankRequest, verifyTbankToken } from 'https://raw.githubusercontent.com/valera2872/ktovret-web/3216728a009086db452885a62df180cd044faac6/supabase/functions/_shared/tbank.ts';
import { notifySaleTelegram } from './telegram-sale-notify.ts';

const PRODUCT_ID='volume1';

const AI02_ORDER_PRODUCT_ID='ai02_zero_copy';
const AI02_ENTITLEMENT_PRODUCT_ID='ai02-zero-copy';
const AI02_CASE_IDS=['AI02-NK-EASY','AI02-NK-STANDARD','AI02-NK-HARD'];
async function grantAi02(admin:any,order:any,payment:any){
  if(!tbankPaymentMatchesOrder(payment,order))throw new Error('payment_order_mismatch');
  if(String(payment.Status||'')!=='CONFIRMED')throw new Error('payment_not_confirmed');
  const now=new Date().toISOString(),paymentId=String(payment.PaymentId||order.provider_payment_id||'');
  const {data:ent,error:e}=await admin.from('access_entitlements').upsert({
    token_hash:order.token_hash,product_id:AI02_ENTITLEMENT_PRODUCT_ID,status:'active',payment_provider:'tbank',payment_reference:paymentId,customer_email_hash:order.customer_email_hash||null,starts_at:now,expires_at:null,revoked_at:null,
    metadata:{order_id:order.id,source:'tbank',purchase_product_id:AI02_ORDER_PRODUCT_ID,case_id:String(order.case_id||'AI02-NK-STANDARD'),allowed_case_ids:AI02_CASE_IDS,experience_tier:'text',price_tier:String(order.metadata?.price_tier||'standard'),dossier_discount:Boolean(order.metadata?.dossier_discount),dossier_xp:order.metadata?.dossier_xp??null},
    updated_at:now
  },{onConflict:'token_hash,product_id'}).select('id').single();
  if(e||!ent?.id)throw e||new Error('entitlement_write_failed');
  const {error:oe}=await admin.from('payment_orders').update({status:'paid',provider_status:'CONFIRMED',paid_at:order.paid_at||now,entitlement_id:ent.id,failure_code:null,metadata:{...(order.metadata||{}),entitlement_product_ids:[AI02_ENTITLEMENT_PRODUCT_ID]},updated_at:now}).eq('id',order.id);
  if(oe)throw oe;
}
async function refundAi02(admin:any,order:any){
  const now=new Date().toISOString();
  const {error:re}=await admin.from('access_entitlements').update({status:'refunded',revoked_at:now,updated_at:now}).eq('token_hash',order.token_hash).eq('product_id',AI02_ENTITLEMENT_PRODUCT_ID);if(re)throw re;
  const {error:oe}=await admin.from('payment_orders').update({status:'refunded',provider_status:'REFUNDED',refunded_at:now,updated_at:now}).eq('id',order.id);if(oe)throw oe;
}

const ok=()=>new Response('OK',{status:200,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
const fail=(status:number,text:string)=>new Response(text,{status,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
const readNotification=async(req:Request)=>{const type=(req.headers.get('content-type')||'').toLowerCase();if(type.includes('application/json'))return await req.json();const text=await req.text();try{return JSON.parse(text)}catch{}return Object.fromEntries(new URLSearchParams(text));};

async function grant(admin:any,order:any,payment:any){
  if(!tbankPaymentMatchesOrder(payment,order)) throw new Error('payment_order_mismatch');
  if(String(payment.Status||'')!=='CONFIRMED') throw new Error('payment_not_confirmed');
  const now=new Date().toISOString();
  const paymentId=String(payment.PaymentId||order.provider_payment_id||'');
  const {data:ent,error:e}=await admin.from('access_entitlements').upsert({token_hash:order.token_hash,product_id:PRODUCT_ID,status:'active',payment_provider:'tbank',payment_reference:paymentId,customer_email_hash:order.customer_email_hash||null,starts_at:now,expires_at:null,revoked_at:null,metadata:{order_id:order.id,source:'tbank',purchase_product_id:PRODUCT_ID},updated_at:now},{onConflict:'token_hash,product_id'}).select('id').single();
  if(e||!ent?.id) throw e||new Error('entitlement_write_failed');
  const {error:oe}=await admin.from('payment_orders').update({status:'paid',provider_status:'CONFIRMED',paid_at:order.paid_at||now,entitlement_id:ent.id,failure_code:null,updated_at:now}).eq('id',order.id);
  if(oe) throw oe;
}
async function refund(admin:any,order:any){const now=new Date().toISOString();await admin.from('access_entitlements').update({status:'refunded',revoked_at:now,updated_at:now}).eq('token_hash',order.token_hash).eq('product_id',PRODUCT_ID);const {error}=await admin.from('payment_orders').update({status:'refunded',provider_status:'REFUNDED',refunded_at:now,updated_at:now}).eq('id',order.id);if(error)throw error;}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return fail(405,'METHOD_NOT_ALLOWED');
  if(!tbankConfigReady())return fail(503,'NOT_CONFIGURED');
  let n:any;try{n=await readNotification(req)}catch{return fail(400,'INVALID_BODY')}
  if(!n||typeof n!=='object')return fail(400,'INVALID_BODY');
  if(!await verifyTbankToken(n))return fail(403,'INVALID_TOKEN');
  if(String(n.TerminalKey||'')!==TBANK_TERMINAL_KEY)return fail(403,'INVALID_TERMINAL');
  const orderId=String(n.OrderId||'').trim(),paymentId=String(n.PaymentId||'').trim();if(!orderId||!paymentId)return ok();
  const admin=adminClient();
  const {data:order,error}=await admin.from('payment_orders').select('*').eq('id',orderId).maybeSingle();
  if(error)return fail(503,'DB_ERROR');if(!order)return ok();if(![PRODUCT_ID,AI02_ORDER_PRODUCT_ID].includes(String(order.product_id||'')))return ok();if(String(order.payment_provider||'')!=='tbank')return ok();if(String(order.provider_payment_id||'')!==paymentId)return fail(409,'PAYMENT_MISMATCH');
  if(n.Amount!=null&&Number(n.Amount)!==amountToKopecks(order.amount_value))return fail(409,'AMOUNT_MISMATCH');
  const status=String(n.Status||'').trim();
  try{
    if(status==='REFUNDED'){if(String(order.product_id||'')===AI02_ORDER_PRODUCT_ID)await refundAi02(admin,order);else await refund(admin,order);return ok();}
    if(status)await admin.from('payment_orders').update({provider_status:status,updated_at:new Date().toISOString()}).eq('id',order.id);
    if(status==='CONFIRMED'){
      const payment=await tbankRequest('GetState',{PaymentId:paymentId});
      if(String(order.product_id||'')===AI02_ORDER_PRODUCT_ID)await grantAi02(admin,order,payment);else await grant(admin,order,payment);
      if(String(order.status||'')!=='paid') await notifySaleTelegram({...order,status:'paid',provider_status:'CONFIRMED',paid_at:order.paid_at||new Date().toISOString()});
    } else if(['CANCELED','REJECTED','REVERSED','DEADLINE_EXPIRED'].includes(status)){
      const now=new Date().toISOString();await admin.from('payment_orders').update({status:'canceled',provider_status:status,canceled_at:now,updated_at:now}).eq('id',order.id).neq('status','paid');
    }
    return ok();
  }catch{return fail(503,'RETRY')}
});