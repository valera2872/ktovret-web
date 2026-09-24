#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function argsOf(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--')) continue;
    const k=argv[i].slice(2),n=argv[i+1];
    if(!n||n.startsWith('--')) out[k]=true;
    else {out[k]=n;i++;}
  }
  return out;
}
function runJson(script,args){
  const r=spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
  if(r.status!==0) throw new Error((r.stderr||r.stdout||'child process failed').trim());
  return JSON.parse(r.stdout);
}
function sourceIdentity(d){
  const ref=String(d?.source?.source_reference||'').trim().toLowerCase()
    .replace(/^http:/,'https:')
    .replace(/\/$/,'');
  if(ref) return 'ref:'+ref;
  const provenance=String(d?.source?.provenance||'').trim().toLowerCase();
  const creator=String(d?.source?.creator||'').trim().toLowerCase();
  const title=String(d?.title||'').trim().toLowerCase();
  return 'fallback:'+creator+'|'+title+'|'+provenance;
}
function readCases(src){
  const out=[];
  for(const name of fs.readdirSync(src).filter(x=>x.endsWith('.json')).sort()){
    const file=path.join(src,name);
    let data;
    try{data=JSON.parse(fs.readFileSync(file,'utf8'));}catch{continue}
    if(data.schema_version!=='case_dna_v1') continue;
    out.push({name,file,data,identity:sourceIdentity(data)});
  }
  return out;
}
function copyCases(cases,dst,prefix){
  const copied=[];
  for(const c of cases){
    const to=path.join(dst,`${prefix}-${c.name}`);
    fs.copyFileSync(c.file,to);
    copied.push({case_id:c.data.case_id,file:to,identity:c.identity,data:c.data});
  }
  return copied;
}
function diversity(results){
  const types=new Set(results.map(x=>x.source_type||'unknown'));
  const dims=new Set();
  for(const r of results) for(const d of (r.matched_dimensions||[])) dims.add(d);
  return {source_types:[...types].sort(),source_type_count:types.size,matched_dimensions:[...dims].sort(),matched_dimension_count:dims.size};
}

const args=argsOf(process.argv.slice(2));
if(!args.base || !args.overlay || !args.queries){
  console.error('Usage: node shadow-retrieval-regression.mjs --base <approved-case-dir> --overlay <needs-review-case-dir> --queries <queries.json> [--limit 8] [--out report.json]');
  process.exit(2);
}
const base=path.resolve(args.base),overlay=path.resolve(args.overlay);
const queriesDoc=JSON.parse(fs.readFileSync(args.queries,'utf8'));
const queries=Array.isArray(queriesDoc)?queriesDoc:(queriesDoc.queries||[]);
const limit=Math.max(1,Math.min(30,Number(args.limit||8)));
if(!queries.length){console.error('queries must be a non-empty array');process.exit(2)}

const here=path.dirname(new URL(import.meta.url).pathname);
const retriever=path.join(here,'retrieve-patterns.mjs');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-shadow-regression-'));
const baseOnly=path.join(tmp,'base'),merged=path.join(tmp,'merged');
fs.mkdirSync(baseOnly);fs.mkdirSync(merged);

const baseRaw=readCases(base),overlayRaw=readCases(overlay);
if(!baseRaw.length){console.error('base corpus contains no case_dna_v1 JSON records');process.exit(1)}
if(!overlayRaw.length){console.error('overlay contains no case_dna_v1 JSON records');process.exit(1)}

const baseCases=copyCases(baseRaw,baseOnly,'base');
const mergedBase=copyCases(baseRaw,merged,'base');
const mergedByIdentity=new Map(mergedBase.map(x=>[x.identity,x]));
const replacements=[];
for(const c of overlayRaw){
  const legacy=mergedByIdentity.get(c.identity);
  if(legacy){
    try{fs.unlinkSync(legacy.file)}catch{}
    replacements.push({
      source_identity:c.identity,
      base_case_id:legacy.case_id,
      overlay_case_id:c.data.case_id,
      source_reference:c.data?.source?.source_reference||legacy.data?.source?.source_reference||null
    });
  }
  const copied=copyCases([c],merged,'overlay')[0];
  mergedByIdentity.set(c.identity,copied);
}
const overlayCases=overlayRaw.map(c=>({case_id:c.data.case_id,identity:c.identity}));
const overlayIds=new Set(overlayCases.map(x=>x.case_id));

const reports=[];
for(const q of queries){
  const query=typeof q==='string'?q:q.query;
  const queryId=typeof q==='string'?query:(q.id||query);
  if(!query) continue;
  const before=runJson(retriever,['--dir',baseOnly,'--query',query,'--limit',String(limit)]);
  const after=runJson(retriever,['--dir',merged,'--query',query,'--limit',String(limit)]);
  const overlayHits=(after.results||[]).filter(x=>overlayIds.has(x.case_id));
  reports.push({
    id:queryId,query,
    before:{count:before.count,top_case_ids:(before.results||[]).map(x=>x.case_id),diversity:diversity(before.results||[])},
    shadow_after:{
      count:after.count,
      top_case_ids:(after.results||[]).map(x=>x.case_id),
      diversity:diversity(after.results||[]),
      overlay_hits:overlayHits.map(x=>({case_id:x.case_id,title:x.title,score:x.score,matched_dimensions:x.matched_dimensions,matched_terms:x.matched_terms}))
    },
    delta:{
      overlay_hit_count:overlayHits.length,
      source_type_diversity:(diversity(after.results||[]).source_type_count-diversity(before.results||[]).source_type_count),
      matched_dimension_diversity:(diversity(after.results||[]).matched_dimension_count-diversity(before.results||[]).matched_dimension_count)
    }
  });
}

const overlayHitQueries=reports.filter(x=>x.delta.overlay_hit_count>0).length;
const output={
  schema_version:'corpus_shadow_retrieval_regression_v1',
  mode:'shadow_only',
  approved_corpus_modified:false,
  duplicate_source_policy:'overlay_replaces_same_source_legacy_in_temporary_view',
  overlay_status_required:'needs_review_or_candidate',
  base_case_count:baseCases.length,
  overlay_case_count:overlayCases.length,
  same_source_replacement_count:replacements.length,
  same_source_replacements:replacements,
  query_count:reports.length,
  summary:{
    queries_with_overlay_hits:overlayHitQueries,
    overlay_hit_rate:Number((reports.length?overlayHitQueries/reports.length:0).toFixed(3)),
    queries_with_source_type_diversity_gain:reports.filter(x=>x.delta.source_type_diversity>0).length,
    queries_with_dimension_diversity_gain:reports.filter(x=>x.delta.matched_dimension_diversity>0).length
  },
  queries:reports,
  note:'Shadow regression is diagnostic only. Same-source overlay records replace the legacy copy in the temporary merged view to avoid double-counting one source. Overlay cases remain unapproved.'
};
const text=JSON.stringify(output,null,2)+'\n';
if(args.out) fs.writeFileSync(args.out,text); else process.stdout.write(text);
