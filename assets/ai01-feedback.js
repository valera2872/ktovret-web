(()=>{
  'use strict';

  const COPY={
    cameraStamp:'Камеры наблюдения были недоступны из-за планового перезапуска · 21:27–21:35',
    evidenceTitle:'Недоступность камер наблюдения',
    evidenceBody:'С 21:27:10 до 21:35:42 камеры наблюдения были недоступны из-за планового перезапуска. Запись в этот период не велась. Заявка на работы создана в 20:15.'
  };

  function patchDynamicCopy(root=document){
    const lead=root.querySelector?.('.aid-lead');
    if(lead?.textContent?.includes('камера служебного коридора проходила плановый перезапуск')){
      lead.textContent=lead.textContent.replace(
        'С 21:27 до 21:35 камера служебного коридора проходила плановый перезапуск: запись в этот период не велась.',
        'С 21:27 до 21:35 камеры наблюдения были недоступны из-за планового перезапуска. Запись в этот период не велась.'
      );
    }

    root.querySelectorAll?.('.aid-stamp-line').forEach(line=>{
      const label=line.querySelector('span');
      const value=line.querySelector('strong');
      if(label?.textContent?.trim()==='КАМЕРА'&&value)value.textContent=COPY.cameraStamp;
    });

    root.querySelectorAll?.('.aid-evidence-card').forEach(card=>{
      const title=card.querySelector('strong');
      const body=card.querySelector('p');
      if(title&&['Окно перезапуска камеры','Плановый перезапуск камеры'].includes(title.textContent?.trim()||''))title.textContent=COPY.evidenceTitle;
      if(body&&(body.textContent?.includes('не передавала сигнал с 21:27:10 до 21:35:42')||body.textContent?.includes('камера служебного коридора проходила плановый перезапуск')))body.textContent=COPY.evidenceBody;
    });

    root.querySelectorAll?.('.aid-resolution-grid strong').forEach(title=>{
      if(title.textContent?.trim()==='Окно было известно')title.textContent='Время перезапуска было известно';
    });

    root.querySelectorAll?.('.aid-note').forEach(note=>{
      note.childNodes.forEach(node=>{
        if(node.nodeType!==Node.TEXT_NODE)return;
        node.textContent=node.textContent
          .replaceAll('окно отключения камеры','время планового перезапуска камер')
          .replaceAll('окно камеры','время перезапуска камер');
      });
    });
  }

  patchDynamicCopy();
  const app=document.querySelector('[data-ai-detective]');
  if(app){
    const observer=new MutationObserver(mutations=>{
      for(const mutation of mutations){
        for(const node of mutation.addedNodes){
          if(node.nodeType===Node.ELEMENT_NODE)patchDynamicCopy(node);
        }
      }
    });
    observer.observe(app,{childList:true,subtree:true});
  }

  const form=document.querySelector('[data-ai01-feedback-form]');
  if(!form)return;
  const status=form.querySelector('[data-ai01-feedback-status]');
  const submit=form.querySelector('button[type="submit"]');
  const readChecked=name=>[...form.querySelectorAll(`input[name="${name}"]:checked`)].map(el=>el.value);
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(form.dataset.submitted==='1')return;
    const liked=readChecked('liked');
    const improve=readChecked('improve');
    const more=form.querySelector('input[name="more"]:checked')?.value||'';
    if(!liked.length&&!improve.length&&!more){
      if(status){status.hidden=false;status.textContent='Выберите хотя бы один вариант.';}
      return;
    }
    const tracker=window.MysteryLogicAI01Analytics?.track;
    liked.forEach(value=>tracker?.('ai01_feedback_like',{value}));
    improve.forEach(value=>tracker?.('ai01_feedback_improve',{value}));
    if(more){
      tracker?.('ai01_feedback_more',{value:more});
      if(more==='more'||more==='both')tracker?.('ai01_more_case_interest',{source:'feedback'});
      if(more==='live'||more==='both')tracker?.('ai01_live_interest',{source:'feedback'});
    }
    tracker?.('ai01_feedback_submitted',{liked_count:liked.length,improve_count:improve.length,more});
    form.dataset.submitted='1';
    form.querySelectorAll('input,button').forEach(el=>{el.disabled=true;});
    if(submit)submit.textContent='Спасибо';
    if(status){status.hidden=false;status.textContent='Спасибо. Ответ сохранён — он поможет решить, каким делать следующее AI-расследование.';}
  });
})();