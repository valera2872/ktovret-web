(()=>{
'use strict';
const app=document.querySelector('[data-moreno-app]');
if(!app)return;
document.body.classList.add('moreno-reference-v17');

const targetNames={boyfriend:'бойфренд старшей дочери',mother:'приёмная мать Patricia',older:'старшая дочь приёмной матери',younger:'младшая дочь приёмной матери',witness:'бывший житель второго этажа'};
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

function targetFromCard(card){
  const title=norm(card.querySelector('h3')?.textContent);
  const body=norm(card.querySelector('p')?.textContent);
  const m=title.match(/^Ответ:\s*(.+)$/i);if(m)return m[1];
  if(/^Прямой допрос открыт$/i.test(title)){const x=body.match(/^Перед вами\s+(.+?)\.\s/i);if(x)return x[1]}
  return'';
}
function isConfrontation(card){return /^Вы предъявили\s/i.test(norm(card.querySelector('p')?.textContent))}
function isContradiction(card){return isConfrontation(card)&&/Это расходится/i.test(norm(card.querySelector('p')?.textContent))}
function isAnswer(card){return /^Ответ:\s*/i.test(norm(card.querySelector('h3')?.textContent))}
function isOpen(card){return /^Прямой допрос открыт$/i.test(norm(card.querySelector('h3')?.textContent))}
function isInterrogationCard(card){return isAnswer(card)||isOpen(card)||isConfrontation(card)}
function evidenceTag(card){
  const text=norm(card.textContent).toLowerCase();
  if(/алиби|сне в кресле|спрятал оружие в кресле/.test(text))return'АЛИБИ';
  if(/баллист|калибра \.38|калибр \.38/.test(text))return'БАЛЛИСТИКА';
  if(/траектор|дверного про[её]ма/.test(text))return'ТРАЕКТОРИЯ';
  if(/бывшего жильца второго этажа|независим.*свидетел|описание мужчины/.test(text))return'СВИДЕТЕЛЬ';
  if(/несколько пистолет|доступ.*оруж/.test(text))return'ОРУЖИЕ';
  if(/угрожающ|конфликт/.test(text))return'КОНФЛИКТ';
  if(/осмотр|гильз|проникновен/.test(text))return'СЦЕНА';
  if(/судебно-медицин|вскрыти|повреждени.*мозг/.test(text))return'СУДМЕД';
  if(/верси.*бойфренд|ранее зафиксированн.*верси/.test(text))return'ПОКАЗАНИЯ';
  return'МАТЕРИАЛ';
}
function glyph(){return'<i class="ref17-glyph" aria-hidden="true"><b></b><b></b><b></b></i>'}
function setStatebar(card,label,note){
  const bar=card.querySelector(':scope > .ref16-statebar');if(!bar)return;
  const key=`${label}|${note}`;if(bar.dataset.v17===key)return;
  bar.dataset.v17=key;bar.innerHTML=`${glyph()}<strong>${label}</strong><span>${note}</span>`;
}
function enhanceCard(card){
  if(isContradiction(card)){
    card.classList.add('ref17-confrontation','ref17-contradiction');
    setStatebar(card,'РАСХОЖДЕНИЕ','зафиксировано между уже полученными материалами');
  }else if(isConfrontation(card)){
    card.classList.add('ref17-confrontation');
    setStatebar(card,'ПРЕДЪЯВЛЕНИЕ','ранее полученный материал предъявлен собеседнику');
  }else if(isAnswer(card)){
    card.classList.add('ref17-answer');
    setStatebar(card,'ОТВЕТ СОБЕСЕДНИКА','зафиксировано в пределах опубликованных сведений');
  }else if(isOpen(card)){
    card.classList.add('ref17-open');
    setStatebar(card,'ДОПРОС ОТКРЫТ','можно задавать свободные вопросы или вернуться к группе');
  }
  if(isConfrontation(card)&&!card.querySelector('.ref17-evidence-tag')){
    const tag=document.createElement('span');tag.className='ref17-evidence-tag';tag.textContent=`МАТЕРИАЛ · ${evidenceTag(card)}`;
    card.querySelector('h3')?.insertAdjacentElement('afterend',tag);
  }
}
function targetOfLog(log){
  const cards=[...log.querySelectorAll('.v6-item')];if(!cards.length)return'';
  const interrogation=cards.filter(isInterrogationCard);if(!interrogation.length||interrogation.length!==cards.length)return'';
  const targets=[...new Set(interrogation.map(targetFromCard).filter(Boolean))];return targets.length===1?targets[0]:'';
}
function enhanceLogs(){
  const logs=[...app.querySelectorAll('.v4-log')];
  logs.forEach(log=>log.querySelectorAll('.v6-item').forEach(enhanceCard));
  const targets=logs.map(targetOfLog);
  logs.forEach((log,i)=>{
    for(const c of ['ref17-interrogation-log','ref17-thread-start','ref17-thread-middle','ref17-thread-end'])log.classList.remove(c);
    const target=targets[i];if(!target)return;
    log.classList.add('ref17-interrogation-log');
    const samePrev=targets[i-1]===target,sameNext=targets[i+1]===target;
    log.classList.add(!samePrev?'ref17-thread-start':sameNext?'ref17-thread-middle':'ref17-thread-end');
    if(!sameNext)log.classList.add('ref17-thread-end');
    const command=log.querySelector('.v4-command');
    if(command&&!command.querySelector('.ref17-turn-label')){
      const hasPresent=[...log.querySelectorAll('.v6-item')].some(isConfrontation);
      command.insertAdjacentHTML('afterbegin',`<span class="ref17-turn-label">${hasPresent?'ПРЕДЪЯВЛЕНИЕ':'ВОПРОС / ДЕЙСТВИЕ'}</span>`);
    }
    let head=log.querySelector(':scope > .ref17-thread-head');
    if(!head){head=document.createElement('div');head.className='ref17-thread-head';log.insertBefore(head,log.firstChild)}
    const key=`${target}|${samePrev?'continue':'start'}`;
    if(head.dataset.key!==key){head.dataset.key=key;head.innerHTML=`<span class="ref17-person-dot" aria-hidden="true"></span><strong>${samePrev?'ПРОДОЛЖЕНИЕ ДОПРОСА':'ДОПРОС'}</strong><span>${target}</span>`}
  });
}
function enhanceFocus(){
  const form=app.querySelector('.v4-composer');if(!form)return;
  const state=window.MLMorenoV6?.getState?.()||{};const focus=state.focus||'';
  let strip=form.querySelector(':scope > .ref17-focus-strip');
  if(!focus){form.classList.remove('ref17-focus-active');strip?.remove();return}
  form.classList.add('ref17-focus-active');
  if(!strip){strip=document.createElement('div');strip.className='ref17-focus-strip';form.insertBefore(strip,form.firstChild)}
  const name=targetNames[focus]||focus;if(strip.dataset.focus!==name){strip.dataset.focus=name;strip.innerHTML=`<span></span><b>ДОПРОС</b><strong>${name}</strong><em>вопрос или новое распоряжение</em>`}
}
function enhance(){enhanceLogs();enhanceFocus()}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance()})}
new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
enhance();
window.MLMorenoReferenceV17={version:'1.7.1',refresh:enhance};
})();
