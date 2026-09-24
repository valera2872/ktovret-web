#!/usr/bin/env node
import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node tools/mystery-corpus/validate-case-dna.mjs <case-dna.json>');
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];

const req = (obj, key, path = '') => {
  if (obj == null || !(key in obj)) errors.push(`${path || '$'} missing required field: ${key}`);
};

for (const key of ['schema_version','case_id','title','source','incident','mechanism','evidence','hypotheses','reveal','fingerprint']) {
  req(data, key);
}

if (data.schema_version !== 'case_dna_v1') {
  errors.push('$.schema_version must equal case_dna_v1');
}

if (data.source) {
  for (const key of ['source_type','rights_status','ingestion_policy','provenance']) req(data.source, key, '$.source');
  if (data.source.rights_status === 'unknown' && data.source.ingestion_policy !== 'prohibited_pending_review') {
    errors.push('$.source: unknown rights_status requires prohibited_pending_review');
  }
  if (data.source.ingestion_policy === 'metadata_and_analysis_only' && data.source.raw_text_retained === true) {
    errors.push('$.source: metadata_and_analysis_only cannot retain raw text');
  }
}

if (!Array.isArray(data.evidence) || data.evidence.length === 0) {
  errors.push('$.evidence must contain at least one item');
}

const evidenceIds = new Set();
for (const [i, e] of (data.evidence || []).entries()) {
  for (const key of ['id','type','provenance','fact','availability_stage','reliability']) req(e, key, `$.evidence[${i}]`);
  if (e?.id) {
    if (evidenceIds.has(e.id)) errors.push(`duplicate evidence id: ${e.id}`);
    evidenceIds.add(e.id);
  }
}

const hypothesisIds = new Set();
for (const [i, h] of (data.hypotheses || []).entries()) {
  for (const key of ['id','claim']) req(h, key, `$.hypotheses[${i}]`);
  if (h?.id) {
    if (hypothesisIds.has(h.id)) errors.push(`duplicate hypothesis id: ${h.id}`);
    hypothesisIds.add(h.id);
  }
}

for (const [i, e] of (data.evidence || []).entries()) {
  for (const id of [...(e.supports || []), ...(e.weakens || [])]) {
    if (!hypothesisIds.has(id)) errors.push(`$.evidence[${i}] references unknown hypothesis: ${id}`);
  }
  for (const id of (e.corroborated_by || [])) {
    if (!evidenceIds.has(id)) errors.push(`$.evidence[${i}] corroborated_by unknown evidence: ${id}`);
  }
}

for (const [i, h] of (data.hypotheses || []).entries()) {
  for (const id of [...(h.supporting_evidence || []), ...(h.contradicting_evidence || [])]) {
    if (!evidenceIds.has(id)) errors.push(`$.hypotheses[${i}] references unknown evidence: ${id}`);
  }
}

for (const [i, d] of (data.deductions || []).entries()) {
  for (const id of (d.premises || [])) {
    if (!evidenceIds.has(id) && !String(id).startsWith('deduction:')) {
      errors.push(`$.deductions[${i}] premise is not evidence or deduction reference: ${id}`);
    }
  }
}

if (data.reveal?.new_answer_changing_fact === true) {
  errors.push('$.reveal.new_answer_changing_fact=true => Fair Play hard fail');
}

const canonical = (data.hypotheses || []).filter(h => h.canonical === true);
if (canonical.length > 1) errors.push('Only one hypothesis may be canonical in Case DNA v1');

if (errors.length) {
  console.error('Case DNA INVALID');
  for (const err of errors) console.error('- ' + err);
  process.exit(1);
}

console.log('Case DNA VALID');
console.log(JSON.stringify({
  case_id: data.case_id,
  evidence: data.evidence.length,
  hypotheses: data.hypotheses.length,
  rights_status: data.source?.rights_status,
  ingestion_policy: data.source?.ingestion_policy
}, null, 2));
