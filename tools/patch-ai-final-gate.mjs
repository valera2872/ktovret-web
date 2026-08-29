import fs from 'node:fs';

const edgePath='supabase/functions/ai-interrogation-v1/index.ts';
const testPath='tests/ai-detective-vslice-contract.mjs';

let edge=fs.readFileSync(edgePath,'utf8');
const oldReady=`function marinaConfessionReady(discoveredNotes:Set<string>,discoveredEvidence:Set<string>,qc:Counts){\n  return qc.marina>=MARINA_MIN_CONFESSION_QUESTIONS&&\n    hasAll(discoveredEvidence,["E04","E05","E06","E07"])&&\n    hasAll(discoveredNotes,["N-ANTON-WINDOW","N-MARINA-ACCESS","N-MARINA-LOCATION","N-MARINA-WINDOW"]);\n}`;
const newReady=`function marinaConfessionReady(_discoveredNotes:Set<string>,discoveredEvidence:Set<string>,qc:Counts){\n  // Final confession is gated only by player-visible progress. Hidden note ids must never block a solved investigation.\n  return qc.marina>=MARINA_MIN_CONFESSION_QUESTIONS&&\n    hasAll(discoveredEvidence,["E04","E05","E06","E07"]);\n}`;
if(!edge.includes(oldReady))throw new Error('marinaConfessionReady source changed');
edge=edge.replace(oldReady,newReady);
if(!edge.includes('return dimensions>=3&&accusation;'))throw new Error('final confrontation threshold source changed');
edge=edge.replace('return dimensions>=3&&accusation;','return dimensions>=4&&accusation;');

const oldTheory=`  const requiredEvidence=["E04","E05","E06","E07"];\n  const requiredNotes=["N-ANTON-WINDOW","N-MARINA-ACCESS","N-MARINA-LOCATION","N-MARINA-WINDOW"];\n  const missingEvidence=requiredEvidence.filter(id=>!discoveredEvidence.has(id));\n  const missingNotes=requiredNotes.filter(id=>!discoveredNotes.has(id));\n  if(missingEvidence.length||missingNotes.length)return {correct:false,title:"Подозреваемый выбран, но доказательная цепочка ещё не замкнута",explanation:"Для обвинения нужны независимые проверки доступа, местонахождения, знания окна камеры и алиби остальных. Вернитесь к допросам и проверяйте утверждения документами."};`;
const newTheory=`  const requiredEvidence=["E04","E05","E06","E07"];\n  const missingEvidence=requiredEvidence.filter(id=>!discoveredEvidence.has(id));\n  if(missingEvidence.length)return {correct:false,title:"Подозреваемый выбран, но доказательная цепочка ещё не замкнута",explanation:"Для обвинения нужны независимые проверки доступа, местонахождения и алиби остальных. Вернитесь к допросам и добудьте недостающие материалы."};`;
if(!edge.includes(oldTheory))throw new Error('checkTheory source changed');
edge=edge.replace(oldTheory,newTheory);
fs.writeFileSync(edgePath,edge);

let test=fs.readFileSync(testPath,'utf8');
const oldAssertion=`assert.match(edge,/hasAll\\(discoveredNotes,\\["N-ANTON-WINDOW","N-MARINA-ACCESS","N-MARINA-LOCATION","N-MARINA-WINDOW"\\]\\)/,'confession must require prior irreversible concessions');`;
const newAssertion=`assert.doesNotMatch(edge,/function marinaConfessionReady[\\s\\S]{0,500}hasAll\\(discoveredNotes/,'hidden note ids must never block an otherwise earned confession');\nassert.match(edge,/return dimensions>=4&&accusation/,'final confrontation must synthesize all four investigation lines');`;
if(!test.includes(oldAssertion))throw new Error('contract assertion source changed');
test=test.replace(oldAssertion,newAssertion);
fs.writeFileSync(testPath,test);

console.log('patched AI final gate to use visible evidence only');
