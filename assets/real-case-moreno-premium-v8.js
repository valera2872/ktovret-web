(()=>{
'use strict';
const root=document.querySelector('[data-moreno-app]');
if(!root)return;

document.body.classList.add('moreno-v8');

function railMarkup(){return `
  <aside class="v8-scene-rail" aria-label="Контекст места">
    <div class="v8-rail-top"><span>CASE 91-M</span><strong>Malden · 1991</strong></div>
    <div class="v8-fireescape" aria-hidden="true">
      <div class="v8-floor f4"><span>4</span></div>
      <div class="v8-floor f3 active"><span>3</span></div>
      <div class="v8-floor f2"><span>2</span></div>
      <div class="v8-floor f1"><span>1</span></div>
      <i class="v8-rail-a"></i><i class="v8-rail-b"></i><i class="v8-stair s1"></i><i class="v8-stair s2"></i><i class="v8-stair s3"></i>
    </div>
    <div class="v8-rail-caption"><small>КОНТЕКСТ СЦЕНЫ</small><strong>Пожарная лестница</strong><p>Третий этаж · схематический ориентир интерфейса, не доказательство.</p></div>
  </aside>`}

function enhanceDesk(){
  const work=root.querySelector('.v4-work');
  if(!work||work.dataset.premiumV8)return;
  work.dataset.premiumV8='1';
  work.classList.add('v8-workspace');
  work.insertAdjacentHTML('afterbegin',railMarkup());

  const consoleEl=work.querySelector('.v4-console');
  const evidence=work.querySelector('.v4-evidence');
  if(consoleEl){
    consoleEl.classList.add('v8-console');
    const header=consoleEl.querySelector(':scope > header');
    if(header){
      const meta=document.createElement('div');
      meta.className='v8-case-status';
      meta.innerHTML='<span>CASE 91-M</span><b></b><span>АКТИВНОЕ РАССЛЕДОВАНИЕ</span>';
      header.prepend(meta);
    }
    consoleEl.querySelectorAll('.v4-log').forEach(turn=>{
      turn.classList.add('v8-turn');
      const cmd=turn.querySelector('.v4-command');
      if(cmd&&!turn.querySelector('.v8-turn-label')){
        const label=document.createElement('div');
        label.className='v8-turn-label';
        label.textContent='РАСПОРЯЖЕНИЕ';
        cmd.before(label);
      }
    });
    const composer=consoleEl.querySelector('.v4-composer');
    if(composer&&!composer.querySelector('.v8-composer-cap')){
      const cap=document.createElement('div');
      cap.className='v8-composer-cap';
      cap.innerHTML='<span>AI DISPATCH</span><em>свободное распоряжение следственной группе</em>';
      composer.prepend(cap);
    }
  }

  if(evidence){
    evidence.classList.add('v8-folder');
    const head=evidence.querySelector('.v4-evidence-head');
    if(head&&!head.querySelector('small')){
      const sub=document.createElement('small');
      sub.textContent='материалы, добытые вами';
      head.querySelector('strong')?.after(sub);
    }
    evidence.querySelectorAll('article').forEach((card,i)=>{
      card.classList.add('v8-folder-card');
      card.style.setProperty('--v8-i',String(i));
    });
  }
}

function enhanceOpening(){
  const opening=root.querySelector('.v4-opening');
  if(!opening||opening.dataset.premiumV8)return;
  opening.dataset.premiumV8='1';
  opening.classList.add('v8-opening');
}

function enhanceReveal(){
  const reveal=root.querySelector('.v4-reveal');
  if(!reveal||reveal.dataset.premiumV8)return;
  reveal.dataset.premiumV8='1';
  reveal.classList.add('v8-reveal');
}

let pending=false;
function enhance(){
  pending=false;
  enhanceDesk();enhanceOpening();enhanceReveal();
}
function schedule(){if(pending)return;pending=true;queueMicrotask(enhance)}
const observer=new MutationObserver(schedule);
observer.observe(root,{childList:true,subtree:true});
enhance();
window.MLMorenoPremiumV8={version:'0.8.0',refresh:enhance};
})();