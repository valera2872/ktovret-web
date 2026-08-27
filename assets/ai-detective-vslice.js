(()=>{"use strict";
const root=document.querySelector('[data-ai-detective]');if(!root)return;
const API_URL='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-interrogation-v1';
const PUBLIC_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ya252dXdrbnZzZWRqZ3FjZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTY2MzcsImV4cCI6MjEwMTc3MjYzN30.68loNx8A71dodfOXXKs_-I235XVCmEioXGrg8kCZQr4';
const MAX_TURNS=14;
const STORAGE_KEY='ml_ai_demo_state_v2';
const INITIAL_EVIDENCE=['E01','E02','E03'];
const suspects=[
{id:'marina',name:'Марина Лебедева',role:'архивист фонда',opening:'После 21:25 я была во внутреннем дворике и разговаривала по телефону. В закрытый фонд больше не заходила.'},
{id:'anton',name:'Антон Руденко',role:'инженер безопасности',opening:'Камеру сервисного коридора перезапускал я. Это была плановая работа. В это время я находился в комнате контроля.'},
{id:'lev',name:'Лев Орлов',role:'исследователь',opening:'Я закончил работу около девяти двадцати и вышел. С архивом спорил, это правда, но после выхода не возвращался.'}
];
const evidence=[
{id:'E01',code:'ФОТО / 21:24',title:'Последняя фотофиксация',body:'В 21:24:36 письмо №12/1912 находится в папке C-12. В 21:36:08 при передаче фонда папка уже пуста.'},
{id:'E02',code:'ВИДЕО / 08:32',title:'Окно перезапуска камеры',body:'Камера служебного коридора не передавала сигнал с 21:27:10 до 21:35:42. Заявка на плановый перезапуск создана в 20:15.'},
{id:'E03',code:'ДОСТУП / 21:31:14',title:'Журнал двери фонда',body:'В 21:31:14 дверь открыта учётной записью E-14: карта и персональный PIN приняты с первой попытки. Других открытий с 21:24 до 21:36 нет.'},
{id:'E04',code:'РЕЕСТР / E-14',title:'Реестр доступа',body:'Учётная запись E-14 закреплена за Мариной Лебедевой. Для входа нужны её служебная карта и персональный PIN.'},
{id:'E05',code:'СЕТЬ / 21:34',title:'Сетевой лог телефона',body:'Телефон Марины оставался подключён к внутренней точке Archive-2 до 21:34:27. Контрольный замер подтверждает: во внутреннем дворике эта точка недоступна.'},
{id:'E06',code:'КОНТРОЛЬ / 21:28–21:35',title:'Проверка алиби Антона',body:'Камера комнаты контроля и локальный журнал консоли фиксируют Антона у рабочего места с 21:28 до 21:35.'},
{id:'E07',code:'ВЫХОД / 21:23–21:28',title:'Проверка алиби Льва',body:'Лев попал на камеру у уличного выхода в 21:23:41. В 21:27:58 его проездной отмечен на остановке в 510 метрах от архива.'}
];
function initialTranscript(){const out={};for(const s of suspects)out[s.id]=[{who:'suspect',text:s.opening,meta:'первичное объяснение'}];return out}
function loadSaved(){try{return JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null')}catch{return null}}
const saved=loadSaved();
const state={
  view:saved?.view||'intro',
  suspect:suspects.some(s=>s.id===saved?.suspect)?saved.suspect:'marina',
  attached:null,
  turns:Number.isInteger(saved?.turns)?Math.max(0,Math.min(saved.turns,MAX_TURNS)):0,
  transcripts:saved?.transcripts&&typeof saved.transcripts==='object'?saved.transcripts:initialTranscript(),
  notes:new Map(Array.isArray(saved?.notes)?saved.notes:[]),
  evidenceIds:new Set(Array.isArray(saved?.evidenceIds)?saved.evidenceIds:INITIAL_EVIDENCE),
  questionCounts:{marina:0,anton:0,lev:0,...(saved?.questionCounts||{})},
  busy:false,
  session:getSession()
};
for(const s of suspects){if(!Array.isArray(state.transcripts[s.id])||!state.transcripts[s.id].length)state.transcripts[s.id]=[{who:'suspect',text:s.opening,meta:'первичное объяснение'}]}
for(const id of INITIAL_EVIDENCE)state.evidenceIds.add(id);
const $=sel=>root.querySelector(sel);const views={intro:$('[data-view="intro"]'),workspace:$('[data-view="workspace"]'),theory:$('[data-view="theory"]')};
function getSession(){let v=sessionStorage.getItem('ml_ai_demo_session');if(!v){v=(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`).replace(/[^a-zA-Z0-9-]/g,'');sessionStorage.setItem('ml_ai_demo_session',v)}return v}
function saveState(){try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify({view:state.view,suspect:state.suspect,turns:state.turns,transcripts:state.transcripts,notes:[...state.notes.entries()],evidenceIds:[...state.evidenceIds],questionCounts:state.questionCounts}))}catch{}}
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function showView(name){state.view=name;Object.entries(views).forEach(([k,node])=>node.hidden=k!==name);saveState();window.scrollTo({top:0,behavior:'smooth'})}
function visibleEvidence(){return evidence.filter(e=>state.evidenceIds.has(e.id))}
function renderEvidence(){const list=$('[data-evidence-list]');list.innerHTML=visibleEvidence().map(e=>`<button class="aid-evidence-card${state.attached===e.id?' is-selected':''}" type="button" data-evidence="${e.id}"><small>${escapeHtml(e.code)}</small><strong>${escapeHtml(e.title)}</strong><p>${escapeHtml(e.body)}</p></button>`).join('');list.querySelectorAll('[data-evidence]').forEach(btn=>btn.addEventListener('click',()=>{state.attached=state.attached===btn.dataset.evidence?null:btn.dataset.evidence;renderEvidence();renderAttachment()}))}
function renderSuspects(){const strip=$('[data-suspect-strip]');strip.innerHTML=suspects.map(s=>`<button class="aid-suspect-tab${s.id===state.suspect?' is-active':''}" type="button" data-suspect="${s.id}"><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.role)}</small></button>`).join('');strip.querySelectorAll('[data-suspect]').forEach(btn=>btn.addEventListener('click',()=>selectSuspect(btn.dataset.suspect)))}
function selectSuspect(id){if(state.busy||!suspects.some(s=>s.id===id))return;state.suspect=id;state.attached=null;renderSuspects();renderAttachment();renderRoom();saveState()}
function renderRoom(){const s=suspects.find(x=>x.id===state.suspect);$('[data-suspect-name]').textContent=s.name;$('[data-suspect-role]').textContent=s.role;const tr=$('[data-transcript]');tr.innerHTML=state.transcripts[s.id].map(m=>`<div class="aid-message ${m.who==='player'?'is-player':'is-suspect'}"><div class="aid-message-meta"><span>${m.who==='player'?'Вы':escapeHtml(s.name)}</span><span>${escapeHtml(m.meta||'')}</span></div><div>${escapeHtml(m.text)}</div>${m.evidence?`<div class="aid-message-evidence">Материал: ${escapeHtml(m.evidence)}</div>`:''}</div>`).join('');tr.scrollTop=tr.scrollHeight;updateTurnCounter()}
function renderAttachment(){const box=$('[data-attachment]');const item=evidence.find(e=>e.id===state.attached&&state.evidenceIds.has(e.id));box.hidden=!item;if(item)$('[data-attachment-title]').textContent=item.title}
function renderNotes(){const el=$('[data-notes]');if(!state.notes.size){el.innerHTML='<p class="aid-empty-note">Пока ничего. Значимые сведения будут фиксироваться здесь, но вывод игра за вас не сделает.</p>';return}el.innerHTML=[...state.notes.values()].map(n=>`<div class="aid-note"><small>${escapeHtml(n.source||'зацепка')}</small>${escapeHtml(n.text)}</div>`).join('')}
function addNote(note){if(!note||!note.id||!note.text)return false;const fresh=!state.notes.has(note.id);state.notes.set(note.id,note);return fresh}
function addEvidence(id){const item=evidence.find(e=>e.id===id);if(!item||state.evidenceIds.has(id))return false;state.evidenceIds.add(id);addNote({id:`SYS-${id}`,source:'Новый материал',text:`Открыт материал «${item.title}».`});return true}
function updateTurnCounter(){const el=$('[data-turn-counter]');const exhausted=state.turns>=MAX_TURNS;el.textContent=exhausted?`${MAX_TURNS} / ${MAX_TURNS} · соберите версию`:`${state.turns} / ${MAX_TURNS} вопросов`;const send=$('.aid-send');send.disabled=state.busy||exhausted;$('#aid-question').disabled=state.busy||exhausted}
async function api(payload){const r=await fetch(API_URL,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${PUBLIC_ANON}`,'apikey':PUBLIC_ANON},body:JSON.stringify({...payload,session_id:state.session})});let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);return data}
function typing(on){state.busy=on;$('[data-room-status]').textContent=on?'Собеседник отвечает…':'Запись включена';updateTurnCounter();if(on){const tr=$('[data-transcript]');const d=document.createElement('div');d.className='aid-message is-suspect aid-typing';d.dataset.typing='1';d.textContent='…';tr.appendChild(d);tr.scrollTop=tr.scrollHeight}else{$('[data-typing]')?.remove()}}
async function submitQuestion(ev){ev.preventDefault();if(state.busy||state.turns>=MAX_TURNS)return;const field=$('#aid-question');const q=field.value.trim();if(q.length<2)return;const evd=evidence.find(e=>e.id===state.attached&&state.evidenceIds.has(e.id));const history=state.transcripts[state.suspect].slice(-8).map(m=>({role:m.who==='player'?'user':'assistant',text:m.text}));state.transcripts[state.suspect].push({who:'player',text:q,meta:'вопрос',evidence:evd?.title||''});state.turns++;state.questionCounts[state.suspect]=(state.questionCounts[state.suspect]||0)+1;field.value='';renderRoom();typing(true);try{const data=await api({action:'interrogate',suspect_id:state.suspect,question:q,evidence_id:evd?.id||'',history,discovered_note_ids:[...state.notes.keys()].filter(id=>!id.startsWith('SYS-')),discovered_evidence_ids:[...state.evidenceIds],question_counts:state.questionCounts});state.transcripts[state.suspect].push({who:'suspect',text:data.reply||'Мне нечего добавить.',meta:'ответ'});let changed=false;(data.notes||[]).forEach(n=>{if(addNote(n))changed=true});(data.unlocked_evidence_ids||[]).forEach(id=>{if(addEvidence(id))changed=true});if(changed){renderNotes();renderEvidence()}}catch(err){state.transcripts[state.suspect].push({who:'suspect',text:'Запись допроса временно недоступна. Попробуйте сформулировать вопрос ещё раз.',meta:'техническая пауза'});console.error(err)}finally{state.attached=null;typing(false);renderEvidence();renderAttachment();renderNotes();renderRoom();saveState()}}
function openTheory(){renderTheory();showView('theory')}
function renderTheory(){const wrap=$('[data-theory-suspects]');wrap.innerHTML=suspects.map((s,i)=>`<label class="aid-radio"><input type="radio" name="suspect" value="${s.id}" ${i===0?'required':''}><span><strong>${escapeHtml(s.name)}</strong> · ${escapeHtml(s.role)}</span></label>`).join('')}
async function submitTheory(ev){ev.preventDefault();if(state.busy)return;const form=ev.currentTarget;const fd=new FormData(form);const picked=fd.get('suspect');const reason=fd.get('reason')?.toString().trim()||'';if(!picked||reason.length<8)return;const btn=form.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Проверяем цепочку…';try{const data=await api({action:'check_theory',suspect_id:picked,reason,discovered_note_ids:[...state.notes.keys()].filter(id=>!id.startsWith('SYS-')),discovered_evidence_ids:[...state.evidenceIds],question_counts:state.questionCounts});const box=$('[data-verdict]');box.hidden=false;box.className=`aid-verdict ${data.correct?'is-correct':'is-wrong'}`;box.innerHTML=`<p class="aid-kicker">${data.correct?'Версия выдерживает проверку':'В версии остаётся разрыв'}</p><h3>${escapeHtml(data.title||'Результат')}</h3><p>${escapeHtml(data.explanation||'')}</p>${data.correct&&data.reveal?`<p><strong>Что установлено:</strong> ${escapeHtml(data.reveal)}</p>`:''}`;box.scrollIntoView({behavior:'smooth',block:'center'})}catch(err){const box=$('[data-verdict]');box.hidden=false;box.className='aid-verdict is-wrong';box.innerHTML='<h3>Проверка временно недоступна</h3><p>Ваши допросы сохранены в этой вкладке. Вернитесь к материалам и продолжайте расследование.</p>';console.error(err)}finally{btn.disabled=false;btn.textContent='Проверить версию';saveState()}}
$('[data-action="start"]').addEventListener('click',()=>{renderEvidence();renderSuspects();renderRoom();renderNotes();showView('workspace');setTimeout(()=>$('#aid-question')?.focus(),200)});
$('[data-action="clear-evidence"]').addEventListener('click',()=>{state.attached=null;renderEvidence();renderAttachment()});
$('[data-action="theory"]').addEventListener('click',openTheory);$('[data-action="back"]').addEventListener('click',()=>showView('workspace'));
$('[data-composer]').addEventListener('submit',submitQuestion);$('[data-theory-form]').addEventListener('submit',submitTheory);
$('#aid-question').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('[data-composer]').requestSubmit()}});
renderEvidence();renderSuspects();renderRoom();renderNotes();if(state.view==='theory')renderTheory();Object.entries(views).forEach(([k,node])=>node.hidden=k!==state.view);
})();
