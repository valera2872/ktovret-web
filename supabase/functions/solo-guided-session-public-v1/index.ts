import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  createSoloSession,
  deriveSoloSessionKey,
  loadSoloRuntime,
  loadSoloSessionByKey,
  normalizeStoredSoloState,
  saveSoloSession,
} from 'https://raw.githubusercontent.com/valera2872/ktovret-web/ccde6123717268f4d023da89c7f491726332154f/supabase/functions/_shared/solo-engine-v2-runtime.ts';
import { processAuthorizedSoloAction } from 'https://raw.githubusercontent.com/valera2872/ktovret-web/ccde6123717268f4d023da89c7f491726332154f/supabase/functions/_shared/solo-engine-v2-controller.ts';
import { safeSoloClientPayload } from 'https://raw.githubusercontent.com/valera2872/ktovret-web/ccde6123717268f4d023da89c7f491726332154f/supabase/functions/_shared/solo-engine-v2-view.ts';

const SUPABASE_URL=Deno.env.get('SUPABASE_URL')||'';
const SERVICE_ROLE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const CASE_ID='ML0512_PREVIEW_CB6B46A0DADA7B5188CC65DEC92B0642';
const ALLOWED_ORIGINS=new Set(['https://mysterylogic.com','https://www.mysterylogic.com','https://valera2872.github.io','https://rawcdn.githack.com']);
const MUTATING=new Set(['OPEN_EVIDENCE','OPEN_EVIDENCE_SECTION','PRESENT_EVIDENCE','ATTEMPT_DEDUCTION','ADD_HYPOTHESIS','TRIGGER_INTERACTION','USE_HINT','SUBMIT_RECONSTRUCTION']);

function clean(v:unknown,max=600){return typeof v==='string'?v.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max):'';}
function record(v:unknown):Record<string,any>{return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};}
function cors(origin:string){return {'access-control-allow-origin':origin||'https://mysterylogic.com','access-control-allow-headers':'authorization, content-type','access-control-allow-methods':'POST, OPTIONS','content-type':'application/json; charset=utf-8','cache-control':'private, no-store, max-age=0','vary':'Origin'};}
function json(origin:string,status:number,body:unknown){return new Response(JSON.stringify(body),{status,headers:cors(origin)});}
function errorStatus(code:string){
  if(['invalid_request','solo_session_token_invalid','solo_hypothesis_invalid','solo_hint_invalid'].includes(code))return 400;
  if(['solo_evidence_access_denied','solo_evidence_section_access_denied','solo_present_invalid','solo_deduction_access_denied','solo_interaction_unavailable','solo_reconstruction_access_denied','solo_case_completed'].includes(code))return 403;
  if(code==='solo_session_not_found')return 404;
  if(['solo_session_state_conflict','solo_deduction_already_confirmed'].includes(code))return 409;
  if(['solo_case_not_ready','solo_canon_rotation_required'].includes(code))return 423;
  if(['solo_store_not_configured','solo_store_unavailable'].includes(code))return 503;
  return 400;
}

Deno.serve(async(req:Request)=>{
  const origin=(req.headers.get('origin')||'').replace(/\/$/,'');
  if(origin&&!ALLOWED_ORIGINS.has(origin))return new Response(JSON.stringify({error:'origin_not_allowed'}),{status:403,headers:{'content-type':'application/json'}});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=='POST')return json(origin,405,{error:'method_not_allowed'});
  if(!SUPABASE_URL||!SERVICE_ROLE_KEY)return json(origin,503,{error:'solo_store_not_configured'});

  let body:Record<string,any>={};
  try{body=record(await req.json());}catch{return json(origin,400,{error:'invalid_request'});}
  const actionType=clean(body.action,80).toUpperCase()||'SNAPSHOT';
  const caseId=clean(body.case_id,160);
  const rawSessionToken=clean(body.session_token,512);
  if(caseId!==CASE_ID)return json(origin,404,{error:'case_not_found'});

  try{
    const runtime=await loadSoloRuntime({supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,caseId});
    const accessMode='admin' as const;
    let row:any=null;
    let sessionKey='';
    let issuedSessionToken:string|null=null;

    if(rawSessionToken){
      sessionKey=await deriveSoloSessionKey(rawSessionToken);
      row=await loadSoloSessionByKey({supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,runtime,sessionKey});
      if(!row)throw new Error('solo_session_not_found');
    }

    if(!row){
      if(!['START','SNAPSHOT'].includes(actionType))throw new Error('solo_session_not_found');
      const created=await createSoloSession({supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,runtime,entitlement:null});
      const fullState=normalizeStoredSoloState(created.state,runtime,accessMode);
      const saved=await saveSoloSession({supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,runtime,sessionKey:created.sessionKey,expectedRevision:created.revision,state:fullState});
      row={session_key:created.sessionKey,case_id:runtime.caseId,entitlement_id:null,state:fullState,revision:saved.revision};
      sessionKey=created.sessionKey;
      issuedSessionToken=created.rawToken;
    }

    const revision=Number.isInteger(Number(row.revision))?Number(row.revision):0;
    const normalized=normalizeStoredSoloState(row.state,runtime,accessMode);
    const action={...body,type:actionType};
    const nextState=processAuthorizedSoloAction(runtime,normalized,action,accessMode);

    let nextRevision=revision;
    if(MUTATING.has(actionType)&&JSON.stringify(nextState)!==JSON.stringify(normalized)){
      const saved=await saveSoloSession({supabaseUrl:SUPABASE_URL,serviceRole:SERVICE_ROLE_KEY,runtime,sessionKey,expectedRevision:revision,state:nextState});
      nextRevision=saved.revision;
    }

    return json(origin,200,{
      ...safeSoloClientPayload(runtime,nextState,nextRevision,accessMode),
      sessionToken:issuedSessionToken,
      resume:{viaSessionToken:Boolean(rawSessionToken||issuedSessionToken),viaEntitlement:false,publicPreview:true},
    });
  }catch(error){
    const code=clean(error instanceof Error?error.message:error,120)||'solo_request_failed';
    console.error('ml0512_public_session_error',code);
    return json(origin,errorStatus(code),{error:code});
  }
});
