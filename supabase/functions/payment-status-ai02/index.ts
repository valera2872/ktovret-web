import {
  adminClient,
  cleanOrigin,
  corsHeaders,
  isAllowedOrigin,
  json,
  sha256,
  validAccessToken,
  validUuid,
} from 'https://raw.githubusercontent.com/valera2872/ktovret-web/3216728a009086db452885a62df180cd044faac6/supabase/functions/_shared/payment.ts';
import {
  amountToKopecks,
  tbankConfigReady,
  tbankPaymentMatchesOrder,
  tbankRequest,
} from 'https://raw.githubusercontent.com/valera2872/ktovret-web/3216728a009086db452885a62df180cd044faac6/supabase/functions/_shared/tbank.ts';

const ORDER_PRODUCT_ID='ai02_zero_copy';
const ENTITLEMENT_PRODUCT_ID='ai02-zero-copy';
const CASE_IDS=['AI02-NK-EASY','AI02-NK-STANDARD','AI02-NK-HARD'];
const canceledStatuses=new Set(['CANCELED','REJECTED','REVERSED','DEADLINE_EXPIRED']);

const usable=(e:any)=>Boolean(e&&e.status==='active'&&!e.revoked_at&&(!e.starts_at||new Date(e.starts_at)<=new Date())&&(!e.expires_at||new Date(e.expires_at)>new Date()));

async function grant(admin:any,order:any,payment:any){
  if(!tbankPaymentMatchesOrder(payment,order))throw new Error('payment_order_mismatch');
  if(String(payment.Status||'')!=='CONFIRMED')throw new Error('payment_not_confirmed');
  const now=new Date().toISOString();
  const paymentId=String(payment.PaymentId||'');
  const metadata={
    order_id:order.id,
    source:'tbank',
    purchase_product_id:ORDER_PRODUCT_ID,
    case_id:String(order.case_id||'AI02-NK-STANDARD'),
    allowed_case_ids:CASE_IDS,
    experience_tier:'text',
    price_tier:String(order.metadata?.price_tier||'standard'),
    dossier_discount:Boolean(order.metadata?.dossier_discount),
    dossier_xp:order.metadata?.dossier_xp??null,
  };
  const {data:entitlement,error:entitlementError}=await admin
    .from('access_entitlements')
    .upsert({
      token_hash:order.token_hash,
      product_id:ENTITLEMENT_PRODUCT_ID,
      status:'active',
      payment_provider:'tbank',
      payment_reference:paymentId,
      customer_email_hash:order.customer_email_hash||null,
      starts_at:now,
      expires_at:null,
      revoked_at:null,
      metadata,
      updated_at:now,
    },{onConflict:'token_hash,product_id'})
    .select('id')
    .single();
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
  return entitlement.id;
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
  const origin=cleanOrigin(req.headers.get('origin')||'');
  if(req.method==='OPTIONS'){
    if(!isAllowedOrigin(origin))return new Response(null,{status:403});
    return new Response(null,{status:204,headers:corsHeaders(origin)});
  }
  if(req.method!=='POST')return json(405,{error:'method_not_allowed'},origin);
  if(!isAllowedOrigin(origin))return json(403,{error:'origin_not_allowed'},origin);
  if(!tbankConfigReady())return json(503,{error:'payment_service_not_configured'},origin);

  const auth=req.headers.get('authorization')||'';
  const token=auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()||'';
  if(!validAccessToken(token))return json(401,{error:'access_token_required'},origin);

  let body:any={};
  try{body=await req.json()}catch{return json(400,{error:'invalid_json'},origin)}
  const orderId=String(body.orderId||'').trim();
  if(!validUuid(orderId))return json(400,{error:'invalid_order_id'},origin);

  const tokenHash=await sha256(token);
  const admin=adminClient();
  const {data:order,error:orderError}=await admin.from('payment_orders').select('*').eq('id',orderId).maybeSingle();
  if(orderError)return json(503,{error:'order_lookup_failed'},origin);
  if(!order)return json(404,{error:'order_not_found'},origin);
  if(order.token_hash!==tokenHash)return json(403,{error:'order_access_denied'},origin);
  if(String(order.product_id||'')!==ORDER_PRODUCT_ID)return json(400,{error:'invalid_product'},origin);

  try{
    let current=order;
    if(['creating','pending'].includes(String(order.status||''))&&order.provider_payment_id){
      const payment=await tbankRequest('GetState',{PaymentId:String(order.provider_payment_id)});
      if(!tbankPaymentMatchesOrder(payment,order))throw new Error('payment_order_mismatch');
      const providerStatus=String(payment.Status||'');
      if(providerStatus==='CONFIRMED'){
        const entitlementId=await grant(admin,order,payment);
        current={...order,status:'paid',provider_status:'CONFIRMED',entitlement_id:entitlementId};
      }else if(providerStatus==='REFUNDED'){
        await revoke(admin,order);
        current={...order,status:'refunded',provider_status:'REFUNDED'};
      }else if(canceledStatuses.has(providerStatus)){
        const now=new Date().toISOString();
        await admin.from('payment_orders').update({status:'canceled',provider_status:providerStatus,canceled_at:now,updated_at:now}).eq('id',order.id).neq('status','paid');
        current={...order,status:order.status==='paid'?'paid':'canceled',provider_status:providerStatus};
      }else{
        await admin.from('payment_orders').update({provider_status:providerStatus||null,status:order.status==='creating'?'pending':order.status,updated_at:new Date().toISOString()}).eq('id',order.id).neq('status','paid');
        current={...order,status:order.status==='creating'?'pending':order.status,provider_status:providerStatus};
      }
    }

    const {data:entitlement,error:entitlementError}=await admin.from('access_entitlements')
      .select('id,status,starts_at,expires_at,revoked_at,metadata')
      .eq('token_hash',tokenHash)
      .eq('product_id',ENTITLEMENT_PRODUCT_ID)
      .maybeSingle();
    if(entitlementError)return json(503,{error:'access_check_failed'},origin);

    return json(200,{
      ok:true,
      orderId:order.id,
      productId:ORDER_PRODUCT_ID,
      entitlementProductId:ENTITLEMENT_PRODUCT_ID,
      status:String(current.status||order.status||''),
      entitled:usable(entitlement),
      expiresAt:entitlement?.expires_at||null,
      priceRub:Number(order.amount_value||0),
      dossierDiscountApplied:Boolean(order.metadata?.dossier_discount),
    },origin);
  }catch(error:any){
    return json(503,{error:String(error?.message||'payment_status_failed').slice(0,120)},origin);
  }
});
