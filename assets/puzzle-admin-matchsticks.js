(()=>{
  'use strict';
  const inject=()=>{
    document.querySelectorAll('.puzzle-admin-card').forEach(card=>{
      const details=[...card.querySelectorAll('.puzzle-admin-details details')].find(node=>node.querySelector('summary')?.textContent?.trim()==='Исходное равенство');
      const equation=details?.querySelector('p')?.textContent?.trim();
      if(!equation)return;
      if(!card.querySelector('.puzzle-admin-match-preview')){
        const box=document.createElement('div');
        box.className='puzzle-admin-match-preview';
        box.innerHTML='<div class="puzzle-admin-match-preview-label">Визуализация для проверки</div><div class="logic-match-equation" data-match-equation=""></div>';
        const target=box.querySelector('[data-match-equation]');
        target.dataset.matchEquation=equation;
        details.parentElement?.insertBefore(box,details);
        window.MysteryLogicMatchsticks?.render?.(target,equation);
      }
      const publish=card.querySelector('.puzzle-admin-publish-copy');
      if(publish?.classList.contains('is-approved')&&publish.textContent.includes('Готова к публикации')){
        let list=publish.nextElementSibling;
        if(!list||!list.classList.contains('puzzle-admin-targets')){
          list=document.createElement('ul');
          list.className='puzzle-admin-targets';
          publish.insertAdjacentElement('afterend',list);
        }
        if(!list.textContent.includes('Со спичками'))list.insertAdjacentHTML('beforeend','<li><strong>Со спичками</strong><span>/golovolomki-so-spichkami/</span></li>');
      }
    });
    const foot=document.querySelector('.puzzle-publish-foot');
    if(foot&&/Со спичками:/.test(foot.textContent)){
      foot.textContent=foot.textContent.replace(/Со спичками:\s*(\d+)\.\s*Этот формат сейчас исключён из публичного дерева\./,'Со спичками: $1. SEO-хаб откроется автоматически, когда будет утверждено не меньше 8 визуальных задач.');
    }
  };
  const start=()=>{
    inject();
    const root=document.querySelector('[data-puzzle-list]')||document.body;
    new MutationObserver(()=>inject()).observe(root,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();