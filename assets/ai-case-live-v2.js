(()=>{
  'use strict';
  const root=document.querySelector('[data-ai-v2-player]');
  if(!root)return;

  const script=document.currentScript;
  const assetsBase=new URL('.',script?.src||document.baseURI);
  const STORAGE_KEY='mysterylogic:ai-investigation:access-token';
  const PUBLIC_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ya252dXdrbnZzZWRqZ3FjZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTY2MzcsImV4cCI6MjEwMTc3MjYzN30.68loNx8A71dodfOXXKs_-I235XVCmEioXGrg8kCZQr4';
  const CASE_RE=/^[A-Za-z0-9_:-]{3,160}$/;
  let loading=null;
  let activated=false;

  const caseId=()=>{const p=new URL(location.href).searchParams;const id=(p.get('case')||p.get('case_id')||'').trim();return CASE_RE.test(id)?id:''};
  const stage=()=>root.querySelector('[data-avatar-stage]');
  const intro=()=>root.querySelector('[data-view="intro"]');
  const tierNode=()=>root.querySelector('[data-case-tier]');
  const isUnlocked=()=>!!intro()&&!intro().hidden;
  const isLive=()=>/^Live\b/i.test(tierNode()?.textContent?.trim()||'');

  async function loadProvider(){
    if(window.MLAvatarBridge){if(!window.MLAvatarBridge.started)await window.MLAvatarBridge.start(document);return true}
    if(loading)return loading;
    loading=new Promise((resolve,reject)=>{
      const node=document.createElement('script');
      node.src=new URL('ai-avatar-provider.js?v=0.0.3',assetsBase).href;
      node.onload=async()=>{try{if(window.MLAvatarBridge&&!window.MLAvatarBridge.started)await window.MLAvatarBridge.start(document);resolve(true)}catch(error){reject(error)}};
      node.onerror=()=>reject(new Error('avatar_provider_load_failed'));
      document.head.appendChild(node);
    });
    return loading;
  }

  async function activate(){
    if(activated||!isUnlocked())return;
    const shell=stage();
    if(!isLive()){
      if(shell){shell.hidden=true;shell.setAttribute('aria-hidden','true')}
      return;
    }
    const id=caseId();
    const token=(localStorage.getItem(STORAGE_KEY)||'').trim();
    if(!id||token.length<32)return;
    activated=true;
    window.MysteryLogicPaidAccess={...(window.MysteryLogicPaidAccess||{}),token,caseId:id,experienceTier:'live',features:{...(window.MysteryLogicPaidAccess?.features||{}),freeTextInterrogation:true,liveAvatar:true}};
    window.ML_AVATAR_CONFIG={...(window.ML_AVATAR_CONFIG||{}),enabled:true,provider:'liveavatar',publicAnon:PUBLIC_ANON,caseId:id,accessToken:token,experienceTier:'live'};
    try{await loadProvider()}catch(error){activated=false;console.warn('[Mystery Logic Live v2]',error);if(shell){shell.hidden=true;shell.setAttribute('aria-hidden','true')}const status=root.querySelector('[data-room-status]');if(status)status.textContent='Живой режим временно недоступен. Расследование продолжается текстом.'}
  }

  const observer=new MutationObserver(()=>{void activate()});
  if(intro())observer.observe(intro(),{attributes:true,attributeFilter:['hidden']});
  if(tierNode())observer.observe(tierNode(),{childList:true,characterData:true,subtree:true});
  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',()=>void activate(),{once:true});else void activate();
})();
