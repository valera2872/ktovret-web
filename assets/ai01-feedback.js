(()=>{
  'use strict';
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
    const comment=String(form.elements.comment?.value||'').trim().slice(0,500);
    if(!liked.length&&!improve.length&&!more&&!comment){
      if(status){status.hidden=false;status.textContent='Выберите хотя бы один вариант или напишите короткий комментарий.';}
      return;
    }
    const tracker=window.MysteryLogicAI01Analytics?.track;
    liked.forEach(value=>tracker?.('ai01_feedback_like',{value}));
    improve.forEach(value=>tracker?.('ai01_feedback_improve',{value}));
    if(more)tracker?.('ai01_feedback_more',{value:more});
    tracker?.('ai01_feedback_submitted',{liked_count:liked.length,improve_count:improve.length,more,has_comment:Boolean(comment),comment});
    form.dataset.submitted='1';
    form.querySelectorAll('input,textarea,button').forEach(el=>{el.disabled=true;});
    if(submit)submit.textContent='Спасибо';
    if(status){status.hidden=false;status.textContent='Спасибо. Ответ сохранён — он поможет решить, каким делать следующее AI-расследование.';}
  });
})();
