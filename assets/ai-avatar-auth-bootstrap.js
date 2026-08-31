(()=>{
  'use strict';
  const PUBLIC_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ya252dXdrbnZzZWRqZ3FjZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTY2MzcsImV4cCI6MjEwMTc3MjYzN30.68loNx8A71dodfOXXKs_-I235XVCmEioXGrg8kCZQr4';
  const AI01_OWNER_STORAGE='mysterylogic:ai01:owner-live-token';
  const AI01_ADMIN_PREVIEW='mysterylogic:ai01:admin-live-preview:v1';
  const params=new URL(location.href).searchParams;
  const isAi01=/\/detektivnaya-igra-s-ii\/?$/.test(location.pathname);
  const adminPreviewRequested=isAi01&&params.get('live')==='1'&&params.get('admin_preview')==='1';
  let adminPreviewSession=false;
  let adminPreviewParent=false;
  try{adminPreviewSession=sessionStorage.getItem(AI01_ADMIN_PREVIEW)==='1'}catch{}
  try{adminPreviewParent=window.self!==window.top&&/\/admin\/ai01-live-preview\/?$/.test(window.parent.location.pathname)}catch{}
  const ownerLive=adminPreviewRequested&&adminPreviewSession&&adminPreviewParent;
  const ownerToken=ownerLive?String(localStorage.getItem(AI01_OWNER_STORAGE)||'').trim():'';
  const ownerTokenValid=ownerToken.length>=32&&ownerToken.length<=512;

  window.ML_AI_PUBLIC_AUTH={...(window.ML_AI_PUBLIC_AUTH||{}),anon:PUBLIC_ANON};
  window.ML_AVATAR_CONFIG={
    ...(window.ML_AVATAR_CONFIG||{}),
    publicAnon:PUBLIC_ANON,
    ...(ownerLive?{
      enabled:ownerTokenValid,
      provider:'liveavatar',
      caseId:'AI-01',
      accessToken:ownerTokenValid?ownerToken:'',
      experienceTier:ownerTokenValid?'live':'text'
    }:{})
  };
  if(ownerLive){
    window.MysteryLogicPaidAccess={
      ...(window.MysteryLogicPaidAccess||{}),
      caseId:'AI-01',
      token:ownerTokenValid?ownerToken:'',
      experienceTier:ownerTokenValid?'live':'text'
    };
  }

  function mountOwnerLiveControl(){
    if(!ownerLive||document.querySelector('[data-ai01-live-owner]'))return;
    const style=document.createElement('style');
    style.textContent='.ai01-owner-live{position:fixed;right:18px;bottom:18px;z-index:50;width:min(390px,calc(100vw - 36px));padding:14px;border:1px solid rgba(210,174,115,.35);border-radius:14px;background:rgba(6,16,25,.96);box-shadow:0 22px 60px rgba(0,0,0,.38);color:#edf4f7;font:12px/1.45 Inter,system-ui,sans-serif}.ai01-owner-live strong{display:block;color:#f0d6a5}.ai01-owner-live p{margin:5px 0 10px;color:#92a7b4}.ai01-owner-live form{display:flex;gap:7px}.ai01-owner-live input{min-width:0;flex:1;padding:9px 10px;border:1px solid rgba(196,216,228,.18);border-radius:8px;background:#0d1b26;color:#edf4f7}.ai01-owner-live button{padding:9px 11px;border:1px solid rgba(210,174,115,.35);border-radius:8px;background:rgba(210,174,115,.08);color:#f0d6a5;cursor:pointer}.ai01-owner-live .ai01-live-meta{display:flex;align-items:center;justify-content:space-between;gap:10px}.ai01-owner-live .is-on{color:#8fc4aa}.ai01-owner-live .is-off{color:#c9a36f}@media(max-width:640px){.ai01-owner-live{right:10px;bottom:10px;width:calc(100vw - 20px)}}';
    document.head.appendChild(style);
    const box=document.createElement('aside');
    box.className='ai01-owner-live';box.dataset.ai01LiveOwner='';
    box.innerHTML=ownerTokenValid
      ?'<div class="ai01-live-meta"><strong>AI-01 · Owner Live preview</strong><span class="is-on">Live-ключ загружен</span></div><p>Живой слой активирован только в административном предпросмотре. Если внешний LiveAvatar ещё не настроен, расследование автоматически продолжится текстом.</p><button type="button" data-ai01-live-clear>Сменить Live-ключ</button>'
      :'<div class="ai01-live-meta"><strong>AI-01 · Owner Live preview</strong><span class="is-off">Live выключен</span></div><p>Введите отдельный owner Live-ключ. Публичная AI-01 остаётся текстовой.</p><form data-ai01-live-form><input type="password" autocomplete="off" spellcheck="false" placeholder="ML-AI01…" aria-label="Owner Live key"><button type="submit">Включить</button></form><p data-ai01-live-status aria-live="polite"></p>';
    document.body.appendChild(box);
    box.querySelector('[data-ai01-live-clear]')?.addEventListener('click',()=>{localStorage.removeItem(AI01_OWNER_STORAGE);location.reload()});
    box.querySelector('[data-ai01-live-form]')?.addEventListener('submit',event=>{
      event.preventDefault();const input=box.querySelector('input');const token=String(input?.value||'').trim();const status=box.querySelector('[data-ai01-live-status]');
      if(token.length<32||token.length>512){if(status)status.textContent='Live-ключ должен содержать не менее 32 символов.';return}
      localStorage.setItem(AI01_OWNER_STORAGE,token);location.reload();
    });
  }
  if(ownerLive){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountOwnerLiveControl,{once:true});else mountOwnerLiveControl()}
})();
