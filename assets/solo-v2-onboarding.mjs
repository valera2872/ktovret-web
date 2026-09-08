const root=document.querySelector('[data-solo-onboarding]');
const stages=[...document.querySelectorAll('[data-onb-stage]')];
const frames=[...document.querySelectorAll('[data-film-frame]')];
const line=document.querySelector('[data-film-line]');
const dots=[...document.querySelectorAll('[data-film-dot]')];
let timer=null;let scene=0;
const captions=[
  'Ночная смена на <strong>«Меридиане-7»</strong>.',
  'В 02:16 спектрограф <strong>SP-4 отключили</strong>.',
  'Но новые данные поступали ещё <strong>13 минут</strong>.',
  'Через несколько минут рядом нашли <strong>мёртвого директора станции</strong>.'
];
function showStage(name){stages.forEach(s=>s.classList.toggle('is-active',s.dataset.onbStage===name));window.scrollTo({top:0,behavior:'smooth'});if(name!=='film')stopFilm()}
function showScene(i){scene=(i+frames.length)%frames.length;frames.forEach((f,n)=>f.classList.toggle('is-active',n===scene));dots.forEach((d,n)=>d.classList.toggle('is-active',n===scene));if(line)line.innerHTML=captions[scene]}
function startFilm(){stopFilm();showScene(0);timer=setInterval(()=>{if(scene<frames.length-1)showScene(scene+1);else stopFilm()},2600)}
function stopFilm(){if(timer){clearInterval(timer);timer=null}}
root?.querySelector('[data-onb-skip]')?.addEventListener('click',()=>showStage('briefing'));
root?.querySelector('[data-onb-continue]')?.addEventListener('click',()=>showStage('briefing'));
root?.querySelector('[data-onb-to-primer]')?.addEventListener('click',()=>showStage('primer'));
root?.querySelector('[data-onb-back]')?.addEventListener('click',()=>showStage('briefing'));
root?.querySelector('[data-onb-enter]')?.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('ml-preview-start')));
window.addEventListener('ml-preview-ready',()=>{if(!root)return;root.hidden=false;showStage('film');startFilm()});
