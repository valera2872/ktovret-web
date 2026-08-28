#!/usr/bin/env node

const assert=(ok,msg)=>{if(!ok) throw new Error(msg);};

function permutations(values,length=values.length){
  const out=[];
  const walk=(prefix,rest)=>{
    if(prefix.length===length){out.push(prefix.slice());return;}
    for(let i=0;i<rest.length;i++) walk([...prefix,rest[i]],[...rest.slice(0,i),...rest.slice(i+1)]);
  };
  walk([],values);return out;
}

const report={standard:'logic-expert-review-v2',puzzles:{}};

// 001 · six-digit exact/misplaced protocol
function mmScore(code,guess){
  let exact=0,common=0;
  for(let i=0;i<code.length;i++) if(code[i]===guess[i]) exact++;
  for(const d of guess) if(code.includes(d)) common++;
  return [exact,common-exact];
}
const clues001=[['970234',[0,3]],['950314',[0,4]],['053246',[0,3]],['410259',[0,4]],['130697',[1,2]],['061759',[1,3]],['145063',[0,4]],['205387',[1,3]]];
let c001=permutations('0123456789'.split(''),6).map(x=>x.join(''));
const p001=[c001.length];
for(const [guess,want] of clues001){c001=c001.filter(code=>{const got=mmScore(code,guess);return got[0]===want[0]&&got[1]===want[1];});p001.push(c001.length);}
assert(c001.length===1&&c001[0]==='581407','001 not unique');
assert(JSON.stringify(p001)===JSON.stringify([151200,34080,8944,2208,451,70,10,2,1]),`001 unexpected progression ${p001}`);
report.puzzles['001']={answer:c001[0],progress:p001};

// 002 · linear order of seven modules
const orders7=permutations('ABCDEFG'.split(''));
function ok002(p){const q=Object.fromEntries(p.map((x,i)=>[x,i]));return [q.A<q.C,q.G<q.F,(q.D+1)%2===1,Math.abs(q.B-q.C)===2,Math.abs(q.G-q.F)===2,Math.abs(q.C-q.A)===1,q.E<q.B&&q.B<q.D,(q.E+1)%2===1];}
let c002=orders7;const p002=[];
for(let i=0;i<8;i++){c002=c002.filter(p=>ok002(p)[i]);p002.push(c002.length);}
assert(c002.length===1&&c002[0].join('')==='EACGBFD','002 not unique');
assert(p002[6]===2&&p002[7]===1,'002 must discriminate 2 -> 1 at the end');
report.puzzles['002']={answer:c002[0].join(''),progress:p002};

// 003 · cyclic order, A fixed at top
const ring=permutations('BCDEFGH'.split('')).map(p=>['A',...p]);
function ok003(p){const q=Object.fromEntries(p.map((x,i)=>[x,i]));const cw=(a,b)=>(q[b]-q[a]+8)%8;const adj=(a,b)=>Math.min(cw(a,b),cw(b,a))===1;return [cw('G','A')===2,adj('A','F'),adj('E','G'),adj('A','E'),cw('A','D')===4,cw('H','D')===1,cw('G','C')===4];}
let c003=ring;const p003=[];
for(let i=0;i<7;i++){c003=c003.filter(p=>ok003(p)[i]);p003.push(c003.length);}
assert(c003.length===1&&c003[0].join('')==='AFCHDBGE','003 not unique');
assert(JSON.stringify(p003)===JSON.stringify([720,240,72,24,6,2,1]),`003 progression ${p003}`);
report.puzzles['003']={answer:c003[0].join(''),progress:p003};

// 004 · ten binary switches
function ok004(bits){const d=Object.fromEntries('ABCDEFGHIJ'.split('').map((x,i)=>[x,bits[i]]));const on=s=>[...s].reduce((n,x)=>n+d[x],0);return [on('AEJ')%2===1,on('CEGHI')%2===0,on('ABCEG')%2===0,on('CFGHIJ')===3,on('ABEFG')%2===0,on('ABFHI')%2===1,on('DFHIJ')===3,on('ABFH')===2];}
let c004=[];for(let mask=0;mask<1024;mask++) c004.push(Array.from({length:10},(_,i)=>(mask>>i)&1));
const p004=[];for(let i=0;i<8;i++){c004=c004.filter(s=>ok004(s)[i]);p004.push(c004.length);}
assert(c004.length===1,'004 not unique');
const a004='ABCDEFGHIJ'.split('').filter((_,i)=>c004[0][i]).join('');
assert(a004==='ACDFI',`004 answer ${a004}`);
assert(JSON.stringify(p004)===JSON.stringify([512,256,128,40,16,8,3,1]),`004 progression ${p004}`);
report.puzzles['004']={answer:a004,progress:p004};

// 005 · order of six non-commuting operations
const op={
 A:s=>{s=[...s];[s[0],s[3]]=[s[3],s[0]];return s;},
 B:s=>[s[1],s[2],s[3],s[0]],
 C:s=>s.map((x,i)=>(x+[1,0,3,0][i])%10),
 D:s=>s.map(x=>(x*3)%10),
 E:s=>[s[2],s[1],s[0],s[3]],
 F:s=>{s=[...s];[s[1],s[2]]=[s[2],s[1]];return s;},
};
const c005=[];
for(const order of permutations(Object.keys(op))){let s=[2,0,4,7];for(const k of order)s=op[k](s);if(s.join('')==='0571')c005.push(order.join(''));}
assert(c005.length===1&&c005[0]==='DCEABF',`005 solutions ${c005}`);
report.puzzles['005']={answer:c005[0],searchSpace:720};

// 006 · Takuzu 6x6
const rows006=[];
for(let mask=0;mask<64;mask++){
  const r=Array.from({length:6},(_,i)=>(mask>>(5-i))&1);
  if(r.reduce((a,b)=>a+b,0)!==3)continue;
  if(r.some((_,i)=>i<4&&r[i]===r[i+1]&&r[i]===r[i+2]))continue;
  rows006.push(r);
}
const boards006=[];
function build006(rows){
  if(rows.length===6){
    const cols=Array.from({length:6},(_,c)=>rows.map(r=>r[c]));
    if(new Set(cols.map(c=>c.join(''))).size!==6)return;
    if(cols.every(c=>c.reduce((a,b)=>a+b,0)===3&&!c.some((_,i)=>i<4&&c[i]===c[i+1]&&c[i]===c[i+2])))boards006.push(rows.map(r=>[...r]));
    return;
  }
  for(const row of rows006){if(rows.some(r=>r.join('')===row.join('')))continue;build006([...rows,row]);}
}
build006([]);
const given006=[[0,0,0],[0,1,0],[1,2,1],[2,5,1],[3,0,0],[0,3,0],[3,3,0],[3,4,0]];
const c006=boards006.filter(b=>given006.every(([r,c,v])=>b[r][c]===v));
assert(c006.length===1,'006 not unique');
const a006=c006[0].map(r=>r.join('')).join('/');
assert(a006==='001011/101010/010101/011001/100110/110100',`006 answer ${a006}`);
for(let omit=0;omit<given006.length;omit++) assert(boards006.filter(b=>given006.every(([r,c,v],i)=>i===omit||b[r][c]===v)).length>1,`006 given ${omit+1} redundant`);
report.puzzles['006']={answer:a006,validBoards:boards006.length,allGivensEssential:true};

// Generic Latin-square builder
function latinSquares(n){
  const symbols=Array.from({length:n},(_,i)=>i+1);const rows=permutations(symbols);const out=[];
  const walk=grid=>{
    if(grid.length===n){out.push(grid.map(r=>[...r]));return;}
    for(const row of rows){let ok=true;for(let c=0;c<n;c++){if(grid.some(r=>r[c]===row[c])){ok=false;break;}}if(ok)walk([...grid,row]);}
  };
  walk([]);return out;
}
function visible(seq){let max=0,n=0;for(const x of seq)if(x>max){max=x;n++;}return n;}

// 007 · Skyscrapers 5x5, all eight published clues essential
const latin5=latinSquares(5);
const checks007=[
 L=>visible(L.map(r=>r[2]))===3,
 L=>visible(L.map(r=>r[3]).reverse())===4,
 L=>visible(L.map(r=>r[2]).reverse())===2,
 L=>visible(L.map(r=>r[4]))===3,
 L=>visible(L[0])===2,
 L=>L[2][2]===2,
 L=>visible(L[2])===4,
 L=>visible([...L[3]].reverse())===2,
];
const c007=latin5.filter(L=>checks007.every(f=>f(L)));
assert(c007.length===1,'007 not unique');
const a007=c007[0].map(r=>r.join('')).join('/');
assert(a007==='42351/35412/13245/21534/54123',`007 answer ${a007}`);
for(let omit=0;omit<checks007.length;omit++) assert(latin5.filter(L=>checks007.every((f,i)=>i===omit||f(L))).length>1,`007 clue ${omit+1} redundant`);
report.puzzles['007']={answer:a007,latinSearchSpace:latin5.length,allCluesEssential:true};

// 008 · KenKen-style 4x4 arithmetic cages
const latin4=latinSquares(4);
const checks008=[
 L=>L[1][0]+L[2][0]+L[3][0]===8,
 L=>L[2][2]*L[2][3]*L[3][3]===12,
 L=>L[1][1]+L[1][2]+L[2][1]===6,
 L=>L[0][3]*L[1][3]===4,
 L=>L[0][1]+L[0][2]===7,
 L=>L[3][1]+L[3][2]===5,
 L=>L[0][0]===2,
];
const c008=latin4.filter(L=>checks008.every(f=>f(L)));
assert(c008.length===1,'008 not unique');
const a008=c008[0].map(r=>r.join('')).join('/');
assert(a008==='2341/1234/4123/3412',`008 answer ${a008}`);
report.puzzles['008']={answer:a008,latinSearchSpace:latin4.length};

// 009 · weighted simple route
const edges009=[['A','E',4],['A','G',4],['A','H',4],['A','I',3],['B','C',7],['B','H',9],['C','F',3],['C','G',7],['D','F',8],['D','I',2],['E','F',5],['E','H',2],['E','I',3],['F','I',4],['G','H',2],['H','I',6]];
const graph009=Object.fromEntries('ABCDEFGHI'.split('').map(x=>[x,[]]));for(const [a,b,w] of edges009){graph009[a].push([b,w]);graph009[b].push([a,w]);}
const c009=[];
function walk009(node,path,cost){
  if(path.length>7)return;
  if(node==='I'){
    if(path.length===7&&cost===23&&Number(path.includes('C'))+Number(path.includes('F'))===1)c009.push(path.join(''));
    return;
  }
  for(const [next,w] of graph009[node])if(!path.includes(next))walk009(next,[...path,next],cost+w);
}
walk009('A',['A'],0);
assert(c009.length===1&&c009[0]==='AGHEFDI',`009 solutions ${c009}`);
report.puzzles['009']={answer:c009[0]};

// 010 · reversible connector chain with three relational constraints
const tiles010=[[2,6],[3,6],[4,5],[4,6],[1,2],[2,5],[2,4],[3,4]];const labels010='ABCDEFGH';const c010=[];
function chain010(mask,current,seq){
  if(mask===(1<<8)-1){if(current===6){const order=seq.map(x=>x.i);const pos=Object.fromEntries(order.map((x,i)=>[x,i]));if(Math.abs(pos[2]-pos[6])===1&&Math.abs(pos[0]-pos[6])===1&&Math.abs(pos[0]-pos[3])===1)c010.push(seq);}return;}
  for(let i=0;i<8;i++){
    if(mask&(1<<i))continue;const [a,b]=tiles010[i];
    if(a===current)chain010(mask|(1<<i),b,[...seq,{i,from:a,to:b}]);
    else if(b===current)chain010(mask|(1<<i),a,[...seq,{i,from:b,to:a}]);
  }
}
chain010(0,1,[]);
assert(c010.length===1,'010 not unique');
const a010=c010[0].map(x=>labels010[x.i]).join('');
assert(a010==='EFCGADHB',`010 answer ${a010}`);
report.puzzles['010']={answer:a010,oriented:c010[0].map(x=>`${x.from}-${x.to}`).join(',')};

// 011 · choose five attribute cards
const attrs011={A:['R','C',1],B:['G','T',2],C:['B','S',3],D:['R','T',4],E:['G','S',1],F:['B','C',2],G:['R','S',3],H:['G','C',4],I:['B','T',1],J:['R','C',2],K:['G','T',3],L:['B','S',4]};
const cards011=Object.keys(attrs011);const c011=[];
function comb(arr,k,start=0,prefix=[],out=[]){if(prefix.length===k){out.push(prefix.slice());return out;}for(let i=start;i<arr.length;i++)comb(arr,k,i+1,[...prefix,arr[i]],out);return out;}
for(const chosen of comb(cards011,5)){
 const s=new Set(chosen);const count=(idx,val)=>chosen.filter(x=>attrs011[x][idx]===val).length;const sum=chosen.reduce((n,x)=>n+attrs011[x][2],0);
 if(count(0,'B')!==1)continue;if(s.has('L')&&!s.has('F'))continue;if(count(1,'S')!==2)continue;if(sum!==12)continue;if(count(0,'R')!==1)continue;if(s.has('G')&&!s.has('J'))continue;if(s.has('E')!==s.has('K'))continue;c011.push(chosen.join(''));
}
assert(c011.length===1&&c011[0]==='ACEHK',`011 solutions ${c011}`);
report.puzzles['011']={answer:c011[0],searchSpace:792};

// 012 · weights 1..6 assigned to boxes A-F
const c012=[];
for(const p of permutations([1,2,3,4,5,6])){const [A,B,C,D,E,F]=p;if(A+B+D!==8)continue;if(Math.abs(C-E)!==1)continue;if(!(A>F))continue;if(Math.abs(D-F)!==1)continue;if(A+B+E!==10)continue;c012.push(p);}
assert(c012.length===1&&c012[0].join('')==='416352',`012 solutions ${c012.map(x=>x.join(''))}`);
report.puzzles['012']={answer:{A:4,B:1,C:6,D:3,E:5,F:2},searchSpace:720};

console.log(JSON.stringify({ok:true,...report},null,2));
