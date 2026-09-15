(()=>{
'use strict';
const app=document.querySelector('[data-moreno-app]');
if(!app)return;
document.body.classList.add('moreno-reference-v11');

function rail(){return `
  <div class="ref11-rail-ui" aria-hidden="true">
    <div class="ref11-rail-copy">КАЖДАЯ<br>КВАРТИРА<br>ХРАНИТ<br>СВОЮ ИСТОРИЮ</div>
    <div class="ref11-floors">
      <div><span>4</span><i></i><b>этаж</b></div>
      <div class="active"><span>3</span><i></i><b>этаж</b></div>
      <div><span>2</span><i></i><b>этаж</b></div>
      <div><span>1</span><i></i><b>этаж</b></div>
    </div>
    <div class="ref11-location"><strong>MALDEN · 1991</strong><span>Люди ближе,<br>чем кажется.</span></div>
  </div>`}

function initialReport(){return `
  <div class="ref11-report-head"><span>ИСХОДНЫЙ РАПОРТ</span><em>материалы 1991 года</em></div>
  <div class="ref11-report-title">Patricia Moreno найдена на пожарной лестнице</div>
  <div class="ref11-report-facts">
    <span><b>17 лет</b> потерпевшая</span>
    <span><b>3 этаж</b> место обнаружения</span>
    <span><b>не найдено</b> оружие и гильза</span>
  </div>`}

const has=(set,...ids)=>ids.some(id=>set.has(id));
function folderCard(kind,title,meta,body){return `<article class="ref11-folder-card ${kind}"><div class="ref11-folder-icon" aria-hidden="true"></div><div><small>${title}</small>${meta?`<b>${meta}</b>`:''}<p>${body}</p></div><span class="ref11-folder-chevron">›</span></article>`}
function buildFolder(evidence){
  if(evidence.dataset.ref11Folder==='1')return;
  evidence.dataset.ref11Folder='1';
  const originalCount=evidence.querySelectorAll('article:not(.v4-hyp)').length;
  const state=window.MLMorenoV6?.getState?.()||{};
  const done=new Set(state.completed||[]);
  const groups=[];

  if(has(done,'people','interview','occupantsInterviewed','daughtersInterviewed','motherInterviewed','canvass','witnessLocated','witnessDescription')){
    groups.push(folderCard('people','Круг лиц','люди и свидетели','Жильцы квартиры, найденные свидетели и установленные связи.'));
  }
  if(has(done,'scene','ballistics','trajectory')){
    groups.push(folderCard('reconstruction','Реконструкция','сцена и физика','Осмотр сцены, баллистика и пространственная реконструкция выстрела.'));
  }
  if(has(done,'motive','weapon')){
    groups.push(folderCard('conflict','Конфликт','отношения и доступ','Угрозы, напряжённые отношения и проверка доступа к оружию.'));
  }
  if(has(done,'interview','alibi')){
    groups.push(folderCard('alibi','Проверка алиби','показания и расхождения','Версии присутствовавших, подтверждения и выявленные расхождения.'));
  }

  const head=evidence.querySelector('.v4-evidence-head');
  const count=Math.max(1,originalCount+1);
  const counter=head?.querySelector('span');
  if(counter)counter.textContent=`${count} ${count===1?'материал':count<5?'материала':'материалов'}`;
  [...evidence.children].forEach(el=>{if(el!==head)el.remove()});

  if(!groups.length){
    evidence.insertAdjacentHTML('beforeend',folderCard('report','Исходный рапорт','1 материал','Patricia Moreno, 17 лет. Пожарная лестница третьего этажа; оружие и гильза на месте не обнаружены.'));
  }else{
    evidence.insertAdjacentHTML('beforeend',groups.join(''));
    evidence.insertAdjacentHTML('beforeend','<div class="ref11-folder-quote"><i></i><p>Факты не упрямы.<br>Они просто требуют<br>внимания.</p><span></span></div>');
  }
  if(state.hypothesis)evidence.insertAdjacentHTML('beforeend',folderCard('hypothesis','Ваша версия','рабочая гипотеза',String(state.hypothesis)));
}

function enhance(){
  const work=app.querySelector('.v4-work');
  if(!work)return;

  if(!work.querySelector('.ref11-rail-ui'))work.insertAdjacentHTML('beforeend',rail());

  const empty=work.querySelector('.v4-journal-empty');
  if(empty&&!empty.dataset.ref11){
    empty.dataset.ref11='1';
    empty.innerHTML=initialReport();
  }

  const evidence=work.querySelector('.v4-evidence');
  if(evidence)buildFolder(evidence);

  work.querySelectorAll('.v6-item').forEach((card,i)=>{
    const idx=String(i+1);
    if(card.dataset.ref11Index!==idx)card.dataset.ref11Index=idx;
    if(!card.querySelector('.ref11-card-status'))card.insertAdjacentHTML('beforeend','<div class="ref11-card-status"><span>✓</span> Завершено</div>');
  });

  work.querySelectorAll('.v4-log').forEach(log=>{
    if(!log.querySelector('.ref11-log-menu'))log.insertAdjacentHTML('afterbegin','<span class="ref11-log-menu">•••</span>');
  });

  const form=work.querySelector('.v4-composer');
  if(form){
    const box=form.querySelector('textarea');
    if(box){
      if(box.placeholder!=='Напишите, что нужно сделать…')box.placeholder='Напишите, что нужно сделать…';
      if(box.getAttribute('aria-label')!=='Следственное распоряжение')box.setAttribute('aria-label','Следственное распоряжение');
    }
    const status=form.querySelector('div > span');
    if(status&&/ИИ понимает язык/.test(status.textContent))status.textContent='Shift + Enter — новая строка';
    const btn=form.querySelector('button');
    if(btn&&!btn.disabled&&btn.textContent.trim()==='Выполнить')btn.innerHTML='Выполнить <span class="ref11-arrow">→</span>';
  }
}

let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance()})}
new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
enhance();
window.MLMorenoReferenceV11={version:'1.1.2',refresh:enhance};
})();
