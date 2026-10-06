import {
  SUPABASE_URL,
  adminClient,
  cleanOrigin,
  corsHeaders,
  formatAmount,
  isAllowedOrigin,
  json,
  sha256,
  validAccessToken,
  validEmail,
  validUuid,
} from 'https://raw.githubusercontent.com/valera2872/ktovret-web/3216728a009086db452885a62df180cd044faac6/supabase/functions/_shared/payment.ts';
import {
  amountToKopecks,
  tbankConfigReady,
  tbankRequest,
} from 'https://raw.githubusercontent.com/valera2872/ktovret-web/3216728a009086db452885a62df180cd044faac6/supabase/functions/_shared/tbank.ts';

const ORDER_PRODUCT_ID='ai02_zero_copy';
const ENTITLEMENT_PRODUCT_ID='ai02-zero-copy';
const CASE_IDS=['AI02-NK-EASY','AI02-NK-STANDARD','AI02-NK-HARD'] as const;
const DEFAULT_CASE_ID='AI02-NK-STANDARD';
const STANDARD_PRICE_RUB=299;
const DOSSIER_PRICE_RUB=249;
const DOSSIER_MIN_XP=240;
const OFFER_VERSION='2026-10-06-ai02-v1';
const PRIVACY_VERSION='2026-08-16';
const BROWSER_KEY_RE=/^[a-f0-9]{48}$/;

const allowedCase=(value:unknown)=>{
  const id=String(value||DEFAULT_CASE_ID).trim();
  return (CASE_IDS as readonly string[]).includes(id)?id:null;
};

Deno.serve(async(req:Request)=>{
  const origin=cleanOrigin(req.headers.get('origin')||'');
  if(req.method==='OPTIONS'){
    if(!isAllowedOrigin(origin))return new Response(null,{status:403});
    return new Response(null,{status:204,headers:corsHeaders(origin)});
  }
  if(req.method!=='POST')return json(405,{error:'method_not_allowed'},origin);
  if(!isAllowedOrigin(origin))return json(403,{error:'origin_not_allowed'},origin);
  if(!tbankConfigReady())return json(503,{error:'payment_service_not_configured'},origin);

  let body:any={};
  try{body=await req.json()}catch{return json(400,{error:'invalid_json'},origin)}

  const accessToken=String(body.accessToken||'').trim();
  const requestId=String(body.requestId||'').trim();
  const caseId=allowedCase(body.caseId);
  const email=String(body.email||'').trim().toLowerCase();
  const language=String(body.language||'').toLowerCase()==='en'?'en':'ru';
  const offerAccepted=body.offerAccepted===true;
  const privacyAcknowledged=body.privacyAcknowledged===true;
  const discountRequested=body.dossierDiscountRequested===true;
  const browserKey=String(body.browserKey||'').trim();

  if(!validAccessToken(accessToken))return json(400,{error:'invalid_access_token'},origin);
  if(!validUuid(requestId))return json(400,{error:'invalid_request_id'},origin);
  if(!caseId)return json(400,{error:'invalid_case_id'},origin);
  if(!email)return json(400,{error:'email_required_for_receipt'},origin);
  if(!validEmail(email))return json(400,{error:'invalid_email'},origin);
  if(!offerAccepted)return json(400,{error:'offer_acceptance_required'},origin);
  if(!privacyAcknowledged)return json(400,{error:'privacy_acknowledgement_required'},origin);

  let returnUrl:URL;
  try{returnUrl=new URL(String(body.returnUrl||''))}catch{return json(400,{error:'invalid_return_url'},origin)}
  if(returnUrl.protocol!=='https:'||!isAllowedOrigin(returnUrl.origin))return json(400,{error:'invalid_return_url'},origin);
  returnUrl.hash='';returnUrl.search='';

  const admin=adminClient();
  let dossierXp=0;
  let dossierRank='';
  if(discountRequested){
    if(!BROWSER_KEY_RE.test(browserKey))return json(403,{error:'dossier_discount_not_eligible'},origin);
    const visitorHash=await sha256(browserKey);
    const {data:profile,error:profileError}=await admin
      .from('player_profiles')
      .select('xp')
      .eq('visitor_key_hash',visitorHash)
      .maybeSingle();
    if(profileError)return json(503,{error:'dossier_lookup_failed'},origin);
    dossierXp=Math.max(0,Number(profile?.xp)||0);
    if(dossierXp<DOSSIER_MIN_XP)return json(403,{error:'dossier_discount_not_eligible',requiredXp:DOSSIER_MIN_XP,currentXp:dossierXp},origin);
    dossierRank=dossierXp>=600?'Эксперт Mystery Logic':dossierXp>=480?'Старший следователь':'Следователь';
  }

  const priceRub=discountRequested?DOSSIER_PRICE_RUB:STANDARD_PRICE_RUB;
  const amountValue=formatAmount(priceRub);
  const amount=amountToKopecks(priceRub);
  if(!amountValue||amount<=0)return json(503,{error:'payment_service_not_configured'},origin);

  const tokenHash=await sha256(accessToken);
  const customerEmailHash=await sha256(email);

  const {data:existingEntitlement,error:entitlementLookupError}=await admin
    .from('access_entitlements')
    .select('id,status,expires_at,revoked_at')
    .eq('token_hash',tokenHash)
    .eq('product_id',ENTITLEMENT_PRODUCT_ID)
    .maybeSingle();
  if(entitlementLookupError)return json(503,{error:'access_check_failed'},origin);
  if(existingEntitlement&&existingEntitlement.status==='active'&&!existingEntitlement.revoked_at&&(!existingEntitlement.expires_at||new Date(existingEntitlement.expires_at)>new Date())){
    return json(200,{ok:true,alreadyEntitled:true,productId:ORDER_PRODUCT_ID,entitlementProductId:ENTITLEMENT_PRODUCT_ID,priceRub:0},origin);
  }

  const {data:existing,error:existingError}=await admin
    .from('payment_orders')
    .select('id,token_hash,product_id,status,payment_provider,provider_payment_id,confirmation_url,amount_value,metadata')
    .eq('client_request_id',requestId)
    .maybeSingle();
  if(existingError)return json(503,{error:'order_lookup_failed'},origin);
  if(existing){
    if(existing.token_hash!==tokenHash)return json(409,{error:'request_id_conflict'},origin);
    if(existing.product_id!==ORDER_PRODUCT_ID)return json(409,{error:'request_product_conflict'},origin);
    if(formatAmount(existing.amount_value)!==amountValue)return json(409,{error:'request_price_conflict'},origin);
    if(existing.payment_provider&&existing.payment_provider!=='tbank')return json(409,{error:'request_provider_conflict'},origin);
    if(existing.confirmation_url){
      return json(200,{ok:true,reused:true,productId:ORDER_PRODUCT_ID,orderId:existing.id,status:existing.status,paymentId:existing.provider_payment_id,confirmationUrl:existing.confirmation_url,priceRub},origin);
    }
  }

  const orderId=existing?.id||crypto.randomUUID();
  const acceptedAt=new Date().toISOString();
  const successUrl=new URL(returnUrl.href);
  successUrl.searchParams.set('payment_return','1');
  successUrl.searchParams.set('payment_result','success');
  successUrl.searchParams.set('order_id',orderId);
  successUrl.searchParams.set('product',ORDER_PRODUCT_ID);
  const failUrl=new URL(returnUrl.href);
  failUrl.searchParams.set('payment_return','1');
  failUrl.searchParams.set('payment_result','fail');
  failUrl.searchParams.set('order_id',orderId);
  failUrl.searchParams.set('product',ORDER_PRODUCT_ID);
  const notificationUrl=`${SUPABASE_URL}/functions/v1/tbank-webhook-ai02`;

  if(!existing){
    const {error:insertError}=await admin.from('payment_orders').insert({
      id:orderId,
      product_id:ORDER_PRODUCT_ID,
      token_hash:tokenHash,
      client_request_id:requestId,
      amount_value:amountValue,
      currency:'RUB',
      status:'creating',
      payment_provider:'tbank',
      return_url:successUrl.href,
      source_origin:origin||returnUrl.origin,
      case_id:caseId,
      customer_email_hash:customerEmailHash,
      offer_version:OFFER_VERSION,
      offer_accepted_at:acceptedAt,
      privacy_version:PRIVACY_VERSION,
      privacy_acknowledged_at:acceptedAt,
      metadata:{
        source:'web_checkout_ai02',
        product_id:ORDER_PRODUCT_ID,
        entitlement_product_id:ENTITLEMENT_PRODUCT_ID,
        allowed_case_ids:[...CASE_IDS],
        price_tier:discountRequested?'dossier':'standard',
        price_rub:priceRub,
        dossier_discount:discountRequested,
        dossier_xp:discountRequested?dossierXp:null,
        dossier_rank:discountRequested?dossierRank:null,
        payment_provider:'tbank',
        offer_version:OFFER_VERSION,
        offer_accepted_at:acceptedAt,
        privacy_version:PRIVACY_VERSION,
        privacy_acknowledged_at:acceptedAt,
      },
    });
    if(insertError)return json(503,{error:'order_create_failed'},origin);
  }

  try{
    const payment=await tbankRequest('Init',{
      Amount:amount,
      OrderId:orderId,
      Description:'Mystery Logic — «Нулевая копия»: AI-расследование',
      Language:language,
      NotificationURL:notificationUrl,
      SuccessURL:successUrl.href,
      FailURL:failUrl.href,
      Receipt:{
        Email:email,
        Taxation:'usn_income',
        Items:[{
          Name:'Mystery Logic — «Нулевая копия», AI-расследование',
          Price:amount,
          Quantity:1,
          Amount:amount,
          PaymentMethod:'full_payment',
          PaymentObject:'intellectual_activity',
          Tax:'none',
        }],
      },
    });
    const paymentId=String(payment?.PaymentId||'');
    const confirmationUrl=String(payment?.PaymentURL||'');
    if(!paymentId||!confirmationUrl)throw new Error('invalid_payment_response');

    const {error:updateError}=await admin.from('payment_orders').update({
      payment_provider:'tbank',
      provider_payment_id:paymentId,
      provider_status:String(payment?.Status||'NEW'),
      confirmation_url:confirmationUrl,
      status:'pending',
      failure_code:null,
      updated_at:new Date().toISOString(),
    }).eq('id',orderId);
    if(updateError)throw updateError;

    return json(200,{ok:true,productId:ORDER_PRODUCT_ID,entitlementProductId:ENTITLEMENT_PRODUCT_ID,orderId,paymentId,status:'pending',confirmationUrl,priceRub,dossierDiscountApplied:discountRequested},origin);
  }catch(error:any){
    await admin.from('payment_orders').update({
      status:'failed',
      failure_code:String(error?.code||error?.message||'payment_create_failed').slice(0,120),
      updated_at:new Date().toISOString(),
    }).eq('id',orderId);
    return json(502,{error:'payment_create_failed'},origin);
  }
});
