(()=>{
  'use strict';
  const SEGMENTS={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const stick=(segment,orientation)=>`<i class="ml-match-stick ml-match-${orientation} ml-match-seg-${segment}" aria-hidden="true"><b></b></i>`;
  const digit=value=>{
    const active=new Set((SEGMENTS[value]||'').split(''));
    const segments=[['a','h'],['b','v'],['c','v'],['d','h'],['e','v'],['f','v'],['g','h']];
    return `<span class="ml-match-digit" aria-label="${esc(value)}">${segments.filter(([s])=>active.has(s)).map(([s,o])=>stick(s,o)).join('')}</span>`;
  };
  const sign=value=>{
    if(value==='+')return `<span class="ml-match-sign is-plus" aria-label="плюс">${stick('plus-h','h')}${stick('plus-v','v')}</span>`;
    if(value==='=')return `<span class="ml-match-sign is-equals" aria-label="равно">${stick('eq-top','h')}${stick('eq-bottom','h')}</span>`;
    if(value==='-')return `<span class="ml-match-sign is-minus" aria-label="минус">${stick('minus','h')}</span>`;
    return `<span class="ml-match-symbol">${esc(value)}</span>`;
  };
  const render=(element,equation)=>{
    if(!element)return;
    const value=String(equation||element.dataset.matchEquation||'').replace(/\s+/g,'');
    if(!value)return;
    element.dataset.matchEquation=value;
    element.classList.add('ml-match-equation');
    element.innerHTML=[...value].map(ch=>/\d/.test(ch)?digit(ch):sign(ch)).join('');
    element.setAttribute('role','img');
    element.setAttribute('aria-label',`Головоломка со спичками: ${value.replace('+',' плюс ').replace('=',' равно ')}`);
  };
  const renderAll=root=>(root||document).querySelectorAll?.('[data-match-equation]').forEach(el=>render(el,el.dataset.matchEquation));
  window.MysteryLogicMatchsticks={render,renderAll};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>renderAll(document),{once:true});else renderAll(document);
})();