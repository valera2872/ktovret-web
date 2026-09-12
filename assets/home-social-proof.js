(()=>{
  'use strict';
  const ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/social-proof';
  const root=document.querySelector('[data-ml-home-social-proof]');
  if(!root)return;
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const titleFor=(key)=>({
    'case:ai:01':'Восемь минут без камеры','solo-407':'Номер 407','coop-2317':'Последний звонок в 23:17','coop-407':'Номер 407 для двоих','last_aria':'Последняя ария'
  }[key]||'Дело Mystery Logic');
  const render=(items={})=>{
    const entries=Object.entries(items).filter(([,v])=>v&&Number(v.ratingCount||0)>0);
    const ratingCount=entries.reduce((s,[,v])=>s+Number(v.ratingCount||0),0);
    const weighted=entries.reduce((s,[,v])=>s+Number(v.rating||0)*Number(v.ratingCount||0),0);
    const avg=ratingCount?weighted/ratingCount:0;
    const reviews=[];
    for(const [key,item] of entries){for(const review of (Array.isArray(item.reviews)?item.reviews:[]))reviews.push({...review,key});}
    reviews.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    root.innerHTML=`<div class="ml-home-social-proof-head"><div><p class="ml-proof-kicker">Оценки после прохождения</p><h2>Что говорят игроки</h2></div><span class="ml-home-proof-summary">${ratingCount&&avg?`★ ${avg.toFixed(1)} · ${ratingCount} оценок`: 'Отзывы появляются только после реальных прохождений'}</span></div>${reviews.length?`<div class="ml-home-proof-grid">${reviews.slice(0,3).map(r=>{const n=Math.max(1,Math.min(5,Number(r.rating||0)));return `<article class="ml-home-proof-card"><span class="stars">${'★'.repeat(n)}${'☆'.repeat(5-n)}</span><p>${esc(r.comment||'')}</p><small>${esc(r.displayName||'Игрок Mystery Logic')} · ${esc(titleFor(r.key))}</small></article>`}).join('')}</div>`:`<p class="ml-home-proof-empty">${ratingCount?'Оценки уже учитываются. Публичные тексты отзывов показываются только после согласия игрока и модерации.':'Первые оценки и отзывы появятся здесь после прохождения дел. Мы не подставляем тестовые или вымышленные отзывы.'}</p>`}`;
  };
  fetch(ENDPOINT,{cache:'no-store',credentials:'omit'}).then(r=>r.ok?r.json():null).then(data=>{if(data?.ok)render(data.items||{});else render({});}).catch(()=>render({}));
})();
