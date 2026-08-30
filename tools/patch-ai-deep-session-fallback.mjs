import fs from 'node:fs';

const edgePath='supabase/functions/ai-interrogation-v1/index.ts';
const testPath='tests/ai-detective-vslice-contract.mjs';

let edge=fs.readFileSync(edgePath,'utf8');

const ready=`function marinaConfessionReady(_discoveredNotes:Set<string>,discoveredEvidence:Set<string>,qc:Counts){\n  // Final confession is gated only by player-visible progress. Hidden note ids must never block a solved investigation.\n  return qc.marina>=MARINA_MIN_CONFESSION_QUESTIONS&&\n    hasAll(discoveredEvidence,["E04","E05","E06","E07"]);\n}`;
const readyPlus=`function marinaConfessionReady(_discoveredNotes:Set<string>,discoveredEvidence:Set<string>,qc:Counts){\n  // Normal path: enough Marina pressure plus all player-visible evidence.\n  return qc.marina>=MARINA_MIN_CONFESSION_QUESTIONS&&\n    hasAll(discoveredEvidence,["E04","E05","E06","E07"]);\n}\n\nfunction legacyDeepConfessionReady(suspect:string,q:string,history:HistoryItem[],serverTurnsBefore:number){\n  // Compatibility path for long-running sessions created by older clients whose browser evidence Set can be stale.\n  // The server-authoritative session depth prevents a cheap first-pressure confession, while the current accusation\n  // must still synthesize all four canonical lines. Four prior Marina questions + the current one preserves the 5-turn floor.\n  if(suspect!=="marina"||serverTurnsBefore<12||!isFinalConfrontation(q))return false;\n  return history.filter(h=>h.role==="user").length>=4;\n}`;
if(!edge.includes(ready))throw new Error('ready block changed');
edge=edge.replace(ready,readyPlus);

const preClaim=`  const unlocked=unlock(suspect,question,evidenceId,discoveredNotes,discoveredEvidence,qc);\n  const activeNotes=new Set([...discoveredNotes,...unlocked.notes.map(n=>n.id)]);\n  const stage=interrogationStage(suspect,activeNotes,discoveredEvidence,qc);\n  const confessionThisTurn=unlocked.notes.some(n=>n.id==="N-MARINA-CONFESSION");\n  const ip=requestIp(req);`;
const preClaimNew=`  const unlocked=unlock(suspect,question,evidenceId,discoveredNotes,discoveredEvidence,qc);\n  const ip=requestIp(req);`;
if(!edge.includes(preClaim))throw new Error('pre-claim block changed');
edge=edge.replace(preClaim,preClaimNew);

const afterClaim=`    if(!claim?.ok)return json({error:claim?.code||"quota_denied",message:quotaMessage(claim?.code||""),quota:claim},429);\n    claimId=clean(claim.claim_id,64);\n    const result=await aiReply(suspect,question,evidenceId,history,unlocked.notes,unlocked.unlockedEvidenceIds,discoveredNotes,discoveredEvidence,stage,confessionThisTurn);`;
const afterClaimNew=`    if(!claim?.ok)return json({error:claim?.code||"quota_denied",message:quotaMessage(claim?.code||""),quota:claim},429);\n    claimId=clean(claim.claim_id,64);\n    const serverTurnsBefore=Math.max(0,DEMO_SESSION_LIMIT-(Number(claim.session_remaining)||0)-1);\n    if(!unlocked.notes.some(n=>n.id==="N-MARINA-CONFESSION")&&legacyDeepConfessionReady(suspect,question,history,serverTurnsBefore)){\n      unlocked.notes.push({id:"N-MARINA-CONFESSION",source:"Марина · признание",text:"После долгого допроса и финального сведения доступа, местонахождения, окна камеры и алиби остальных Марина признаётся: в окно отключения камеры она вошла в фонд и взяла письмо."});\n    }\n    const activeNotes=new Set([...discoveredNotes,...unlocked.notes.map(n=>n.id)]);\n    const stage=interrogationStage(suspect,activeNotes,discoveredEvidence,qc);\n    const confessionThisTurn=unlocked.notes.some(n=>n.id==="N-MARINA-CONFESSION");\n    const result=await aiReply(suspect,question,evidenceId,history,unlocked.notes,unlocked.unlockedEvidenceIds,discoveredNotes,discoveredEvidence,stage,confessionThisTurn);`;
if(!edge.includes(afterClaim))throw new Error('after-claim block changed');
edge=edge.replace(afterClaim,afterClaimNew);

const theory=`  const requiredEvidence=["E04","E05","E06","E07"];\n  const missingEvidence=requiredEvidence.filter(id=>!discoveredEvidence.has(id));\n  if(missingEvidence.length)return {correct:false,title:"Подозреваемый выбран, но доказательная цепочка ещё не замкнута",explanation:"Для обвинения нужны независимые проверки доступа, местонахождения и алиби остальных. Вернитесь к допросам и добудьте недостающие материалы."};\n  if(!discoveredNotes.has("N-MARINA-CONFESSION"))return {correct:false,title:"Марина зажата, но допрос ещё не завершён",explanation:"Вы уже собрали необходимую доказательную цепочку. Теперь сведите в одном обвинительном вопросе её ложное алиби, персональный доступ, заранее известное окно камеры и подтверждённые алиби остальных. Простого вопроса «это вы?» недостаточно."};`;
const theoryNew=`  const requiredEvidence=["E04","E05","E06","E07"];\n  const missingEvidence=requiredEvidence.filter(id=>!discoveredEvidence.has(id));\n  const confessed=discoveredNotes.has("N-MARINA-CONFESSION");\n  if(missingEvidence.length&&!confessed)return {correct:false,title:"Подозреваемый выбран, но доказательная цепочка ещё не замкнута",explanation:"Для обвинения нужны независимые проверки доступа, местонахождения и алиби остальных. Вернитесь к допросам и добудьте недостающие материалы."};\n  if(!confessed)return {correct:false,title:"Марина зажата, но допрос ещё не завершён",explanation:"Вы уже собрали необходимую доказательную цепочку. Теперь сведите в одном обвинительном вопросе её ложное алиби, персональный доступ, заранее известное окно камеры и подтверждённые алиби остальных. Простого вопроса «это вы?» недостаточно."};`;
if(!edge.includes(theory))throw new Error('theory block changed');
edge=edge.replace(theory,theoryNew);
fs.writeFileSync(edgePath,edge);

let test=fs.readFileSync(testPath,'utf8');
const marker=`assert.match(edge,/function isFinalConfrontation/,'confession must require a synthesis confrontation, not a magic first question');`;
const addition=`${marker}\nassert.match(edge,/function legacyDeepConfessionReady/,'old long-running browser sessions need a server-authoritative compatibility path');\nassert.match(edge,/serverTurnsBefore<12/,'compatibility confession must require substantial server-recorded investigation depth');\nassert.match(edge,/history\\.filter\\(h=>h\\.role===?"user"\\)\\.length>=4/,'compatibility confession must still preserve at least five Marina questions including the current one');\nassert.match(edge,/missingEvidence\\.length&&!confessed/,'a server-earned confession must not be invalidated later by a stale browser evidence set');`;
if(!test.includes(marker))throw new Error('test marker changed');
test=test.replace(marker,addition);
fs.writeFileSync(testPath,test);
console.log('patched deep-session confession fallback');
