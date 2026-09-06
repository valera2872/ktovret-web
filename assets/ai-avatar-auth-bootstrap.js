(()=>{
  'use strict';
  const PUBLIC_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ya252dXdrbnZzZWRqZ3FjZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTY2MzcsImV4cCI6MjEwMTc3MjYzN30.68loNx8A71dodfOXXKs_-I235XVCmEioXGrg8kCZQr4';
  const AI01_OWNER_STORAGE='mysterylogic:ai01:owner-live-token';
  const AI01_ADMIN_PREVIEW='mysterylogic:ai01:admin-live-preview:v1';
  const AI01_RESISTANCE_STORAGE='mysterylogic:ai01:resistance:v1';
  const AI01_STATE_STORAGE='ml_ai_demo_state_v4';
  const RESISTANCE_LEVELS=new Set(['easy','medium','hard']);
  const AI01_OPENING_REWRITES=new Map([
    ['После 21:25 я была во внутреннем дворике и разговаривала по телефону. В закрытый фонд больше не заходила.','После девяти двадцати пяти я была во внутреннем дворике — разговаривала по телефону. В фонд после этого не возвращалась.'],
    ['Камеру сервисного коридора перезапускал я. Это была плановая работа. В это время я находился в комнате контроля.','Камеру в служебном коридоре перезапускал я — это была плановая работа. Всё это время я был в комнате контроля.'],
    ['Я закончил работу около девяти двадцати и вышел. С архивом спорил, это правда, но после выхода не возвращался.','Я закончил примерно в девять двадцать и вышел. Да, с сотрудниками архива у меня был спор из-за доступа к материалам. Но после того как ушёл, я не возвращался.']
  ]);
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

  function polishAi01Text(value){const text=String(value||'');return AI01_OPENING_REWRITES.get(text)||text}
  function migrateSavedOpenings(){
    if(!isAi01)return;
    try{
      const saved=JSON.parse(sessionStorage.getItem(AI01_STATE_STORAGE)||'null');
      if(!saved?.transcripts||typeof saved.transcripts!=='object')return;
      let changed=false;
      for(const messages of Object.values(saved.transcripts))if(Array.isArray(messages))for(const message of messages){
        if(!message||typeof message.text!=='string')continue;
        const next=polishAi01Text(message.text);if(next!==message.text){message.text=next;changed=true}
      }
      if(changed)sessionStorage.setItem(AI01_STATE_STORAGE,JSON.stringify(saved));
    }catch{}
  }
  migrateSavedOpenings();

  function readResistance(){
    try{const value=sessionStorage.getItem(AI01_RESISTANCE_STORAGE)||'';if(RESISTANCE_LEVELS.has(value))return value}catch{}
    return 'medium';
  }
  function writeResistance(level){
    const value=RESISTANCE_LEVELS.has(level)?level:'medium';
    try{sessionStorage.setItem(AI01_RESISTANCE_STORAGE,value)}catch{}
    window.ML_AI_RESISTANCE_LEVEL=value;
    return value;
  }
  writeResistance(readResistance());

  if(isAi01&&!window.__ML_AI01_RESISTANCE_FETCH_PATCHED){
    window.__ML_AI01_RESISTANCE_FETCH_PATCHED=true;
    const nativeFetch=window.fetch.bind(window);
    window.fetch=(input,init)=>{
      try{
        const url=typeof input==='string'?input:(input instanceof URL?input.href:String(input?.url||''));
        if(url.includes('/functions/v1/ai-interrogation-v1')&&init&&typeof init.body==='string'){
          const body=JSON.parse(init.body);
          if(body&&typeof body==='object'){
            const history=Array.isArray(body.history)?body.history.slice(-6).map(item=>({...item,text:polishAi01Text(item?.text)})):body.history;
            init={...init,body:JSON.stringify({...body,...(Array.isArray(history)?{history}:{}),resistance_level:readResistance()})};
          }
        }
      }catch{}
      return nativeFetch(input,init);
    };
  }

  window.ML_AI_PUBLIC_AUTH={...(window.ML_AI_PUBLIC_AUTH||{}),anon:PUBLIC_ANON};
  window.ML_AVATAR_CONFIG={
    ...(window.ML_AVATAR_CONFIG||{}),
    publicAnon:PUBLIC_ANON,
    ...(ownerLive?{
      enabled:ownerTokenValid,
      provider:'liveavatar',
      caseId:'AI-01',
      accessToken:ownerTokenValid?ownerToken:'',
      experienceTier:ownerTokenValid?'live':'text',
      ownerPreview:true
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

  function mountResistanceControl(){
    if(!isAi01||document.querySelector('[data-ai01-resistance]'))return;
    const intro=document.querySelector('[data-ai-detective] [data-view="intro"] .aid-intro-copy');
    const start=intro?.querySelector('[data-action="start"]');
    if(!intro||!start)return;
    const style=document.createElement('style');
    style.textContent='.ai01-resistance{margin:22px 0 18px;padding:16px;border:1px solid rgba(210,174,115,.22);border-radius:16px;background:linear-gradient(180deg,rgba(13,27,38,.82),rgba(8,19,28,.72));box-shadow:inset 0 1px rgba(255,255,255,.025)}.ai01-resistance-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:12px}.ai01-resistance-head strong{font:600 13px/1.2 Inter,system-ui,sans-serif;color:#edf4f7}.ai01-resistance-head span{font:10px/1.3 Inter,system-ui,sans-serif;color:#7f96a5;text-align:right}.ai01-resistance-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.ai01-resistance-option{appearance:none;text-align:left;padding:11px 12px;border:1px solid rgba(196,216,228,.13);border-radius:12px;background:rgba(255,255,255,.025);color:#d9e5ea;cursor:pointer;transition:border-color .16s ease,background .16s ease,transform .16s ease}.ai01-resistance-option:hover{transform:translateY(-1px);border-color:rgba(210,174,115,.32)}.ai01-resistance-option strong{display:block;margin-bottom:4px;font:600 12px/1.2 Inter,system-ui,sans-serif;color:#edf4f7}.ai01-resistance-option small{display:block;font:10px/1.35 Inter,system-ui,sans-serif;color:#8fa4b1}.ai01-resistance-option.is-active{border-color:rgba(210,174,115,.62);background:rgba(210,174,115,.08);box-shadow:0 0 0 1px rgba(210,174,115,.08) inset}.ai01-resistance-option.is-active strong{color:#f0d6a5}.ai01-resistance-option em{display:inline-block;margin-left:5px;font:700 8px/1 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8fc4aa;font-style:normal}@media(max-width:760px){.ai01-resistance-head{align-items:flex-start;flex-direction:column;gap:5px}.ai01-resistance-head span{text-align:left}.ai01-resistance-options{grid-template-columns:1fr}}';
    document.head.appendChild(style);
    const box=document.createElement('section');
    box.className='ai01-resistance';box.dataset.ai01Resistance='';
    box.innerHTML='<div class="ai01-resistance-head"><strong>Сопротивление на допросе</strong><span>Факты дела не меняются — меняется только то, как долго фигуранты держат линию.</span></div><div class="ai01-resistance-options" role="radiogroup" aria-label="Сопротивление на допросе"><button class="ai01-resistance-option" type="button" data-level="easy" role="radio"><strong>Лёгкий</strong><small>Быстрее сдаёт позиции после 2–3 сильных противоречий.</small></button><button class="ai01-resistance-option" type="button" data-level="medium" role="radio"><strong>Средний <em>рекомендуется</em></strong><small>Нужна убедительная цепочка, но без «магической формулы» финального вопроса.</small></button><button class="ai01-resistance-option" type="button" data-level="hard" role="radio"><strong>Тяжёлый</strong><small>Максимально держится: почти все линии доказательств и точное финальное давление.</small></button></div>';
    intro.insertBefore(box,start);
    const render=()=>{
      const active=readResistance();
      box.querySelectorAll('[data-level]').forEach(button=>{
        const on=button.dataset.level===active;button.classList.toggle('is-active',on);button.setAttribute('aria-checked',on?'true':'false');
      });
    };
    box.querySelectorAll('[data-level]').forEach(button=>button.addEventListener('click',()=>{writeResistance(button.dataset.level||'medium');render()}));
    render();
  }

  function mountOwnerLiveControl(){
    if(!ownerLive||document.querySelector('[data-ai01-live-owner]'))return;
    const style=document.createElement('style');
    style.textContent='.ai01-owner-live{position:fixed;right:10px;bottom:10px;z-index:50;width:min(390px,calc(100vw - 20px));padding:12px;border:1px solid rgba(210,174,115,.35);border-radius:12px;background:rgba(6,16,25,.95);box-shadow:0 16px 42px rgba(0,0,0,.32);color:#edf4f7;font:11px/1.35 Inter,system-ui,sans-serif}.ai01-owner-live strong{display:block;color:#f0d6a5}.ai01-owner-live p{margin:5px 0 9px;color:#92a7b4}.ai01-owner-live form{display:flex;gap:7px}.ai01-owner-live input{min-width:0;flex:1;padding:8px 9px;border:1px solid rgba(196,216,228,.18);border-radius:8px;background:#0d1b26;color:#edf4f7}.ai01-owner-live button{padding:7px 9px;border:1px solid rgba(210,174,115,.35);border-radius:8px;background:rgba(210,174,115,.08);color:#f0d6a5;cursor:pointer}.ai01-owner-live .ai01-live-meta{display:flex;align-items:center;justify-content:space-between;gap:8px}.ai01-owner-live .is-on{color:#8fc4aa}.ai01-owner-live .is-off{color:#c9a36f}.ai01-owner-live.is-compact{width:auto;display:flex;align-items:center;gap:8px;padding:7px 9px}.ai01-owner-live.is-compact strong{display:inline;font-size:10px}.ai01-owner-live.is-compact .ai01-live-meta{gap:7px}.ai01-owner-live.is-compact button{padding:5px 7px;font-size:9px}@media(max-width:640px){.ai01-owner-live{right:8px;bottom:8px;width:calc(100vw - 16px)}.ai01-owner-live.is-compact{width:auto;max-width:calc(100vw - 16px)}}';
    document.head.appendChild(style);
    const box=document.createElement('aside');
    box.className=ownerTokenValid?'ai01-owner-live is-compact':'ai01-owner-live';box.dataset.ai01LiveOwner='';
    box.innerHTML=ownerTokenValid
      ?'<div class="ai01-live-meta"><strong>Live preview</strong><span class="is-on">ключ ✓</span></div><button type="button" data-ai01-live-clear>Сменить</button>'
      :'<div class="ai01-live-meta"><strong>AI-01 · Owner Live preview</strong><span class="is-off">Live выключен</span></div><p>Введите отдельный owner Live-ключ. Публичная AI-01 остаётся текстовой.</p><form data-ai01-live-form><input type="password" autocomplete="off" spellcheck="false" placeholder="ML-AI01…" aria-label="Owner Live key"><button type="submit">Включить</button></form><p data-ai01-live-status aria-live="polite"></p>';
    document.body.appendChild(box);
    box.querySelector('[data-ai01-live-clear]')?.addEventListener('click',()=>{localStorage.removeItem(AI01_OWNER_STORAGE);location.reload()});
    box.querySelector('[data-ai01-live-form]')?.addEventListener('submit',event=>{
      event.preventDefault();const input=box.querySelector('input');const token=String(input?.value||'').trim();const status=box.querySelector('[data-ai01-live-status]');
      if(token.length<32||token.length>512){if(status)status.textContent='Live-ключ должен содержать не менее 32 символов.';return}
      localStorage.setItem(AI01_OWNER_STORAGE,token);location.reload();
    });
  }

  function mountOpeningPolish(){
    if(!isAi01)return;
    const transcript=document.querySelector('[data-ai-detective] [data-transcript]');
    if(!transcript)return;
    const apply=()=>transcript.querySelectorAll('.aid-message.is-suspect:not(.aid-typing)').forEach(message=>{
      const textNode=message.children?.[1];if(!textNode)return;
      const next=polishAi01Text(textNode.textContent||'');if(next!==textNode.textContent)textNode.textContent=next;
    });
    apply();
    const observer=new MutationObserver(apply);observer.observe(transcript,{childList:true,subtree:true});
  }

  const mount=()=>{mountResistanceControl();mountOpeningPolish();if(ownerLive)mountOwnerLiveControl()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
