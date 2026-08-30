import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS=new Set(["https://mysterylogic.com","https://valera2872.github.io"]);
const OPENAI_API_KEY=Deno.env.get("OPENAI_API_KEY")||"";
const SIGNING_SECRET=Deno.env.get("AI_AVATAR_SIGNING_KEY")||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const AVATAR_ENABLED=(Deno.env.get("AI_AVATAR_ENABLED")||"").toLowerCase()==="true";
const TTS_MODEL=Deno.env.get("AI_AVATAR_TTS_MODEL")||"gpt-4o-mini-tts";
const VOICES:Record<string,string>={
  marina:Deno.env.get("AI_AVATAR_MARINA_VOICE")||"marin",
  anton:Deno.env.get("AI_AVATAR_ANTON_VOICE")||"onyx",
  lev:Deno.env.get("AI_AVATAR_LEV_VOICE")||"echo"
};
const STAGES=new Set(["composed","defensive","cornered","breaking","confessed"]);
const encoder=new TextEncoder();

function clean(v:unknown,max=900){return typeof v==="string"?v.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max):""}
function corsHeaders(origin:string,contentType="application/json; charset=utf-8"){return {
  "access-control-allow-origin":origin||"https://mysterylogic.com",
  "access-control-allow-headers":"authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods":"POST, OPTIONS",
  "access-control-expose-headers":"x-audio-format, x-audio-sample-rate",
  "vary":"Origin",
  "content-type":contentType,
  "cache-control":"no-store"
}}
function json(origin:string,status:number,body:Record<string,unknown>){return new Response(JSON.stringify(body),{status,headers:corsHeaders(origin)})}
function fromBase64url(value:string){const padded=value.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((value.length+3)%4);const binary=atob(padded);return Uint8Array.from(binary,c=>c.charCodeAt(0))}
async function verifySpeechToken(token:string,suspectId:string){
  const [payloadPart,signaturePart,...rest]=token.split(".");
  if(!payloadPart||!signaturePart||rest.length)return false;
  let payload:any={};
  try{payload=JSON.parse(new TextDecoder().decode(fromBase64url(payloadPart)))}catch{return false}
  if(payload?.sus!==suspectId||typeof payload?.sid!=="string"||typeof payload?.exp!=="number")return false;
  const now=Math.floor(Date.now()/1000);
  if(payload.exp<now||payload.exp>now+420)return false;
  const key=await crypto.subtle.importKey("raw",encoder.encode(SIGNING_SECRET),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
  try{return await crypto.subtle.verify("HMAC",key,fromBase64url(signaturePart),encoder.encode(payloadPart))}catch{return false}
}
function deliveryInstruction(suspectId:string,stage:string){
  const base=suspectId==="marina"?"Женский русский голос, естественный и сдержанный. Говори как человек на серьёзном допросе, без дикторской интонации.":suspectId==="anton"?"Мужской русский голос технического специалиста. Спокойно, конкретно, без театральности.":"Мужской русский голос образованного исследователя. Сдержанно, немного колко, без переигрывания.";
  const pressure=stage==="defensive"?" В голосе появляется защитная настороженность.":stage==="cornered"?" Напряжение заметно, ответы короче, но речь остаётся реалистичной.":stage==="breaking"?" Контроль начинает давать сбой: небольшие паузы, напряжение и усталость, без мелодрамы.":stage==="confessed"?" После сопротивления голос тише и тяжелее; признание произнеси прямо, без пафоса.":" Держись уверенно и спокойно.";
  return base+pressure;
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
  if(!OPENAI_API_KEY||!SIGNING_SECRET)return json(origin,503,{error:"avatar_tts_not_configured"});

  let body:any={};
  try{body=await req.json()}catch{return json(origin,400,{error:"invalid_json"})}
  const suspectId=clean(body?.suspect_id,24).toLowerCase();
  const text=clean(body?.text,900);
  const stageRaw=clean(body?.stage,24).toLowerCase();
  const stage=STAGES.has(stageRaw)?stageRaw:"composed";
  const speechToken=clean(body?.speech_token,4096);
  const voice=VOICES[suspectId];
  if(!voice)return json(origin,400,{error:"suspect_not_allowed"});
  if(!text)return json(origin,400,{error:"speech_text_missing"});
  if(!speechToken||!(await verifySpeechToken(speechToken,suspectId)))return json(origin,403,{error:"speech_token_invalid"});

  const payload:Record<string,unknown>={model:TTS_MODEL,input:text,voice,response_format:"pcm",speed:1};
  if(TTS_MODEL==="gpt-4o-mini-tts")payload.instructions=deliveryInstruction(suspectId,stage);
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
  const headers=corsHeaders(origin,"application/octet-stream");
  headers["x-audio-format"]="pcm_s16le_mono";
  headers["x-audio-sample-rate"]="24000";
  return new Response(pcm,{status:200,headers});
});
