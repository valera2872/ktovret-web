#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function argsOf(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[++i];
  }
  return out;
}
const args = argsOf(process.argv.slice(2));
if (!args.candidate || !args.dir) {
  console.error('Usage: node compare-fingerprints.mjs --candidate <json> --dir <cases> [--limit 8]');
  process.exit(2);
}
const limit = Math.max(1, Math.min(50, Number(args.limit || 8)));
const candidate = JSON.parse(fs.readFileSync(args.candidate, 'utf8'));
const cf = candidate.fingerprint || candidate;

const DIMS = [
  ['incident_tags', 1.0],
  ['setting_tags', 0.6],
  ['mechanism_tags', 2.0],
  ['motive_tags', 0.8],
  ['character_topology', 1.2],
  ['evidence_topology', 1.7],
  ['reversal_tags', 1.8],
  ['decisive_proof_tags', 2.0],
  ['signature_action_tags', 1.4]
];
function set(v) {
  return new Set((Array.isArray(v) ? v : []).map(x => String(x).toLowerCase()));
}
function jaccard(a,b) {
  const A=set(a), B=set(b);
  if (!A.size || !B.size) return 0;
  let inter=0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

const rows=[];
for (const name of fs.readdirSync(args.dir).filter(x=>x.endsWith('.json')).sort()) {
  const d=JSON.parse(fs.readFileSync(path.join(args.dir,name),'utf8'));
  if (d.schema_version !== 'case_dna_v1') continue;
  const f=d.fingerprint || {};
  let weighted=0, totalWeight=0;
  const dimensions={};
  for (const [dim,w] of DIMS) {
    const score=jaccard(cf[dim],f[dim]);
    dimensions[dim]={
      score:Number(score.toFixed(3)),
      shared:[...set(cf[dim])].filter(x=>set(f[dim]).has(x))
    };
    if ((cf[dim] || []).length) {
      weighted += score*w;
      totalWeight += w;
    }
  }
  const structural=totalWeight ? weighted/totalWeight : 0;
  rows.push({
    case_id:d.case_id,
    title:d.title,
    source_type:d.source?.source_type,
    structural_similarity:Number(structural.toFixed(3)),
    dimensions
  });
}
rows.sort((a,b)=>b.structural_similarity-a.structural_similarity || a.case_id.localeCompare(b.case_id));
console.log(JSON.stringify({
  candidate:candidate.case_id || candidate.title || 'candidate',
  note:'Similarity is diagnostic only; editorial decisions must inspect dimensions.',
  results:rows.slice(0,limit)
},null,2));
