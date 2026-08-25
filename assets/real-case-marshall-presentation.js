(()=>{
  'use strict';

  const VERSION='0.1.1';
  const app=document.querySelector('[data-realcase-app]');
  if(!app) return;

  const polish=()=>{
    const screen=app.querySelector('.rc-screen')?.dataset.screen||'';

    if(screen==='S00'){
      const eyebrow=app.querySelector('.rc-screen[data-screen="S00"] .rc-eyebrow');
      if(eyebrow&&eyebrow.textContent!=='Реальное уголовное дело · 1971') eyebrow.textContent='Реальное уголовное дело · 1971';
    }

    if(screen==='S23'){
      const eyebrow=app.querySelector('.rc-screen[data-screen="S23"] .rc-eyebrow');
      if(eyebrow&&eyebrow.textContent!=='Настоящее дело') eyebrow.textContent='Настоящее дело';
      const button=app.querySelector('.rc-screen[data-screen="S23"] [data-action="primary"]');
      if(button&&button.textContent!=='Открыть официальные источники') button.textContent='Открыть официальные источники';
    }

    if(screen==='S24'){
      const copy=app.querySelector('.rc-screen[data-screen="S24"] .rc-copy p');
      if(copy) copy.textContent='Все ключевые материалы связаны с официальным архивом Новой Шотландии и документами Royal Commission. В расследовании использованы текстовые выписки и сопоставление источников; ниже — реестр официальных ссылок.';
    }

    const autosave=app.querySelector('.rc-footer-actions span');
    if(autosave&&autosave.textContent!=='Автосохранение включено') autosave.textContent='Автосохранение включено';

    const reset=app.querySelector('[data-action="reset"]');
    if(reset&&reset.textContent!=='Сбросить прогресс') reset.textContent='Сбросить прогресс';

    if(screen==='S25'){
      const feedback=app.querySelector('.rc-screen[data-screen="S25"] .rc-feedback.is-good');
      if(feedback&&feedback.innerHTML.includes('Вы завершили прототип документального дела.')){
        feedback.innerHTML=feedback.innerHTML.replace('Вы завершили прототип документального дела.','Расследование завершено.');
      }
      if(feedback){
        const button=app.querySelector('.rc-screen[data-screen="S25"] [data-action="primary"]');
        if(button){
          button.textContent='Дело завершено';
          button.disabled=true;
        }
      }
    }
  };

  const observer=new MutationObserver(()=>queueMicrotask(polish));
  observer.observe(app,{childList:true,subtree:true});

  app.addEventListener('click',(event)=>{
    const reset=event.target.closest?.('[data-action="reset"]');
    if(!reset||!app.contains(reset)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if(confirm('Сбросить весь прогресс расследования?')) window.MLRealCase7105?.reset?.();
  },true);

  polish();
  window.MLRealCase7105Presentation={version:VERSION,polish};
})();
