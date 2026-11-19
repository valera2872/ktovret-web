(()=>{
'use strict';
const app=document.querySelector('[data-moreno-app]');
if(!app)return;
document.body.classList.add('moreno-reference-v11');

function rail(){return `
  <div class="ref11-rail-ui" aria-hidden="true">
    <div class="ref11-rail-copy">КАЖДАЯ<br>КВАРТИРА<br>ХРАНИТ<br>СВОЮ ИСТОРИЮ</div>
    <div class="ref11-floors">
      <div><span>4</span><i></i><b>этаж</b></div>
      <div class="active"><span>3</span><i></i><b>этаж</b></div>
      <div><span>2</span><i></i><b>этаж</b></div>
      <div><span>1</span><i></i><b>этаж</b></div>
    </div>
    <div class="ref11-location"><strong>MALDEN · 1991</strong><span>Люди ближе,<br>чем кажется.</span></div>
  </div>`}

// The original facts and the rules of free investigation must remain
// available after the opening screen, without prescribing the player's moves.
let briefingPreference=null;
function caseBrief(expanded){
  return `<details class="ref11-case-brief"${expanded?' open':''}>
    <summary><span class="ref11-case-brief-label">ДЕЛО 91-M · MALDEN, 1991</span><strong>Исходные обстоятельства и как расследовать</strong></summary>
    <div class="ref11-case-brief-content">
      <div><small>ЧТО ИЗВЕСТНО</small><p>20 июля 1991 года после 03:00 на пожарной лестнице третьего этажа нашли 17-летнюю Patricia Moreno с огнестрельным ранением головы. Она умерла в тот же день. Оружие и гильзы на месте не обнаружены.</p></div>
      <div><small>ВАША РОЛЬ</small><p>Вы руководите повторным расследованием. Пишите следственные распоряжения обычным языком, задавайте вопросы установленным свидетелям, проверяйте свои версии. Материалы появляются только после ваших действий и сохраняются в «Рабочей папке». Ход расследования выбираете вы.</p></div>
    </div>
  </details>`;
}

const has=(set,...ids)=>ids.some(id=>set.has(id));
function folderCard(kind,title,meta,body){return `<article class="ref11-folder-card ${kind}"><div class="ref11-folder-icon" aria-hidden="true"></div><div><small>${title}</small>${meta?`<b>${meta}</b>`:''}<p>${body}</p></div><span class="ref11-folder-chevron">›</span></article>`}
// Keep the case engine's real evidence cards in place. Their complete
// source-grounded descriptions must stay available while investigating.
// Earlier design code replaced them with non-interactive category teasers.
function buildFolder(evidence){
  if(evidence.dataset.ref11Folder==='1')return;
  evidence.dataset.ref11Folder='1';
  const head=evidence.querySelector('.v4-evidence-head');
  const count=evidence.querySelectorAll(':scope > article:not(.v4-hyp)').length;
  const counter=head?.querySelector('span');
  if(counter){
    const copy=`${count} ${count%10===1&&count%100!==11?'материал':count%10>=2&&count%10<=4&&(count%100<10||count%100>=20)?'материала':'материалов'}`;
    if(counter.textContent!==copy)counter.textContent=copy;
  }
}

function enhance(){
  const work=app.querySelector('.v4-work');
  if(!work)return;

  if(!work.querySelector('.ref11-rail-ui'))work.insertAdjacentHTML('beforeend',rail());

  // Restore the engine's original "ДЕЛО У ВАС" first-step instruction.
  // On later turns the briefing stays accessible, but starts folded.
  const console=work.querySelector('.v4-console');
  const header=console?.querySelector(':scope > header');
  if(header&&!console.querySelector('.ref11-case-brief')){
    const hasJournal=Boolean(work.querySelector('.v4-log'));
    header.insertAdjacentHTML('afterend',caseBrief(briefingPreference===null?!hasJournal:briefingPreference));
    const details=console.querySelector('.ref11-case-brief');
    details?.querySelector('summary')?.addEventListener('click',()=>{
      briefingPreference=!details.open;
    });
  }

  const evidence=work.querySelector('.v4-evidence');
  if(evidence)buildFolder(evidence);

  work.querySelectorAll('.v6-item').forEach((card,i)=>{
    const idx=String(i+1);
    if(card.dataset.ref11Index!==idx)card.dataset.ref11Index=idx;
    // Progress status is owned by the game engine and v16 semantic state bar.
    // Never mark clarifications, errors and failed actions as completed.
    card.querySelector('.ref11-card-status')?.remove();
  });

  work.querySelectorAll('.v4-log').forEach(log=>{
    if(!log.querySelector('.ref11-log-menu'))log.insertAdjacentHTML('afterbegin','<span class="ref11-log-menu">•••</span>');
  });

  const form=work.querySelector('.v4-composer');
  if(form){
    const box=form.querySelector('textarea');
    if(box){
      if(box.placeholder!=='Напишите, что нужно сделать…')box.placeholder='Напишите, что нужно сделать…';
      if(box.getAttribute('aria-label')!=='Следственное распоряжение')box.setAttribute('aria-label','Следственное распоряжение');
    }
    const status=form.querySelector('div > span');
    if(status&&/ИИ понимает язык/.test(status.textContent))status.textContent='Shift + Enter — новая строка';
    const btn=form.querySelector('button');
    if(btn&&!btn.disabled&&btn.textContent.trim()==='Выполнить')btn.innerHTML='Выполнить <span class="ref11-arrow">→</span>';
  }
}

let scheduled=false;
function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance()})}
new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
enhance();
window.MLMorenoReferenceV11={version:'1.1.2',refresh:enhance};
})();
