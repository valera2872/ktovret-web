(()=>{
'use strict';
const PHOTO='https://www.middlesexda.com/sites/g/files/vyhlif11841/f/styles/news_image/public/news/capture_3.jpg?itok=RK3zkJ6R';
const SOURCE='https://www.middlesexda.com/press-releases/news/middlesex-district-attorney-and-malden-police-announce-arrest-30-year-old-murder';
let suppress=false;
function removeIntro(){document.querySelector('.ml-real-intro')?.remove();document.body.classList.remove('ml-real-intro-open')}
function showIntro(){
  const app=document.querySelector('[data-moreno-app]');
  const api=window.MLMorenoV6;
  if(!app||!api||suppress)return;
  const state=api.getState?.();
  if(state?.view!=='opening'){removeIntro();return}
  if(document.querySelector('.ml-real-intro'))return;
  const intro=document.createElement('section');
  intro.className='ml-real-intro';
  intro.setAttribute('aria-label','Вступление к реальному делу Patricia Moreno');
  intro.innerHTML=`<div class="ml-real-intro__shell">
    <div class="ml-real-intro__copy">
      <p class="ml-real-intro__kicker">Cold Case Unit · повторное расследование</p>
      <div class="ml-real-intro__real">● Основано на реальном уголовном деле</div>
      <h1>ДЕВУШКА НА<br>ПОЖАРНОЙ ЛЕСТНИЦЕ</h1>
      <p class="ml-real-intro__lead">20 июля 1991 года, вскоре после трёх часов ночи, 17-летнюю Patricia Moreno нашли тяжело раненой на пожарной лестнице третьего этажа дома в Malden, Massachusetts. Она умерла в тот же день. Оружие и гильзы на месте не нашли. Дело оставалось без обвинения почти три десятилетия.</p>
      <div class="ml-real-intro__facts">
        <article><small>Жертва</small><strong>Patricia Moreno, 17 лет</strong></article>
        <article><small>Место</small><strong>Malden, Massachusetts</strong></article>
        <article><small>Дата</small><strong>20 июля 1991</strong></article>
      </div>
      <p class="ml-real-intro__note"><strong>Вы получаете дело как следователь Cold Case Unit.</strong> Все факты, показания и материалы, которые можно открыть в ходе расследования, основаны на опубликованных официальных материалах реального дела. ИИ помогает понимать ваши распоряжения, но не придумывает улики и не меняет реальный исход.</p>
      <div class="ml-real-intro__actions">
        <button class="ml-real-intro__start" type="button">Принять дело</button>
        <span class="ml-real-intro__source">Источник стартовых обстоятельств: Middlesex District Attorney</span>
      </div>
    </div>
    <div class="ml-real-intro__visual">
      <div class="ml-real-intro__stamp">REAL CASE · 91-M</div>
      <figure class="ml-real-intro__photo"><img src="${PHOTO}" alt="Patricia Moreno"><figcaption class="ml-real-intro__file"><small>VICTIM FILE · 91-M</small><strong>Patricia Moreno</strong><span>17 лет · Malden, Massachusetts</span></figcaption></figure>
    </div>
  </div>`;
  intro.querySelector('.ml-real-intro__start')?.addEventListener('click',()=>{
    suppress=true;
    intro.remove();
    document.body.classList.remove('ml-real-intro-open');
    const accept=app.querySelector('[data-action="accept"]');
    accept?.click();
    setTimeout(()=>{suppress=false},50);
  });
  intro.querySelector('.ml-real-intro__source')?.addEventListener('click',()=>window.open(SOURCE,'_blank','noopener'));
  document.body.classList.add('ml-real-intro-open');
  document.body.appendChild(intro);
}
function boot(){
  const api=window.MLMorenoV6;
  if(!api)return setTimeout(boot,20);
  const params=new URLSearchParams(location.search);
  if(params.get('new')==='1'){
    try{localStorage.removeItem('ml-realcase-moreno-ai-v6')}catch{}
    api.reset?.();
    params.delete('new');
    const next=location.pathname+(params.toString()?`?${params}`:'')+location.hash;
    history.replaceState(null,'',next);
  }
  showIntro();
  const app=document.querySelector('[data-moreno-app]');
  if(app)new MutationObserver(()=>showIntro()).observe(app,{childList:true,subtree:true});
}
boot();
})();
