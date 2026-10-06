(()=>{
'use strict';
const PRODUCT_ID='ai02-nk',CASE_ID='AI02-NK-STANDARD',PRICE=299,DISCOUNT=50,DISCOUNT_PRICE=249;
const CHECKOUT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/create-checkout-ai02';
const STATUS='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/payment-status-ai02';
const DOSSIER='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/player-dossier';
const TOKEN_KEY='mysterylogic:ai-investigation:access-token:'+CASE_ID;
const ORDER_KEY='mysterylogic:ai02-nk:last-order-id';
const CLIENT_KEY='mysterylogic:challenge:client-key';
const root=document.querySelector('[data-ai02-storefront]');
if(!root)return;
let busy=false,dossierEligible=false,completedCases=0;
const randomHex=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),v=>v.toString(16).padStart(2,'0')).join('');
const browserKey=()=>{let v='';try{v=localStorage.getItem(CLIENT_KEY)||''}catch{}if(!/^[a-f0-9]{48}$/.test(v)){v=randomHex(24);try{localStorage.setItem(CLIENT_KEY,v)}catch{}}return v};
const randomToken=()=>{const b=crypto.getRandomValues(new Uint8Array(32));let x='';for(const v of b)x+=String.fromCharCode(v);return 'ml_ai02_'+btoa(x).replaceAll('+','-').replaceAll('/','_').replace(/=+$/g,'')};
const ensureToken=()=>{try{let t=localStorage.getItem(TOKEN_KEY)||'';if(!/^ml_[a-z0-9]+_[A-Za-z0-9_-]{32,160}$/.test(t)){t=randomToken();localStorage.setItem(TOKEN_KEY,t)}return t}catch{return''}};
const uuid=()=>crypto.randomUUID?crypto.randomUUID():(()=>{const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=[...b].map(v=>v.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)})();
const setNote=(text,kind='')=>{const n=root.querySelector('[data-ai02-payment-note]');if(n){n.textContent=text;n.dataset.kind=kind}};
const track=(name,meta={})=>{try{window.MysteryLogicFunnel?.track?.(name,{product:PRODUCT_ID,case_id:CASE_ID,...meta},'ai02-checkout')}catch{}};
const applyPrice=()=>{
 const price=dossierEligible?DISCOUNT_PRICE:PRICE;
 root.querySelectorAll('[data-ai02-price]').forEach(n=>n.textContent=String(price));
 const old=root.querySelector('[data-ai02-old-price]');if(old){old.textContent=dossierEligible?PRICE+' ₽':'';old.hidden=!dossierEligible}
 const badge=root.querySelector('[data-ai02-dossier-discount]');if(badge){badge.hidden=!dossierEligible;badge.textContent=dossierEligible?'Первое досье 15/15: −'+DISCOUNT+' ₽':''}
 const progress=root.querySelector('[data-ai02-dossier-progress]');if(progress)progress.textContent=completedCases?completedCases+'/15 дел в досье':'';
};
const loadDossier=async()=>{
 try{
  const r=await fetch(DOSSIER,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'status',browserKey:browserKey()}),cache:'no-store',credentials:'omit'});
  if(!r.ok)return;const b=await r.json();completedCases=Number(b?.profile?.completedCases||0);dossierEligible=completedCases>=15;applyPrice();
 }catch{}
};
const status=async(token,orderId)=>{
 const r=await fetch(STATUS,{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify({orderId}),cache:'no-store',credentials:'omit'});
 let b={};try{b=await r.json()}catch{}if(!r.ok)throw new Error(b.error||'http_'+r.status);return b;
};
const cleanReturn=()=>{try{history.replaceState({},'',location.pathname)}catch{}};
const reconcileReturn=async()=>{
 const p=new URLSearchParams(location.search);if(p.get('payment_return')!=='1')return false;
 const token=ensureToken(),orderId=p.get('order_id')||localStorage.getItem(ORDER_KEY)||'';
 if(!token||!orderId){setNote('Не удалось найти данные покупки в этом браузере. Если деньги списались, напишите в поддержку.','error');return true}
 setNote('Проверяем оплату…');
 for(const delay of [0,900,1600,2600,4200]){
  if(delay)await new Promise(r=>setTimeout(r,delay));
  try{
   const b=await status(token,orderId);
   if(b.status==='paid'&&b.entitled){localStorage.setItem(ORDER_KEY,orderId);setNote('Оплата подтверждена. Открываем дело…','ok');track('checkout_success',{price_rub:Number(b.amountRub||PRICE),discount_rub:Number(b.discountRub||0)});cleanReturn();location.reload();return true}
   if(b.status==='canceled'){setNote('Платёж не выполнен. Деньги не списаны.','error');cleanReturn();return true}
   if(b.status==='refunded'){setNote('Платёж возвращён. Доступ закрыт.','error');cleanReturn();return true}
  }catch{}
 }
 setNote('Платёж ещё обрабатывается. Обновите страницу через несколько секунд.');return true;
};
const restoreOrder=async()=>{
 let token='',orderId='';try{token=localStorage.getItem(TOKEN_KEY)||'';orderId=localStorage.getItem(ORDER_KEY)||''}catch{}
 if(!token||!orderId)return;
 try{const b=await status(token,orderId);if(b.status==='paid'&&b.entitled)setNote('Покупка найдена. Продолжаем расследование.','ok')}catch{}
};
const form=root.querySelector('[data-ai02-checkout-form]');
form?.addEventListener('submit',async e=>{
 e.preventDefault();if(busy)return;
 const email=String(form.querySelector('[name=email]')?.value||'').trim().toLowerCase();
 const offer=Boolean(form.querySelector('[name=offer]')?.checked),privacy=Boolean(form.querySelector('[name=privacy]')?.checked);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setNote('Проверьте e-mail.','error');return}
 if(!offer||!privacy){setNote('Подтвердите оферту и политику конфиденциальности.','error');return}
 busy=true;const btn=form.querySelector('button[type=submit]');if(btn)btn.disabled=true;setNote('Создаём защищённый платёж…');
 try{
  const token=ensureToken();if(!token)throw new Error('browser_storage_unavailable');
  const requestId=uuid();track('checkout_request',{price_rub:dossierEligible?DISCOUNT_PRICE:PRICE});
  const r=await fetch(CHECKOUT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
   accessToken:token,requestId,returnUrl:location.origin+location.pathname,email,language:'ru',
   offerAccepted:true,privacyAcknowledged:true,browserKey:browserKey()
  }),cache:'no-store',credentials:'omit'});
  let b={};try{b=await r.json()}catch{}if(!r.ok)throw new Error(b.error||'http_'+r.status);
  if(!b.orderId||!b.confirmationUrl)throw new Error('invalid_checkout_response');
  localStorage.setItem(ORDER_KEY,b.orderId);track('checkout_created',{price_rub:Number(b.amountRub||PRICE),discount_rub:Number(b.discountRub||0),order_id:b.orderId});
  setNote('Переходим на защищённую страницу T‑Bank…','ok');location.assign(b.confirmationUrl);
 }catch(err){const m=String(err?.message||'checkout_failed');const map={
  browser_storage_unavailable:'Браузер блокирует локальное хранение. Разрешите данные сайта и повторите.',
  payment_service_not_configured:'Оплата временно недоступна.',
  payment_create_failed:'T‑Bank не создал платёж. Попробуйте ещё раз.',
  order_create_failed:'Не удалось создать заказ. Попробуйте ещё раз.',
  dossier_discount_check_failed:'Не удалось проверить бонус досье. Попробуйте ещё раз.',
 };setNote(map[m]||'Не удалось начать оплату. Попробуйте ещё раз.','error');track('checkout_fail',{reason:m});busy=false;if(btn)btn.disabled=false}
});
window.addEventListener('ml:ai-case-access',e=>{if(e.detail?.caseId!==CASE_ID)return;root.hidden=true;document.body.classList.add('ai02-has-access');});
loadDossier();
reconcileReturn().then(handled=>{if(!handled)restoreOrder()});
})();