(() => {
  'use strict';
  const data=window.MLCaseAria;
  if(!data?.final?.evidence) return;

  const checkout=data.final.evidence.find((item)=>item.id==='checkout');
  if(checkout) checkout.group='culprit-sabotage';
  data.final.requiredGroups=['sabotage','culprit-sabotage','alibi','identity','access','possession'];

  const polish=()=>{
    const proofLead=document.querySelector('.casearia-proof-board > p');
    if(proofLead) proofLead.textContent='Отметьте шесть ключевых связок. Недостаточно доказать сам факт саботажа — нужно отдельно связать его с обвиняемым и подтвердить остальные независимые цепочки.';
  };
  const observer=new MutationObserver(polish);
  observer.observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',polish,{once:true}); else polish();

  window.MLAriaInvestigatorV14=Object.freeze({
    revision:'1.4',
    requiredProofGroups:[...data.final.requiredGroups],
    sabotageActorLinkRequired:true,
    spoilerNeutralBrief:true,
    playbackOperatorLinked:true,
    individualizedFootwear:true,
    emergencyLightingRealism:true
  });
})();