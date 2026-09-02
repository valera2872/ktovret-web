import crypto from 'node:crypto';
import {logicAudiencePuzzles} from './logic-audience-data.mjs';

const DEFAULT_ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/puzzle-editorial?mode=approved-manifest';
const PUBLICLY_DISABLED_COLLECTIONS=new Set();

export function canonicalPuzzleJson(value){
  if(Array.isArray(value)) return `[${value.map(canonicalPuzzleJson).join(',')}]`;
  if(value&&typeof value==='object'){
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonicalPuzzleJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function puzzleFingerprint(value){
  return crypto.createHash('sha256').update(canonicalPuzzleJson(value),'utf8').digest('hex');
}

const publishableByPolicy=puzzle=>!(puzzle.collections||[]).some(collection=>PUBLICLY_DISABLED_COLLECTIONS.has(collection));

export async function resolvePuzzleEditorialGate({endpoint=process.env.MYSTERYLOGIC_PUZZLE_EDITORIAL_MANIFEST||DEFAULT_ENDPOINT}={}){
  const source=[...logicAudiencePuzzles];
  const sourceFingerprints=new Map(source.map(puzzle=>[puzzle.id,puzzleFingerprint(puzzle)]));
  let manifest=null;
  try{
    const response=await fetch(endpoint,{headers:{accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(8000)});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    manifest=await response.json();
  }catch(error){
    return {ready:false,total:source.length,approved:0,exactApproved:0,publishableApproved:0,approvedIds:[],mismatched:[],missing:source.map(p=>p.id),policyExcluded:[],reason:`manifest_unavailable:${error?.message||'unknown'}`,schemaVersion:null};
  }
  if(!manifest||manifest.schemaVersion!==2||!Array.isArray(manifest.puzzles)){
    return {ready:false,total:source.length,approved:0,exactApproved:0,publishableApproved:0,approvedIds:[],mismatched:[],missing:source.map(p=>p.id),policyExcluded:[],reason:'manifest_schema_invalid',schemaVersion:manifest?.schemaVersion??null};
  }
  const approved=new Map(manifest.puzzles.map(row=>[String(row?.id||''),String(row?.fingerprint||'')]));
  const exact=[],mismatched=[],missing=[],policyExcluded=[];
  for(const puzzle of source){
    if(!approved.has(puzzle.id)){missing.push(puzzle.id);continue;}
    if(approved.get(puzzle.id)!==sourceFingerprints.get(puzzle.id)){mismatched.push(puzzle.id);continue;}
    exact.push(puzzle.id);
    if(!publishableByPolicy(puzzle)) policyExcluded.push(puzzle.id);
  }
  const publishableIds=exact.filter(id=>{
    const puzzle=source.find(item=>item.id===id);
    return puzzle&&publishableByPolicy(puzzle);
  });
  const publishableSet=new Set(publishableIds);
  const publishablePuzzles=source.filter(puzzle=>publishableSet.has(puzzle.id));
  const ready=publishablePuzzles.length>0;

  // Both this module and the audience generator reference the same exported array.
  // Mutating it here makes the production generator see only exact owner-approved,
  // current-version puzzles. Editorial builds bypass this gate and retain all source puzzles.
  if(ready) logicAudiencePuzzles.splice(0,logicAudiencePuzzles.length,...publishablePuzzles);

  return {
    ready,
    total:source.length,
    approved:approved.size,
    exactApproved:exact.length,
    publishableApproved:publishablePuzzles.length,
    approvedIds:publishableIds,
    mismatched,
    missing,
    policyExcluded,
    reason:ready?'approved_subset_ready':'no_publishable_approvals',
    schemaVersion:manifest.schemaVersion,
  };
}