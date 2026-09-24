#!/usr/bin/env node
import http from 'node:http';
import { URL } from 'node:url';

const port=Number(process.env.PORT||process.env.CORPUS_REVIEWER_PORT||8787);
const apiKey=process.env.OPENAI_API_KEY||'';
const model=process.env.OPENAI_REVIEWER_MODEL||'gpt-5.6-sol';
const apiBase=String(process.env.OPENAI_API_BASE||'https://api.openai.com/v1').replace(/\/$/,'');
const maxBody=Number(process.env.CORPUS_REVIEWER_MAX_BODY||2_000_000);

if(!apiKey){
  console.error('OPENAI_API_KEY is required');
  process.exit(2);
}

const REVIEW_SCHEMA={"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"https://mysterylogic.com/schemas/corpus-extraction-review-v1.schema.json","title":"Mystery Logic Corpus Extraction Review v1","type":"object","additionalProperties":false,"required":["schema_version","extraction_run_id","job_id","case_id","extractor_id","reviewer_id","reviewed_at","checks","verdict","issues"],"properties":{"schema_version":{"const":"corpus_extraction_review_v1"},"extraction_run_id":{"type":"string","minLength":3,"maxLength":240},"job_id":{"type":"string","minLength":3,"maxLength":220},"case_id":{"type":"string","minLength":3,"maxLength":180},"extractor_id":{"type":"string","minLength":2,"maxLength":240},"reviewer_id":{"type":"string","minLength":2,"maxLength":240},"reviewed_at":{"type":"string","minLength":8,"maxLength":80},"checks":{"type":"object","additionalProperties":false,"required":["rights_policy_match","critical_claims_supported","unknowns_preserved","hypotheses_grounded","no_raw_text_leakage","no_distinctive_plot_copy"],"properties":{"rights_policy_match":{"type":"boolean"},"critical_claims_supported":{"type":"boolean"},"unknowns_preserved":{"type":"boolean"},"hypotheses_grounded":{"type":"boolean"},"no_raw_text_leakage":{"type":"boolean"},"no_distinctive_plot_copy":{"type":"boolean"}}},"verdict":{"enum":["approved","needs_rework","rejected"]},"issues":{"type":"array","maxItems":100,"items":{"type":"object","additionalProperties":false,"required":["severity","code","message"],"properties":{"severity":{"enum":["info","warn","fail"]},"code":{"type":"string","minLength":2,"maxLength":100},"message":{"type":"string","minLength":2,"maxLength":2000},"case_dna_path":{"type":["string","null"],"maxLength":500},"source_locator":{"type":["string","null"],"maxLength":2000}}}},"notes":{"type":["string","null"],"maxLength":4000}}};

function collect(req){
  return new Promise((resolve,reject)=>{
    let size=0,body='';
    req.setEncoding('utf8');
    req.on('data',chunk=>{
      size+=Buffer.byteLength(chunk);
      if(size>maxBody){
        reject(Object.assign(new Error('request body too large'),{statusCode:413}));
        req.destroy();
        return;
      }
      body+=chunk;
    });
    req.on('end',()=>resolve(body));
    req.on('error',reject);
  });
}

function domainsFrom(contract){
  const values=[
    contract?.source_to_verify?.source_reference,
    contract?.source_to_verify?.rights_evidence_reference
  ].filter(Boolean);
  const out=[];
  for(const value of values){
    try{
      const host=new URL(value).hostname.toLowerCase();
      if(host && !out.includes(host)) out.push(host);
    }catch{}
  }
  return out.slice(0,10);
}

function responseText(payload){
  if(typeof payload?.output_text==='string' && payload.output_text.trim()) return payload.output_text;
  for(const item of payload?.output||[]){
    if(item?.type!=='message') continue;
    for(const c of item?.content||[]){
      if((c?.type==='output_text'||c?.type==='text') && typeof c.text==='string') return c.text;
    }
  }
  return '';
}

function json(res,status,obj){
  const body=JSON.stringify(obj);
  res.writeHead(status,{
    'content-type':'application/json; charset=utf-8',
    'content-length':Buffer.byteLength(body),
    'cache-control':'no-store'
  });
  res.end(body);
}

const server=http.createServer(async(req,res)=>{
  try{
    if(req.method==='GET' && req.url==='/health'){
      return json(res,200,{ok:true,provider:'openai-responses',model});
    }
    if(req.method!=='POST'){
      return json(res,405,{error:'method_not_allowed'});
    }

    const raw=await collect(req);
    let request;
    try{ request=JSON.parse(raw); }
    catch{ return json(res,400,{error:'invalid_json'}); }

    if(request?.schema_version!=='corpus_review_provider_request_v1'){
      return json(res,400,{error:'invalid_request_schema'});
    }
    const contract=request.review_contract;
    if(!contract?.reviewer_id || !contract?.extraction_result || !contract?.source_to_verify){
      return json(res,400,{error:'incomplete_review_contract'});
    }
    if(contract.reviewer_id===contract.extraction_result.extractor_id){
      return json(res,400,{error:'reviewer_must_differ_from_extractor'});
    }

    const domains=domainsFrom(contract);
    const tools=domains.length
      ? [{type:'web_search',external_web_access:true,filters:{allowed_domains:domains},search_context_size:'medium'}]
      : [{type:'web_search',external_web_access:true,search_context_size:'medium'}];

    const system=[
      'You are an independent forensic reviewer of a structured research extraction.',
      'You did not perform the extraction and have no memory or context outside this request.',
      'Use web search to independently verify the cited official/public source and rights evidence.',
      'Do not trust extractor notes unless the underlying source supports them.',
      'Do not rewrite or improve the Case DNA. Review it.',
      'If the source cannot be opened or a critical locator cannot be verified, do not approve critical_claims_supported.',
      'Preserve uncertainty. Reconstructed analytical hypotheses must not be treated as historical fact.',
      'For metadata_and_analysis_only sources, reject retained source prose or large excerpts.',
      'Return only the requested structured review object.'
    ].join(' ');

    const user=JSON.stringify({
      reviewer_id:contract.reviewer_id,
      source_to_verify:contract.source_to_verify,
      review_rules:contract.review_rules,
      required_checks:contract.required_checks,
      extraction_result:contract.extraction_result
    });

    const body={
      model,
      reasoning:{effort:'high'},
      tools,
      tool_choice:'required',
      input:[
        {role:'system',content:system},
        {role:'user',content:user}
      ],
      text:{
        format:{
          type:'json_schema',
          name:'corpus_extraction_review_v1',
          strict:true,
          schema:REVIEW_SCHEMA
        }
      }
    };

    const upstream=await fetch(`${apiBase}/responses`,{
      method:'POST',
      headers:{
        'content-type':'application/json',
        'authorization':`Bearer ${apiKey}`
      },
      body:JSON.stringify(body)
    });

    const payload=await upstream.json().catch(()=>null);
    if(!upstream.ok){
      return json(res,502,{
        error:'openai_error',
        status:upstream.status,
        detail:payload?.error?.message||'Responses API request failed'
      });
    }

    const text=responseText(payload);
    if(!text){
      return json(res,502,{error:'missing_structured_output'});
    }
    let review;
    try{ review=JSON.parse(text); }
    catch{
      return json(res,502,{error:'invalid_structured_output'});
    }

    if(review.reviewer_id!==contract.reviewer_id){
      return json(res,502,{error:'reviewer_identity_mismatch'});
    }
    json(res,200,{review});
  }catch(error){
    json(res,error?.statusCode||500,{error:'reviewer_adapter_error',detail:String(error?.message||error)});
  }
});

server.listen(port,'127.0.0.1',()=>{
  console.log(JSON.stringify({status:'listening',host:'127.0.0.1',port,model}));
});
