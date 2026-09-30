(()=>{'use strict';
const API='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-interrogation-v2',ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ya252dXdrbnZzZWRqZ3FjZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTY2MzcsImV4cCI6MjEwMTc3MjYzN30.68loNx8A71dodfOXXKs_-I235XVCmEioXGrg8kCZQr4',ACCESS_KEY='mysterylogic:ai-investigation:access-token';
const caseId=new URLSearchParams(location.search).get('case')||'AI02-NK-STANDARD';
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
function init(){const ws=document.querySelector('[data-workspace]'),form=document.querySelector('[data-investigation-form]'),ta=form?.querySelector('textarea'),result=document.querySelector('[data-investigation-result]');if(!ws||!form||form.dataset.ready)return;form.dataset.ready='1';document.querySelectorAll('[data-mode-switch]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.modeSwitch)));document.querySelector('[data-open-theory]')?.addEventListener('click',()=>document.querySelector('[data-theory-open]')?.click());document.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>{ta.value=b.dataset.q;ta.focus()}));form.addEventListener('submit',async e=>{e.preventDefault();const q=ta.value.trim();if(q.length<2)return;const submit=form.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Проверяем…';result.hidden=false;result.innerHTML='<span>Экспертная группа проверяет материалы…</span>';try{const data=await investigate(q),added=data.result?.new_evidence||[];result.innerHTML='<strong>Результат проверки</strong><p>'+esc(data.result?.message||'Результат получен.')+'</p>'+(added.length?'<small>Новые материалы добавлены: '+added.map(x=>esc(x.title)).join(', ')+'</small>':'<small>Новых материалов не добавлено.</small>')}catch(err){result.innerHTML='<strong>Запрос не выполнен</strong><p>'+esc(err.message)+'</p>'}finally{submit.disabled=false;submit.textContent='Отправить запрос'}});setupVoice();setMode('investigation')}
document.addEventListener('DOMContentLoaded',init);init();
})();