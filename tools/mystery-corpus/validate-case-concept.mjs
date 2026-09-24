#!/usr/bin/env node
import fs from 'node:fs';

const file=process.argv[2];
if(!file){console.error('Usage: node validate-case-concept.mjs <concept.json>');process.exit(2)}
const c=JSON.parse(fs.readFileSync(file,'utf8'));
const errors=[];
for(const k of ['schema_version','concept_id','working_title','hook','role','mode','incident','canon_skeleton','hypotheses','evidence_plan','lies_and_secrets','red_herrings','recontextualization','signature_action','final_reconstruction','differentiation','generation_audit']){
  if(!(k in c)) errors.push('missing '+k);
}
if(c.schema_version!=='case_concept_v1') errors.push('schema_version must equal case_concept_v1');
for(const k of ['who','why','how','where','when']) if(!c.canon_skeleton?.[k]) errors.push('canon_skeleton missing '+k);
if(!Array.isArray(c.hypotheses)||c.hypotheses.length<3) errors.push('at least 3 hypotheses required');
if(!Array.isArray(c.evidence_plan)||c.evidence_plan.length<5) errors.push('at least 5 evidence-plan items required');
if(!Array.isArray(c.lies_and_secrets)||c.lies_and_secrets.length<2) errors.push('at least 2 lies/secrets required');
if(!Array.isArray(c.red_herrings)||c.red_herrings.length<2) errors.push('at least 2 red herrings required');
if(!['baseline','corpus'].includes(c.generation_audit?.variant)) errors.push('generation_audit.variant invalid');
if(c.generation_audit?.variant==='baseline'){
  if(c.generation_audit?.context_mode!=='none') errors.push('baseline context_mode must be none');
  if((c.generation_audit?.retrieved_case_ids||[]).length) errors.push('baseline cannot claim retrieved_case_ids');
}
if(c.generation_audit?.variant==='corpus' && c.generation_audit?.context_mode!=='approved') errors.push('corpus context_mode must be approved');
if(c.generation_audit?.copied_source_plot!==false) errors.push('copied_source_plot must be false');
if(errors.length){
  console.error('Case Concept INVALID');for(const e of errors)console.error('- '+e);process.exit(1);
}
console.log('Case Concept VALID');
console.log(JSON.stringify({concept_id:c.concept_id,variant:c.generation_audit.variant,hypotheses:c.hypotheses.length,evidence_plan:c.evidence_plan.length},null,2));
