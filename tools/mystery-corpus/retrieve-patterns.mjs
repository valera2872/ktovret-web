#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function argsOf(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) out[a.slice(2)] = argv[++i];
  }
  return out;
}

const args = argsOf(process.argv.slice(2));
const dir = args.dir;
const query = (args.query || '').trim();
const limit = Math.max(1, Math.min(50, Number(args.limit || 8)));
const maxPerFamily = Math.max(1, Number(args['max-per-family'] || 3));
if (!dir || !query) {
  console.error('Usage: node retrieve-patterns.mjs --dir <cases> --query <text> [--limit 8] [--max-per-family 3]');
  process.exit(2);
}

const STOP = new Set(['the','a','an','and','or','of','to','in','on','for','with','is','are','as','by','from','case','mystery','detective','real','fiction']);
const SYN = new Map([
  ['невидим', ['invisible','social-invisibility','attention-blindness']],
  ['алиби', ['alibi','timeline','timing','strong-alibi']],
  ['время', ['time','timeline','timing','timestamp','temporal']],
  ['подмена', ['substitution','identity-substitution','misattribution','appearance-transformation']],
  ['личност', ['identity','identity-convergence','contextual-identity','cross-platform-identity']],
  ['цифров', ['digital','metadata','device','online']],
  ['лож', ['lie','false','deception','misleading','misdirection']],
  ['роль', ['role','role-mimicry','role-reversal','role-access']],
  ['доступ', ['access','access-control-social-engineering','architectural-access']],
  ['отрицательн', ['negative','negative-evidence','absence-of-reaction']],
  ['отсутств', ['absence','negative-evidence','negative-search']],
  ['демонстрац', ['controlled-demonstration','representation-vs-reality']],
  ['документ', ['document','records','filings','document-forensics']],
  ['происхожд', ['provenance','partial-provenance','digital-provenance','unresolved-provenance']],
  ['система', ['institutional','social-system','process','records']],
  ['ошиб', ['error','category-error','witness-category-error','investigator-bias']],
  ['наблюден', ['observation','witness-negative','controlled-surveillance']],
  ['финанс', ['financial','earnings','ransom-tracing']],
  ['неумышлен', ['unwitting-agent','action-without-intent']],
  ['перепут', ['misattribution','category-error','identity']],
]);

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}-]+/gu, ' ').trim();
}
function tokens(s) {
  const base = norm(s).split(/\s+/).filter(t => t.length > 2 && !STOP.has(t));
  const out = new Set(base);
  for (const t of base) {
    for (const [stem, values] of SYN) {
      if (t.startsWith(stem)) for (const v of values) out.add(v);
    }
  }
  return [...out];
}
function flattenStrings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) for (const x of v) flattenStrings(x, out);
  else if (v && typeof v === 'object') for (const x of Object.values(v)) flattenStrings(x, out);
  return out;
}

const qTokens = tokens(query);
const files = fs.readdirSync(dir).filter(x => x.endsWith('.json')).sort();
const scored = [];
for (const name of files) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  if (d.schema_version !== 'case_dna_v1') continue;
  const weighted = [];
  const add = (value, weight, area) => {
    for (const s of flattenStrings(value)) {
      const ts = tokens(s);
      for (const qt of qTokens) {
        for (const st of ts) {
          if (st === qt || st.includes(qt) || qt.includes(st)) weighted.push({area, term:qt, value:s, weight});
        }
      }
    }
  };
  add(d.mechanism?.mechanism_tags, 5, 'mechanism');
  add(d.fingerprint?.decisive_proof_tags, 5, 'decisive_proof');
  add(d.fingerprint?.reversal_tags, 4, 'reversal');
  add(d.fingerprint?.evidence_topology, 4, 'evidence_topology');
  add(d.fingerprint?.signature_action_tags, 4, 'signature_action');
  add(d.incident?.category, 2, 'incident');
  add(d.incident?.setting, 1, 'setting');
  add(d.quality?.editorial_lessons, 3, 'editorial_lessons');
  add(d.mechanism?.core_mechanism, 2, 'core_mechanism');

  const uniq = new Map();
  for (const m of weighted) {
    const k = `${m.area}|${m.term}|${m.value}`;
    if (!uniq.has(k)) uniq.set(k, m);
  }
  const matches = [...uniq.values()];
  const score = matches.reduce((a, m) => a + m.weight, 0);
  if (score > 0) scored.push({d, score, matches});
}
scored.sort((a,b) => b.score - a.score || a.d.case_id.localeCompare(b.d.case_id));

const selected = [];
const families = new Map();
for (const s of scored) {
  const family = s.d.source?.source_type || 'unknown';
  if ((families.get(family) || 0) >= maxPerFamily) continue;
  selected.push(s);
  families.set(family, (families.get(family) || 0) + 1);
  if (selected.length >= limit) break;
}
if (selected.length < limit) {
  for (const s of scored) {
    if (selected.includes(s)) continue;
    selected.push(s);
    if (selected.length >= limit) break;
  }
}

const result = selected.map(({d, score, matches}) => ({
  case_id:d.case_id,
  title:d.title,
  source_type:d.source?.source_type,
  rights_status:d.source?.rights_status,
  score,
  matched_dimensions:[...new Set(matches.map(m => m.area))],
  matched_terms:[...new Set(matches.map(m => m.term))],
  pattern:{
    incident:d.incident?.category,
    mechanism_tags:d.mechanism?.mechanism_tags || [],
    evidence_topology:d.fingerprint?.evidence_topology || [],
    reversal_tags:d.fingerprint?.reversal_tags || [],
    decisive_proof_tags:d.fingerprint?.decisive_proof_tags || [],
    editorial_lessons:d.quality?.editorial_lessons || []
  }
}));
console.log(JSON.stringify({query, query_tokens:qTokens, count:result.length, results:result}, null, 2));
