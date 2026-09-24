#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function argsOf(argv) {
  const out={};
  for(let i=0;i<argv.length;i++) if(argv[i].startsWith('--')) out[argv[i].slice(2)]=argv[++i];
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args.candidate || !args.dir) {
  console.error('Usage: node originality-gate.mjs --candidate <json> --dir <cases> [--taxonomy <json>] [--limit 5]');
  process.exit(2);
}
const limit=Math.max(1,Math.min(20,Number(args.limit||5)));
const defaultTaxonomy=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../docs/corpus/fingerprint-taxonomy-v0.1.json');
const taxonomyPath=args.taxonomy || defaultTaxonomy;
const taxonomy=JSON.parse(fs.readFileSync(taxonomyPath,'utf8'));
const aliasToCanonical=new Map();
for(const [canonical,aliases] of Object.entries(taxonomy.aliases||{})) {
  aliasToCanonical.set(canonical,canonical);
  for(const alias of aliases) aliasToCanonical.set(String(alias).toLowerCase(),canonical);
}

function pieces(raw) {
  const s=String(raw||'').toLowerCase().trim();
  if(!s) return [];
  return [s,...s.split(/[+|/]/g).map(x=>x.trim()).filter(Boolean)];
}
function canonicalSet(values) {
  const out=new Set();
  for(const value of Array.isArray(values)?values:[]) {
    for(const p of pieces(value)) out.add(aliasToCanonical.get(p)||p);
  }
  return out;
}
function overlap(a,b) {
  const A=canonicalSet(a), B=canonicalSet(b);
  const shared=[...A].filter(x=>B.has(x));
  const score=(A.size&&B.size)?shared.length/(A.size+B.size-shared.length):0;
  return {score:Number(score.toFixed(3)),shared};
}

const CORE=['mechanism_tags','evidence_topology','reversal_tags','decisive_proof_tags','signature_action_tags'];
const AUX=['incident_tags','setting_tags','motive_tags','character_topology'];
const candidate=JSON.parse(fs.readFileSync(args.candidate,'utf8'));
const cf=candidate.fingerprint||candidate;
const neighbors=[];

for(const name of fs.readdirSync(args.dir).filter(x=>x.endsWith('.json')).sort()) {
  const d=JSON.parse(fs.readFileSync(path.join(args.dir,name),'utf8'));
  if(d.schema_version!=='case_dna_v1') continue;
  const f=d.fingerprint||{};
  const dimensions={};
  for(const dim of [...CORE,...AUX]) dimensions[dim]=overlap(cf[dim],f[dim]);

  const strongCore=CORE.filter(dim=>dimensions[dim].score>=0.5);
  const anyCore=CORE.filter(dim=>dimensions[dim].shared.length>0);
  let risk='LOW';
  const reasons=[];

  if(
    strongCore.length>=3 ||
    (
      dimensions.mechanism_tags.score>=0.5 &&
      dimensions.decisive_proof_tags.score>=0.5 &&
      (dimensions.reversal_tags.score>=0.5 || dimensions.evidence_topology.score>=0.5)
    )
  ) {
    risk='CRITICAL';
    reasons.push('same structural package across multiple core dimensions');
  } else if(strongCore.length>=2) {
    risk='HIGH';
    reasons.push('two or more core dimensions strongly overlap');
  } else if(strongCore.length===1 && anyCore.length>=2) {
    risk='MEDIUM';
    reasons.push('one strong core overlap plus additional structural overlap');
  } else if(anyCore.length>=2) {
    risk='MEDIUM';
    reasons.push('multiple partial core overlaps');
  }

  if(dimensions.character_topology.score>=0.5 && dimensions.mechanism_tags.score>=0.5) {
    if(risk==='LOW') risk='MEDIUM';
    reasons.push('mechanism and character topology both overlap');
  }

  const weights={
    mechanism_tags:2,
    evidence_topology:1.7,
    reversal_tags:1.8,
    decisive_proof_tags:2,
    signature_action_tags:1.4,
    incident_tags:1,
    setting_tags:.6,
    motive_tags:.8,
    character_topology:1.2
  };
  let num=0,den=0;
  for(const [dim,w] of Object.entries(weights)) {
    if(canonicalSet(cf[dim]).size) {
      num+=dimensions[dim].score*w;
      den+=w;
    }
  }

  neighbors.push({
    case_id:d.case_id,
    title:d.title,
    source_type:d.source?.source_type,
    risk,
    reasons,
    diagnostic_score:Number((den?num/den:0).toFixed(3)),
    dimensions
  });
}

const order={CRITICAL:4,HIGH:3,MEDIUM:2,LOW:1};
neighbors.sort((a,b)=>
  order[b.risk]-order[a.risk] ||
  b.diagnostic_score-a.diagnostic_score ||
  a.case_id.localeCompare(b.case_id)
);
const top=neighbors.slice(0,limit);
const max=top[0]?.risk||'LOW';
const gateResult=max==='CRITICAL'
  ?'REWORK_REQUIRED'
  :max==='HIGH'
    ?'EDITORIAL_REVIEW'
    :max==='MEDIUM'
      ?'REVIEW_NEIGHBORS'
      :'PASS';

console.log(JSON.stringify({
  candidate:candidate.case_id||candidate.title||'candidate',
  taxonomy:taxonomy.version,
  gate:gateResult,
  max_neighbor_risk:max,
  note:'This gate detects structural-neighbor risk; it is not a plagiarism verdict and never replaces human editorial review.',
  neighbors:top
},null,2));
