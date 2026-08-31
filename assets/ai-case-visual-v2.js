(()=>{
  'use strict';

  const root=document.querySelector('[data-ai-v2-player]');
  if(!root)return;

  const STAGE_LABEL={
    composed:'держится спокойно',
    defensive:'защищается',
    cornered:'зажат фактами',
    breaking:'теряет контроль',
    confessed:'признание получено'
  };

  const SPECIAL={
    alisa:{bg1:'#51323b',bg2:'#111922',glow:'#d2ae73',skin:'#c78c70',skin2:'#a86f59',hair:'#21191c',coat:'#4c5965',shirt:'#d8c8b2',variant:'bob'},
    kira:{bg1:'#5c2c43',bg2:'#18131d',glow:'#d08a78',skin:'#d29a7b',skin2:'#ae715d',hair:'#6c2e2d',coat:'#6c2f42',shirt:'#d6b9ae',variant:'long'},
    oleg:{bg1:'#294657',bg2:'#0d1720',glow:'#8fb5c9',skin:'#c49373',skin2:'#9f6e55',hair:'#2e302f',coat:'#3e4c53',shirt:'#b6c0be',variant:'glasses'},
    pavel:{bg1:'#244b49',bg2:'#0d1818',glow:'#91b7a9',skin:'#c18b6d',skin2:'#9f6b52',hair:'#3a2b27',coat:'#465a50',shirt:'#c3b79d',variant:'short'}
  };
  const FALLBACK=[
    {bg1:'#3b4258',bg2:'#101620',glow:'#b4c1d6',skin:'#c99073',skin2:'#a56d56',hair:'#29262d',coat:'#4b5365',shirt:'#c9c2b6',variant:'short'},
    {bg1:'#543a3f',bg2:'#181116',glow:'#d5a28f',skin:'#d09a7d',skin2:'#ad725d',hair:'#38222b',coat:'#65515a',shirt:'#d9c5b8',variant:'bob'},
    {bg1:'#3c4b43',bg2:'#101814',glow:'#a7c4aa',skin:'#bd896d',skin2:'#996850',hair:'#312a24',coat:'#485a4d',shirt:'#c4bcaa',variant:'glasses'},
    {bg1:'#4b4134',bg2:'#17140f',glow:'#d2b77e',skin:'#c89672',skin2:'#a87355',hair:'#2a2520',coat:'#5a5142',shirt:'#d1c3a7',variant:'long'}
  ];

  const esc=(value)=>String(value??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hash=(value)=>[...String(value||'')].reduce((sum,ch)=>((sum*31)+ch.charCodeAt(0))>>>0,7);
  const themeFor=(id,index=0)=>SPECIAL[id]||FALLBACK[(hash(id)+index)%FALLBACK.length];

  function hairPath(variant){
    if(variant==='bob')return '<path d="M83 196c-8-74 22-129 78-143 61-15 119 24 127 100 5 47-5 91-18 120l-24-26c13-54 2-129-70-132-62-3-76 63-64 125l-29 15c-5-17-7-36-10-59Z" fill="var(--hair)"/><path d="M97 119c26-52 115-73 171-4-26-14-56-18-86-10-33 8-59 25-85 47Z" fill="var(--hair2)" opacity=".72"/>';
    if(variant==='long')return '<path d="M77 201c-5-82 27-139 87-151 66-13 124 32 127 112 2 59-5 119 18 171l-42-17c-12-34-8-85-6-132 2-53-25-77-75-75-55 2-80 34-77 92 3 47 4 90-7 126l-39 13c18-54 17-91 14-139Z" fill="var(--hair)"/><path d="M100 112c33-58 131-68 171 15-38-22-74-28-107-18-28 8-46 21-64 39Z" fill="var(--hair2)" opacity=".7"/>';
    return '<path d="M91 153c5-65 38-103 91-106 63-4 102 34 105 105-28-26-69-42-111-39-36 3-62 16-85 40Z" fill="var(--hair)"/><path d="M111 96c43-44 122-37 156 22-42-18-84-22-122-10-14 4-25 9-34 15Z" fill="var(--hair2)" opacity=".68"/>';
  }

  function portraitSvg(id,name,index=0){
    const t=themeFor(id,index);const glasses=t.variant==='glasses';
    const seed=hash(id||name);const tilt=(seed%7)-3;const mouth=seed%2?238:241;
    return `<svg viewBox="0 0 320 420" role="img" aria-label="${esc(name)}" style="--skin:${t.skin};--skin2:${t.skin2};--hair:${t.hair};--hair2:${t.glow};--coat:${t.coat};--shirt:${t.shirt}">
      <defs>
        <linearGradient id="bg-${seed}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
        <radialGradient id="light-${seed}" cx="44%" cy="30%" r="65%"><stop stop-color="${t.glow}" stop-opacity=".25"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient>
        <linearGradient id="face-${seed}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${t.skin}"/><stop offset="1" stop-color="${t.skin2}"/></linearGradient>
      </defs>
      <rect width="320" height="420" fill="url(#bg-${seed})"/>
      <rect width="320" height="420" fill="url(#light-${seed})"/>
      <circle cx="62" cy="72" r="70" fill="${t.glow}" opacity=".04"/><circle cx="284" cy="240" r="112" fill="#fff" opacity=".018"/>
      <g transform="rotate(${tilt/2} 170 220)">
        <path d="M38 420c11-78 54-121 113-132h42c61 12 105 56 116 132Z" fill="var(--coat)"/>
        <path d="M127 292l32 59 39-59 24 11-24 117h-77l-20-117Z" fill="var(--shirt)" opacity=".94"/>
        <path d="M139 252h51v65c-2 22-49 22-52 0Z" fill="url(#face-${seed})"/>
        <ellipse cx="102" cy="190" rx="13" ry="24" fill="var(--skin2)"/><ellipse cx="226" cy="190" rx="13" ry="24" fill="var(--skin2)"/>
        <path d="M101 160c0-55 29-91 68-91 46 0 77 37 76 96l-5 66c-3 51-34 78-72 78-39 0-67-30-69-80Z" fill="url(#face-${seed})"/>
        ${hairPath(t.variant)}
        <path d="M119 172c14-9 29-10 43-2" fill="none" stroke="var(--hair)" stroke-width="6" stroke-linecap="round" opacity=".8"/><path d="M179 170c14-8 29-7 42 3" fill="none" stroke="var(--hair)" stroke-width="6" stroke-linecap="round" opacity=".8"/>
        <ellipse cx="142" cy="190" rx="5.5" ry="4.2" fill="#1b1c1d"/><ellipse cx="198" cy="190" rx="5.5" ry="4.2" fill="#1b1c1d"/><circle cx="140" cy="188.7" r="1.5" fill="#f6eee2"/><circle cx="196" cy="188.7" r="1.5" fill="#f6eee2"/>
        ${glasses?'<g fill="none" stroke="#c2cbd0" stroke-width="3" opacity=".8"><rect x="119" y="176" width="45" height="28" rx="10"/><rect x="176" y="176" width="45" height="28" rx="10"/><path d="M164 187h12"/></g>':''}
        <path d="M170 190c-2 13-5 24-11 34 7 5 14 6 22 2" fill="none" stroke="#784f43" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>
        <path d="M145 ${mouth}c15 9 31 10 48 0" fill="none" stroke="#74423e" stroke-width="3" stroke-linecap="round" opacity=".78"/>
        <path d="M117 258c29 25 75 24 103-1" fill="none" stroke="#f4cbb2" stroke-width="2" opacity=".12"/>
      </g>
      <path d="M0 356c68-20 151-18 320 13v51H0Z" fill="#02090e" opacity=".22"/>
      <rect x="0" y="0" width="320" height="420" fill="none" stroke="${t.glow}" stroke-opacity=".08"/>
    </svg>`;
  }

  const tabs=()=>[...root.querySelectorAll('[data-suspect-strip] [data-suspect]')];
  const activeTab=()=>root.querySelector('[data-suspect-strip] [data-suspect].is-active')||tabs()[0]||null;
  const selectedIndex=()=>Math.max(0,tabs().indexOf(activeTab()));
  const tabName=(tab)=>tab?.querySelector('strong')?.textContent?.trim()||'Фигурант';
  const tabRole=(tab)=>tab?.querySelector('small:not(.aiv2-visual-small)')?.textContent?.trim()||'';

  function enhanceTabs(){
    tabs().forEach((tab,index)=>{
      if(tab.querySelector('.aiv2-tab-portrait'))return;
      const id=tab.dataset.suspect||`suspect-${index}`;const name=tabName(tab);
      const span=document.createElement('span');span.className='aiv2-tab-portrait';span.setAttribute('aria-hidden','true');span.innerHTML=portraitSvg(id,name,index);tab.prepend(span);
    });
  }

  function renderIntroCast(){
    const box=root.querySelector('[data-intro-cast]');const list=tabs();if(!box||!list.length)return;
    const signature=list.map((t)=>t.dataset.suspect).join('|');if(box.dataset.signature===signature)return;box.dataset.signature=signature;
    box.innerHTML=list.map((tab,index)=>{const id=tab.dataset.suspect||`suspect-${index}`;const name=tabName(tab);const role=tabRole(tab);return `<button type="button" class="aiv2-intro-person" data-intro-suspect="${esc(id)}"><span class="aiv2-intro-person-art">${portraitSvg(id,name,index)}</span><span class="aiv2-intro-person-copy"><strong>${esc(name)}</strong><small>${esc(role)}</small></span></button>`}).join('');
    box.querySelectorAll('[data-intro-suspect]').forEach((button)=>button.addEventListener('click',()=>{const target=root.querySelector(`[data-suspect="${CSS.escape(button.dataset.introSuspect||'')}"]`);target?.click()}));
  }

  let lastScene='';
  function renderScene(){
    const tab=activeTab();if(!tab)return;const id=tab.dataset.suspect||'';const name=tabName(tab);const role=tabRole(tab);const stageNode=root.querySelector('[data-avatar-stage]');const stage=STAGE_LABEL[stageNode?.dataset.stage]?stageNode.dataset.stage:'composed';const room=root.querySelector('[data-room-status]')?.textContent?.trim()||'Допрос идёт';const index=selectedIndex();const signature=[id,name,role,stage,room].join('|');if(signature===lastScene)return;lastScene=signature;
    const scene=root.querySelector('[data-character-scene]');if(scene)scene.dataset.stage=stage;
    const art=root.querySelector('[data-character-art]');if(art)art.innerHTML=portraitSvg(id,name,index);
    const write=(sel,text)=>{const node=root.querySelector(sel);if(node)node.textContent=text};
    write('[data-character-name]',name);write('[data-character-role]',role);write('[data-character-state]',STAGE_LABEL[stage]);write('[data-character-code]',String(index+1).padStart(2,'0'));write('[data-visual-room-status]',room);
  }

  function sync(){enhanceTabs();renderIntroCast();renderScene()}
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})}

  const observer=new MutationObserver(schedule);
  observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','data-stage','hidden']});
  root.addEventListener('click',(event)=>{if(event.target.closest('[data-suspect],[data-action="start"],[data-action="back"]'))setTimeout(schedule,0)});
  schedule();
})();
