(()=>{
'use strict';
const app=document.querySelector('[data-moreno-app]');
if(!app)return;
document.body.classList.add('moreno-reference-v16');

const STATES={
  interview:{label:'ПОКАЗАНИЯ',note:'зафиксировано со слов собеседника'},
  forensic:{label:'ЭКСПЕРТИЗА',note:'результат специальной проверки'},
  contradiction:{label:'ПРОТИВОРЕЧИЕ',note:'расхождение требует вашей оценки'},
  evidence:{label:'НОВЫЙ МАТЕРИАЛ',note:'добавлено в материалы дела'},
  uncertain:{label:'ПРЕДЕЛ ИСТОЧНИКА',note:'надежного ответа в материалах нет'},
  deadend:{label:'НЕТ РЕЗУЛЬТАТА',note:'эта линия пока ничего не дала'},
  hypothesis:{label:'РАБОЧАЯ ВЕРСИЯ',note:'зафиксирована без оценки'},
  system:{label:'СЛУЖЕБНАЯ ЗАПИСЬ',note:'состояние расследования'}
};

function classify(card){
  const title=(card.querySelector('h3')?.textContent||'').trim();
  const body=(card.querySelector('p')?.textContent||'').trim();
  const text=`${title} ${body}`;
  if(card.classList.contains('hypothesis'))return'hypothesis';
  if(card.classList.contains('limit'))return'uncertain';
  if(card.classList.contains('dead'))return'deadend';
  if(card.classList.contains('system'))return'system';
  if(/противореч|признал(?:ась|ся).*лгал|лгала полиции|проверка версии о сне/i.test(text))return'contradiction';
  if(/баллист|криминалистическ|судебно-медицин/i.test(text))return'forensic';
  if(card.classList.contains('statement')||card.classList.contains('interview')||/^ответ:/i.test(title))return'interview';
  return'evidence';
}

function stateGlyph(type){
  if(type==='interview')return'<i class="ref16-glyph"><b></b><b></b><b></b></i>';
  if(type==='forensic')return'<i class="ref16-glyph"><b></b><b></b><b></b><b></b></i>';
  if(type==='contradiction')return'<i class="ref16-glyph"><b></b><b></b></i>';
  if(type==='uncertain')return'<i class="ref16-glyph"><b></b></i>';
  if(type==='deadend')return'<i class="ref16-glyph"><b></b><b></b></i>';
  return'<i class="ref16-glyph"><b></b></i>';
}

function enhanceCard(card){
  const type=classify(card),meta=STATES[type]||STATES.evidence;
  for(const name of Object.keys(STATES))card.classList.remove(`ref16-${name}`);
  card.classList.add(`ref16-${type}`);
  card.dataset.investigationState=type;
  let bar=card.querySelector(':scope > .ref16-statebar');
  if(!bar){
    bar=document.createElement('div');
    bar.className='ref16-statebar';
    card.insertBefore(bar,card.firstChild);
  }
  if(bar.dataset.state!==type){
    bar.dataset.state=type;
    bar.innerHTML=`${stateGlyph(type)}<strong>${meta.label}</strong><span>${meta.note}</span>`;
  }
}

function enhance(){app.querySelectorAll('.v6-item').forEach(enhanceCard)}
let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance()})}
new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
enhance();
window.MLMorenoReferenceV16={version:'1.6.1',refresh:enhance,classify};
})();
