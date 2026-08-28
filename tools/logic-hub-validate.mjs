#!/usr/bin/env node
import fs from 'node:fs';

const assert=(condition,message)=>{if(!condition) throw new Error(message);};

function permutations(values,length=values.length){
  const out=[];
  const walk=(prefix,rest)=>{
    if(prefix.length===length){out.push(prefix.slice());return;}
    for(let i=0;i<rest.length;i++) walk([...prefix,rest[i]],[...rest.slice(0,i),...rest.slice(i+1)]);
  };
  walk([],values);return out;
}

// EXPERT GATE 1: six-digit constraint puzzle.
// No repeated digits; every clue is a precise Mastermind-style [exact, misplaced] constraint.
function score(code,guess){
  let exact=0,common=0;
  for(let i=0;i<code.length;i++) if(code[i]===guess[i]) exact++;
  for(const digit of guess) if(code.includes(digit)) common++;
  return [exact,common-exact];
}
const sixDigitCodes=permutations('0123456789'.split(''),6).map(x=>x.join(''));
const protocolClues=[
  ['970234',[0,3]],
  ['950314',[0,4]],
  ['053246',[0,3]],
  ['410259',[0,4]],
  ['130697',[1,2]],
  ['061759',[1,3]],
  ['145063',[0,4]],
  ['205387',[1,3]],
];
let protocolCandidates=sixDigitCodes;
const protocolProgress=[protocolCandidates.length];
for(const [guess,expected] of protocolClues){
  protocolCandidates=protocolCandidates.filter(code=>{
    const actual=score(code,guess);
    return actual[0]===expected[0]&&actual[1]===expected[1];
  });
  protocolProgress.push(protocolCandidates.length);
}
assert(protocolCandidates.length===1&&protocolCandidates[0]==='581407',`protocol-six must resolve uniquely to 581407, got ${protocolCandidates.join(', ')}`);
assert(protocolProgress[4]>=400,`protocol-six collapses too early; only ${protocolProgress[4]} candidates after four clues`);
assert(protocolProgress[6]>=10,`protocol-six collapses too early; only ${protocolProgress[6]} candidates after six clues`);
assert(protocolProgress[7]===2&&protocolProgress[8]===1,`protocol-six final discrimination must be 2 -> 1, got ${protocolProgress.slice(-2).join(' -> ')}`);

// EXPERT GATE 2: self-referential truth system.
// One culprit A-F. Exactly three statements are true. Every candidate must reach a fixed point;
// only one fixed point may have exactly three truths.
const suspects='ABCDEF'.split('');
function truthVector(culprit,bits){
  const [A,B,C,D,E,F]=bits;
  return [
    culprit==='C'||culprit==='E',
    !A,
    (culprit!=='D')===F,
    ['A','B','E','F'].includes(culprit),
    Boolean(B)!==Boolean(culprit==='F'),
    culprit==='E'||D,
  ];
}
const bitVectors=[];
for(let mask=0;mask<64;mask++) bitVectors.push(Array.from({length:6},(_,i)=>Boolean(mask&(1<<i))));
const truthFixedPoints=new Map();
for(const culprit of suspects){
  const fixed=bitVectors.filter(bits=>{
    const expected=truthVector(culprit,bits);
    return bits.every((value,i)=>value===expected[i]);
  });
  truthFixedPoints.set(culprit,fixed);
  assert(fixed.length===1,`truth puzzle candidate ${culprit} must have one fixed point, got ${fixed.length}`);
}
const truthCounts=Object.fromEntries(suspects.map(c=>[c,truthFixedPoints.get(c)[0].filter(Boolean).length]));
const validCulprits=suspects.filter(c=>truthCounts[c]===3);
assert(validCulprits.length===1&&validCulprits[0]==='D',`truth puzzle must identify D uniquely, got ${validCulprits.join(', ')}`);
assert(JSON.stringify(truthCounts)===JSON.stringify({A:5,B:5,C:1,D:3,E:4,F:4}),`unexpected truth profile: ${JSON.stringify(truthCounts)}`);

// EXPERT GATE 3: 5x5 logic matrix.
// Five people × five times × five rooms × five objects. The seven published clues must yield
// one complete matrix, and every single clue must be essential (remove one => ambiguity).
const people=['A','B','V','G','I'];
const timePerms=permutations([0,1,2,3,4]);
const rooms=['arc','srv','cab','hall','lab'];
const roomPerms=permutations(rooms);
const objects=['key','usb','folder','phone','token'];
const objectPerms=permutations(objects);

function solveGrid(enabled=new Set([0,1,2,3,4,5,6]),cap=Infinity){
  const out=[];
  for(const tp of timePerms){
    const t=Object.fromEntries(people.map((p,i)=>[p,tp[i]]));
    if(enabled.has(0)&&t.V!==t.G+2) continue; // Vera 20m after Gleb
    for(const rp of roomPerms){
      const r=Object.fromEntries(people.map((p,i)=>[p,rp[i]]));
      const labPerson=people[rp.indexOf('lab')];
      if(enabled.has(1)&&t[labPerson]!==t.A+1) continue; // lab 10m after Anna
      const srvPerson=people[rp.indexOf('srv')];
      const hallPerson=people[rp.indexOf('hall')];
      if(enabled.has(2)&&t[srvPerson]!==t[hallPerson]+1) continue; // server after hall
      for(const op of objectPerms){
        const o=Object.fromEntries(people.map((p,i)=>[p,op[i]]));
        const phonePerson=people[op.indexOf('phone')];
        if(enabled.has(3)&&r[phonePerson]!=='hall') continue;
        const folderPerson=people[op.indexOf('folder')];
        if(enabled.has(4)&&r[folderPerson]!=='cab') continue;
        const usbPerson=people[op.indexOf('usb')];
        if(enabled.has(5)&&t[usbPerson]!==t.A-1) continue;
        const keyPerson=people[op.indexOf('key')];
        if(enabled.has(6)&&!(t.B<t[keyPerson]&&t[keyPerson]<t.A)) continue;
        out.push({t,r,o,keyPerson});
        if(out.length>=cap) return out;
      }
    }
  }
  return out;
}
const gridSolutions=solveGrid();
assert(gridSolutions.length===1,`archive matrix must have exactly one full solution, got ${gridSolutions.length}`);
const grid=gridSolutions[0];
assert(grid.keyPerson==='I',`archive matrix key holder must be Irina, got ${grid.keyPerson}`);
assert(JSON.stringify(grid.t)===JSON.stringify({A:3,B:0,V:4,G:2,I:1}),`unexpected time matrix: ${JSON.stringify(grid.t)}`);
for(let omitted=0;omitted<7;omitted++){
  const enabled=new Set([0,1,2,3,4,5,6].filter(i=>i!==omitted));
  const relaxed=solveGrid(enabled,2);
  assert(relaxed.length>1,`archive matrix clue ${omitted+1} is redundant; removing it must create ambiguity`);
}

for(const file of ['assets/logic-hub.css','assets/logic-hub.js','assets/logic-sitewide.css','assets/logic-sitewide.js','tools/import-mobile/logic-hub-postprocess.mjs','tools/import-mobile/logic-sitewide-postprocess.mjs']) assert(fs.existsSync(file),`${file} missing`);
const generator=fs.readFileSync('tools/import-mobile/logic-hub-postprocess.mjs','utf8');
for(const marker of ['logicheskie-zadachi','data-telegram-cta','logic:protocol-six','logic:self-reference-six','logic:archive-matrix','Разминок<br>не будет']) assert(generator.includes(marker),`generator marker missing: ${marker}`);
for(const legacy of ['logic:lock-507','logic:archive-order','logic:vault-5074','Трёхзначный замок','Пять папок']) assert(!generator.includes(legacy),`legacy low-difficulty puzzle leaked into expert catalog: ${legacy}`);
const expertLabels=(generator.match(/difficulty:'Экспертная'/g)||[]).length;
assert(expertLabels===3,`all launch puzzles must be expert tier; expected 3 labels, got ${expertLabels}`);

console.log(JSON.stringify({
  ok:true,
  standard:'expert-only',
  puzzles:{
    protocolSix:{answer:protocolCandidates[0],candidateProgress:protocolProgress},
    selfReference:{answer:validCulprits[0],truthCounts},
    archiveMatrix:{answer:'ИРИНА',allSevenCluesEssential:true},
  },
},null,2));
