import {puzzleBatch} from './puzzles-q38-q49-preview-data.mjs';
import {validateAnswer} from './puzzles-q38-q49-answer-model.mjs';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const KEY='ml:puzzles:q38-q49:staging:v3';
const readProgress=()=>{
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'{}');
    return {solved:Array.isArray(raw.solved)?raw.solved:[],results:raw.results&&typeof raw.results==='object'?raw.results:{}};
  }catch{return{solved:[],results:{}}}
};
const writeProgress=(state)=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
const solvedSet=()=>new Set(readProgress().solved||[]);
const markSolved=(id,mode)=>{
  const state=readProgress(),set=new Set(state.solved||[]);
  set.add(id);state.solved=[...set];state.results={...(state.results||{}),[id]:mode};
  writeProgress(state);
};

const catalog=$('#catalogView');
const puzzleView=$('#puzzleView');
const grid=$('#puzzleGrid');
const progressText=$('#progressText');
let currentIndex=-1;
let selectedOption=null;
let answerState={};
let assistance={hint:false,options:false,solution:false};
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

function thumbFrame(inner,label=''){
  return `<div class="mlq-card-art"><svg viewBox="0 0 520 205" role="img" aria-label="${esc(label)}">
    <defs>
      <linearGradient id="desk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17324d"/><stop offset="1" stop-color="#091a2a"/></linearGradient>
      <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4ead1"/><stop offset="1" stop-color="#dfc99d"/></linearGradient>
      <radialGradient id="warm" cx=".85" cy=".15" r=".7"><stop offset="0" stop-color="#c49a50" stop-opacity=".32"/><stop offset="1" stop-color="#c49a50" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="520" height="205" fill="url(#desk)"/>
    <rect width="520" height="205" fill="url(#warm)"/>
    ${inner}
  </svg></div>`;
}
function miniCard(x,y,dir,dot,strokes){
  const rot={up:0,right:90,down:180,left:270}[dir]||0;
  const dots={tl:[12,12],tr:[53,12],br:[53,58],bl:[12,58]};const [dx,dy]=dots[dot];
  let bars='';for(let i=0;i<strokes;i++)bars+=`<line x1="${20+i*8}" y1="62" x2="${20+i*8}" y2="72" stroke="#9f783d" stroke-width="3" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y})"><rect width="65" height="80" rx="9" fill="url(#paper)" stroke="#cab483"/><g transform="translate(32.5 36) rotate(${rot})"><line x1="0" y1="13" x2="0" y2="-13" stroke="#172230" stroke-width="4" stroke-linecap="round"/><path d="M-7 -7 L0 -16 L7 -7" fill="none" stroke="#172230" stroke-width="4" stroke-linejoin="round"/></g><circle cx="${dx}" cy="${dy}" r="4" fill="#9f783d"/>${bars}</g>`;
}
function thumbRhythms(){
  const inner=`${miniCard(38,62,'up','tl',1)}${miniCard(116,62,'right','tr',2)}${miniCard(194,62,'down','br',3)}${miniCard(272,62,'left','bl',1)}${miniCard(350,62,'up','tl',2)}<g transform="translate(428 62)"><rect width="65" height="80" rx="9" fill="none" stroke="#d6b16d" stroke-width="2" stroke-dasharray="7 5"/><text x="32" y="52" text-anchor="middle" fill="#e9d49d" font-size="30">?</text></g>`;
  return thumbFrame(inner,'Три ритма');
}
function thumbToken(){
  const inner=`<g transform="translate(115 30)"><circle cx="120" cy="72" r="60" fill="#b98c45" stroke="#e6c77c" stroke-width="5"/><circle cx="120" cy="72" r="42" fill="#8d672f"/><path d="M120 45 L148 92 H92 Z" fill="none" stroke="#f5e6bf" stroke-width="6" stroke-linejoin="round"/><circle cx="120" cy="72" r="8" fill="#0d2134"/></g><g transform="translate(330 48)"><path d="M35 10 C4 10 4 84 35 84" fill="none" stroke="#cbd8e4" stroke-width="18"/><path d="M82 10 C113 10 113 84 82 84" fill="none" stroke="#cbd8e4" stroke-width="18"/><rect x="24" y="0" width="22" height="28" rx="4" fill="#cf665f"/><rect x="72" y="0" width="22" height="28" rx="4" fill="#4e80bd"/><path d="M58 72 L58 103" stroke="#d6b16d" stroke-width="3"/><path d="M49 94 L58 106 L67 94" fill="none" stroke="#d6b16d" stroke-width="3"/></g>`;
  return thumbFrame(inner,'Магнитный жетон');
}
function thumbRobot(){
  let cells='';const ox=70,oy=28,s=30;for(let r=0;r<5;r++)for(let c=0;c<5;c++)cells+=`<rect x="${ox+c*s}" y="${oy+r*s}" width="${s}" height="${s}" fill="${(r+c)%2?'#16314c':'#0d253b'}" stroke="#54708a"/>`;
  const inner=`${cells}<g transform="translate(${ox+2*s+s/2} ${oy+2*s+s/2})"><circle r="13" fill="#d6b16d"/><circle r="6" fill="#17314c"/><path d="M0 -28 L-8 -16 H8 Z" fill="#f1dfb1"/></g><g transform="translate(295 40)" fill="#dce6ed" font-size="15"><text x="0" y="0" font-weight="700">C3 · север</text><text x="0" y="34">↑↑  ↻  ↑  ↻  ↑↑</text><text x="0" y="75" fill="#9fb0c0">Где окажется робот?</text></g>`;
  return thumbFrame(inner,'Маршрут робота');
}
function thumbNumbers(){
  const nums=[1,2,6,15,31,56,'?'];const xs=[35,105,175,245,315,385,455];
  const inner=nums.map((n,i)=>`<g><circle cx="${xs[i]}" cy="92" r="25" fill="${i===6?'#2a4157':'#e5cf9d'}" stroke="#d6b16d" stroke-width="2"/><text x="${xs[i]}" y="100" text-anchor="middle" fill="${i===6?'#f2dfad':'#172230'}" font-size="19" font-weight="700">${n}</text></g>`).join('')+
  `<g fill="#d6b16d" font-size="13"><text x="70" y="145" text-anchor="middle">+1</text><text x="140" y="145" text-anchor="middle">+4</text><text x="210" y="145" text-anchor="middle">+9</text><text x="280" y="145" text-anchor="middle">+16</text><text x="350" y="145" text-anchor="middle">+25</text><text x="420" y="145" text-anchor="middle">+?</text></g>`;
  return thumbFrame(inner,'Квадраты между числами');
}
function thumbIndent(){
  const inner=`<g transform="translate(80 35) rotate(-5 130 65)"><rect width="250" height="130" rx="8" fill="#f0e5ca" stroke="#c9b486"/><path d="M38 38 C75 25 116 49 164 34 M43 58 C86 46 132 69 197 51 M39 81 C91 66 140 91 211 72" fill="none" stroke="#3a4350" stroke-width="4" stroke-linecap="round"/><path d="M72 102 C112 88 152 113 191 98" fill="none" stroke="#3a4350" stroke-width="4"/></g><g transform="translate(190 50) rotate(4 130 65)"><rect width="250" height="130" rx="8" fill="#e6dbc0" stroke="#b9a57a"/><path d="M38 38 C75 25 116 49 164 34 M43 58 C86 46 132 69 197 51 M39 81 C91 66 140 91 211 72" fill="none" stroke="#766e60" stroke-width="2.5" stroke-dasharray="3 3"/><path d="M72 102 C112 88 152 113 191 98" fill="none" stroke="#766e60" stroke-width="2.5" stroke-dasharray="3 3"/></g>`;
  return thumbFrame(inner,'Следы без чернил');
}
function thumbRooms(){
  const n={A:[80,102],B:[205,45],C:[205,158],D:[360,45],E:[360,158]};const e=[['A','B'],['A','C'],['B','C'],['B','D'],['C','E'],['D','E']];
  const lines=e.map(([a,b])=>`<line x1="${n[a][0]}" y1="${n[a][1]}" x2="${n[b][0]}" y2="${n[b][1]}" stroke="#9db0c1" stroke-width="4"/>`).join('');
  const circles=Object.entries(n).map(([k,[x,y]])=>`<g><circle cx="${x}" cy="${y}" r="24" fill="#e4cf9d" stroke="#d6b16d" stroke-width="2"/><text x="${x}" y="${y+7}" text-anchor="middle" fill="#172230" font-size="19" font-weight="700">${k}</text></g>`).join('');
  return thumbFrame(lines+circles,'Пять комнат');
}
function thumbXor(){
  const inner=`<g stroke="#f1dfb1" stroke-width="6" stroke-linecap="round"><line x1="92" y1="58" x2="92" y2="124"/><line x1="180" y1="58" x2="180" y2="124"/><line x1="147" y1="91" x2="213" y2="91"/><line x1="355" y1="58" x2="355" y2="124"/><line x1="322" y1="91" x2="388" y2="91"/><line x1="421" y1="58" x2="487" y2="124"/></g><g fill="#d6b16d" font-size="31"><text x="124" y="101">+</text><text x="235" y="101">→</text><text x="403" y="101">+</text><text x="484" y="101">?</text></g><text x="260" y="165" text-anchor="middle" fill="#9fb0c0" font-size="14">Общие линии исчезают</text>`;
  return thumbFrame(inner,'Исчезающие линии');
}
function thumbCards(){
  const vals=['K','M','4','7'];const xs=[65,170,275,380];
  const inner=vals.map((v,i)=>`<g transform="translate(${xs[i]} 36) rotate(${i%2?-3:3} 42 62)"><rect width="84" height="124" rx="9" fill="#f1e5c9" stroke="#d6b16d" stroke-width="2"/><text x="42" y="75" text-anchor="middle" fill="#172230" font-size="36" font-family="Georgia" font-weight="700">${v}</text></g>`).join('')+`<path d="M70 178 H455" stroke="#9db0c1" stroke-width="2" stroke-dasharray="7 6"/><text x="260" y="198" text-anchor="middle" fill="#b6c4d1" font-size="13">Какие перевернуть, чтобы попытаться опровергнуть правило?</text>`;
  return thumbFrame(inner,'Какие карточки перевернуть');
}
function thumbCounter(){
  const inner=`<g transform="translate(88 45)"><rect width="335" height="118" rx="18" fill="#273846" stroke="#71879b" stroke-width="3"/><rect x="38" y="26" width="258" height="58" rx="9" fill="#080e14" stroke="#d6b16d" stroke-width="2"/><text x="167" y="70" text-anchor="middle" fill="#f1d687" font-size="44" font-family="monospace" letter-spacing="10">8421</text><circle cx="310" cy="55" r="10" fill="#639873"/><text x="167" y="108" text-anchor="middle" fill="#adbdc9" font-size="13">12:00 → 13:00 · без изменения</text></g>`;
  return thumbFrame(inner,'Счётчик не сдвинулся');
}
function thumbCoffee(){
  const inner=`<g transform="translate(75 25) rotate(-4 170 75)"><rect width="340" height="150" rx="8" fill="#efe3c8" stroke="#c6b181"/><path d="M170 0 V150" stroke="#b9a276" stroke-width="2" stroke-dasharray="7 6"/><circle cx="170" cy="75" r="52" fill="none" stroke="#7b4d2b" stroke-width="10" opacity=".82"/><path d="M178 27 C207 36 222 52 226 78" fill="none" stroke="#9a6845" stroke-width="4" opacity=".65"/></g><path d="M442 59 C478 67 491 99 475 127 C462 151 428 155 410 136" fill="none" stroke="#d6b16d" stroke-width="4"/><text x="456" y="101" text-anchor="middle" fill="#e9d9b5" font-size="13">след чашки</text>`;
  return thumbFrame(inner,'Кофейный круг');
}
function thumbCube(){
  const inner=`<g transform="translate(95 25)"><polygon points="110,20 200,62 110,104 20,62" fill="#e6d2a4" stroke="#9b8358" stroke-width="3"/><polygon points="20,62 110,104 110,190 20,148" fill="#cdb888" stroke="#9b8358" stroke-width="3"/><polygon points="110,104 200,62 200,148 110,190" fill="#f1e2bc" stroke="#9b8358" stroke-width="3"/><text x="110" y="70" text-anchor="middle" fill="#172230" font-size="27" font-weight="700">1</text><text x="64" y="139" text-anchor="middle" fill="#172230" font-size="25" font-weight="700">4</text><text x="154" y="139" text-anchor="middle" fill="#172230" font-size="25" font-weight="700">3</text></g><g transform="translate(335 56)" fill="#e7d4a2"><text x="0" y="0" font-size="15" font-weight="700">E → N ↑ N ↑ W ←</text><text x="0" y="42" font-size="13" fill="#aebdcc">Что окажется сверху?</text></g>`;
  return thumbFrame(inner,'Куб в коридоре');
}
function thumbWeighing(){
  const boxes=['A','B','C','D'].map((k,i)=>`<g transform="translate(${34+i*92} 67)"><rect width="72" height="65" rx="7" fill="#ba874a" stroke="#e0bd78" stroke-width="2"/><path d="M0 18 H72" stroke="#81592f" stroke-width="2"/><circle cx="18" cy="8" r="6" fill="#d6b16d"/><circle cx="35" cy="10" r="6" fill="#d6b16d"/><circle cx="52" cy="8" r="6" fill="#d6b16d"/><text x="36" y="52" text-anchor="middle" fill="#172230" font-size="21" font-weight="700">${k}</text></g>`).join('');
  const inner=boxes+`<g transform="translate(414 48)"><rect width="78" height="92" rx="12" fill="#273846" stroke="#8ca0b2" stroke-width="2"/><rect x="14" y="18" width="50" height="25" rx="4" fill="#d5ead1"/><text x="39" y="36" text-anchor="middle" fill="#23402d" font-family="monospace" font-size="14">?.?g</text><rect x="17" y="52" width="44" height="8" rx="4" fill="#1b2833"/><circle cx="27" cy="74" r="5" fill="#d6b16d"/><circle cx="51" cy="74" r="5" fill="#7890a5"/></g><text x="260" y="174" text-anchor="middle" fill="#b5c2ce" font-size="13">Одно взвешивание. Восемь возможных состояний.</text>`;
  return thumbFrame(inner,'Одно взвешивание');
}
function thumbFor(p){
  if(p.id==='quick:038')return thumbRhythms();
  if(p.id==='quick:039')return thumbToken();
  if(p.id==='quick:040')return thumbRobot();
  if(p.id==='quick:041')return thumbNumbers();
  if(p.id==='quick:042')return thumbIndent();
  if(p.id==='quick:043')return thumbRooms();
  if(p.id==='quick:044')return thumbXor();
  if(p.id==='quick:045')return thumbCards();
  if(p.id==='quick:046')return thumbCounter();
  if(p.id==='quick:047')return thumbCoffee();
  if(p.id==='quick:048')return thumbCube();
  if(p.id==='quick:049')return thumbWeighing();
  return thumbFrame('','Головоломка');
}
function difficultyClass(d){return d==='Очень сложно'?'very-hard':d==='Сложно'?'hard':d==='Средне'?'medium':'easy'}
function cardSummary(p){return p.prompt;}

function modeLabel(mode){
  return mode==='clean'?'самостоятельно':mode==='hint'?'с подсказкой':mode==='options'?'с вариантами':mode==='solution'?'решение открыто':'самостоятельно';
}
function currentMode(){
  if(assistance.solution)return 'solution';
  if(assistance.options)return 'options';
  if(assistance.hint)return 'hint';
  return 'clean';
}
function updateModeBadge(){
  const badge=$('#answerModeBadge');
  if(!badge)return;
  const mode=currentMode();
  badge.textContent=modeLabel(mode);
  badge.dataset.mode=mode;
}
function choiceGroup(title,buttons,attr){
  return `<div class="mlq-answer-group"><span class="mlq-answer-label">${esc(title)}</span><div class="mlq-segmented">${buttons.map(([value,label])=>`<button type="button" data-${attr}="${esc(value)}">${label}</button>`).join('')}</div></div>`;
}
function setSelected(selector,value){
  $$(selector,$('#answerWidget')).forEach(btn=>btn.classList.toggle('is-selected',btn.dataset[Object.keys(btn.dataset)[0]]===String(value)));
}
function renderAnswerWidget(p){
  const box=$('#answerWidget');
  selectedOption=null;
  answerState={};

  if(p.id==='quick:038'){
    answerState={dir:null,dot:null,strokes:null};
    box.innerHTML=
      choiceGroup('Направление',[['up','↑'],['right','→'],['down','↓'],['left','←']],'dir')+
      choiceGroup('Положение точки',[['tl','↖'],['tr','↗'],['br','↘'],['bl','↙']],'dot')+
      choiceGroup('Штрихи',[['1','I'],['2','II'],['3','III']],'strokes');
    $$('[data-dir]',box).forEach(b=>b.addEventListener('click',()=>{answerState.dir=b.dataset.dir;$$('[data-dir]',box).forEach(x=>x.classList.toggle('is-selected',x===b))}));
    $$('[data-dot]',box).forEach(b=>b.addEventListener('click',()=>{answerState.dot=b.dataset.dot;$$('[data-dot]',box).forEach(x=>x.classList.toggle('is-selected',x===b))}));
    $$('[data-strokes]',box).forEach(b=>b.addEventListener('click',()=>{answerState.strokes=Number(b.dataset.strokes);$$('[data-strokes]',box).forEach(x=>x.classList.toggle('is-selected',x===b))}));
    return;
  }

  if(p.id==='quick:039'){
    answerState={excluded:''};
    box.innerHTML=`<label class="mlq-complete-answer"><span>Завершите вывод</span><div class="mlq-complete-row"><strong>X не</strong><input id="excludedProperty" type="text" autocomplete="off" placeholder="какой?"><strong>.</strong></div></label><p class="mlq-answer-help">Назовите свойство, которое условия позволяют исключить наверняка.</p>`;
    $('#excludedProperty').addEventListener('input',e=>{answerState.excluded=e.target.value});
    return;
  }

  if(p.id==='quick:042'){
    answerState={stack:[]};
    box.innerHTML=`<div class="mlq-answer-group"><span class="mlq-answer-label">Соберите стопку в момент письма — сверху вниз</span><div id="sheetStack" class="mlq-sheet-stack"><span class="mlq-stack-empty">сверху</span><span class="mlq-stack-arrow">↓</span><span class="mlq-stack-empty">снизу</span></div><div class="mlq-sheet-buttons"><button type="button" data-sheet="A">Лист A · записка</button><button type="button" data-sheet="B">Лист B · чистый</button></div><button id="sheetReset" class="mlq-inline-reset" type="button">Сбросить стопку</button></div>`;
    const paint=()=>{
      const top=answerState.stack[0]||null,bottom=answerState.stack[1]||null;
      $('#sheetStack').innerHTML=`<span class="${top?'mlq-stack-sheet':'mlq-stack-empty'}">${top?('Лист '+top):'сверху'}</span><span class="mlq-stack-arrow">↓</span><span class="${bottom?'mlq-stack-sheet':'mlq-stack-empty'}">${bottom?('Лист '+bottom):'снизу'}</span>`;
      $('[data-sheet]',box).forEach(b=>b.disabled=answerState.stack.includes(b.dataset.sheet)||answerState.stack.length>=2);
    };
    $('[data-sheet]',box).forEach(b=>b.addEventListener('click',()=>{if(answerState.stack.length<2&&!answerState.stack.includes(b.dataset.sheet)){answerState.stack.push(b.dataset.sheet);paint()}}));
    $('#sheetReset').addEventListener('click',()=>{answerState.stack=[];paint()});
    paint();
    return;
  }

  if(p.id==='quick:046'){
    answerState={cycles:''};
    box.innerHTML=`<label class="mlq-number-answer"><span>Сколько полных рабочих циклов точно произошло с 12:00 до 13:00?</span><input id="cycleAnswer" inputmode="numeric" type="number" min="0" step="1" autocomplete="off"></label><p class="mlq-answer-help">Отвечайте только о том, что непосредственно измеряет счётчик.</p>`;
    $('#cycleAnswer').addEventListener('input',e=>{answerState.cycles=e.target.value});
    return;
  }

  if(p.id==='quick:047'){
    answerState={sheetState:null};
    box.innerHTML=`<div class="mlq-answer-group"><span class="mlq-answer-label">В каком состоянии был лист в момент появления кофейного круга?</span><div class="mlq-fold-state"><button type="button" data-sheet-state="folded"><span class="mlq-fold-icon folded"></span><strong>Сложен</strong></button><button type="button" data-sheet-state="unfolded"><span class="mlq-fold-icon unfolded"></span><strong>Развёрнут</strong></button></div><p class="mlq-answer-help">Смотрите на то, могла ли чашка физически коснуться обеих частей круга.</p></div>`;
    $('[data-sheet-state]',box).forEach(b=>b.addEventListener('click',()=>{answerState.sheetState=b.dataset.sheetState;$('[data-sheet-state]',box).forEach(x=>x.classList.toggle('is-selected',x===b))}));
    return;
  }

  if(p.id==='quick:040'){
    answerState={cell:null,dir:null};
    const cells=[];
    for(let row=5;row>=1;row--)for(const col of ['A','B','C','D','E'])cells.push(`${col}${row}`);
    box.innerHTML=`<div class="mlq-answer-group"><span class="mlq-answer-label">Конечная клетка</span><div class="mlq-cell-grid">${cells.map(c=>`<button type="button" data-cell="${c}">${c}</button>`).join('')}</div></div>`+
      choiceGroup('Куда смотрит робот?',[['N','↑ север'],['E','→ восток'],['S','↓ юг'],['W','← запад']],'facing');
    $$('[data-cell]',box).forEach(b=>b.addEventListener('click',()=>{answerState.cell=b.dataset.cell;$$('[data-cell]',box).forEach(x=>x.classList.toggle('is-selected',x===b))}));
    $$('[data-facing]',box).forEach(b=>b.addEventListener('click',()=>{answerState.dir=b.dataset.facing;$$('[data-facing]',box).forEach(x=>x.classList.toggle('is-selected',x===b))}));
    return;
  }

  if(['quick:041','quick:048'].includes(p.id)){
    answerState={number:''};
    const label=p.id==='quick:041'?'Следующее число':'Число на верхней грани';
    box.innerHTML=`<label class="mlq-number-answer"><span>${label}</span><input id="numberAnswer" inputmode="numeric" type="number" autocomplete="off"></label>`;
    $('#numberAnswer').addEventListener('input',e=>{answerState.number=e.target.value});
    return;
  }

  if(p.id==='quick:043'){
    answerState={route:['A']};
    box.innerHTML=`<div class="mlq-answer-group"><span class="mlq-answer-label">Постройте маршрут</span><div id="routePath" class="mlq-route-path">A</div><div class="mlq-room-buttons">${['B','C','D','E'].map(r=>`<button type="button" data-room="${r}">${r}</button>`).join('')}</div><button id="routeReset" class="mlq-inline-reset" type="button">Сбросить маршрут</button></div>`;
    const paint=()=>{$('#routePath').textContent=answerState.route.join(' → ');$$('[data-room]',box).forEach(b=>b.disabled=answerState.route.includes(b.dataset.room))};
    $$('[data-room]',box).forEach(b=>b.addEventListener('click',()=>{if(answerState.route.length<5&&!answerState.route.includes(b.dataset.room)){answerState.route.push(b.dataset.room);paint()}}));
    $('#routeReset').addEventListener('click',()=>{answerState.route=['A'];paint()});
    paint();
    return;
  }

  if(p.id==='quick:044'){
    answerState={lines:new Set()};
    const lines=[['v','│'],['h','—'],['f','╱'],['b','╲']];
    box.innerHTML=`<div class="mlq-answer-group"><span class="mlq-answer-label">Какие линии останутся?</span><div class="mlq-line-builder">${lines.map(([v,l])=>`<button type="button" data-line="${v}">${l}</button>`).join('')}</div><p class="mlq-answer-help">Нажмите на все линии, которые должны присутствовать в результате.</p></div>`;
    $$('[data-line]',box).forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.line;if(answerState.lines.has(v))answerState.lines.delete(v);else answerState.lines.add(v);b.classList.toggle('is-selected',answerState.lines.has(v))}));
    return;
  }

  if(p.id==='quick:045'){
    answerState={cards:new Set()};
    box.innerHTML=`<div class="mlq-answer-group"><span class="mlq-answer-label">Какие карточки перевернуть?</span><div class="mlq-test-cards">${['K','M','4','7'].map(v=>`<button type="button" data-test-card="${v}">${v}</button>`).join('')}</div><p class="mlq-answer-help">Можно выбрать несколько карточек.</p></div>`;
    $$('[data-test-card]',box).forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.testCard;if(answerState.cards.has(v))answerState.cards.delete(v);else answerState.cards.add(v);b.classList.toggle('is-selected',answerState.cards.has(v))}));
    return;
  }

  if(p.id==='quick:049'){
    answerState={counts:{A:'',B:'',C:'',D:''}};
    box.innerHTML=`<div class="mlq-answer-group"><span class="mlq-answer-label">Сколько жетонов взять из каждой коробки?</span><div class="mlq-weigh-inputs">${['A','B','C','D'].map(k=>`<label><span>${k}</span><input data-box-count="${k}" type="number" min="0" step="1" inputmode="numeric" autocomplete="off"></label>`).join('')}</div><p class="mlq-answer-help">Допускается любая стратегия, которая гарантированно различает все 8 случаев.</p></div>`;
    $$('[data-box-count]',box).forEach(inp=>inp.addEventListener('input',()=>{answerState.counts[inp.dataset.boxCount]=inp.value}));
    return;
  }

  box.innerHTML='<p>Для этой задачи пока нет собственного формата ответа.</p>';
}
function validateCustomAnswer(p){
  return validateAnswer(p.id,answerState);
}
function renderFallbackOptions(p){
  $('#choiceList').innerHTML=p.choices.map((c,i)=>`<button class="logic-choice" data-choice="${i}" type="button"><strong>${'ABCD'[i]}.</strong> ${esc(c)}</button>`).join('');
  $$('.logic-choice',$('#choiceList')).forEach(btn=>btn.addEventListener('click',()=>{
    selectedOption=Number(btn.dataset.choice);
    $$('.logic-choice',$('#choiceList')).forEach(x=>x.classList.toggle('is-selected',x===btn));
  }));
}
function renderCatalog(){
  const solved=solvedSet();
  const shown=puzzleBatch.filter(p=>activeFilter==='all'||p.difficulty===activeFilter);
  grid.innerHTML=shown.map(p=>`<article class="mlq-showcase-card ${solved.has(p.id)?'is-solved':''} ${p.featured?'is-featured':''}">
    ${thumbFor(p)}
    <div class="mlq-card-body">
      <div class="mlq-card-top"><span class="mlq-card-number">${esc(p.number)}</span><span>◷ ${esc(p.time)}</span></div>
      <div class="mlq-card-tags"><span class="mlq-tag skill">${esc(p.skill)}</span><span class="mlq-tag ${difficultyClass(p.difficulty)}">${esc(p.difficulty)}</span></div>
      <h3 class="mlq-card-title">${esc(p.title)}</h3>
      <p class="mlq-card-copy">${esc(cardSummary(p))}</p>
      <button class="mlq-card-action" data-solve="${p.id}" type="button">${solved.has(p.id)?'Открыть снова':'Решить онлайн →'}</button>
    </div>
  </article>`).join('');
  progressText.textContent=`${solved.size} из ${puzzleBatch.length} решено`;
  $$('[data-solve]',grid).forEach(btn=>{
    btn.addEventListener('click',()=>{
      const index=puzzleBatch.findIndex(p=>p.id===btn.dataset.solve);
      openPuzzle(index);
    });
  });
}
function resetInteraction(){
  selectedOption=null;
  answerState={};
  assistance={hint:false,options:false,solution:false};
  $('#feedback').className='logic-quick-feedback';
  $('#feedback').textContent='Сначала сформулируйте или соберите собственный ответ.';
  $('#hintBox').hidden=true;
  $('#optionsBox').hidden=true;
  $('#solutionBox').hidden=true;
  $('#showOptionsBtn').hidden=false;
  $('#solutionBtn').hidden=false;
  updateModeBadge();
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
  renderAnswerWidget(p);
  renderFallbackOptions(p);
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
  let result;

  if(assistance.options&&selectedOption!==null){
    result={ready:true,correct:selectedOption===p.answer};
  }else{
    result=validateCustomAnswer(p);
  }

  if(!result.ready){
    feedback.className='logic-quick-feedback is-bad';
    feedback.textContent=assistance.options?'Выберите вариант или заполните собственный ответ.':'Ответ пока не завершён.';
    return;
  }

  if(result.correct){
    const mode=currentMode();
    feedback.className='logic-quick-feedback is-good';
    feedback.textContent=
      mode==='clean'?'Верно — решено самостоятельно.':
      mode==='hint'?'Верно — с подсказкой.':
      mode==='options'?'Верно — с открытыми вариантами.':
      'Ответ верный, но разбор уже был открыт.';
    markSolved(p.id,mode);
  }else{
    feedback.className='logic-quick-feedback is-bad';
    feedback.textContent='Пока нет. Проверьте ход рассуждения или воспользуйтесь следующим уровнем помощи.';
  }
});
$('#hintBtn').addEventListener('click',()=>{
  assistance.hint=true;
  $('#hintBox').hidden=!$('#hintBox').hidden;
  updateModeBadge();
});
$('#showOptionsBtn').addEventListener('click',()=>{
  assistance.options=true;
  $('#optionsBox').hidden=false;
  $('#showOptionsBtn').hidden=true;
  updateModeBadge();
});
$('#solutionBtn').addEventListener('click',()=>{
  assistance.solution=true;
  $('#solutionBox').hidden=false;
  $('#solutionBtn').hidden=true;
  updateModeBadge();
});
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
