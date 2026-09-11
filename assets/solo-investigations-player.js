(()=>{
  'use strict';
  const cfg=window.MysteryLogicSoloPaidAccessConfig||{};
  const root=document.querySelector('[data-solo-deep-app]');
  if(!root)return;
  const caseId=root.dataset.caseId||'';
  const volumeUrl=root.dataset.volumeUrl||'../';
  const esc=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const stateKey=`mysterylogic:solo-investigation:${caseId}:v1`;
  const completionKey='mysterylogic:solo-investigations-v1:completed';
  const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}};
  const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
  const token=localStorage.getItem(cfg.tokenStorageKey)||'';
  let item=null;
  let state=read(stateKey,{openedFacts:[],openedWitnesses:[],stage:0,selections:{},solved:false});

  const button=(label,attrs='')=>`<button class="sp-btn" type="button" ${attrs}>${label}</button>`;
  const panel=(body)=>`<section class="sp-investigation-panel">${body}</section>`;

  function locked(message='Это расследование входит в платный Том I.'){
    root.innerHTML=panel(`<p class="sp-kicker">Доступ к материалам закрыт</p><h2>Том I</h2><p>${esc(message)}</p><div class="sp-lock-offer"><strong>${cfg.priceRub||99} ₽</strong><span>10 расследований · разовая покупка</span></div><a class="sp-btn sp-btn--link" href="${esc(volumeUrl)}">Открыть Том I →</a>`);
  }

  async function load(){
    if(!token){locked('Чтобы получить материалы дела, сначала откройте Том I.');return;}
    root.innerHTML=panel('<p class="sp-muted">Проверяем доступ и загружаем материалы дела…</p>');
    try{
      const url=new URL(cfg.endpoint);url.searchParams.set('case_id',caseId);
      const response=await fetch(url,{headers:{authorization:`Bearer ${token}`},cache:'no-store',credentials:'omit'});
      if(response.status===403){locked();return;}
      if(!response.ok)throw new Error(`http_${response.status}`);
      const body=await response.json();item=body.config;
      if(!item?.id||!Array.isArray(item.answerStages))throw new Error('invalid_case_payload');
      render();
    }catch{root.innerHTML=panel('<p class="sp-kicker">Ошибка загрузки</p><h2>Материалы временно недоступны</h2><p>Обновите страницу через несколько секунд. Если покупка уже оплачена, доступ не потерян.</p>');}
  }

  function save(){write(stateKey,state);}
  function progress(){const total=4+(item?.answerStages?.length||0);let done=0;if(state.openedFacts.length)done++;if(state.openedWitnesses.length)done++;if(state.stage>0)done+=Math.min(state.stage,item.answerStages.length);if(state.solved)done+=2;return Math.round(done/Math.max(total,1)*100);}

  function intro(){
    return panel(`<div class="sp-panel-head"><span>Досье</span><span>${progress()}%</span></div><p class="sp-kicker">Вводная</p><h2>${esc(item.title)}</h2><p class="sp-lead">${esc(item.intro)}</p><div class="sp-case-meta"><span>${esc(item.difficulty||'Сложное')}</span><span>${esc(item.category||'Расследование')}</span><span>${esc(item.logicType||'Дедукция')}</span></div><h3>Факты</h3><div class="sp-evidence-grid">${(item.facts||[]).map((fact,i)=>`<button class="sp-evidence ${state.openedFacts.includes(i)?'is-open':''}" data-fact="${i}"><small>Улика ${String(i+1).padStart(2,'0')}</small><strong>${esc(fact.label)}</strong><p>${state.openedFacts.includes(i)?esc(fact.value):'Открыть материал'}</p></button>`).join('')}</div><h3>Хронология</h3><ol class="sp-timeline">${(item.timeline||[]).map(ev=>`<li><time>${esc(ev.time)}</time><div><strong>${esc(ev.title)}</strong><p>${esc(ev.detail)}</p><small>${esc(ev.source||'')}</small></div></li>`).join('')}</ol><div class="sp-actions">${button('Перейти к показаниям','data-go-witnesses')}</div>`);
  }

  function witnesses(){
    const people=(item.characters||[]).filter(c=>c?.id&&!String(c.id).startsWith('__'));
    return panel(`<div class="sp-panel-head"><span>Показания</span><span>${progress()}%</span></div><p class="sp-kicker">Свидетели и версии</p><h2>Что утверждает каждый</h2><p class="sp-muted">Откройте показания и сопоставьте их с уже известными материалами.</p><div class="sp-witness-grid">${people.map((person,i)=>`<button class="sp-witness ${state.openedWitnesses.includes(i)?'is-open':''}" data-witness="${i}"><span class="sp-avatar">${esc(person.name.split(/\s+/).map(x=>x[0]).join('').slice(0,2))}</span><span><small>${esc(person.role||'свидетель')}</small><strong>${esc(person.name)}</strong><p>${state.openedWitnesses.includes(i)?esc(person.statement):'Открыть показание'}</p></span></button>`).join('')}</div><div class="sp-actions">${button('К выводам','data-go-stages')}</div>`);
  }

  function stageView(){
    const stages=item.answerStages||[];
    const index=Math.min(state.stage,stages.length-1);
    const stage=stages[index];
    const selected=new Set(state.selections[stage.id]||[]);
    return panel(`<div class="sp-panel-head"><span>Вывод ${index+1} из ${stages.length}</span><span>${progress()}%</span></div><p class="sp-kicker">Проверка версии</p><h2>${esc(stage.prompt)}</h2><div class="sp-choice-list">${(stage.options||[]).map(opt=>`<button class="sp-choice ${selected.has(opt.id)?'is-selected':''}" data-choice="${esc(opt.id)}"><span></span>${esc(opt.label)}</button>`).join('')}</div><p class="sp-stage-feedback" data-stage-feedback></p><div class="sp-actions">${button('Проверить вывод','data-check-stage')}</div>`);
  }

  function solved(){
    return panel(`<div class="sp-panel-head"><span>Дело раскрыто</span><span>100%</span></div><p class="sp-kicker">Финальная реконструкция</p><h2>${esc(item.title)}</h2><div class="sp-solved"><strong>${esc(item.explanation?.shortReason||'Верная версия подтверждена материалами дела.')}</strong></div><p class="sp-lead sp-lead--small">${esc(item.explanation?.fullReason||'')}</p><h3>Цепочка рассуждения</h3><ol class="sp-reasoning">${(item.explanation?.reasoningSteps||[]).map((step,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><p>${esc(step)}</p></li>`).join('')}</ol><div class="sp-actions"><a class="sp-btn sp-btn--link" href="${esc(volumeUrl)}">Вернуться к Тому I</a><button class="sp-btn sp-btn--ghost" type="button" data-reset>Пройти заново</button></div>`);
  }

  function render(){
    if(state.solved){root.innerHTML=solved();wireSolved();return;}
    if(state.stage===-1){root.innerHTML=witnesses();wireWitnesses();return;}
    if(state.stage>0||state.stage===0&&state.openedWitnesses.length){root.innerHTML=stageView();wireStage();return;}
    root.innerHTML=intro();wireIntro();
  }

  function wireIntro(){
    root.querySelectorAll('[data-fact]').forEach(el=>el.addEventListener('click',()=>{const i=Number(el.dataset.fact);if(!state.openedFacts.includes(i))state.openedFacts.push(i);save();render();}));
    root.querySelector('[data-go-witnesses]')?.addEventListener('click',()=>{state.stage=-1;save();render();});
  }
  function wireWitnesses(){
    root.querySelectorAll('[data-witness]').forEach(el=>el.addEventListener('click',()=>{const i=Number(el.dataset.witness);if(!state.openedWitnesses.includes(i))state.openedWitnesses.push(i);save();render();}));
    root.querySelector('[data-go-stages]')?.addEventListener('click',()=>{state.stage=0;save();render();});
  }
  function wireStage(){
    const stages=item.answerStages||[],stage=stages[Math.min(state.stage,stages.length-1)];
    root.querySelectorAll('[data-choice]').forEach(el=>el.addEventListener('click',()=>{
      const id=el.dataset.choice,max=Number(stage.maxSelections||1),current=new Set(state.selections[stage.id]||[]);
      if(current.has(id))current.delete(id);else{if(max===1)current.clear();if(current.size<max)current.add(id);}
      state.selections[stage.id]=[...current];save();render();
    }));
    root.querySelector('[data-check-stage]')?.addEventListener('click',()=>{
      const selected=[...(state.selections[stage.id]||[])].sort(),correct=[...(stage.correctOptionIds||[])].sort();
      const ok=selected.length===correct.length&&selected.every((v,i)=>v===correct[i]);
      const feedback=root.querySelector('[data-stage-feedback]');
      if(!selected.length){feedback.textContent='Сначала выберите версию.';feedback.dataset.kind='error';return;}
      if(!ok){feedback.textContent='Эта версия противоречит части материалов. Проверьте факты ещё раз.';feedback.dataset.kind='error';return;}
      feedback.textContent='Верно. Этот вывод подтверждён.';feedback.dataset.kind='ok';
      window.setTimeout(()=>{if(state.stage>=stages.length-1){state.solved=true;const done=new Set(read(completionKey,[]));done.add(caseId);write(completionKey,[...done]);}else state.stage+=1;save();render();},450);
    });
  }
  function wireSolved(){root.querySelector('[data-reset]')?.addEventListener('click',()=>{if(confirm('Начать расследование заново?')){state={openedFacts:[],openedWitnesses:[],stage:0,selections:{},solved:false};save();render();}});}
  load();
})();
