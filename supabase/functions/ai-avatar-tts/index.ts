import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { loadAiAvatarProfile } from "../_shared/ai-avatar-profile.ts";

const ALLOWED_ORIGINS=new Set(["https://mysterylogic.com","https://valera2872.github.io"]);
const OPENAI_API_KEY=Deno.env.get("OPENAI_API_KEY")||"";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const SIGNING_SECRET=Deno.env.get("AI_AVATAR_SIGNING_KEY")||SERVICE_ROLE_KEY;
const AVATAR_ENABLED=(Deno.env.get("AI_AVATAR_ENABLED")||"").toLowerCase()==="true";
const TTS_MODEL=Deno.env.get("AI_AVATAR_TTS_MODEL")||"gpt-4o-mini-tts";
const CASE_BUDGET_MS=Math.max(300000,Math.min(1800000,Number(Deno.env.get("AI_AVATAR_CASE_BUDGET_MS")||"900000")||900000));
const BILLING_OVERHEAD_MS=Math.max(1000,Math.min(10000,Number(Deno.env.get("AI_AVATAR_BILLING_OVERHEAD_MS")||"5000")||5000));
const PCM_BYTES_PER_SECOND=24000*2;
const STAGES=new Set(["composed","defensive","cornered","breaking","confessed"]);
const encoder=new TextEncoder();

function clean(v:unknown,max=900){return typeof v==="string"?v.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max):""}
function validUtteranceId(value:string){return /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(value)}
function corsHeaders(origin:string,contentType="application/json; charset=utf-8"){return {
  "access-control-allow-origin":origin||"https://mysterylogic.com",
  "access-control-allow-headers":"authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods":"POST, OPTIONS",
  "access-control-expose-headers":"x-audio-format, x-audio-sample-rate, x-avatar-charge-ms, x-avatar-budget-remaining-ms",
  "vary":"Origin",
  "content-type":contentType,
  "cache-control":"no-store"
}}
function json(origin:string,status:number,body:Record<string,unknown>){return new Response(JSON.stringify(body),{status,headers:corsHeaders(origin)})}
function fromBase64url(value:string){const padded=value.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((value.length+3)%4);const binary=atob(padded);return Uint8Array.from(binary,c=>c.charCodeAt(0))}
async function verifySpeechToken(token:string,suspectId:string){
  const [payloadPart,signaturePart,...rest]=token.split(".");
  if(!payloadPart||!signaturePart||rest.length)return null;
  let payload:any={};
  try{payload=JSON.parse(new TextDecoder().decode(fromBase64url(payloadPart)))}catch{return null}
  if(payload?.sus!==suspectId||typeof payload?.sid!=="string"||typeof payload?.cid!=="string"||typeof payload?.eid!=="string"||typeof payload?.exp!=="number"||typeof payload?.op!=="boolean")return null;
  if(payload.sid.length<8||payload.sid.length>160||!/^[a-zA-Z0-9_:-]{3,160}$/.test(payload.cid)||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.eid))return null;
  const now=Math.floor(Date.now()/1000);
  if(payload.exp<now||payload.exp>now+420)return null;
  const key=await crypto.subtle.importKey("raw",encoder.encode(SIGNING_SECRET),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
  try{return await crypto.subtle.verify("HMAC",key,fromBase64url(signaturePart),encoder.encode(payloadPart))?payload:null}catch{return null}
}
function deliveryInstruction(base:string,stage:string){
  const identity=clean(base,1600)||"Естественный русский голос взрослого человека на серьёзном допросе. Без дикторской подачи и театральности.";
  const pressure=stage==="defensive"?" В голосе появляется защитная настороженность.":stage==="cornered"?" Напряжение заметно, ответы короче, но речь остаётся реалистичной.":stage==="breaking"?" Контроль начинает давать сбой: небольшие паузы, напряжение и усталость, без мелодрамы.":stage==="confessed"?" После сопротивления голос тише и тяжелее; признание произнеси прямо, без пафоса.":" Держись уверенно и спокойно.";
  return identity+pressure;
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin")||"";
  if(req.method==="OPTIONS"){
    if(origin&&!ALLOWED_ORIGINS.has(origin))return json("https://mysterylogic.com",403,{error:"origin_not_allowed"});
    return new Response(null,{status:204,headers:corsHeaders(origin)});
  }
  if(req.method!=="POST")return json(origin,405,{error:"method_not_allowed"});
  if(!origin||!ALLOWED_ORIGINS.has(origin))return json("https://mysterylogic.com",403,{error:"origin_not_allowed"});
  if(!OPENAI_API_KEY||!SIGNING_SECRET||!SUPABASE_URL||!SERVICE_ROLE_KEY)return json(origin,503,{error:"avatar_tts_not_configured"});

  let body:any={};
  try{body=await req.json()}catch{return json(origin,400,{error:"invalid_json"})}
  const suspectId=clean(body?.suspect_id,80).toLowerCase();
  const text=clean(body?.text,900);
  const stageRaw=clean(body?.stage,24).toLowerCase();
  const stage=STAGES.has(stageRaw)?stageRaw:"composed";
  const speechToken=clean(body?.speech_token,4096);
  const utteranceId=clean(body?.utterance_id,80).toLowerCase();
  if(!text)return json(origin,400,{error:"speech_text_missing"});
  if(!validUtteranceId(utteranceId))return json(origin,400,{error:"utterance_id_invalid"});
  const speechClaim=speechToken?await verifySpeechToken(speechToken,suspectId):null;
  if(!speechClaim)return json(origin,403,{error:"speech_token_invalid"});
  const isOwnerPreview=speechClaim.cid==="AI-01"&&speechClaim.op===true;
  if(!AVATAR_ENABLED&&!isOwnerPreview)return json(origin,503,{error:"avatar_disabled"});

  let profile;
  try{profile=await loadAiAvatarProfile({supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,caseId:speechClaim.cid,suspectId})}
  catch(error){console.error("avatar_tts_profile_error",String(error));return json(origin,503,{error:"avatar_profile_unavailable"})}
  if(!profile?.ttsVoice)return json(origin,404,{error:"suspect_voice_unavailable"});

  const payload:Record<string,unknown>={model:TTS_MODEL,input:text,voice:profile.ttsVoice,response_format:"pcm",speed:1};
  if(TTS_MODEL==="gpt-4o-mini-tts"||TTS_MODEL.startsWith("gpt-4o-mini-tts-"))payload.instructions=deliveryInstruction(profile.ttsInstructions,stage);
  const upstream=await fetch("https://api.openai.com/v1/audio/speech",{
    method:"POST",
    headers:{"authorization":`Bearer ${OPENAI_API_KEY}`,"content-type":"application/json"},
    body:JSON.stringify(payload)
  });
  if(!upstream.ok){
    let message="";try{const data=await upstream.json();message=clean(data?.error?.message||"",240)}catch{}
    console.error("avatar_tts_upstream_error",upstream.status,message);
    return json(origin,502,{error:"avatar_tts_upstream_error"});
  }
  const pcm=await upstream.arrayBuffer();
  if(!pcm.byteLength)return json(origin,502,{error:"avatar_tts_empty"});

  const speechMs=Math.max(500,Math.ceil(pcm.byteLength/PCM_BYTES_PER_SECOND*1000));
  const chargeMs=Math.min(CASE_BUDGET_MS,speechMs+BILLING_OVERHEAD_MS);
  const admin=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:budgetRows,error:budgetError}=await admin.rpc("claim_ai_avatar_usage",{
    p_session_id:speechClaim.sid,
    p_utterance_id:utteranceId,
    p_entitlement_id:speechClaim.eid,
    p_case_id:speechClaim.cid,
    p_charge_ms:chargeMs,
    p_limit_ms:CASE_BUDGET_MS
  });
  if(budgetError){
    console.error("avatar_budget_claim_failed",budgetError.message);
    return json(origin,503,{error:"avatar_budget_unavailable"});
  }
  const budget=Array.isArray(budgetRows)?budgetRows[0]:budgetRows;
  if(!budget?.allowed){
    return json(origin,budget?.duplicate?409:429,{
      error:budget?.duplicate?"avatar_utterance_replayed":"avatar_budget_exhausted",
      remaining_ms:Number(budget?.remaining_ms||0),
      limit_ms:CASE_BUDGET_MS
    });
  }

  const headers=corsHeaders(origin,"application/octet-stream");
  headers["x-audio-format"]="pcm_s16le_mono";
  headers["x-audio-sample-rate"]="24000";
  headers["x-avatar-charge-ms"]=String(chargeMs);
  headers["x-avatar-budget-remaining-ms"]=String(Math.max(0,Number(budget?.remaining_ms||0)));
  return new Response(pcm,{status:200,headers});
});
