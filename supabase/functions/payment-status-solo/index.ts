import {adminClient,cleanOrigin,corsHeaders,isAllowedOrigin,json,sha256,validAccessToken,validUuid} from '../_shared/payment.ts';
import {tbankConfigReady} from '../_shared/tbank.ts';
import {SOLO_INVESTIGATIONS_PRODUCT_ID,refreshSoloOrder} from '../_shared/solo-investigations.ts';

Deno.serve(async(req:Request)=>{
  const origin=cleanOrigin(req.headers.get('origin')||'');
  if(req.method==='OPTIONS'){
    if(!isAllowedOrigin(origin))return new Response(null,{status:403});
    return new Response(null,{status:204,headers:corsHeaders(origin)});
  }
  if(req.method!=='POST')return json(405,{error:'method_not_allowed'},origin);
  if(!isAllowedOrigin(origin))return json(403,{error:'origin_not_allowed'});
  if(!tbankConfigReady())return json(503,{error:'payment_service_not_configured'},origin);
  const auth=req.headers.get('authorization')||'',token=auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()||'';
  if(!validAccessToken(token))return json(401,{error:'access_token_required'},origin);
  let body:any={};try{body=await req.json();}catch{return json(400,{error:'invalid_json'},origin);}
  const orderId=String(body.orderId||'').trim();if(!validUuid(orderId))return json(400,{error:'invalid_order_id'},origin);
  const tokenHash=await sha256(token),admin=adminClient();
  const {data:order,error}=await admin.from('payment_orders').select('*').eq('id',orderId).maybeSingle();
  if(error)return json(503,{error:'order_lookup_failed'},origin);
  if(!order)return json(404,{error:'order_not_found'},origin);
  if(order.token_hash!==tokenHash)return json(403,{error:'order_access_denied'},origin);
  if(String(order.product_id||'')!==SOLO_INVESTIGATIONS_PRODUCT_ID)return json(400,{error:'invalid_product'},origin);
  try{
    let refreshed=order;
    if(['creating','pending'].includes(order.status))refreshed=await refreshSoloOrder(admin,order);
    const {data:entitlement,error:entitlementError}=await admin.from('access_entitlements')
      .select('product_id,status,starts_at,expires_at,revoked_at').eq('token_hash',tokenHash).eq('product_id',SOLO_INVESTIGATIONS_PRODUCT_ID).maybeSingle();
    if(entitlementError)return json(503,{error:'access_check_failed'},origin);
    const now=new Date();
    const entitled=Boolean(entitlement&&entitlement.status==='active'&&!entitlement.revoked_at&&(!entitlement.starts_at||new Date(entitlement.starts_at)<=now)&&(!entitlement.expires_at||new Date(entitlement.expires_at)>now));
    return json(200,{ok:true,orderId:order.id,productId:SOLO_INVESTIGATIONS_PRODUCT_ID,entitlementProductIds:[SOLO_INVESTIGATIONS_PRODUCT_ID],paymentId:order.provider_payment_id,provider:'tbank',status:refreshed.status,entitled},origin);
  }catch(error:any){return json(503,{error:String(error?.message||'payment_status_failed').slice(0,120)},origin);}
});
