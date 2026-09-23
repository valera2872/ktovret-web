#!/usr/bin/env node
import fs from 'node:fs';

function argsOf(argv) {
  const out={};
  for(let i=0;i<argv.length;i++) {
    if(!argv[i].startsWith('--')) continue;
    const k=argv[i].slice(2), n=argv[i+1];
    if(!n || n.startsWith('--')) out[k]=true;
    else {out[k]=n;i++;}
  }
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args.queue) {
  console.error('Usage: node build-ingestion-plan.mjs --queue <source-queue.json> [--limit 50] [--out plan.json]');
  process.exit(2);
}
const q=JSON.parse(fs.readFileSync(args.queue,'utf8'));
const limit=Math.max(1,Math.min(1000,Number(args.limit||50)));
const prio={P0:0,P1:1,P2:2,P3:3};

const eligible=(q.items||[])
  .filter(x=>['rights_verified','queued'].includes(x.status))
  .filter(x=>x.rights_status!=='unknown' && x.ingestion_policy!=='prohibited_pending_review')
  .sort((a,b)=>(prio[a.priority]??9)-(prio[b.priority]??9) || a.source_family.localeCompare(b.source_family) || a.title.localeCompare(b.title));

const selected=[];
const familyCounts=new Map();
// Diversity-aware round-robin: avoid allowing one source family to dominate early plan.
while(selected.length<limit && selected.length<eligible.length) {
  let best=null;
  for(const x of eligible) {
    if(selected.includes(x)) continue;
    const c=familyCounts.get(x.source_family)||0;
    if(!best || c<(familyCounts.get(best.source_family)||0) ||
      (c===(familyCounts.get(best.source_family)||0) && (prio[x.priority]??9)<(prio[best.priority]??9))) best=x;
  }
  if(!best) break;
  selected.push(best);
  familyCounts.set(best.source_family,(familyCounts.get(best.source_family)||0)+1);
}

const plan={
  schema_version:'corpus_ingestion_plan_v1',
  queue_id:q.queue_id,
  generated_at:new Date().toISOString(),
  requested_limit:limit,
  selected_count:selected.length,
  blocked_count:(q.items||[]).filter(x=>x.ingestion_policy==='prohibited_pending_review').length,
  items:selected.map(x=>({
    source_id:x.source_id,
    title:x.title,
    source_family:x.source_family,
    source_type:x.source_type,
    source_reference:x.source_reference,
    source_locator:x.source_locator||null,
    rights_status:x.rights_status,
    ingestion_policy:x.ingestion_policy,
    raw_text_retained:x.raw_text_retained,
    priority:x.priority,
    target_pattern_tags:x.target_pattern_tags||[]
  })),
  family_counts:Object.fromEntries(familyCounts)
};
const text=JSON.stringify(plan,null,2)+'\n';
if(args.out) fs.writeFileSync(args.out,text);
else process.stdout.write(text);
