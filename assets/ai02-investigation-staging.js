(()=>{'use strict';
const API='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-interrogation-v2',ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ya252dXdrbnZzZWRqZ3FjZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTY2MzcsImV4cCI6MjEwMTc3MjYzN30.68loNx8A71dodfOXXKs_-I235XVCmEioXGrg8kCZQr4',ACCESS_KEY='mysterylogic:ai-investigation:access-token';

const PORTRAIT_SPRITE='https://media.canva.com/v2/image-resize/format:JPG/height:40/quality:75/uri:ifs%3A%2F%2FM%2Fa8ca4cde-322c-4ee7-a691-779f023e2ab4/watermark:F/width:200?csig=AAAAAAAAAAAAAAAAAAAAAOjYFdcAOOTVrPGbV8pSVBx4pSfPG825gbddWIZraEFk&exp=1790906415&osig=AAAAAAAAAAAAAAAAAAAAAJ797JA0xa_VQ1QMvQ7B4YV08VwNF0xv3luKetbUQmFT&signer=media-rpc&x-canva-quality=thumbnail';
const PORTRAIT_POS={serov:'0%',elena:'25%',artem:'50%',sofia:'75%',david:'100%'};
function decoratePortraits(){
 const strip=document.querySelector('[data-suspect-strip]'); if(!strip)return;
 strip.querySelectorAll('[data-suspect]').forEach(btn=>{const id=btn.dataset.suspect;if(!PORTRAIT_POS[id]||btn.querySelector('.aid02-portrait-thumb'))return;const pic=document.createElement('span');pic.className='aid02-portrait-thumb';pic.style.backgroundImage='url("'+PORTRAIT_SPRITE+'")';pic.style.backgroundPosition=PORTRAIT_POS[id]+' center';btn.prepend(pic)});
 const active=strip.querySelector('[data-suspect].is-active')||strip.querySelector('[data-suspect]'); const id=active?.dataset.suspect;
 let hero=document.querySelector('[data-ai02-portrait]'); if(!hero){const head=document.querySelector('.aid-room-head'); if(head){hero=document.createElement('div');hero.className='aid02-portrait';hero.dataset.ai02Portrait='';head.prepend(hero)}}
 if(hero&&PORTRAIT_POS[id]){hero.style.backgroundImage='url("'+PORTRAIT_SPRITE+'")';hero.style.backgroundPosition=PORTRAIT_POS[id]+' center'}
}
const params=new URLSearchParams(location.search);const caseId=params.get('case')||'AI02-NK-STANDARD';const PREVIEW=params.get('preview')==='workspace';
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function investigate(request){const token=localStorage.getItem(ACCESS_KEY)||'';if(!token)throw new Error('Сначала откройте дело ключом доступа.');const r=await fetch(API,{method:'POST',headers:{'content-type':'application/json','apikey':ANON,'authorization':'Bearer '+ANON},body:JSON.stringify({action:'investigate',case_id:caseId,access_token:token,request})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.message||data.error||'Запрос не выполнен');return data}
function setMode(mode){const ws=document.querySelector('[data-workspace]');if(!ws)return;ws.dataset.investigationMode=mode;document.querySelectorAll('[data-mode-switch]').forEach(b=>b.classList.toggle('is-active',b.dataset.modeSwitch===mode))}
function setupVoice(root=document){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  root.querySelectorAll('[data-voice-for]').forEach(btn=>{
    if(btn.dataset.voiceReady)return;
    btn.dataset.voiceReady='1';
    if(!SR){btn.hidden=true;return}
    let rec=null,active=false,finalText='';
    const reset=()=>{active=false;rec=null;btn.textContent='🎙 Говорить';btn.classList.remove('is-listening')};
    btn.addEventListener('click',()=>{
      const target=document.querySelector('[data-voice-target="'+btn.dataset.voiceFor+'"]');
      if(!target)return;
      if(active&&rec){active=false;try{rec.stop()}catch{}return}
      rec=new SR();active=true;finalText=target.value.trim();
      rec.lang='ru-RU';rec.interimResults=true;rec.continuous=true;
      btn.textContent='■ Стоп';btn.classList.add('is-listening');
      rec.onresult=e=>{
        let interim='';
        for(let i=e.resultIndex;i<e.results.length;i++){
          const part=e.results[i][0].transcript.trim();
          if(e.results[i].isFinal)finalText+=(finalText?' ':'')+part;
          else interim+=(interim?' ':'')+part;
        }
        target.value=(finalText+(interim?' '+interim:'')).trim();
        target.dispatchEvent(new Event('input',{bubbles:true}));
      };
      rec.onerror=e=>{if(e.error!=='no-speech')reset()};
      rec.onend=()=>{
        if(active){try{rec.start();return}catch{}}
        reset();target.focus();
      };
      try{rec.start()}catch{reset()}
    });
  });
}
function previewWorkspace(){if(!PREVIEW)return;const access=document.querySelector('[data-view="access"]'),intro=document.querySelector('[data-view="intro"]'),workspace=document.querySelector('[data-view="workspace"]');if(access)access.hidden=true;if(intro)intro.hidden=true;if(workspace)workspace.hidden=false;document.body.classList.add('ai02-preview-workspace')}
function init(){
 const style=document.createElement('style');style.textContent='.aid-suspect-tab{display:grid!important;grid-template-columns:44px 1fr;column-gap:10px;align-items:center;text-align:left}.aid02-portrait-thumb{width:44px;height:52px;border-radius:6px;background-size:500% 100%;background-repeat:no-repeat;grid-row:1 / span 2}.aid-room-head{display:grid!important;grid-template-columns:92px 1fr auto;gap:16px;align-items:center}.aid02-portrait{width:92px;height:112px;border-radius:8px;background-size:500% 100%;background-repeat:no-repeat;background-color:#101820}.aid-room-status{grid-column:3}@media(max-width:800px){.aid-room-head{grid-template-columns:70px 1fr}.aid02-portrait{width:70px;height:86px}.aid-room-status{grid-column:2}.aid-suspect-tab{grid-template-columns:38px 1fr}.aid02-portrait-thumb{width:38px;height:46px}}';document.head.appendChild(style);
const ws=document.querySelector('[data-workspace]'),form=document.querySelector('[data-investigation-form]'),ta=form?.querySelector('textarea'),result=document.querySelector('[data-investigation-result]');if(!ws||!form||form.dataset.ready)return;form.dataset.ready='1';document.querySelectorAll('[data-mode-switch]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.modeSwitch)));document.querySelector('[data-open-theory]')?.addEventListener('click',()=>document.querySelector('[data-theory-open]')?.click());document.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>{ta.value=b.dataset.q;ta.focus()}));form.addEventListener('submit',async e=>{e.preventDefault();const q=ta.value.trim();if(q.length<2)return;const submit=form.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Проверяем…';result.hidden=false;result.innerHTML='<span>Экспертная группа проверяет материалы…</span>';try{const data=await investigate(q),added=data.result?.new_evidence||[];result.innerHTML='<strong>Результат проверки</strong><p>'+esc(data.result?.message||'Результат получен.')+'</p>'+(added.length?'<small>Новые материалы добавлены: '+added.map(x=>esc(x.title)).join(', ')+'</small>':'<small>Новых материалов не добавлено.</small>')}catch(err){result.innerHTML='<strong>Запрос не выполнен</strong><p>'+esc(err.message)+'</p>'}finally{submit.disabled=false;submit.textContent='Отправить запрос'}});setupVoice();previewWorkspace();setMode('investigation');const mo=new MutationObserver(decoratePortraits);const ss=document.querySelector('[data-suspect-strip]');if(ss)mo.observe(ss,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});document.addEventListener('click',e=>{if(e.target.closest('[data-suspect]'))setTimeout(decoratePortraits,0)});decoratePortraits()}
document.addEventListener('DOMContentLoaded',init);init();
})();