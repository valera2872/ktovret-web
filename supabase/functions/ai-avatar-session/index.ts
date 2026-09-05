import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { loadAiAvatarProfile } from "../_shared/ai-avatar-profile.ts";

const ALLOWED_ORIGINS=new Set(["https://mysterylogic.com","https://valera2872.github.io"]);
const LIVEAVATAR_API_BASE="https://api.liveavatar.com";
const LIVEAVATAR_API_KEY=Deno.env.get("LIVEAVATAR_API_KEY")||"";
const LIVEAVATAR_SANDBOX_AVATAR_ID=Deno.env.get("AI_AVATAR_SANDBOX_AVATAR_ID")||"dd73ea75-1218-4ef3-92ce-606d5f7fbc0a";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const SIGNING_SECRET=Deno.env.get("AI_AVATAR_SIGNING_KEY")||SERVICE_ROLE_KEY;
const AVATAR_ENABLED=(Deno.env.get("AI_AVATAR_ENABLED")||"").toLowerCase()==="true";
const AVATAR_SANDBOX=(Deno.env.get("AI_AVATAR_SANDBOX")||"true").toLowerCase()!=="false";
const MAX_SESSION_SECONDS=Math.max(60,Math.min(300,Number(Deno.env.get("AI_AVATAR_MAX_SESSION_SECONDS")||"300")||300));
const encoder=new TextEncoder();

function clean(v:unknown,max=160){return typeof v==="string"?v.replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,max):""}
function corsHeaders(origin:string){return {
  "access-control-allow-origin":origin||"https://mysterylogic.com",
  "access-control-allow-headers":"authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods":"POST, OPTIONS",
  "vary":"Origin",
  "content-type":"application/json; charset=utf-8",
  "cache-control":"no-store"
}}
function json(origin:string,status:number,body:Record<string,unknown>){return new Response(JSON.stringify(body),{status,headers:corsHeaders(origin)})}
function base64url(bytes:Uint8Array){let binary="";for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}
function hex(bytes:ArrayBuffer){return Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,"0")).join("")}
async function sha256(value:string){return hex(await crypto.subtle.digest("SHA-256",encoder.encode(value)))}
function tierOf(metadata:any){return String(metadata?.experience_tier||"").toLowerCase()==="live"?"live":"text"}
function entitlementAllowsCase(metadata:any,caseId:string){
  const allowed=Array.isArray(metadata?.allowed_case_ids)?metadata.allowed_case_ids.map((v:unknown)=>String(v||"")):[];
  if(allowed.length)return allowed.includes(caseId);
  const scoped=String(metadata?.case_id||"");
  return !scoped||scoped===caseId;
}
function ownerPreviewAvatar(metadata:any,suspectId:string){
  if(suspectId!=="anton"&&suspectId!=="lev")return "";
  const overrides=metadata?.preview_avatar_overrides;
  return overrides&&typeof overrides==="object"?clean(overrides[suspectId],160):"";
}
async function requireLiveEntitlement(accessToken:string,caseId:string){
  if(accessToken.length<32||accessToken.length>512)return {ok:false,error:"live_access_required"};
  if(!SUPABASE_URL||!SERVICE_ROLE_KEY)return {ok:false,error:"avatar_access_not_configured"};
  const admin=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const tokenHash=await sha256(accessToken);
  const {data:entitlement,error}=await admin.from("access_entitlements")
    .select("id,product_id,status,starts_at,expires_at,revoked_at,metadata")
    .eq("token_hash",tokenHash).eq("status","active").maybeSingle();
  if(error)return {ok:false,error:"live_access_check_failed"};
  if(!entitlement)return {ok:false,error:"live_access_required"};
  const now=Date.now();
  if(entitlement.revoked_at)return {ok:false,error:"live_access_revoked"};
  if(entitlement.starts_at&&new Date(entitlement.starts_at).getTime()>now)return {ok:false,error:"live_access_not_started"};
  if(entitlement.expires_at&&new Date(entitlement.expires_at).getTime()<=now)return {ok:false,error:"live_access_expired"};
  if(tierOf(entitlement.metadata)!=="live")return {ok:false,error:"live_tier_required"};
  if(!entitlementAllowsCase(entitlement.metadata,caseId))return {ok:false,error:"live_wrong_case"};
  return {ok:true,entitlement};
}
async function speechToken(sessionId:string,suspectId:string,caseId:string,entitlementId:string,expiresAt:number,isOwnerPreview:boolean){
  const payload=base64url(encoder.encode(JSON.stringify({sid:sessionId,sus:suspectId,cid:caseId,eid:entitlementId,exp:expiresAt,op:isOwnerPreview})));
  const key=await crypto.subtle.importKey("raw",encoder.encode(SIGNING_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=new Uint8Array(await crypto.subtle.sign("HMAC",key,encoder.encode(payload)));
  return `${payload}.${base64url(signature)}`;
}
async function avatarReadiness(caseId:string,suspectId:string,isOwnerPreview:boolean,metadata:any){
  if(!isOwnerPreview)return {status:403,body:{error:"owner_preview_required"}};
  if(!SUPABASE_URL||!SERVICE_ROLE_KEY)return {status:503,body:{error:"avatar_access_not_configured"}};
  const admin=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await admin.from("ai_case_avatar_profiles")
    .select("suspect_id,status,provider,avatar_id,tts_voice")
    .eq("case_id",caseId)
    .eq("suspect_id",suspectId)
    .maybeSingle();
  if(error){
    console.error("avatar_readiness_profile_error",error.message);
    return {status:503,body:{error:"avatar_profile_unavailable"}};
  }
  const profileStatus=clean(data?.status,24)||"missing";
  const publishedIdentity=profileStatus==="published"&&clean(data?.provider,32)==="liveavatar"&&Boolean(clean(data?.avatar_id,256));
  const previewOverride=ownerPreviewAvatar(metadata,suspectId);
  const sandboxFallback=isOwnerPreview&&AVATAR_SANDBOX&&!publishedIdentity&&!previewOverride;
  const readyForSession=Boolean(LIVEAVATAR_API_KEY&&SIGNING_SECRET&&(publishedIdentity||previewOverride||sandboxFallback));
  return {status:200,body:{
    action:"readiness",
    case_id:caseId,
    suspect_id:suspectId,
    liveavatar_api_key_configured:Boolean(LIVEAVATAR_API_KEY),
    signing_configured:Boolean(SIGNING_SECRET),
    avatar_enabled:AVATAR_ENABLED,
    owner_preview:true,
    sandbox:AVATAR_SANDBOX,
    profile_status:profileStatus,
    published_identity:publishedIdentity,
    owner_preview_override:Boolean(previewOverride),
    sandbox_fallback:sandboxFallback,
    ready_for_session:readyForSession
  }};
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin")||"";
  if(req.method==="OPTIONS"){
    if(origin&&!ALLOWED_ORIGINS.has(origin))return json("https://mysterylogic.com",403,{error:"origin_not_allowed"});
    const headers:Record<string,string>=corsHeaders(origin);
    const requestedHeaders=clean(req.headers.get("access-control-request-headers")||"",512);
    if(requestedHeaders)headers["access-control-allow-headers"]=requestedHeaders;
    headers["access-control-max-age"]="600";
    if((req.headers.get("access-control-request-private-network")||"").toLowerCase()==="true")headers["access-control-allow-private-network"]="true";
    console.log("avatar_preflight",JSON.stringify({origin,requested_headers:requestedHeaders,requested_method:clean(req.headers.get("access-control-request-method")||"",32)}));
    return new Response(null,{status:204,headers});
  }
  if(req.method!=="POST")return json(origin,405,{error:"method_not_allowed"});
  if(!origin||!ALLOWED_ORIGINS.has(origin))return json("https://mysterylogic.com",403,{error:"origin_not_allowed"});

  let body:any={};
  try{body=await req.json()}catch{return json(origin,400,{error:"invalid_json"})}
  const action=clean(body?.action,24).toLowerCase();
  const provider=clean(body?.provider,24).toLowerCase();
  const suspectId=clean(body?.suspect_id,80).toLowerCase();
  const caseId=clean(body?.case_id,160);
  const accessToken=clean(body?.access_token,512);
  const requestedAvatarId=clean(body?.avatar_id,160);
  const requestedMode=clean(body?.mode,16).toLowerCase();
  if(action&&action!=="session"&&action!=="readiness")return json(origin,400,{error:"unknown_action"});
  if(provider!=="heygen"&&provider!=="liveavatar")return json(origin,400,{error:"provider_not_allowed"});
  if(requestedMode&&requestedMode!=="lite")return json(origin,400,{error:"mode_not_allowed"});
  if(!/^[a-zA-Z0-9_:-]{3,160}$/.test(caseId)||!/^[a-zA-Z0-9_:-]{1,80}$/.test(suspectId))return json(origin,400,{error:"invalid_case_identity"});
  const liveAccess=await requireLiveEntitlement(accessToken,caseId);
  if(!liveAccess.ok)return json(origin,403,{error:liveAccess.error||"live_access_required"});
  const metadata=liveAccess.entitlement?.metadata||{};
  const isOwnerPreview=caseId==="AI-01"&&clean(metadata?.source,64)==="owner_preview";
  if(action==="readiness"){
    const readiness=await avatarReadiness(caseId,suspectId,isOwnerPreview,metadata);
    return json(origin,readiness.status,readiness.body);
  }
  if(!AVATAR_ENABLED&&!isOwnerPreview)return json(origin,503,{error:"avatar_disabled"});
  if(!LIVEAVATAR_API_KEY||!SIGNING_SECRET)return json(origin,503,{error:"avatar_not_configured"});
  const entitlementId=clean(liveAccess.entitlement?.id,64);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entitlementId))return json(origin,503,{error:"live_entitlement_invalid"});

  let profile;
  try{profile=await loadAiAvatarProfile({supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,caseId,suspectId})}
  catch(error){console.error("avatar_profile_error",String(error));return json(origin,503,{error:"avatar_profile_unavailable"})}
  const previewOverride=isOwnerPreview?ownerPreviewAvatar(metadata,suspectId):"";
  const publishedAvatarId=clean(profile?.avatarId,256);
  const sandboxFallbackAllowed=isOwnerPreview&&AVATAR_SANDBOX;
  const allowedAvatarId=previewOverride||publishedAvatarId||(sandboxFallbackAllowed?LIVEAVATAR_SANDBOX_AVATAR_ID:"");
  if(!allowedAvatarId)return json(origin,404,{error:"suspect_avatar_unavailable"});
  if(requestedAvatarId&&requestedAvatarId!==allowedAvatarId)return json(origin,403,{error:"avatar_not_allowed"});
  // Public preset avatars are production identities and must start as non-sandbox sessions.
  // Only the dedicated owner-preview fallback avatar may use zero-credit sandbox mode.
  const isSandboxSession=Boolean(!previewOverride&&!publishedAvatarId&&sandboxFallbackAllowed&&allowedAvatarId===LIVEAVATAR_SANDBOX_AVATAR_ID);
  // Owner preview is always capped to one minute, even when a public preset needs a billable non-sandbox session.
  const sessionSeconds=isOwnerPreview?Math.min(MAX_SESSION_SECONDS,60):MAX_SESSION_SECONDS;
  const avatarSource=previewOverride?"owner_preview_preset":publishedAvatarId?"published":"sandbox";

  const upstream=await fetch(`${LIVEAVATAR_API_BASE}/v1/sessions/token`,{
    method:"POST",
    headers:{"X-API-KEY":LIVEAVATAR_API_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({
      avatar_id:allowedAvatarId,
      mode:"LITE",
      is_sandbox:isSandboxSession,
      video_settings:{quality:"medium",encoding:"H264"},
      max_session_duration:sessionSeconds
    })
  });
  let data:any={};
  try{data=await upstream.json()}catch{}
  if(!upstream.ok){
    const providerMessage=clean(data?.message||data?.detail||data?.error?.message||data?.error||"",300);
    console.error("liveavatar_token_error",upstream.status,providerMessage,JSON.stringify({suspectId,avatarSource,isSandboxSession}));
    if(isOwnerPreview)return json(origin,502,{error:"avatar_upstream_error",provider_status:upstream.status,provider_message:providerMessage,avatar_source:avatarSource,sandbox:isSandboxSession});
    return json(origin,502,{error:"avatar_upstream_error"});
  }
  const sessionId=clean(data?.data?.session_id,128);
  const sessionToken=clean(data?.data?.session_token,4096);
  if(!sessionId||!sessionToken)return json(origin,502,{error:"avatar_upstream_invalid"});
  const speechExpiresAt=Math.floor(Date.now()/1000)+sessionSeconds+60;
  const signedSpeechToken=await speechToken(sessionId,suspectId,caseId,entitlementId,speechExpiresAt,isOwnerPreview);
  console.log("liveavatar_session_created",JSON.stringify({suspect_id:suspectId,avatar_source:avatarSource,sandbox:isSandboxSession,max_session_duration:sessionSeconds}));
  return json(origin,200,{
    provider:"liveavatar",
    mode:"LITE",
    session_id:sessionId,
    session_token:sessionToken,
    speech_token:signedSpeechToken,
    suspect_id:suspectId,
    case_id:caseId,
    experience_tier:"live",
    sandbox:isSandboxSession,
    avatar_source:avatarSource,
    max_session_duration:sessionSeconds,
    speech_expires_at:speechExpiresAt
  });
});
