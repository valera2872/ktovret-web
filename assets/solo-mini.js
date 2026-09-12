(()=>{
  'use strict';
  const cases=Array.isArray(window.MysteryLogicSoloMiniCases)?window.MysteryLogicSoloMiniCases:[];
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const storeKey=(id)=>`mysterylogic:solo-mini:${id}:v1`;
  const completionKey='mysterylogic:solo-mini:completed:v1';
  const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}};
  const writeJson=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  const initials=(name)=>String(name||'').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
  function completedSet(){return new Set(readJson(completionKey,[]));}
  function markCompleted(id){const s=completedSet();s.add(id);writeJson(completionKey,[...s]);}
  function updateHub(){
    const hub=document.querySelector('[data-solo-mini-hub]');
    if(!hub)return;
    const done=completedSet();
    hub.querySelectorAll('[data-mini-card]').forEach(card=>{
      const id=card.getAttribute('data-mini-card');
      if(done.has(id)){
        card.classList.add('is-complete');
        const badge=card.querySelector('[data-mini-status]');
        if(badge)badge.textContent='Раскрыто';
      }
    });
    const counter=hub.querySelector('[data-mini-completed-count]');
    if(counter)counter.textContent=String([...done].filter(id=>cases.some(c=>c.id===id)).length);
  }
  const app=document.querySelector('[data-solo-mini-app]');
  if(!app){updateHub();return;}
  const caseId=app.getAttribute('data-case-id');
  const item=cases.find(c=>c.id===caseId);
  if(!item){app.innerHTML='<section class="sm-error"><h1>Дело не найдено</h1><p>Вернитесь в архив мини-расследований.</p></section>';return;}
  const stage=app.querySelector('[data-mini-stage]');
  const progress=app.querySelector('[data-mini-progress]');
  const progressLabel=app.querySelector('[data-mini-progress-label]');
  const notesDialog=document.querySelector('[data-mini-notes]');
  const notesContent=document.querySelector('[data-mini-notes-content]');
  const notesButton=document.querySelector('[data-mini-notes-open]');
  const notesClose=document.querySelector('[data-mini-notes-close]');
  const resetButton=document.querySelector('[data-mini-reset]');
  const defaultState={stage:0,evidenceSeen:[],witnessSeen:[],checkpointPassed:false,verdictAttempts:0,completed:false};
  let state={...defaultState,...readJson(storeKey(item.id),{})};
  state.evidenceSeen=Array.isArray(state.evidenceSeen)?state.evidenceSeen:[];
  state.witnessSeen=Array.isArray(state.witnessSeen)?state.witnessSeen:[];
  const save=()=>writeJson(storeKey(item.id),state);
  const setStage=(n)=>{state.stage=n;save();render();window.scrollTo({top:0,behavior:'smooth'});};
  const stageProgress=[5,16,34,49,66,80,92,100];
  const stageNames=['Вводная','Сцена','Улики','Вывод','Показания','Контроль','Вердикт','Раскрыто'];
  function updateProgress(){
    const pct=stageProgress[Math.max(0,Math.min(state.stage,7))]||5;
    if(progress)progress.style.width=`${pct}%`;
    if(progressLabel)progressLabel.textContent=`${stageNames[state.stage]||'Расследование'} · ${pct}%`;
  }
  function shell(kicker,title,body,actions=''){
    return `<article class="sm-panel sm-enter"><div class="sm-panel__top"><span>${esc(kicker)}</span><i>${esc(item.code)}</i></div><div class="sm-panel__body"><h2>${esc(title)}</h2>${body}${actions?`<div class="sm-actions">${actions}</div>`:''}</div></article>`;
  }
  function button(label,action,secondary=false,disabled=false){return `<button class="${secondary?'sm-button sm-button--ghost':'sm-button'}" data-action="${esc(action)}" ${disabled?'disabled':''}>${esc(label)}</button>`;}
  function renderIntro(){
    const body=`<p class="sm-lead">${esc(item.intro)}</p><div class="sm-case-meta"><span>${esc(item.duration)}</span><span>${esc(item.difficulty)}</span><span>${esc(item.category)}</span><span>бесплатно</span></div><div class="sm-brief"><strong>Ваша задача</strong><p>Не угадывать. Открывайте материалы по порядку, фиксируйте то, что действительно доказано, и только потом выбирайте версию.</p></div>`;
    stage.innerHTML=shell('Мини-расследование',item.title,body,button('Открыть дело','next'));
  }
  function renderScene(){
    const timeline=item.timeline.map(([time,text],i)=>`<li><span>${esc(time)}</span><div><small>0${i+1}</small><p>${esc(text)}</p></div></li>`).join('');
    const body=`<p class="sm-lead">${esc(item.scene)}</p><div class="sm-timeline"><ol>${timeline}</ol></div>`;
    stage.innerHTML=shell('Место и время','Что произошло',body,button('Перейти к материалам','next'));
  }
  function evidenceCard(ev,index){
    const id=`e${index}`;const open=state.evidenceSeen.includes(id);
    return `<button class="sm-evidence ${open?'is-open':''}" data-evidence="${id}"><span class="sm-evidence__index">0${index+1}</span><span class="sm-evidence__copy"><small>${esc(ev.label)}</small><strong>${esc(ev.title)}</strong><em>${open?esc(ev.body):'Открыть материал'}</em></span><span class="sm-evidence__mark">${open?'✓':'+'}</span></button>`;
  }
  function renderEvidence(){
    const evs=item.evidence.slice(0,2);const seen=evs.every((_,i)=>state.evidenceSeen.includes(`e${i}`));
    const body=`<p class="sm-lead">Начните с двух независимых материалов. Каждый добавляет ограничение, но ни один ещё не даёт готового ответа.</p><div class="sm-evidence-grid">${evs.map(evidenceCard).join('')}</div><p class="sm-hint">${seen?'Оба материала изучены. Теперь можно зафиксировать первый вывод.':'Откройте оба материала, чтобы продолжить.'}</p>`;
    stage.innerHTML=shell('Пакет 01','Первые улики',body,button('Зафиксировать вывод','next',false,!seen));
  }
  function renderCheckpoint(){
    const q=item.checkpoint;
    const body=`<p class="sm-lead">${esc(q.prompt)}</p><div class="sm-choice-list">${q.choices.map(([id,label])=>`<button class="sm-choice" data-checkpoint="${esc(id)}"><span></span>${esc(label)}</button>`).join('')}</div><div class="sm-feedback" data-feedback hidden></div>`;
    stage.innerHTML=shell('Контрольная точка','Что уже можно доказать?',body);
  }
  function renderWitnesses(){
    const allSeen=item.suspects.every(s=>state.witnessSeen.includes(s.id));
    const cards=item.suspects.map((s)=>{const open=state.witnessSeen.includes(s.id);return `<button class="sm-witness ${open?'is-open':''}" data-witness="${esc(s.id)}"><span class="sm-avatar">${esc(initials(s.name))}</span><span class="sm-witness__copy"><small>${esc(s.role)}</small><strong>${esc(s.name)}</strong><em>${open?`«${esc(s.statement)}»`:'Открыть показание'}</em></span><span class="sm-witness__mark">${open?'✓':'→'}</span></button>`}).join('');
    const body=`<p class="sm-lead">Теперь сопоставьте установленный факт с показаниями. Читайте не «кто выглядит подозрительно», а что именно человек утверждает.</p><div class="sm-witness-grid">${cards}</div><p class="sm-hint">${allSeen?'Все показания получены. Осталась контрольная улика.':'Откройте все три показания.'}</p>`;
    stage.innerHTML=shell('Пакет 02','Показания',body,button('Запросить контрольную улику','next',false,!allSeen));
  }
  function renderFinalEvidence(){
    const ev=item.evidence[2],open=state.evidenceSeen.includes('e2');
    const body=`<p class="sm-lead">Последний материал нужен не для новой версии, а чтобы проверить границы уже построенной.</p><div class="sm-evidence-grid sm-evidence-grid--single">${evidenceCard(ev,2)}</div><p class="sm-hint">${open?'Материал изучен. Теперь у вас есть всё необходимое для вердикта.':'Откройте контрольный материал.'}</p>`;
    stage.innerHTML=shell('Пакет 03','Контрольная улика',body,button('Перейти к вердикту','next',false,!open));
  }
  function renderVerdict(){
    const suspects=item.suspects.map(s=>`<button class="sm-suspect-choice" data-verdict="${esc(s.id)}"><span class="sm-avatar">${esc(initials(s.name))}</span><span><small>${esc(s.role)}</small><strong>${esc(s.name)}</strong></span><i>Выбрать</i></button>`).join('');
    const body=`<p class="sm-lead">Кто из троих утверждает то, что несовместимо с установленными материалами?</p><div class="sm-suspect-list">${suspects}</div><div class="sm-feedback" data-feedback ${state.verdictAttempts?'':'hidden'}>${state.verdictAttempts?'Эта версия пока не объясняет ключевое противоречие. Проверьте формулировки показаний ещё раз.':''}</div>`;
    stage.innerHTML=shell('Финальная версия','Кто лжёт?',body);
  }
  function renderCompleted(){
    const nextIndex=cases.findIndex(c=>c.id===item.id)+1;
    const next=cases[nextIndex]||null;
    const steps=item.reconstruction.map((x,i)=>`<li><span>0${i+1}</span><p>${esc(x)}</p></li>`).join('');
    const actions=`<a class="sm-button" href="${next?`../${esc(next.slug)}/`:'../'}">${next?'Следующее дело':'Вернуться к мини-расследованиям'}</a><a class="sm-button sm-button--ghost" href="../../../dela/">10 коротких дел «Кто врёт?»</a>`;
    const body=`<div class="sm-solved"><span>Дело раскрыто</span><strong>${esc(item.verdict)}</strong></div><h3>Реконструкция</h3><ol class="sm-reconstruction">${steps}</ol><div class="sm-next-level"><small>Дальше по глубине</small><strong>«Номер 407» — полноценное solo-расследование на 50–70 минут</strong><a href="../../407/">Открыть большое дело →</a></div>`;
    stage.innerHTML=shell('Результат',item.title,body,actions);
  }
  function render(){
    updateProgress();
    if(state.stage<=0)renderIntro();
    else if(state.stage===1)renderScene();
    else if(state.stage===2)renderEvidence();
    else if(state.stage===3)renderCheckpoint();
    else if(state.stage===4)renderWitnesses();
    else if(state.stage===5)renderFinalEvidence();
    else if(state.stage===6)renderVerdict();
    else renderCompleted();
  }
  function renderNotes(){
    if(!notesDialog||!notesContent)return;
    const seenEvidence=item.evidence.filter((_,i)=>state.evidenceSeen.includes(`e${i}`));
    const seenWitnesses=item.suspects.filter(s=>state.witnessSeen.includes(s.id));
    notesContent.innerHTML=`<section><small>Хронология</small><ul>${item.timeline.map(([t,x])=>`<li><strong>${esc(t)}</strong> — ${esc(x)}</li>`).join('')}</ul></section><section><small>Открытые материалы</small>${seenEvidence.length?`<ul>${seenEvidence.map(e=>`<li><strong>${esc(e.title)}</strong> — ${esc(e.body)}</li>`).join('')}</ul>`:'<p>Пока нет.</p>'}</section><section><small>Полученные показания</small>${seenWitnesses.length?seenWitnesses.map(s=>`<blockquote><strong>${esc(s.name)}</strong><p>«${esc(s.statement)}»</p></blockquote>`).join(''):'<p>Пока нет.</p>'}</section>`;
    notesDialog.showModal();
  }
  stage.addEventListener('click',(event)=>{
    const action=event.target.closest('[data-action]');
    if(action&&!action.disabled){if(action.dataset.action==='next')setStage(Math.min(7,state.stage+1));return;}
    const evidence=event.target.closest('[data-evidence]');
    if(evidence){const id=evidence.dataset.evidence;if(!state.evidenceSeen.includes(id))state.evidenceSeen.push(id);save();render();return;}
    const witness=event.target.closest('[data-witness]');
    if(witness){const id=witness.dataset.witness;if(!state.witnessSeen.includes(id))state.witnessSeen.push(id);save();render();return;}
    const cp=event.target.closest('[data-checkpoint]');
    if(cp){
      const feedback=stage.querySelector('[data-feedback]');
      if(cp.dataset.checkpoint===item.checkpoint.correct){state.checkpointPassed=true;save();if(feedback){feedback.hidden=false;feedback.className='sm-feedback is-good';feedback.textContent=item.checkpoint.success;}setTimeout(()=>setStage(4),650)}
      else if(feedback){feedback.hidden=false;feedback.className='sm-feedback is-bad';feedback.textContent='Эта формулировка выходит за пределы того, что уже доказано. Проверьте материалы ещё раз.'}
      return;
    }
    const verdict=event.target.closest('[data-verdict]');
    if(verdict){
      if(verdict.dataset.verdict===item.culprit){state.completed=true;state.stage=7;save();markCompleted(item.id);render();}
      else{state.verdictAttempts=(state.verdictAttempts||0)+1;save();render();}
    }
  });
  if(notesButton)notesButton.addEventListener('click',renderNotes);
  if(notesClose)notesClose.addEventListener('click',()=>notesDialog.close());
  if(notesDialog)notesDialog.addEventListener('click',(e)=>{if(e.target===notesDialog)notesDialog.close()});
  if(resetButton)resetButton.addEventListener('click',()=>{if(confirm('Начать это расследование заново?')){state={...defaultState};save();render();}});
  render();
})();
