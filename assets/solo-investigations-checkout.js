(()=>{
  'use strict';
  const cfg=window.MysteryLogicSoloPaidAccessConfig||{};
  const cases=Array.isArray(window.MysteryLogicSoloPaidCases)?window.MysteryLogicSoloPaidCases:[];
  const details=document.querySelector('[data-solo-paid-checkout]');
  const email=document.querySelector('[data-solo-paid-email]');
  const offer=document.querySelector('[data-solo-paid-offer]');
  const privacy=document.querySelector('[data-solo-paid-privacy]');
  const buy=document.querySelector('[data-solo-paid-buy]');
  const note=document.querySelector('[data-solo-paid-note]');
  if(!buy)return;

  let busy=false,owned=false;
  const setNote=(text,kind='')=>{if(note){note.textContent=text;note.dataset.kind=kind;}};
  const validEmail=(value)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=254;
  const randomToken=()=>{const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);let s='';for(const b of bytes)s+=String.fromCharCode(b);return `ml_live_${btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/g,'')}`;};
  const ensureToken=()=>{let token=localStorage.getItem(cfg.tokenStorageKey)||'';if(!/^ml_[a-z0-9]+_[A-Za-z0-9_-]{32,160}$/.test(token)){token=randomToken();localStorage.setItem(cfg.tokenStorageKey,token);}return token;};
  const track=(event,params={})=>{try{window.MysteryLogicAnalytics?.track?.(event,params);}catch{}};

  function sync(){
    if(owned){buy.disabled=true;buy.textContent='Том I уже открыт';return;}
    buy.textContent=`Перейти к оплате · ${cfg.priceRub||99} ₽`;
    buy.disabled=busy||!validEmail(String(email?.value||'').trim().toLowerCase())||!offer?.checked||!privacy?.checked;
  }

  async function caseAccess(caseId,token){
    const url=new URL(cfg.endpoint);
    url.searchParams.set('case_id',caseId);
    const response=await fetch(url,{headers:{authorization:`Bearer ${token}`},cache:'no-store',credentials:'omit'});
    if(response.ok)return await response.json();
    return null;
  }

  function markOwned(){
    owned=true;
    document.documentElement.classList.add('solo-paid-owned');
    for(const el of document.querySelectorAll('[data-solo-paid-lock]'))el.textContent='Открыто';
    if(details)details.open=false;
    setNote('Том I открыт. Можно начинать любое расследование.','ok');
    sync();
  }

  async function restoreByEntitlement(){
    const token=localStorage.getItem(cfg.tokenStorageKey)||'';
    const first=cases[0]?.id;
    if(!token||!first)return false;
    try{const result=await caseAccess(first,token);if(result?.ok){markOwned();return true;}}catch{}
    return false;
  }

  async function paymentStatus(token,orderId){
    const response=await fetch(cfg.paymentStatusEndpoint,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({orderId}),cache:'no-store',credentials:'omit'});
    let body={};try{body=await response.json();}catch{}
    if(!response.ok)throw new Error(body.error||`http_${response.status}`);
    return body;
  }

  async function reconcileReturn(){
    const params=new URLSearchParams(location.search);
    if(params.get('payment_return')!=='1')return false;
    const token=localStorage.getItem(cfg.tokenStorageKey)||'';
    const orderId=params.get('order_id')||localStorage.getItem(cfg.orderStorageKey)||'';
    sessionStorage.removeItem(cfg.requestStorageKey);
    if(!token||!orderId){setNote('Не найдены данные покупки в этом браузере.','error');return true;}
    setNote('Проверяем оплату…');
    for(const delay of [0,900,1600,2600,4200]){
      if(delay)await new Promise(r=>setTimeout(r,delay));
      try{
        const result=await paymentStatus(token,orderId);
        if(result.status==='paid'&&result.entitled){localStorage.setItem(cfg.orderStorageKey,orderId);track('solo_volume_purchase_completed',{product_id:cfg.productId,order_id:orderId});markOwned();try{history.replaceState({},'',location.pathname);}catch{}return true;}
        if(result.status==='canceled'||result.status==='refunded'){setNote('Платёж не завершён или возвращён.','error');return true;}
      }catch{}
    }
    setNote('Платёж ещё обрабатывается. Обновите страницу через несколько секунд.','error');
    return true;
  }

  async function startCheckout(){
    if(busy||owned)return;
    const customerEmail=String(email?.value||'').trim().toLowerCase();
    if(!validEmail(customerEmail)){setNote('Укажите корректный e-mail для электронного чека.','error');email?.focus();return;}
    if(!offer?.checked||!privacy?.checked){setNote('Подтвердите оферту и политику конфиденциальности.','error');return;}
    busy=true;sync();setNote('Создаём защищённый платёж…');
    const token=ensureToken(),requestId=crypto.randomUUID();
    sessionStorage.setItem(cfg.requestStorageKey,requestId);
    const returnUrl=new URL(location.href);returnUrl.search='';returnUrl.hash='';
    try{
      const response=await fetch(cfg.checkoutEndpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({productId:cfg.productId,accessToken:token,requestId,returnUrl:returnUrl.href,caseId:'',email:customerEmail,language:'ru',offerAccepted:true,privacyAcknowledged:true}),cache:'no-store',credentials:'omit'});
      let body={};try{body=await response.json();}catch{}
      if(!response.ok)throw new Error(body.error||`http_${response.status}`);
      if(!body.orderId||!body.confirmationUrl)throw new Error('invalid_checkout_response');
      localStorage.setItem(cfg.orderStorageKey,body.orderId);
      track('solo_volume_checkout_created',{product_id:cfg.productId,order_id:body.orderId,price:cfg.priceRub});
      setNote('Переходим на защищённую страницу T‑Bank…','ok');
      location.assign(body.confirmationUrl);
    }catch(error){sessionStorage.removeItem(cfg.requestStorageKey);busy=false;sync();setNote(error.message==='invalid_product'?'Платёжный товар ещё не активирован на сервере.':'Не удалось начать оплату. Попробуйте ещё раз.','error');}
  }

  buy.addEventListener('click',startCheckout);
  email?.addEventListener('input',sync);offer?.addEventListener('change',sync);privacy?.addEventListener('change',sync);
  sync();
  reconcileReturn().then(handled=>{if(!handled)restoreByEntitlement();});
})();
