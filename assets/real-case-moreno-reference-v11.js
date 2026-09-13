(()=>{
'use strict';
const app=document.querySelector('[data-moreno-app]');
if(!app)return;
document.body.classList.add('moreno-reference-v11');

const titleMap={
  'ОСМОТР':'Осмотр сцены',
  'КРУГ ЛИЦ':'Круг лиц',
  'ВЕРСИЯ БОЙФРЕНДА':'Версия бойфренда',
  'НОВЫЙ КОНТАКТ':'Новый контакт',
  'НЕЗАВИСИМЫЙ СВИДЕТЕЛЬ':'Независимый свидетель',
  'СОПОСТАВЛЕНИЕ':'Сопоставление',
  'БАЛЛИСТИКА':'Баллистика',
  'РЕКОНСТРУКЦИЯ':'Реконструкция',
  'ОРУЖИЕ':'Оружие',
  'КОНФЛИКТ':'Конфликт',
  'ПРОВЕРКА АЛИБИ':'Проверка алиби',
  'ВАША ВЕРСИЯ':'Ваша версия'
};

function rail(){return `
  <div class="ref11-rail-ui" aria-hidden="true">
    <div class="ref11-rail-copy">КАЖДАЯ<br>КВАРТИРА<br>ХРАНИТ<br>СВОЮ ИСТОРИЮ</div>
    <div class="ref11-floors">
      <div><span>4</span><i></i><b>этаж</b></div>
      <div class="active"><span>3</span><i></i><b>этаж</b></div>
      <div><span>2</span><i></i><b>этаж</b></div>
      <div><span>1</span><i></i><b>этаж</b></div>
    </div>
    <div class="ref11-location"><strong>MALDEN · 1991</strong><span>пожарная лестница<br>третьего этажа</span></div>
  </div>`}

function initialReport(){return `
  <div class="ref11-report-head"><span>ИСХОДНЫЙ РАПОРТ</span><em>материалы 1991 года</em></div>
  <div class="ref11-report-title">Patricia Moreno найдена на пожарной лестнице</div>
  <div class="ref11-report-facts">
    <span><b>17 лет</b> потерпевшая</span>
    <span><b>3 этаж</b> место обнаружения</span>
    <span><b>не найдено</b> оружие и гильза</span>
  </div>`}

function folderReport(){return `<article class="ref11-source-report"><small>Исходный рапорт</small><p>Patricia Moreno, 17 лет. Найдена на площадке пожарной лестницы третьего этажа. На месте не обнаружены оружие и гильза.</p></article>`}

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
  if(evidence){
    const head=evidence.querySelector('.v4-evidence-head');
    if(head&&!evidence.querySelector('.ref11-source-report'))head.insertAdjacentHTML('afterend',folderReport());
    const found=[...evidence.querySelectorAll('article:not(.ref11-source-report):not(.v4-hyp)')].length;
    const counter=head?.querySelector('span');
    if(counter)counter.textContent=`${found+1} ${found===0?'материал':found<4?'материала':'материалов'}`;
    evidence.querySelectorAll('article:not(.ref11-source-report) small').forEach(s=>{
      const raw=s.textContent.trim();
      if(titleMap[raw])s.textContent=titleMap[raw];
    });
  }

  work.querySelectorAll('.v6-item').forEach((card,i)=>{
    card.dataset.ref11Index=String(i+1);
    if(!card.querySelector('.ref11-card-status'))card.insertAdjacentHTML('beforeend','<div class="ref11-card-status"><span>✓</span> Завершено</div>');
  });

  work.querySelectorAll('.v4-log').forEach(log=>{
    if(!log.querySelector('.ref11-log-menu'))log.insertAdjacentHTML('afterbegin','<span class="ref11-log-menu">•••</span>');
  });

  const form=work.querySelector('.v4-composer');
  if(form){
    const box=form.querySelector('textarea');
    if(box){box.placeholder='Напишите, что нужно сделать…';box.setAttribute('aria-label','Следственное распоряжение');}
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
window.MLMorenoReferenceV11={version:'1.1.0',refresh:enhance};
})();
