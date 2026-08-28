#!/usr/bin/env node

const assert=(ok,msg)=>{if(!ok) throw new Error(msg);};
const report={standard:'logic-expert-review-v2-extension',puzzles:{}};

// 013 · Nonogram 10x10
function compositions(total,parts,prefix=[],out=[]){
  if(parts===1){out.push([...prefix,total]);return out;}
  for(let i=0;i<=total;i++) compositions(total-i,parts-1,[...prefix,i],out);
  return out;
}
function linePatterns(n,clue){
  if(clue.length===1&&clue[0]===0)return [Array(n).fill(0)];
  const extra=n-(clue.reduce((a,b)=>a+b,0)+clue.length-1);
  const out=[];
  for(const gaps of compositions(extra,clue.length+1)){
    const row=[];for(let z=0;z<gaps[0];z++)row.push(0);
    for(let i=0;i<clue.length;i++){
      for(let k=0;k<clue[i];k++)row.push(1);
      if(i<clue.length-1)for(let z=0;z<1+gaps[i+1];z++)row.push(0);
    }
    for(let z=0;z<gaps[gaps.length-1];z++)row.push(0);
    assert(row.length===n,'013 pattern length');out.push(row);
  }
  return out;
}
const rows013=[[1,1,1],[2,3],[1,1,2],[1,4],[3,2,1],[4,1],[1,1,2],[1],[1,1],[6]];
const cols013=[[1,1,1,1],[1,1,1],[1,2,1,1],[1,1],[1,2,1],[1,3,1,1],[4,2,1],[3,1],[1,4],[1]];
const rp013=rows013.map(c=>linePatterns(10,c)),cp013=cols013.map(c=>linePatterns(10,c));
const sols013=[];
function solve013(r,grid,colPoss){
  if(sols013.length>1)return;
  if(r===10){sols013.push(grid.map(x=>[...x]));return;}
  for(const row of rp013[r]){
    const next=[];let ok=true;
    for(let c=0;c<10;c++){
      const p=colPoss[c].filter(x=>x[r]===row[c]);if(!p.length){ok=false;break;}next.push(p);
    }
    if(ok)solve013(r+1,[...grid,row],next);
  }
}
solve013(0,[],cp013);
assert(sols013.length===1,'013 not unique');
const a013=sols013[0].map(r=>r.join('')).join('/');
assert(a013==='1000001010/0110011100/1000101100/0010011110/1110110010/0001111010/0010001011/0000010000/1000000100/0111111000',`013 answer ${a013}`);
report.puzzles['013']={answer:a013,unique:true};

// 014 · LOGIC + LOGIC = PUZZLE
function solve014(){
  const words=['LOGIC','LOGIC'],result='PUZZLE';
  const leading=new Set(['L','P']);const used=new Set(),assign={};const sols=[];
  const width=Math.max(result.length,...words.map(x=>x.length));
  function column(col,carry){
    if(col===width){if(carry===0)sols.push({...assign});return;}
    const adds=words.map(w=>col<w.length?w[w.length-1-col]:null);
    const out=col<result.length?result[result.length-1-col]:null;
    const uniq=[...new Set(adds.filter(Boolean))];
    function fill(i){
      if(i<uniq.length){
        const ch=uniq[i];if(assign[ch]!==undefined){fill(i+1);return;}
        for(let d=0;d<=9;d++){
          if(used.has(d)||(d===0&&leading.has(ch)))continue;
          assign[ch]=d;used.add(d);fill(i+1);used.delete(d);delete assign[ch];
        }
        return;
      }
      let sum=carry;for(const ch of adds)if(ch)sum+=assign[ch];
      const digit=sum%10,nextCarry=Math.floor(sum/10);
      if(assign[out]!==undefined){if(assign[out]===digit)column(col+1,nextCarry);return;}
      if(used.has(digit)||(digit===0&&leading.has(out)))return;
      assign[out]=digit;used.add(digit);column(col+1,nextCarry);used.delete(digit);delete assign[out];
    }
    fill(0);
  }
  column(0,0);return sols;
}
const c014=solve014();
assert(c014.length===1,`014 solutions ${c014.length}`);
const s014=c014[0];
const n014=w=>Number([...w].map(ch=>s014[ch]).join(''));
assert(n014('LOGIC')===79436&&n014('PUZZLE')===158872,`014 arithmetic ${n014('LOGIC')} ${n014('PUZZLE')}`);
report.puzzles['014']={answer:Object.fromEntries([...new Set('LOGICPUZLE')].map(ch=>[ch,s014[ch]])),equation:'79436+79436=158872'};

// 015 · Lights Out 5x5, unique minimum
const initial015=['01110','00100','11111','00010','01010'].map(r=>[...r].map(Number));
function press015(board,r,c){for(const [dr,dc] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<5&&cc>=0&&cc<5)board[rr][cc]^=1;}}
const c015=[];
for(let mask=0;mask<32;mask++){
  const b=initial015.map(r=>[...r]),p=[];
  for(let c=0;c<5;c++)if((mask>>c)&1){press015(b,0,c);p.push([0,c]);}
  for(let r=1;r<5;r++)for(let c=0;c<5;c++)if(b[r-1][c]){press015(b,r,c);p.push([r,c]);}
  if(b.every(r=>r.every(x=>x===0)))c015.push(p);
}
assert(c015.length===4,`015 expected four solutions, got ${c015.length}`);
const sorted015=[...c015].sort((a,b)=>a.length-b.length);
assert(sorted015[0].length===8&&sorted015[1].length>8,'015 minimum not unique');
const a015=sorted015[0].map(([r,c])=>`${r+1},${c+1}`).join(';');
assert(a015==='1,3;1,4;2,3;2,4;2,5;3,2;4,3;5,3',`015 answer ${a015}`);
report.puzzles['015']={answer:a015,allSolutionLengths:c015.map(x=>x.length).sort((a,b)=>a-b),uniqueMinimum:true};

// 016 · unique 3-coloring with A and B fixed
const vertices016=[...'ABCDEFGHI'];
const edges016=['AE','BD','BE','BI','CD','CH','DE','DF','DH','DI','EF','FG','GI','HI'].map(x=>[x[0],x[1]]);
function colorings016(edges,limit=3){
  const nbr=Object.fromEntries(vertices016.map(v=>[v,new Set()]));for(const [a,b] of edges){nbr[a].add(b);nbr[b].add(a);}
  const assign={A:0,B:1},sol=[];
  function rec(){
    if(sol.length>=limit)return;
    if(Object.keys(assign).length===vertices016.length){sol.push({...assign});return;}
    const pending=vertices016.filter(v=>assign[v]===undefined);
    pending.sort((x,y)=>[...nbr[y]].filter(n=>assign[n]!==undefined).length-[...nbr[x]].filter(n=>assign[n]!==undefined).length);
    const v=pending[0];
    for(let color=0;color<3;color++)if([...nbr[v]].every(n=>assign[n]!==color)){assign[v]=color;rec();delete assign[v];}
  }
  rec();return sol;
}
const c016=colorings016(edges016,3);assert(c016.length===1,'016 not unique');
const a016=vertices016.map(v=>c016[0][v]).join('');assert(a016==='012021012',`016 answer ${a016}`);
for(let i=0;i<edges016.length;i++)assert(colorings016(edges016.filter((_,j)=>j!==i),2).length>1,`016 edge ${i+1} redundant`);
report.puzzles['016']={answer:a016,allEdgesEssential:true};

// 017 · counterfeit coin, heavy or light
const weigh017=[[new Set('ACF'),new Set('GHI')],[new Set('DEI'),new Set('BFG')],[new Set('CEH'),new Set('DGI')]];
function result017([left,right],coin,delta){let bal=0;if(left.has(coin))bal+=delta;if(right.has(coin))bal-=delta;return Math.sign(bal);}
const states017=[];for(const coin of 'ABCDEFGHI')for(const delta of [-1,1])states017.push({coin,delta,sig:weigh017.map(w=>result017(w,coin,delta))});
assert(new Set(states017.map(s=>s.sig.join(','))).size===18,'017 weighing scheme does not discriminate all states');
const c017=states017.filter(s=>s.sig.join(',')==='1,-1,0');
assert(c017.length===1&&c017[0].coin==='F'&&c017[0].delta===1,'017 wrong diagnosis');
report.puzzles['017']={answer:'F heavy',all18StatesDiscriminated:true};

// 018 · one globally stuck-off seven-segment line
const seg018={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
const obsA018=['b','abdfg','adefg'],obsB018=['adfg','adfg','ab'],obsC018=['ab','adfg','abdg'];
function shown018(d,broken){return [...seg018[d]].filter(x=>x!==broken).sort().join('');}
function candidates018(obs,broken){
  let out=[[]];for(const signature of obs){const ds=[];for(let d=0;d<=9;d++)if(shown018(d,broken)===signature)ds.push(d);out=out.flatMap(p=>ds.map(d=>[...p,d]));}
  return out.filter(x=>x[0]!==0).map(x=>Number(x.join('')));
}
const c018=[];
for(const broken of 'abcdefg'){
  const aa=candidates018(obsA018,broken),bb=candidates018(obsB018,broken),cc=new Set(candidates018(obsC018,broken));
  for(const a of aa)for(const b of bb)if(cc.has(a+b))c018.push({broken,a,b,c:a+b});
}
assert(c018.length===1,'018 not unique');
assert(JSON.stringify(c018[0])===JSON.stringify({broken:'c',a:196,b:557,c:753}),`018 answer ${JSON.stringify(c018[0])}`);
report.puzzles['018']={answer:c018[0]};

// 019 · one logic block always inverts its proper output
function run019(input,fault){
  const [A,B,C,D]=input;let G1=A^B;if(fault==='G1')G1^=1;let G2=C&D;if(fault==='G2')G2^=1;let G3=G1|G2;if(fault==='G3')G3^=1;let G4=B^C;if(fault==='G4')G4^=1;return G3&G4;
}
const tests019=[[[0,0,1,0],1],[[0,0,1,1],0],[[0,1,0,0],1]];
const c019=['G1','G2','G3','G4'].filter(f=>tests019.every(([input,want])=>run019(input,f)===want));
assert(c019.length===1&&c019[0]==='G2',`019 candidates ${c019}`);
const pred019=run019([1,0,1,0],'G2');assert(pred019===1,'019 prediction');
report.puzzles['019']={answer:'G2',prediction:pred019};

// 020 · exact domino tiling by pair multiset
const grid020=[[2,3,2,4,3],[3,0,3,4,1],[3,4,3,2,2],[0,1,3,3,0]];
const cells020=[];for(let r=0;r<4;r++)for(let c=0;c<5;c++)cells020.push([r,c]);
const id020=(r,c)=>r*5+c;
const tilings020=[];
function tile020(remaining,pairs){
  if(remaining.size===0){tilings020.push(pairs.map(x=>x.map(y=>[...y])));return;}
  const id=Math.min(...remaining),r=Math.floor(id/5),c=id%5;
  for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const rr=r+dr,cc=c+dc;if(rr<0||rr>=4||cc<0||cc>=5)continue;const j=id020(rr,cc);if(!remaining.has(j))continue;
    const next=new Set(remaining);next.delete(id);next.delete(j);tile020(next,[...pairs,[[r,c],[rr,cc]]]);
  }
}
tile020(new Set(cells020.map(([r,c])=>id020(r,c))),[]);
assert(tilings020.length===95,`020 tiling universe ${tilings020.length}`);
const target020=new Map([['2-3',2],['3-3',2],['3-4',1],['0-4',1],['1-4',1],['2-2',1],['0-1',1],['0-3',1]]);
function key020(a,b){return a<b?`${a}-${b}`:`${b}-${a}`;}
function match020(t){const m=new Map();for(const [a,b] of t){const k=key020(grid020[a[0]][a[1]],grid020[b[0]][b[1]]);m.set(k,(m.get(k)||0)+1);}if(m.size!==target020.size)return false;for(const [k,v] of target020)if(m.get(k)!==v)return false;return true;}
const c020=tilings020.filter(match020);assert(c020.length===1,`020 solutions ${c020.length}`);
const a020=c020[0].map(([a,b])=>`(${a[0]+1},${a[1]+1})-(${b[0]+1},${b[1]+1})`).join(';');
report.puzzles['020']={answer:a020,tilingSearchSpace:tilings020.length,unique:true};

console.log(JSON.stringify(report,null,2));
