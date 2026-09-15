(()=>{
  'use strict';
  const app=document.querySelector('[data-moreno-app]');
  if(!app) return;
  const PHOTO='https://www.middlesexda.com/sites/g/files/vyhlif11841/f/styles/news_image/public/news/capture_3.jpg?itok=RK3zkJ6R';

  const polish=()=>{
    const title=app.querySelector('.ms-title');
    if(!title||title.textContent.trim()!=='КАК ЭТО МОГЛО ПРОИЗОЙТИ?') return;
    const lead=app.querySelector('.ms-lead');
    if(!lead||app.querySelector('[data-scene-intro]')) return;
    const visual=document.createElement('div');
    visual.className='ms-scene-intro';
    visual.dataset.sceneIntro='true';
    visual.innerHTML=`
      <div class="ms-scene-intro-photo">
        <img src="${PHOTO}" alt="Патриция Морено">
        <span>Патриция Морено · 17 лет</span>
      </div>
      <div class="ms-scene-intro-facts">
        <div><small>время</small><strong>около 03:00</strong><span>полиция прибывает после сообщения о выстрелах</span></div>
        <div><small>место</small><strong>3 этаж</strong><span>Патриция — на площадке пожарной лестницы</span></div>
        <div><small>в квартире</small><strong>4 человека</strong><span>никто не называет стрелка</span></div>
        <div><small>проникновение</small><strong>следов нет</strong><span>насильственный вход в квартиру не обнаружен</span></div>
      </div>`;
    lead.after(visual);
  };

  const observer=new MutationObserver(()=>queueMicrotask(polish));
  observer.observe(app,{childList:true,subtree:true});
  polish();
})();
