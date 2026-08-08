(()=>{
  'use strict';

  const root=document.querySelector('[data-ktv-root]');
  const seo=window.KtoVretSeo||{};
  const game=window.KtoVretWeb||{};
  if(!root||!game.case) return;

  const base={case_id:game.case.id,case_title:game.case.title,language:seo.language||'ru',case_url:seo.canonical||location.href};
  const emit=(name,detail={})=>{
    const payload={event:name,...base,...detail};
    try{window.dataLayer=window.dataLayer||[];window.dataLayer.push(payload);}catch{}
    try{window.dispatchEvent(new CustomEvent('ml:analytics',{detail:payload}));}catch{}
  };

  const selectedId=()=>root.querySelector('[data-action="select"].is-selected')?.dataset.optionId||'';
  const isCorrect=(id)=>Boolean(id&&game.case.answerStages?.[0]?.correctOptionIds?.includes(id));

  emit('case_view',{referrer:document.referrer||'',entry_path:location.pathname,search_entry:/google\.|yandex\.|ya\.ru/i.test(document.referrer||'')});

  root.addEventListener('click',(event)=>{
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action==='accept') emit('case_started');
    if(action==='select') emit('answer_selected',{option_id:event.target.closest('[data-option-id]')?.dataset.optionId||''});
    if(action==='submit'){
      const optionId=selectedId();
      if(!optionId) return;
      if(isCorrect(optionId)){
        emit('answer_correct',{option_id:optionId});
        emit('case_completed',{option_id:optionId});
      }else emit('answer_wrong',{option_id:optionId});
    }
  });

  document.addEventListener('click',(event)=>{
    const next=event.target.closest('[data-analytics-next]');
    if(next) emit('next_case_clicked',{target_kind:next.dataset.analyticsNext||'next',target_url:next.href||''});
    const purchase=event.target.closest('[data-purchase-start]');
    if(purchase) emit('purchase_started',{target_url:purchase.href||''});
  });

  const paywall=document.querySelector('[data-paywall]');
  if(paywall) emit('paywall_viewed');
})();
