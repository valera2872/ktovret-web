#!/usr/bin/env node
import fs from 'node:fs';

const assert=(condition,message)=>{if(!condition) throw new Error(message);};

function score(code,guess){
  let exact=0;
  const codeCounts=new Map(),guessCounts=new Map();
  for(let i=0;i<code.length;i++){
    if(code[i]===guess[i]) exact++;
    codeCounts.set(code[i],(codeCounts.get(code[i])||0)+1);
    guessCounts.set(guess[i],(guessCounts.get(guess[i])||0)+1);
  }
  let common=0;
  for(const [digit,count] of guessCounts) common+=Math.min(count,codeCounts.get(digit)||0);
  return [exact,common-exact];
}

function productDigits(length,unique=false){
  const out=[];
  const walk=(prefix)=>{
    if(prefix.length===length){out.push(prefix);return;}
    for(let digit=0;digit<=9;digit++){
      const d=String(digit);
      if(unique&&prefix.includes(d)) continue;
      walk(prefix+d);
    }
  };
  walk('');return out;
}

function solveMastermind(length,clues,{unique=false}={}){
  return productDigits(length,unique).filter(code=>clues.every(([guess,expected])=>{
    const actual=score(code,guess);
    return actual[0]===expected[0]&&actual[1]===expected[1];
  }));
}

const lock507=solveMastermind(3,[
  ['548',[1,0]],['159',[0,1]],['058',[0,2]],['238',[0,0]],['870',[0,2]],
]);
assert(lock507.length===1&&lock507[0]==='507',`lock-507 must have exactly one solution, got ${lock507.join(', ')}`);

const vault5074=solveMastermind(4,[
  ['8140',[0,2]],['2736',[0,1]],['0531',[0,2]],['4203',[0,2]],['7409',[0,3]],
],{unique:true});
assert(vault5074.length===1&&vault5074[0]==='5074',`vault-5074 must have exactly one solution, got ${vault5074.join(', ')}`);

function permutations(chars){
  if(chars.length<=1) return [chars];
  const out=[];
  for(let i=0;i<chars.length;i++) for(const rest of permutations(chars.slice(0,i)+chars.slice(i+1))) out.push(chars[i]+rest);
  return out;
}
const folderSolutions=permutations('ABCDE').filter(order=>{
  const p=Object.fromEntries([...order].map((x,i)=>[x,i]));
  return p.C===p.A+1 && p.E<p.B && p.D!==0 && p.D!==4 && Math.abs(p.E-p.A)===2 && p.B>p.C && p.D<p.A;
});
assert(folderSolutions.length===1&&folderSolutions[0]==='EDACB',`folder puzzle must have exactly one solution, got ${folderSolutions.join(', ')}`);

for(const file of ['assets/logic-hub.css','assets/logic-hub.js','tools/import-mobile/logic-hub-postprocess.mjs']) assert(fs.existsSync(file),`${file} missing`);
const generator=fs.readFileSync('tools/import-mobile/logic-hub-postprocess.mjs','utf8');
for(const marker of ['logicheskie-zadachi','data-telegram-cta','logic:lock-507','logic:archive-order','logic:vault-5074']) assert(generator.includes(marker),`generator marker missing: ${marker}`);

console.log(JSON.stringify({ok:true,puzzles:{lock507:lock507[0],folders:folderSolutions[0],vault5074:vault5074[0]}},null,2));
