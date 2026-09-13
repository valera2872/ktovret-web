(()=>{
'use strict';
const app=document.querySelector('[data-moreno-app]');
if(!app)return;
document.body.classList.add('moreno-reference-v13');

const one=(n,a,b,c)=>n%10===1&&n%100!==11?a:n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?b:c;
function state(){return window.MLMorenoV6?.getState?.()||{completed:[]}}
function countKnownPeople(done){let n=done.has('people')?4:0;if(done.has('witnessLocated'))n+=1;return n}
function countOf(done,ids){return ids.filter(id=>done.has(id)).length}

function enhanceLogs(){
  app.querySelectorAll('.v4-log').forEach((log,i)=>{
    const bundle=log.querySelectorAll('.v6-item').length;
    if(!log.querySelector('.ref13-log-time'))log.insertAdjacentHTML('afterbegin',`<span class="ref13-log-time">Ход ${String(i+1).padStart(2,'0')}</span>`);
    const command=log.querySelector('.v4-command');
    if(command&&!log.querySelector('.ref13-meta'))command.insertAdjacentHTML('afterend',`<div class="ref13-meta"><span class="spark">✦</span><b>${bundle?`Выполнено ${bundle} ${one(bundle,'действие','действия','действий')} по распоряжению`:'Результат внесён в журнал'}</b><i></i><span>материалы сохранены</span></div>`);
    log.querySelectorAll('.v6-item').forEach(card=>{
      if(!card.querySelector('.ref13-preview-label'))card.insertAdjacentHTML('beforeend','<span class="ref13-preview-label">визуальный индекс</span>');
    });
  });
}

function enhanceFolder(){
  const s=state(),done=new Set(s.completed||[]);
  app.querySelectorAll('.ref11-folder-card').forEach(card=>{
    const meta=card.querySelector('b');
    if(card.classList.contains('people')){
      const n=countKnownPeople(done);
      if(meta&&n)meta.textContent=`${n} ${one(n,'лицо','лица','лиц')} · люди и свидетели`;
      if(!card.querySelector('.ref13-avatars')&&n){
        const dots=Math.min(n,5);card.querySelector('p')?.insertAdjacentHTML('beforebegin',`<div class="ref13-avatars">${'<span></span>'.repeat(dots)}${n>5?`<em>+${n-5}</em>`:''}</div>`);
      }
    }
    if(card.classList.contains('reconstruction')&&meta){const n=countOf(done,['scene','ballistics','trajectory']);if(n)meta.textContent=`${n} ${one(n,'материал','материала','материалов')} · сцена и физика`}
    if(card.classList.contains('conflict')&&meta){const n=countOf(done,['motive','weapon']);if(n)meta.textContent=`${n} ${one(n,'материал','материала','материалов')} · отношения и доступ`}
    if(card.classList.contains('alibi')&&meta){const n=countOf(done,['interview','alibi']);if(n)meta.textContent=`${n} ${one(n,'материал','материала','материалов')} · показания`}
  });
}

function enhanceComposer(){
  const form=app.querySelector('.v4-composer');if(!form)return;
  const box=form.querySelector('textarea');
  if(box)box.placeholder='Напишите, что нужно сделать… Можно объединить несколько действий.';
  if(!form.querySelector('.ref13-composer-foot')){
    const last=form.querySelector(':scope > div');
    if(last)last.insertAdjacentHTML('beforebegin','<div class="ref13-composer-foot"><span>Shift + Enter — новая строка</span><span class="ref13-ai"><i></i>ИИ-помощник активен</span></div>');
  }
}

function enhance(){enhanceLogs();enhanceFolder();enhanceComposer()}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance()})}
new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
enhance();
window.MLMorenoReferenceV13={version:'1.3.0',refresh:enhance};
})();
