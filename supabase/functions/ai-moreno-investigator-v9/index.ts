import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const OPENAI_API_KEY=Deno.env.get("OPENAI_API_KEY")||"";
const MODEL=Deno.env.get("AI_DETECTIVE_MODEL")||"gpt-5.6-luna";
const PUBLIC_ANON_KEY=Deno.env.get("SUPABASE_ANON_KEY")||"";
const V8=`${SUPABASE_URL}/functions/v1/ai-moreno-investigator-v8`;

const ALLOWED_ORIGINS=new Set([
  "https://mysterylogic.com",
  "https://www.mysterylogic.com",
  "https://valera2872.github.io",
  "https://rawcdn.githack.com"
]);
const TARGETS=new Set(["boyfriend","mother","older_daughter","younger_daughter","second_floor_witness"]);
const EXPERTS=new Set(["none","generic","ballistics","trajectory","medical","forensics"]);
const INTENTS=new Set(["ask_current_witness","switch_interview","call_expert","global_investigation","present_material","end_interview","unknown"]);
const OPERATIONS=new Set(["none","inspect_scene","identify_people","locate_witnesses","interview_occupants","interview_daughters","forensic_ballistics","forensic_trajectory","check_relationships","check_alibi","check_weapon","autopsy","compare_description","unsupported_forensic"]);

const RESERVE_USD=.0015;
const SESSION_LIMIT=100;
const VISITOR_DAILY_LIMIT=140;
const NETWORK_DAILY_LIMIT=500;
const DAILY_BUDGET_USD=.50;
const SESSION_RPM=12;
const NETWORK_RPM=60;
const INPUT_USD_PER_M=.20;
const CACHED_INPUT_USD_PER_M=.02;
const OUTPUT_USD_PER_M=1.20;

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
function clientAuthorized(req:Request){
  const api=req.headers.get("apikey")||"",auth=req.headers.get("authorization")||"";
  return Boolean(PUBLIC_ANON_KEY&&api===PUBLIC_ANON_KEY&&auth===`Bearer ${PUBLIC_ANON_KEY}`);
}
function semanticCandidate(command:string){
  const q=qnorm(command);
  if(!q)return false;
  const summon=/(?:выз[а-я]*|позов[а-я]*|приглас[а-я]*|допрос[а-я]*|опрос[а-я]*|поговор[а-я]*|побесед[а-я]*|бесед[а-я]*|привед[а-я]*|достав[а-я]*|пусть\s+прид[а-я]*|мне\s+нуж[а-я]*|хочу\s+(?:увид[а-я]*|услыш[а-я]*))/.test(q);
  const role=/(?:бойфренд[а-я]*|парн[а-я]*|приемн[а-я]*\s+мат[а-я]*|старш[а-я]*\s+доч[а-я]*|младш[а-я]*\s+доч[а-я]*|сосед[а-я]*|жилец[а-я]*|жильц[а-я]*|жител[а-я]*|свидетел[а-я]*|очевид[а-я]*|этаж[а-я]*|эксперт[а-я]*|криминалист[а-я]*|баллист[а-я]*|судмед[а-я]*|патолог[а-я]*|специалист[а-я]*)/.test(q);
  const action=/(?:^|\s)(?:осмотр[а-я]*|провед[а-я]*|проверь[а-я]*|провер[а-я]*|выясн[а-я]*|установ[а-я]*|найд[а-я]*|разыщ[а-я]*|поищ[а-я]*|собер[а-я]*|изуч[а-я]*|исслед[а-я]*|проанализ[а-я]*|сопостав[а-я]*|свер[а-я]*|сравн[а-я]*|восстанов[а-я]*|реконструир[а-я]*|посмотр[а-я]*|подним[а-я]*|назнач[а-я]*|разбер[а-я]*)/.test(q);
  const object=/(?:мест[а-я]*\s+происшеств|пожарн[а-я]*\s+лестниц|квартир[а-я]*|кто\s+(?:был|находил)|круг[а-я]*\s+лиц|жилец[а-я]*|жильц[а-я]*|сосед[а-я]*|свидетел[а-я]*|очевид[а-я]*|баллист[а-я]*|пул[а-я]*|калибр[а-я]*|траектор[а-я]*|направлен[а-я]*\s+выстрел|стрел[а-я]*|выстрел[а-я]*|ран[а-я]*|оруж[а-я]*|пистолет[а-я]*|отношен[а-я]*|конфликт[а-я]*|угроз[а-я]*|алиб[а-я]*|спал[а-я]*|кресл[а-я]*|вскрыт[а-я]*|судмед[а-я]*|причин[а-я]*\s+смерт|описан[а-я]*|днк|отпечат[а-я]*|телефон[а-я]*|звонк[а-я]*|камер[а-я]*)/.test(q);
  return summon||role||(action&&object);
}
function clientNetwork(req:Request){
  const cf=clean(req.headers.get("cf-connecting-ip"),120);if(cf)return cf;
  const xf=clean(req.headers.get("x-forwarded-for"),300);if(xf)return xf.split(",")[0].trim();
  const xr=clean(req.headers.get("x-real-ip"),120);if(xr)return xr;
  return `fallback:${clean(req.headers.get("user-agent"),180)}`;
}
async function hashSecret(kind:string,value:string){
  const secret=SERVICE_ROLE_KEY||OPENAI_API_KEY;
  if(!secret)return "";
  const bytes=new TextEncoder().encode(`${kind}|${secret}|${value}`);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function rpc(name:string,payload:Record<string,unknown>){
  if(!SUPABASE_URL||!SERVICE_ROLE_KEY)throw new Error("budget_backend_missing");
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:"POST",
    headers:{apikey:SERVICE_ROLE_KEY,authorization:`Bearer ${SERVICE_ROLE_KEY}`,"content-type":"application/json"},
    body:JSON.stringify(payload)
  });
  const text=await r.text();
  if(!r.ok)throw new Error(`budget_rpc_${r.status}`);
  return JSON.parse(text);
}
async function claimTurn(req:Request,session:string,visitor:string){
  try{
    if(!session||!visitor)return null;
    const x=await rpc("ai_detective_claim_turn",{
      p_session_id:`moreno-v9-semantic-${session}`,
      p_visitor_hash:await hashSecret("visitor",visitor),
      p_network_hash:await hashSecret("network",clientNetwork(req)),
      p_reserve_usd:RESERVE_USD,
      p_session_limit:SESSION_LIMIT,
      p_visitor_daily_limit:VISITOR_DAILY_LIMIT,
      p_network_daily_limit:NETWORK_DAILY_LIMIT,
      p_daily_budget_usd:DAILY_BUDGET_USD,
      p_session_rpm:SESSION_RPM,
      p_network_rpm:NETWORK_RPM
    });
    return x?.ok?x:null;
  }catch{return null}
}
async function releaseTurn(id:string){try{if(id)await rpc("ai_detective_release_turn",{p_claim_id:id})}catch{}}
async function completeTurn(id:string,data:any){
  try{
    const u=data?.usage||{};
    const input=Number(u.input_tokens)||0;
    const cached=Number(u.input_tokens_details?.cached_tokens)||0;
    const output=Number(u.output_tokens)||0;
    const cost=((Math.max(0,input-cached)*INPUT_USD_PER_M)+(cached*CACHED_INPUT_USD_PER_M)+(output*OUTPUT_USD_PER_M))/1_000_000;
    await rpc("ai_detective_complete_turn",{p_claim_id:id,p_actual_usd:cost,p_input_tokens:input,p_cached_input_tokens:cached,p_output_tokens:output});
  }catch{}
}

const SEMANTIC_INSTRUCTIONS=`Ты — только маршрутизатор естественного языка для детективной игры. Ты НЕ расследуешь дело, НЕ определяешь виновного, НЕ ищешь противоречия, НЕ ранжируешь улики и НЕ рекомендуешь игроку следующий шаг.

Разрешённый реестр людей:
- boyfriend = бойфренд СТАРШЕЙ ДОЧЕРИ приёмной матери Patricia; это НЕ бойфренд Patricia.
- mother = приёмная мать Patricia.
- older_daughter = старшая дочь приёмной матери.
- younger_daughter = младшая дочь приёмной матери.
- second_floor_witness = бывший жилец/житель второго этажа, независимый сосед-свидетель; разговорные описания вроде «сосед с другого/соседнего этажа», «тот жилец этажом ниже/выше» могут обозначать его, если это прямо следует из слов игрока.

НИКОГДА не отождествляй с boyfriend фразы «мужчина над Patricia», «стрелок», «убийца», «тот, кто стрелял» или иное описание, требующее следственного вывода. Для таких фраз target="none".

Разрешённые intent:
- ask_current_witness: игрок задаёт вопрос текущему собеседнику, даже если в вопросе упоминается другой человек.
- switch_interview: игрок просит вызвать/пригласить/дать поговорить/допросить конкретного человека из реестра.
- call_expert: игрок просит привлечь специалиста.
- global_investigation: игрок сам явно поручает следственной группе конкретную проверку из закрытого списка operation ниже.
- present_material: явное предъявление уже полученного материала собеседнику.
- end_interview: явное завершение допроса.
- unknown: нельзя надёжно определить.

Для call_expert expert_type:
- ballistics: оружие, пуля, калибр, баллистика;
- trajectory: траектория/направление выстрела;
- medical: судмедэксперт, патологоанатом, вскрытие;
- forensics: криминалист без более точной специализации;
- generic: просто эксперт/специалист без задачи.

Для global_investigation разрешены ТОЛЬКО operation:
- inspect_scene — осмотр места происшествия, пожарной лестницы, входа.
- identify_people — установить, кто находился в квартире / круг присутствовавших.
- locate_witnesses — разыскать соседей, свидетелей, очевидцев.
- interview_occupants — опросить всех жильцов квартиры.
- interview_daughters — опросить обеих дочерей.
- forensic_ballistics — исследовать пулю, калибр, баллистическое соответствие оружию.
- forensic_trajectory — восстановить направление/траекторию выстрела или положение стрелявшего по физическим данным.
- check_relationships — проверить отношения, конфликты, угрозы между уже названными людьми.
- check_alibi — проверить уже высказанную версию местонахождения/алиби, например сон в кресле.
- check_weapon — проверить владение, доступ или наличие оружия у установленного лица.
- autopsy — изучить вскрытие, ранение, причину смерти, судебно-медицинские материалы.
- compare_description — ТОЛЬКО если игрок сам явно просит сопоставить описание независимого свидетеля с установленными людьми. Никогда не выбирай это действие потому, что считаешь такое сравнение полезным.
- unsupported_forensic — игрок явно требует ДНК, отпечатки, камеры, телефоны/звонки или другую проверку, для которой нет отдельной разрешённой операции.
- none — никакой разрешённой операции явно не поручено.

Жёсткие правила:
1. Если активен собеседник и фраза обращена к нему во втором лице (вы/вам/вас/у вас), обычно это ask_current_witness, а operation="none".
2. Не превращай «кто врёт», «кто виноват», «что не сходится», «найдите противоречия» в global_investigation. Это работа игрока.
3. Для global_investigation выбирай только действие, которое сам игрок явно приказал выполнить. Не добавляй предварительные шаги и не строй цепочку действий.
4. compare_description нельзя выбирать автоматически из-за того, что такое сравнение кажется полезным.
5. confidence=high только когда intent и сущности прямо следуют из текста игрока.

Верни ТОЛЬКО JSON без markdown и объяснений:
{"intent":"ask_current_witness|switch_interview|call_expert|global_investigation|present_material|end_interview|unknown","target":"boyfriend|mother|older_daughter|younger_daughter|second_floor_witness|none","expert_type":"none|generic|ballistics|trajectory|medical|forensics","operation":"none|inspect_scene|identify_people|locate_witnesses|interview_occupants|interview_daughters|forensic_ballistics|forensic_trajectory|check_relationships|check_alibi|check_weapon|autopsy|compare_description|unsupported_forensic","confidence":"high|medium|low"}`;

function parseSemantic(raw:string){
  const text=raw.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"");
  try{
    const x=JSON.parse(text);
    const intent=clean(x?.intent,40),target=clean(x?.target,40)||"none",expert=clean(x?.expert_type,40)||"none",operation=clean(x?.operation,50)||"none",confidence=clean(x?.confidence,20);
    if(!INTENTS.has(intent))return null;
    if(target!=="none"&&!TARGETS.has(target))return null;
    if(!EXPERTS.has(expert)||!OPERATIONS.has(operation))return null;
    if(!["high","medium","low"].includes(confidence))return null;
    return {intent,target,expert_type:expert,operation,confidence};
  }catch{return null}
}
async function classify(req:Request,body:any){
  if(!OPENAI_API_KEY)return null;
  const command=clean(body?.command,900);if(!semanticCandidate(command))return null;
  const session=clean(body?.session_id,96),visitor=clean(body?.visitor_id,128);
  const claim=await claimTurn(req,session,visitor);if(!claim)return null;
  const claimId=clean(claim?.claim_id,80);
  try{
    const known=completedSet(body?.completed);
    const input=`Текущий собеседник: ${clean(body?.focus,40)||"none"}\nУстановлен круг жильцов: ${known.has("people")?"да":"нет"}\nУстановлен сосед со второго этажа: ${known.has("witnessLocated")?"да":"нет"}\nФраза игрока: ${command}`;
    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{authorization:`Bearer ${OPENAI_API_KEY}`,"content-type":"application/json"},
      body:JSON.stringify({model:MODEL,instructions:SEMANTIC_INSTRUCTIONS,input,store:false,max_output_tokens:150,reasoning:{effort:"none"},text:{verbosity:"low"}})
    });
    if(!r.ok){await releaseTurn(claimId);return null}
    const data=await r.json();
    const reply=clean(data.output_text||data.output?.flatMap((o:any)=>o.content||[]).find((c:any)=>c.type==="output_text")?.text||"",900);
    const parsed=parseSemantic(reply);
    if(parsed)await completeTurn(claimId,data);else await releaseTurn(claimId);
    return parsed;
  }catch{await releaseTurn(claimId);return null}
}
function semanticPlan(body:any,s:any){
  if(!s)return null;
  const done=completedSet(body?.completed);
  if(s.intent==="switch_interview"){
    if(s.target==="none")return {operations:[{op:"clarify",note:"Уточните, кого именно из уже установленных людей вы хотите вызвать или допросить."}],mode:"semantic_entity_clarification",player_led:true,automatic_contradiction_detection:false};
    if(s.confidence!=="high")return null;
    const operations:any[]=[];
    if(["boyfriend","mother","older_daughter","younger_daughter"].includes(s.target)&&!done.has("people"))operations.push({op:"identify_people"});
    if(s.target==="second_floor_witness"&&!done.has("witnessLocated"))operations.push({op:"locate_witnesses"});
    operations.push({op:"start_interview",target:s.target});
    return {operations,mode:"semantic_entity_routing",target:s.target,player_led:true,automatic_contradiction_detection:false};
  }
  if(s.intent==="call_expert"&&s.confidence==="high"){
    if(s.expert_type==="ballistics")return {operations:[{op:"forensic_ballistics"}],mode:"semantic_expert_routing",expert_type:s.expert_type,player_led:true,automatic_contradiction_detection:false};
    if(s.expert_type==="trajectory")return {operations:[{op:"forensic_trajectory"}],mode:"semantic_expert_routing",expert_type:s.expert_type,player_led:true,automatic_contradiction_detection:false};
    if(s.expert_type==="medical")return {operations:[{op:"autopsy"}],mode:"semantic_expert_routing",expert_type:s.expert_type,player_led:true,automatic_contradiction_detection:false};
    return {operations:[{op:"clarify",note:"Уточните специализацию эксперта или конкретную проверку, которую вы хотите ему поручить."}],mode:"semantic_expert_clarification",expert_type:s.expert_type,player_led:true,automatic_contradiction_detection:false};
  }
  if(s.intent==="global_investigation"&&s.confidence==="high"&&s.operation!=="none"){
    const op:any={op:s.operation};
    if(s.operation==="unsupported_forensic")op.note=clean(body?.command,400);
    return {operations:[op],mode:"semantic_action_routing",operation:s.operation,player_led:true,automatic_contradiction_detection:false,automatic_evidence_ranking:false};
  }
  return null;
}
async function forward(req:Request,body:any,headers:Record<string,string>){
  const r=await fetch(V8,{method:"POST",headers:{authorization:req.headers.get("authorization")||"",apikey:req.headers.get("apikey")||"","content-type":"application/json",origin:req.headers.get("origin")||"https://mysterylogic.com"},body:JSON.stringify(body)});
  return new Response(await r.text(),{status:r.status,headers});
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin")||"";
  if(origin&&!ALLOWED_ORIGINS.has(origin))return new Response(JSON.stringify({error:"origin_not_allowed"}),{status:403,headers:{"content-type":"application/json"}});
  const headers=cors(origin||"https://mysterylogic.com");
  const json=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status,headers});
  if(req.method==="OPTIONS")return new Response("ok",{headers});
  if(!clientAuthorized(req))return json({error:"unauthorized_client"},401);
  if(req.method!=="POST")return json({error:"method_not_allowed"},405);
  let body:any;try{body=await req.json()}catch{return json({error:"invalid_json"},400)}

  if(clean(body?.action,30)==="status")return json({version:9,upstream:"ai-moreno-investigator-v8",semantic_entity_parser:true,semantic_action_parser:true,bounded_character_registry:true,bounded_expert_registry:true,bounded_operation_registry:true,solution_inference_forbidden:true,client_auth:"current-public-key+origin",player_leads_investigation:true,automatic_contradiction_detection:false,automatic_evidence_ranking:false,visual_contract:"unchanged"});

  if(clean(body?.action,30)==="plan"){
    const semantic=await classify(req,body);
    const direct=semanticPlan(body,semantic);
    if(direct)return json(direct);
  }
  return forward(req,body,headers);
});