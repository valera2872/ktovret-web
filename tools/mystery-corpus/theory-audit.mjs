#!/usr/bin/env node
import fs from 'node:fs';

function argsOf(argv) {
  const out={};
  for(let i=0;i<argv.length;i++) {
    if(argv[i].startsWith('--')) {
      const key=argv[i].slice(2);
      const next=argv[i+1];
      if(!next || next.startsWith('--')) out[key]=true;
      else {out[key]=next;i++;}
    }
  }
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args.case) {
  console.error('Usage: node theory-audit.mjs --case <case-dna.json> [--require-canonical]');
  process.exit(2);
}

const d=JSON.parse(fs.readFileSync(args.case,'utf8'));
const evidence=d.evidence||[];
const hypotheses=d.hypotheses||[];
const byE=new Map(evidence.map(e=>[e.id,e]));
const reliability={high:3,medium:2,low:1,contested:.5,unknown:0};
const canonical=hypotheses.filter(h=>h.canonical===true);
const issues=[];

if(d.reveal?.new_answer_changing_fact===true) {
  issues.push({
    severity:'FAIL',
    code:'NEW_ANSWER_CHANGING_FACT',
    message:'Reveal introduces an answer-changing fact unavailable before reveal.'
  });
}
if(args['require-canonical']) {
  if(canonical.length===0) issues.push({
    severity:'FAIL',
    code:'NO_CANONICAL_HYPOTHESIS',
    message:'Mystery Logic case requires one canonical hypothesis.'
  });
  if(canonical.length>1) issues.push({
    severity:'FAIL',
    code:'MULTIPLE_CANONICAL_HYPOTHESES',
    message:'More than one hypothesis is marked canonical.'
  });
} else if(canonical.length===0) {
  issues.push({
    severity:'UNKNOWN',
    code:'NO_CANONICAL_HYPOTHESIS',
    message:'No canonical hypothesis; acceptable for unresolved/reference cases, but final discrimination cannot be asserted.'
  });
}

function refsFor(h,kind) {
  const explicit=new Set(kind==='support'?(h.supporting_evidence||[]):(h.contradicting_evidence||[]));
  for(const e of evidence) {
    const arr=kind==='support'?(e.supports||[]):(e.weakens||[]);
    if(arr.includes(h.id)) explicit.add(e.id);
  }
  return [...explicit].filter(id=>byE.has(id));
}
function weight(ids) {
  return ids.reduce((a,id)=>a+(reliability[byE.get(id)?.reliability]??0),0);
}
function atStage(ids,stage) {
  return ids.filter(id=>(byE.get(id)?.availability_stage??0)<=stage);
}

const maxStage=Math.max(0,...evidence.map(e=>Number(e.availability_stage||0)));
const stageMatrix=[];
for(let stage=0;stage<=maxStage;stage++) {
  const row=[];
  for(const h of hypotheses) {
    const support=atStage(refsFor(h,'support'),stage);
    const contradictions=atStage(refsFor(h,'contradict'),stage);
    row.push({
      hypothesis_id:h.id,
      canonical:h.canonical===true,
      support,
      contradictions,
      net:Number((weight(support)-weight(contradictions)).toFixed(2))
    });
  }
  stageMatrix.push({stage,hypotheses:row});
}

let proofSet=[];
let finalDiscrimination='UNKNOWN';

if(canonical.length===1) {
  const c=canonical[0];
  const cSupport=refsFor(c,'support');
  const supportTypes=new Set(cSupport.map(id=>byE.get(id)?.type).filter(Boolean));

  if(cSupport.length===0) issues.push({
    severity:'FAIL',
    code:'CANONICAL_UNSUPPORTED',
    message:'Canonical hypothesis has no supporting evidence.'
  });
  if(supportTypes.size<2) issues.push({
    severity:'WARN',
    code:'LOW_PROOF_REDUNDANCY',
    message:'Canonical hypothesis has fewer than two independent evidence types.',
    evidence:cSupport
  });

  const alternatives=hypotheses.filter(h=>h.id!==c.id);
  const unresolved=[];
  for(const h of alternatives) {
    const contradictions=refsFor(h,'contradict');
    if(contradictions.length===0) {
      unresolved.push(h.id);
      issues.push({
        severity:'FAIL',
        code:'UNRESOLVED_ALTERNATIVE',
        hypothesis_id:h.id,
        message:'No final player-visible evidence explicitly weakens this alternative.'
      });
    }
  }

  // Approximate minimum discriminating set via greedy set cover.
  const remaining=new Set(alternatives.map(h=>h.id));
  while(remaining.size) {
    let best=null;
    let bestCover=[];
    for(const e of evidence) {
      const cover=(e.weakens||[]).filter(id=>remaining.has(id));
      if(
        cover.length>bestCover.length ||
        (
          cover.length===bestCover.length &&
          cover.length &&
          (reliability[e.reliability]||0)>(reliability[best?.reliability]||0)
        )
      ) {
        best=e;
        bestCover=cover;
      }
    }
    if(!best || bestCover.length===0) break;
    proofSet.push({
      evidence_id:best.id,
      weakens:bestCover,
      reliability:best.reliability
    });
    for(const id of bestCover) remaining.delete(id);
  }

  // Ensure the set also contains direct positive support for canon.
  if(
    cSupport.length &&
    !proofSet.some(p=>(byE.get(p.evidence_id)?.supports||[]).includes(c.id))
  ) {
    const strongest=[...cSupport].sort(
      (a,b)=>(reliability[byE.get(b)?.reliability]||0)-(reliability[byE.get(a)?.reliability]||0)
    )[0];
    proofSet.unshift({
      evidence_id:strongest,
      supports_canonical:true,
      reliability:byE.get(strongest)?.reliability
    });
  }

  finalDiscrimination=unresolved.length?'FAIL':'PASS';
}

const severityRank={FAIL:4,UNKNOWN:3,WARN:2,PASS:1};
let verdict='PASS';
for(const issue of issues) {
  if(severityRank[issue.severity]>severityRank[verdict]) verdict=issue.severity;
}
if(!issues.length && canonical.length!==1) verdict='UNKNOWN';

console.log(JSON.stringify({
  case_id:d.case_id,
  verdict,
  final_discrimination:finalDiscrimination,
  max_stage:maxStage,
  canonical_hypothesis:canonical.length===1?canonical[0].id:null,
  approximate_minimum_discriminating_set:proofSet,
  issues,
  stage_matrix:stageMatrix,
  note:'Deterministic graph audit only. It checks declared evidence/hypothesis structure; adversarial AI generation of missing alternative theories is a later layer.'
},null,2));

if(verdict==='FAIL') process.exitCode=1;
