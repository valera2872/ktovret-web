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
function setBusy(on){busy=on;document.body.classList.toggle('is-busy',on);document.querySelectorAll('button').forEach(b=>b.disabled=Boolean(on))}
function showError(message){if(errorBox)errorBox.textContent=message||''}

async function timedFetch(url,init={},timeoutMs=12000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    return await fetch(url,{...init,signal:controller.signal});
  }catch(err){
    if(err?.name==='AbortError')throw new Error('Сервер не ответил. Попробуйте ещё раз.');
    throw err;
  }finally{clearTimeout(timer)}
}

async function authPreview(){
  previewToken=tokenFromFragment()||readSavedToken();
  if(!previewToken)throw new Error('Откройте расследование по персональной ссылке.');
  const response=await timedFetch(PREVIEW_AUTH_ENDPOINT,{headers:{authorization:`Bearer ${previewToken}`},cache:'no-store',credentials:'omit'},8000);
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('Ссылка на закрытое расследование больше не действует.');
  caseId=clean(body.caseId);
  if(!caseId)throw new Error('Не удалось определить дело.');
  saveToken(previewToken);
  if(location.hash){try{history.replaceState(null,'',`${location.pathname}${location.search}`)}catch{}}
}

function showIntro(){
  loading.hidden=true;
  game.hidden=true;
  intro.hidden=false;
}

function showBootFailure(err){
  loading.hidden=false;
  intro.hidden=true;
  game.hidden=true;
  loading.innerHTML=`<div class="guided-mark">ML</div><p>Не удалось открыть расследование.</p><div class="guided-error">${esc(err?.message||String(err))}</div><button class="guided-primary" data-boot-retry>Попробовать ещё раз</button>`;
  $('[data-boot-retry]',loading)?.addEventListener('click',()=>location.reload());
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
  }finally{
    if(!silent)setBusy(false);
  }
}

async function ensureSession(){
  if(payload)return payload;
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
function updateChrome(message=''){if(chapterBox)chapterBox.textContent=chapterLabel();if(statusBox)statusBox.textContent=message||'Идите по следу. Игра сама покажет следующий шаг.'}
function renderWait(text='Проверяем, что изменилось...'){stage.innerHTML=`<div class="guided-wait"><div class="guided-spinner"></div><p>${esc(text)}</p></div>`}
function evidenceById(id){return (payload?.evidence||[]).find(e=>e.id===id)}
function characterByNameInTitle(title=''){return (payload?.characters||[]).find(p=>String(title).includes(String(p.name).split(' ')[0]))}

function renderEvidence(item){
  currentEvidenceId=item.id;
  const person=item.type==='statement'?characterByNameInTitle(item.title):null;
  const body=esc(item.body||'').replace(/\n/g,'<br>');
  const visual=['E01','E02'].includes(item.id)?'<div class="guided-card__image"></div>':'';
  stage.innerHTML=`<article class="guided-card">${visual}<div class="guided-card__body"><p class="guided-kicker">${person?'Показание':'Вы нашли'}</p>${person?`<div class="guided-person"><div class="guided-avatar">${esc(initials(person.name))}</div><div><h3>${esc(person.name)}</h3><p class="guided-role">${esc(person.role||'')}</p><p class="guided-quote">${body}</p></div></div>`:`<h2>${esc(item.title||'Новый факт')}</h2>${item.teaser?`<p class="guided-lead">${esc(item.teaser)}</p>`:''}<div class="guided-body">${body}</div>`}<div class="guided-actions"><button class="guided-action" data-evidence-continue>Дальше</button></div></div></article>`;
  $('[data-evidence-continue]',stage).onclick=continueFromEvidence;
  updateChrome('Смотрите только на этот факт. Остальное появится само.');
}

async function openEvidence(item){
  renderWait('Открываем следующий след...');
  const body=await serverAction('OPEN_EVIDENCE',{evidence_id:item.id},true);
  const opened=(body.evidence||[]).find(e=>e.id===item.id);
  if(!opened?.opened)throw new Error('Материал не открылся.');
  renderEvidence(opened);
}

function collectChangedCharacters(before,after){
  for(const current of after||[]){
    const previous=(before||[]).find(p=>p.id===current.id);
    if(!previous)continue;
    if(Number(current.statementVersion||1)>Number(previous.statementVersion||1)){
      const key=`${current.id}:${current.statementVersion}`;
      if(!shownReactions.has(key)){shownReactions.add(key);reactionQueue.push(current)}
    }
  }
}

async function autoCheckReactions(evidenceId){
  for(const person of payload?.characters||[]){
    const fresh=evidenceById(evidenceId);
    if(!fresh?.opened||(fresh.presentedTo||[]).includes(person.id))continue;
    const before=payload.characters||[];
    try{
      const body=await serverAction('PRESENT_EVIDENCE',{evidence_id:evidenceId,character_id:person.id},true);
      collectChangedCharacters(before,body.characters||[]);
    }catch{}
  }
}

async function continueFromEvidence(){
  if(busy)return;
  setBusy(true);renderWait('Сопоставляем с показаниями...');
  try{await autoCheckReactions(currentEvidenceId);currentEvidenceId='';await advance()}catch(err){renderFailure(err)}finally{setBusy(false)}
}

function renderReaction(person){
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Новая реакция</p><div class="guided-person"><div class="guided-avatar">${esc(initials(person.name))}</div><div><h3>${esc(person.name)}</h3><p class="guided-role">${esc(person.role||'')}</p><p class="guided-quote">${esc(person.statement||'')}</p></div></div><div class="guided-actions"><button class="guided-action" data-reaction-continue>Продолжить</button></div></div></article>`;
  $('[data-reaction-continue]',stage).onclick=()=>{reactionQueue.shift();advance().catch(renderFailure)};
  updateChrome('Новый факт изменил показания.');
}

function nextDeduction(){return (payload?.deductions||[]).find(d=>d.accessible&&d.result!=='confirmed'&&Array.isArray(d.choices)&&d.choices.length)}
function renderDeduction(deduction,wrong=false){
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Что вы думаете?</p><h2>${esc(deduction.title||'Какой вывод следует из фактов?')}</h2><p class="guided-lead">${esc(deduction.prompt||'Какой вариант лучше всего объясняет то, что вы уже узнали?')}</p>${wrong?'<div class="guided-result is-wrong">Этот вариант не сходится с уже известными фактами.</div>':''}<div class="guided-choice-list">${deduction.choices.map(c=>`<button class="guided-choice" data-deduction-choice="${esc(c.id)}">${esc(c.label)}</button>`).join('')}</div></div></article>`;
  stage.querySelectorAll('[data-deduction-choice]').forEach(btn=>btn.onclick=()=>answerDeduction(deduction.id,btn.dataset.deductionChoice));
  updateChrome('Выберите версию. Никаких специальных действий не требуется.');
}

async function answerDeduction(id,choiceId){
  if(busy)return;
  setBusy(true);renderWait('Проверяем вашу версию...');
  try{
    const before=payload?.characters||[];
    const body=await serverAction('ATTEMPT_DEDUCTION',{deduction_id:id,choice_id:choiceId},true);
    collectChangedCharacters(before,body.characters||[]);
    const deduction=(body.deductions||[]).find(d=>d.id===id);
    if(deduction?.result==='confirmed'){
      resultScene={title:deduction.title||'Вывод подтверждён',text:'Да. Этот вывод согласуется с фактами.'};
      renderResultScene();
    }else renderDeduction(deduction||{id,choices:[]},true);
  }catch(err){renderFailure(err)}finally{setBusy(false)}
}

function renderResultScene(){
  const scene=resultScene;
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Установлено</p><h2>${esc(scene.title)}</h2><div class="guided-result">${esc(scene.text)}</div><div class="guided-actions"><button class="guided-action" data-result-continue>Дальше</button></div></div></article>`;
  $('[data-result-continue]',stage).onclick=()=>{resultScene=null;advance().catch(renderFailure)};
  updateChrome('Один фрагмент картины установлен.');
}

function nextEvidence(){
  const items=payload?.evidence||[];
  for(const id of evidenceOrder){const item=items.find(e=>e.id===id);if(item?.unlocked&&item.accessible&&!item.opened)return item}
  return items.find(e=>e.unlocked&&e.accessible&&!e.opened)||null;
}
function nextInteraction(){return (payload?.interactions||[]).find(i=>i.accessible&&!i.triggered)}
function renderInteraction(interaction){
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Пора потребовать объяснение</p><h2>${esc(interaction.label||'Разговор')}</h2><p class="guided-lead">Фактов уже достаточно, чтобы задать прямой вопрос.</p><div class="guided-actions"><button class="guided-action" data-trigger-interaction>Поговорить</button></div></div></article>`;
  $('[data-trigger-interaction]',stage).onclick=()=>triggerInteraction(interaction.id);
  updateChrome('Теперь нужен разговор.');
}
async function triggerInteraction(id){
  if(busy)return;
  setBusy(true);renderWait('Начинаем разговор...');
  try{const before=payload?.characters||[];const body=await serverAction('TRIGGER_INTERACTION',{interaction_id:id},true);collectChangedCharacters(before,body.characters||[]);await advance()}catch(err){renderFailure(err)}finally{setBusy(false)}
}

function renderReconstruction(){
  const fields=payload?.reconstruction?.fields||[];
  if(!fields.length){renderFailure(new Error('Финальная версия пока недоступна.'));return}
  if(reconstructionIndex>=fields.length){submitReconstruction().catch(renderFailure);return}
  const field=fields[reconstructionIndex];
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Финал ${reconstructionIndex+1} из ${fields.length}</p><h2>${esc(field.prompt)}</h2><div class="guided-choice-list">${field.options.map(o=>`<button class="guided-choice" data-recon-choice="${esc(o.id)}">${esc(o.label)}</button>`).join('')}</div></div></article>`;
  stage.querySelectorAll('[data-recon-choice]').forEach(btn=>btn.onclick=()=>{reconstructionAnswers[field.id]=btn.dataset.reconChoice;reconstructionIndex+=1;renderReconstruction()});
  updateChrome('Собираем финальную картину по одному вопросу.');
}
async function submitReconstruction(){
  setBusy(true);renderWait('Проверяем финальную версию...');
  try{
    const body=await serverAction('SUBMIT_RECONSTRUCTION',{answers:reconstructionAnswers},true);
    if(body.session?.completed){payload=body;renderCompleted();return}
    reconstructionAnswers={};reconstructionIndex=0;resultScene={title:'Где-то есть ошибка',text:'Один или несколько ответов не сходятся с фактами. Попробуем собрать финальную картину ещё раз.'};renderResultScene();
  }catch(err){renderFailure(err)}finally{setBusy(false)}
}

function renderCompleted(){
  stage.innerHTML='<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Расследование завершено</p><h2>Картина восстановлена</h2><p class="guided-lead">Вы разобрались, что произошло этой ночью.</p></div></article>';
  updateChrome('Дело раскрыто.');
}

async function advance(){
  if(resultScene){renderResultScene();return}
  if(reactionQueue.length){renderReaction(reactionQueue[0]);return}
  if(payload?.session?.completed){renderCompleted();return}
  const deduction=nextDeduction();if(deduction){renderDeduction(deduction,deduction.result==='contradicted'||deduction.result==='insufficient');return}
  const evidence=nextEvidence();if(evidence){await openEvidence(evidence);return}
  const interaction=nextInteraction();if(interaction){renderInteraction(interaction);return}
  if(payload?.reconstruction?.accessible){renderReconstruction();return}
  stage.innerHTML='<article class="guided-card"><div class="guided-card__body"><h2>Проверяем следующий шаг</h2><p class="guided-lead">Все доступные сейчас факты изучены. Обновите состояние дела.</p><div class="guided-actions"><button class="guided-action" data-sync>Продолжить</button></div></div></article>';
  $('[data-sync]',stage).onclick=async()=>{try{await serverAction('SNAPSHOT');await advance()}catch(err){renderFailure(err)}};
}

function renderNotes(){
  const opened=(payload?.evidence||[]).filter(e=>e.opened&&e.title);
  const confirmed=(payload?.deductions||[]).filter(d=>d.result==='confirmed'&&d.title);
  notesContent.innerHTML=`<section class="guided-note-section"><h3>Что найдено</h3>${opened.length?`<ul>${opened.map(e=>`<li>${esc(e.title)}</li>`).join('')}</ul>`:'<p>Пока ничего.</p>'}</section><section class="guided-note-section"><h3>Что установлено</h3>${confirmed.length?`<ul>${confirmed.map(d=>`<li>${esc(d.title)}</li>`).join('')}</ul>`:'<p>Пока окончательных выводов нет.</p>'}</section>`;
}

function renderFailure(err){
  setBusy(false);
  stage.innerHTML=`<article class="guided-card"><div class="guided-card__body"><p class="guided-kicker">Не получилось продолжить</p><h2>Связь с расследованием прервалась</h2><p class="guided-lead">${esc(err?.message||String(err))}</p><div class="guided-actions"><button class="guided-action" data-retry>Попробовать ещё раз</button></div></div></article>`;
  $('[data-retry]',stage).onclick=async()=>{payload=null;try{await ensureSession();await advance()}catch(e){renderFailure(e)}};
}

$('[data-enter]')?.addEventListener('click',async()=>{
  if(busy)return;
  intro.hidden=true;game.hidden=false;updateChrome();renderWait('Открываем место происшествия...');
  try{await ensureSession();await advance()}catch(err){renderFailure(err)}
});
$('[data-notes]')?.addEventListener('click',()=>{renderNotes();notesDialog.showModal()});
$('[data-notes-close]')?.addEventListener('click',()=>notesDialog.close());
notesDialog?.addEventListener('click',(e)=>{if(e.target===notesDialog)notesDialog.close()});

(async()=>{
  try{showError('');await authPreview();showIntro()}catch(err){showBootFailure(err)}
})();
