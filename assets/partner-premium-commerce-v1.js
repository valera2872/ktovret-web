(() => {
'use strict';
const BASE='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1';
const ACCESS=`${BASE}/partner-access-v1`;
const CHECKOUT=`${BASE}/create-checkout-partner-v1`;
const PAYSTATUS=`${BASE}/payment-status-partner-v1`;
const ACCESS_KEY='mysterylogic:partner-premium:access-token';
const ORDER_KEY='mysterylogic:partner-premium:order-id';
const REQUEST_KEY='mysterylogic:partner-premium:request-id';
const NAME_KEY='mysterylogic:partner-premium:player-name';
const BROWSER_KEY='mysterylogic:partner-premium:browser-key';
const PRICE=599;
const roomParam=new URLSearchParams(location.search).get('room')?.trim().toUpperCase()||'';
if(roomParam)return;

const $=s=>document.querySelector(s);
const ui={
  button:$('[data-create]'),name:$('[data-create-name]'),error:$('[data-entry-error]'),
  purchaseFields:$('[data-purchase-fields]'),email:$('[data-purchase-email]'),offer:$('[data-purchase-offer]'),privacy:$('[data-purchase-privacy]'),price:$('[data-price-note]'),
  guestForm:$('[data-guest-code-form]'),guestCode:$('[data-guest-code]'),guestName:$('[data-guest-name]'),guestButton:$('[data-guest-code-submit]'),
};
if(!ui.button)return;
let entitled=false,pendingOrder='';

function randHex(n){return[...crypto.getRandomValues(new Uint8Array(n))].map(v=>v.toString(16).padStart(2,'0')).join('')}
function getStore(key){try{return localStorage.getItem(key)||''}catch{return''}}
function setStore(key,value){try{if(value)localStorage.setItem(key,value);else localStorage.removeItem(key)}catch{}}
function accessToken(){let token=getStore(ACCESS_KEY);if(!/^ml_partner_[A-Za-z0-9_-]{32,160}$/.test(token)){token=`ml_partner_${randHex(32)}`;setStore(ACCESS_KEY,token)}return token}
function browserKey(){let key=getStore(BROWSER_KEY);if(!/^[a-f0-9]{48}$/.test(key)){key=randHex(24);setStore(BROWSER_KEY,key)}return key}
function requestId(){let id=getStore(REQUEST_KEY);if(!/^[0-9a-f-]{36}$/i.test(id)){id=crypto.randomUUID();setStore(REQUEST_KEY,id)}return id}
function setError(message=''){if(!ui.error)return;ui.error.hidden=!message;ui.error.textContent=message}
function busy(on,label='Подождите…'){if(on){ui.button.dataset.old=ui.button.textContent;ui.button.disabled=true;ui.button.textContent=label}else{ui.button.disabled=false;ui.button.textContent=ui.button.dataset.old||ui.button.textContent}}
async function post(url,body,token=''){const headers={'content-type':'application/json'};if(token)headers.authorization=`Bearer ${token}`;const response=await fetch(url,{method:'POST',headers,cache:'no-store',credentials:'omit',body:JSON.stringify(body)});const data=await response.json().catch(()=>({}));return{response,data}}
function human(code){return({partner_access_required:'Покупка полного расследования не найдена.',access_token_required:'Не удалось восстановить ключ покупки.',invalid_email:'Проверьте e-mail для чека.',email_required_for_receipt:'Укажите e-mail для чека.',offer_acceptance_required:'Нужно принять условия оферты.',privacy_acknowledgement_required:'Нужно подтвердить обработку данных.',payment_create_failed:'T‑Bank не создал платёж. Попробуйте ещё раз.',payment_service_not_configured:'Оплата временно недоступна.',order_not_found:'Платёж не найден.',order_access_denied:'Этот платёж относится к другому ключу доступа.'})[code]||String(code||'Не удалось выполнить действие.')}
function saveName(name){setStore(NAME_KEY,name||'Следователь')}
function setEntitled(on){entitled=on;ui.purchaseFields&&(ui.purchaseFields.hidden=on);if(ui.price)ui.price.textContent=on?'Покупка найдена. Прогресс и комната будут восстановлены.':`599 ₽ за всю комнату · второй игрок подключается бесплатно`;ui.button.textContent=on?'Продолжить купленное расследование':`Купить полное расследование — ${PRICE} ₽`}

async function accessStatus(){const token=getStore(ACCESS_KEY);if(!token)return false;const {response,data}=await post(ACCESS,{action:'STATUS'},token);if(response.ok&&data.entitled){setEntitled(true);return true}if(response.status===403){setEntitled(false);return false}throw new Error(data.error||`HTTP ${response.status}`)}
async function paymentStatus(orderId){if(!orderId)return false;const token=getStore(ACCESS_KEY);if(!token)return false;const {response,data}=await post(PAYSTATUS,{orderId},token);if(response.ok&&data.entitled){setEntitled(true);setStore(ORDER_KEY,orderId);return true}if(response.status===404)return false;if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);pendingOrder=orderId;return false}
async function launch(){const name=ui.name?.value.trim()||getStore(NAME_KEY)||'Следователь';saveName(name);const token=accessToken();busy(true,'Восстанавливаем…');setError();try{const {response,data}=await post(ACCESS,{action:'CREATE_OR_RESUME',browserKey:browserKey(),playerName:name},token);if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);const code=String(data.room?.code||'').toUpperCase();if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code))throw new Error('room_restore_failed');const url=new URL(location.href);url.search='';url.searchParams.set('room',code);location.href=url.toString()}catch(error){setError(human(error.message))}finally{busy(false)}}
async function buy(){const name=ui.name?.value.trim()||'Следователь';saveName(name);setError();if(entitled)return launch();if(pendingOrder){busy(true,'Проверяем оплату…');try{if(await paymentStatus(pendingOrder))return launch()}catch(error){setError(human(error.message))}finally{busy(false)}}
const email=ui.email?.value.trim().toLowerCase()||'';if(!email){setError('Укажите e-mail для чека.');ui.email?.focus();return}if(!ui.offer?.checked){setError('Нужно принять условия оферты.');return}if(!ui.privacy?.checked){setError('Нужно подтвердить обработку данных.');return}
busy(true,'Переходим к оплате…');try{const token=accessToken();const returnUrl=new URL(location.href);returnUrl.search='';returnUrl.hash='';const {response,data}=await post(CHECKOUT,{accessToken:token,requestId:requestId(),email,language:'ru',returnUrl:returnUrl.toString(),offerAccepted:true,privacyAcknowledged:true});if(!response.ok)throw new Error(data.error||`HTTP ${response.status}`);setStore(ORDER_KEY,data.orderId);pendingOrder=data.orderId;if(!data.confirmationUrl)throw new Error('payment_create_failed');location.href=data.confirmationUrl}catch(error){setError(human(error.message))}finally{busy(false)}}
function enterByCode(){const code=ui.guestCode?.value.trim().toUpperCase().replace(/\s+/g,'')||'';const name=ui.guestName?.value.trim()||'Следователь';if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code)){setError('Введите 8-значный код комнаты.');return}saveName(name);const url=new URL(location.href);url.search='';url.searchParams.set('room',code);location.href=url.toString()}
async function init(){ui.button.disabled=false;if(ui.name){ui.name.disabled=false;if(!ui.name.value)ui.name.value=getStore(NAME_KEY)}if(ui.guestName&&!ui.guestName.value)ui.guestName.value=getStore(NAME_KEY);ui.button.onclick=buy;if(ui.name)ui.name.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();buy()}};if(ui.guestButton)ui.guestButton.onclick=enterByCode;if(ui.guestCode)ui.guestCode.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();enterByCode()}};
const params=new URLSearchParams(location.search);const returned=params.get('payment_return')==='1';const orderId=params.get('order_id')||getStore(ORDER_KEY);pendingOrder=orderId||'';try{if(returned&&orderId&&await paymentStatus(orderId))return launch();if(await accessStatus())return; if(orderId)await paymentStatus(orderId).catch(()=>{})}catch(error){setError(human(error.message))}setEntitled(entitled)}
init();
})();
