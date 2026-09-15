import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const V6=`${SUPABASE_URL}/functions/v1/ai-moreno-investigator-v6`;

const ALLOWED_ORIGINS=new Set([
  "https://mysterylogic.com",
  "https://www.mysterylogic.com",
  "https://valera2872.github.io",
  "https://rawcdn.githack.com"
]);

function clean(v:unknown,max=900){
  return typeof v==="string"
    ?v.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max)
    :"";
}
function qnorm(v:unknown){
  return clean(v,900).toLowerCase().replace(/ё/g,"е").replace(/[.,!?;:()«»"']/g," ").replace(/\s+/g," ").trim();
}
function completedSet(v:unknown){
  return new Set(Array.isArray(v)?v.map(x=>clean(x,60)).filter(Boolean):[]);
}
function cors(origin:string){
  return {
    "access-control-allow-origin":origin||"https://mysterylogic.com",
    "access-control-allow-headers":"authorization, apikey, content-type",
    "access-control-allow-methods":"POST, OPTIONS",
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store",
    "vary":"Origin"
  };
}
function hasInterviewIntent(command:string){
  const q=qnorm(command);
  return /^(?:(?:я|мы)\s+)?(?:(?:хочу|хотим|нужно|надо)\s+)?(?:выз[а-я]*|приглас[а-я]*|позов[а-я]*|допрос[а-я]*|опрос[а-я]*|поговор[а-я]*|побесед[а-я]*|бесед[а-я]*|привед[а-я]*|достав[а-я]*)/.test(q)
    || /(?:выз[а-я]*|приглас[а-я]*|позов[а-я]*)[^.]{0,60}(?:на\s+)?допрос[а-я]*/.test(q);
}
function secondFloorWitnessAlias(q:string){
  const person="(?:сосед[а-я]*|жилец[а-я]*|жител[а-я]*|свидетел[а-я]*)";
  return new RegExp(`${person}[^.]{0,45}втор[а-я]*\\s+этаж[а-я]*`).test(q)
    || new RegExp(`втор[а-я]*\\s+этаж[а-я]*[^.]{0,45}${person}`).test(q)
    || new RegExp(`${person}[^.]{0,45}(?:с\\s+)?соседн[а-я]*\\s+этаж[а-я]*`).test(q)
    || new RegExp(`соседн[а-я]*\\s+этаж[а-я]*[^.]{0,45}${person}`).test(q)
    || new RegExp(`${person}[^.]{0,45}этаж[а-я]*\\s+(?:ниже|выше)`).test(q)
    || new RegExp(`${person}[^.]{0,45}(?:сверху|снизу)`).test(q);
}
function detectTarget(command:string){
  const q=qnorm(command);
  if(/бойфренд[а-я]*/.test(q)||/парн[а-я]*[^.]{0,30}доч[а-я]*/.test(q))return "boyfriend";
  if(/старш[а-я]*\s+доч[а-я]*/.test(q))return "older_daughter";
  if(/младш[а-я]*\s+доч[а-я]*/.test(q))return "younger_daughter";
  if(/приемн[а-я]*\s+мат[а-я]*/.test(q)||/мат[а-я]*\s+patricia/.test(q)||/мат[а-я]*\s+патриц[а-я]*/.test(q))return "mother";
  if(secondFloorWitnessAlias(q))return "second_floor_witness";
  return "";
}
function deterministicInterviewPlan(body:any){
  if(clean(body?.action,30)!=="plan")return null;
  const command=clean(body?.command,900);
  if(!hasInterviewIntent(command))return null;
  const target=detectTarget(command);
  if(!target)return null;
  const done=completedSet(body?.completed);
  const operations:any[]=[];
  if(["boyfriend","mother","older_daughter","younger_daughter"].includes(target)&&!done.has("people")){
    operations.push({op:"identify_people"});
  }
  if(target==="second_floor_witness"&&!done.has("witnessLocated")){
    operations.push({op:"locate_witnesses"});
  }
  operations.push({op:"start_interview",target});
  return {
    operations,
    mode:"deterministic_interview_routing",
    target,
    player_led:true,
    automatic_contradiction_detection:false
  };
}
async function forward(req:Request,body:any,headers:Record<string,string>){
  const r=await fetch(V6,{
    method:"POST",
    headers:{
      authorization:req.headers.get("authorization")||"",
      apikey:req.headers.get("apikey")||"",
      "content-type":"application/json",
      origin:req.headers.get("origin")||"https://mysterylogic.com"
    },
    body:JSON.stringify(body)
  });
  const text=await r.text();
  return new Response(text,{status:r.status,headers});
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin")||"";
  if(origin&&!ALLOWED_ORIGINS.has(origin)){
    return new Response(JSON.stringify({error:"origin_not_allowed"}),{status:403,headers:{"content-type":"application/json"}});
  }
  const headers=cors(origin||"https://mysterylogic.com");
  const json=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status,headers});
  if(req.method==="OPTIONS")return new Response("ok",{headers});
  if(req.method!=="POST")return json({error:"method_not_allowed"},405);

  let body:any;
  try{body=await req.json()}catch{return json({error:"invalid_json"},400)}

  if(clean(body?.action,30)==="status"){
    return json({
      version:7,
      upstream:"ai-moreno-investigator-v6",
      interrogation_mode:"live-character-speaking-brief",
      explicit_interview_routing:"all-known-character-types",
      neighboring_floor_aliases:true,
      auto_establish_requested_contact:true,
      player_leads_investigation:true,
      automatic_contradiction_detection:false,
      visual_contract:"unchanged"
    });
  }

  const direct=deterministicInterviewPlan(body);
  if(direct)return json(direct);
  return forward(req,body,headers);
});
