const PREVIEW_AUTH_ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/solo-preview-auth';
const SOLO_ENDPOINT='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/solo-session-v2';
const TOKEN_KEY='mysterylogic:guided-preview-token:v1';
const SESSION_PREFIX='mysterylogic:solo-guided-session:';

const $=(s,r=document)=>r.querySelector(s);
const esc=(v)=>String(v??'').replace(/[&<>"']/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const clean=(v)=>String(v??'').trim();
const initials=(name)=>clean(name).split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';

const loading=$('[data-loading]');
const intro=$('[data-intro]');
const game=$('[data-game]');
const stage=$('[data-stage]');
const errorBox=$('[data-error]');
const statusBox=$('[data-status]');
const chapterBox=$('[data-chapter]');
const notesDialog=$('[data-notes-dialog]');
const notesContent=$('[data-notes-content]');

let previewToken='';
let caseId='';
let payload=null;
let busy=false;
let currentEvidenceId='';
let reactionQueue=[];
let shownReactions=new Set();
let resultScene=null;
let reconstructionAnswers={};
let reconstructionIndex=0;

const evidenceOrder=['E01','E02','E05','E06','E07','E08','E03','E04','E11','E12','E09','E10','E15','E16','E13','E14','E19','E20','E21','E17','E18','E22','E23','E24'];

function tokenFromFragment(){
  const raw=decodeURIComponent(String(location.hash||'').replace(/^#/,''));
  return raw.startsWith('MLPREVIEW-')?raw:'';
}
function readSavedToken(){try{return sessionStorage.getItem(TOKEN_KEY)||''}catch{return''}}
function saveToken(token){try{sessionStorage.setItem(TOKEN_KEY,token)}catch{}}
function sessionKey(){return `${SESSION_PREFIX}${caseId||'unknown'}`}
function readSession(){try{return localStorage.getItem(sessionKey())||''}catch{return''}}
function saveSession(token){try{if(token)localStorage.setItem(sessionKey(),token);else localStorage.removeItem(sessionKey())}catch{}}
function setBusy(on){busy=on;document.body.classList.toggle('is-busy',on);document.querySelectorAll('button').forEach(b=>b.disabled=on)}
function showError(message){errorBox.textContent=message||''}

async function authPreview(){
  previewToken=tokenFromFragment()||readSavedToken();
  if(!previewToken)throw new Error('Откройте расследование по персональной ссылке.');
  const response=await fetch(PREVIEW_AUTH_ENDPOINT,{headers:{authorization:`Bearer ${previewToken}`},cache:'no-store',credentials:'omit'});
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('Ссылка на закрытое расследование больше не действует.');
  caseId=clean(body.caseId);
  if(!caseId)throw new Error('Не удалось определить дело.');
  saveToken(previewToken);
  if(location.hash){try{history.replaceState(null,'',`${location.pathname}${location.search}`)}catch{}}
}

async function serverAction(action,extra={},silent=false){
  const headers={'content-type':'application/json',authorization:`Bearer ${previewToken}`};
  const sessionToken=readSession();
  const requestBody={action,case_id:caseId,...(sessionToken?{session_token:sessionToken}:{}),...extra};
  if(!silent)setBusy(true);
  try{
    let response=await fetch(SOLO_ENDPOINT,{method:'POST',headers,cache:'no-store',credentials:'omit',body:JSON.stringify(requestBody)});
    let body=await response.json().catch(()=>({}));
    if(!response.ok&&body?.error==='solo_session_not_found'&&action==='SNAPSHOT'){
      saveSession('');
      response=await fetch(SOLO_ENDPOINT,{method:'POST',headers,cache:'no-store',credentials:'omit',body:JSON.stringify({action:'START',case_id:caseId})});
      body=await response.json().catch(()=>({}));
    }
    if(!response.ok)throw new Error(body?.error==='access_denied'?'Доступ к делу не подтверждён.':`Не удалось продолжить расследование: ${body?.error||response.status}`);
    if(body.sessionToken)saveSession(body.sessionToken);
    payload=body;
    return body;
  }finally{
    if(!silent)setBusy(false);
  }
}

async function startSession(){
  await serverAction(readSession()?'SNAPSHOT':'START');
  loading.hidden=true;
  intro.hidden=false;
}

function chapterLabel(){
  const confirmed=(payload?.deductions||[]).filter(d=>d.result==='confirmed').length;
  if(payload?.session?.completed)return'Дело раскрыто';
  if(confirmed>=8)return'Финальная картина';
  if(confirmed>=5)return'Последние минуты';
  if(confirmed>=2)return'Проверяем показания';
  return'Что произошло';
}
function updateChrome(message=''){chapterBox.textContent=chapterLabel();statusBox.textContent=message||'Следуйте за фактами. Остальное система сделает сама.'}

function renderWait(text='Проверяем, что изменилось...'){
  stage.innerHTML=`<div class="guided-wait"><div class="guided-spinner"></div><p>${esc(text)}</p></div>`;
}

function evidenceById(id){return (payload?.evidence||[]).find(e=>e.id===id)}
function characterByNameInTitle(title=''){
  return (payload?.characters||[]).find(p=>String(title).includes(String(p.name).split(' ')[0]));
}

function renderEvidence(item){
  currentEvidenceId=item.id;
  const person=item.type==='statement'?characterByNameInTitle(item.title):null;
  const body=esc(item.body||'').replace(/\n/g,'<br>');
  const visual=['E01','E02'].includes(item.id)?'<div class="guided-card__image"></div>':'';
  stage.innerHTML=`<article class="guided-card">${visual}<div class="guided-card__body"><p class="guided-kicker">${esc(item.type==='statement'?'Показание':'Новый факт')}</p>${person?`<div class="guided-person"><div class="guided-avatar">${esc(initials(person.name))}</div><div><h3>${esc(person.name)}</h3><p class="guided-role">${esc(person.role||'')}</p><p class="guided-quote">${body}</p></div></div>`:`<h2>${esc(item.title||'Материал')}</h2>${item.teaser?`<p class="guided-lead">${esc(item.teaser)}</p>`:''}<div class="guided-body">${body}</div>`}<div class="guided-actions"><button class="guided-action" data-evidence-continue>Продолжить расследование</button></div></div></article>`;
  $('[data-evidence-continue]',stage).onclick=continueFromEvidence;
  updateChrome('Изучите факт. Ничего раскладывать по вкладкам не нужно.');
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
    const previous=(before||[]).find(p=>p.id===current.id);
    if(!previous)continue;
    if(Number(current.statementVersion||1)>Number(previous.statementVersion||1)){
      const key=`${current.id}:${current.statementVersion}`;
      if(!shownReactions.has(key)){
        shownReactions.add(key);
        reactionQueue.push(current);
      }
    }
  }
}

async function autoCheckReactions(evidenceId){
  const item=evidenceById(evidenceId);
  if(!item)return;
  const people=payload?.characters||[];
  for(const person of people){
    const fresh=evidenceById(evidenceId);
    if((fresh?.presentedTo||[]).includes(person.id))continue;
    const before=payload.characters||[];
    try{
      const body=await serverAction('PRESENT_EVIDENCE',{evidence_id:evidenceId,character_id:person.id},true);
      collectChangedCharacters(before,body.characters||[]);
    }catch{
      // Not every fact needs a reaction from every person. Ignore unavailable checks.
    }
  }
}

async function continueFromEvidence(){
  setBusy(true);
  renderWait();
  try{
    await autoCheckReactions(currentEvidenceId);
    currentEvidenceId='';
    await advance();
  }catch(err){renderFailure(err)}finally{setBusy(false)}
}

function renderReaction(person){
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Показания изменились</p><div class="guided-person"><div class="guided-avatar">${esc(initials(person.name))}</div><div><h3>${esc(person.name)}</h3><p class="guided-role">${esc(person.role||'')}</p><p class="guided-quote">${esc(person.statement||'')}</p></div></div><div class="guided-actions"><button class="guided-action" data-reaction-continue>Дальше</button></div></div></article>`;
  $('[data-reaction-continue]',stage).onclick=()=>{reactionQueue.shift();advance().catch(renderFailure)};
  updateChrome('Новый факт заставил человека уточнить свою версию.');
}

function nextDeduction(){
  return (payload?.deductions||[]).find(d=>d.accessible&&d.result!=='confirmed'&&Array.isArray(d.choices)&&d.choices.length);
}
function renderDeduction(deduction,wrong=false){
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Ваш вывод</p><h2>${esc(deduction.title||'Что следует из фактов?')}</h2><p class="guided-lead">${esc(deduction.prompt||'Какой вывод лучше всего согласуется с тем, что вы уже знаете?')}</p>${wrong?'<div class="guided-result is-wrong">Эта версия не сходится с уже установленными фактами. Попробуйте ещё раз.</div>':''}<div class="guided-choice-list">${deduction.choices.map(c=>`<button class="guided-choice" data-deduction-choice="${esc(c.id)}">${esc(c.label)}</button>`).join('')}</div></div></article>`;
  stage.querySelectorAll('[data-deduction-choice]').forEach(btn=>btn.onclick=()=>answerDeduction(deduction.id,btn.dataset.deductionChoice));
  updateChrome('Сейчас нужен только один вывод. Остальной интерфейс скрыт.');
}
async function answerDeduction(id,choiceId){
  setBusy(true);renderWait('Проверяем вашу версию...');
  try{
    const body=await serverAction('ATTEMPT_DEDUCTION',{deduction_id:id,choice_id:choiceId},true);
    const deduction=(body.deductions||[]).find(d=>d.id===id);
    if(deduction?.result==='confirmed'){
      resultScene={title:deduction.title||'Вывод подтверждён',text:'Этот вывод выдерживает проверку. Теперь можно двигаться дальше.'};
      renderResultScene();
    }else renderDeduction(deduction||{id,choices:[]},true);
  }catch(err){renderFailure(err)}finally{setBusy(false)}
}
function renderResultScene(){
  const scene=resultScene;
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Установлено</p><h2>${esc(scene.title)}</h2><div class="guided-result">${esc(scene.text)}</div><div class="guided-actions"><button class="guided-action" data-result-continue>Продолжить</button></div></div></article>`;
  $('[data-result-continue]',stage).onclick=()=>{resultScene=null;advance().catch(renderFailure)};
  updateChrome('Один фрагмент картины установлен.');
}

function nextEvidence(){
  const items=payload?.evidence||[];
  for(const id of evidenceOrder){
    const item=items.find(e=>e.id===id);
    if(item?.accessible&&!item.opened)return item;
  }
  return items.find(e=>e.accessible&&!e.opened)||null;
}
function nextInteraction(){return (payload?.interactions||[]).find(i=>i.accessible&&!i.triggered)}
function renderInteraction(interaction){
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Пора поговорить напрямую</p><h2>${esc(interaction.label||'Следующий разговор')}</h2><p class="guided-lead">Вы собрали достаточно фактов. Теперь можно потребовать объяснение.</p><div class="guided-actions"><button class="guided-action" data-trigger-interaction>Начать разговор</button></div></div></article>`;
  $('[data-trigger-interaction]',stage).onclick=()=>triggerInteraction(interaction.id);
  updateChrome('Следующий шаг понятен: разговор, а не работа с меню.');
}
async function triggerInteraction(id){
  setBusy(true);renderWait('Начинаем разговор...');
  try{
    const before=payload.characters||[];
    const body=await serverAction('TRIGGER_INTERACTION',{interaction_id:id},true);
    collectChangedCharacters(before,body.characters||[]);
    await advance();
  }catch(err){renderFailure(err)}finally{setBusy(false)}
}

function renderReconstruction(){
  const reconstruction=payload?.reconstruction;
  const fields=reconstruction?.fields||[];
  if(!fields.length){renderFailure(new Error('Финальная версия пока недоступна.'));return}
  if(reconstructionIndex>=fields.length){submitReconstruction().catch(renderFailure);return}
  const field=fields[reconstructionIndex];
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Финальная версия ${reconstructionIndex+1} из ${fields.length}</p><h2>${esc(field.prompt)}</h2><p class="guided-lead">Ответьте только на этот вопрос. Полную картину система соберёт сама.</p><div class="guided-choice-list">${field.options.map(o=>`<button class="guided-choice" data-recon-choice="${esc(o.id)}">${esc(o.label)}</button>`).join('')}</div></div></article>`;
  stage.querySelectorAll('[data-recon-choice]').forEach(btn=>btn.onclick=()=>{reconstructionAnswers[field.id]=btn.dataset.reconChoice;reconstructionIndex+=1;renderReconstruction()});
  updateChrome('Финал тоже идёт по одному вопросу, без большой формы.');
}
async function submitReconstruction(){
  setBusy(true);renderWait('Собираем вашу версию событий...');
  try{
    const body=await serverAction('SUBMIT_RECONSTRUCTION',{answers:reconstructionAnswers},true);
    if(body.session?.completed){payload=body;renderCompleted();return}
    reconstructionAnswers={};reconstructionIndex=0;
    resultScene={title:'В версии осталась ошибка',text:'Один или несколько ответов не сходятся с фактами. Пройдём финальную цепочку ещё раз.'};
    renderResultScene();
  }catch(err){renderFailure(err)}finally{setBusy(false)}
}

function renderCompleted(){
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Расследование завершено</p><h2>Картина восстановлена</h2><p class="guided-lead">Вы связали данные, показания и последние минуты Арсеньева в одну непротиворечивую версию.</p></div></article>`;
  updateChrome('Дело раскрыто.');
}

async function advance(){
  if(resultScene){renderResultScene();return}
  if(reactionQueue.length){renderReaction(reactionQueue[0]);return}
  if(payload?.session?.completed){renderCompleted();return}
  const deduction=nextDeduction();
  if(deduction){renderDeduction(deduction,deduction.result==='contradicted');return}
  const evidence=nextEvidence();
  if(evidence){await openEvidence(evidence);return}
  const interaction=nextInteraction();
  if(interaction){renderInteraction(interaction);return}
  if(payload?.reconstruction){renderReconstruction();return}
  stage.innerHTML='<div class="guided-wait"><p>Вы изучили всё, что сейчас доступно. Проверяем следующий шаг...</p></div>';
  updateChrome('Проверяем состояние расследования.');
}

function renderNotes(){
  const opened=(payload?.evidence||[]).filter(e=>e.opened&&e.title);
  const confirmed=(payload?.deductions||[]).filter(d=>d.result==='confirmed'&&d.title);
  const people=payload?.characters||[];
  notesContent.innerHTML=`<section class="guided-note-section"><h3>Изучено</h3>${opened.length?`<ul>${opened.map(e=>`<li>${esc(e.title)}</li>`).join('')}</ul>`:'<p>Пока ничего.</p>'}</section><section class="guided-note-section"><h3>Установлено</h3>${confirmed.length?`<ul>${confirmed.map(d=>`<li>${esc(d.title)}</li>`).join('')}</ul>`:'<p>Пока окончательных выводов нет.</p>'}</section><section class="guided-note-section"><h3>Последние показания</h3>${people.map(p=>`<p><strong>${esc(p.name)}:</strong> ${esc(p.statement||'')}</p>`).join('')}</section>`;
}

function renderFailure(err){
  setBusy(false);
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Что-то пошло не так</p><h2>Не удалось продолжить</h2><p class="guided-lead">${esc(err?.message||String(err))}</p><div class="guided-actions"><button class="guided-action" data-retry>Попробовать ещё раз</button></div></div></article>`;
  $('[data-retry]',stage).onclick=()=>advance().catch(renderFailure);
}

$('[data-enter]').addEventListener('click',async()=>{
  intro.hidden=true;game.hidden=false;updateChrome();
  try{await advance()}catch(err){renderFailure(err)}
});
$('[data-notes]').addEventListener('click',()=>{renderNotes();notesDialog.showModal()});
$('[data-notes-close]').addEventListener('click',()=>notesDialog.close());
notesDialog.addEventListener('click',(e)=>{if(e.target===notesDialog)notesDialog.close()});

(async()=>{
  try{
    showError('');
    await authPreview();
    await startSession();
  }catch(err){showError(err?.message||String(err))}
})();
