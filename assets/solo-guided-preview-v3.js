const SOLO_ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/solo-session-v2';
const TOKEN_KEY='mysterylogic:guided-preview-token:v1';
const SESSION_PREFIX='mysterylogic:solo-guided-session:';

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

let previewToken='';
const caseId='ML0512_PREVIEW_CB6B46A0DADA7B5188CC65DEC92B0642';
let payload=null;
let busy=false;
let currentEvidenceId='';
let reactionQueue=[];
let shownReactions=new Set();
let resultScene=null;
let reconstructionAnswers={};
let reconstructionIndex=0;
let confrontationDialog=null;

const evidenceOrder=['E01','E02','E05','E06','E07','E08','E03','E04','E11','E12','E09','E10','E15','E16','E13','E14','E19','E20','E21','E17','E18','E22','E23','E24'];

function tokenFromFragment(){
  const raw=decodeURIComponent(String(location.hash||'').replace(/^#/,''));
  return raw.startsWith('MLPREVIEW-')?raw:'';
}
function readSavedToken(){try{return sessionStorage.getItem(TOKEN_KEY)||''}catch{return''}}
function saveToken(token){try{sessionStorage.setItem(TOKEN_KEY,token)}catch{}}
function sessionKey(){return `${SESSION_PREFIX}${caseId}`}
function readSession(){try{return localStorage.getItem(sessionKey())||''}catch{return''}}
function saveSession(token){try{if(token)localStorage.setItem(sessionKey(),token);else localStorage.removeItem(sessionKey())}catch{}}
function setBusy(on){busy=on;document.body.classList.toggle('is-busy',on);document.querySelectorAll('button').forEach(b=>b.disabled=Boolean(on))}

async function timedFetch(url,init={},timeoutMs=12000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(url,{...init,signal:controller.signal})}
  catch(err){if(err?.name==='AbortError')throw new Error('Сервер не ответил. Попробуйте ещё раз.');throw err}
  finally{clearTimeout(timer)}
}

function primePreviewToken(){
  previewToken=tokenFromFragment()||readSavedToken();
  if(previewToken)saveToken(previewToken);
}

async function serverAction(action,extra={},silent=false){
  const headers={'content-type':'application/json',authorization:`Bearer ${previewToken}`};
  const sessionToken=readSession();
  const requestBody={action,case_id:caseId,...(sessionToken?{session_token:sessionToken}:{}),...extra};
  if(!silent)setBusy(true);
  try{
    let response=await timedFetch(SOLO_ENDPOINT,{method:'POST',headers,cache:'no-store',credentials:'omit',body:JSON.stringify(requestBody)},15000);
    let body=await response.json().catch(()=>({}));
    if(!response.ok&&body?.error==='solo_session_not_found'&&sessionToken){
      saveSession('');
      response=await timedFetch(SOLO_ENDPOINT,{method:'POST',headers,cache:'no-store',credentials:'omit',body:JSON.stringify({action:'START',case_id:caseId})},15000);
      body=await response.json().catch(()=>({}));
    }
    if(!response.ok){
      const messages={access_denied:'Доступ к делу не подтверждён.',solo_session_merge_required:'Не удалось восстановить старую тестовую партию. Начните заново.',case_not_found:'Тестовое дело не найдено.'};
      throw new Error(messages[body?.error]||`Не удалось продолжить расследование: ${body?.error||response.status}`);
    }
    if(body.sessionToken)saveSession(body.sessionToken);
    payload=body;
    return body;
  }finally{if(!silent)setBusy(false)}
}

async function ensureSession(){
  if(payload)return payload;
  if(!previewToken)primePreviewToken();
  if(!previewToken)throw new Error('Откройте расследование по персональной ссылке.');
  return serverAction(readSession()?'SNAPSHOT':'START');
}

function chapterLabel(){
  const confirmed=(payload?.deductions||[]).filter(d=>d.result==='confirmed').length;
  if(payload?.session?.completed)return'Дело раскрыто';
  if(confirmed>=8)return'Финальная картина';
  if(confirmed>=5)return'Последние минуты';
  if(confirmed>=2)return'Проверяем показания';
  return'Что произошло';
}
function updateChrome(message=''){if(chapterBox)chapterBox.textContent=chapterLabel();if(statusBox)statusBox.textContent=message||'Идите по следу. Решайте сами, что проверить и кому предъявить найденное.')}
function renderWait(text='Проверяем, что изменилось...'){stage.innerHTML=`<div class="guided-wait"><div class="guided-spinner"></div><p>${esc(text)}</p></div>`}
function evidenceById(id){return (payload?.evidence||[]).find(e=>e.id===id)}
function characterByNameInTitle(title=''){return (payload?.characters||[]).find(p=>String(title).includes(String(p.name).split(' ')[0]))}
function characterById(id){return (payload?.characters||[]).find(p=>p.id===id)}
function presentedNames(item){return (item?.presentedTo||[]).map(id=>characterById(id)?.name).filter(Boolean)}

function renderEvidence(item){
  currentEvidenceId=item.id;
  const person=item.type==='statement'?characterByNameInTitle(item.title):null;
  const body=esc(item.body||'').replace(/\n/g,'<br>');
  const visual=['E01','E02'].includes(item.id)?'<div class="guided-card__image"></div>':'';
  const presented=presentedNames(item);
  stage.innerHTML=`<article class="guided-card">${visual}<div class="guided-card__body"><p class="guided-kicker">${esc(item.type==='statement'?'Показание':'Новый факт')}</p>${person?`<div class="guided-person"><div class="guided-avatar">${esc(initials(person.name))}</div><div><h3>${esc(person.name)}</h3><p class="guided-role">${esc(person.role||'')}</p><p class="guided-quote">${body}</p></div></div>`:`<h2>${esc(item.title||'Материал')}</h2>${item.teaser?`<p class="guided-lead">${esc(item.teaser)}</p>`:''}<div class="guided-body">${body}</div>`}${presented.length?`<p class="guided-presented">Уже предъявлено: ${presented.map(esc).join(', ')}</p>`:''}<div class="guided-actions"><button class="guided-action secondary" data-present-evidence>Предъявить кому-то</button><button class="guided-action" data-evidence-continue>Продолжить расследование</button></div></div></article>`;
  $('[data-present-evidence]',stage).onclick=()=>openConfrontation(item.id);
  $('[data-evidence-continue]',stage).onclick=continueFromEvidence;
  updateChrome('Изучите факт. Вы сами решаете, нужно ли и кому его предъявить.');
}
async function openEvidence(item){
  renderWait('Открываем следующий материал...');
  const body=await serverAction('OPEN_EVIDENCE',{evidence_id:item.id});
  const opened=(body.evidence||[]).find(e=>e.id===item.id);
  if(!opened)throw new Error('Материал не открылся.');
  renderEvidence(opened);
}
function collectChangedCharacters(before,after){
  for(const current of after||[]){
    const previous=(before||[]).find(p=>p.id===current.id);if(!previous)continue;
    if(Number(current.statementVersion||1)>Number(previous.statementVersion||1)){
      const key=`${current.id}:${current.statementVersion}`;
      if(!shownReactions.has(key)){shownReactions.add(key);reactionQueue.push(current)}
    }
  }
}
function ensureConfrontationDialog(){
  if(confrontationDialog)return confrontationDialog;
  confrontationDialog=document.createElement('dialog');
  confrontationDialog.className='guided-confrontation';
  confrontationDialog.innerHTML='<button class="guided-confrontation__close" type="button" data-confront-close aria-label="Закрыть">×</button><div data-confront-content></div>';
  document.body.appendChild(confrontationDialog);
  $('[data-confront-close]',confrontationDialog).onclick=()=>confrontationDialog.close();
  confrontationDialog.addEventListener('click',(e)=>{if(e.target===confrontationDialog)confrontationDialog.close()});
  return confrontationDialog;
}
function confrontContent(){return $('[data-confront-content]',ensureConfrontationDialog())}
function renderConfrontationChooser(evidenceId){
  const item=evidenceById(evidenceId);if(!item)return;
  const people=payload?.characters||[];
  const presented=new Set(item.presentedTo||[]);
  confrontContent().innerHTML=`<p class="guided-kicker">Предъявить материал</p><h2>Кому показать улику?</h2><p class="guided-confrontation__lead">Выберите собеседника сами. Только после вашего решения материал становится известен этому человеку и может изменить его показания.</p><div class="guided-confrontation__evidence"><strong>${esc(item.title||'Материал')}</strong><span>${esc(item.teaser||item.body||'').slice(0,260)}</span></div><div class="guided-confrontation__people">${people.map(person=>`<button type="button" class="guided-confrontation__person" data-confront-person="${esc(person.id)}" ${presented.has(person.id)?'disabled':''}><span class="guided-avatar">${esc(initials(person.name))}</span><span><strong>${esc(person.name)}</strong><small>${presented.has(person.id)?'Уже видел этот материал':esc(person.role||'')}</small></span></button>`).join('')}</div>`;
  confrontationDialog.querySelectorAll('[data-confront-person]').forEach(btn=>btn.onclick=()=>presentEvidenceTo(evidenceId,btn.dataset.confrontPerson));
}
function openConfrontation(evidenceId){
  const item=evidenceById(evidenceId);if(!item||!item.opened)return;
  notesDialog?.close();
  ensureConfrontationDialog();
  renderConfrontationChooser(evidenceId);
  if(!confrontationDialog.open)confrontationDialog.showModal();
}
async function presentEvidenceTo(evidenceId,characterId){
  const item=evidenceById(evidenceId),person=characterById(characterId);if(!item||!person)return;
  confrontContent().innerHTML=`<div class="guided-wait"><div class="guided-spinner"></div><p>Предъявляем материал: ${esc(person.name)}...</p></div>`;
  const beforeVersion=Number(person.statementVersion||1);
  try{
    const body=await serverAction('PRESENT_EVIDENCE',{evidence_id:evidenceId,character_id:characterId},true);
    const updated=(body.characters||[]).find(p=>p.id===characterId)||person;
    const changed=Number(updated.statementVersion||1)>beforeVersion;
    if(currentEvidenceId===evidenceId){const fresh=evidenceById(evidenceId);if(fresh)renderEvidence(fresh)}
    if(notesDialog?.open)renderNotes();
    confrontContent().innerHTML=`<div class="guided-confrontation__result"><p class="guided-kicker">${changed?'Показания изменились':'Материал предъявлен'}</p><h2>${esc(updated.name||person.name)}</h2>${changed?`<div class="guided-confrontation__statement"><p>${esc(updated.statement||'')}</p></div>`:'<div class="guided-confrontation__status">Новой версии показаний нет. Этот материал сам по себе не заставил собеседника изменить рассказ.</div>'}<div class="guided-confrontation__actions"><button class="guided-action secondary" type="button" data-confront-another>Предъявить другому</button><button class="guided-action" type="button" data-confront-done>Вернуться к расследованию</button></div></div>`;
    $('[data-confront-another]',confrontationDialog).onclick=()=>renderConfrontationChooser(evidenceId);
    $('[data-confront-done]',confrontationDialog).onclick=()=>confrontationDialog.close();
    updateChrome(changed?`${updated.name} изменил показания после предъявления.`:`${updated.name} ознакомлен с материалом.`);
  }catch(err){
    confrontContent().innerHTML=`<p class="guided-kicker">Не получилось предъявить</p><h2>Материал остался у вас</h2><p class="guided-confrontation__lead">${esc(err?.message||String(err))}</p><div class="guided-confrontation__actions"><button class="guided-action" type="button" data-confront-retry>Попробовать ещё раз</button></div>`;
    $('[data-confront-retry]',confrontationDialog).onclick=()=>renderConfrontationChooser(evidenceId);
  }
}
async function continueFromEvidence(){
  if(busy)return;
  currentEvidenceId='';
  try{await advance()}catch(err){renderFailure(err)}
}
function renderReaction(person){
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Показания изменились</p><div class="guided-person"><div class="guided-avatar">${esc(initials(person.name))}</div><div><h3>${esc(person.name)}</h3><p class="guided-role">${esc(person.role||'')}</p><p class="guided-quote">${esc(person.statement||'')}</p></div></div><div class="guided-actions"><button class="guided-action" data-reaction-continue>Дальше</button></div></div></article>`;
  $('[data-reaction-continue]',stage).onclick=()=>{reactionQueue.shift();advance().catch(renderFailure)};
  updateChrome('Показания изменились после сделанного вами шага.');
}
function nextDeduction(){return (payload?.deductions||[]).find(d=>d.accessible&&d.result!=='confirmed'&&Array.isArray(d.choices)&&d.choices.length)}
function renderDeduction(deduction,wrong=false){
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Что вы думаете?</p><h2>${esc(deduction.title||'Какой вывод следует из фактов?')}</h2><p class="guided-lead">${esc(deduction.prompt||'Какой вариант лучше всего объясняет то, что вы уже узнали?')}</p>${wrong?'<div class="guided-result is-wrong">Этот вариант не сходится с уже известными фактами.</div>':''}<div class="guided-choice-list">${deduction.choices.map(c=>`<button class="guided-choice" data-deduction-choice="${esc(c.id)}">${esc(c.label)}</button>`).join('')}</div></div></article>`;
  stage.querySelectorAll('[data-deduction-choice]').forEach(btn=>btn.onclick=()=>answerDeduction(deduction.id,btn.dataset.deductionChoice));
  updateChrome('Выберите версию. Вывод остаётся за вами.');
}
async function answerDeduction(id,choiceId){
  if(busy)return;setBusy(true);renderWait('Проверяем вашу версию...');
  try{const before=payload?.characters||[];const body=await serverAction('ATTEMPT_DEDUCTION',{deduction_id:id,choice_id:choiceId},true);collectChangedCharacters(before,body.characters||[]);const deduction=(body.deductions||[]).find(d=>d.id===id);if(deduction?.result==='confirmed'){resultScene={title:deduction.title||'Вывод подтверждён',text:'Да. Этот вывод согласуется с фактами.'};renderResultScene()}else renderDeduction(deduction||{id,choices:[]},true)}catch(err){renderFailure(err)}finally{setBusy(false)}
}
function renderResultScene(){
  const scene=resultScene;
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Установлено</p><h2>${esc(scene.title)}</h2><div class="guided-result">${esc(scene.text)}</div><div class="guided-actions"><button class="guided-action" data-result-continue>Дальше</button></div></div></article>`;
  $('[data-result-continue]',stage).onclick=()=>{resultScene=null;advance().catch(renderFailure)};updateChrome('Один фрагмент картины установлен.');
}
function nextEvidence(){const items=payload?.evidence||[];for(const id of evidenceOrder){const item=items.find(e=>e.id===id);if(item?.unlocked&&item.accessible&&!item.opened)return item}return items.find(e=>e.unlocked&&e.accessible&&!e.opened)||null}
function nextInteraction(){return (payload?.interactions||[]).find(i=>i.accessible&&!i.triggered)}
function renderInteraction(interaction){
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Пора потребовать объяснение</p><h2>${esc(interaction.label||'Разговор')}</h2><p class="guided-lead">Фактов уже достаточно, чтобы задать прямой вопрос.</p><div class="guided-actions"><button class="guided-action" data-trigger-interaction>Поговорить</button></div></div></article>`;
  $('[data-trigger-interaction]',stage).onclick=()=>triggerInteraction(interaction.id);updateChrome('Теперь нужен разговор.');
}
async function triggerInteraction(id){if(busy)return;setBusy(true);renderWait('Начинаем разговор...');try{const before=payload?.characters||[];const body=await serverAction('TRIGGER_INTERACTION',{interaction_id:id},true);collectChangedCharacters(before,body.characters||[]);await advance()}catch(err){renderFailure(err)}finally{setBusy(false)}}
function renderReconstruction(){
  const fields=payload?.reconstruction?.fields||[];
  if(!fields.length){renderFailure(new Error('Финальная версия пока недоступна.'));return}
  if(reconstructionIndex>=fields.length){submitReconstruction().catch(renderFailure);return}
  const field=fields[reconstructionIndex];
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Финал ${reconstructionIndex+1} из ${fields.length}</p><h2>${esc(field.prompt)}</h2><div class="guided-choice-list">${field.options.map(o=>`<button class="guided-choice" data-recon-choice="${esc(o.id)}">${esc(o.label)}</button>`).join('')}</div></div></article>`;
  stage.querySelectorAll('[data-recon-choice]').forEach(btn=>btn.onclick=()=>{reconstructionAnswers[field.id]=btn.dataset.reconChoice;reconstructionIndex+=1;renderReconstruction()});updateChrome('Собираем финальную картину по одному вопросу.');
}
async function submitReconstruction(){
  setBusy(true);renderWait('Проверяем финальную версию...');
  try{const body=await serverAction('SUBMIT_RECONSTRUCTION',{answers:reconstructionAnswers},true);if(body.session?.completed){payload=body;renderCompleted();return}reconstructionAnswers={};reconstructionIndex=0;resultScene={title:'Где-то есть ошибка',text:'Один или несколько ответов не сходятся с фактами. Попробуем собрать финальную картину ещё раз.'};renderResultScene()}catch(err){renderFailure(err)}finally{setBusy(false)}
}
function renderCompleted(){stage.innerHTML='<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Расследование завершено</p><h2>Картина восстановлена</h2><p class="guided-lead">Вы разобрались, что произошло этой ночью.</p></div></article>';updateChrome('Дело раскрыто.')}
async function advance(){
  if(resultScene){renderResultScene();return}if(reactionQueue.length){renderReaction(reactionQueue[0]);return}if(payload?.session?.completed){renderCompleted();return}
  const deduction=nextDeduction();if(deduction){renderDeduction(deduction,deduction.result==='contradicted'||deduction.result==='insufficient');return}
  const evidence=nextEvidence();if(evidence){await openEvidence(evidence);return}
  const interaction=nextInteraction();if(interaction){renderInteraction(interaction);return}
  if(payload?.reconstruction?.accessible){renderReconstruction();return}
  stage.innerHTML='<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Ваш ход</p><h2>Все доступные сейчас факты изучены</h2><p class="guided-lead">Если расследование не двигается, вернитесь к найденным материалам. Возможно, одну из улик стоит предъявить конкретному человеку или уточнить его версию на допросе.</p><div class="guided-actions"><button class="guided-action secondary" data-review-evidence>Открыть найденные улики</button><button class="guided-action" data-sync>Обновить состояние</button></div></div></article>';
  $('[data-review-evidence]',stage).onclick=()=>{renderNotes();notesDialog.showModal()};
  $('[data-sync]',stage).onclick=async()=>{try{await serverAction('SNAPSHOT');await advance()}catch(err){renderFailure(err)}};
}
function renderNotes(){
  const opened=(payload?.evidence||[]).filter(e=>e.opened&&e.title);
  const confirmed=(payload?.deductions||[]).filter(d=>d.result==='confirmed'&&d.title);
  notesContent.innerHTML=`<section class="guided-note-section"><h3>Что найдено</h3>${opened.length?`<ul>${opened.map(e=>`<li class="guided-note-evidence"><span>${esc(e.title)}</span><button type="button" class="guided-note-present" data-note-present="${esc(e.id)}">Предъявить</button></li>`).join('')}</ul>`:'<p>Пока ничего.</p>'}</section><section class="guided-note-section"><h3>Что установлено</h3>${confirmed.length?`<ul>${confirmed.map(d=>`<li>${esc(d.title)}</li>`).join('')}</ul>`:'<p>Пока окончательных выводов нет.</p>'}</section>`;
  notesContent.querySelectorAll('[data-note-present]').forEach(btn=>btn.onclick=()=>openConfrontation(btn.dataset.notePresent));
}
function renderFailure(err){setBusy(false);stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Не получилось продолжить</p><h2>Связь с расследованием прервалась</h2><p class="guided-lead">${esc(err?.message||String(err))}</p><div class="guided-actions"><button class="guided-action" data-retry>Попробовать ещё раз</button></div></div></article>`;$('[data-retry]',stage).onclick=async()=>{payload=null;try{await ensureSession();await advance()}catch(e){renderFailure(e)}}}

$('[data-enter]')?.addEventListener('click',async()=>{
  if(busy)return;
  intro.hidden=true;game.hidden=false;updateChrome();renderWait('Открываем место происшествия...');
  try{await ensureSession();await advance()}catch(err){renderFailure(err)}
});
$('[data-notes]')?.addEventListener('click',()=>{renderNotes();notesDialog.showModal()});
$('[data-notes-close]')?.addEventListener('click',()=>notesDialog.close());
notesDialog?.addEventListener('click',(e)=>{if(e.target===notesDialog)notesDialog.close()});
primePreviewToken();
