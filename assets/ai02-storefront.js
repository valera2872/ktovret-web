(() => {
  'use strict';
  const PRODUCT_ID='ai02_zero_copy';
  const CASE_ID='AI02-NK-STANDARD';
  const PRICE_RUB=199;
  const DISCOUNT_RUB=50;
  const CHECKOUT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/create-checkout';
  const STATUS='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/payment-status';
  const DOSSIER='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/player-dossier';
  const CLIENT_KEY='mysterylogic:challenge:client-key';
  const TOKEN_KEY=`mysterylogic:ai-investigation:${CASE_ID}:access-token`;
  const ORDER_KEY='mysterylogic:ai02-zero-copy:last-order-id';
  const shell=document.querySelector('[data-ai02-storefront]');
  const game=document.querySelector('[data-ai-v2-player]');
  if(!shell||!game)return;
  let busy=false,discountEligible=false;

  const randomHex=(n)=>Array.from(crypto.getRandomValues(new Uint8Array(n)),v=>v.toString(16).padStart(2,'0')).join('');
  const browserKey=()=>{let v=localStorage.getItem(CLIENT_KEY)||'';if(!/^[a-f0-9]{48}$/.test(v)){v=randomHex(24);localStorage.setItem(CLIENT_KEY,v)}return v};
  const token=()=>{let v=localStorage.getItem(TOKEN_KEY)||'';if(!/^ml_[a-z0-9]+_[A-Za-z0-9_-]{32,160}$/.test(v)){v='ml_ai02_'+btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');localStorage.setItem(TOKEN_KEY,v)}return v};
  const uuid=()=>crypto.randomUUID?crypto.randomUUID():crypto.getRandomValues(new Uint8Array(16)).reduce((s,v)=>s+v.toString(16).padStart(2,'0'),'').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*$/,'$1-$2-4$3-a$4-$5');
  const note=(text,kind='')=>{const n=shell.querySelector('[data-ai02-pay-note]');if(n){n.textContent=text;n.dataset.kind=kind}};
  const price=()=>discountEligible?PRICE_RUB-DISCOUNT_RUB:PRICE_RUB;
  const renderPrice=()=>{const p=shell.querySelector('[data-ai02-price]');const b=shell.querySelector('[data-ai02-buy]');const d=shell.querySelector('[data-ai02-dossier-discount]');if(p)p.innerHTML=discountEligible?`<s>${PRICE_RUB} ₽</s><strong>${price()} ₽</strong>`:`<strong>${PRICE_RUB} ₽</strong>`;if(b)b.textContent=`Купить расследование — ${price()} ₽`;if(d)d.hidden=!discountEligible};

  async function dossier(){
    try{
      const r=await fetch(DOSSIER,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'status',browserKey:browserKey()}),cache:'no-store'});
      const b=await r.json();discountEligible=r.ok&&Number(b?.profile?.xp||0)>=240;renderPrice();
    }catch{renderPrice()}
  }
  async function paymentStatus(orderId){
    const r=await fetch(STATUS,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token()}`},body:JSON.stringify({orderId}),cache:'no-store'});
    let b={};try{b=await r.json()}catch{}if(!r.ok)throw new Error(b.error||`http_${r.status}`);return b;
  }
  const openGame=()=>{shell.hidden=true;game.hidden=false;window.scrollTo({top:0,behavior:'instant'})};
  async function restore(){
    const orderId=localStorage.getItem(ORDER_KEY)||'';if(!orderId)return false;
    try{const s=await paymentStatus(orderId);if(s.status==='paid'&&s.entitled){openGame();return true}}catch{}
    return false;
  }
  async function reconcile(){
    const q=new URLSearchParams(location.search);if(q.get('payment_return')!=='1')return false;
    const orderId=q.get('order_id')||localStorage.getItem(ORDER_KEY)||'';if(!orderId)return false;
    note('Проверяем оплату…');
    for(const delay of [0,900,1600,2800,4500]){
      if(delay)await new Promise(r=>setTimeout(r,delay));
      try{const s=await paymentStatus(orderId);if(s.status==='paid'&&s.entitled){localStorage.setItem(ORDER_KEY,orderId);history.replaceState({},'',location.pathname);openGame();return true}if(s.status==='canceled'){note('Платёж не выполнен. Деньги не списаны.','error');return true}}catch{}
    }
    note('Платёж ещё обрабатывается. Обновите страницу через несколько секунд.','error');return true;
  }
  shell.querySelector('[data-ai02-buy]')?.addEventListener('click',async()=>{
    if(busy)return;
    const email=String(shell.querySelector('[data-ai02-email]')?.value||'').trim().toLowerCase();
    const offer=shell.querySelector('[data-ai02-offer]')?.checked;
    const privacy=shell.querySelector('[data-ai02-privacy]')?.checked;
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return note('Укажите e-mail для электронного чека.','error');
    if(!offer||!privacy)return note('Нужно принять оферту и политику конфиденциальности.','error');
    busy=true;note('Создаём защищённый платёж…');
    try{
      const requestId=uuid();
      const r=await fetch(CHECKOUT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
        productId:PRODUCT_ID,caseId:CASE_ID,accessToken:token(),requestId,
        returnUrl:location.origin+location.pathname,email,language:'ru',
        offerAccepted:true,privacyAcknowledged:true,browserKey:browserKey(),dossierDiscountRequested:discountEligible
      }),cache:'no-store'});
      let b={};try{b=await r.json()}catch{}if(!r.ok)throw new Error(b.error||`http_${r.status}`);
      if(b.alreadyEntitled===true){openGame();busy=false;return}
      if(!b.orderId||!b.confirmationUrl)throw new Error('invalid_checkout_response');
      localStorage.setItem(ORDER_KEY,b.orderId);location.assign(b.confirmationUrl);
    }catch(e){note(e.message==='dossier_lookup_failed'?'Не удалось проверить скидку Досье. Попробуйте ещё раз.':'Не удалось начать оплату. Попробуйте ещё раз.','error');busy=false}
  });

  (async()=>{game.hidden=true;await dossier();if(await reconcile())return;if(await restore())return;})();
})();