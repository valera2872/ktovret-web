import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS=new Set(["https://mysterylogic.com","https://valera2872.github.io"]);
const LIVEAVATAR_API_BASE="https://api.liveavatar.com";
const LIVEAVATAR_API_KEY=Deno.env.get("LIVEAVATAR_API_KEY")||"";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const SIGNING_SECRET=Deno.env.get("AI_AVATAR_SIGNING_KEY")||SERVICE_ROLE_KEY;
const AVATAR_ENABLED=(Deno.env.get("AI_AVATAR_ENABLED")||"").toLowerCase()==="true";
const AVATAR_SANDBOX=(Deno.env.get("AI_AVATAR_SANDBOX")||"true").toLowerCase()!=="false";
const MARINA_AVATAR_ID=Deno.env.get("AI_AVATAR_MARINA_ID")||"";
const ANTON_AVATAR_ID=Deno.env.get("AI_AVATAR_ANTON_ID")||"";
const LEV_AVATAR_ID=Deno.env.get("AI_AVATAR_LEV_ID")||"";
const MAX_SESSION_SECONDS=Math.max(60,Math.min(300,Number(Deno.env.get("AI_AVATAR_MAX_SESSION_SECONDS")||"300")||300));

const SUSPECT_AVATARS:Record<string,string>={marina:MARINA_AVATAR_ID,anton:ANTON_AVATAR_ID,lev:LEV_AVATAR_ID};
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
async function speechToken(sessionId:string,suspectId:string,caseId:string,expiresAt:number){
  const payload=base64url(encoder.encode(JSON.stringify({sid:sessionId,sus:suspectId,cid:caseId,exp:expiresAt})));
  const key=await crypto.subtle.importKey("raw",encoder.encode(SIGNING_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=new Uint8Array(await crypto.subtle.sign("HMAC",key,encoder.encode(payload)));
  return `${payload}.${base64url(signature)}`;
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin")||"";
  if(req.method==="OPTIONS"){
    if(origin&&!ALLOWED_ORIGINS.has(origin))return json("https://mysterylogic.com",403,{error:"origin_not_allowed"});
    return new Response(null,{status:204,headers:corsHeaders(origin)});
  }
  if(req.method!=="POST")return json(origin,405,{error:"method_not_allowed"});
  if(!origin||!ALLOWED_ORIGINS.has(origin))return json("https://mysterylogic.com",403,{error:"origin_not_allowed"});
  if(!AVATAR_ENABLED)return json(origin,503,{error:"avatar_disabled"});
  if(!LIVEAVATAR_API_KEY||!SIGNING_SECRET)return json(origin,503,{error:"avatar_not_configured"});

  let body:any={};
  try{body=await req.json()}catch{return json(origin,400,{error:"invalid_json"})}
  const provider=clean(body?.provider,24).toLowerCase();
  const suspectId=clean(body?.suspect_id,24).toLowerCase();
  const caseId=clean(body?.case_id,160);
  const accessToken=clean(body?.access_token,512);
  const requestedAvatarId=clean(body?.avatar_id,128);
  const requestedMode=clean(body?.mode,16).toLowerCase();
  if(provider!=="heygen"&&provider!=="liveavatar")return json(origin,400,{error:"provider_not_allowed"});
  if(requestedMode&&requestedMode!=="lite")return json(origin,400,{error:"mode_not_allowed"});
  if(!/^[a-zA-Z0-9_:-]{3,160}$/.test(caseId))return json(origin,400,{error:"invalid_case_id"});
  const liveAccess=await requireLiveEntitlement(accessToken,caseId);
  if(!liveAccess.ok)return json(origin,403,{error:liveAccess.error||"live_access_required"});
  const allowedAvatarId=SUSPECT_AVATARS[suspectId]||"";
  if(!allowedAvatarId)return json(origin,404,{error:"suspect_avatar_unavailable"});
  if(requestedAvatarId&&requestedAvatarId!==allowedAvatarId)return json(origin,403,{error:"avatar_not_allowed"});

  const upstream=await fetch(`${LIVEAVATAR_API_BASE}/v1/sessions/token`,{
    method:"POST",
    headers:{"X-API-KEY":LIVEAVATAR_API_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({
      avatar_id:allowedAvatarId,
      mode:"LITE",
      is_sandbox:AVATAR_SANDBOX,
      video_settings:{quality:"medium",encoding:"H264"},
      max_session_duration:MAX_SESSION_SECONDS
    })
  });
  let data:any={};
  try{data=await upstream.json()}catch{}
  if(!upstream.ok){
    console.error("liveavatar_token_error",upstream.status,clean(data?.message||data?.detail||"",300));
    return json(origin,502,{error:"avatar_upstream_error"});
  }
  const sessionId=clean(data?.data?.session_id,128);
  const sessionToken=clean(data?.data?.session_token,4096);
  if(!sessionId||!sessionToken)return json(origin,502,{error:"avatar_upstream_invalid"});
  const speechExpiresAt=Math.floor(Date.now()/1000)+MAX_SESSION_SECONDS+60;
  const signedSpeechToken=await speechToken(sessionId,suspectId,caseId,speechExpiresAt);
  return json(origin,200,{
    provider:"liveavatar",
    mode:"LITE",
    session_id:sessionId,
    session_token:sessionToken,
    speech_token:signedSpeechToken,
    suspect_id:suspectId,
    case_id:caseId,
    experience_tier:"live",
    sandbox:AVATAR_SANDBOX,
    max_session_duration:MAX_SESSION_SECONDS,
    speech_expires_at:speechExpiresAt
  });
});
