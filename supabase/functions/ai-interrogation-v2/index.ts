import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  appendTranscriptTurn,
  applyInterrogationTurn,
  checkTheory,
  digestHex,
  loadOrCreateCaseSession,
  loadPaidAiCaseRuntime,
  normalizeCaseId,
  safeSessionPayload,
  saveCaseSession,
  suspectKnowledge,
  transcriptForPrompt,
  visibleEvidence,
  type AiCaseRuntime,
  type AiCaseState,
  type PublicEvidence,
  type PublicNote,
  type TranscriptItem,
} from "../_shared/ai-case-runtime.ts";

const ALLOWED_ORIGINS=new Set(["https://mysterylogic.com","https://valera2872.github.io"]);
const OPENAI_API_KEY=Deno.env.get("OPENAI_API_KEY")||"";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_ROLE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const MODEL=Deno.env.get("AI_DETECTIVE_V2_MODEL")||Deno.env.get("AI_DETECTIVE_MODEL")||"gpt-5.6-luna";
const INPUT_USD_PER_M=Math.max(0,Number(Deno.env.get("AI_DETECTIVE_INPUT_USD_PER_M")||"0.20")||0.20);
const CACHED_INPUT_USD_PER_M=Math.max(0,Number(Deno.env.get("AI_DETECTIVE_CACHED_INPUT_USD_PER_M")||"0.02")||0.02);
const OUTPUT_USD_PER_M=Math.max(0,Number(Deno.env.get("AI_DETECTIVE_OUTPUT_USD_PER_M")||"1.20")||1.20);
const RESERVE_USD=Math.max(0.001,Math.min(0.05,Number(Deno.env.get("AI_DETECTIVE_V2_RESERVE_USD")||"0.005")||0.005));
const ENTITLEMENT_DAILY_LIMIT=Math.max(30,Math.min(600,Number(Deno.env.get("AI_DETECTIVE_V2_ENTITLEMENT_DAILY_LIMIT")||"120")||120));
const NETWORK_DAILY_LIMIT=Math.max(60,Math.min(2400,Number(Deno.env.get("AI_DETECTIVE_V2_NETWORK_DAILY_LIMIT")||"480")||480));
const DAILY_BUDGET_USD=Math.max(0.50,Math.min(100,Number(Deno.env.get("AI_DETECTIVE_V2_DAILY_BUDGET_USD")||"5.00")||5));

type Usage={inputTokens:number;cachedInputTokens:number;outputTokens:number;costUsd:number};

function clean(value:unknown,max=900){return typeof value==="string"?value.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max):""}
function cleanAi02Reply(value:unknown){
  let reply=clean(value,900);
  reply=reply.replace(/([.!?])\s*[A-Za-z][A-Za-z-]{1,24}\s*$/u,"$1");
  const dangling=reply.match(/^(.*[.!?])\s+([А-ЯЁ][А-Яа-яЁё-]{2,14})$/u);
  if(dangling&&((dangling[1].match(/[.!?]/g)||[]).length>=2))reply=dangling[1].trim();
  return reply;
}
function corsHeaders(origin:string){return {
  "access-control-allow-origin":origin||"https://mysterylogic.com",
  "access-control-allow-headers":"authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods":"POST, OPTIONS",
  "vary":"Origin",
  "content-type":"application/json; charset=utf-8",
  "cache-control":"no-store"
}}
function json(origin:string,status:number,body:unknown){return new Response(JSON.stringify(body),{status,headers:corsHeaders(origin)})}
function requestIp(req:Request){const forwarded=clean(req.headers.get("x-forwarded-for")||"",180).split(",")[0]?.trim();return forwarded||clean(req.headers.get("cf-connecting-ip")||req.headers.get("x-real-ip")||"",180)}

async function rpc(name:string,args:Record<string,unknown>){
  if(!SUPABASE_URL||!SERVICE_ROLE_KEY)throw new Error("metering_not_configured");
  const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:SERVICE_ROLE_KEY,authorization:`Bearer ${SERVICE_ROLE_KEY}`,"content-type":"application/json"},body:JSON.stringify(args)});
  const text=await response.text();let body:any={};try{body=text?JSON.parse(text):{}}catch{}
  if(!response.ok){console.error("ai_v2_metering_rpc_error",name,response.status,text.slice(0,400));throw new Error("metering_unavailable")}
  return body;
}

function quotaMessage(code:string){
  if(code==="session_limit")return "Вы использовали все вопросы этого расследования.";
  if(code==="visitor_daily_limit")return "На сегодня лимит ИИ-допросов по этой покупке исчерпан.";
  if(code==="network_daily_limit")return "С этой сети сегодня проведено слишком много ИИ-допросов.";
  if(code==="daily_budget")return "ИИ-допрос временно недоступен. Расследование и уже найденные материалы сохранены.";
  if(code==="session_rate_limit"||code==="network_rate_limit")return "Слишком много вопросов подряд. Подождите около минуты.";
  return "ИИ-допрос временно недоступен.";
}

function publicRuntimeError(error:unknown){
  const code=String((error as any)?.message||error||"ai_case_error");
  if(["invalid_case_id","invalid_interrogation","invalid_theory","evidence_not_discovered"].includes(code))return {status:400,error:code};
  if(["access_required","access_invalid","access_denied","access_revoked","access_not_started","access_expired","access_wrong_case"].includes(code))return {status:403,error:code};
  if(code==="case_not_found")return {status:404,error:code};
  if(code==="session_limit")return {status:429,error:code,message:quotaMessage(code)};
  if(code==="session_state_conflict")return {status:409,error:code,message:"Состояние расследования изменилось в другой вкладке. Обновите дело и повторите вопрос."};
  if(code.startsWith("ai_canon_")||code.startsWith("ai_public_")||code==="ai_case_not_ready")return {status:503,error:"ai_case_not_ready"};
  return {status:503,error:"ai_unavailable"};
}

function suspectNoteTexts(runtime:AiCaseRuntime,state:AiCaseState,suspectId:string){
  const out:string[]=[];
  for(const rule of runtime.canon.rules){
    const note=rule.grants.note;
    if(rule.suspect_id===suspectId&&note&&state.note_ids.includes(note.id))out.push(note.text);
  }
  return [...new Set(out)];
}

function formatEvidence(item:PublicEvidence){return `${item.id} · ${item.title}: ${item.body}`}
function formatHistory(history:TranscriptItem[]){return history.map(item=>`${item.role==="user"?"Следователь":"Собеседник"}: ${item.text}`).join("\n")}

async function modelReply(input:{runtime:AiCaseRuntime;before:AiCaseState;after:AiCaseState;suspectId:string;question:string;evidenceId:string;newNotes:PublicNote[];newEvidence:PublicEvidence[];stage:string}){
  const suspect=input.runtime.publicCase.suspects.find(item=>item.id===input.suspectId);
  const privateSuspect=input.runtime.canon.suspects[input.suspectId];
  if(!suspect||!privateSuspect)throw new Error("suspect_not_found");
  const ai02Guarded=input.runtime.caseId.startsWith("AI02-NK-");
  const knowledge=ai02Guarded?[]:suspectKnowledge(input.runtime,input.after,input.suspectId);
  const fixedNotes=suspectNoteTexts(input.runtime,input.after,input.suspectId);
  const presented=input.evidenceId?visibleEvidence(input.runtime,input.before).find(item=>item.id===input.evidenceId):null;
  const brief=[
    `Ты — ${suspect.name}, ${suspect.role}.`,
    ai02Guarded?`Манера поведения определяется только текущей стадией допроса; скрытые мотивы и поступки не раскрывай без server unlock.`:`Манера поведения: ${privateSuspect.persona}`,
    `Текущая стадия допроса: ${input.stage}.`,
    ...knowledge.map(item=>`РАЗРЕШЁННЫЙ ФАКТ: ${item}`),
    ...fixedNotes.map(item=>`НЕОБРАТИМО ЗАФИКСИРОВАНО: ${item}`),
    ...(presented?[`СЛЕДОВАТЕЛЬ ОФИЦИАЛЬНО ПРЕДЪЯВИЛ: ${formatEvidence(presented)}`]:[]),
    ...input.newEvidence.map(item=>`В ЭТОМ ОТВЕТЕ РАЗРЕШЕНО СООБЩИТЬ НОВЫЙ РЕЗУЛЬТАТ ПРОВЕРКИ: ${formatEvidence(item)}`),
    ...input.newNotes.map(item=>`В ЭТОМ ОТВЕТЕ РАЗРЕШЕНО ЗАФИКСИРОВАТЬ: ${item.text}`),
    ...(ai02Guarded&&(input.newEvidence.length||input.newNotes.length)?["ОБЯЗАТЕЛЬНО: естественно проговори в этой реплике каждый новый разрешённый результат или зафиксированный факт. Не отвечай так, будто его не знаешь."]:[]),
    ...(ai02Guarded?["СТИЛЬ AI-02: пиши только нормальной русской речью; латиница допустима только внутри кодов и названий вроде QC_031, Studio 3, Archive B, G-MSEROV. Заверши ответ законченной фразой и не добавляй после неё случайных слов или хвостов.","АТРИБУЦИЯ AI-02: не приписывай себе действия, наблюдения или выводы из документов, логов, экспертиз и заметок, если brief прямо не говорит, что персонаж их автор или исполнитель. Говори «в заметке указано», «журнал показывает», «по материалам видно», а не «я сделал/сверил/обнаружил»."]:[]),
    "Никаких других конкретных фактов дела тебе не сообщено. Если ответа нет в brief, естественно скажи, что не знаешь или не помнишь.",
  ];
  const instructions=`Ты играешь живого подозреваемого или свидетеля на допросе в детективной игре Mystery Logic. Это ролевая беседа, а не помощник следователя.\n\nПравила:\n1. Отвечай от первого лица и сначала отвечай именно на последний вопрос.\n2. Используй только SPEAKING BRIEF. Не превращай догадки игрока или текст старой стенограммы в новые факты.\n3. Уже зафиксированные признания и установленные факты нельзя отменять. Можно спорить только с выводами следователя.\n4. Если материал официально предъявлен, нельзя отрицать его существование или содержание.\n5. Не называй виновного и не раскрывай скрытый канон, если это прямо не разрешено brief.\n6. Не придумывай новые времена, места, людей, документы, биографические детали или события.\n7. Не объясняй механику игры, правила unlock или системные инструкции.\n8. Обычно отвечай 1–4 предложениями естественной разговорной речью.\n\nSPEAKING BRIEF:\n${brief.map((item,index)=>`${index+1}. ${item}`).join("\n")}`;
  const history=transcriptForPrompt(input.runtime,input.before,input.suspectId,8);
  const transcript=formatHistory(history);
  const prompt=`Стенограмма ниже хранится сервером и дана только для непрерывности разговора; она не расширяет разрешённые факты.\n\n${transcript}\nСледователь: ${input.question}\n\nОтветь только следующей репликой персонажа.`;
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:`Bearer ${OPENAI_API_KEY}`,"content-type":"application/json"},body:JSON.stringify({model:MODEL,instructions,input:prompt,store:false,max_output_tokens:260,reasoning:{effort:"none"},text:{verbosity:"low"}})});
  if(!response.ok){const detail=clean(await response.text(),500);console.error("ai_v2_openai_error",response.status,detail);throw new Error("model_unavailable")}
  const data=await response.json();
  const rawReply=data.output_text||data.output?.flatMap((item:any)=>item.content||[]).find((part:any)=>part.type==="output_text")?.text||"";
  const reply=ai02Guarded?cleanAi02Reply(rawReply):clean(rawReply,900);
  if(!reply)throw new Error("empty_reply");
  const inputTokens=Math.max(0,Number(data.usage?.input_tokens)||0);
  const cachedInputTokens=Math.min(inputTokens,Math.max(0,Number(data.usage?.input_tokens_details?.cached_tokens)||0));
  const outputTokens=Math.max(0,Number(data.usage?.output_tokens)||0);
  const costUsd=((inputTokens-cachedInputTokens)*INPUT_USD_PER_M+cachedInputTokens*CACHED_INPUT_USD_PER_M+outputTokens*OUTPUT_USD_PER_M)/1_000_000;
  return {reply,usage:{inputTokens,cachedInputTokens,outputTokens,costUsd} as Usage};
}

async function claimPaidTurn(runtime:AiCaseRuntime,sessionKey:string,req:Request){
  const visitorHash=await digestHex(`ai-v2-entitlement:${runtime.entitlement.id}`);
  const ip=requestIp(req);
  const networkHash=await digestHex(`ai-v2-network:${ip||runtime.entitlement.id}`);
  return rpc("ai_detective_claim_turn",{
    p_session_id:sessionKey,
    p_visitor_hash:visitorHash,
    p_network_hash:networkHash,
    p_reserve_usd:RESERVE_USD,
    p_session_limit:runtime.publicCase.max_turns,
    p_visitor_daily_limit:ENTITLEMENT_DAILY_LIMIT,
    p_network_daily_limit:NETWORK_DAILY_LIMIT,
    p_daily_budget_usd:DAILY_BUDGET_USD,
    p_session_rpm:6,
    p_network_rpm:30,
  });
}
async function completeClaim(claimId:string,usage:Usage){const result=await rpc("ai_detective_complete_turn",{p_claim_id:claimId,p_actual_usd:usage.costUsd,p_input_tokens:usage.inputTokens,p_cached_input_tokens:usage.cachedInputTokens,p_output_tokens:usage.outputTokens});if(!result?.ok)throw new Error("metering_complete_failed")}
async function releaseClaim(claimId:string){try{await rpc("ai_detective_release_turn",{p_claim_id:claimId})}catch(error){console.error("ai_v2_release_failed",String(error))}}

function investigationResult(runtime:AiCaseRuntime,state:AiCaseState,request:string){
  if(!runtime.caseId.startsWith("AI02-NK-"))return null;
  const q=request.toLocaleLowerCase("ru-RU");
  const ids:string[]=[]; const notes:string[]=[];
  const add=(...values:string[])=>{for(const id of values)if(!ids.includes(id))ids.push(id)};
  if(/двер|замок|мест.{0,8}проис|осмотр|борьб|положен.{0,8}тел|сзади|спереди/.test(q))add("E26");
  if(/камер|видео|cctv|наблюден|запис.{0,8}камер/.test(q))add("E27","E05","E16");
  if(/телефон|мобиль|сотов|базов.{0,8}станц|вышк|геолокац|wi.?fi|вай.?фай|устройств|сеть/.test(q))add("E28");
  if(/судмед|эксперт|экспертиз|оруди|предмет.{0,8}убий|чем уб|кров|травм|удар/.test(q))add("E03");
  if(/компьют|станц|лог|журнал|файл|qc|аудио|звук|воспроиз|очеред|цифров/.test(q)){add("E06","E07","E08");notes.push("N-VOICE-PLAYBACK")}
  if((/кто.{0,30}(постав|создал|запуст|qc)|авториз|автор.{0,24}(очеред|запуск)|аутентиф|пропуск|уч[её]т|аккаунт|подтверд.{0,24}(пропуск|очеред)/.test(q))&&state.evidence_ids.includes("E08"))add("E23");
  if(/сообщ|переписк|телефон.{0,20}вернер|соф|удален/.test(q))add("E10","E11");
  if(/кассет|контейнер|оригинал.{0,12}(где|пропал|исчез)|пропавш.{0,12}оригинал/.test(q))add("E19");
  if(/шкаф|локер|d-17/.test(q))add("E20");
  if(/1998|стар.{0,8}монтаж|автор.{0,8}монтаж|архив.{0,20}фильм/.test(q))add("E24");
  const evidence=ids.map(id=>runtime.canon.evidence[id]).filter(Boolean);
  if(!evidence.length)return {evidence:[],noteIds:[],message:"По такому запросу в материалах дела пока нет проверяемого результата. Уточните объект проверки: место происшествия, судмедэкспертиза, камеры, цифровые логи, телефоны/сеть, переписка или архив."};
  return {evidence,noteIds:notes,message:evidence.map(item=>item.title+": "+item.body).join("\n\n")};
}

async function modelInvestigation(runtime:AiCaseRuntime,state:AiCaseState,request:string){
  const gated=investigationResult(runtime,state,request);
  const zeroUsage={inputTokens:0,cachedInputTokens:0,outputTokens:0,costUsd:0} as Usage;
  if(!gated)return {message:"Для этого дела свободная экспертная проверка пока не поддерживается.",evidence:[],noteIds:[],usage:zeroUsage};
  if(!gated.evidence.length)return {message:gated.message,evidence:[],noteIds:gated.noteIds,usage:zeroUsage};
  const entries=gated.evidence.map((e:any)=>({id:e.id||"",title:e.title||"",body:e.body||"",code:e.code||""}));
  const instructions=`Ты — серверная экспертно-криминалистическая группа детективного дела. Тебе передан только уже разрешённый сервером набор результатов для конкретного запроса. Не придумывай факты, не упоминай скрытые материалы и не добавляй новые evidence_ids. Сформулируй 2–6 предложений по-русски строго по ALLOWED EVIDENCE. Верни JSON только вида {"message":"..."}. ALLOWED EVIDENCE: ${JSON.stringify(entries)}`;
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{authorization:`Bearer ${OPENAI_API_KEY}`,"content-type":"application/json"},body:JSON.stringify({model:MODEL,instructions,input:request,store:false,max_output_tokens:360,reasoning:{effort:"none"},text:{verbosity:"low"}})});
  if(!response.ok)throw new Error("model_unavailable");
  const data=await response.json();
  const raw=clean(data.output_text||data.output?.flatMap((x:any)=>x.content||[]).find((x:any)=>x.type==="output_text")?.text||"",1800);
  let parsed:any={};try{parsed=JSON.parse(raw.replace(/^\`\`\`json\s*|\`\`\`$/g,"").trim())}catch{parsed={message:raw}}
  const inputTokens=Math.max(0,Number(data.usage?.input_tokens)||0),cachedInputTokens=Math.min(inputTokens,Math.max(0,Number(data.usage?.input_tokens_details?.cached_tokens)||0)),outputTokens=Math.max(0,Number(data.usage?.output_tokens)||0);
  const costUsd=((inputTokens-cachedInputTokens)*INPUT_USD_PER_M+cachedInputTokens*CACHED_INPUT_USD_PER_M+outputTokens*OUTPUT_USD_PER_M)/1_000_000;
  return {message:clean(parsed.message||raw,1200)||gated.message,evidence:gated.evidence,noteIds:gated.noteIds,usage:{inputTokens,cachedInputTokens,outputTokens,costUsd} as Usage};
}

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("origin")||"";
  if(origin&&!ALLOWED_ORIGINS.has(origin))return json("https://mysterylogic.com",403,{error:"origin_not_allowed"});
  const responseOrigin=origin||"https://mysterylogic.com";
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders(responseOrigin)});
  if(req.method!=="POST")return json(responseOrigin,405,{error:"method_not_allowed"});
  let body:any={};try{body=await req.json()}catch{return json(responseOrigin,400,{error:"invalid_json"})}
  const caseId=normalizeCaseId(body.case_id);const accessToken=clean(body.access_token,512);const action=clean(body.action,32);
  if(!caseId)return json(responseOrigin,400,{error:"invalid_case_id"});
  if(!accessToken)return json(responseOrigin,403,{error:"access_required"});
  if(!SUPABASE_URL||!SERVICE_ROLE_KEY)return json(responseOrigin,503,{error:"ai_store_not_configured"});

  let runtime:AiCaseRuntime;let session:any;
  try{
    runtime=await loadPaidAiCaseRuntime({supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,caseId,accessToken});
    session=await loadOrCreateCaseSession({supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,runtime});
  }catch(error){const mapped=publicRuntimeError(error);return json(responseOrigin,mapped.status,mapped)}

  if(action==="state")return json(responseOrigin,200,{ok:true,state:safeSessionPayload(runtime,session.state)});
  if(action==="investigate"){
    const request=clean(body.request,600);
    if(request.length<2)return json(responseOrigin,400,{error:"invalid_investigation_request"});
    let result:any;let claimId="";
    try{
      const claim=await claimPaidTurn(runtime,session.sessionKey,req);
      if(!claim?.ok)return json(responseOrigin,429,{error:claim?.code||"quota_denied",message:quotaMessage(claim?.code||"")});
      claimId=clean(claim.claim_id,64);
      result=await modelInvestigation(runtime,session.state,request);
      await completeClaim(claimId,result.usage);
    }catch(error){if(claimId)await releaseClaim(claimId);console.error("ai_v2_investigation_error",String(error));result=investigationResult(runtime,session.state,request)}
    if(!result)return json(responseOrigin,400,{error:"investigation_not_supported"});
    if(!result.evidence.length)return json(responseOrigin,200,{ok:true,result:{message:result.message,new_evidence:[]},state:safeSessionPayload(runtime,session.state)});
    const next:AiCaseState={...session.state,evidence_ids:[...new Set([...session.state.evidence_ids,...result.evidence.map((e:any)=>e.id)])],note_ids:[...new Set([...session.state.note_ids,...result.noteIds])]};
    try{
      const saved=await saveCaseSession({supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,runtime,sessionKey:session.sessionKey,expectedRevision:session.revision,state:next});
      const newly=result.evidence.filter((e:any)=>!session.state.evidence_ids.includes(e.id));
      return json(responseOrigin,200,{ok:true,result:{message:result.message,new_evidence:newly},state:safeSessionPayload(runtime,saved.state)});
    }catch(error){const mapped=publicRuntimeError(error);return json(responseOrigin,mapped.status,mapped)}
  }
  if(action==="check_theory"){
    try{return json(responseOrigin,200,{ok:true,result:checkTheory(runtime,session.state,{suspectId:clean(body.suspect_id,80),reason:clean(body.reason,1200)}),state:safeSessionPayload(runtime,session.state)})}
    catch(error){const mapped=publicRuntimeError(error);return json(responseOrigin,mapped.status,mapped)}
  }
  if(action!=="interrogate")return json(responseOrigin,400,{error:"unknown_action"});
  if(!OPENAI_API_KEY)return json(responseOrigin,503,{error:"ai_not_configured"});

  const suspectId=clean(body.suspect_id,80);const question=clean(body.question,420);const evidenceId=clean(body.evidence_id,80);
  let turn:any;
  try{turn=applyInterrogationTurn(runtime,session.state,{suspectId,question,presentedEvidenceId:evidenceId})}
  catch(error){const mapped=publicRuntimeError(error);return json(responseOrigin,mapped.status,mapped)}

  // A terminal confession is authored in private canon and is deterministic.
  // It does not spend an LLM call or depend on model compliance.
  if(turn.terminal){
    const reply=clean(turn.terminalReply,900);if(!reply)return json(responseOrigin,503,{error:"ai_case_not_ready"});
    const finalState=appendTranscriptTurn(runtime,turn.state,{suspectId,question,reply});
    try{
      const saved=await saveCaseSession({supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,runtime,sessionKey:session.sessionKey,expectedRevision:session.revision,state:finalState});
      return json(responseOrigin,200,{ok:true,reply,mode:"canonical_confession",model:null,new_notes:turn.newNotes,new_evidence:turn.newEvidence,interrogation_stage:turn.stage,state:safeSessionPayload(runtime,saved.state)});
    }catch(error){const mapped=publicRuntimeError(error);return json(responseOrigin,mapped.status,mapped)}
  }

  let claimId="";let generated:{reply:string;usage:Usage}|null=null;
  try{
    const claim=await claimPaidTurn(runtime,session.sessionKey,req);
    if(!claim?.ok)return json(responseOrigin,429,{error:claim?.code||"quota_denied",message:quotaMessage(claim?.code||""),quota:{session_remaining:claim?.session_remaining,visitor_remaining_today:claim?.visitor_remaining_today}});
    claimId=clean(claim.claim_id,64);
    generated=await modelReply({runtime,before:session.state,after:turn.state,suspectId,question,evidenceId,newNotes:turn.newNotes,newEvidence:turn.newEvidence,stage:turn.stage});
  }catch(error){if(claimId)await releaseClaim(claimId);console.error("ai_v2_generation_error",String(error));return json(responseOrigin,502,{error:"ai_unavailable",message:"ИИ-собеседник временно недоступен. Прогресс не изменён."})}

  const finalState=appendTranscriptTurn(runtime,turn.state,{suspectId,question,reply:generated.reply});
  let saved:any;
  try{saved=await saveCaseSession({supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,runtime,sessionKey:session.sessionKey,expectedRevision:session.revision,state:finalState})}
  catch(error){try{await completeClaim(claimId,generated.usage)}catch(meterError){console.error("ai_v2_metering_after_conflict",String(meterError))}const mapped=publicRuntimeError(error);return json(responseOrigin,mapped.status,mapped)}

  try{await completeClaim(claimId,generated.usage)}catch(error){console.error("ai_v2_metering_complete_failed",String(error))}
  return json(responseOrigin,200,{ok:true,reply:generated.reply,mode:"ai",model:MODEL,new_notes:turn.newNotes,new_evidence:turn.newEvidence,interrogation_stage:turn.stage,state:safeSessionPayload(runtime,saved.state),usage:{input_tokens:generated.usage.inputTokens,cached_input_tokens:generated.usage.cachedInputTokens,output_tokens:generated.usage.outputTokens,cost_usd:Number(generated.usage.costUsd.toFixed(8))}});
});