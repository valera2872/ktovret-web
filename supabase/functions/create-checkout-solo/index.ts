import { SUPABASE_URL, adminClient, cleanOrigin, formatAmount, isAllowedOrigin, json, sha256, validAccessToken, validEmail, validUuid, corsHeaders } from 'https://raw.githubusercontent.com/valera2872/ktovret-web/85d120356354e836577a3e2fda9d53a820fce3ef/supabase/functions/_shared/payment.ts';
import { amountToKopecks, tbankConfigReady, tbankRequest } from 'https://raw.githubusercontent.com/valera2872/ktovret-web/85d120356354e836577a3e2fda9d53a820fce3ef/supabase/functions/_shared/tbank.ts';

const SOLO_ID='solo_investigations_v1';
const TN_ID='tikhaya_noch_v1';
const TN_CASE='premium_tikhaya_noch_v1';
const P001_ID='p001-premium-solo';
const P001_CASE='P-001';
const BROWSER_KEY_RE=/^[a-f0-9]{48}$/;
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
  const productId=String(body.productId||'').trim();
  if(productId!==SOLO_ID&&productId!==TN_ID&&productId!==P001_ID)return json(400,{error:'invalid_product'},origin);
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

  const admin=adminClient(),tokenHash=await sha256(accessToken),customerEmailHash=await sha256(email);
  let priceRub=99,description='Mystery Logic — Расследования для одного, Том I: 10 дел',receiptName='Mystery Logic — Расследования, Том I (10 дел)',offerVersion='2026-09-11-solo-v1',caseId:any=null,source='solo_investigations_checkout',dossierDiscount=false,dossierXp=0,visitorHash:any=null;
  if(productId===P001_ID){
    if(Deno.env.get('P001_CHECKOUT_ENABLED')!=='true')return json(403,{error:'product_not_available'},origin);
    const {data:def,error:defError}=await admin.from('solo_case_definitions').select('status,classification,production_eligible').eq('case_id',P001_CASE).maybeSingle();
    const {data:paid,error:paidError}=await admin.from('paid_case_payloads').select('case_id').eq('case_id',P001_CASE).eq('product_id',P001_ID).eq('status','published').limit(1).maybeSingle();
    if(defError||paidError)return json(503,{error:'product_lookup_failed'},origin);
    if(!def||def.status!=='published'||def.classification!=='PRIVATE_CANON_PRODUCTION'||def.production_eligible!==true||!paid)return json(403,{error:'product_not_available'},origin);
    priceRub=299;
    description='Mystery Logic — Пассажирка №317: Premium Solo расследование';
    receiptName='Mystery Logic — Пассажирка №317';
    offerVersion='2026-11-27-p001-v1';
    caseId=P001_CASE;
    source='p001_checkout';
  }
  if(productId===TN_ID){
    const browserKey=String(body.browserKey||'').trim().toLowerCase();
    if(!BROWSER_KEY_RE.test(browserKey))return json(400,{error:'invalid_browser_key'},origin);
    visitorHash=await sha256(browserKey);
    const {data:profile,error:profileError}=await admin.from('player_profiles').select('xp').eq('visitor_key_hash',visitorHash).maybeSingle();
    if(profileError)return json(503,{error:'dossier_lookup_failed'},origin);
    dossierXp=Math.max(0,Number(profile?.xp)||0);
    dossierDiscount=dossierXp>=240;
    priceRub=dossierDiscount?199:249;
    description='Mystery Logic — Тихая ночь: Premium Solo расследование';
    receiptName='Mystery Logic — Тихая ночь';
    offerVersion='2026-10-09-tikhaya-noch-v1';
    caseId=TN_CASE;
    source='tikhaya_noch_checkout';
  }

  const {data:existing,error:existingError}=await admin.from('payment_orders').select('id,token_hash,product_id,status,payment_provider,provider_payment_id,confirmation_url,amount_value,metadata').eq('client_request_id',requestId).maybeSingle();
  if(existingError)return json(503,{error:'order_lookup_failed'},origin);
  if(existing){
    if(existing.token_hash!==tokenHash)return json(409,{error:'request_id_conflict'},origin);
    if(existing.product_id!==productId)return json(409,{error:'request_product_conflict'},origin);
    if(existing.confirmation_url)return json(200,{ok:true,reused:true,productId,orderId:existing.id,status:existing.status,paymentId:existing.provider_payment_id,confirmationUrl:existing.confirmation_url,amountRub:Number(existing.amount_value),dossierDiscount:Boolean(existing.metadata?.dossier_discount)},origin);
  }

  const amountValue=formatAmount(priceRub),amount=amountToKopecks(priceRub);
  const orderId=existing?.id||crypto.randomUUID(),acceptedAt=new Date().toISOString();
  const successUrl=new URL(returnUrl.href);successUrl.searchParams.set('payment_return','1');successUrl.searchParams.set('payment_result','success');successUrl.searchParams.set('order_id',orderId);successUrl.searchParams.set('product',productId);
  const failUrl=new URL(returnUrl.href);failUrl.searchParams.set('payment_return','1');failUrl.searchParams.set('payment_result','fail');failUrl.searchParams.set('order_id',orderId);failUrl.searchParams.set('product',productId);
  const notificationUrl=SUPABASE_URL+'/functions/v1/tbank-webhook-solo';
  const metadata=productId===P001_ID?{source,product_id:productId,case_id:P001_CASE,payment_provider:'tbank',list_price_rub:299,paid_price_rub:priceRub,dossier_discount:false,offer_version:offerVersion,offer_accepted_at:acceptedAt,privacy_version:PRIVACY_VERSION,privacy_acknowledged_at:acceptedAt}:productId===TN_ID?{source,product_id:productId,case_id:TN_CASE,payment_provider:'tbank',list_price_rub:249,paid_price_rub:priceRub,dossier_discount:dossierDiscount,dossier_xp:dossierXp,dossier_discount_threshold:240,visitor_key_hash:visitorHash,offer_version:offerVersion,offer_accepted_at:acceptedAt,privacy_version:PRIVACY_VERSION,privacy_acknowledged_at:acceptedAt}:{source,product_id:productId,payment_provider:'tbank',offer_version:offerVersion,offer_accepted_at:acceptedAt,privacy_version:PRIVACY_VERSION,privacy_acknowledged_at:acceptedAt};
  if(!existing){
    const {error:insertError}=await admin.from('payment_orders').insert({id:orderId,product_id:productId,token_hash:tokenHash,client_request_id:requestId,amount_value:amountValue,currency:'RUB',status:'creating',payment_provider:'tbank',return_url:successUrl.href,source_origin:origin||returnUrl.origin,case_id:caseId,customer_email_hash:customerEmailHash,offer_version:offerVersion,offer_accepted_at:acceptedAt,privacy_version:PRIVACY_VERSION,privacy_acknowledged_at:acceptedAt,metadata});
    if(insertError)return json(503,{error:'order_create_failed'},origin);
  }
  try{
    const payment=await tbankRequest('Init',{Amount:amount,OrderId:orderId,Description:description,Language:language,NotificationURL:notificationUrl,SuccessURL:successUrl.href,FailURL:failUrl.href,Receipt:{Email:email,Taxation:'usn_income',Items:[{Name:receiptName,Price:amount,Quantity:1,Amount:amount,PaymentMethod:'full_payment',PaymentObject:'intellectual_activity',Tax:'none'}]}});
    const paymentId=String(payment?.PaymentId||''),confirmationUrl=String(payment?.PaymentURL||'');
    if(!paymentId||!confirmationUrl)throw new Error('invalid_payment_response');
    const {error:updateError}=await admin.from('payment_orders').update({payment_provider:'tbank',provider_payment_id:paymentId,provider_status:String(payment?.Status||'NEW'),confirmation_url:confirmationUrl,status:'pending',failure_code:null,updated_at:new Date().toISOString()}).eq('id',orderId);
    if(updateError)throw updateError;
    return json(200,{ok:true,productId,orderId,paymentId,status:'pending',confirmationUrl,amountRub:priceRub,dossierDiscount,dossierXp},origin);
  }catch(error:any){
    await admin.from('payment_orders').update({status:'failed',failure_code:String(error?.code||error?.message||'payment_create_failed').slice(0,120),updated_at:new Date().toISOString()}).eq('id',orderId);
    return json(502,{error:'payment_create_failed'},origin);
  }
});