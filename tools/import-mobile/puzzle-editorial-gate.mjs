import crypto from 'node:crypto';
import {logicAudiencePuzzles} from './logic-audience-data.mjs';

const DEFAULT_ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/puzzle-editorial?mode=approved-manifest';

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

export async function resolvePuzzleEditorialGate({endpoint=process.env.MYSTERYLOGIC_PUZZLE_EDITORIAL_MANIFEST||DEFAULT_ENDPOINT}={}){
  const source=logicAudiencePuzzles;
  const sourceFingerprints=new Map(source.map(puzzle=>[puzzle.id,puzzleFingerprint(puzzle)]));
  let manifest=null;
  try{
    const response=await fetch(endpoint,{headers:{accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(8000)});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    manifest=await response.json();
  }catch(error){
    return {ready:false,total:source.length,approved:0,exactApproved:0,mismatched:[],missing:source.map(p=>p.id),reason:`manifest_unavailable:${error?.message||'unknown'}`,schemaVersion:null};
  }
  if(!manifest||manifest.schemaVersion!==2||!Array.isArray(manifest.puzzles)){
    return {ready:false,total:source.length,approved:0,exactApproved:0,mismatched:[],missing:source.map(p=>p.id),reason:'manifest_schema_invalid',schemaVersion:manifest?.schemaVersion??null};
  }
  const approved=new Map(manifest.puzzles.map(row=>[String(row?.id||''),String(row?.fingerprint||'')]));
  const exact=[],mismatched=[],missing=[];
  for(const puzzle of source){
    if(!approved.has(puzzle.id)){missing.push(puzzle.id);continue;}
    if(approved.get(puzzle.id)!==sourceFingerprints.get(puzzle.id)){mismatched.push(puzzle.id);continue;}
    exact.push(puzzle.id);
  }
  const ready=source.length>0&&exact.length===source.length;
  return {ready,total:source.length,approved:approved.size,exactApproved:exact.length,mismatched,missing,reason:ready?'all_current_versions_approved':'approval_incomplete',schemaVersion:manifest.schemaVersion};
}
