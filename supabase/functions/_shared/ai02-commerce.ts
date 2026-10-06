import { formatAmount } from './last-aria-payment.ts';
import { amountToKopecks, tbankPaymentMatchesOrder, tbankRequest } from './last-aria-tbank.ts';

export const AI02_PRODUCT_ID = 'ai02-nk';
export const AI02_PRIMARY_CASE_ID = 'AI02-NK-STANDARD';
export const AI02_ALLOWED_CASE_IDS = Object.freeze(['AI02-NK-EASY','AI02-NK-STANDARD','AI02-NK-HARD']);
export const AI02_PRICE_RUB = 299;
export const AI02_DOSSIER_DISCOUNT_RUB = 50;
export const AI02_DOSSIER_PRICE_RUB = 249;
export const AI02_DESCRIPTION = 'Mystery Logic — AI-расследование «Нулевая копия»';
export const AI02_RECEIPT_NAME = 'Цифровой доступ Mystery Logic — «Нулевая копия»';

const BROWSER_KEY_RE=/^[a-f0-9]{48}$/;

const sha256=async(value:string)=>{
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
};

export const ai02AmountValue=(discounted=false)=>formatAmount(discounted?AI02_DOSSIER_PRICE_RUB:AI02_PRICE_RUB);
export const ai02AmountKopecks=(discounted=false)=>amountToKopecks(discounted?AI02_DOSSIER_PRICE_RUB:AI02_PRICE_RUB);

export const ai02DossierDiscount=async(admin:any,browserKeyInput:unknown)=>{
  const browserKey=String(browserKeyInput||'').trim().toLowerCase();
  if(!BROWSER_KEY_RE.test(browserKey))return {eligible:false,completedCases:0,reason:'no_dossier_identity'};
  const visitorHash=await sha256(browserKey);
  const {data:profile,error:profileError}=await admin.from('player_profiles').select('id').eq('visitor_key_hash',visitorHash).maybeSingle();
  if(profileError)throw new Error('dossier_lookup_failed');
  if(!profile?.id)return {eligible:false,completedCases:0,reason:'dossier_not_found'};
  const {count,error}=await admin.from('player_case_progress').select('case_id',{count:'exact',head:true}).eq('player_id',profile.id).eq('status','completed');
  if(error)throw new Error('dossier_progress_failed');
  const completedCases=Math.max(0,Number(count||0));
  return {eligible:completedCases>=15,completedCases,reason:completedCases>=15?'dossier_complete':'dossier_incomplete'};
};

const activateEntitlement=async(admin:any,order:any,payment:any)=>{
  if(!tbankPaymentMatchesOrder(payment,order))throw new Error('payment_order_mismatch');
  if(String(payment.Status||'')!=='CONFIRMED')throw new Error('payment_not_confirmed');
  const paymentId=String(payment.PaymentId||'');
  const now=new Date().toISOString();
  const discounted=Number(order.amount_value)===AI02_DOSSIER_PRICE_RUB;
  const {data:entitlement,error:entitlementError}=await admin.from('access_entitlements').upsert({
    token_hash:order.token_hash,
    product_id:AI02_PRODUCT_ID,
    status:'active',
    payment_provider:'tbank',
    payment_reference:paymentId,
    customer_email_hash:order.customer_email_hash||null,
    starts_at:now,
    expires_at:null,
    revoked_at:null,
    metadata:{
      source:'purchase',
      order_id:order.id,
      case_id:AI02_PRIMARY_CASE_ID,
      allowed_case_ids:[...AI02_ALLOWED_CASE_IDS],
      experience_tier:'text',
      list_price_rub:AI02_PRICE_RUB,
      charged_price_rub:Number(order.amount_value),
      dossier_discount_rub:discounted?AI02_DOSSIER_DISCOUNT_RUB:0,
    },
    updated_at:now,
  },{onConflict:'token_hash,product_id'}).select('id').single();
  if(entitlementError||!entitlement?.id)throw entitlementError||new Error('entitlement_write_failed');
  const {error:orderError}=await admin.from('payment_orders').update({
    status:'paid',provider_status:'CONFIRMED',paid_at:order.paid_at||now,entitlement_id:entitlement.id,failure_code:null,updated_at:now,
  }).eq('id',order.id);
  if(orderError)throw orderError;
  return entitlement.id;
};

export const finalizeAi02Refund=async(admin:any,order:any)=>{
  const now=new Date().toISOString();
  if(order.entitlement_id){
    const {error}=await admin.from('access_entitlements').update({status:'refunded',revoked_at:now,updated_at:now}).eq('id',order.entitlement_id);
    if(error)throw error;
  }else{
    const {error}=await admin.from('access_entitlements').update({status:'refunded',revoked_at:now,updated_at:now}).eq('token_hash',order.token_hash).eq('product_id',AI02_PRODUCT_ID);
    if(error)throw error;
  }
  const {error:orderError}=await admin.from('payment_orders').update({status:'refunded',provider_status:'REFUNDED',refunded_at:now,updated_at:now}).eq('id',order.id);
  if(orderError)throw orderError;
  return {...order,status:'refunded',provider_status:'REFUNDED'};
};

const canceledStatuses=new Set(['CANCELED','REJECTED','REVERSED','DEADLINE_EXPIRED']);

export const refreshAi02TbankOrder=async(admin:any,order:any)=>{
  if(!order?.provider_payment_id)return order;
  const payment=await tbankRequest('GetState',{PaymentId:String(order.provider_payment_id)});
  if(!tbankPaymentMatchesOrder(payment,order))throw new Error('payment_order_mismatch');
  const providerStatus=String(payment.Status||'');
  if(providerStatus==='CONFIRMED'){
    const entitlementId=await activateEntitlement(admin,order,payment);
    return {...order,status:'paid',provider_status:providerStatus,entitlement_id:entitlementId};
  }
  if(providerStatus==='REFUNDED')return finalizeAi02Refund(admin,order);
  if(canceledStatuses.has(providerStatus)){
    const now=new Date().toISOString();
    await admin.from('payment_orders').update({status:'canceled',provider_status:providerStatus,canceled_at:now,updated_at:now}).eq('id',order.id).neq('status','paid');
    return {...order,status:order.status==='paid'?'paid':'canceled',provider_status:providerStatus};
  }
  await admin.from('payment_orders').update({provider_status:providerStatus||null,status:order.status==='creating'?'pending':order.status,updated_at:new Date().toISOString()}).eq('id',order.id).neq('status','paid');
  return {...order,status:order.status==='creating'?'pending':order.status,provider_status:providerStatus};
};
