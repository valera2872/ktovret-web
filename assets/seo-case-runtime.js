(()=>{
  'use strict';

  const cfg=window.KtoVretSeo||{};
  const root=document.querySelector('[data-ktv-root]');
  if(!root) return;

  if(location.search){
    let robots=document.querySelector('meta[name="robots"]');
    if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.appendChild(robots);}
    robots.content='noindex,follow';
  }

  const link=(item,label,kind='related')=>{
    if(!item?.url) return '';
    return `<a href="${item.url}" data-kind="${kind}" data-analytics-next="${kind}">${label||item.title||'Открыть'}</a>`;
  };

  const renderCompletionLinks=()=>{
    const result=root.querySelector('#ktv-result');
    if(!result||result.querySelector('[data-seo-completion-links]')) return;
    const actions=result.querySelector('.ktv-result-actions')||result;
    const wrapper=document.createElement('div');
    wrapper.className='seo-completion-links';
    wrapper.dataset.seoCompletionLinks='true';
    const related=Array.isArray(cfg.related)?cfg.related.slice(0,4):[];
    wrapper.innerHTML=`
      ${cfg.next?link(cfg.next,`Следующее дело: ${cfg.next.title}`,'next'):''}
      ${related.length?`<div class="seo-completion-links__related">${related.map((item)=>link(item,item.title,'related')).join('')}</div>`:''}
      ${cfg.collection?link(cfg.collection,`Подборка: ${cfg.collection.title}`,'collection'):''}
      ${cfg.library?link(cfg.library,'Вся библиотека','library'):''}
    `;
    actions.insertAdjacentElement('afterend',wrapper);
  };

  const observer=new MutationObserver(renderCompletionLinks);
  observer.observe(root,{childList:true,subtree:true});
  renderCompletionLinks();
})();
