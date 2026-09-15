import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const ENV_ANON_KEY=Deno.env.get("SUPABASE_ANON_KEY")||"";
const LEGACY_PUBLIC_KEY_SHA256="6f8e00d6371b2e0b53652d02e4eb8d92e2d61008024368522b99638091016386";
const V9=`${SUPABASE_URL}/functions/v1/ai-moreno-investigator-v9`;
const ALLOWED_ORIGINS=new Set([
  "https://mysterylogic.com",
  "https://www.mysterylogic.com",
  "https://valera2872.github.io",
  "https://rawcdn.githack.com"
]);
function clean(v:unknown,max=900){return typeof v==="string"?v.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max):""}
function cors(origin:string){return {"access-control-allow-origin":origin||"https://mysterylogic.com","access-control-allow-headers":"authorization, apikey, content-type","access-control-allow-methods":"POST, OPTIONS","content-type":"application/json; charset=utf-8","cache-control":"no-store","vary":"Origin"}}
async function sha256(value:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function clientAuthorized(req:Request){const api=req.headers.get("apikey")||"",auth=req.headers.get("authorization")||"";if(!api||auth!==`Bearer ${api}`)return false;if(ENV_ANON_KEY&&api===ENV_ANON_KEY)return true;return (await sha256(api))===LEGACY_PUBLIC_KEY_SHA256}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin")||"";
  if(origin&&!ALLOWED_ORIGINS.has(origin))return new Response(JSON.stringify({error:"origin_not_allowed"}),{status:403,headers:{"content-type":"application/json"}});
  const headers=cors(origin||"https://mysterylogic.com");
  if(req.method==="OPTIONS")return new Response("ok",{headers});
  if(!(await clientAuthorized(req)))return new Response(JSON.stringify({error:"unauthorized_client"}),{status:401,headers});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
  if(!ENV_ANON_KEY)return new Response(JSON.stringify({error:"upstream_public_key_missing"}),{status:503,headers});
  const body=await req.text();
  const r=await fetch(V9,{method:"POST",headers:{authorization:`Bearer ${ENV_ANON_KEY}`,apikey:ENV_ANON_KEY,"content-type":"application/json",origin:origin||"https://mysterylogic.com"},body});
  return new Response(await r.text(),{status:r.status,headers});
});
