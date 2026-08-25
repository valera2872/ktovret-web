(()=>{
  'use strict';

  const VERSION='0.1.1';
  const app=document.querySelector('[data-realcase-app]');
  if(!app) return;

  const PASSIVE_EVIDENCE=new Set(['S03','S04','S05','S09','S11']);

  const makeEvidenceReadingFlow=(screen)=>{
    if(!PASSIVE_EVIDENCE.has(screen)) return;

    /* The core originally required players to tick a minimum number of lines that
       simply repeated the document above. Preserve internal state compatibility,
       but remove that fake interaction from the player-facing experience. */
    const grid=app.querySelector(`.rc-screen[data-screen="${screen}"] .rc-fact-grid`);
    if(grid){
      grid.querySelectorAll('input[data-fact]').forEach(input=>{
        if(input.checked) return;
        input.checked=true;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      });
      grid.hidden=true;
      grid.setAttribute('aria-hidden','true');
    }

    const screenNode=app.querySelector(`.rc-screen[data-screen="${screen}"]`);
    const actions=screenNode?.querySelector('.rc-actions');
    if(screenNode&&actions&&!screenNode.querySelector('[data-reading-flow]')){
      const note=document.createElement('p');
      note.className='rc-reading-prompt';
      note.dataset.readingFlow='true';
      note.textContent=screen==='S09'||screen==='S11'
        ?'Читайте это как новую версию показания. На следующем экране вы сами сопоставите её с первой — изменения заранее не подсвечены.'
        :'Читайте материал отдельно от остальных. Если деталь требует возврата, сохраните её в блокнот; сводить версии будем после первых трёх источников.';
      actions.before(note);
    }
  };

  const polish=()=>{
    const screen=app.querySelector('.rc-screen')?.dataset.screen||'';

    makeEvidenceReadingFlow(screen);

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
  window.MLRealCase7105Presentation={version:VERSION,polish,passiveEvidence:[...PASSIVE_EVIDENCE]};
})();
