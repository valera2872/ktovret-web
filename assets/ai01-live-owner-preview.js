(()=>{
  'use strict';
  const params=new URL(location.href).searchParams;
  if(params.get('live')!=='1')return;

  const STORAGE_KEY='mysterylogic:ai01:owner-live-token';
  const CASE_ID='AI-01';
  const saved=String(localStorage.getItem(STORAGE_KEY)||'').trim();
  const hasToken=saved.length>=32&&saved.length<=512;

  window.MysteryLogicPaidAccess={
    ...(window.MysteryLogicPaidAccess||{}),
    caseId:CASE_ID,
    token:hasToken?saved:'',
    experienceTier:hasToken?'live':'text'
  };
  window.ML_AVATAR_CONFIG={
    ...(window.ML_AVATAR_CONFIG||{}),
    enabled:hasToken,
    provider:'liveavatar',
    caseId:CASE_ID,
    accessToken:hasToken?saved:'',
    experienceTier:hasToken?'live':'text'
  };

  function mount(){
    const topbar=document.querySelector('.aid-topbar');
    if(!topbar||document.querySelector('[data-ai01-live-owner]'))return;
    const style=document.createElement('style');
    style.textContent='.ai01-owner-live{position:fixed;right:18px;bottom:18px;z-index:50;width:min(390px,calc(100vw - 36px));padding:14px;border:1px solid rgba(210,174,115,.35);border-radius:14px;background:rgba(6,16,25,.96);box-shadow:0 22px 60px rgba(0,0,0,.38);color:#edf4f7;font:12px/1.45 Inter,system-ui,sans-serif}.ai01-owner-live strong{display:block;color:#f0d6a5;font-size:12px;letter-spacing:.04em}.ai01-owner-live p{margin:5px 0 10px;color:#92a7b4}.ai01-owner-live form{display:flex;gap:7px}.ai01-owner-live input{min-width:0;flex:1;padding:9px 10px;border:1px solid rgba(196,216,228,.18);border-radius:8px;background:#0d1b26;color:#edf4f7}.ai01-owner-live button{padding:9px 11px;border:1px solid rgba(210,174,115,.35);border-radius:8px;background:rgba(210,174,115,.08);color:#f0d6a5;cursor:pointer}.ai01-owner-live .ai01-live-meta{display:flex;align-items:center;justify-content:space-between;gap:10px}.ai01-owner-live .is-on{color:#8fc4aa}.ai01-owner-live .is-off{color:#c9a36f}@media(max-width:640px){.ai01-owner-live{right:10px;bottom:10px;width:calc(100vw - 20px)}}';
    document.head.appendChild(style);
    const box=document.createElement('aside');
    box.className='ai01-owner-live';box.dataset.ai01LiveOwner='';
    box.innerHTML=hasToken
      ?'<div class="ai01-live-meta"><strong>AI-01 · Owner Live preview</strong><span class="is-on">ключ загружен</span></div><p>Страница передаёт Live-entitlement существующему avatar broker. Если LiveAvatar ещё не настроен на сервере, расследование безопасно продолжится текстом.</p><button type="button" data-ai01-live-clear>Сменить Live-ключ</button>'
      :'<div class="ai01-live-meta"><strong>AI-01 · Owner Live preview</strong><span class="is-off">Live выключен</span></div><p>Введите отдельный owner Live-ключ. Обычный прототип без ?live=1 эта настройка не затрагивает.</p><form data-ai01-live-form><input type="password" autocomplete="off" spellcheck="false" placeholder="ML-AI01…" aria-label="Owner Live key"><button type="submit">Включить</button></form><p data-ai01-live-status aria-live="polite"></p>';
    document.body.appendChild(box);
    box.querySelector('[data-ai01-live-clear]')?.addEventListener('click',()=>{localStorage.removeItem(STORAGE_KEY);location.reload()});
    box.querySelector('[data-ai01-live-form]')?.addEventListener('submit',event=>{
      event.preventDefault();const input=box.querySelector('input');const token=String(input?.value||'').trim();const status=box.querySelector('[data-ai01-live-status]');
      if(token.length<32||token.length>512){if(status)status.textContent='Ключ должен содержать не менее 32 символов.';return}
      localStorage.setItem(STORAGE_KEY,token);location.reload();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
