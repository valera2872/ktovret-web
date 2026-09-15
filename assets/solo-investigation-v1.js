(() => {
'use strict';

const SOLO_ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/solo-session-v2';
const CASE_ID='ML0512_PREVIEW_CB6B46A0DADA7B5188CC65DEC92B0642';
const SESSION_KEY=`mysterylogic:solo-guided-session:${CASE_ID}`;
const PUBLIC_TOKEN='MLPREVIEW-PUBLIC';
const NON_PRESENTABLE=new Set(['E01','E02']);
const EVIDENCE_ORDER=['E01','E02','E05','E06','E07','E08','E03','E04','E11','E12','E09','E10','E15','E16','E13','E14','E19','E20','E21','E17','E18','E22','E23','E24'];

const $=(s,r=document)=>r.querySelector(s);
const esc=(v)=>String(v??'').replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const clean=(v)=>String(v??'').trim();
const initials=(name)=>clean(name).split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';

const intro=$('[data-intro]');
const game=$('[data-game]');
const stage=$('[data-stage]');
const statusBox=$('[data-status]');
const chapterBox=$('[data-chapter]');
const notesDialog=$('[data-notes-dialog]');
const notesContent=$('[data-notes-content]');

let payload=null;
let busy=false;
let confrontationDialog=null;
let reconstructionAnswers={};
let reconstructionIndex=0;

function readSession(){try{return localStorage.getItem(SESSION_KEY)||'';}catch{return'';}}
function saveSession(token){try{if(token)localStorage.setItem(SESSION_KEY,token);else localStorage.removeItem(SESSION_KEY);}catch{}}
function setBusy(on){busy=Boolean(on);document.body.classList.toggle('is-busy',busy);}
function setStatus(text='Вы решаете, что проверять дальше.') { if(statusBox) statusBox.textContent=text; }
function setChapter(text='Расследование'){ if(chapterBox) chapterBox.textContent=text; }
function renderWait(text='Проверяем материалы...'){stage.innerHTML=`<div class="guided-wait"><div class="guided-spinner"></div><p>${esc(text)}</p></div>`;}

async function timedFetch(url,init={},timeoutMs=15000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(url,{...init,signal:controller.signal});}
  catch(err){if(err?.name==='AbortError')throw new Error('Сервер не ответил. Попробуйте ещё раз.');throw err;}
  finally{clearTimeout(timer);}
}

async function serverAction(action,extra={},silent=false){
  const session=readSession();
  const body={action,case_id:CASE_ID,...(session?{session_token:session}:{}),...extra};
  if(!silent){setBusy(true);renderWait();}
  try{
    let response=await timedFetch(SOLO_ENDPOINT,{
      method:'POST',
      headers:{'content-type':'application/json',authorization:`Bearer ${PUBLIC_TOKEN}`},
      cache:'no-store',
      credentials:'omit',
      body:JSON.stringify(body),
    });
    let data=await response.json().catch(()=>({}));
    if(!response.ok&&data?.error==='solo_session_not_found'&&session){
      saveSession('');
      response=await timedFetch(SOLO_ENDPOINT,{
        method:'POST',
        headers:{'content-type':'application/json',authorization:`Bearer ${PUBLIC_TOKEN}`},
        cache:'no-store',credentials:'omit',
        body:JSON.stringify({action:'START',case_id:CASE_ID}),
      });
      data=await response.json().catch(()=>({}));
    }
    if(!response.ok)throw new Error(data?.message||data?.error||`Ошибка ${response.status}`);
    if(data.sessionToken)saveSession(data.sessionToken);
    payload=data;
    return data;
  }finally{if(!silent)setBusy(false);}
}

async function ensureSession(){
  if(payload)return payload;
  return serverAction(readSession()?'SNAPSHOT':'START',{},true);
}

function orderedEvidence(items){
  const index=new Map(EVIDENCE_ORDER.map((id,i)=>[id,i]));
  return [...items].sort((a,b)=>(index.get(a.id)??999)-(index.get(b.id)??999));
}
function accessibleUnopened(){return orderedEvidence((payload?.evidence||[]).filter(e=>e.unlocked&&e.accessible&&!e.opened));}
function openedEvidence(){return orderedEvidence((payload?.evidence||[]).filter(e=>e.opened&&e.title));}
function accessibleDeductions(){return (payload?.deductions||[]).filter(d=>d.accessible&&d.result!=='confirmed'&&Array.isArray(d.choices)&&d.choices.length);}
function confirmedDeductions(){return (payload?.deductions||[]).filter(d=>d.result==='confirmed'&&d.title);}
function availableInteractions(){return (payload?.interactions||[]).filter(i=>i.accessible&&!i.triggered);}
function characterById(id){return (payload?.characters||[]).find(p=>p.id===id);}
function characterByNameInTitle(title=''){return (payload?.characters||[]).find(p=>String(title).includes(String(p.name).split(' ')[0]));}
function evidenceById(id){return (payload?.evidence||[]).find(e=>e.id===id);}
function canPresent(item){return Boolean(item&&item.opened&&item.type!=='statement'&&!NON_PRESENTABLE.has(item.id));}
function leadLabel(item){
  if(item.id==='E01')return'Осмотреть место происшествия';
  if(item.type==='statement')return`Ознакомиться: ${item.title||'показание'}`;
  return item.title?`Проверить: ${item.title}`:'Изучить доступный материал';
}

function renderHub(message=''){
  setChapter('План расследования');
  const leads=accessibleUnopened();
  const opened=openedEvidence();
  const people=payload?.characters||[];
  const deductions=accessibleDeductions();
  const interactions=availableInteractions();
  const finalReady=Boolean(payload?.reconstruction?.accessible);
  const completed=Boolean(payload?.session?.completed);
  if(completed){renderCompleted();return;}

  const leadHtml=leads.length?leads.slice(0,8).map((item)=>`
    <button type="button" class="investigation-lead" data-open-evidence="${esc(item.id)}">
      <span class="investigation-lead__eyebrow">${item.type==='statement'?'Показание':'Направление проверки'}</span>
      <strong>${esc(leadLabel(item))}</strong>
      ${item.teaser?`<small>${esc(item.teaser)}</small>`:''}
    </button>`).join(''):'<p class="investigation-empty">Новых материалов для осмотра сейчас нет. Проверьте показания, версии или уже найденные улики.</p>';

  const peopleHtml=people.map(p=>`<span class="investigation-person-chip"><b>${esc(p.name)}</b><small>${esc(p.role||'')}</small></span>`).join('');
  const versionHtml=deductions.length?deductions.slice(0,4).map(d=>`<button class="investigation-mini" type="button" data-open-deduction="${esc(d.id)}">${esc(d.title||'Проверить версию')}</button>`).join(''):'<span class="investigation-muted">Пока рано делать формальный вывод.</span>';
  const interactionHtml=interactions.map(i=>`<button class="investigation-mini" type="button" data-open-interaction="${esc(i.id)}">${esc(i.label||'Потребовать объяснение')}</button>`).join('');

  stage.innerHTML=`<article class="guided-card investigation-board"><div class="guided-card__body">
    <p class="guided-kicker">Вы ведёте расследование</p>
    <h2>Что проверим дальше?</h2>
    <p class="guided-lead">Сначала соберите картину: осмотрите доступные материалы, познакомьтесь с людьми на станции и задайте им вопросы. Улики предъявляйте только тогда, когда хотите проверить конкретное показание.</p>
    ${message?`<div class="investigation-flash">${esc(message)}</div>`:''}

    <section class="investigation-section">
      <div class="investigation-section__head"><div><span>01</span><h3>Осмотр и материалы</h3></div><small>${leads.length} доступно</small></div>
      <div class="investigation-leads">${leadHtml}</div>
      ${opened.length?`<button class="guided-quiet investigation-section__action" type="button" data-open-materials>Открыть собранные материалы (${opened.length})</button>`:''}
    </section>

    <section class="investigation-section">
      <div class="investigation-section__head"><div><span>02</span><h3>Люди на станции</h3></div><small>${people.length} человека</small></div>
      <div class="investigation-people">${peopleHtml}</div>
      <div class="guided-actions"><button class="guided-action" type="button" data-open-people>Ознакомиться и допросить</button><button class="guided-action secondary" type="button" data-open-interrogations>Свободный допрос</button></div>
    </section>

    <section class="investigation-section">
      <div class="investigation-section__head"><div><span>03</span><h3>Версии и противоречия</h3></div><small>${confirmedDeductions().length} установлено</small></div>
      <div class="investigation-mini-list">${versionHtml}${interactionHtml}</div>
    </section>

    ${finalReady?`<section class="investigation-section investigation-section--final"><div class="investigation-section__head"><div><span>04</span><h3>Финальная реконструкция</h3></div></div><p>Материалов достаточно, чтобы собрать полную версию событий.</p><button class="guided-action" type="button" data-open-reconstruction>Собрать картину</button></section>`:''}
  </div></article>`;

  stage.querySelectorAll('[data-open-evidence]').forEach(btn=>btn.onclick=()=>openEvidence(btn.dataset.openEvidence));
  $('[data-open-materials]',stage)?.addEventListener('click',renderMaterials);
  $('[data-open-people]',stage)?.addEventListener('click',renderPeople);
  $('[data-open-interrogations]',stage)?.addEventListener('click',()=>window.MysteryLogicInterrogation?.open?.());
  stage.querySelectorAll('[data-open-deduction]').forEach(btn=>btn.onclick=()=>renderDeduction(btn.dataset.openDeduction));
  stage.querySelectorAll('[data-open-interaction]').forEach(btn=>btn.onclick=()=>renderInteraction(btn.dataset.openInteraction));
  $('[data-open-reconstruction]',stage)?.addEventListener('click',()=>{reconstructionAnswers={};reconstructionIndex=0;renderReconstruction();});
  setStatus('Вы сами выбираете следующий следственный шаг.');
}

async function openEvidence(id){
  if(busy)return;
  const current=evidenceById(id);
  if(current?.opened){renderEvidence(current);return;}
  try{
    const body=await serverAction('OPEN_EVIDENCE',{evidence_id:id});
    const item=(body.evidence||[]).find(e=>e.id===id);
    if(!item)throw new Error('Материал не открылся.');
    renderEvidence(item);
  }catch(err){renderFailure(err);}
}

function renderEvidence(item){
  setChapter(item.type==='statement'?'Показания':'Материал дела');
  const person=item.type==='statement'?characterByNameInTitle(item.title):null;
  const body=esc(item.body||'').replace(/\n/g,'<br>');
  const visual=['E01','E02'].includes(item.id)?'<div class="guided-card__image"></div>':'';
  const presented=(item.presentedTo||[]).map(id=>characterById(id)?.name).filter(Boolean);
  const presentButton=canPresent(item)?'<button class="guided-action secondary" type="button" data-present-evidence>Предъявить человеку</button>':'';
  stage.innerHTML=`<article class="guided-card">${visual}<div class="guided-card__body">
    <p class="guided-kicker">${item.id==='E01'?'Осмотр места происшествия':item.type==='statement'?'Показание':'Материал дела'}</p>
    ${person?`<div class="guided-person"><div class="guided-avatar">${esc(initials(person.name))}</div><div><h3>${esc(person.name)}</h3><p class="guided-role">${esc(person.role||'')}</p><p class="guided-quote">${body}</p></div></div>`:`<h2>${esc(item.title||'Материал')}</h2>${item.teaser?`<p class="guided-lead">${esc(item.teaser)}</p>`:''}<div class="guided-body">${body}</div>`}
    ${presented.length?`<p class="guided-presented">Уже предъявлено: ${presented.map(esc).join(', ')}</p>`:''}
    <div class="guided-actions">${presentButton}<button class="guided-action" type="button" data-back-hub>Вернуться к плану расследования</button></div>
  </div></article>`;
  $('[data-present-evidence]',stage)?.addEventListener('click',()=>openConfrontation(item.id));
  $('[data-back-hub]',stage).onclick=()=>renderHub();
  setStatus(canPresent(item)?'Изучите материал. Предъявлять его кому-либо необязательно.':'Сначала зафиксируйте факт. К предъявлению улик можно вернуться позже.');
}

function renderPeople(){
  setChapter('Люди на станции');
  const people=payload?.characters||[];
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body">
    <p class="guided-kicker">Круг присутствующих</p><h2>Кто был на станции этой ночью</h2>
    <p class="guided-lead">Сначала ознакомьтесь с их исходными версиями. Потом можно задавать любые вопросы своими словами.</p>
    <div class="investigation-people-list">${people.map(p=>`<section class="investigation-person-card"><div class="guided-avatar">${esc(initials(p.name))}</div><div><h3>${esc(p.name)}</h3><p class="guided-role">${esc(p.role||'')}</p><p>${esc(p.statement||'')}</p><button type="button" class="guided-action secondary" data-person-interrogate="${esc(p.id)}">Допросить</button></div></section>`).join('')}</div>
    <div class="guided-actions"><button class="guided-action" type="button" data-back-hub>К плану расследования</button></div>
  </div></article>`;
  stage.querySelectorAll('[data-person-interrogate]').forEach(btn=>btn.onclick=()=>window.MysteryLogicInterrogation?.open?.(btn.dataset.personInterrogate));
  $('[data-back-hub]',stage).onclick=()=>renderHub();
  setStatus('Показания можно уточнять свободными вопросами.');
}

function renderMaterials(){
  setChapter('Материалы дела');
  const opened=openedEvidence();
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Досье</p><h2>Собранные материалы</h2><p class="guided-lead">Здесь остаётся всё, что вы уже нашли. Возвращайтесь к документам перед допросом или проверкой версии.</p><div class="investigation-materials">${opened.length?opened.map(item=>`<button type="button" class="investigation-material" data-review-evidence="${esc(item.id)}"><span>${item.type==='statement'?'Показание':'Материал'}</span><strong>${esc(item.title||item.id)}</strong>${canPresent(item)?'<small>Можно предъявить</small>':''}</button>`).join(''):'<p>Пока материалов нет.</p>'}</div><div class="guided-actions"><button class="guided-action" type="button" data-back-hub>К плану расследования</button></div></div></article>`;
  stage.querySelectorAll('[data-review-evidence]').forEach(btn=>btn.onclick=()=>renderEvidence(evidenceById(btn.dataset.reviewEvidence)));
  $('[data-back-hub]',stage).onclick=()=>renderHub();
  setStatus('Все найденные материалы сохраняются в досье.');
}

function ensureConfrontationDialog(){
  if(confrontationDialog)return confrontationDialog;
  confrontationDialog=document.createElement('dialog');
  confrontationDialog.className='guided-confrontation';
  confrontationDialog.innerHTML='<button class="guided-confrontation__close" type="button" data-confront-close aria-label="Закрыть">×</button><div data-confront-content></div>';
  document.body.appendChild(confrontationDialog);
  $('[data-confront-close]',confrontationDialog).onclick=()=>confrontationDialog.close();
  confrontationDialog.addEventListener('click',(e)=>{if(e.target===confrontationDialog)confrontationDialog.close();});
  return confrontationDialog;
}
function confrontContent(){return $('[data-confront-content]',ensureConfrontationDialog());}
function openConfrontation(evidenceId){
  const item=evidenceById(evidenceId);if(!canPresent(item))return;
  ensureConfrontationDialog();renderConfrontationChooser(evidenceId);if(!confrontationDialog.open)confrontationDialog.showModal();
}
function renderConfrontationChooser(evidenceId){
  const item=evidenceById(evidenceId);if(!item)return;
  const presented=new Set(item.presentedTo||[]);
  confrontContent().innerHTML=`<p class="guided-kicker">Предъявить улику</p><h2>Кому вы хотите её показать?</h2><p class="guided-confrontation__lead">Это следственное действие. Материал станет известен только выбранному человеку и может изменить его версию.</p><div class="guided-confrontation__evidence"><strong>${esc(item.title||'Материал')}</strong><span>${esc(item.teaser||item.body||'').slice(0,260)}</span></div><div class="guided-confrontation__people">${(payload?.characters||[]).map(p=>`<button type="button" class="guided-confrontation__person" data-confront-person="${esc(p.id)}" ${presented.has(p.id)?'disabled':''}><span class="guided-avatar">${esc(initials(p.name))}</span><span><strong>${esc(p.name)}</strong><small>${presented.has(p.id)?'Уже видел этот материал':esc(p.role||'')}</small></span></button>`).join('')}</div>`;
  confrontationDialog.querySelectorAll('[data-confront-person]').forEach(btn=>btn.onclick=()=>presentEvidenceTo(evidenceId,btn.dataset.confrontPerson));
}
async function presentEvidenceTo(evidenceId,characterId){
  const item=evidenceById(evidenceId),person=characterById(characterId);if(!item||!person)return;
  const beforeVersion=Number(person.statementVersion||1);
  confrontContent().innerHTML=`<div class="guided-wait"><div class="guided-spinner"></div><p>Предъявляем материал: ${esc(person.name)}...</p></div>`;
  try{
    const body=await serverAction('PRESENT_EVIDENCE',{evidence_id:evidenceId,character_id:characterId},true);
    const updated=(body.characters||[]).find(p=>p.id===characterId)||person;
    const changed=Number(updated.statementVersion||1)>beforeVersion;
    confrontContent().innerHTML=`<div class="guided-confrontation__result"><p class="guided-kicker">${changed?'Показания изменились':'Материал предъявлен'}</p><h2>${esc(updated.name||person.name)}</h2>${changed?`<div class="guided-confrontation__statement"><p>${esc(updated.statement||'')}</p></div>`:'<div class="guided-confrontation__status">Человек увидел материал, но пока не изменил свою версию.</div>'}<div class="guided-confrontation__actions"><button class="guided-action secondary" type="button" data-confront-another>Предъявить другому</button><button class="guided-action" type="button" data-confront-done>Вернуться</button></div></div>`;
    $('[data-confront-another]',confrontationDialog).onclick=()=>renderConfrontationChooser(evidenceId);
    $('[data-confront-done]',confrontationDialog).onclick=()=>{confrontationDialog.close();renderEvidence(evidenceById(evidenceId));};
  }catch(err){confrontContent().innerHTML=`<p class="guided-kicker">Не получилось</p><h2>Материал остался у вас</h2><p>${esc(err?.message||String(err))}</p><button class="guided-action" type="button" data-confront-retry>Попробовать ещё раз</button>`;$('[data-confront-retry]',confrontationDialog).onclick=()=>renderConfrontationChooser(evidenceId);}
}

function renderDeduction(id){
  const d=(payload?.deductions||[]).find(x=>x.id===id);if(!d)return renderHub();
  setChapter('Проверка версии');
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Ваша гипотеза</p><h2>${esc(d.title||'Какой вывод следует из фактов?')}</h2><p class="guided-lead">${esc(d.prompt||'Выберите вариант, который лучше всего согласуется с уже найденным.')}</p><div class="guided-choice-list">${(d.choices||[]).map(c=>`<button class="guided-choice" type="button" data-deduction-choice="${esc(c.id)}">${esc(c.label)}</button>`).join('')}</div><div class="guided-actions"><button class="guided-action secondary" type="button" data-back-hub>Пока не решать</button></div></div></article>`;
  stage.querySelectorAll('[data-deduction-choice]').forEach(btn=>btn.onclick=()=>answerDeduction(id,btn.dataset.deductionChoice));
  $('[data-back-hub]',stage).onclick=()=>renderHub();
  setStatus('Версию проверяете вы, а не игра вместо вас.');
}
async function answerDeduction(id,choiceId){
  try{
    const body=await serverAction('ATTEMPT_DEDUCTION',{deduction_id:id,choice_id:choiceId});
    const d=(body.deductions||[]).find(x=>x.id===id);
    if(d?.result==='confirmed')renderHub(`Версия подтверждена: ${d.title||'вывод установлен'}`);
    else {renderDeduction(id);const card=$('.guided-card__body',stage);card?.insertAdjacentHTML('afterbegin','<div class="guided-result is-wrong">Этот вариант пока не сходится с известными фактами.</div>');}
  }catch(err){renderFailure(err);}
}

function renderInteraction(id){
  const interaction=(payload?.interactions||[]).find(i=>i.id===id);if(!interaction)return renderHub();
  setChapter('Прямой разговор');
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Следственное действие</p><h2>${esc(interaction.label||'Потребовать объяснение')}</h2><p class="guided-lead">Фактов достаточно, чтобы перейти от общих вопросов к прямому требованию объяснить противоречие.</p><div class="guided-actions"><button class="guided-action" type="button" data-trigger-interaction>Поговорить</button><button class="guided-action secondary" type="button" data-back-hub>Отложить</button></div></div></article>`;
  $('[data-trigger-interaction]',stage).onclick=()=>triggerInteraction(id);
  $('[data-back-hub]',stage).onclick=()=>renderHub();
}
async function triggerInteraction(id){
  try{await serverAction('TRIGGER_INTERACTION',{interaction_id:id});renderHub('После прямого разговора показания могли измениться. Проверьте людей и материалы.');}catch(err){renderFailure(err);}
}

function renderReconstruction(){
  const fields=payload?.reconstruction?.fields||[];
  if(!fields.length)return renderHub('Финальная реконструкция пока недоступна.');
  if(reconstructionIndex>=fields.length){submitReconstruction();return;}
  const field=fields[reconstructionIndex];
  setChapter('Финальная реконструкция');
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Финал ${reconstructionIndex+1} из ${fields.length}</p><h2>${esc(field.prompt)}</h2><div class="guided-choice-list">${(field.options||[]).map(o=>`<button class="guided-choice" type="button" data-recon-choice="${esc(o.id)}">${esc(o.label)}</button>`).join('')}</div><div class="guided-actions"><button class="guided-action secondary" type="button" data-back-hub>Вернуться к расследованию</button></div></div></article>`;
  stage.querySelectorAll('[data-recon-choice]').forEach(btn=>btn.onclick=()=>{reconstructionAnswers[field.id]=btn.dataset.reconChoice;reconstructionIndex+=1;renderReconstruction();});
  $('[data-back-hub]',stage).onclick=()=>renderHub();
}
async function submitReconstruction(){
  try{const body=await serverAction('SUBMIT_RECONSTRUCTION',{answers:reconstructionAnswers});if(body.session?.completed)renderCompleted();else{reconstructionAnswers={};reconstructionIndex=0;renderHub('В финальной версии есть ошибка. Вернитесь к уликам и показаниям.');}}catch(err){renderFailure(err);}
}
function renderCompleted(){
  setChapter('Дело раскрыто');
  stage.innerHTML='<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Расследование завершено</p><h2>Картина восстановлена</h2><p class="guided-lead">Вы разобрались, что произошло этой ночью.</p><div class="guided-actions"><button class="guided-action secondary" type="button" data-open-materials>Просмотреть материалы</button></div></div></article>';
  $('[data-open-materials]',stage)?.addEventListener('click',renderMaterials);
  setStatus('Дело раскрыто.');
}

function renderNotes(){
  const opened=openedEvidence();const confirmed=confirmedDeductions();
  notesContent.innerHTML=`<section class="guided-note-section"><h3>Найденные материалы</h3>${opened.length?`<ul>${opened.map(e=>`<li><button type="button" class="investigation-note-link" data-note-evidence="${esc(e.id)}">${esc(e.title||e.id)}</button></li>`).join('')}</ul>`:'<p>Пока ничего.</p>'}</section><section class="guided-note-section"><h3>Установленные выводы</h3>${confirmed.length?`<ul>${confirmed.map(d=>`<li>${esc(d.title)}</li>`).join('')}</ul>`:'<p>Пока окончательных выводов нет.</p>'}</section>`;
  notesContent.querySelectorAll('[data-note-evidence]').forEach(btn=>btn.onclick=()=>{notesDialog.close();renderEvidence(evidenceById(btn.dataset.noteEvidence));});
}

function renderFailure(err){
  setBusy(false);setChapter('Расследование');
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Не получилось продолжить</p><h2>Связь с расследованием прервалась</h2><p class="guided-lead">${esc(err?.message||String(err))}</p><div class="guided-actions"><button class="guided-action" type="button" data-retry>Попробовать ещё раз</button></div></div></article>`;
  $('[data-retry]',stage).onclick=async()=>{payload=null;try{await ensureSession();renderHub();}catch(e){renderFailure(e);}};
}

$('[data-enter]')?.addEventListener('click',async()=>{
  if(busy)return;
  intro.hidden=true;game.hidden=false;setChapter('Расследование');renderWait('Открываем материалы дела...');
  try{await ensureSession();renderHub();}catch(err){renderFailure(err);}
});
$('[data-notes]')?.addEventListener('click',()=>{renderNotes();notesDialog.showModal();});
$('[data-notes-close]')?.addEventListener('click',()=>notesDialog.close());
notesDialog?.addEventListener('click',(e)=>{if(e.target===notesDialog)notesDialog.close();});
})();