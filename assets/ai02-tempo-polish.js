(()=>{'use strict';
function currentStage(){
  const cards=[...document.querySelectorAll('[data-evidence-list] [data-evidence]')];
  const ids=new Set(cards.map(x=>x.dataset.evidence).filter(Boolean));
  const noteCount=document.querySelectorAll('[data-notes] .aid-note').length;
  const turnCount=parseInt(document.querySelector('[data-turn-counter]')?.textContent||'0',10)||0;
  const theory=document.querySelector('[data-view="theory"]');
  let stage=1;
  if(cards.length>5||ids.has('E03')||ids.has('E26')||ids.has('E27'))stage=2;
  if(noteCount>0||turnCount>0)stage=3;
  if(ids.has('E08')||ids.has('E23')||ids.has('E29'))stage=4;
  if(theory&&!theory.hidden)stage=5;
  return stage;
}
function render(){
  const stage=currentStage();
  const v=document.querySelector('[data-ai02-progress]');
  if(v)v.textContent=String(stage);
  document.querySelectorAll('.ai02-case-steps li').forEach((li,index)=>{
    const n=index+1;
    li.classList.toggle('is-active',n===stage);
    li.classList.toggle('is-done',n<stage);
  });
}
function boot(){
  render();
  const root=document.querySelector('[data-ai-v2-player]')||document.body;
  const mo=new MutationObserver(()=>{clearTimeout(boot.t);boot.t=setTimeout(render,40)});
  mo.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();