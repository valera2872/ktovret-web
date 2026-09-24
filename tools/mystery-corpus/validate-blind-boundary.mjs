#!/usr/bin/env node
import fs from 'node:fs';

const file=process.argv[2];
if(!file) {
  console.error('Usage: node validate-blind-boundary.mjs <blind-player-packet.json>');
  process.exit(2);
}
const d=JSON.parse(fs.readFileSync(file,'utf8'));
const errors=[];
const forbidden=/^(culprit|is_culprit|guilty|canonical|canonical_hypothesis|solution|answer_key|correct_answer|private_canon|private_solution|confession_threshold|unlock_graph|intended_path|important_clue|importance|spoiler)$/i;

function walk(v,path='$') {
  if(Array.isArray(v)) {
    v.forEach((x,i)=>walk(x,`${path}[${i}]`));
    return;
  }
  if(v&&typeof v==='object') {
    for(const [k,x] of Object.entries(v)) {
      if(forbidden.test(k)) errors.push(`${path}.${k}: forbidden solution-bearing key`);
      walk(x,`${path}.${k}`);
    }
  }
}
walk(d);

for(const key of ['schema_version','case_id','stage','role','incident','evidence','characters','available_actions','state']) {
  if(!(key in d)) errors.push(`$ missing required field: ${key}`);
}
if(d.schema_version!=='blind_player_packet_v1') errors.push('$.schema_version must equal blind_player_packet_v1');
if(!Number.isInteger(d.stage)||d.stage<0) errors.push('$.stage must be a non-negative integer');
if(!Array.isArray(d.evidence)) errors.push('$.evidence must be an array');
if(!Array.isArray(d.characters)) errors.push('$.characters must be an array');
if(!Array.isArray(d.available_actions)) errors.push('$.available_actions must be an array');

const evidenceIds=new Set();
for(const [i,e] of (d.evidence||[]).entries()) {
  if(!e.id) errors.push(`$.evidence[${i}] missing id`);
  else if(evidenceIds.has(e.id)) errors.push(`duplicate evidence id: ${e.id}`);
  else evidenceIds.add(e.id);

  if('reliability' in e) errors.push(`$.evidence[${i}].reliability: hidden author assessment is forbidden in blind packet`);
  if('supports' in e||'weakens' in e) errors.push(`$.evidence[${i}]: hypothesis-support labels are forbidden in blind packet`);
}

const actionIds=new Set();
for(const [i,a] of (d.available_actions||[]).entries()) {
  if(!a.id) errors.push(`$.available_actions[${i}] missing id`);
  else if(actionIds.has(a.id)) errors.push(`duplicate action id: ${a.id}`);
  else actionIds.add(a.id);
}

for(const id of (d.state?.opened_evidence_ids||[])) {
  if(!evidenceIds.has(id)) errors.push(`$.state.opened_evidence_ids references unavailable evidence: ${id}`);
}

if(errors.length) {
  console.error('Blind boundary INVALID');
  for(const e of errors) console.error('- '+e);
  process.exit(1);
}
console.log('Blind boundary VALID');
console.log(JSON.stringify({
  case_id:d.case_id,
  stage:d.stage,
  evidence:(d.evidence||[]).length,
  characters:(d.characters||[]).length,
  actions:(d.available_actions||[]).length
},null,2));
