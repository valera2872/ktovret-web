(()=>{
  'use strict';

  const app=document.querySelector('[data-realcase-app]');
  if(!app) return;

  const STORAGE_KEY='ml-realcase-71-05-v13-guards';
  const LABELS={
    M01:'M01 · первое показание A',
    M02:'M02 · первое показание B',
    M03:'M03 · совместное показание C/D',
    M05:'M05 · второе показание B',
    M06:'M06 · второе показание A',
    M08:'M08 · версия обвинения',
    M10:'M10 · повторное расследование',
    M11:'M11 · вывод Royal Commission'
  };
  const REQUIREMENTS={
    S07:{min:2,materials:['M01','M02','M03'],title:'Материалы в обоснование'},
    S16:{min:3,materials:['M01','M02','M03','M05','M06','M08'],title:'Источники для аудита'},
    S21:{min:3,materials:['M01','M02','M03','M05','M06','M08','M10','M11'],title:'Источники выводов'}
  };

  const load=()=>{
    try{
      const value=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return value&&typeof value==='object'?value:{};
    }catch{return {};}
  };
  let state=load();
  const save=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  const currentId=()=>app.querySelector('.rc-screen[data-screen]')?.dataset.screen||'';
  const selected=(screenId)=>Array.isArray(state[screenId])?state[screenId]:[];

  const feedback=(message,type='is-warn')=>{
    const screen=app.querySelector('.rc-screen[data-screen]');
    const actions=screen?.querySelector('.rc-actions');
    if(!screen||!actions) return;
    let box=screen.querySelector('[data-v13-guard-feedback]');
    if(!box){
      box=document.createElement('div');
      box.dataset.v13GuardFeedback='true';
      actions.before(box);
    }
    box.className=`rc-feedback ${type}`;
    box.textContent=message;
  };

  const clearFeedback=()=>app.querySelector('[data-v13-guard-feedback]')?.remove();

  const renderCitationRequirement=(screenId)=>{
    const config=REQUIREMENTS[screenId];
    const screen=app.querySelector(`.rc-screen[data-screen="${screenId}"]`);
    const actions=screen?.querySelector('.rc-actions');
    if(!config||!screen||!actions||screen.querySelector(`[data-v13-citations="${screenId}"]`)) return;

    const block=document.createElement('section');
    block.className='rc-citations';
    block.dataset.v13Citations=screenId;
    const current=new Set(selected(screenId));
    block.innerHTML=`<h3>${config.title} · минимум ${config.min}</h3><div class="rc-citation-grid">${config.materials.map(id=>`<label class="rc-citation"><input type="checkbox" value="${id}" data-v13-cite="${screenId}"${current.has(id)?' checked':''}><span>${LABELS[id]}</span></label>`).join('')}</div>`;
    actions.before(block);

    block.querySelectorAll('[data-v13-cite]').forEach(input=>input.addEventListener('change',()=>{
      const values=new Set(selected(screenId));
      input.checked?values.add(input.value):values.delete(input.value);
      state[screenId]=[...values];
      save();
      clearFeedback();
    }));
  };

  const validateGuard=(screenId)=>{
    if(REQUIREMENTS[screenId]){
      const config=REQUIREMENTS[screenId];
      const cites=selected(screenId).filter(id=>config.materials.includes(id));
      if(cites.length<config.min){
        feedback(`Подкрепите вывод источниками: выберите минимум ${config.min} материала из уже открытого файла.`);
        return false;
      }
    }

    if(screenId==='S17'){
      const citations=[...app.querySelectorAll('[data-citation="S17"]:checked')].map(input=>input.value);
      const hasEarly=citations.some(id=>['M01','M02','M03'].includes(id));
      const hasCrown=citations.includes('M08');
      if(citations.length>=3&&(!hasEarly||!hasCrown)){
        feedback('Для решения по версии обвинения v13 требует минимум один ранний материал и M08 — саму папку обвинения. Остальные ссылки выберите по своей аргументации.');
        return false;
      }
    }
    return true;
  };

  app.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-action="primary"]');
    if(!button||!app.contains(button)) return;
    const screenId=currentId();
    if(validateGuard(screenId)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  },true);

  let scheduled=false;
  const decorate=()=>{
    scheduled=false;
    const screenId=currentId();
    if(REQUIREMENTS[screenId]) renderCitationRequirement(screenId);
  };
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(decorate);
  };
  new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  schedule();

  window.MLRealCase7105V13Guards={version:'0.1.0',requirements:Object.fromEntries(Object.entries(REQUIREMENTS).map(([id,value])=>[id,{min:value.min,materials:[...value.materials]}]))};
})();
