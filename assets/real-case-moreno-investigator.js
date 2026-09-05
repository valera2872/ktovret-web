(()=>{
  'use strict';

  const VERSION='0.2.0';
  const STORAGE_KEY='ml-realcase-moreno-investigator-v2';
  const app=document.querySelector('[data-moreno-app]');
  if(!app) return;

  const OFFICIAL_PHOTO='https://www.middlesexda.com/sites/g/files/vyhlif11841/f/styles/news_image/public/news/capture_3.jpg?itok=RK3zkJ6R';
  const SOURCES={
    arrest:'https://www.middlesexda.com/press-releases/news/middlesex-district-attorney-and-malden-police-announce-arrest-30-year-old-murder',
    conviction:'https://www.middlesexda.com/press-releases/news/man-convicted-first-degree-murder-connection-32-year-old-murder-patricia-moreno'
  };

  const ACTIONS={
    forensics:{title:'Заказать криминалистическую реконструкцию',meta:'сцена + траектория',desc:'Вернуться на адрес и проверить, что физически говорит положение Патриции и направление пули.'},
    witness:{title:'Искать свидетелей по дому',meta:'пожарная лестница',desc:'Повторно найти жильцов соседних этажей и проверить, видел ли кто-то саму сцену после выстрела.'},
    weapons:{title:'Проверить оружие и угрозы',meta:'.38 + предыстория',desc:'Поднять сведения об оружии людей из квартиры и отношениях с Патрицией до убийства.'},
    alibi:{title:'Проверить алиби бойфренда',meta:'кресло + окружение',desc:'Не принимать слова «я спал» как факт: проверить, кто и почему подтверждал эту версию.'}
  };

  const defaultState=()=>({
    stage:'opening',
    ordered:[],
    completed:[],
    trajectoryInference:'',
    witnessInference:'',
    weaponsInference:'',
    alibiInference:'',
    finalTheory:'',
    finalAction:'',
    deadendReason:'',
    revealSeen:false
  });
  const load=()=>{try{return {...defaultState(),...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch{return defaultState()}};
  let state=load();
  const save=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  const esc=(value='')=>String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const has=(id)=>state.completed.includes(id);
  const ordered=(id)=>state.ordered.includes(id);
  const markOrdered=(id)=>{if(!state.ordered.includes(id))state.ordered.push(id)};
  const markDone=(id)=>{markOrdered(id);if(!state.completed.includes(id))state.completed.push(id)};
  const setStage=(stage)=>{state.stage=stage;save();render();window.scrollTo({top:0,behavior:'smooth'})};

  const sourceNote=(text,source='arrest')=>`<p class="mi-source-note">${esc(text)} <a href="${SOURCES[source]}" target="_blank" rel="noopener noreferrer">Официальный источник ↗</a></p>`;
  const button=(label,action,kind='primary',disabled=false)=>`<button class="mi-button mi-button-${kind}" type="button" data-action="${action}"${disabled?' disabled':''}>${esc(label)}</button>`;
  const topbar=(label)=>`<div class="mi-topbar"><div class="mi-case"><strong>CASE 91-M</strong><span>cold case · Malden</span></div><div class="mi-step">${esc(label)}</div></div>`;

  const evidenceItems=()=>{
    const items=[
      ['ИСХОДНАЯ СЦЕНА','Патрицию нашли после 03:00 на площадке пожарной лестницы третьего этажа с одним огнестрельным ранением головы.'],
      ['ВЕЩЕСТВЕННОЕ','Оружие и гильзу на месте не нашли. Пуля из тела была совместима с оружием калибра .38.'],
      ['ВХОД','Следов насильственного проникновения в квартиру не обнаружено.'],
      ['КВАРТИРА','Внутри находились приёмная мать, две её дочери-подростка и бойфренд старшей дочери.']
    ];
    if(has('forensics')) items.push(['КРИМИНАЛИСТИКА',state.trajectoryInference==='door'?'Вы интерпретировали реконструкцию как наиболее совместимую с выстрелом из района дверного проёма.':state.trajectoryInference==='landing'?'Вы оставили основной точкой саму площадку.':'Вы сохранили внешнюю/нижнюю линию как основную.']);
    if(has('witness')) items.push(['СВИДЕТЕЛЬ СНИЗУ','После громкого звука сосед второго этажа увидел Патрицию на пожарной лестнице и мужчину над ней; мужчина ушёл обратно в квартиру. Описание соответствовало бойфренду старшей дочери.']);
    if(has('weapons')) items.push(['ОРУЖИЕ / УГРОЗЫ','У бойфренда были несколько пистолетов примерно в тот период, включая оружие, совместимое с .38; следствие также получило сведения об угрозах Патриции до убийства.']);
    if(has('alibi')) items.push(['АЛИБИ','Позднее окружение женщины, прикрывавшей бойфренда, сообщило: она признавалась, что лгала полиции и большому жюри; по её словам, оружие было спрятано в кресле и затем уничтожено/выброшено.']);
    return items;
  };

  const evidenceRail=()=>`<aside class="mi-evidence"><div class="mi-evidence-head"><strong>Досье</strong><span>${evidenceItems().length}</span></div>${evidenceItems().map(([k,t])=>`<article><small>${esc(k)}</small><p>${esc(t)}</p></article>`).join('')}</aside>`;

  const opening=()=>`${topbar('Новое дело')}<section class="mi-opening"><div class="mi-opening-main"><p class="mi-eyebrow">20 июля 1991 · 03:00</p><h1>ТРЕТИЙ ЭТАЖ</h1><p class="mi-lead">Семнадцатилетнюю Патрицию Морено находят лицом вниз на площадке пожарной лестницы. Она ещё дышит. В голове — одно огнестрельное ранение.</p><div class="mi-opening-grid"><div><span>оружие</span><strong>не найдено</strong></div><div><span>гильза</span><strong>не найдена</strong></div><div><span>пуля</span><strong>совместима с .38</strong></div><div><span>взлом</span><strong>признаков нет</strong></div></div><p>В квартире за дверью находятся четыре человека. Все говорят, что слышали пару выстрелов. Никто не называет стрелка.</p><p class="mi-brief">В 2020 году дело попадает в Cold Case Unit. <strong>Теперь решения принимаете вы.</strong> Экспертизы, поиски свидетелей и проверки алиби не откроются сами — их надо назначать.</p><div class="mi-actions">${button('Принять дело','accept')}</div>${sourceNote('Исходные обстоятельства — по материалам Middlesex District Attorney.')}</div><aside class="mi-victim-file"><div class="mi-photo-frame"><img src="${OFFICIAL_PHOTO}" alt="Патриция Морено"></div><div><small>VICTIM FILE</small><strong>Patricia “Tricia” Moreno</strong><span>17 лет</span><p>Официальная фотография Middlesex District Attorney’s Office. Не реконструкция сцены.</p></div></aside></section>`;

  const actionCard=(id)=>{
    const a=ACTIONS[id];
    const status=has(id)?'ПРОВЕРЕНО':ordered(id)?'НАЗНАЧЕНО':'НЕ НАЗНАЧЕНО';
    return `<button class="mi-order-card${has(id)?' is-done':''}" type="button" data-order="${id}"><div><small>${status}</small><strong>${esc(a.title)}</strong><p>${esc(a.desc)}</p></div><span>${esc(a.meta)} →</span></button>`;
  };

  const desk=()=>`${topbar('Следственный стол')}<div class="mi-workspace"><main class="mi-main"><section class="mi-desk-head"><p class="mi-eyebrow">Вы руководите повторным расследованием</p><h1>ЧТО ПРОВЕРЯТЬ ДАЛЬШЕ?</h1><p class="mi-lead">Правильной последовательности на экране нет. Выберите следственное действие. Результат появится только после вашего решения.</p></section><div class="mi-order-grid">${['forensics','witness','weapons','alibi'].map(actionCard).join('')}</div><section class="mi-conclusion-card"><div><small>Можно сделать это в любой момент</small><strong>Собрать версию сейчас</strong><p>Если в ней останется незакрытый ключевой вопрос, расследование действительно упрётся в тупик — и вам придётся решить, чего не хватает.</p></div>${button('Попробовать закрыть дело','conclusion','ghost')}</section></main>${evidenceRail()}</div>`;

  const cleanDiagram=()=>`<div class="mi-diagram" aria-label="Условная схема третьего этажа"><div class="mi-building"><div class="mi-apartment-label">КВАРТИРА · 3 ЭТАЖ</div><div class="mi-door-shape"><span>дверь</span></div><div class="mi-landing-shape"><span>площадка пожарной лестницы</span><i class="mi-victim-dot"></i></div><div class="mi-lower-shape"><span>ниже / снаружи</span></div></div><div class="mi-down-arrow">↓ <span>нисходящее направление</span></div><p>Условная схема, не в масштабе. Она не воспроизводит точную планировку квартиры.</p></div>`;

  const inferenceChoices=(name,current,items)=>`<div class="mi-inference">${items.map(([id,title,text])=>`<label class="mi-inference-card${current===id?' is-selected':''}"><input type="radio" name="${name}" value="${id}"${current===id?' checked':''}><strong>${esc(title)}</strong><span>${esc(text)}</span></label>`).join('')}</div>`;

  const forensics=()=>`${topbar('Назначенная экспертиза')}<div class="mi-workspace"><main class="mi-main"><p class="mi-eyebrow">Криминалистическая реконструкция · 2020</p><h1 class="mi-screen-title">ЭКСПЕРТЫ ВЕРНУЛИСЬ НА АДРЕС</h1><p class="mi-lead">Вы заказали реконструкцию сцены. Эксперты восстановили положение Патриции на площадке и сопоставили его с положением входного ранения и направлением пули.</p><div class="mi-report"><div><small>ЭКСПЕРТНОЕ ЗАКЛЮЧЕНИЕ · ИСХОДНЫЕ ДАННЫЕ</small><h2>Что известно до вашего вывода</h2><ul><li>Патриция находилась на площадке пожарной лестницы третьего этажа.</li><li>Входное ранение и путь пули дали <strong>нисходящее направление</strong>.</li><li>Публичное описание не даёт точного угла в градусах — мы его не придумываем.</li></ul></div>${cleanDiagram()}</div><section class="mi-reason"><h2>Теперь ваш вывод: откуда наиболее совместим выстрел?</h2><p>Сначала зафиксируйте собственную интерпретацию. Только после этого откроется контрольный вывод экспертов.</p>${inferenceChoices('trajectoryInference',state.trajectoryInference,[['door','Район дверного проёма','Стрелявший находился у выхода из квартиры, выше положения головы жертвы.'],['landing','Сама площадка','Стрелявший находился рядом с Патрицией на одном уровне.'],['outside','Ниже или снаружи','Выстрел пришёл снизу по пожарной лестнице или с улицы.']])}<div class="mi-actions">${button('Сверить с заключением экспертов','finish-forensics','primary',!state.trajectoryInference)}${button('Вернуться без результата','desk','quiet')}</div></section></main>${evidenceRail()}</div>`;

  const forensicsResult=()=>`${topbar('Экспертиза завершена')}<section class="mi-result"><span class="mi-result-mark">↘</span><p class="mi-eyebrow">Контрольный вывод экспертов</p><h1>${state.trajectoryInference==='door'?'ВАША ГЕОМЕТРИЯ СОВПАЛА':'ВАША ВЕРСИЯ РАСХОДИТСЯ С РЕКОНСТРУКЦИЕЙ'}</h1><p>Официальная реконструкция установила: путь пули был совместим с выстрелом человеком, стоявшим <strong>в районе дверного проёма квартиры</strong>.</p><p>${state.trajectoryInference==='door'?'Вы получили физическую связь между местом выстрела и квартирой. Но это ещё не идентифицирует человека.':'Это не «неправильный ответ» ради теста. В вашем деле теперь есть конфликт между собственной интерпретацией и экспертной реконструкцией — его придётся учитывать дальше.'}</p><div class="mi-actions">${button('Вернуться к следственному столу','desk')}</div>${sourceNote('Реконструкция 2020 года и её вывод описаны Middlesex District Attorney.')}</section>`;

  const witness=()=>`${topbar('Поиск свидетелей')}<div class="mi-workspace"><main class="mi-main"><p class="mi-eyebrow">Повторный поиск · соседние этажи</p><h1 class="mi-screen-title">СВИДЕТЕЛЬ ЭТАЖОМ НИЖЕ</h1><div class="mi-report mi-report-single"><small>РЕЗУЛЬТАТ ВАШЕГО ДЕЙСТВИЯ</small><p>Удалось найти человека, который в 1991 году жил на втором этаже и долго находился за пределами США.</p><ul><li>После громкого звука он сразу посмотрел на пожарную лестницу.</li><li>Увидел молодую женщину, тяжело дышавшую на площадке третьего этажа.</li><li>Над ней стоял мужчина.</li><li>Мужчина немедленно ушёл обратно в квартиру и закрыл дверь.</li><li>Его описание соответствовало бойфренду старшей дочери.</li></ul></div><section class="mi-reason"><h2>Что это действительно доказывает?</h2>${inferenceChoices('witnessInference',state.witnessInference,[['scene','Связывает мужчину со сценой сразу после выстрела','Свидетель не описывает сам момент выстрела, но резко сужает временную и пространственную версию.'],['guilt','Само по себе доказывает, что он стрелял','Наличие мужчины над пострадавшей автоматически равно доказанному выстрелу.'],['weak','Почти ничего','Показание слишком позднее, поэтому его можно полностью отбросить без сопоставления.']])}<div class="mi-actions">${button('Зафиксировать вывод и вернуться','finish-witness','primary',!state.witnessInference)}${button('Вернуться без результата','desk','quiet')}</div></section>${sourceNote('Содержание поздно найденного свидетеля — официальное описание Middlesex DA.')}</main>${evidenceRail()}</div>`;

  const weapons=()=>`${topbar('Проверка оружия')}<div class="mi-workspace"><main class="mi-main"><p class="mi-eyebrow">Фоновая проверка</p><h1 class="mi-screen-title">.38 И ПРЕДЫСТОРИЯ</h1><div class="mi-report mi-report-single"><small>РЕЗУЛЬТАТ ВАШЕГО ДЕЙСТВИЯ</small><ul><li>Полиция установила: бойфренд старшей дочери владел несколькими пистолетами близко ко времени убийства.</li><li>Среди них было оружие, совместимое с револьвером .38 калибра.</li><li>Следствие также получило сведения об угрожающем поведении в отношении Патриции в недели до её смерти.</li></ul></div><section class="mi-reason"><h2>Какой вес вы этому даёте?</h2>${inferenceChoices('weaponsInference',state.weaponsInference,[['support','Усиливает возможность и мотив, но не помещает его у двери','Это поддерживающая линия: доступ к совместимому оружию плюс предыстория угроз.'],['proof','Это уже прямое доказательство убийства','Совместимый калибр автоматически идентифицирует конкретное оружие и стрелка.'],['none','Не имеет значения','Доступ к совместимому оружию и угрозы не должны влиять на версию вообще.']])}<div class="mi-actions">${button('Зафиксировать вывод и вернуться','finish-weapons','primary',!state.weaponsInference)}${button('Вернуться без результата','desk','quiet')}</div></section>${sourceNote('Оружие и угрожающее поведение описаны в официальном сообщении о приговоре.','conviction')}</main>${evidenceRail()}</div>`;

  const alibi=()=>`${topbar('Проверка алиби')}<div class="mi-workspace"><main class="mi-main"><p class="mi-eyebrow">Версия 1991 года</p><h1 class="mi-screen-title">«Я СПАЛ В КРЕСЛЕ»</h1><div class="mi-split-report"><article class="mi-report mi-report-single"><small>СЛОВА БОЙФРЕНДА</small><p>Он заявил полиции, что спал в кресле в гостиной, проснулся от двух выстрелов, вышел на пожарную лестницу и нашёл Патрицию.</p></article><article class="mi-report mi-report-single mi-report-late"><small>ЧТО ДАЛА ВАША ПРОВЕРКА</small><p>Позднее друзья и родственники женщины, которая защищала его в 1991 году, сообщили: она признавалась, что лгала полиции и большому жюри, а также рассказывала о спрятанном в кресле и затем уничтоженном оружии.</p></article></div><section class="mi-reason"><h2>Что ломается прежде всего?</h2>${inferenceChoices('alibiInference',state.alibiInference,[['alibi','Надёжность алиби и независимость его подтверждения','Ключевой результат — прежняя защитная версия перестаёт быть независимой опорой.'],['trajectory','Физическая траектория пули','Признание женщины меняет направление пули.'],['nothing','Ничего существенного','Ложь ключевого алиби-свидетеля не влияет на оценку версии.']])}<div class="mi-actions">${button('Зафиксировать вывод и вернуться','finish-alibi','primary',!state.alibiInference)}${button('Вернуться без результата','desk','quiet')}</div></section>${sourceNote('Поздние признания алиби-свидетеля приведены в официальном сообщении о приговоре.','conviction')}</main>${evidenceRail()}</div>`;

  const conclusion=()=>{
    const support=state.completed.filter(id=>['witness','weapons','alibi'].includes(id)).length;
    return `${topbar('Ваша версия')}<div class="mi-workspace"><main class="mi-main"><p class="mi-eyebrow">Вы сами решили, что уже готовы</p><h1 class="mi-screen-title">ЗАКРЫВАЕТСЯ ЛИ ДЕЛО?</h1><p class="mi-lead">На экране нет списка «что вы забыли». Сформулируйте рабочую версию из того, что вы сами назначили и получили.</p><div class="mi-case-state"><div><small>Криминалистика</small><strong>${has('forensics')?'получена':'не заказывалась'}</strong></div><div><small>Другие проверенные линии</small><strong>${support}</strong></div></div><section class="mi-reason"><h2>Кто или что остаётся основной версией?</h2>${inferenceChoices('finalTheory',state.finalTheory,[['boyfriend','Бойфренд старшей дочери','Совокупность материалов указывает на человека, находившегося внутри квартиры.'],['outsider','Неизвестный внешний стрелок','Главной остаётся версия человека снаружи дома.'],['accident','Случайный выстрел / самострел','Нет достаточных оснований считать это умышленным выстрелом другого человека.']])}<h2>Что вы делаете?</h2>${inferenceChoices('finalAction',state.finalAction,[['warrant','Готов добиваться ареста по этой версии','Считаю физическую и свидетельскую картину достаточно связной для следующего процессуального шага.'],['continue','Продолжать расследование','Версия сильная, но я пока не считаю её достаточно закрытой.']])}<div class="mi-actions">${button('Передать решение','submit-conclusion','primary',!(state.finalTheory&&state.finalAction))}${button('Вернуться к столу','desk','quiet')}</div></section></main>${evidenceRail()}</div>`;
  };

  const deadend=()=>{
    const reasons={
      forensics:['НЕ ЗАКРЫТ ГЛАВНЫЙ ВОПРОС СЦЕНЫ','Вы пытаетесь закончить дело, не проверив, откуда физически мог быть произведён выстрел. Показания, оружие и алиби могут указывать на человека, но у вашей версии остаётся дыра в самой сцене.','Вернуться к столу и решить, нужна ли экспертиза'],
      geometry:['ВАША ГЕОМЕТРИЯ НЕ СВЯЗЫВАЕТ ВЫСТРЕЛ С КВАРТИРОЙ','Вы заказали реконструкцию, но собственный вывод оставил стрелка на площадке или снаружи. При такой версии остальные материалы не складываются в одну непротиворечивую картину.','Вернуться к материалам'],
      corroboration:['ЕСТЬ ТРАЕКТОРИЯ, НО НЕТ ДОСТАТОЧНОЙ ПРОВЕРКИ ЧЕЛОВЕКА','Физическая версия ведёт к дверному проёму, но вы почти не проверили свидетелей, оружие или алиби. Геометрия показывает место — не личность.','Вернуться и проверить хотя бы две независимые линии']
    };
    const [title,text,cta]=reasons[state.deadendReason]||reasons.corroboration;
    return `${topbar('Тупик')}<section class="mi-deadend"><span>×</span><p class="mi-eyebrow">Это результат ваших решений</p><h1>${esc(title)}</h1><p>${esc(text)}</p><p class="mi-deadend-note">Игра не штрафует вас и не раскрывает правильный маршрут. Она показывает, какой вопрос ваша версия оставила без ответа.</p><div class="mi-actions">${button(cta,'desk')}</div></section>`;
  };

  const reveal=()=>`${topbar('Реальный исход')}<section class="mi-reveal"><div class="mi-reveal-photo"><img src="${OFFICIAL_PHOTO}" alt="Патриция Морено"></div><div><p class="mi-eyebrow">Теперь открываем имя</p><h1>RODNEY DANIELS</h1><p>Мужчина, которого в вашем досье мы называли бойфрендом старшей дочери, — Rodney Daniels. Его арестовали в сентябре 2021 года. После шестидневного процесса 16 августа 2023 года присяжные признали его виновным в убийстве первой степени.</p><p>Официальная версия обвинения опиралась на совокупность реконструкции траектории, поздно найденного свидетеля, сведений об оружии и угрозах и информации о ложном алиби.</p><div class="mi-outcome"><div><small>Ваша версия</small><strong>${state.finalTheory==='boyfriend'?'бойфренд старшей дочери':state.finalTheory==='outsider'?'внешний стрелок':'случайный выстрел / самострел'}</strong></div><div><small>Ваше действие</small><strong>${state.finalAction==='warrant'?'добиваться ареста':'продолжать расследование'}</strong></div></div><div class="mi-ledger"><a href="${SOURCES.arrest}" target="_blank" rel="noopener noreferrer">Арест и реконструкция · Middlesex DA ↗</a><a href="${SOURCES.conviction}" target="_blank" rel="noopener noreferrer">Приговор 2023 · Middlesex DA ↗</a></div><div class="mi-actions">${button('Пройти заново','reset','ghost')}</div></div></section>`;

  const render=()=>{
    const renderer={opening,desk,forensics,forensicsResult,witness,weapons,alibi,conclusion,deadend,reveal}[state.stage]||opening;
    app.innerHTML=`<div class="mi-shell">${renderer()}</div>`;
    bind();
  };

  const bindRadio=(name,key)=>app.querySelectorAll(`input[name="${name}"]`).forEach(input=>input.addEventListener('change',()=>{state[key]=input.value;save();render()}));
  const bind=()=>{
    app.querySelector('[data-action="accept"]')?.addEventListener('click',()=>setStage('desk'));
    app.querySelectorAll('[data-action="desk"]').forEach(btn=>btn.addEventListener('click',()=>setStage('desk')));
    app.querySelectorAll('[data-order]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.order;markOrdered(id);save();setStage(id)}));
    app.querySelector('[data-action="conclusion"]')?.addEventListener('click',()=>setStage('conclusion'));

    bindRadio('trajectoryInference','trajectoryInference');
    app.querySelector('[data-action="finish-forensics"]')?.addEventListener('click',()=>{if(!state.trajectoryInference)return;markDone('forensics');save();setStage('forensicsResult')});

    bindRadio('witnessInference','witnessInference');
    app.querySelector('[data-action="finish-witness"]')?.addEventListener('click',()=>{if(!state.witnessInference)return;markDone('witness');save();setStage('desk')});

    bindRadio('weaponsInference','weaponsInference');
    app.querySelector('[data-action="finish-weapons"]')?.addEventListener('click',()=>{if(!state.weaponsInference)return;markDone('weapons');save();setStage('desk')});

    bindRadio('alibiInference','alibiInference');
    app.querySelector('[data-action="finish-alibi"]')?.addEventListener('click',()=>{if(!state.alibiInference)return;markDone('alibi');save();setStage('desk')});

    bindRadio('finalTheory','finalTheory');
    bindRadio('finalAction','finalAction');
    app.querySelector('[data-action="submit-conclusion"]')?.addEventListener('click',()=>{
      if(!(state.finalTheory&&state.finalAction)) return;
      const support=state.completed.filter(id=>['witness','weapons','alibi'].includes(id)).length;
      if(!has('forensics')){state.deadendReason='forensics';setStage('deadend');return;}
      if(state.trajectoryInference!=='door'){state.deadendReason='geometry';setStage('deadend');return;}
      if(support<2){state.deadendReason='corroboration';setStage('deadend');return;}
      state.revealSeen=true;save();setStage('reveal');
    });
    app.querySelector('[data-action="reset"]')?.addEventListener('click',()=>{if(confirm('Начать расследование заново?')){localStorage.removeItem(STORAGE_KEY);state=defaultState();render();window.scrollTo({top:0,behavior:'smooth'})}});
  };

  const smokeStage=()=>{
    try{
      const params=new URLSearchParams(location.search);
      const local=location.hostname==='127.0.0.1'||location.hostname==='localhost';
      if(!local||!params.has('smokeStage'))return;
      const stage=params.get('smokeStage');
      state=defaultState();
      state.stage=stage;
      if(['forensics','forensicsResult','conclusion','deadend','reveal'].includes(stage)){
        state.ordered=['forensics'];state.completed=['forensics'];state.trajectoryInference='door';
      }
      if(['witness','conclusion','deadend','reveal'].includes(stage)){
        state.ordered.push('witness');if(!state.completed.includes('witness'))state.completed.push('witness');state.witnessInference='scene';
      }
      if(['weapons','conclusion','reveal'].includes(stage)){
        state.ordered.push('weapons');if(!state.completed.includes('weapons'))state.completed.push('weapons');state.weaponsInference='support';
      }
      if(['alibi','conclusion','reveal'].includes(stage)){
        state.ordered.push('alibi');if(!state.completed.includes('alibi'))state.completed.push('alibi');state.alibiInference='alibi';
      }
      if(stage==='deadend'){state.completed=state.completed.filter(x=>x!=='forensics');state.trajectoryInference='';state.deadendReason='forensics'}
      if(stage==='reveal'){state.finalTheory='boyfriend';state.finalAction='warrant';state.revealSeen=true}
    }catch{}
  };

  smokeStage();
  render();
  window.MLMorenoInvestigator={version:VERSION,getState:()=>JSON.parse(JSON.stringify(state)),reset(){localStorage.removeItem(STORAGE_KEY);state=defaultState();render()}};
})();
