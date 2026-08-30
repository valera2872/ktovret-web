(()=>{
  'use strict';

  const root=document.querySelector('[data-ai-v2-player]');
  if(!root)return;

  const SUPABASE='https://orknvuwknvsedjgqcfwc.supabase.co';
  const PUBLIC_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ya252dXdrbnZzZWRqZ3FjZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxOTY2MzcsImV4cCI6MjEwMTc3MjYzN30.68loNx8A71dodfOXXKs_-I235XVCmEioXGrg8kCZQr4';
  const CASE_ACCESS=`${SUPABASE}/functions/v1/case-access`;
  const AI_V2=`${SUPABASE}/functions/v1/ai-interrogation-v2`;
  const STORAGE_KEY='mysterylogic:ai-investigation:access-token';
  const CASE_RE=/^[A-Za-z0-9_:-]{3,160}$/;
  const STAGE_LABEL={composed:'держится спокойно',defensive:'защищается',cornered:'зажат фактами',breaking:'теряет контроль',confessed:'признание получено'};

  const params=new URL(location.href).searchParams;
  const requestedCase=(params.get('case')||params.get('case_id')||'').trim();
  const $=(sel)=>root.querySelector(sel);
  const views={access:$('[data-view="access"]'),intro:$('[data-view="intro"]'),workspace:$('[data-view="workspace"]'),theory:$('[data-view="theory"]')};
  const ui={caseId:CASE_RE.test(requestedCase)?requestedCase:'',token:'',access:null,state:null,suspectId:'',attachedEvidenceId:'',busy:false};

  const escapeHtml=(value)=>String(value??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean=(value,max=1600)=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max):'';
  const suspects=()=>Array.isArray(ui.access?.config?.ai_case?.suspects)?ui.access.config.ai_case.suspects:[];
  const maxTurns=()=>Number(ui.state?.max_turns||ui.access?.config?.ai_case?.max_turns||30)||30;
  const isLive=()=>ui.access?.experienceTier==='live'&&ui.access?.features?.liveAvatar===true;

  function showView(name){Object.entries(views).forEach(([key,node])=>{if(node)node.hidden=key!==name});window.scrollTo({top:0,left:0,behavior:'instant'})}
  function setAccessStatus(text,kind=''){const node=$('[data-access-status]');if(!node)return;node.textContent=text;node.classList.toggle('is-error',kind==='error');node.classList.toggle('is-ok',kind==='ok')}
  function accessError(code){return ({access_denied:'Этот ключ не даёт доступа к делу.',access_revoked:'Доступ по этому ключу отозван.',access_expired:'Срок доступа закончился.',access_not_started:'Доступ ещё не начался.',access_wrong_case:'Этот ключ выдан для другого дела.',case_not_found:'Дело пока недоступно.',ai_case_not_ready:'AI-часть этого дела ещё не опубликована.'})[code]||'Не удалось открыть расследование.'}

  async function fetchJson(url,init){const response=await fetch(url,init);let body={};try{body=await response.json()}catch{}if(!response.ok){const error=new Error(body.error||`http_${response.status}`);error.status=response.status;error.body=body;throw error}return body}
  async function caseAccess(token){const url=new URL(CASE_ACCESS);url.searchParams.set('case_id',ui.caseId);return fetchJson(url.href,{method:'GET',headers:{authorization:`Bearer ${token}`},cache:'no-store',credentials:'omit'})}
  async function ai(action,payload={}){return fetchJson(AI_V2,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${PUBLIC_ANON}`,apikey:PUBLIC_ANON},body:JSON.stringify({case_id:ui.caseId,access_token:ui.token,action,...payload}),cache:'no-store',credentials:'omit'})}

  function validateAccess(access){const cfg=access?.config;const aiCase=cfg?.ai_case;if(access?.caseId!==ui.caseId||!cfg||Number(aiCase?.schema_version)!==1||!Array.isArray(aiCase?.suspects)||aiCase.suspects.length<2||!Array.isArray(aiCase?.initial_evidence))throw new Error('invalid_case_payload')}
  function fillIntro(){const cfg=ui.access.config;const aiCase=cfg.ai_case;document.title=`${clean(cfg.title,160)||ui.caseId} — Mystery Logic`;const write=(sel,text)=>{const node=$(sel);if(node)node.textContent=text};write('[data-case-number]',ui.caseId);write('[data-case-title]',clean(cfg.title,180)||'Закрытое расследование');write('[data-case-subtitle]',clean(cfg.subtitle,260)||'Проверьте версии всех фигурантов.');write('[data-case-incident]',clean(cfg.incident,1800));write('[data-player-brief]',clean(cfg.player_brief,1800));write('[data-suspect-count]',`${aiCase.suspects.length} человека`);write('[data-case-limit]',`${aiCase.max_turns||30} вопросов`);write('[data-case-tier]',isLive()?'Live · голос и lip-sync':'Text · свободный допрос');const tier=$('[data-tier-label]');if(tier)tier.textContent=isLive()?'Live investigation':'Text investigation'}

  async function unlock({silent=false}={}){
    if(!ui.caseId){setAccessStatus('В адресе не указан корректный case_id.','error');return false}
    const input=$('[data-access-token]');const token=clean(input?.value||localStorage.getItem(STORAGE_KEY)||'',512);
    if(token.length<32){if(!silent)setAccessStatus('Введите ключ покупки.','error');return false}
    const button=$('[data-action="unlock"]');if(button)button.disabled=true;if(!silent)setAccessStatus('Проверяем доступ…');
    try{
      const access=await caseAccess(token);validateAccess(access);ui.token=token;ui.access=access;localStorage.setItem(STORAGE_KEY,token);const stateResult=await ai('state');ui.state=stateResult.state;ui.suspectId=suspects()[0]?.id||'';fillIntro();renderAll();setAccessStatus('Доступ подтверждён.','ok');showView('intro');return true;
    }catch(error){console.error('ai_v2_unlock_failed',error);if(!silent)setAccessStatus(accessError(error.message),'error');return false}
    finally{if(button&&document.contains(button))button.disabled=false}
  }

  function evidence(){return Array.isArray(ui.state?.evidence)?ui.state.evidence:[]}
  function notes(){return Array.isArray(ui.state?.notes)?ui.state.notes:[]}
  function stageFor(id){const value=ui.state?.stages?.[id];return STAGE_LABEL[value]?value:'composed'}
  function selectedSuspect(){return suspects().find((item)=>item.id===ui.suspectId)||suspects()[0]||null}

  function renderSuspects(){const strip=$('[data-suspect-strip]');if(!strip)return;strip.innerHTML=suspects().map((s)=>`<button class="aid-suspect-tab${s.id===ui.suspectId?' is-active':''}" type="button" data-suspect="${escapeHtml(s.id)}"><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.role)}</small></button>`).join('');strip.querySelectorAll('[data-suspect]').forEach((button)=>button.addEventListener('click',()=>{if(ui.busy)return;ui.suspectId=button.dataset.suspect||ui.suspectId;ui.attachedEvidenceId='';renderAll()}))}
  function renderEvidence(){const list=$('[data-evidence-list]');if(!list)return;const visible=evidence();if(ui.attachedEvidenceId&&!visible.some((item)=>item.id===ui.attachedEvidenceId))ui.attachedEvidenceId='';list.innerHTML=visible.map((item)=>`<button class="aid-evidence-card${item.id===ui.attachedEvidenceId?' is-selected':''}" type="button" data-evidence="${escapeHtml(item.id)}" aria-pressed="${item.id===ui.attachedEvidenceId?'true':'false'}"><small>${escapeHtml(item.code)}${item.id===ui.attachedEvidenceId?' · ПРЕДЪЯВЛЯЕТСЯ':''}</small><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p></button>`).join('');list.querySelectorAll('[data-evidence]').forEach((button)=>button.addEventListener('click',()=>{ui.attachedEvidenceId=ui.attachedEvidenceId===button.dataset.evidence?'':button.dataset.evidence||'';renderEvidence();renderAttachment()}))}
  function renderAttachment(){const box=$('[data-attachment]');if(!box)return;const item=evidence().find((entry)=>entry.id===ui.attachedEvidenceId);box.hidden=!item;const title=$('[data-attachment-title]');if(title)title.textContent=item?.title||''}
  function renderNotes(){const box=$('[data-notes]');if(!box)return;const items=notes();box.innerHTML=items.length?items.map((note)=>`<div class="aid-note"><small>${escapeHtml(note.source||'зацепка')}</small>${escapeHtml(note.text)}</div>`).join(''):'<p class="aid-empty-note">Пока ничего. Сервер зафиксирует здесь только действительно полученные зацепки.</p>'}
  function renderAvatar(s){const stage=stageFor(s.id);const box=$('[data-avatar-stage]');if(!box)return;box.dataset.stage=stage;box.dataset.suspect=s.id;box.dataset.tier=isLive()?'live':'text';const set=(sel,text)=>{const node=$(sel);if(node)node.textContent=text};set('[data-avatar-name]',s.name);set('[data-avatar-role]',s.role);set('[data-avatar-state]',STAGE_LABEL[stage]);set('[data-avatar-initials]',s.name.split(/\s+/).map((part)=>part[0]).join('').slice(0,2).toUpperCase())}
  function renderTranscript(s){const transcript=$('[data-transcript]');if(!transcript)return;const items=Array.isArray(ui.state?.transcripts?.[s.id])?ui.state.transcripts[s.id]:[];transcript.innerHTML=items.map((item)=>`<div class="aid-message ${item.role==='user'?'is-player':'is-suspect'}"><div class="aid-message-meta"><span>${item.role==='user'?'Вы':escapeHtml(s.name)}</span></div><div>${escapeHtml(item.text)}</div></div>`).join('');transcript.scrollTop=transcript.scrollHeight}
  function renderRoom(){const s=selectedSuspect();if(!s)return;const set=(sel,text)=>{const node=$(sel);if(node)node.textContent=text};set('[data-suspect-name]',s.name);set('[data-suspect-role]',s.role);renderAvatar(s);renderTranscript(s);const turns=Number(ui.state?.successful_turns||0);set('[data-turn-counter]',`${turns} / ${maxTurns()} вопросов`);const exhausted=turns>=maxTurns();const confessed=stageFor(s.id)==='confessed';const question=$('#aiv2-question');const send=$('.aid-send');if(question)question.disabled=ui.busy||exhausted||confessed;if(send)send.disabled=ui.busy||exhausted||confessed;const status=$('[data-room-status]');if(status&&!ui.busy)status.textContent=confessed?'Признание получено':exhausted?'Лимит вопросов исчерпан':'Допрос идёт'}
  function renderAll(){renderSuspects();renderEvidence();renderAttachment();renderNotes();renderRoom()}

  async function interrogate(event){event.preventDefault();if(ui.busy||!ui.state)return;const field=$('#aiv2-question');const question=clean(field?.value||'',420);if(question.length<2)return;ui.busy=true;const status=$('[data-room-status]');if(status)status.textContent='Собеседник отвечает…';renderRoom();try{const result=await ai('interrogate',{suspect_id:ui.suspectId,question,evidence_id:ui.attachedEvidenceId||''});ui.state=result.state;ui.attachedEvidenceId='';if(field)field.value='';renderAll()}catch(error){console.error('ai_v2_interrogate_failed',error);if(status)status.textContent=error.body?.message||accessError(error.message)||'ИИ-собеседник временно недоступен.'}finally{ui.busy=false;renderRoom()}}

  function openTheory(){const wrap=$('[data-theory-suspects]');if(wrap)wrap.innerHTML=suspects().map((s,index)=>`<label class="aid-radio"><input type="radio" name="suspect" value="${escapeHtml(s.id)}" ${index===0?'required':''}><span><strong>${escapeHtml(s.name)}</strong> · ${escapeHtml(s.role)}</span></label>`).join('');const verdict=$('[data-verdict]');if(verdict)verdict.hidden=true;const form=$('[data-theory-form]');if(form)form.hidden=false;showView('theory')}
  function renderVerdict(result){const box=$('[data-verdict]');const form=$('[data-theory-form]');if(!box)return;box.hidden=false;box.className=`aid-verdict ${result.correct?'is-correct':'is-wrong'}`;if(result.correct){if(form)form.hidden=true;box.innerHTML=`<p class="aid-kicker">Версия выдерживает проверку</p><h3>${escapeHtml(result.title||'Дело раскрыто')}</h3><p>${escapeHtml(result.explanation||'Доказательная цепочка замкнута.')}</p>`}else{if(form)form.hidden=false;const copy=result.code==='wrong_suspect'?'Выбранный человек не соответствует доказательной цепочке.':result.code==='insufficient_evidence'?'В расследовании ещё не получены все необходимые подтверждения.':'Доказательства могут быть собраны, но в объяснении пока не назван ключевой механизм.';box.innerHTML=`<p class="aid-kicker">В версии остаётся разрыв</p><h3>Проверка не пройдена</h3><p>${escapeHtml(copy)}</p><span class="aiv2-result-code">${escapeHtml(result.code||'not_ready')}</span>`}}
  async function checkTheory(event){event.preventDefault();if(ui.busy)return;const form=event.currentTarget;const data=new FormData(form);const suspectId=clean(data.get('suspect'),80);const reason=clean(data.get('reason'),1200);if(!suspectId||reason.length<8)return;ui.busy=true;try{const response=await ai('check_theory',{suspect_id:suspectId,reason});ui.state=response.state;renderVerdict(response.result)}catch(error){console.error('ai_v2_theory_failed',error);const box=$('[data-verdict]');if(box){box.hidden=false;box.className='aid-verdict is-wrong';box.innerHTML='<p>Не удалось проверить версию. Попробуйте ещё раз.</p>'}}finally{ui.busy=false}}

  $('[data-action="unlock"]')?.addEventListener('click',()=>unlock());
  $('[data-action="start"]')?.addEventListener('click',()=>showView('workspace'));
  $('[data-action="theory"]')?.addEventListener('click',openTheory);
  $('[data-action="back"]')?.addEventListener('click',()=>showView('workspace'));
  $('[data-action="clear-evidence"]')?.addEventListener('click',()=>{ui.attachedEvidenceId='';renderEvidence();renderAttachment()});
  $('[data-composer]')?.addEventListener('submit',interrogate);
  $('[data-theory-form]')?.addEventListener('submit',checkTheory);

  const saved=localStorage.getItem(STORAGE_KEY)||'';const tokenInput=$('[data-access-token]');if(tokenInput)tokenInput.value=saved;
  if(!ui.caseId)setAccessStatus('Добавьте к адресу ?case=ID_ДЕЛА.','error');else if(saved)unlock({silent:true});
})();
