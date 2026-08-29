(() => {
  'use strict';

  const KEY='mysterylogic:logic:solved:v2';
  const METRIKA_ID=111664459;
  const goals={attempt:'ml_logic_answer_attempt',complete:'ml_logic_complete',hint:'ml_logic_hint_open',solution:'ml_logic_solution_open'};
  const normalize=v=>String(v||'').toUpperCase().replace(/Ё/g,'Е').replace(/[^0-9A-ZА-Я]/g,'');
  const solved=()=>{try{return new Set(JSON.parse(localStorage.getItem(KEY)||'[]'));}catch{return new Set();}};
  const save=set=>{try{localStorage.setItem(KEY,JSON.stringify([...set]));}catch{}};
  const track=(kind,payload={})=>{
    const eventName=kind==='attempt'?'logic_answer_attempt':kind==='complete'?'logic_complete':kind==='hint'?'logic_hint_open':'logic_solution_open';
    try{window.MysteryLogicFunnel?.track?.(eventName,payload,payload.puzzle_id||'');}catch{}
    try{if(typeof window.ym==='function'&&goals[kind])window.ym(METRIKA_ID,'reachGoal',goals[kind],payload);}catch{}
  };

  function updateProgress(){
    const set=solved();
    document.querySelectorAll('[data-expert-progress]').forEach(el=>{
      const total=Number(el.dataset.expertTotal||20);
      const count=[...set].filter(x=>x.startsWith('expert:')).length;
      el.textContent=`${Math.min(count,total)} из ${total} решено`;
    });
    document.querySelectorAll('[data-expert-card]').forEach(card=>{
      if(set.has(card.dataset.expertCard)){
        card.dataset.solved='true';
        const badge=card.querySelector('[data-expert-badge]');
        if(badge)badge.textContent='✓ Решено';
      }
    });
  }

  document.querySelectorAll('[data-expert-puzzle]').forEach(root=>{
    const id=root.dataset.expertPuzzle;
    const mode=root.dataset.expertMode||'input';
    const accepted=(root.dataset.expertAnswers||'').split('|').map(normalize).filter(Boolean);
    const input=root.querySelector('[data-expert-input]');
    const submit=root.querySelector('[data-expert-submit]');
    const feedback=root.querySelector('[data-expert-feedback]');
    const solution=root.querySelector('[data-expert-solution]');
    const hintCopy=root.querySelector('[data-expert-hint-copy]');
    const set=solved();
    let completionEmitted=false;

    const emitCompletion=()=>{
      if(completionEmitted)return;
      completionEmitted=true;
      try{window.dispatchEvent(new CustomEvent('ml:logic_complete',{detail:{puzzleId:id,mode}}));}catch{}
    };

    const showSolution=(mark=false)=>{
      if(solution)solution.hidden=false;
      if(mark){
        set.add(id);save(set);track('complete',{puzzle_id:id,method:mode==='reveal'?'self_report':'verified'});updateProgress();emitCompletion();
      }
    };

    root.querySelector('[data-expert-hint]')?.addEventListener('click',()=>{
      if(hintCopy)hintCopy.hidden=!hintCopy.hidden;
      track('hint',{puzzle_id:id});
    });

    root.querySelector('[data-expert-solution-toggle]')?.addEventListener('click',()=>{
      if(solution)solution.hidden=!solution.hidden;
      track('solution',{puzzle_id:id});
    });

    root.querySelector('[data-expert-self-report]')?.addEventListener('click',()=>{
      showSolution(true);
      track('solution',{puzzle_id:id,self_report:true});
    });

    if(mode==='input'&&input&&submit&&accepted.length){
      const check=()=>{
        const value=normalize(input.value);
        if(!value){feedback.textContent='Введите ответ.';feedback.className='logic-feedback is-bad';return;}
        const ok=accepted.includes(value);
        feedback.textContent=ok?'Верно. Решение совпадает с единственным допустимым вариантом.':'Пока не сходится. Проверьте все ограничения ещё раз.';
        feedback.className=`logic-feedback ${ok?'is-ok':'is-bad'}`;
        track('attempt',{puzzle_id:id,correct:ok});
        if(ok)showSolution(true);
      };
      submit.addEventListener('click',check);
      input.addEventListener('keydown',e=>{if(e.key==='Enter')check();});
    }
  });

  updateProgress();
})();
