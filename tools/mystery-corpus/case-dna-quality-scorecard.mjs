#!/usr/bin/env node
import fs from 'node:fs';

function argsOf(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    if(!argv[i].startsWith('--')) continue;
    const k=argv[i].slice(2),n=argv[i+1];
    if(!n||n.startsWith('--')) out[k]=true; else {out[k]=n;i++;}
  }
  return out;
}
const args=argsOf(process.argv.slice(2));
if(!args.case){
  console.error('Usage: node case-dna-quality-scorecard.mjs --case <case.json> [--provenance <prov.json>]');
  process.exit(2);
}
const d=JSON.parse(fs.readFileSync(args.case,'utf8'));
const p=args.provenance?JSON.parse(fs.readFileSync(args.provenance,'utf8')):null;
const evidence=d.evidence||[], hypotheses=d.hypotheses||[], deductions=d.deductions||[], mis=d.lies_and_misdirection||[];
const typeSet=new Set(evidence.map(x=>x.type).filter(Boolean));
const essential=evidence.filter(x=>x.essential===true);
const corroborated=evidence.filter(x=>Array.isArray(x.corroborated_by)&&x.corroborated_by.length>0);
const canon=hypotheses.filter(x=>x.canonical===true);
const alternatives=hypotheses.filter(x=>x.canonical!==true);
const decisive=deductions.filter(x=>x.strength==='decisive');
const stageSet=new Set(evidence.map(x=>x.availability_stage).filter(Number.isInteger));
const causalMisdirection=mis.filter(x=>typeof x.causal_reason==='string'&&x.causal_reason.trim().length>=12);
const provClaims=p?.claims||[];
const crit=provClaims.filter(x=>x.materiality==='critical');
const grounded=crit.filter(x=>['source_supported','abstracted_from_source'].includes(x.status)&&x.source_locator);

const dimensions=[
  {
    id:'evidence_variety',
    value:typeSet.size,
    status:typeSet.size>=4?'strong':typeSet.size>=2?'adequate':'thin',
    note:'Distinct evidence modalities.'
  },
  {
    id:'hypothesis_depth',
    value:alternatives.length,
    status:alternatives.length>=2?'strong':alternatives.length===1?'adequate':'thin',
    note:'Non-canonical competing hypotheses.'
  },
  {
    id:'essential_corroboration',
    value:{essential:essential.length,corroborated_essential:essential.filter(x=>Array.isArray(x.corroborated_by)&&x.corroborated_by.length>0).length},
    status:essential.length===0?'unknown':essential.every(x=>Array.isArray(x.corroborated_by)&&x.corroborated_by.length>0)?'strong':'attention',
    note:'Essential evidence should preferably have an independent corroborating line.'
  },
  {
    id:'deduction_structure',
    value:{deductions:deductions.length,decisive:decisive.length},
    status:deductions.length>=2&&decisive.length>=1?'strong':deductions.length>=1?'adequate':'thin',
    note:'Explicit multi-step inference structure.'
  },
  {
    id:'stage_structure',
    value:stageSet.size,
    status:stageSet.size>=3?'strong':stageSet.size>=2?'adequate':'thin',
    note:'Evidence becomes available across meaningful stages.'
  },
  {
    id:'causal_misdirection',
    value:{items:mis.length,with_causal_reason:causalMisdirection.length},
    status:mis.length===0?'not_applicable':causalMisdirection.length===mis.length?'strong':'attention',
    note:'Misdirection should have a causal reason, not decorative suspicion.'
  },
  {
    id:'canonical_uniqueness',
    value:canon.length,
    status:canon.length===1?'strong':'attention',
    note:'Exactly one canonical hypothesis for resolved Case DNA.'
  },
  {
    id:'source_grounding',
    value:p?{critical:crit.length,grounded:grounded.length}:null,
    status:!p?'not_run':crit.length>0&&grounded.length===crit.length?'strong':'attention',
    note:'Critical source claims grounded to locators.'
  },
  {
    id:'fingerprint_richness',
    value:[
      ...(d.fingerprint?.mechanism_tags||[]),
      ...(d.fingerprint?.evidence_topology||[]),
      ...(d.fingerprint?.reversal_tags||[]),
      ...(d.fingerprint?.decisive_proof_tags||[]),
      ...(d.fingerprint?.signature_action_tags||[])
    ].filter(Boolean).length,
    status:[
      ...(d.fingerprint?.mechanism_tags||[]),
      ...(d.fingerprint?.evidence_topology||[]),
      ...(d.fingerprint?.reversal_tags||[]),
      ...(d.fingerprint?.decisive_proof_tags||[]),
      ...(d.fingerprint?.signature_action_tags||[])
    ].filter(Boolean).length>=6?'strong':'adequate',
    note:'Structural fingerprint density for retrieval/originality.'
  }
];

const attention=dimensions.filter(x=>['thin','attention'].includes(x.status));
const strong=dimensions.filter(x=>x.status==='strong');
const report={
  schema_version:'case_dna_quality_scorecard_v1',
  case_id:d.case_id,
  title:d.title,
  diagnostics_only:true,
  dimensions,
  summary:{
    strong_dimensions:strong.length,
    attention_dimensions:attention.length,
    attention_ids:attention.map(x=>x.id)
  },
  guardrails:[
    'This scorecard is diagnostic, not a quality verdict.',
    'A high structural score cannot replace independent source review, blind testing, Theory Audit, fair-play review or human editorial judgment.',
    'Real-case records may legitimately have no single canonical answer or no misdirection layer.'
  ]
};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
