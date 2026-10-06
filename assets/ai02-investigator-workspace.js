(()=>{'use strict';

const FAMILY='AI02-NK';
const params=new URL(location.href).searchParams;
const caseId=params.get('case')||'AI02-NK-STANDARD';
if(!caseId.startsWith(FAMILY))return;

const STORE={
  links:'mysterylogic:ai02:investigator-links',
  hypotheses:'mysterylogic:ai02:hypotheses'
};
const DIFFICULTY={
  'AI02-NK-EASY':{
    label:'Наблюдатель',short:'Легче',
    copy:'Мягче сопротивление на допросе. Для признания нужно меньше доказательного давления, но одного обвинения всё равно недостаточно.'
  },
  'AI02-NK-STANDARD':{
    label:'Следователь',short:'Рекомендуемый',
    copy:'Сбалансированный режим. Нужна существенная цепочка улик, прямое обвинение и объяснение ключевого механизма.'
  },
  'AI02-NK-HARD':{
    label:'Эксперт',short:'Максимум',
    copy:'Максимальное сопротивление. Признание требует почти полной доказательной позиции и связной реконструкции без очевидных пробелов.'
  }
};
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch{return fallback}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};

function visibleEvidence(){
  return qsa('[data-evidence-list] .aid-evidence-card').map(card=>({
    id:card.dataset.evidence||'',
    code:qs('small',card)?.textContent?.trim()||'',
    title:qs('strong',card)?.textContent?.trim()||'Материал',
    body:qs('p',card)?.textContent?.trim()||''
  })).filter(x=>x.id);
}
function visibleNotes(){
  return qsa('[data-notes] .aid-note').map((node,i)=>({
    id:'note-'+i,
    source:qs('small',node)?.textContent?.trim()||'Показание',
    text:[...node.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join(' ').trim()||node.textContent.trim()
  }));
}
function classifyEvidence(item){
  const t=(item.code+' '+item.title+' '+item.body).toLowerCase();
  if(/камера|лог|журнал|сервер|auth|access|qc|sha|телефон|сообщ/.test(t))return {type:'Факт',source:'Цифровой источник',reliability:'высокая'};
  if(/судмед|кров|удар|травм|эксперт|осмотр/.test(t))return {type:'Факт',source:'Экспертиза',reliability:'высокая'};
  if(/говор|слыш|видел|утвержд|показан/.test(t))return {type:'Показание',source:'Свидетель',reliability:'проверить'};
  return {type:'Факт',source:'Материалы дела',reliability:'рабочая'};
}
function timeFrom(text){
  const m=String(text).match(/(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?/);
  return m?m[0]:'';
}
function caseVariantUrl(id){
  const u=new URL(location.href);u.searchParams.set('case',id);u.searchParams.delete('preview');return u.href;
}

let selectedDifficulty=caseId;

function caseVariantStartUrl(id){
  const u=new URL(location.href);
  u.searchParams.set('case',id);
  u.searchParams.set('autostart','1');
  u.searchParams.delete('preview');
  return u.href;
}
function renderDifficultySelection(box){
  const selected=DIFFICULTY[selectedDifficulty]||DIFFICULTY[caseId]||DIFFICULTY['AI02-NK-STANDARD'];
  qsa('[data-difficulty-case]',box).forEach(btn=>btn.classList.toggle('is-active',btn.dataset.difficultyCase===selectedDifficulty));
  const copy=qs('[data-ai02-difficulty-copy]',box);if(copy)copy.textContent=selected.copy;
  const start=qs('[data-action="start"]');if(start)start.textContent='Начать расследование · '+selected.label;
}
function injectDifficulty(){
  const intro=qs('[data-view="intro"]');
  const host=qs('.aid-intro-copy',intro||document);
  const start=qs('[data-action="start"]',intro||document);
  if(!intro||!host||!start)return;
  intro.classList.add('ai02-prestart');
  let box=qs('[data-ai02-difficulty]');
  if(!box){
    box=document.createElement('section');
    box.className='ai02-prestart-difficulty';
    box.dataset.ai02Difficulty='';
    box.innerHTML='<div class="ai02-prestart-difficulty-head"><span class="aid-kicker">До начала расследования</span><h2>Выберите уровень сложности</h2><p>Канон, виновный и набор фактов одинаковы. Меняется сопротивление подозреваемых и порог, после которого виновный готов признаться.</p></div><div class="ai02-prestart-difficulty-grid">'+Object.entries(DIFFICULTY).map(([id,d])=>'<button type="button" data-difficulty-case="'+id+'"><span>'+esc(d.short)+'</span><strong>'+esc(d.label)+'</strong><small>'+esc(d.copy)+'</small></button>').join('')+'</div><div class="ai02-prestart-difficulty-summary"><b>Выбран режим:</b> <span>'+esc((DIFFICULTY[caseId]||DIFFICULTY['AI02-NK-STANDARD']).label)+'</span><p data-ai02-difficulty-copy></p></div>';
    start.before(box);
    qsa('[data-difficulty-case]',box).forEach(btn=>btn.addEventListener('click',()=>{
      const id=btn.dataset.difficultyCase;
      if(!DIFFICULTY[id])return;
      selectedDifficulty=id;
      const summary=qs('.ai02-prestart-difficulty-summary span',box);if(summary)summary.textContent=DIFFICULTY[id].label;
      renderDifficultySelection(box);
    }));
    start.addEventListener('click',event=>{
      if(selectedDifficulty===caseId)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      location.href=caseVariantStartUrl(selectedDifficulty);
    },true);
  }else if(box.parentElement!==host){
    start.before(box);
  }
  selectedDifficulty=DIFFICULTY[caseId]?caseId:'AI02-NK-STANDARD';
  const summary=qs('.ai02-prestart-difficulty-summary span',box);if(summary)summary.textContent=DIFFICULTY[selectedDifficulty].label;
  renderDifficultySelection(box);
}
function setupAutoStart(){
  if(params.get('autostart')!=='1'||params.get('preview'))return;
  const intro=qs('[data-view="intro"]');
  const start=qs('[data-action="start"]');
  if(!intro||!start)return;
  let fired=false;
  const run=()=>{
    if(fired||intro.hidden)return;
    fired=true;
    const u=new URL(location.href);u.searchParams.delete('autostart');history.replaceState(null,'',u);
    queueMicrotask(()=>start.click());
  };
  const mo=new MutationObserver(run);mo.observe(intro,{attributes:true,attributeFilter:['hidden']});
  window.setTimeout(run,0);
}
function injectInvestigationTabs(){
  const tools=qs('[data-investigation-tools]');if(!tools||qs('[data-ai02-investigation-tabs]'))return;
  const tabs=document.createElement('div');tabs.className='ai02-investigator-tabs';tabs.dataset.ai02InvestigationTabs='';
  tabs.innerHTML='<button type="button" class="is-active" data-ai02-subview="scene">Место</button><button type="button" data-ai02-subview="timeline">Хронология</button><button type="button" data-ai02-subview="board">Доска расследования</button>';
  tools.prepend(tabs);
  const timeline=document.createElement('section');timeline.className='ai02-subview ai02-timeline';timeline.dataset.ai02Panel='timeline';timeline.hidden=true;
  timeline.innerHTML='<div class="ai02-subview-head"><div><span class="aid-kicker">Хронология</span><h2>Что происходило по времени</h2></div><small>Показываются только уже открытые факты</small></div><div data-ai02-timeline-list></div>';
  const board=document.createElement('section');board.className='ai02-subview ai02-board';board.dataset.ai02Panel='board';board.hidden=true;
  board.innerHTML='<div class="ai02-subview-head"><div><span class="aid-kicker">Рабочая доска</span><h2>Связи, версии, противоречия</h2></div><small>Связи создаёт следователь, не система</small></div><div class="ai02-board-grid"><div><h3>Фигуранты</h3><div data-ai02-board-suspects></div></div><div><h3>Открытые материалы</h3><div data-ai02-board-evidence></div></div><div><h3>Мои связи</h3><div data-ai02-board-links></div></div></div><div class="ai02-link-builder"><select data-ai02-link-a></select><span>↔</span><select data-ai02-link-b></select><input data-ai02-link-label maxlength="120" placeholder="Что именно здесь противоречит или связано?"><button type="button" data-ai02-add-link>Связать факты</button></div>';
  tools.append(timeline,board);
  qsa('[data-ai02-subview]',tabs).forEach(btn=>btn.addEventListener('click',()=>setSubview(btn.dataset.ai02Subview||'scene')));
}
function setSubview(name){
  qsa('[data-ai02-subview]').forEach(b=>b.classList.toggle('is-active',b.dataset.ai02Subview===name));
  const scene=qs('.aid-scene-photo'),head=qs('.aid-investigation-head'),form=qs('[data-investigation-form]'),result=qs('[data-investigation-result]');
  const timeline=qs('[data-ai02-panel="timeline"]'),board=qs('[data-ai02-panel="board"]');
  const sceneOn=name==='scene';
  [scene,head,form,result].forEach(n=>{if(n)n.hidden=!sceneOn});
  if(timeline)timeline.hidden=name!=='timeline';
  if(board)board.hidden=name!=='board';
  if(name==='timeline')renderTimeline();
  if(name==='board')renderBoard();
}

function injectSceneHotspots(){
  const fig=qs('.aid-scene-photo');if(!fig||qs('[data-ai02-hotspots]',fig))return;
  const layer=document.createElement('div');layer.className='ai02-hotspots';layer.dataset.ai02Hotspots='';
  const hot=[
    ['door','Доступ','Проверь входы и выходы, камеры и журнал доступа в Студию 3 в критический период.'],
    ['console','Консоль','Проверь рабочую станцию Studio 3: какие действия и системные события зарегистрированы в критический период?'],
    ['audio','Аудио','Проверь аудиоматериалы, связанные со Студией 3: какие записи существовали и когда появились?'],
    ['desk','Стол','Осмотри рабочий стол и предметы на нём: есть ли следы, связанные с нападением?'],
    ['camera','Камеры','Проверь камеры и выходы из зоны Студии 3 в критический период.']
  ];
  layer.innerHTML=hot.map(([key,label,q])=>'<button type="button" class="is-'+key+'" data-scene-query="'+esc(q)+'"><span></span><strong>'+label+'</strong></button>').join('');
  fig.append(layer);
  qsa('[data-scene-query]',layer).forEach(btn=>btn.addEventListener('click',()=>{
    const ta=qs('[data-investigation-form] textarea');if(!ta)return;
    ta.value=btn.dataset.sceneQuery||'';ta.dispatchEvent(new Event('input',{bubbles:true}));qs('[data-investigation-form]')?.requestSubmit();
  }));
}

function decorateEvidence(){
  visibleEvidence().forEach(item=>{
    const card=qs('[data-evidence="'+CSS.escape(item.id)+'"]');if(!card||qs('.ai02-evidence-meta',card))return;
    const meta=classifyEvidence(item),time=timeFrom(item.body+' '+item.code);
    const row=document.createElement('div');row.className='ai02-evidence-meta';
    row.innerHTML='<span>'+esc(meta.type)+'</span><span>'+esc(meta.source)+'</span>'+(time?'<span>'+esc(time)+'</span>':'');
    card.append(row);
  });
}
function renderTimeline(){
  const host=qs('[data-ai02-timeline-list]');if(!host)return;
  const events=[];
  visibleEvidence().forEach(item=>{const time=timeFrom(item.body+' '+item.code);if(time)events.push({time,title:item.title,body:item.body,type:classifyEvidence(item).type})});
  visibleNotes().forEach(note=>{const time=timeFrom(note.text);if(time)events.push({time,title:note.source,body:note.text,type:'Показание'})});
  events.sort((a,b)=>a.time.localeCompare(b.time));
  host.innerHTML=events.length?'<div class="ai02-timeline-track">'+events.map(e=>'<article><time>'+esc(e.time)+'</time><div><span>'+esc(e.type)+'</span><strong>'+esc(e.title)+'</strong><p>'+esc(e.body)+'</p></div></article>').join('')+'</div>':'<p class="aid-empty-note">Пока нет открытых материалов с точным временем. Продолжайте расследование.</p>';
}

function allBoardItems(){
  const suspects=qsa('[data-suspect]').map(b=>({id:'suspect:'+b.dataset.suspect,label:qs('strong',b)?.textContent?.trim()||b.dataset.suspect,type:'Фигурант'}));
  const evidence=visibleEvidence().map(e=>({id:'evidence:'+e.id,label:e.title,type:classifyEvidence(e).type}));
  return [...suspects,...evidence];
}
function renderBoard(){
  const suspects=qs('[data-ai02-board-suspects]'),evid=qs('[data-ai02-board-evidence]'),linksHost=qs('[data-ai02-board-links]');
  if(!suspects||!evid||!linksHost)return;
  const items=allBoardItems(),ev=visibleEvidence(),links=load(STORE.links,[]);
  suspects.innerHTML=items.filter(x=>x.id.startsWith('suspect:')).map(x=>'<span class="ai02-board-node is-person">'+esc(x.label)+'</span>').join('');
  evid.innerHTML=ev.map(x=>'<span class="ai02-board-node"><small>'+esc(classifyEvidence(x).type)+'</small>'+esc(x.title)+'</span>').join('')||'<p class="aid-empty-note">Материалы ещё не собраны.</p>';
  linksHost.innerHTML=links.length?links.map((l,i)=>'<article><span>Связь '+(i+1)+'</span><strong>'+esc(l.aLabel)+' ↔ '+esc(l.bLabel)+'</strong><p>'+esc(l.label||'Связь отмечена следователем')+'</p><button type="button" data-remove-link="'+i+'">Удалить</button></article>').join(''):'<p class="aid-empty-note">Отметьте две открытые позиции и сформулируйте связь самостоятельно.</p>';
  const a=qs('[data-ai02-link-a]'),b=qs('[data-ai02-link-b]');const opts=items.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.type+' · '+x.label)+'</option>').join('');
  if(a)a.innerHTML='<option value="">Первый факт…</option>'+opts;if(b)b.innerHTML='<option value="">Второй факт…</option>'+opts;
  qsa('[data-remove-link]',linksHost).forEach(btn=>btn.addEventListener('click',()=>{const arr=load(STORE.links,[]);arr.splice(Number(btn.dataset.removeLink),1);save(STORE.links,arr);renderBoard();renderNotebook()}));
}
function setupBoard(){
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-ai02-add-link]');if(!btn)return;
    const a=qs('[data-ai02-link-a]')?.value,b=qs('[data-ai02-link-b]')?.value,label=qs('[data-ai02-link-label]')?.value?.trim()||'';
    if(!a||!b||a===b)return;
    const items=allBoardItems(),find=id=>items.find(x=>x.id===id)?.label||id;
    const links=load(STORE.links,[]);links.push({a,b,aLabel:find(a),bLabel:find(b),label});save(STORE.links,links);
    const input=qs('[data-ai02-link-label]');if(input)input.value='';renderBoard();renderNotebook();
  });
}

function injectMobileEvidenceDrawer(){
  const interrogation=qs('.aid-interrogation'),composer=qs('[data-composer]');
  if(!interrogation||!composer||qs('[data-ai02-mobile-evidence]',interrogation))return;
  const trigger=document.createElement('button');
  trigger.type='button';trigger.className='ai02-mobile-evidence-trigger';trigger.dataset.ai02MobileEvidenceTrigger='';
  trigger.innerHTML='<span>Материалы</span><strong data-ai02-mobile-evidence-count>0</strong>';
  const drawer=document.createElement('section');
  drawer.className='ai02-mobile-evidence-drawer';drawer.dataset.ai02MobileEvidence='';drawer.hidden=true;
  drawer.innerHTML='<div class="ai02-mobile-evidence-head"><div><span class="aid-kicker">Материалы дела</span><strong>Что предъявить?</strong></div><button type="button" data-ai02-mobile-evidence-close aria-label="Закрыть">×</button></div><div data-ai02-mobile-evidence-list></div>';
  composer.before(trigger,drawer);
  const close=()=>{drawer.hidden=true;trigger.setAttribute('aria-expanded','false')};
  const open=()=>{renderMobileEvidenceDrawer();drawer.hidden=false;trigger.setAttribute('aria-expanded','true')};
  trigger.setAttribute('aria-expanded','false');
  trigger.addEventListener('click',()=>drawer.hidden?open():close());
  qs('[data-ai02-mobile-evidence-close]',drawer)?.addEventListener('click',close);
  drawer.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-ai02-mobile-evidence-id]');if(!btn)return;
    const id=btn.dataset.ai02MobileEvidenceId||'';
    const original=id?qs('[data-evidence="'+CSS.escape(id)+'"]'):null;
    if(original)original.click();
    close();
    const ta=qs('#aiv2-question');if(ta){ta.focus();ta.scrollIntoView({block:'nearest',behavior:'smooth'})}
  });
}
function renderMobileEvidenceDrawer(){
  const drawer=qs('[data-ai02-mobile-evidence]'),host=qs('[data-ai02-mobile-evidence-list]'),count=qs('[data-ai02-mobile-evidence-count]');
  const items=visibleEvidence();
  if(count)count.textContent=String(items.length);
  if(!drawer||!host)return;
  host.innerHTML=items.length?items.map(item=>'<button type="button" data-ai02-mobile-evidence-id="'+esc(item.id)+'"><small>'+esc(item.code)+'</small><strong>'+esc(item.title)+'</strong><span>'+esc(item.body.slice(0,140))+(item.body.length>140?'…':'')+'</span></button>').join(''):'<p class="aid-empty-note">Материалы ещё не собраны.</p>';
}

function injectInterrogationActions(){
  const composer=qs('[data-composer]');if(!composer||qs('[data-ai02-interrogation-actions]',composer))return;
  const bar=document.createElement('div');bar.className='ai02-interrogation-actions';bar.dataset.ai02InterrogationActions='';
  bar.innerHTML='<button type="button" data-ai02-question-mode="clarify">Уточнить</button><button type="button" data-ai02-question-mode="evidence">Предъявить улику</button><button type="button" data-ai02-question-mode="contradiction">Прижать противоречием</button>';
  composer.prepend(bar);
  qsa('[data-ai02-question-mode]',bar).forEach(btn=>btn.addEventListener('click',()=>{
    const ta=qs('#aiv2-question');if(!ta)return;
    const mode=btn.dataset.ai02QuestionMode;
    if(mode==='clarify')ta.value='Уточните, пожалуйста: ';
    if(mode==='evidence')ta.value='Я предъявляю вам этот материал. Как вы его объясните? ';
    if(mode==='contradiction')ta.value='В вашей версии есть противоречие с установленными фактами. Объясните его: ';
    ta.focus();
  }));
  const history=document.createElement('section');history.className='ai02-statement-history';history.dataset.ai02StatementHistory='';
  const transcript=qs('[data-transcript]');transcript?.before(history);
}
function renderStatementHistory(){
  const host=qs('[data-ai02-statement-history]');if(!host)return;
  const person=qs('[data-suspect-name]')?.textContent?.trim()||'Фигурант';
  const replies=qsa('[data-transcript] .aid-message.is-suspect').slice(-3).map(x=>x.textContent.trim()).filter(Boolean);
  const stage=qs('[data-room-status]')?.textContent?.trim()||'Допрос идёт';
  host.innerHTML='<div><span class="aid-kicker">Протокол показаний</span><strong>'+esc(person)+'</strong><small>'+esc(stage)+'</small></div><ol>'+(replies.length?replies.map(x=>'<li>'+esc(x.slice(0,180))+'</li>').join(''):'<li>Пока только исходная версия. Уточняйте детали и возвращайтесь к спорным местам.</li>')+'</ol>';
}

function injectNotebook(){
  const panel=qs('.aid-notes-panel');if(!panel||qs('[data-ai02-notebook-body]'))return;
  const tabs=qs('.ai02-note-tabs');if(!tabs)return;
  tabs.innerHTML='<button type="button" class="is-active" data-ai02-note-tab="notes">Заметки</button><button type="button" data-ai02-note-tab="hypotheses">Версии</button><button type="button" data-ai02-note-tab="links">Связи</button>';
  const original=qs('[data-notes]');const theory=qs('.aid-theory-box');
  const wrap=document.createElement('div');wrap.dataset.ai02NotebookBody='';
  original?.before(wrap);if(original)wrap.append(original);if(theory)wrap.append(theory);
  const hypotheses=document.createElement('div');hypotheses.className='ai02-hypotheses';hypotheses.dataset.ai02NotebookPanel='hypotheses';hypotheses.hidden=true;
  hypotheses.innerHTML='<form data-ai02-hypothesis-form><input name="title" maxlength="80" placeholder="Рабочая версия: кто / что произошло"><textarea name="for" rows="2" maxlength="260" placeholder="Что говорит в пользу версии"></textarea><textarea name="against" rows="2" maxlength="260" placeholder="Что ей противоречит / чего она не объясняет"></textarea><button type="submit">Добавить версию</button></form><div data-ai02-hypothesis-list></div>';
  const links=document.createElement('div');links.className='ai02-notebook-links';links.dataset.ai02NotebookPanel='links';links.hidden=true;
  wrap.append(hypotheses,links);
  qsa('[data-ai02-note-tab]',tabs).forEach(btn=>btn.addEventListener('click',()=>setNotebook(btn.dataset.ai02NoteTab||'notes')));
  qs('[data-ai02-hypothesis-form]')?.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const title=String(fd.get('title')||'').trim();if(!title)return;const list=load(STORE.hypotheses,[]);list.push({title,for:String(fd.get('for')||'').trim(),against:String(fd.get('against')||'').trim()});save(STORE.hypotheses,list);e.currentTarget.reset();renderNotebook()});
  renderNotebook();
}
function setNotebook(name){
  qsa('[data-ai02-note-tab]').forEach(b=>b.classList.toggle('is-active',b.dataset.ai02NoteTab===name));
  const notes=qs('[data-notes]'),theory=qs('.aid-theory-box'),hyp=qs('[data-ai02-notebook-panel="hypotheses"]'),links=qs('[data-ai02-notebook-panel="links"]');
  if(notes)notes.hidden=name!=='notes';if(theory)theory.hidden=name!=='notes';if(hyp)hyp.hidden=name!=='hypotheses';if(links)links.hidden=name!=='links';
  if(name!=='notes')renderNotebook();
}
function renderNotebook(){
  const list=load(STORE.hypotheses,[]),host=qs('[data-ai02-hypothesis-list]');
  if(host)host.innerHTML=list.length?list.map((h,i)=>'<article><span>Моя гипотеза</span><strong>'+esc(h.title)+'</strong>'+(h.for?'<p><b>За:</b> '+esc(h.for)+'</p>':'')+(h.against?'<p><b>Против:</b> '+esc(h.against)+'</p>':'')+'<button type="button" data-remove-hypothesis="'+i+'">Удалить</button></article>').join(''):'<p class="aid-empty-note">Создайте несколько конкурирующих версий и отмечайте, что каждая из них объясняет или не объясняет.</p>';
  const links=load(STORE.links,[]),linkHost=qs('[data-ai02-notebook-panel="links"]');
  if(linkHost)linkHost.innerHTML=links.length?links.map(l=>'<article><span>Моя связь</span><strong>'+esc(l.aLabel)+' ↔ '+esc(l.bLabel)+'</strong><p>'+esc(l.label||'Связь отмечена следователем')+'</p></article>').join(''):'<p class="aid-empty-note">Связи появятся после работы с доской расследования.</p>';
  qsa('[data-remove-hypothesis]').forEach(btn=>btn.addEventListener('click',()=>{const arr=load(STORE.hypotheses,[]);arr.splice(Number(btn.dataset.removeHypothesis),1);save(STORE.hypotheses,arr);renderNotebook()}));
}

function injectReconstruction(){
  const form=qs('[data-theory-form]');if(!form||qs('[data-ai02-reconstruction]',form))return;
  const reasonLabel=qsa('label',form).find(x=>x.querySelector('textarea[name="reason"]'));if(!reasonLabel)return;
  reasonLabel.classList.add('ai02-original-reason');reasonLabel.hidden=true;
  const box=document.createElement('section');box.className='ai02-reconstruction';box.dataset.ai02Reconstruction='';
  box.innerHTML='<div class="ai02-reconstruction-grid"><label><span>ПОЧЕМУ</span><textarea data-rec="why" rows="2" maxlength="260" placeholder="Мотив и причина конфликта"></textarea></label><label><span>КАК</span><textarea data-rec="how" rows="2" maxlength="260" placeholder="Механизм преступления"></textarea></label><label><span>КОГДА</span><textarea data-rec="when" rows="2" maxlength="220" placeholder="Временная последовательность"></textarea></label><label><span>КАК СКРЫВАЛ</span><textarea data-rec="cover" rows="2" maxlength="260" placeholder="Ложный след, инсценировка, ложь"></textarea></label></div><fieldset><legend>Опорные материалы — выберите 3–5 для своей реконструкции</legend><p class="ai02-reconstruction-help">Выбор помогает сформулировать версию. Сервер отдельно проверяет, какие материалы вы действительно открыли в расследовании.</p><div data-ai02-theory-evidence></div></fieldset><label><span>ЦЕПОЧКА</span><textarea data-rec="chain" rows="3" maxlength="420" placeholder="Как выбранные факты замыкаются в одну версию"></textarea></label>';
  reasonLabel.before(box);
  form.addEventListener('submit',()=>{
    const parts={};qsa('[data-rec]',box).forEach(x=>parts[x.dataset.rec]=x.value.trim());
    const chosen=qsa('[data-ai02-theory-evidence] input:checked').map(x=>x.dataset.title).filter(Boolean);
    const reason='Почему: '+(parts.why||'—')+'\nКак: '+(parts.how||'—')+'\nКогда: '+(parts.when||'—')+'\nКак скрывал: '+(parts.cover||'—')+'\nДоказательства: '+chosen.join('; ')+'\nЦепочка: '+(parts.chain||'—');
    const raw=qs('textarea[name="reason"]',form);if(raw)raw.value=reason;
  },true);
}
function renderTheoryEvidence(){
  injectReconstruction();const host=qs('[data-ai02-theory-evidence]');if(!host)return;
  const ev=visibleEvidence();
  host.innerHTML=ev.map(e=>'<label><input type="checkbox" data-title="'+esc(e.title)+'"><span><small>'+esc(classifyEvidence(e).type)+'</small>'+esc(e.title)+'</span></label>').join('')||'<p class="aid-empty-note">Сначала соберите материалы дела.</p>';
  qsa('input',host).forEach(input=>input.addEventListener('change',()=>{const checked=qsa('input:checked',host);if(checked.length>5){input.checked=false}}));
}

function sync(){
  injectDifficulty();injectInvestigationTabs();injectSceneHotspots();injectInterrogationActions();injectMobileEvidenceDrawer();injectNotebook();decorateEvidence();renderStatementHistory();renderMobileEvidenceDrawer();
  if(!qs('[data-ai02-panel="timeline"]')?.hidden)renderTimeline();
  if(!qs('[data-ai02-panel="board"]')?.hidden)renderBoard();
}
function boot(){
  sync();setupBoard();injectReconstruction();setupAutoStart();
  const root=qs('[data-ai-v2-player]')||document.body;
  const mo=new MutationObserver(()=>{window.clearTimeout(boot._t);boot._t=window.setTimeout(sync,40)});
  mo.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-action="theory"],[data-open-theory]'))setTimeout(renderTheoryEvidence,0)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();