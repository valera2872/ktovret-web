import { adminClient } from './payment.ts';
import { tbankPaymentMatchesOrder, tbankRequest } from './tbank.ts';

export const SOLO_INVESTIGATIONS_PRODUCT_ID='solo_investigations_v1';
export const SOLO_INVESTIGATIONS_PRICE_RUB=99;
export const SOLO_INVESTIGATIONS_CASE_COUNT=10;
export const SOLO_INVESTIGATIONS_RECEIPT_NAME='Mystery Logic — Расследования, Том I (10 дел)';
export const SOLO_INVESTIGATIONS_DESCRIPTION='Mystery Logic — Расследования для одного, Том I: 10 дел';

export const activateSoloOrder=async(admin:any,order:any,payment:any)=>{
  if(String(order?.product_id||'')!==SOLO_INVESTIGATIONS_PRODUCT_ID)throw new Error('wrong_product');
  if(!tbankPaymentMatchesOrder(payment,order))throw new Error('payment_order_mismatch');
  if(String(payment?.Status||'')!=='CONFIRMED')throw new Error('payment_not_confirmed');
  const now=new Date().toISOString();
  const paymentId=String(payment.PaymentId||order.provider_payment_id||'');
  const {data:entitlement,error:entitlementError}=await admin.from('access_entitlements').upsert({
    token_hash:order.token_hash,
    product_id:SOLO_INVESTIGATIONS_PRODUCT_ID,
    status:'active',
    payment_provider:'tbank',
    payment_reference:paymentId,
    customer_email_hash:order.customer_email_hash||null,
    starts_at:now,
    expires_at:null,
    revoked_at:null,
    metadata:{order_id:order.id,source:'tbank',purchase_product_id:SOLO_INVESTIGATIONS_PRODUCT_ID},
    updated_at:now,
  },{onConflict:'token_hash,product_id'}).select('id,product_id').single();
  if(entitlementError||!entitlement)throw entitlementError||new Error('entitlement_write_failed');
  const {error:orderError}=await admin.from('payment_orders').update({
    status:'paid',provider_status:'CONFIRMED',paid_at:order.paid_at||now,entitlement_id:entitlement.id,failure_code:null,
    metadata:{...(order.metadata||{}),entitlement_product_ids:[SOLO_INVESTIGATIONS_PRODUCT_ID]},updated_at:now,
  }).eq('id',order.id);
  if(orderError)throw orderError;
  return entitlement.id;
};

export const refundSoloOrder=async(admin:any,order:any,payment:any)=>{
  if(String(order?.product_id||'')!==SOLO_INVESTIGATIONS_PRODUCT_ID)throw new Error('wrong_product');
  if(!tbankPaymentMatchesOrder(payment,order))throw new Error('payment_order_mismatch');
  if(String(payment?.Status||'')!=='REFUNDED')throw new Error('payment_not_refunded');
  const now=new Date().toISOString();
  const {error:revokeError}=await admin.from('access_entitlements').update({status:'refunded',revoked_at:now,updated_at:now})
    .eq('token_hash',order.token_hash).eq('product_id',SOLO_INVESTIGATIONS_PRODUCT_ID);
  if(revokeError)throw revokeError;
  const {error:orderError}=await admin.from('payment_orders').update({status:'refunded',provider_status:'REFUNDED',refunded_at:now,updated_at:now}).eq('id',order.id);
  if(orderError)throw orderError;
};

const canceled=new Set(['CANCELED','REJECTED','REVERSED','DEADLINE_EXPIRED']);
export const refreshSoloOrder=async(admin:any,order:any)=>{
  if(!order?.provider_payment_id)return order;
  const payment=await tbankRequest('GetState',{PaymentId:String(order.provider_payment_id)});
  if(!tbankPaymentMatchesOrder(payment,order))throw new Error('payment_order_mismatch');
  const status=String(payment.Status||'');
  if(status==='CONFIRMED'){const entitlementId=await activateSoloOrder(admin,order,payment);return {...order,status:'paid',provider_status:status,entitlement_id:entitlementId};}
  if(status==='REFUNDED'){await refundSoloOrder(admin,order,payment);return {...order,status:'refunded',provider_status:status};}
  if(canceled.has(status)){
    const now=new Date().toISOString();
    await admin.from('payment_orders').update({status:'canceled',provider_status:status,canceled_at:now,updated_at:now}).eq('id',order.id).neq('status','paid');
    return {...order,status:order.status==='paid'?'paid':'canceled',provider_status:status};
  }
  await admin.from('payment_orders').update({provider_status:status||null,status:order.status==='creating'?'pending':order.status,updated_at:new Date().toISOString()}).eq('id',order.id).neq('status','paid');
  return {...order,status:order.status==='creating'?'pending':order.status,provider_status:status};
};

export const soloAdmin=()=>adminClient();
