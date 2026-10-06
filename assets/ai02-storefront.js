(()=>{'use strict';
const CREATE='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/create-checkout';
const STATUS='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/payment-status';
const DOSSIER='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/player-dossier';
const PRODUCT='ai02_zero_copy',CASE='AI02-NK-STANDARD';
const TOKEN_KEY='mysterylogic:ai-investigation:access-token';
const ORDER_KEY='mysterylogic:ai02-zero-copy:last-order-id';
const REQUEST_KEY='mysterylogic:ai02-zero-copy:checkout-request-id';
const BROWSER_KEY='mysterylogic:challenge:client-key';
const $=s=>document.querySelector(s);
const randomHex=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),x=>x.toString(16).padStart(2,'0')).join('');
const uuid=()=>crypto.randomUUID();
function accessToken(){let v='';try{v=localStorage.getItem(TOKEN_KEY)||''}catch{}if(!/^ml_[a-z0-9]+_[A-Za-z0-9_-]{32,160}$/.test(v)){v='ml_ai02_'+randomHex(32);try{localStorage.setItem(TOKEN_KEY,v)}catch{}}return v}
function browserKey(){let v='';try{v=localStorage.getItem(BROWSER_KEY)||''}catch{}if(!/^[a-f0-9]{48}$/.test(v)){v=randomHex(24);try{localStorage.setItem(BROWSER_KEY,v)}catch{}}return v}
function requestId(){let v='';try{v=localStorage.getItem(REQUEST_KEY)||''}catch{}if(!/^[0-9a-f-]{36}$/i.test(v)){v=uuid();try{localStorage.setItem(REQUEST_KEY,v)}catch{}}return v}
function setStatus(t,k=''){const n=$('[data-ai02-buy-status]');if(!n)return;n.textContent=t;n.classList.toggle('is-error',k==='error')}
async function post(url,body,headers={}){const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body),cache:'no-store',credentials:'omit'});let j={};try{j=await r.json()}catch{}if(!r.ok){const e=new Error(j.error||'request_failed');e.body=j;throw e}return j}
let eligible=false,xp=0;
async function loadDossier(){try{const r=await post(DOSSIER,{action:'status',browserKey:browserKey()});xp=Number(r?.profile?.xp||0);eligible=xp>=240}catch{eligible=false}
const badge=$('[data-ai02-dossier-discount]'),price=$('[data-ai02-price]'),old=$('[data-ai02-old-price]');
if(eligible){if(price)price.textContent='249 ₽';if(old){old.textContent='299 ₽';old.hidden=false}if(badge){badge.hidden=false;badge.textContent='Досье следователя: ранг «Следователь» или выше · скидка 50 ₽'}}else{if(price)price.textContent='299 ₽';if(old)old.hidden=true;if(badge)badge.hidden=true}
return eligible}
async function poll(orderId){setStatus('Проверяем оплату…');const token=accessToken();for(let i=0;i<8;i++){try{const r=await post(STATUS,{orderId},{authorization:'Bearer '+token});if(r.entitled){try{localStorage.setItem(ORDER_KEY,orderId);localStorage.removeItem(REQUEST_KEY)}catch{}location.href='igra/?case='+encodeURIComponent(CASE)+'&autostart=1';return}if(['canceled','refunded','failed'].includes(String(r.status||''))){setStatus('Платёж не завершён. Можно попробовать снова.','error');return}}catch(e){if(i===7){setStatus('Не удалось подтвердить оплату. Ключ доступа сохранён; попробуйте открыть дело позже.','error');return}}await new Promise(r=>setTimeout(r,1800))}setStatus('Банк ещё подтверждает платёж. Нажмите «Открыть дело» через несколько секунд.')}
async function submit(ev){ev.preventDefault();const form=ev.currentTarget,btn=form.querySelector('button[type=submit]');const email=String(form.email?.value||'').trim();if(!email)return;btn.disabled=true;setStatus('Создаём безопасную оплату…');try{const body=await post(CREATE,{productId:PRODUCT,accessToken:accessToken(),requestId:requestId(),caseId:CASE,email,language:'ru',returnUrl:location.origin+location.pathname,offerAccepted:form.offer?.checked===true,privacyAcknowledged:form.privacy?.checked===true,dossierDiscountRequested:eligible,browserKey:browserKey()});if(body.alreadyEntitled){location.href='igra/?case='+encodeURIComponent(CASE);return}if(body.orderId)try{localStorage.setItem(ORDER_KEY,body.orderId)}catch{}if(body.confirmationUrl){location.href=body.confirmationUrl;return}throw new Error('payment_create_failed')}catch(e){const map={offer_acceptance_required:'Подтвердите условия оферты.',privacy_acknowledgement_required:'Подтвердите обработку данных.',dossier_discount_not_eligible:'Скидка Досье пока недоступна — цена будет 299 ₽.',email_required_for_receipt:'Введите e-mail для чека.',invalid_email:'Проверьте e-mail.'};setStatus(map[e.message]||'Не удалось создать оплату. Попробуйте ещё раз.','error');btn.disabled=false}}
document.addEventListener('DOMContentLoaded',async()=>{await loadDossier();$('[data-ai02-buy-form]')?.addEventListener('submit',submit);const q=new URLSearchParams(location.search),order=q.get('order_id')||(()=>{try{return localStorage.getItem(ORDER_KEY)||''}catch{return''}})();if(q.get('payment_return')==='1'&&order)poll(order);});
})();