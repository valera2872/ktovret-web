import {items,scales} from './cognitive-profile-preview-data.mjs';

const $=s=>document.querySelector(s);
const state={index:0,answers:Array(items.length).fill(null),startedAt:null,answerTimes:Array(items.length).fill(null),visits:Array(items.length).fill(0)};
let timer=null;

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shape=(kind,x,y,size,{fill='none',stroke='#17212a',sw=4}={})=>{
  if(kind==='circle')return `<circle cx="${x}" cy="${y}" r="${size/2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const sides={triangle:3,square:4,pentagon:5,hexagon:6,octagon:8}[kind]||4;
  const pts=Array.from({length:sides},(_,i)=>{const a=-Math.PI/2+i*2*Math.PI/sides;return `${x+Math.cos(a)*size/2},${y+Math.sin(a)*size/2}`}).join(' ');
  return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
};
const dot=(x,y,r=6)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#d08c32"/>`;
const cell=(x,y,w=120,h=100)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff" stroke="#c5c0b7"/>`;
const svg=(body,w=520,h=270)=>`<div class="ml-visual"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Схема задания">${body}</svg></div>`;

function visual(id){
  if(id==='P1'){
    let b='';[[40,30],[180,30],[40,140],[180,140]].forEach(([x,y])=>b+=cell(x,y,110,90));
    b+=shape('circle',95,75,50)+shape('circle',235,75,50,{fill:'#17212a'})+shape('square',95,185,50)+`<text x="235" y="197" text-anchor="middle" font-size="54" font-weight="800" fill="#17212a">?</text>`;return svg(b,330,250);
  }
  if(id==='S1'){
    const base=`${cell(25,30,135,135)}<path d="M58 62h34v34h34v34H58z" fill="#3d607d"/><circle cx="75" cy="78" r="7" fill="#e2a74a"/><text x="190" y="105" font-size="34" fill="#17212a">→ 90° ↻</text>`;
    const mini=(x,y,path,cx,cy,label)=>`${cell(x,y,100,100)}<path d="${path}" fill="#3d607d"/><circle cx="${cx}" cy="${cy}" r="5" fill="#e2a74a"/><text x="${x+50}" y="${y+122}" text-anchor="middle" font-size="15" fill="#17212a">${label}</text>`;
    return svg(base+mini(310,20,'M330 40h60v20h-40v40h-20z',380,50,'A')+mini(430,20,'M450 40h20v40h40v20h-60z',460,50,'B')+mini(310,150,'M330 170h20v40h40v20h-60z',340,220,'C')+mini(430,150,'M450 170h60v60h-20v-40h-40z',500,220,'D'),560,290);
  }
  if(id==='A1'){
    const pair=(x,outer,inner)=>`${shape(outer,x,85,85)}${shape(inner,x,85,36,{fill:'#17212a'})}`;
    return svg(pair(80,'circle','square')+`<text x="145" y="95" font-size="28">→</text>`+pair(220,'square','circle')+`<text x="290" y="95" font-size="22">как</text>`+pair(380,'triangle','circle')+`<text x="445" y="95" font-size="28">→ ?</text>`,520,170);
  }
  if(id==='P2'){
    let b='';const shapes=[['circle','triangle','square'],['triangle','square','circle'],['square','circle',null]];const fills=['none','url(#stripe)','#17212a'];
    b+=`<defs><pattern id="stripe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#17212a" stroke-width="3"/></pattern></defs>`;
    shapes.forEach((row,r)=>row.forEach((s,c)=>{const x=35+c*135,y=20+r*85;b+=cell(x,y,105,70);if(s)b+=shape(s,x+52,y+35,42,{fill:fills[c]});else b+=`<text x="${x+52}" y="${y+49}" text-anchor="middle" font-size="42" font-weight="800">?</text>`;}));return svg(b,450,290);
  }
  if(id==='S2'){
    const g=(x,y,cells,marker)=>{let out=cell(x,y,120,120);cells.forEach(([c,r])=>out+=`<rect x="${x+12+c*30}" y="${y+12+r*30}" width="28" height="28" fill="#3d607d"/>`);out+=dot(x+26+marker[0]*30,y+26+marker[1]*30,5);return out};
    let b=g(20,30,[[0,0],[0,1],[0,2],[1,2]],[0,0])+`<text x="155" y="95" font-size="17">зеркало ↔, затем 90° ↻</text>`;
    const opts=[[[[0,1],[0,2],[1,2],[2,2]],[2,2]],[[[2,0],[2,1],[2,2],[1,2]],[2,0]],[[[0,0],[1,0],[2,0],[2,1]],[2,1]],[[[0,1],[0,2],[1,2],[2,2]],[0,1]]];
    opts.forEach((o,i)=>{const x=20+i*125,y=180;b+=g(x,y,o[0],o[1])+`<text x="${x+60}" y="320" text-anchor="middle" font-size="15">${'ABCD'[i]}</text>`});return svg(b,530,340);
  }
  if(id==='A2'){
    const p=(x,y,o,inn,ofill='none',ifill='none')=>`${shape(o,x,y,74,{fill:ofill})}${shape(inn,x,y,36,{fill:ifill})}`;
    return svg(p(80,75,'pentagon','triangle')+p(200,75,'hexagon','square','#17212a','#17212a')+p(320,75,'octagon','hexagon')+p(440,75,'hexagon','square','#17212a','none')+`<text x="80" y="145" text-anchor="middle">A</text><text x="200" y="145" text-anchor="middle">B</text><text x="320" y="145" text-anchor="middle">C</text><text x="440" y="145" text-anchor="middle">D</text>`,520,170);
  }
  if(id==='P3'){
    const line=(x,y,type)=>type==='v'?`<line x1="${x}" y1="${y-28}" x2="${x}" y2="${y+28}" stroke="#17212a" stroke-width="5"/>`:type==='h'?`<line x1="${x-28}" y1="${y}" x2="${x+28}" y2="${y}" stroke="#17212a" stroke-width="5"/>`:type==='s'?`<line x1="${x-23}" y1="${y+23}" x2="${x+23}" y2="${y-23}" stroke="#17212a" stroke-width="5"/>`:`<line x1="${x-23}" y1="${y-23}" x2="${x+23}" y2="${y+23}" stroke="#17212a" stroke-width="5"/>`;
    let b='';const rows=[['v','h',['v','h']],['s','b',['s','b']],['v','s',null]];rows.forEach((row,r)=>row.forEach((v,c)=>{let x=30+c*125,y=20+r*78;b+=cell(x,y,95,62);if(Array.isArray(v))v.forEach(t=>b+=line(x+47,y+31,t));else if(v)b+=line(x+47,y+31,v);else b+=`<text x="${x+47}" y="${y+46}" text-anchor="middle" font-size="38">?</text>`;}));return svg(b,410,270);
  }
  if(id==='N3')return svg(`<text x="40" y="65" font-size="34">△ + □ = 11</text><text x="40" y="125" font-size="34">□ + ○ = 8</text><text x="40" y="185" font-size="34">△ + ○ = 13</text>`,360,225);
  if(id==='S3')return svg(`<rect x="30" y="25" width="160" height="160" fill="#fff" stroke="#17212a" stroke-width="3"/><line x1="110" y1="25" x2="110" y2="185" stroke="#9a948b" stroke-dasharray="6 6"/><line x1="30" y1="105" x2="190" y2="105" stroke="#9a948b" stroke-dasharray="6 6"/><path d="M65 205h80" stroke="#17212a"/><text x="175" y="211" font-size="22">→</text><rect x="225" y="145" width="80" height="80" fill="#fff" stroke="#17212a" stroke-width="3"/><circle cx="285" cy="165" r="7" fill="#d08c32"/><text x="265" y="120" text-anchor="middle" font-size="16">сложенная четверть</text>`,350,250);
  if(id==='A3')return svg(`${shape('triangle',80,80,70)}${dot(80,80)}<text x="130" y="90" font-size="28">→</text>${shape('square',200,80,70)}${dot(190,80)}${dot(210,80)}<text x="260" y="90" font-size="25">как</text>${shape('pentagon',350,80,74)}${dot(340,80)}${dot(360,80)}<text x="410" y="90" font-size="28">→ ?</text>`,500,160);
  if(id==='P4'){
    let b='';const names=['triangle','square','pentagon'];const positions=[[0,-18],[18,0],[0,18]];for(let r=0;r<3;r++)for(let c=0;c<3;c++){const x=25+c*130,y=15+r*82;b+=cell(x,y,100,68);if(r===2&&c===2){b+=`<text x="${x+50}" y="${y+49}" text-anchor="middle" font-size="40">?</text>`;continue}b+=shape(names[r],x+50,y+34,42,{fill:(r+c)%2===0?'#17212a':'none'});b+=dot(x+50+positions[c][0],y+34+positions[c][1],4)}return svg(b,410,270);
  }
  if(id==='N4')return svg(`<text x="30" y="48" font-size="20">R1: x² + y</text><text x="30" y="84" font-size="20">R2: x + y²</text><text x="30" y="120" font-size="20">R3: xy + x</text><text x="30" y="156" font-size="20">R4: xy + y</text><line x1="230" y1="25" x2="230" y2="175" stroke="#bfb9ae"/><text x="270" y="70" font-size="24">F(2,4)=8</text><text x="270" y="115" font-size="24">F(4,3)=19</text>`,470,205);
  if(id==='S4')return svg(`<g font-size="18" font-weight="700" text-anchor="middle"><rect x="170" y="15" width="65" height="65" fill="#fff" stroke="#17212a"/><text x="202" y="53">B</text><rect x="105" y="80" width="65" height="65" fill="#fff" stroke="#17212a"/><text x="137" y="118">A</text><rect x="170" y="80" width="65" height="65" fill="#fff" stroke="#17212a"/><text x="202" y="118">C</text><rect x="235" y="80" width="65" height="65" fill="#fff" stroke="#17212a"/><text x="267" y="118">D</text><rect x="300" y="80" width="65" height="65" fill="#fff" stroke="#17212a"/><text x="332" y="118">E</text><rect x="170" y="145" width="65" height="65" fill="#fff" stroke="#17212a"/><text x="202" y="183">F</text></g>`,470,230);
  if(id==='A4')return svg(`<text x="25" y="42" font-size="15">Пример 1: ● → ○  (заливка)</text><text x="25" y="82" font-size="15">Пример 2: △ большой → △ малый  (размер)</text><text x="25" y="122" font-size="15">Пример 3: ■ → ⬟  (форма)</text><text x="25" y="175" font-size="17" font-weight="700">Найдите пару, где меняется ровно один признак.</text>`,520,215);
  return '';
}

function render(){
  const item=items[state.index];state.visits[state.index]++;
  $('#scaleLabel').textContent=`${scales[item.scale].label} · ${item.level}`;
  $('#progressText').textContent=`Задание ${state.index+1} из ${items.length}`;
  $('#progressBar').style.width=`${((state.index+1)/items.length)*100}%`;
  const qa=new URLSearchParams(location.search).get('qa')==='1'?`<div class="ml-q-id">${item.id} · QA</div>`:`<div class="ml-q-id">${item.id}</div>`;
  $('#questionCard').innerHTML=`${qa}<h2>${esc(item.prompt)}</h2>${item.visual?visual(item.visual):''}<div class="ml-options">${item.options.map((o,i)=>`<button class="ml-option ${state.answers[state.index]===i?'is-selected':''}" data-answer="${i}" type="button"><span class="ml-option-key">${'ABCD'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>`;
  $('#questionCard').querySelectorAll('[data-answer]').forEach(btn=>btn.addEventListener('click',()=>{state.answers[state.index]=Number(btn.dataset.answer);render();}));
  $('#prevBtn').disabled=state.index===0;
  $('#nextBtn').textContent=state.index===items.length-1?'Завершить тест':'Далее →';
  $('#nextBtn').disabled=state.answers[state.index]===null;
}

function showTest(){
  $('#startView').hidden=true;$('#resultView').hidden=true;$('#testView').hidden=false;state.startedAt=Date.now();
  timer=setInterval(()=>{const s=Math.floor((Date.now()-state.startedAt)/1000);$('#elapsed').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`},1000);render();
}
function next(){if(state.index===items.length-1){finish();return}state.index++;render();window.scrollTo({top:0,behavior:'smooth'});}
function prev(){if(state.index>0){state.index--;render();window.scrollTo({top:0,behavior:'smooth'});}}
function skip(){state.answers[state.index]=null;next();}
function descriptor(n){return n===4?'4 из 4 · очень сильное выполнение':n===3?'3 из 4 · сильное выполнение':n===2?'2 из 4 · смешанный результат':n===1?'1 из 4 · эта группа оказалась сложной':'0 из 4 · эта группа требует повторной проверки';}
function finish(){
  clearInterval(timer);$('#testView').hidden=true;$('#resultView').hidden=false;
  const correct=items.map((it,i)=>state.answers[i]===it.correct);const total=correct.filter(Boolean).length;$('#scoreRaw').textContent=`${total}/24`;
  $('#scoreNote').textContent=`Вы правильно решили ${total} из 24 заданий. Это сырой результат текущей версии теста, без процентилей и без попытки переводить его в IQ.`;
  const scores={};Object.keys(scales).forEach(k=>scores[k]=0);items.forEach((it,i)=>{if(correct[i])scores[it.scale]++});
  $('#scaleResults').innerHTML=Object.entries(scales).map(([key,s])=>`<article class="ml-scale-card"><header><h3>${s.label}</h3><strong>${scores[key]}/4</strong></header><div class="ml-scale-meter"><span style="width:${scores[key]*25}%"></span></div><p>${descriptor(scores[key])}</p></article>`).join('');
  const ev=scores.investigative;$('#evidenceNote').textContent=ev===4?'Во всех четырёх заданиях вы выбрали вывод, который не сильнее имеющихся доказательств. В этой версии теста это максимальный результат по Evidence Discipline.':ev>=2?`В заданиях на силу доказательств вы решили ${ev} из 4. В остальных случаях выбранный вывод либо выходил за пределы данных, либо пропускал допустимый вывод.`:`В заданиях на доказательства вы решили ${ev} из 4. Здесь особенно важно отделять «совместимо с версией» от «доказывает версию» и не приписывать фактам лишнего.`;
  const entries=Object.entries(scores);const max=Math.max(...entries.map(x=>x[1])),min=Math.min(...entries.map(x=>x[1]));const strongest=entries.filter(x=>x[1]===max).map(x=>scales[x[0]].label.toLowerCase()).join(', ');const hardest=entries.filter(x=>x[1]===min).map(x=>scales[x[0]].label.toLowerCase()).join(', ');
  $('#profileNote').textContent=`Лучше всего в этом прохождении сработали: ${strongest} (${max}/4). Наиболее сложными оказались: ${hardest} (${min}/4). Это описание выполнения данного набора, а не постоянная характеристика человека.`;
  window.scrollTo({top:0,behavior:'smooth'});
}
function restart(){state.index=0;state.answers.fill(null);state.answerTimes.fill(null);state.visits.fill(0);$('#resultView').hidden=true;$('#startView').hidden=false;$('#elapsed').textContent='00:00';window.scrollTo({top:0,behavior:'smooth'});}

const qaParams=new URLSearchParams(location.search);
const qaItem=qaParams.get('item');
if(qaParams.get('qa')==='1'&&qaItem){
  const qaIndex=items.findIndex(x=>x.id===qaItem);
  if(qaIndex>=0){state.index=qaIndex;showTest();}
}else if(qaParams.get('qa')==='1'&&qaParams.get('start')==='1'){
  showTest();
}

$('#startBtn').addEventListener('click',showTest);$('#nextBtn').addEventListener('click',next);$('#prevBtn').addEventListener('click',prev);$('#skipBtn').addEventListener('click',skip);$('#restartBtn').addEventListener('click',restart);
