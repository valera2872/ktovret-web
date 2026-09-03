import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS=new Set(["https://mysterylogic.com","https://valera2872.github.io"]);
const LIVEAVATAR_API_KEY=Deno.env.get("LIVEAVATAR_API_KEY")||"";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const encoder=new TextEncoder();

function clean(v:unknown,max=300){return typeof v==="string"?v.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max):""}
function cors(origin:string){return {
  "access-control-allow-origin":origin||"https://mysterylogic.com",
  "access-control-allow-headers":"authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods":"POST, OPTIONS",
  "vary":"Origin",
  "content-type":"application/json; charset=utf-8",
  "cache-control":"no-store"
}}
function json(origin:string,status:number,body:Record<string,unknown>){return new Response(JSON.stringify(body),{status,headers:cors(origin)})}
function hex(bytes:ArrayBuffer){return Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,"0")).join("")}
async function sha256(value:string){return hex(await crypto.subtle.digest("SHA-256",encoder.encode(value)))}
function tierOf(metadata:any){return String(metadata?.experience_tier||"").toLowerCase()==="live"?"live":"text"}

async function requireOwner(accessToken:string){
  if(accessToken.length<32||accessToken.length>512)return {ok:false,error:"live_access_required"};
  if(!SUPABASE_URL||!SERVICE_ROLE_KEY)return {ok:false,error:"avatar_access_not_configured"};
  const admin=createClient(SUPABASE_URL,SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const tokenHash=await sha256(accessToken);
  const {data,error}=await admin.from("access_entitlements")
    .select("id,status,starts_at,expires_at,revoked_at,metadata")
    .eq("token_hash",tokenHash).eq("status","active").maybeSingle();
  if(error)return {ok:false,error:"live_access_check_failed"};
  if(!data)return {ok:false,error:"live_access_required"};
  const now=Date.now();
  if(data.revoked_at)return {ok:false,error:"live_access_revoked"};
  if(data.starts_at&&new Date(data.starts_at).getTime()>now)return {ok:false,error:"live_access_not_started"};
  if(data.expires_at&&new Date(data.expires_at).getTime()<=now)return {ok:false,error:"live_access_expired"};
  if(tierOf(data.metadata)!=="live")return {ok:false,error:"live_tier_required"};
  if(clean(data.metadata?.source,64)!=="owner_preview"||clean(data.metadata?.case_id,64)!=="AI-01")return {ok:false,error:"owner_preview_required"};
  return {ok:true,admin,entitlement:data};
}

async function fetchPublicIds(){
  if(!LIVEAVATAR_API_KEY)throw new Error("avatar_not_configured");
  const ids=new Set<string>();
  let total=0;
  for(let page=1;page<=3;page++){
    const url=new URL("https://api.liveavatar.com/v1/avatars/public");
    url.searchParams.set("page",String(page));
    url.searchParams.set("page_size","100");
    const upstream=await fetch(url,{headers:{"X-API-KEY":LIVEAVATAR_API_KEY,"Accept":"application/json"}});
    let payload:any={};try{payload=await upstream.json()}catch{}
    if(!upstream.ok)throw new Error(`upstream_${upstream.status}`);
    const results=Array.isArray(payload?.data?.results)?payload.data.results:[];
    total=Math.max(total,Number(payload?.data?.count||0));
    for(const row of results){const id=clean(row?.id||row?.avatar_id||row?.avatarId||row?.uuid,160);if(id)ids.add(id)}
    if(results.length<100||ids.size>=total)break;
  }
  return ids;
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin")||"";
  if(req.method==="OPTIONS"){
    if(origin&&!ALLOWED_ORIGINS.has(origin))return json("https://mysterylogic.com",403,{error:"origin_not_allowed"});
    return new Response(null,{status:204,headers:cors(origin)});
  }
  if(req.method!=="POST")return json(origin,405,{error:"method_not_allowed"});
  if(!origin||!ALLOWED_ORIGINS.has(origin))return json("https://mysterylogic.com",403,{error:"origin_not_allowed"});
  let body:any={};try{body=await req.json()}catch{return json(origin,400,{error:"invalid_json"})}
  if(clean(body?.action,24).toLowerCase()!=="sync")return json(origin,400,{error:"unknown_action"});
  const accessToken=clean(body?.access_token,512);
  const owner=await requireOwner(accessToken);
  if(!owner.ok)return json(origin,403,{error:owner.error||"owner_preview_required"});
  const anton=clean(body?.cast?.anton,160);
  const lev=clean(body?.cast?.lev,160);
  if(!anton||!lev||anton===lev)return json(origin,400,{error:"invalid_cast"});
  let publicIds:Set<string>;
  try{publicIds=await fetchPublicIds()}
  catch(error){console.error("preview_cast_catalog_error",String(error));return json(origin,502,{error:"avatar_catalog_upstream_error"})}
  if(!publicIds.has(anton)||!publicIds.has(lev))return json(origin,400,{error:"preset_not_public"});
  const previous=(owner.entitlement?.metadata&&typeof owner.entitlement.metadata==="object")?owner.entitlement.metadata:{};
  const metadata={...previous,preview_avatar_overrides:{anton,lev},preview_avatar_overrides_updated_at:new Date().toISOString()};
  const {error:updateError}=await owner.admin.from("access_entitlements").update({metadata}).eq("id",owner.entitlement.id);
  if(updateError){console.error("preview_cast_update_error",updateError.message);return json(origin,503,{error:"preview_cast_update_failed"})}
  console.log("preview_cast_synced",JSON.stringify({entitlement_id:owner.entitlement.id,anton,lev}));
  return json(origin,200,{ok:true,case_id:"AI-01",cast:{anton,lev}});
});
