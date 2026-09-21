import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {puzzleBatch,visualIds} from '../assets/puzzles-q38-q49-preview-data.mjs';
import {validateAnswer,weighingDeviations} from '../assets/puzzles-q38-q49-answer-model.mjs';

assert.equal(puzzleBatch.length,12);
assert.deepEqual(puzzleBatch.map(p=>p.id),Array.from({length:12},(_,i)=>`quick:${String(38+i).padStart(3,'0')}`));
assert.deepEqual(puzzleBatch.map(p=>p.number),Array.from({length:12},(_,i)=>`Q${38+i}`));
assert.equal(new Set(puzzleBatch.map(p=>p.slug)).size,12);
assert.equal(new Set(puzzleBatch.map(p=>p.title)).size,12);
for(const p of puzzleBatch){
  assert.equal(p.choices.length,4,p.id);
  assert.ok(Number.isInteger(p.answer)&&p.answer>=0&&p.answer<4,p.id);
  assert.ok(p.prompt.length>=70,p.id);
  assert.ok(p.hint.length>=35,p.id);
  assert.ok(p.explanation.length>=90,p.id);
}
const dc=Object.fromEntries(['Легко','Средне','Сложно','Очень сложно'].map(d=>[d,puzzleBatch.filter(p=>p.difficulty===d).length]));
assert.deepEqual(dc,{'Легко':3,'Средне':5,'Сложно':3,'Очень сложно':1});
assert.equal(visualIds.size,6);
assert.deepEqual([...visualIds],['quick:038','quick:040','quick:043','quick:044','quick:048','quick:049']);

// Q40 — deterministic movement.
{
  let x=2,y=2,dir=0; // C3, north. 0=N,1=E,2=S,3=W
  const forward=(n)=>{for(let i=0;i<n;i++){if(dir===0)y++;if(dir===1)x++;if(dir===2)y--;if(dir===3)x--;}};
  forward(2);dir=(dir+1)%4;forward(1);dir=(dir+1)%4;forward(2);
  assert.deepEqual([x,y,dir],[3,2,2]);
  assert.equal(puzzleBatch.find(p=>p.id==='quick:040').choices[0],'D3, на юг');
}

// Q41 — differences are consecutive squares.
{
  const seq=[1,2,6,15,31,56];
  assert.deepEqual(seq.slice(1).map((n,i)=>n-seq[i]),[1,4,9,16,25]);
  assert.equal(seq.at(-1)+36,92);
  const p=puzzleBatch.find(p=>p.id==='quick:041');assert.equal(p.choices[p.answer],'92');
}

// Q43 — unique Hamiltonian route A -> E.
{
  const nodes=['A','B','C','D','E'];
  const edges=new Set(['AB','AC','BC','BD','CE','DE']);
  const adjacent=(a,b)=>edges.has([a,b].sort().join(''));
  const perm=(arr)=>arr.length<=1?[arr]:arr.flatMap((v,i)=>perm([...arr.slice(0,i),...arr.slice(i+1)]).map(r=>[v,...r]));
  const routes=perm(['B','C','D']).map(mid=>['A',...mid,'E']).filter(r=>r.every((v,i)=>i===0||adjacent(r[i-1],v)));
  assert.deepEqual(routes,[['A','C','B','D','E']]);
  const p=puzzleBatch.find(p=>p.id==='quick:043');assert.equal(p.choices[p.answer],'A → C → B → D → E');
}

// Q48 — cube orientation after E,N,N,W.
{
  let f={U:1,D:6,N:2,S:5,E:3,W:4};
  const roll=(d)=>{
    const o={...f};
    if(d==='E')f={U:o.W,D:o.E,E:o.U,W:o.D,N:o.N,S:o.S};
    if(d==='W')f={U:o.E,D:o.W,E:o.D,W:o.U,N:o.N,S:o.S};
    if(d==='N')f={U:o.S,D:o.N,N:o.U,S:o.D,E:o.E,W:o.W};
    if(d==='S')f={U:o.N,D:o.S,N:o.D,S:o.U,E:o.E,W:o.W};
  };
  ['E','N','N','W'].forEach(roll);
  assert.equal(f.U,1);
  const p=puzzleBatch.find(p=>p.id==='quick:048');assert.equal(p.choices[p.answer],'1');
}

// Q49 — one weighing yields eight unique non-zero deviations.
{
  const deviations=[];
  for(let box=1;box<=4;box++)for(const delta of [-1,1])deviations.push(box*delta);
  assert.equal(new Set(deviations).size,8);
  assert.deepEqual([...new Set(deviations)].sort((a,b)=>a-b),[-4,-3,-2,-1,1,2,3,4]);
  const p=puzzleBatch.find(p=>p.id==='quick:049');
  assert.match(p.choices[p.answer],/1 жетон из A, 2 из B, 3 из C и 4 из D/);
}

const html=readFileSync(new URL('../admin/puzzles-q38-q49-preview/index.html',import.meta.url),'utf8');
const runtime=readFileSync(new URL('../assets/puzzles-q38-q49-preview.mjs',import.meta.url),'utf8');
assert.match(html,/noindex,nofollow,noarchive/);
assert.match(html,/Логические игры<br>и головоломки онлайн/);
assert.match(html,/logic-hub\.css\?v=3026adc03868/);
assert.match(html,/logic-expert-seo\.css\?v=3026adc03868/);
assert.match(html,/logic-audience\.css\?v=3026adc03868/);
assert.match(html,/class="logic-header logic-wrap"/);
assert.match(html,/class="logic-seo-hero mlp-puzzle-hero"/);
assert.match(html,/id="puzzleGrid" class="mlq-showcase-grid"/);
assert.match(html,/class="logic-quick-layout"/);
assert.match(runtime,/mlq-showcase-card/);
assert.match(runtime,/logic-choice/);
assert.match(runtime,/visualRhythms/);
assert.match(runtime,/visualRobot/);
assert.match(runtime,/visualRooms/);
assert.match(runtime,/visualXor/);
assert.match(runtime,/visualCube/);
assert.match(runtime,/visualWeighing/);
assert.doesNotMatch(html+runtime,/t\.me|telegram/i);

assert.match(runtime,/thumbRhythms/);
assert.match(runtime,/thumbToken/);
assert.match(runtime,/thumbRobot/);
assert.match(runtime,/thumbNumbers/);
assert.match(runtime,/thumbIndent/);
assert.match(runtime,/thumbRooms/);
assert.match(runtime,/thumbXor/);
assert.match(runtime,/thumbCards/);
assert.match(runtime,/thumbCounter/);
assert.match(runtime,/thumbCoffee/);
assert.match(runtime,/thumbCube/);
assert.match(runtime,/thumbWeighing/);
assert.match(html,/id="puzzleGrid" class="mlq-showcase-grid"/);

console.log(JSON.stringify({ok:true,puzzles:12,visuals:visualIds.size,difficulty:dc,q43Unique:true,q48Top:1,q49States:8,visualCards:12},null,2));

assert.match(runtime,/cardSummary\(p\)\{return p\.prompt;\}/);
assert.match(runtime,/data-solve=/);
assert.match(runtime,/\$\$\('\[data-solve\]'/);
assert.doesNotMatch(runtime,/\$\('\[data-open\]'/);

assert.match(html,/id="answerWidget"/);
assert.match(html,/id="showOptionsBtn"/);
assert.match(html,/id="optionsBox"/);
assert.match(runtime,/renderAnswerWidget/);
assert.match(runtime,/validateCustomAnswer/);
assert.match(runtime,/quick:038/);
assert.match(runtime,/answerState\.route=\['A'\]/);
assert.match(runtime,/set\.has\('K'\).*set\.has\('7'\)/s);
assert.match(runtime,/set\.has\('h'\).*set\.has\('f'\)/s);
assert.match(runtime,/answerState\.cell==='D3'.*answerState\.dir==='S'/s);
assert.match(runtime,/new Set\(vals\)\.size===4/);
assert.match(runtime,/assistance\.options&&selectedOption!==null/);
assert.match(runtime,/mode==='clean'.*решено самостоятельно/s);

{
  const strategy=[1,3,5,8];
  assert.ok(strategy.every(Number.isInteger));
  assert.ok(strategy.every(n=>n>0));
  assert.equal(new Set(strategy).size,4);
  const states=strategy.flatMap((n,i)=>[[-n,i],[n,i]]);
  assert.equal(new Set(states.map(([d])=>d)).size,8);
}

assert.doesNotMatch(runtime,/\$\$\$\(/);
assert.doesNotMatch(runtime,/(?<!\$)\$\('\[data-(?:dir|dot|strokes|cell|facing|room|line|test-card|box-count|solve)/);
assert.doesNotMatch(runtime,/(?<!\$)\$\('\.logic-choice'/);
assert.match(runtime,/\$\$\('\[data-room\]'/);
assert.match(runtime,/\$\$\('\[data-dir\]'/);
assert.match(runtime,/\$\$\('\[data-cell\]'/);
assert.match(runtime,/\$\$\('\[data-line\]'/);
assert.match(runtime,/\$\$\('\[data-test-card\]'/);
assert.match(runtime,/\$\$\('\[data-box-count\]'/);
assert.match(runtime,/\$\$\('\.logic-choice'/);


const correctStates={
  'quick:038':{dir:'right',dot:'tr',strokes:3},
  'quick:039':{excluded:'латунный'},
  'quick:040':{cell:'D3',dir:'S'},
  'quick:041':{number:'92'},
  'quick:042':{stack:['A','B']},
  'quick:043':{route:['A','C','B','D','E']},
  'quick:044':{lines:['h','f']},
  'quick:045':{cards:['K','7']},
  'quick:046':{cycles:'0'},
  'quick:047':{sheetState:'unfolded'},
  'quick:048':{number:'1'},
  'quick:049':{counts:{A:1,B:3,C:5,D:8}}
};
const wrongStates={
  'quick:038':{dir:'left',dot:'tr',strokes:3},
  'quick:039':{excluded:'пластиковый'},
  'quick:040':{cell:'D4',dir:'S'},
  'quick:041':{number:'91'},
  'quick:042':{stack:['B','A']},
  'quick:043':{route:['A','B','C','D','E']},
  'quick:044':{lines:['v','f']},
  'quick:045':{cards:['K','4']},
  'quick:046':{cycles:'1'},
  'quick:047':{sheetState:'folded'},
  'quick:048':{number:'6'},
  'quick:049':{counts:{A:1,B:1,C:3,D:4}}
};
for(const p of puzzleBatch){
  const ok=validateAnswer(p.id,correctStates[p.id]);
  assert.equal(ok.ready,true,`${p.id} correct state should be ready`);
  assert.equal(ok.correct,true,`${p.id} correct state rejected`);
  const bad=validateAnswer(p.id,wrongStates[p.id]);
  assert.equal(bad.ready,true,`${p.id} wrong state should still be checkable`);
  assert.equal(bad.correct,false,`${p.id} wrong state accepted`);
}
assert.deepEqual(weighingDeviations({A:1,B:3,C:5,D:8}).sort((a,b)=>a-b),[-8,-5,-3,-1,1,3,5,8]);

assert.match(runtime,/data-sheet=/);
assert.match(runtime,/data-sheet-state=/);
assert.match(runtime,/id="cycleAnswer"/);
assert.match(runtime,/id="excludedProperty"/);
assert.match(runtime,/validateAnswer\(p\.id,answerState\)/);
