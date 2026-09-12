import {
  SUPABASE_URL,adminClient,cleanOrigin,formatAmount,isAllowedOrigin,json,sha256,validAccessToken,validEmail,validUuid,corsHeaders,
} from '../_shared/payment.ts';
import {amountToKopecks,tbankConfigReady,tbankRequest} from '../_shared/tbank.ts';
import {
  SOLO_INVESTIGATIONS_PRODUCT_ID,SOLO_INVESTIGATIONS_PRICE_RUB,SOLO_INVESTIGATIONS_RECEIPT_NAME,SOLO_INVESTIGATIONS_DESCRIPTION,
} from '../_shared/solo-investigations.ts';

const OFFER_VERSION='2026-09-11-solo-v1';
const PRIVACY_VERSION='2026-08-16';

Deno.serve(async(req:Request)=>{
  const origin=cleanOrigin(req.headers.get('origin')||'');
  if(req.method==='OPTIONS'){
    if(!isAllowedOrigin(origin))return new Response(null,{status:403});
    return new Response(null,{status:204,headers:corsHeaders(origin)});
  }
  if(req.method!=='POST')return json(405,{error:'method_not_allowed'},origin);
  if(!isAllowedOrigin(origin))return json(403,{error:'origin_not_allowed'});
  if(!tbankConfigReady())return json(503,{error:'payment_service_not_configured'},origin);
  let body:any={};try{body=await req.json();}catch{return json(400,{error:'invalid_json'},origin);}
  if(String(body.productId||'').trim()!==SOLO_INVESTIGATIONS_PRODUCT_ID)return json(400,{error:'invalid_product'},origin);
  const accessToken=String(body.accessToken||'').trim();
  const requestId=String(body.requestId||'').trim();
  const email=String(body.email||'').trim().toLowerCase();
  const language=String(body.language||'').toLowerCase()==='en'?'en':'ru';
  if(!validAccessToken(accessToken))return json(400,{error:'invalid_access_token'},origin);
  if(!validUuid(requestId))return json(400,{error:'invalid_request_id'},origin);
  if(!email)return json(400,{error:'email_required_for_receipt'},origin);
  if(!validEmail(email))return json(400,{error:'invalid_email'},origin);
  if(body.offerAccepted!==true)return json(400,{error:'offer_acceptance_required'},origin);
  if(body.privacyAcknowledged!==true)return json(400,{error:'privacy_acknowledgement_required'},origin);
  let returnUrl:URL;try{returnUrl=new URL(String(body.returnUrl||''));}catch{return json(400,{error:'invalid_return_url'},origin);}
  if(returnUrl.protocol!=='https:'||!isAllowedOrigin(returnUrl.origin))return json(400,{error:'invalid_return_url'},origin);
  returnUrl.hash='';returnUrl.search='';
  const amountValue=formatAmount(SOLO_INVESTIGATIONS_PRICE_RUB),amount=amountToKopecks(SOLO_INVESTIGATIONS_PRICE_RUB);
  const tokenHash=await sha256(accessToken),customerEmailHash=await sha256(email),admin=adminClient();
  const {data:existing,error:existingError}=await admin.from('payment_orders')
    .select('id,token_hash,product_id,status,payment_provider,provider_payment_id,confirmation_url')
    .eq('client_request_id',requestId).maybeSingle();
  if(existingError)return json(503,{error:'order_lookup_failed'},origin);
  if(existing){
    if(existing.token_hash!==tokenHash)return json(409,{error:'request_id_conflict'},origin);
    if(existing.product_id!==SOLO_INVESTIGATIONS_PRODUCT_ID)return json(409,{error:'request_product_conflict'},origin);
    if(existing.confirmation_url)return json(200,{ok:true,reused:true,productId:SOLO_INVESTIGATIONS_PRODUCT_ID,orderId:existing.id,status:existing.status,paymentId:existing.provider_payment_id,confirmationUrl:existing.confirmation_url},origin);
  }
  const orderId=existing?.id||crypto.randomUUID(),acceptedAt=new Date().toISOString();
  const successUrl=new URL(returnUrl.href);successUrl.searchParams.set('payment_return','1');successUrl.searchParams.set('payment_result','success');successUrl.searchParams.set('order_id',orderId);successUrl.searchParams.set('product',SOLO_INVESTIGATIONS_PRODUCT_ID);
  const failUrl=new URL(returnUrl.href);failUrl.searchParams.set('payment_return','1');failUrl.searchParams.set('payment_result','fail');failUrl.searchParams.set('order_id',orderId);failUrl.searchParams.set('product',SOLO_INVESTIGATIONS_PRODUCT_ID);
  const notificationUrl=`${SUPABASE_URL}/functions/v1/tbank-webhook-solo`;
  if(!existing){
    const {error:insertError}=await admin.from('payment_orders').insert({
      id:orderId,product_id:SOLO_INVESTIGATIONS_PRODUCT_ID,token_hash:tokenHash,client_request_id:requestId,amount_value:amountValue,currency:'RUB',status:'creating',payment_provider:'tbank',return_url:successUrl.href,source_origin:origin||returnUrl.origin,case_id:null,customer_email_hash:customerEmailHash,offer_version:OFFER_VERSION,offer_accepted_at:acceptedAt,privacy_version:PRIVACY_VERSION,privacy_acknowledged_at:acceptedAt,
      metadata:{source:'solo_investigations_checkout',product_id:SOLO_INVESTIGATIONS_PRODUCT_ID,payment_provider:'tbank',offer_version:OFFER_VERSION,offer_accepted_at:acceptedAt,privacy_version:PRIVACY_VERSION,privacy_acknowledged_at:acceptedAt},
    });
    if(insertError)return json(503,{error:'order_create_failed'},origin);
  }
  try{
    const payment=await tbankRequest('Init',{
      Amount:amount,OrderId:orderId,Description:SOLO_INVESTIGATIONS_DESCRIPTION,Language:language,NotificationURL:notificationUrl,SuccessURL:successUrl.href,FailURL:failUrl.href,
      Receipt:{Email:email,Taxation:'usn_income',Items:[{Name:SOLO_INVESTIGATIONS_RECEIPT_NAME,Price:amount,Quantity:1,Amount:amount,PaymentMethod:'full_payment',PaymentObject:'intellectual_activity',Tax:'none'}]},
    });
    const paymentId=String(payment?.PaymentId||''),confirmationUrl=String(payment?.PaymentURL||'');
    if(!paymentId||!confirmationUrl)throw new Error('invalid_payment_response');
    const {error:updateError}=await admin.from('payment_orders').update({payment_provider:'tbank',provider_payment_id:paymentId,provider_status:String(payment?.Status||'NEW'),confirmation_url:confirmationUrl,status:'pending',failure_code:null,updated_at:new Date().toISOString()}).eq('id',orderId);
    if(updateError)throw updateError;
    return json(200,{ok:true,productId:SOLO_INVESTIGATIONS_PRODUCT_ID,orderId,paymentId,status:'pending',confirmationUrl},origin);
  }catch(error:any){
    await admin.from('payment_orders').update({status:'failed',failure_code:String(error?.code||error?.message||'payment_create_failed').slice(0,120),updated_at:new Date().toISOString()}).eq('id',orderId);
    return json(502,{error:'payment_create_failed'},origin);
  }
});
