(()=>{
'use strict';
const app=document.querySelector('[data-moreno-app]');
if(!app)return;
let manualExpanded=null;
function briefing(open){
  return '<details class="v05-case-brief"'+(open?' open':'')+'>'+
  '<summary>Исходные обстоятельства и правила расследования</summary>'+
  '<div class="v05-case-brief-content">'+
  '<p><strong>Исходные обстоятельства.</strong> 20 июля 1991 года после трёх часов ночи 17-летнюю Patricia Moreno нашли тяжело раненой на пожарной лестнице третьего этажа. Она умерла в тот же день. Оружие и гильзы на месте не обнаружены.</p>'+
  '<p><strong>Как действовать.</strong> Вы руководите следственной группой: свободно формулируйте распоряжения, допрашивайте установленных людей и проверяйте собственные версии. Факты открываются только в результате ваших действий, а собранные материалы остаются в «Рабочей папке».</p>'+
  '</div></details>';
}
function enhance(){
  const work=app.querySelector('.v4-work');
  if(!work)return;
  const console=work.querySelector('.v4-console');
  const header=console?.querySelector(':scope > header');
  if(!header||console.querySelector('.v05-case-brief'))return;
  const hasActions=Boolean(console.querySelector('.v4-log'));
  header.insertAdjacentHTML('afterend',briefing(manualExpanded===null?!hasActions:manualExpanded));
  const details=console.querySelector('.v05-case-brief');
  details?.querySelector('summary')?.addEventListener('click',()=>{manualExpanded=!details.open;});
}
let scheduled=false;
function schedule(){
  if(scheduled)return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;enhance();});
}
new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
enhance();
window.MLMorenoV05Brief={version:'1.0',refresh:enhance};
})();
