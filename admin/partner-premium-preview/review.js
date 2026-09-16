(() => {
'use strict';

const BASE='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1';
const REVIEW=`${BASE}/partner-review-v1`;
const ACCESS_KEY='mysterylogic:partner-premium:access-token';
const REVIEW_KEY='mysterylogic:partner-premium:review-key';
const REVIEW_MODE_KEY='mysterylogic:partner-premium:review-mode';
const ACCESS_RE=/^ml_partner_[A-Za-z0-9_-]{32,160}$/;
const REVIEW_RE=/^ml_review_[A-Za-z0-9_-]{32,160}$/;

function randHex(n){return[...crypto.getRandomValues(new Uint8Array(n))].map(v=>v.toString(16).padStart(2,'0')).join('')}
function getStore(key){try{return localStorage.getItem(key)||''}catch{return''}}
function setStore(key,value){try{if(value)localStorage.setItem(key,value);else localStorage.removeItem(key)}catch{}}
function accessToken(){let token=getStore(ACCESS_KEY);if(!ACCESS_RE.test(token)){token=`ml_partner_${randHex(32)}`;setStore(ACCESS_KEY,token)}return token}
function reviewKeyFromHash(){const raw=location.hash.startsWith('#')?location.hash.slice(1):location.hash;const params=new URLSearchParams(raw);return String(params.get('review')||'').trim()}
async function post(body){const response=await fetch(REVIEW,{method:'POST',headers:{'content-type':'application/json'},cache:'no-store',credentials:'omit',body:JSON.stringify(body)});const data=await response.json().catch(()=>({}));if(!response.ok){const error=new Error(data.error||`HTTP ${response.status}`);error.code=data.error||'';throw error}return data}

function stripHash(){if(!location.hash)return;history.replaceState(null,'',`${location.pathname}${location.search}`)}
function human(code){return({review_key_invalid:'Review-ссылка недействительна.',review_key_required:'В Review-ссылке нет ключа.',review_access_required:'Тестовый доступ истёк. Откройте исходную Review-ссылку снова.',review_token_conflict:'Этот браузерный ключ уже связан с обычной покупкой. Для Review Mode откройте приватное окно или другой браузер.',review_room_reset_failed:'Не удалось сбросить тестовую комнату.',review_access_write_failed:'Не удалось активировать тестовый доступ.'})[code]||String(code||'Review Mode недоступен.')}

function showActivation(message='Активирую закрытый Review Mode…'){
  let box=document.querySelector('[data-review-activation]');
  if(!box){box=document.createElement('div');box.dataset.reviewActivation='1';box.style.cssText='position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:24px;background:rgba(3,8,12,.94);backdrop-filter:blur(12px);color:#eee;font:600 15px/1.5 Inter,system-ui,sans-serif;text-align:center';box.innerHTML='<div style="max-width:520px;padding:28px;border:1px solid rgba(214,177,108,.36);border-radius:16px;background:#09151d;box-shadow:0 25px 80px rgba(0,0,0,.5)"><div style="margin-bottom:8px;color:#d6b16c;font-size:11px;letter-spacing:.14em;text-transform:uppercase">Mystery Logic · Private Review</div><div data-review-activation-text></div></div>';document.body.appendChild(box)}
  box.querySelector('[data-review-activation-text]').textContent=message;
}
function hideActivation(){document.querySelector('[data-review-activation]')?.remove()}

function renderToolbar(reviewKey){
  if(document.querySelector('[data-review-toolbar]'))return;
  const bar=document.createElement('div');
  bar.dataset.reviewToolbar='1';
  bar.style.cssText='position:fixed;z-index:99990;left:50%;bottom:14px;transform:translateX(-50%);display:flex;align-items:center;gap:9px;max-width:calc(100vw - 22px);padding:8px 10px;border:1px solid rgba(214,177,108,.46);border-radius:12px;background:rgba(7,15,21,.94);box-shadow:0 16px 50px rgba(0,0,0,.42);backdrop-filter:blur(12px);font:700 11px/1.2 Inter,system-ui,sans-serif;color:#dbe4e8';
  bar.innerHTML='<span style="color:#e0bc76;white-space:nowrap">REVIEW MODE</span><span style="color:#8598a3;font-weight:600;white-space:nowrap">оплата отключена</span><button type="button" data-review-reset style="border:1px solid rgba(214,177,108,.28);border-radius:8px;background:#13212a;color:#efd49b;padding:7px 10px;font:inherit;cursor:pointer;white-space:nowrap">Сбросить прохождение</button>';
  document.body.appendChild(bar);
  bar.querySelector('[data-review-reset]').onclick=async()=>{
    if(!confirm('Удалить текущую тестовую комнату и начать расследование заново?'))return;
    const button=bar.querySelector('[data-review-reset]');button.disabled=true;button.textContent='Сбрасываю…';
    try{
      await post({action:'RESET',reviewKey,accessToken:accessToken()});
      const url=new URL(location.href);url.searchParams.delete('room');url.hash='';location.replace(url.toString());
    }catch(error){alert(human(error.code||error.message));button.disabled=false;button.textContent='Сбросить прохождение'}
  };
}

function applyReviewLabels(){
  const note=document.querySelector('[data-price-note]');
  const fields=document.querySelector('[data-purchase-fields]');
  const button=document.querySelector('[data-create]');
  if(fields)fields.hidden=true;
  if(note)note.innerHTML='<strong>Закрытый Review Mode.</strong> Оплата отключена. Это полноценное прохождение с настоящим серверным состоянием и AI-допросами.';
  if(button&&!new URLSearchParams(location.search).get('room'))button.textContent='Начать / продолжить тестовое прохождение';
}

async function activateFromLink(key){
  if(!REVIEW_RE.test(key)){showActivation('Review-ссылка повреждена или неполная.');return}
  showActivation();
  try{
    await post({action:'ACTIVATE',reviewKey:key,accessToken:accessToken()});
    setStore(REVIEW_KEY,key);setStore(REVIEW_MODE_KEY,'1');stripHash();
    location.replace(`${location.pathname}${location.search}`);
  }catch(error){showActivation(human(error.code||error.message))}
}

const incoming=reviewKeyFromHash();
if(incoming){activateFromLink(incoming);return}

const stored=getStore(REVIEW_KEY);
if(REVIEW_RE.test(stored)&&getStore(REVIEW_MODE_KEY)==='1'){
  renderToolbar(stored);
  applyReviewLabels();
  const observer=new MutationObserver(applyReviewLabels);
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  setTimeout(()=>observer.disconnect(),8000);
  post({action:'ACTIVATE',reviewKey:stored,accessToken:accessToken()}).catch(error=>{
    console.warn('partner_review_refresh_failed',error.code||error.message);
  });
}else{
  hideActivation();
}
})();
