(()=>{
  'use strict';
  const inject=()=>{
    document.querySelectorAll('.puzzle-admin-card').forEach(card=>{
      if(card.querySelector('.puzzle-admin-match-preview'))return;
      const details=[...card.querySelectorAll('.puzzle-admin-details details')].find(node=>node.querySelector('summary')?.textContent?.trim()==='Исходное равенство');
      const equation=details?.querySelector('p')?.textContent?.trim();
      if(!equation)return;
      const box=document.createElement('div');
      box.className='puzzle-admin-match-preview';
      box.innerHTML='<div class="puzzle-admin-match-preview-label">Визуализация для проверки</div><div class="logic-match-equation" data-match-equation=""></div>';
      const target=box.querySelector('[data-match-equation]');
      target.dataset.matchEquation=equation;
      details.parentElement?.insertBefore(box,details);
      window.MysteryLogicMatchsticks?.render?.(target,equation);
    });
  };
  const start=()=>{
    inject();
    const root=document.querySelector('[data-puzzle-list]')||document.body;
    new MutationObserver(()=>inject()).observe(root,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();