(()=>{
  'use strict';

  const catalog=globalThis.KtoVretCatalog;
  const model=globalThis.MysteryLogicDossier;
  if(!catalog||!Array.isArray(catalog.cases)) return;

  const freeCases=Array.isArray(catalog.freeCases)?catalog.freeCases:[];
  const recordMap=new Map();
  let summary={solvedCount:0,totalCases:freeCases.length,nextCase:freeCases[0]||null,activeCase:null,allSolved:false,rank:'Стажёр бюро'};

  if(model){
    const records=model.readRecords();
    records.forEach(record=>recordMap.set(record.id,record));
    summary=model.summarize(records);
  }

  const progress=document.querySelector('[data-catalog-progress]');
  const injectedProgress=document.querySelector('.ml-dossier-progress');
  const investigator=document.querySelector('.ml-investigator-card');
  injectedProgress?.remove();
  if(progress&&investigator) investigator.before(progress);

  const progressFill=document.querySelector('[data-catalog-progress-fill]');
  const progressText=document.querySelector('[data-catalog-progress-text]');
  const continueLink=document.querySelector('[data-catalog-continue]');
  const randomButton=document.querySelector('[data-catalog-random]');
  const resultCount=document.querySelector('[data-catalog-result-count]');
  const search=document.querySelector('#case-search');
  const difficulty=document.querySelector('#case-difficulty');
  const category=document.querySelector('#case-category');
  const unsolvedToggle=document.querySelector('#case-unsolved');
  const cards=[...document.querySelectorAll('.case-card')];

  const relativePath=(item)=>item?.path?`../${item.path}`:'../dela/';

  if(progress){
    const total=Math.max(1,summary.totalCases||freeCases.length||15);
    const solved=summary.solvedCount||0;
    const percent=Math.round((solved/total)*100);
    progress.dataset.solved=String(solved);
    if(progressFill) progressFill.style.width=`${percent}%`;
    if(progressText) progressText.textContent=`${solved} из ${total} бесплатных дел раскрыто`;
  }

  if(continueLink){
    const next=summary.nextCase||freeCases[0];
    continueLink.href=relativePath(next);
    continueLink.textContent=summary.allSolved?'Открыть любое дело снова':summary.activeCase?'Продолжить расследование':'Следующее нераскрытое дело';
  }

  const firstFree=freeCases[0];
  const featureLink=document.querySelector('.catalog-feature .ml-button-primary');
  if(featureLink&&firstFree){
    featureLink.href=relativePath(firstFree);
    featureLink.textContent='Открыть первое дело';
  }

  const stateFor=(id)=>recordMap.get(id)?.state||{};

  cards.forEach(card=>{
    card.querySelectorAll('.case-state').forEach(node=>node.remove());
    card.classList.remove('is-active');
    if(card.dataset.access!=='free') return;
    const state=stateFor(card.dataset.caseId);
    const solved=state.solved===true;
    const active=state.accepted===true&&!solved;
    card.classList.toggle('is-solved',solved);
    card.classList.toggle('is-active-case',active);
    card.dataset.progress=solved?'solved':active?'active':'new';
    const badge=card.querySelector('[data-case-progress-badge]');
    if(badge) badge.textContent=solved?'✓ Раскрыто':active?'● В работе':'○ Новое';
    const link=card.querySelector('[data-case-open]');
    if(link) link.textContent=solved?'Открыть снова':active?'Продолжить дело':'Открыть расследование';
  });

  const filters={access:'all'};
  const apply=()=>{
    const q=(search?.value||'').trim().toLowerCase();
    const selectedDifficulty=difficulty?.value||'all';
    const selectedCategory=category?.value||'all';
    const onlyUnsolved=Boolean(unsolvedToggle?.checked);
    let visible=0;

    cards.forEach(card=>{
      const accessOk=filters.access==='all'||card.dataset.access===filters.access;
      const textOk=!q||(card.dataset.search||'').includes(q);
      const difficultyOk=selectedDifficulty==='all'||card.dataset.difficulty===selectedDifficulty;
      const categoryOk=selectedCategory==='all'||card.dataset.category===selectedCategory;
      const unsolvedOk=!onlyUnsolved||(card.dataset.access==='free'&&card.dataset.progress!=='solved');
      const show=accessOk&&textOk&&difficultyOk&&categoryOk&&unsolvedOk;
      card.classList.toggle('is-hidden',!show);
      if(show) visible+=1;
    });

    document.querySelectorAll('.case-set').forEach(section=>section.classList.toggle('is-hidden',!section.querySelector('.case-card:not(.is-hidden)')));
    if(resultCount) resultCount.textContent=`Показано: ${visible} из ${cards.length}`;
  };

  document.querySelectorAll('[data-filter]').forEach(button=>{
    button.addEventListener('click',()=>{
      filters.access=button.dataset.filter||'all';
      document.querySelectorAll('[data-filter]').forEach(item=>item.classList.toggle('is-active',item===button));
      apply();
    });
  });

  search?.addEventListener('input',apply);
  difficulty?.addEventListener('change',apply);
  category?.addEventListener('change',apply);
  unsolvedToggle?.addEventListener('change',apply);

  randomButton?.addEventListener('click',()=>{
    let target=null;
    if(model) target=model.pickRandomCase(model.readRecords());
    target=target||freeCases[Math.floor(Math.random()*Math.max(1,freeCases.length))];
    if(target?.path) location.href=relativePath(target);
  });

  apply();
})();
