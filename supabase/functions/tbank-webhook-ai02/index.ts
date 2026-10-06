import {
  adminClient,
} from 'https://raw.githubusercontent.com/valera2872/ktovret-web/3216728a009086db452885a62df180cd044faac6/supabase/functions/_shared/payment.ts';
import {
  TBANK_TERMINAL_KEY,
  amountToKopecks,
  tbankConfigReady,
  tbankPaymentMatchesOrder,
  tbankRequest,
  verifyTbankToken,
} from 'https://raw.githubusercontent.com/valera2872/ktovret-web/3216728a009086db452885a62df180cd044faac6/supabase/functions/_shared/tbank.ts';

const ORDER_PRODUCT_ID='ai02_zero_copy';
const ENTITLEMENT_PRODUCT_ID='ai02-zero-copy';
const CASE_IDS=['AI02-NK-EASY','AI02-NK-STANDARD','AI02-NK-HARD'];
const canceledStatuses=new Set(['CANCELED','REJECTED','REVERSED','DEADLINE_EXPIRED']);
const ok=()=>new Response('OK',{status:200,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
const fail=(status:number,text:string)=>new Response(text,{status,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});

async function readNotification(req:Request){
  const type=(req.headers.get('content-type')||'').toLowerCase();
  if(type.includes('application/json'))return await req.json();
  const text=await req.text();
  try{return JSON.parse(text)}catch{}
  return Object.fromEntries(new URLSearchParams(text));
}

async function grant(admin:any,order:any,payment:any){
  if(!tbankPaymentMatchesOrder(payment,order))throw new Error('payment_order_mismatch');
  if(String(payment.Status||'')!=='CONFIRMED')throw new Error('payment_not_confirmed');
  const now=new Date().toISOString();
  const paymentId=String(payment.PaymentId||'');
  const {data:entitlement,error:entitlementError}=await admin.from('access_entitlements').upsert({
    token_hash:order.token_hash,
    product_id:ENTITLEMENT_PRODUCT_ID,
    status:'active',
    payment_provider:'tbank',
    payment_reference:paymentId,
    customer_email_hash:order.customer_email_hash||null,
    starts_at:now,
    expires_at:null,
    revoked_at:null,
    metadata:{
      order_id:order.id,
      source:'tbank',
      purchase_product_id:ORDER_PRODUCT_ID,
      case_id:String(order.case_id||'AI02-NK-STANDARD'),
      allowed_case_ids:CASE_IDS,
      experience_tier:'text',
      price_tier:String(order.metadata?.price_tier||'standard'),
      dossier_discount:Boolean(order.metadata?.dossier_discount),
      dossier_xp:order.metadata?.dossier_xp??null,
    },
    updated_at:now,
  },{onConflict:'token_hash,product_id'}).select('id').single();
  if(entitlementError||!entitlement?.id)throw entitlementError||new Error('entitlement_write_failed');

  const {error:orderError}=await admin.from('payment_orders').update({
    status:'paid',
    provider_status:'CONFIRMED',
    paid_at:order.paid_at||now,
    entitlement_id:entitlement.id,
    failure_code:null,
    metadata:{...(order.metadata||{}),entitlement_product_ids:[ENTITLEMENT_PRODUCT_ID]},
    updated_at:now,
  }).eq('id',order.id);
  if(orderError)throw orderError;
}

async function revoke(admin:any,order:any){
  const now=new Date().toISOString();
  const {error:revokeError}=await admin.from('access_entitlements').update({
    status:'refunded',revoked_at:now,updated_at:now,
  }).eq('token_hash',order.token_hash).eq('product_id',ENTITLEMENT_PRODUCT_ID);
  if(revokeError)throw revokeError;
  const {error:orderError}=await admin.from('payment_orders').update({
    status:'refunded',provider_status:'REFUNDED',refunded_at:now,updated_at:now,
  }).eq('id',order.id);
  if(orderError)throw orderError;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return fail(405,'METHOD_NOT_ALLOWED');
  if(!tbankConfigReady())return fail(503,'NOT_CONFIGURED');

  let notification:any;
  try{notification=await readNotification(req)}catch{return fail(400,'INVALID_BODY')}
  if(!notification||typeof notification!=='object')return fail(400,'INVALID_BODY');
  if(!await verifyTbankToken(notification))return fail(403,'INVALID_TOKEN');
  if(String(notification.TerminalKey||'')!==TBANK_TERMINAL_KEY)return fail(403,'INVALID_TERMINAL');

  const orderId=String(notification.OrderId||'').trim();
  const paymentId=String(notification.PaymentId||'').trim();
  if(!orderId||!paymentId)return ok();

  const admin=adminClient();
  const {data:order,error:orderError}=await admin.from('payment_orders').select('*').eq('id',orderId).maybeSingle();
  if(orderError)return fail(503,'DB_ERROR');
  if(!order)return ok();
  if(String(order.product_id||'')!==ORDER_PRODUCT_ID)return ok();
  if(String(order.payment_provider||'')!=='tbank')return ok();
  if(String(order.provider_payment_id||'')!==paymentId)return fail(409,'PAYMENT_MISMATCH');
  if(notification.Amount!=null&&Number(notification.Amount)!==amountToKopecks(order.amount_value))return fail(409,'AMOUNT_MISMATCH');

  const providerStatus=String(notification.Status||'').trim();
  try{
    if(providerStatus==='REFUNDED'){
      await revoke(admin,order);
      return ok();
    }
    if(providerStatus){
      await admin.from('payment_orders').update({provider_status:providerStatus,updated_at:new Date().toISOString()}).eq('id',order.id);
    }
    if(providerStatus==='CONFIRMED'){
      const payment=await tbankRequest('GetState',{PaymentId:paymentId});
      await grant(admin,order,payment);
      return ok();
    }
    if(canceledStatuses.has(providerStatus)){
      const now=new Date().toISOString();
      await admin.from('payment_orders').update({status:'canceled',provider_status:providerStatus,canceled_at:now,updated_at:now}).eq('id',order.id).neq('status','paid');
    }
    return ok();
  }catch{
    return fail(503,'RETRY');
  }
});
