import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const ENV_ANON_KEY=Deno.env.get("SUPABASE_ANON_KEY")||"";
const PUBLIC_MARKER="moreno-public-v23";
const V9=`${SUPABASE_URL}/functions/v1/ai-moreno-investigator-v9`;
const ALLOWED_ORIGINS=new Set([
  "https://mysterylogic.com",
  "https://www.mysterylogic.com",
  "https://valera2872.github.io",
  "https://rawcdn.githack.com"
]);
function cors(origin:string){return {"access-control-allow-origin":origin||"https://mysterylogic.com","access-control-allow-headers":"content-type, x-ml-client-version","access-control-allow-methods":"POST, OPTIONS","content-type":"application/json; charset=utf-8","cache-control":"no-store","vary":"Origin"}}
function clientAuthorized(req:Request){return (req.headers.get("x-ml-client-version")||"")===PUBLIC_MARKER}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin")||"";
  if(origin&&!ALLOWED_ORIGINS.has(origin))return new Response(JSON.stringify({error:"origin_not_allowed"}),{status:403,headers:{"content-type":"application/json"}});
  const headers=cors(origin||"https://mysterylogic.com");
  if(req.method==="OPTIONS")return new Response("ok",{headers});
  if(!clientAuthorized(req))return new Response(JSON.stringify({error:"unauthorized_client"}),{status:401,headers});
  if(req.method!=="POST")return new Response(JSON.stringify({error:"method_not_allowed"}),{status:405,headers});
  if(!ENV_ANON_KEY)return new Response(JSON.stringify({error:"upstream_public_key_missing"}),{status:503,headers});
  const body=await req.text();
  const r=await fetch(V9,{method:"POST",headers:{authorization:`Bearer ${ENV_ANON_KEY}`,apikey:ENV_ANON_KEY,"content-type":"application/json",origin:"https://mysterylogic.com"},body});
  return new Response(await r.text(),{status:r.status,headers});
});
