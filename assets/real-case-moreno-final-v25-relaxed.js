(()=>{
'use strict';
const app=document.querySelector('[data-moreno-app]');
if(!app)return;
const KEY='ml-realcase-moreno-final-v25';
const people={mother:'приёмная мать Patricia',older_daughter:'старшая дочь приёмной матери',younger_daughter:'младшая дочь приёмной матери',boyfriend:'бойфренд старшей дочери приёмной матери Patricia',second_floor_witness:'бывший житель второго этажа',other:'другой или неустановленный человек'};
const state=()=>window.MLMorenoV6?.getState?.()||{};
function saved(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return{}}}
function store(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch{}}
function enhancePanel(){
 const panel=app.querySelector('[data-fpanel]');
 if(!panel)return;
 const story=panel.querySelector('[data-story]');
 const prev=saved();
 if(story&&!story.value.trim())story.value=String(prev.story||state().hypothesis||'').trim();
 if(panel.dataset.relaxedFinal==='1')return;
 panel.dataset.relaxedFinal='1';
 const send=panel.querySelector('[data-send]');
 if(!send)return;
 send.onclick=()=>{
  const suspect=panel.querySelector('[data-sus]')?.value||'';
  const storyText=panel.querySelector('[data-story]')?.value?.trim()||'';
  const limits=panel.querySelector('[data-limits]')?.value?.trim()||'';
  const materials=[...panel.querySelectorAll('[data-mat]:checked')].map(x=>x.value);
  const err=panel.querySelector('[data-err]');
  const bad=message=>{if(err){err.hidden=false;err.textContent=message}};
  if(!suspect)return bad('Укажите, кого вы считаете причастным.');
  if(!storyText)return bad('Коротко укажите вашу версию.');
  if(!materials.length)return bad('Выберите хотя бы один материал.');
  if(!limits)return bad('Укажите, что осталось недоказанным.');
  store({suspect,story:storyText,limits,materials});
  const box=app.querySelector('[data-command]');
  const form=app.querySelector('[data-command-form]');
  if(!box||!form)return bad('Поле распоряжения недоступно.');
  box.value=`Передаю итоговую реконструкцию. Подозреваемый: ${people[suspect]||suspect}. Версия: ${storyText}`;
  form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
 };
}
new MutationObserver(()=>queueMicrotask(enhancePanel)).observe(app,{childList:true,subtree:true});
enhancePanel();
window.MLMorenoFinalV25Relaxed={version:'2.5.2'};
})();
