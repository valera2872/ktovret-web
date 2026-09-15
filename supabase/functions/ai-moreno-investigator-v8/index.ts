import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const V7=`${SUPABASE_URL}/functions/v1/ai-moreno-investigator-v7`;

const ALLOWED_ORIGINS=new Set([
  "https://mysterylogic.com",
  "https://www.mysterylogic.com",
  "https://valera2872.github.io",
  "https://rawcdn.githack.com"
]);
const TARGETS=new Set(["boyfriend","mother","older_daughter","younger_daughter","second_floor_witness"]);

function clean(v:unknown,max=900){
  return typeof v==="string"
    ?v.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max)
    :"";
}
function qnorm(v:unknown){
  return clean(v,900).toLowerCase().replace(/ё/g,"е").replace(/[.,!?;:()«»"']/g," ").replace(/\s+/g," ").trim();
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
function explicitSwitch(command:string,current:string){
  if(!hasInterviewIntent(command))return false;
  const target=detectTarget(command);
  return Boolean(target&&target!==current);
}
function explicitEndInterview(command:string){
  const q=qnorm(command);
  return /^(?:законч[а-я]*|заверш[а-я]*|прекрат[а-я]*|закр[а-я]*)\s+(?:этот\s+)?(?:допрос|опрос|разговор|бесед)/.test(q)
    || /^(?:вернут[а-я]*|возвращ[а-я]*)\s+(?:к\s+)?(?:расследован|дел)/.test(q);
}
function explicitPresentation(command:string){
  const q=qnorm(command);
  if(/^(?:вы|ты)\s+(?:мож[а-я]*|готов[а-я]*|соглас[а-я]*)/.test(q))return false;
  return /^(?:предъяв[а-я]*|покаж[а-я]*|зачит[а-я]*|ознаком[а-я]*)\s+(?:ему|ей|собеседник[а-я]*|свидетел[а-я]*|бойфренд[а-я]*|матер[а-я]*|дочер[а-я]*|сосед[а-я]*)/.test(q)
    || /^(?:предъяв[а-я]*|покаж[а-я]*|зачит[а-я]*|ознаком[а-я]*)[^.]{0,80}(?:показан[а-я]*|баллист[а-я]*|экспертиз[а-я]*|материал[а-я]*|улик[а-я]*|рапорт[а-я]*|результат[а-я]*)/.test(q);
}
function explicitGlobalInvestigation(command:string){
  const q=qnorm(command);
  if(explicitEndInterview(command)||explicitPresentation(command))return true;
  if(/^(?:моя\s+версия|рабочая\s+версия|зафиксир[а-я]*\s+(?:мою|версию)|запиш[а-я]*\s+(?:мою|версию)|переда[а-я]*\s+дело|заверш[а-я]*\s+расследован)/.test(q))return true;
  const action=/^(?:осмотр[а-я]*|провед[а-я]*|назнач[а-я]*|проверь[а-я]*|провер[а-я]*|установ[а-я]*|найд[а-я]*|разыщ[а-я]*|запрос[а-я]*|собер[а-я]*|свер[а-я]*|сопостав[а-я]*|исслед[а-я]*|проанализ[а-я]*|восстанов[а-я]*|реконструир[а-я]*)/.test(q);
  const object=/(мест[а-я]*\s+происшеств|баллист[а-я]*|траектор[а-я]*|экспертиз[а-я]*|алibi|алиб[а-я]*|телефон[а-я]*|звонк[а-я]*|камер[а-я]*|днк|отпечат[а-я]*|свидетел[а-я]*|жил[а-я]*\s+дом[а-я]*|оруж[а-я]*\s+(?:на|по)\s+экспертиз[а-я]*|криминалист[а-я]*)/.test(q);
  return action&&object;
}
function activeInterviewPlan(body:any){
  if(clean(body?.action,30)!=="plan")return null;
  const current=clean(body?.focus,40);
  if(!TARGETS.has(current))return null;
  const command=clean(body?.command,900);
  if(!command)return null;
  if(explicitSwitch(command,current)||explicitGlobalInvestigation(command))return null;
  return {
    operations:[{op:"ask_witness",target:current,question:command}],
    mode:"deterministic_active_interview",
    target:current,
    player_led:true,
    automatic_contradiction_detection:false
  };
}
async function forward(req:Request,body:any,headers:Record<string,string>){
  const r=await fetch(V7,{
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
      version:8,
      upstream:"ai-moreno-investigator-v7",
      interrogation_mode:"active-witness-first",
      explicit_interview_routing:"all-known-character-types",
      neighboring_floor_aliases:true,
      active_interview_default:"ask-current-character",
      global_action_requires_explicit_order:true,
      player_leads_investigation:true,
      automatic_contradiction_detection:false,
      visual_contract:"unchanged"
    });
  }

  const direct=activeInterviewPlan(body);
  if(direct)return json(direct);
  return forward(req,body,headers);
});
