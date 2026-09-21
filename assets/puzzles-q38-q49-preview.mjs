import {puzzleBatch} from './puzzles-q38-q49-preview-data.mjs';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const KEY='ml:puzzles:q38-q49:staging:v2';
const readProgress=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{"solved":[]}')}catch{return{solved:[]}}};
const writeProgress=(state)=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
const solvedSet=()=>new Set(readProgress().solved||[]);
const markSolved=(id)=>{const state=readProgress(),set=new Set(state.solved||[]);set.add(id);state.solved=[...set];writeProgress(state)};

const catalog=$('#catalogView');
const puzzleView=$('#puzzleView');
const grid=$('#puzzleGrid');
const progressText=$('#progressText');
let currentIndex=-1;
let selected=null;
let activeFilter='all';

function arrowGlyph(dir){
  const rotation={up:0,right:90,down:180,left:270}[dir]||0;
  return `<g transform="translate(45 45) rotate(${rotation})"><line x1="0" y1="18" x2="0" y2="-18" stroke="#172230" stroke-width="5" stroke-linecap="round"/><path d="M-9 -9 L0 -20 L9 -9" fill="none" stroke="#172230" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
function rhythmCard(x,y,dir,dot,strokes,label){
  const dots={tl:[20,20],tr:[70,20],br:[70,70],bl:[20,70]};
  const [dx,dy]=dots[dot];
  let bars='';
  for(let i=0;i<strokes;i++)bars+=`<line x1="${31+i*8}" y1="78" x2="${31+i*8}" y2="88" stroke="#a97f3f" stroke-width="4" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y})"><rect width="90" height="96" rx="12" fill="#fffaf0" stroke="#cbbd9d"/>${arrowGlyph(dir)}<circle cx="${dx}" cy="${dy}" r="5" fill="#a97f3f"/>${bars}<text x="45" y="112" text-anchor="middle" fill="#6a6255" font-size="12">${label}</text></g>`;
}
function visualRhythms(){
  return `<div class="mlq-visual" aria-label="Последовательность из пяти карточек и пустой шестой"><svg viewBox="0 0 650 150" role="img">
    ${rhythmCard(5,10,'up','tl',1,'1')}${rhythmCard(110,10,'right','tr',2,'2')}${rhythmCard(215,10,'down','br',3,'3')}${rhythmCard(320,10,'left','bl',1,'4')}${rhythmCard(425,10,'up','tl',2,'5')}
    <g transform="translate(530 10)"><rect width="90" height="96" rx="12" fill="#efe5d1" stroke="#a97f3f" stroke-dasharray="7 6"/><text x="45" y="58" text-anchor="middle" fill="#8b692f" font-size="34" font-family="Georgia">?</text><text x="45" y="112" text-anchor="middle" fill="#6a6255" font-size="12">6</text></g>
  </svg></div>`;
}
function visualRobot(){
  let cells='',labels='';
  const ox=72,oy=22,size=52;
  for(let r=0;r<5;r++)for(let c=0;c<5;c++)cells+=`<rect x="${ox+c*size}" y="${oy+r*size}" width="${size}" height="${size}" fill="${(r+c)%2?'#f6f0e2':'#fffaf0'}" stroke="#cbbd9d"/>`;
  for(let c=0;c<5;c++)labels+=`<text x="${ox+c*size+size/2}" y="305" text-anchor="middle" fill="#665f54" font-size="14">${'ABCDE'[c]}</text>`;
  for(let r=0;r<5;r++)labels+=`<text x="52" y="${oy+(4-r)*size+32}" text-anchor="middle" fill="#665f54" font-size="14">${r+1}</text>`;
  const cx=ox+2*size+size/2,cy=oy+2*size+size/2;
  return `<div class="mlq-visual" aria-label="Поле 5 на 5. Робот в C3 смотрит на север"><svg viewBox="0 0 470 345" role="img">${cells}${labels}
    <g transform="translate(${cx} ${cy})"><circle r="18" fill="#17314c"/><path d="M0 -34 L-9 -19 H9 Z" fill="#d6b16d"/><circle r="4" fill="#f3ead5"/></g>
    <g transform="translate(365 55)" fill="#172230" font-size="14"><text x="0" y="0" font-weight="700">Команды</text><text x="0" y="33">↑ 2 клетки</text><text x="0" y="61">↻ направо</text><text x="0" y="89">↑ 1 клетка</text><text x="0" y="117">↻ направо</text><text x="0" y="145">↑ 2 клетки</text></g>
  </svg></div>`;
}
function visualRooms(){
  const nodes={A:[70,165],B:[210,75],C:[210,255],D:[365,75],E:[365,255]};
  const edges=[['A','B'],['A','C'],['B','C'],['B','D'],['C','E'],['D','E']];
  const lines=edges.map(([a,b])=>`<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" stroke="#8b7d66" stroke-width="5"/>`).join('');
  const circles=Object.entries(nodes).map(([n,[x,y]])=>`<g><circle cx="${x}" cy="${y}" r="34" fill="#17314c" stroke="#d6b16d" stroke-width="3"/><text x="${x}" y="${y+8}" text-anchor="middle" fill="#fffaf0" font-size="24" font-weight="700">${n}</text></g>`).join('');
  return `<div class="mlq-visual" aria-label="Граф из пяти комнат и шести дверей"><svg viewBox="0 0 450 330" role="img">${lines}${circles}<text x="70" y="315" text-anchor="middle" fill="#665f54" font-size="13">старт</text><text x="365" y="315" text-anchor="middle" fill="#665f54" font-size="13">финиш</text></svg></div>`;
}
function symbolLines(lines,x,y,label=''){
  const map={v:[0,-35,0,35],h:[-35,0,35,0],f:[-28,28,28,-28],b:[-28,-28,28,28]};
  return `<g transform="translate(${x} ${y})"><circle r="48" fill="#fffaf0" stroke="#cbbd9d"/>${lines.map(k=>{const a=map[k];return `<line x1="${a[0]}" y1="${a[1]}" x2="${a[2]}" y2="${a[3]}" stroke="#172230" stroke-width="6" stroke-linecap="round"/>`}).join('')}<text x="0" y="70" text-anchor="middle" fill="#665f54" font-size="12">${label}</text></g>`;
}
function visualXor(){
  return `<div class="mlq-visual" aria-label="Два примера исчезающих линий и новая комбинация"><svg viewBox="0 0 560 410" role="img">
    <text x="18" y="27" fill="#8b692f" font-size="12" font-weight="700">ПРИМЕР 1</text>
    ${symbolLines(['v'],90,85,'|')}<text x="155" y="93" fill="#8b692f" font-size="28">+</text>${symbolLines(['v','h'],225,85,'+')}<text x="290" y="93" fill="#8b692f" font-size="28">→</text>${symbolLines(['h'],360,85,'—')}
    <text x="18" y="157" fill="#8b692f" font-size="12" font-weight="700">ПРИМЕР 2</text>
    ${symbolLines(['f','b'],90,215,'X')}<text x="155" y="223" fill="#8b692f" font-size="28">+</text>${symbolLines(['f'],225,215,'/')}<text x="290" y="223" fill="#8b692f" font-size="28">→</text>${symbolLines(['b'],360,215,'\\')}
    <text x="18" y="287" fill="#8b692f" font-size="12" font-weight="700">ВАША ЗАДАЧА</text>
    ${symbolLines(['v','h'],90,345,'+')}<text x="155" y="353" fill="#8b692f" font-size="28">+</text>${symbolLines(['v','f'],225,345,'|/')}<text x="290" y="353" fill="#8b692f" font-size="28">→</text><circle cx="360" cy="345" r="48" fill="#efe5d1" stroke="#a97f3f" stroke-width="2" stroke-dasharray="7 6"/><text x="360" y="357" text-anchor="middle" fill="#8b692f" font-size="36">?</text>
  </svg></div>`;
}
function visualCube(){
  return `<div class="mlq-visual" aria-label="Начальная ориентация куба и четыре направления переката"><svg viewBox="0 0 650 315" role="img">
    <g transform="translate(70 38)">
      <polygon points="110,20 200,62 110,104 20,62" fill="#e8d4a9" stroke="#8b7d66" stroke-width="3"/>
      <polygon points="20,62 110,104 110,210 20,168" fill="#d8c49a" stroke="#8b7d66" stroke-width="3"/>
      <polygon points="110,104 200,62 200,168 110,210" fill="#f5e8ca" stroke="#8b7d66" stroke-width="3"/>
      <text x="110" y="72" text-anchor="middle" fill="#172230" font-size="28" font-weight="700">1</text>
      <text x="65" y="145" text-anchor="middle" fill="#172230" font-size="26" font-weight="700">4</text>
      <text x="155" y="145" text-anchor="middle" fill="#172230" font-size="26" font-weight="700">3</text>
      <text x="110" y="232" text-anchor="middle" fill="#665f54" font-size="13">низ 6 · север 2 · юг 5</text>
    </g>
    <g transform="translate(345 72)" fill="#172230"><text x="0" y="0" font-size="14" font-weight="700">Перекаты</text><g font-size="25" font-weight="700"><text x="0" y="48">E →</text><text x="78" y="48">N ↑</text><text x="156" y="48">N ↑</text><text x="234" y="48">W ←</text></g><text x="0" y="91" font-size="13" fill="#665f54">Какое число окажется сверху?</text></g>
  </svg></div>`;
}
function visualWeighing(){
  const boxes=['A','B','C','D'].map((n,i)=>`<g transform="translate(${28+i*112} 48)"><rect width="88" height="82" rx="9" fill="#e7d4ad" stroke="#8b7d66" stroke-width="3"/><path d="M0 22 H88" stroke="#8b7d66" stroke-width="3"/><text x="44" y="65" text-anchor="middle" fill="#172230" font-size="27" font-weight="700">${n}</text><text x="44" y="106" text-anchor="middle" fill="#665f54" font-size="12">9 / 10 / 11 г?</text></g>`).join('');
  return `<div class="mlq-visual" aria-label="Четыре коробки и одни цифровые весы"><svg viewBox="0 0 650 245" role="img">${boxes}<g transform="translate(502 48)"><rect width="112" height="88" rx="15" fill="#17314c" stroke="#d6b16d" stroke-width="3"/><rect x="21" y="19" width="70" height="31" rx="5" fill="#d8f0d0"/><text x="56" y="41" text-anchor="middle" fill="#1c3a2a" font-size="18" font-family="monospace">?.? g</text><text x="56" y="109" text-anchor="middle" fill="#665f54" font-size="13">одно взвешивание</text></g><text x="320" y="216" text-anchor="middle" fill="#665f54" font-size="13">Нужно определить и коробку, и легче/тяжелее её жетоны.</text></svg></div>`;
}
function visualFor(p){
  if(p.visual==='rhythms')return visualRhythms();
  if(p.visual==='robot')return visualRobot();
  if(p.visual==='rooms')return visualRooms();
  if(p.visual==='xor-lines')return visualXor();
  if(p.visual==='cube')return visualCube();
  if(p.visual==='weighing')return visualWeighing();
  return '';
}

function renderCatalog(){
  const solved=solvedSet();
  const shown=puzzleBatch.filter(p=>activeFilter==='all'||p.difficulty===activeFilter);
  grid.innerHTML=shown.map(p=>`<article class="logic-quick-card ${solved.has(p.id)?'is-solved':''} ${p.featured?'is-featured':''}" data-open="${p.id}" tabindex="0" role="button" aria-label="Открыть ${esc(p.title)}">
    <div class="logic-quick-meta"><span>${esc(p.number)} · ${esc(p.difficulty)}</span><span>${esc(p.time)}</span></div>
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.skill)}</p>
    <span class="logic-card-link">${solved.has(p.id)?'Решено':'Решить →'}</span>
  </article>`).join('');
  progressText.textContent=`${solved.size} из ${puzzleBatch.length} решено`;
  $$('[data-open]',grid).forEach(el=>{
    const open=()=>openPuzzle(puzzleBatch.findIndex(p=>p.id===el.dataset.open));
    el.addEventListener('click',open);
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
  });
}
function resetInteraction(){
  selected=null;
  $('#feedback').className='logic-quick-feedback';
  $('#feedback').textContent='Выберите вариант. Правильный ответ заранее не показывается.';
  $('#hintBox').hidden=true;
  $('#solutionBox').hidden=true;
}
function openPuzzle(index,{push=true}={}){
  if(index<0||index>=puzzleBatch.length)return;
  currentIndex=index;
  resetInteraction();
  const p=puzzleBatch[index];
  catalog.hidden=true;
  puzzleView.hidden=false;
  $('#crumbNumber').textContent=p.number;
  $('#puzzleKicker').textContent=`${p.skill} · ${p.number}`;
  $('#puzzleTitle').textContent=p.title;
  $('#puzzleMeta').innerHTML=`<span>${esc(p.difficulty)}</span><span>${esc(p.time)}</span><span>без регистрации</span>`;
  $('#puzzlePrompt').textContent=p.prompt;
  $('#puzzleVisual').innerHTML=visualFor(p);
  $('#hintText').textContent=p.hint;
  $('#solutionText').textContent=p.explanation;
  $('#choiceList').innerHTML=p.choices.map((c,i)=>`<button class="logic-choice" data-choice="${i}" type="button"><strong>${'ABCD'[i]}.</strong> ${esc(c)}</button>`).join('');
  $$('.logic-choice').forEach(btn=>btn.addEventListener('click',()=>{
    selected=Number(btn.dataset.choice);
    $$('.logic-choice').forEach(x=>x.classList.remove('is-selected','is-wrong','is-correct'));
    btn.classList.add('is-selected');
    $('#feedback').className='logic-quick-feedback';
    $('#feedback').textContent='Версия выбрана. Теперь проверьте её.';
  }));
  $('#prevBtn').disabled=index===0;
  $('#nextBtn').disabled=index===puzzleBatch.length-1;
  if(push)history.pushState(null,'',`#${p.number}`);
  window.scrollTo({top:0,behavior:'instant'});
}
function closePuzzle({push=true}={}){
  puzzleView.hidden=true;
  catalog.hidden=false;
  currentIndex=-1;
  renderCatalog();
  if(push)history.pushState(null,'',location.pathname);
  window.scrollTo({top:0,behavior:'instant'});
}

$('#checkBtn').addEventListener('click',()=>{
  if(currentIndex<0)return;
  const p=puzzleBatch[currentIndex],feedback=$('#feedback');
  if(selected===null){
    feedback.className='logic-quick-feedback is-bad';
    feedback.textContent='Сначала выберите один вариант.';
    return;
  }
  $$('.logic-choice').forEach(x=>x.classList.remove('is-wrong','is-correct'));
  if(selected===p.answer){
    $$('.logic-choice')[selected]?.classList.add('is-correct');
    feedback.className='logic-quick-feedback is-good';
    feedback.textContent='Верно. Решение выдерживает все условия.';
    markSolved(p.id);
  }else{
    $$('.logic-choice')[selected]?.classList.add('is-wrong');
    feedback.className='logic-quick-feedback is-bad';
    feedback.textContent='Пока нет. Проверьте условие ещё раз или откройте подсказку.';
  }
});
$('#hintBtn').addEventListener('click',()=>{$('#hintBox').hidden=!$('#hintBox').hidden});
$('#solutionBtn').addEventListener('click',()=>{$('#solutionBox').hidden=!$('#solutionBox').hidden});
$('#crumbBackBtn').addEventListener('click',()=>closePuzzle());
$('#prevBtn').addEventListener('click',()=>openPuzzle(currentIndex-1));
$('#nextBtn').addEventListener('click',()=>openPuzzle(currentIndex+1));
$$('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
  activeFilter=btn.dataset.filter;
  $$('[data-filter]').forEach(x=>x.classList.toggle('is-active',x===btn));
  renderCatalog();
}));
addEventListener('popstate',()=>{
  const n=(location.hash.match(/^#Q(\d{2})$/)||[])[1];
  if(n){
    const i=puzzleBatch.findIndex(p=>p.number===`Q${n}`);
    if(i>=0)openPuzzle(i,{push:false});
  }else closePuzzle({push:false});
});

renderCatalog();
const initial=(location.hash.match(/^#Q(\d{2})$/)||[])[1];
if(initial){
  const i=puzzleBatch.findIndex(p=>p.number===`Q${initial}`);
  if(i>=0)openPuzzle(i,{push:false});
}
