import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ALLOWED_ORIGINS=new Set(["https://mysterylogic.com","https://valera2872.github.io"]);
const LIVEAVATAR_API_BASE="https://api.liveavatar.com";
const LIVEAVATAR_API_KEY=Deno.env.get("LIVEAVATAR_API_KEY")||"";
const AVATAR_ENABLED=(Deno.env.get("AI_AVATAR_ENABLED")||"").toLowerCase()==="true";
const AVATAR_SANDBOX=(Deno.env.get("AI_AVATAR_SANDBOX")||"true").toLowerCase()!=="false";
const MARINA_AVATAR_ID=Deno.env.get("AI_AVATAR_MARINA_ID")||"";
const ANTON_AVATAR_ID=Deno.env.get("AI_AVATAR_ANTON_ID")||"";
const LEV_AVATAR_ID=Deno.env.get("AI_AVATAR_LEV_ID")||"";
const MAX_SESSION_SECONDS=Math.max(60,Math.min(300,Number(Deno.env.get("AI_AVATAR_MAX_SESSION_SECONDS")||"300")||300));

const SUSPECT_AVATARS:Record<string,string>={marina:MARINA_AVATAR_ID,anton:ANTON_AVATAR_ID,lev:LEV_AVATAR_ID};

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

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin")||"";
  if(req.method==="OPTIONS"){
    if(origin&&!ALLOWED_ORIGINS.has(origin))return json("https://mysterylogic.com",403,{error:"origin_not_allowed"});
    return new Response(null,{status:204,headers:corsHeaders(origin)});
  }
  if(req.method!=="POST")return json(origin,405,{error:"method_not_allowed"});
  if(!origin||!ALLOWED_ORIGINS.has(origin))return json("https://mysterylogic.com",403,{error:"origin_not_allowed"});
  if(!AVATAR_ENABLED)return json(origin,503,{error:"avatar_disabled"});
  if(!LIVEAVATAR_API_KEY)return json(origin,503,{error:"avatar_not_configured"});

  let body:any={};
  try{body=await req.json()}catch{return json(origin,400,{error:"invalid_json"})}
  const provider=clean(body?.provider,24).toLowerCase();
  const suspectId=clean(body?.suspect_id,24).toLowerCase();
  const requestedAvatarId=clean(body?.avatar_id,128);
  const requestedMode=clean(body?.mode,16).toLowerCase();
  if(provider!=="heygen"&&provider!=="liveavatar")return json(origin,400,{error:"provider_not_allowed"});
  if(requestedMode&&requestedMode!=="lite")return json(origin,400,{error:"mode_not_allowed"});
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
  return json(origin,200,{
    provider:"liveavatar",
    mode:"LITE",
    session_id:sessionId,
    session_token:sessionToken,
    suspect_id:suspectId,
    sandbox:AVATAR_SANDBOX,
    max_session_duration:MAX_SESSION_SECONDS
  });
});
