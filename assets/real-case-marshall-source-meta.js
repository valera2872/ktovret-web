(()=>{
  'use strict';

  const app=document.querySelector('[data-realcase-app]');
  if(!app) return;

  const META={
    M01:{
      badge:'ОРИГИНАЛЬНОЕ ПОКАЗАНИЕ · ТЕКСТОВАЯ ВЫПИСКА',
      note:'Источник: первое письменное показание свидетеля A от 30 мая 1971 года, Exhibit Book Volume 12. Представлена сокращённая текстовая выписка по официальному материалу.'
    },
    M02:{
      badge:'ОРИГИНАЛЬНОЕ ПОКАЗАНИЕ · ТЕКСТОВАЯ ВЫПИСКА',
      note:'Источник: первое письменное показание свидетеля B от 30 мая 1971 года, Exhibit 16, p. 22, воспроизведённое в материалах Royal Commission. Представлена сокращённая текстовая выписка.'
    },
    M03:{
      badge:'ОРИГИНАЛЬНОЕ ПОКАЗАНИЕ · ВОСПРОИЗВЕДЕНИЕ КОМИССИИ',
      note:'Источник: совместное показание свидетелей C и D от 31 мая 1971 года, Exhibit 16, pp. 26–27, воспроизведённое в материалах Royal Commission. Свидетели описывают двух мужчин в районе парка, но не утверждают, что видели нападение.'
    },
    M05:{
      badge:'ОРИГИНАЛЬНОЕ ПОКАЗАНИЕ · ТЕКСТОВАЯ ВЫПИСКА',
      note:'Источник: второе письменное показание свидетеля B от 4 июня 1971 года, Exhibit Book Volume 39. Представлена сокращённая текстовая выписка; её достоверность на этом этапе не оценивается.'
    },
    M06:{
      badge:'ОРИГИНАЛЬНОЕ ПОКАЗАНИЕ · ВОСПРОИЗВЕДЕНИЕ КОМИССИИ',
      note:'Источник: второе письменное показание свидетеля A от 4 июня 1971 года, Exhibit 31, воспроизведённое в материалах Royal Commission. Представлена текстовая выписка; вывод Комиссии о достоверности пока не раскрывается.'
    },
    M08:{
      badge:'ВЕРСИЯ ОБВИНЕНИЯ · ТЕКСТОВАЯ ВЫПИСКА',
      note:'Источник: Crown Statement of Facts 1971 года, Exhibit Book Volume 1. Это позиция и доказательная конструкция обвинения того времени, а не установленный судом или комиссией факт.'
    },
    M10:{
      badge:'ПОВТОРНОЕ РАССЛЕДОВАНИЕ · ТЕКСТОВАЯ ВЫПИСКА',
      note:'Источник: материалы повторного расследования RCMP 1982 года, Exhibit Book Volume 21. Эти сведения относятся к повторному расследованию и отделены от последующих выводов Royal Commission.'
    },
    M11:{
      badge:'ВЫВОД КОМИССИИ · ТЕКСТОВАЯ ВЫПИСКА',
      note:'Источник: официальные Findings / Digest Royal Commission. Здесь представлены выводы Комиссии о показаниях и ходе расследования; имена и полный юридический исход пока не раскрываются.'
    },
    M12:{
      badge:'ОФИЦИАЛЬНЫЙ ИСХОД · ROYAL COMMISSION',
      note:'Источник: официальные Findings / Digest Royal Commission. Материал открывается только после раскрытия настоящего дела.'
    },
    M13:{
      badge:'СИСТЕМНЫЙ ВЫВОД · ROYAL COMMISSION',
      note:'Источник: официальный отчёт и архив Royal Commission. Системный контекст отделён от свидетельских показаний и версии обвинения.'
    }
  };

  const materialIdFromText=(value='')=>String(value).match(/\b(M\d{2})\b/)?.[1]||'';

  const decorateDocument=(doc)=>{
    const id=materialIdFromText(doc.querySelector('.rc-document-ref')?.textContent);
    const meta=META[id];
    if(!meta||doc.dataset.sourceMeta===id) return;
    const status=doc.querySelector('.rc-document-top small');
    if(status) status.textContent=meta.badge;
    const note=doc.querySelector('.rc-document-note');
    if(note) note.textContent=meta.note;
    doc.dataset.sourceMeta=id;
  };

  const decorateMaterialButton=(button)=>{
    const id=button.dataset.openMaterial||'';
    const meta=META[id];
    if(!meta||button.dataset.sourceMeta===id) return;
    const status=button.querySelector('small');
    if(status) status.textContent=meta.badge;
    button.dataset.sourceMeta=id;
  };

  const decorateModal=()=>{
    const modal=app.querySelector('[data-modal]');
    if(!modal||modal.hidden) return;
    const id=materialIdFromText(modal.querySelector('[data-modal-title]')?.textContent);
    const meta=META[id];
    if(!meta||modal.dataset.sourceMeta===id) return;
    const status=modal.querySelector('.rc-modal-body .rc-status');
    if(status) status.textContent=meta.badge;
    const body=modal.querySelector('.rc-modal-body');
    if(body&&!body.querySelector('[data-source-provenance]')){
      const provenance=document.createElement('p');
      provenance.className='rc-note-help';
      provenance.dataset.sourceProvenance='true';
      provenance.textContent=meta.note;
      const existingHelp=body.querySelector('.rc-note-help');
      if(existingHelp) body.insertBefore(provenance,existingHelp);
      else body.appendChild(provenance);
    }
    modal.dataset.sourceMeta=id;
  };

  const decorateLedgerItem=(item)=>{
    const id=materialIdFromText(item.querySelector('.rc-ledger-top strong')?.textContent);
    const meta=META[id];
    if(!meta||item.dataset.sourceMeta===id) return;
    const status=item.querySelector('.rc-ledger-top span');
    if(status) status.textContent=meta.badge;
    const note=document.createElement('p');
    note.className='rc-note-help';
    note.dataset.sourceProvenance='true';
    note.textContent=meta.note;
    const link=item.querySelector('a');
    if(link) item.insertBefore(note,link);
    else item.appendChild(note);
    item.dataset.sourceMeta=id;
  };

  let scheduled=false;
  const decorate=()=>{
    scheduled=false;
    app.querySelectorAll('.rc-document').forEach(decorateDocument);
    app.querySelectorAll('[data-open-material]').forEach(decorateMaterialButton);
    app.querySelectorAll('.rc-ledger-item').forEach(decorateLedgerItem);
    decorateModal();
  };
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    queueMicrotask(decorate);
  };

  new MutationObserver(schedule).observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  decorate();

  window.MLRealCase7105SourceMeta={version:'0.2.1',materialIds:Object.keys(META)};
})();
