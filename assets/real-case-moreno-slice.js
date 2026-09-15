(()=>{
  'use strict';

  const VERSION='0.1.0';
  const STORAGE_KEY='ml-realcase-moreno-slice-v1';
  const app=document.querySelector('[data-moreno-app]');
  if(!app) return;

  const OFFICIAL_PHOTO='https://www.middlesexda.com/sites/g/files/vyhlif11841/f/styles/news_image/public/news/capture_3.jpg?itok=RK3zkJ6R';
  const SOURCES={
    arrest:'https://www.middlesexda.com/press-releases/news/middlesex-district-attorney-and-malden-police-announce-arrest-30-year-old-murder',
    conviction:'https://www.middlesexda.com/press-releases/news/man-convicted-first-degree-murder-connection-32-year-old-murder-patricia-moreno'
  };

  const STAGES=['opening','scene','trajectory','trajectoryResult','occupants','alibi','investigate','synthesis','reveal'];
  const progressFor=(stage)=>Math.round((Math.max(0,STAGES.indexOf(stage))/(STAGES.length-1))*100);
  const defaultState=()=>({
    stage:'opening',
    initialTheory:'',
    trajectoryZone:'',
    occupantsAssessment:'',
    alibiAssessment:'',
    openedLines:[],
    lineInterpretations:{},
    strongestEvidence:'',
    finalDecision:'',
    revealSeen:false
  });
  const load=()=>{try{return {...defaultState(),...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch{return defaultState()}};
  let state=load();
  const save=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  const esc=(value='')=>String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  const boardItems=()=>{
    const items=[
      ['СЦЕНА','Патриция найдена на площадке пожарной лестницы третьего этажа с одним огнестрельным ранением головы.'],
      ['СЦЕНА','На месте не нашли ни оружия, ни гильзы. Позже из тела извлекли пулю, совместимую с оружием калибра .38.'],
      ['ВХОД','Следов насильственного проникновения в квартиру не обнаружено.']
    ];
    if(STAGES.indexOf(state.stage)>=STAGES.indexOf('trajectoryResult')) items.push(['РЕКОНСТРУКЦИЯ 2020','Направление входного ранения и нисходящая траектория совместимы с выстрелом из района дверного проёма квартиры.']);
    if(STAGES.indexOf(state.stage)>=STAGES.indexOf('occupants')) items.push(['КРУГ ЛИЦ','В квартире находились приёмная мать, две её дочери-подростка и бойфренд старшей дочери.']);
    if(STAGES.indexOf(state.stage)>=STAGES.indexOf('alibi')) items.push(['ВЕРСИЯ БОЙФРЕНДА','Он утверждал, что спал в кресле в гостиной, проснулся от двух выстрелов и затем вышел на пожарную лестницу, где нашёл Патрицию.']);
    if(state.openedLines.includes('witness')) items.push(['СВИДЕТЕЛЬ ЭТАЖОМ НИЖЕ','После громкого звука он увидел Патрицию, тяжело дышавшую на пожарной лестнице, и мужчину над ней; мужчина затем ушёл обратно в квартиру.']);
    if(state.openedLines.includes('weapons')) items.push(['ОРУЖИЕ / ПОВЕДЕНИЕ','Следствие установило, что бойфренд владел несколькими пистолетами примерно в тот период, включая оружие, совместимое с .38; также были сведения об угрозах Патриции в предшествующие недели.']);
    if(state.openedLines.includes('alibi')) items.push(['АЛИБИ','Позднее женщина, защищавшая бойфренда в 1991 году, призналась близким, что лгала полиции и большому жюри; по её словам, он спрятал оружие в кресле и затем избавился от него.']);
    return items;
  };

  const topbar=(label)=>`<div class="ms-topbar"><div class="ms-case-id"><strong>CASE 91-M</strong><span>реальное дело · Malden</span></div><div class="ms-step">${esc(label)}</div></div><div class="ms-progress"><span style="width:${progressFor(state.stage)}%"></span></div>`;
  const actions=(primaryLabel,primaryAction,disabled=false,secondary='')=>`<div class="ms-actions"><button class="ms-button ms-button-primary" type="button" data-action="${primaryAction}"${disabled?' disabled':''}>${esc(primaryLabel)}</button>${secondary}</div>`;
  const sourceNote=(text,source='arrest')=>`<p class="ms-source-note">${esc(text)} <a href="${SOURCES[source]}" target="_blank" rel="noopener noreferrer">Официальный источник ↗</a></p>`;

  const boardHtml=()=>{
    const items=boardItems();
    return `<aside class="ms-board" data-board><div class="ms-board-head"><strong>Материалы на столе</strong><span>${items.length}</span></div><div class="ms-board-list">${items.map(([kind,text])=>`<div class="ms-board-item"><small>${esc(kind)}</small><p>${esc(text)}</p></div>`).join('')}</div></aside>`;
  };
  const mobileBoardButton=()=>`<button class="ms-button ms-button-secondary ms-mobile-board-button" type="button" data-action="toggle-board">Материалы на столе · ${boardItems().length}</button>`;

  const opening=()=>`${topbar('Вход')}<section class="ms-stage"><div class="ms-opening"><div class="ms-opening-copy"><p class="ms-eyebrow">20 июля 1991 · около 03:00</p><h1 class="ms-title">ДЕВУШКА НА ПОЖАРНОЙ ЛЕСТНИЦЕ</h1><p class="ms-lead">Семнадцатилетнюю Патрицию Морено находят на площадке пожарной лестницы третьего этажа. Она ещё жива, но получила тяжёлое огнестрельное ранение головы.</p><div class="ms-opening-facts"><div><strong>1 ранение</strong><span>огнестрельное · голова</span></div><div><strong>0 оружия</strong><span>на месте не найдено</span></div><div><strong>0 гильз</strong><span>на месте не найдено</span></div></div><div class="ms-copy"><p>В квартире за дверью находятся четыре человека. Они говорят, что слышали два выстрела, но не знают, кто стрелял. Следов взлома нет.</p><p>Это реальное дело. Но сейчас у вас нет имени обвиняемого и нет готовой версии. Сначала придётся решить, <strong>откуда вообще мог быть произведён выстрел</strong>.</p></div>${actions('Войти в квартиру','start')}${sourceNote('Исходные обстоятельства — по материалам Middlesex District Attorney.')}</div><div class="ms-opening-visual"><img src="${OFFICIAL_PHOTO}" alt="Патриция Морено"><div class="ms-photo-caption">Патриция Морено, 17 лет. Фотография опубликована Middlesex District Attorney’s Office. Здесь она используется как документальный визуальный якорь, а не как реконструкция сцены.</div></div></div></section>`;

  const scene=()=>{
    const options=[
      ['outside','Линия снаружи','Стрелок мог находиться на пожарной лестнице или ниже и уйти, не входя в квартиру.'],
      ['inside','Линия из квартиры','Выстрел мог быть произведён человеком, который уже находился внутри квартиры.'],
      ['accident','Несчастный случай / самострел','Оружие могло оказаться у самой Патриции или выстрел мог быть случайным.']
    ];
    return `${topbar('Ход 1 · первичная версия')}<section class="ms-stage"><div class="ms-stage-inner"><p class="ms-eyebrow">Сначала — ваша версия</p><h1 class="ms-title">КАК ЭТО МОГЛО ПРОИЗОЙТИ?</h1><p class="ms-lead">Не пытайтесь угадать человека. Выберите пространственную версию, которую проверили бы первой, имея только исходную сцену.</p><div class="ms-task-banner"><span class="ms-task-no">1</span><div><strong>Зафиксируйте исходную гипотезу.</strong><p>Позже мы сравним её с реконструкцией траектории. Неправильная версия не блокирует игру — важно, измените ли вы её после новых данных.</p></div></div><div class="ms-choice-grid">${options.map(([id,title,text])=>`<label class="ms-choice-card${state.initialTheory===id?' is-selected':''}"><input type="radio" name="initialTheory" value="${id}"${state.initialTheory===id?' checked':''}><small>версия</small><strong>${esc(title)}</strong><span>${esc(text)}</span></label>`).join('')}</div>${actions('Проверить версию по сцене','to-trajectory',!state.initialTheory,'<button class="ms-button ms-button-quiet" type="button" data-action="back-opening">Назад</button>')}</div></section>`;
  };

  const schematic=(trajectoryVisible=false)=>`<div class="ms-scene"><div class="ms-apartment"><div class="ms-door"></div></div><div class="ms-fireescape"></div><div class="ms-victim-mark"></div>${trajectoryVisible?'<div class="ms-trajectory-line"></div>':''}<button class="ms-zone${state.trajectoryZone==='door'?' is-selected':''}" type="button" data-zone="door">ЗОНА A<br>дверной проём</button><button class="ms-zone${state.trajectoryZone==='landing'?' is-selected':''}" type="button" data-zone="landing">ЗОНА B<br>площадка</button><button class="ms-zone${state.trajectoryZone==='below'?' is-selected':''}" type="button" data-zone="below">ЗОНА C<br>ниже / снаружи</button><div class="ms-scene-foot">Схема не в масштабе. Показаны только отношения, необходимые для задания; планировка комнаты не реконструируется.</div></div>`;

  const trajectory=()=>`${topbar('Ход 2 · траектория')}<div class="ms-workspace"><section class="ms-stage ms-workspace-main"><div class="ms-stage-inner"><p class="ms-eyebrow">Реконструкция 2020 года</p><h1 class="ms-title">ОТКУДА МОГЛИ СТРЕЛЯТЬ?</h1><p class="ms-lead">Через 29 лет криминалисты вернулись на адрес и восстановили положение Патриции. Известно два ключевых параметра: положение входного ранения и <strong>нисходящее направление пули</strong>.</p><div class="ms-task-banner"><span class="ms-task-no">2</span><div><strong>Выберите наиболее совместимую зону.</strong><p>Смотрите не на подозреваемых, а только на геометрию. Точная планировка в деле здесь не нужна.</p></div></div><div class="ms-scene-wrap">${schematic(false)}<div class="ms-fact-panel"><div class="ms-fact-card"><small>Факт 01</small><strong>Патриция лежала на площадке пожарной лестницы третьего этажа.</strong></div><div class="ms-fact-card"><small>Факт 02</small><strong>Траектория пули была нисходящей.</strong><p>Это результат поздней криминалистической реконструкции.</p></div><div class="ms-fact-card"><small>Факт 03</small><strong>Следов насильственного проникновения в квартиру не было.</strong></div></div></div>${actions('Зафиксировать точку выстрела','submit-trajectory',!state.trajectoryZone)}${mobileBoardButton()}</div></section>${boardHtml()}</div>`;

  const trajectoryResult=()=>{
    const match=state.trajectoryZone==='door';
    const initial=state.initialTheory==='inside'?'Вы изначально держали открытой линию из квартиры.':state.initialTheory==='outside'?'Вы изначально ставили на линию снаружи.':'Вы изначально держали открытой версию случайного/самопроизвольного выстрела.';
    const shift=state.initialTheory==='inside'?'Новая реконструкция усиливает вашу исходную версию, но пока не называет стрелка.':'Новая реконструкция требует пересмотреть исходную версию: теперь область дверного проёма становится ключевой.';
    return `${topbar('Новый факт')}<section class="ms-stage"><div class="ms-interstitial${match?'':' is-alert'}"><div><span class="ms-interstitial-mark">↘</span><p class="ms-eyebrow">Реконструкция следствия</p><h1>ТРАЕКТОРИЯ ВЕДЁТ К ДВЕРИ</h1><p>Официальная реконструкция 2020 года пришла к выводу: путь пули совместим с выстрелом человеком, стоявшим в районе дверного проёма квартиры.</p><p><strong>${esc(initial)}</strong> ${esc(shift)}</p>${actions('Кто мог быть у двери?','to-occupants')}${sourceNote('Вывод о зоне выстрела — из официального описания реконструкции 2020 года.')}</div></div></section>`;
  };

  const occupants=()=>{
    const assessment=[
      ['boyfriend','Проверять только бойфренда','Он единственный мужчина среди четырёх жильцов, но мужской пол сам по себе ещё ничего не доказывает.'],
      ['all','Пока не исключать никого из квартиры','Траектория указывает на область двери, но не идентифицирует конкретного человека.'],
      ['outside','Вернуться к неизвестному внешнему стрелку','Несмотря на реконструкцию, считать внешнюю линию основной.']
    ];
    return `${topbar('Ход 3 · круг лиц')}<div class="ms-workspace"><section class="ms-stage ms-workspace-main"><div class="ms-stage-inner"><p class="ms-eyebrow">Квартира за дверью</p><h1 class="ms-title">КОГО МОЖНО ИСКЛЮЧИТЬ?</h1><p class="ms-lead">Внутри находились четыре человека. Все утверждали, что слышали пару выстрелов, но не знали стрелка. Следов взлома нет.</p><div class="ms-people"><div class="ms-person"><small>жила в квартире</small><strong>Приёмная мать</strong><p>На момент прибытия полиции находилась дома.</p></div><div class="ms-person"><small>жила в квартире</small><strong>Старшая дочь</strong><p>Подросток. Её бойфренд также находился в доме.</p></div><div class="ms-person"><small>жила в квартире</small><strong>Младшая дочь</strong><p>Подросток. Также находилась дома.</p></div><div class="ms-person is-focus"><small>гость / жил там в ту ночь</small><strong>Бойфренд старшей дочери</strong><p>Позже сообщил полиции свою версию событий.</p></div></div><div class="ms-task-banner"><span class="ms-task-no">3</span><div><strong>Как меняется круг проверки?</strong><p>Выберите не «кого подозреваете», а кого имеющиеся данные уже позволяют исключить.</p></div></div><div class="ms-choice-grid">${assessment.map(([id,title,text])=>`<label class="ms-choice-card${state.occupantsAssessment===id?' is-selected':''}"><input type="radio" name="occupantsAssessment" value="${id}"${state.occupantsAssessment===id?' checked':''}><small>рабочее решение</small><strong>${esc(title)}</strong><span>${esc(text)}</span></label>`).join('')}</div>${actions('Проверить первую версию одного жильца','to-alibi',!state.occupantsAssessment)}${mobileBoardButton()}</div></section>${boardHtml()}</div>`;
  };

  const alibi=()=>{
    const options=[
      ['proven','Это уже полноценное алиби','Если человек говорит, что спал, его можно исключить без дополнительной проверки.'],
      ['possible','Версия пока возможна, но ничем не подтверждена','Она не противоречит сцене сама по себе, но требует независимой проверки.'],
      ['contradicted','Траектория уже опровергает его слова','Сам факт зоны дверного проёма доказывает, что он не мог спать.']
    ];
    return `${topbar('Ход 4 · алиби')}<div class="ms-workspace"><section class="ms-stage ms-workspace-main"><div class="ms-stage-inner"><p class="ms-eyebrow">Интервью 1991 · краткий пересказ</p><h1 class="ms-title">«Я СПАЛ В КРЕСЛЕ»</h1><div class="ms-alibi"><article class="ms-quote"><small>Версия бойфренда старшей дочери</small><blockquote>Он сообщил полиции, что спал в кресле в гостиной, проснулся от звука двух выстрелов, вышел на пожарную лестницу и увидел там Патрицию.</blockquote><p>Это парафраз официального описания интервью, не дословная цитата.</p></article><div class="ms-reason-panel"><h3>Что эта версия доказывает сейчас?</h3><p>Не оценивайте человека по ощущению. Сопоставьте только с уже известной сценой.</p><div class="ms-choice-grid" style="grid-template-columns:1fr">${options.map(([id,title,text])=>`<label class="ms-choice-card${state.alibiAssessment===id?' is-selected':''}"><input type="radio" name="alibiAssessment" value="${id}"${state.alibiAssessment===id?' checked':''}><strong>${esc(title)}</strong><span>${esc(text)}</span></label>`).join('')}</div></div></div>${actions('Выбрать две линии проверки','to-investigate',!state.alibiAssessment)}${mobileBoardButton()}${sourceNote('Версия о кресле и двух выстрелах изложена в официальных материалах дела.')}</div></section>${boardHtml()}</div>`;
  };

  const lineData={
    witness:{label:'Линия 01',title:'Сосед этажом ниже',intro:'В 2020 следователи нашли человека, которого не удавалось полноценно использовать раньше.',result:'Он сообщил, что после громкого звука посмотрел на пожарную лестницу: Патриция тяжело дышала, над ней стоял мужчина. Затем мужчина ушёл обратно в квартиру. Его описание соответствовало внешности бойфренда старшей дочери.',question:'Что это меняет?',choices:[['inside','Усиливает линию человека из квартиры'],['outside','Усиливает внешнего стрелка'],['none','Ничего не меняет']]},
    weapons:{label:'Линия 02',title:'Оружие и угрозы',intro:'Проверка доступа к оружию и поведения в недели до убийства.',result:'Следствие установило, что бойфренд имел несколько пистолетов близко ко времени убийства, включая оружие, совместимое с револьвером .38. Также были сведения об угрожающем поведении в отношении Патриции.',question:'Насколько это сильный вывод?',choices:[['access','Показывает доступ и контекст, но само по себе не доказывает выстрел'],['proof','Само по себе доказывает, что стрелял он'],['irrelevant','Калибр и угрозы не имеют отношения к версии']]},
    alibi:{label:'Линия 03',title:'Женщина, которая давала алиби',intro:'Поздние признания человека, который в 1991 году защищал бойфренда.',result:'По данным следствия, позднее она призналась друзьям и родственникам, что лгала полиции и большому жюри, чтобы защитить его. Она говорила, что он убил Патрицию, спрятал оружие внутри кресла и затем избавился от него.',question:'Что ломается прежде всего?',choices:[['credibility','Надёжность алиби и версия о кресле'],['trajectory','Только реконструкция траектории'],['nothing','Ничего: признание третьим лицам не влияет на алиби']]}
  };
  const expectedInterpretation={witness:'inside',weapons:'access',alibi:'credibility'};

  const investigate=()=>{
    const processed=state.openedLines.filter(id=>state.lineInterpretations[id]).length;
    return `${topbar('Ход 5 · дополнительные проверки')}<div class="ms-workspace"><section class="ms-stage ms-workspace-main"><div class="ms-stage-inner"><p class="ms-eyebrow">Не открывайте всё автоматически</p><h1 class="ms-title">КАКИЕ ДВЕ ЛИНИИ ВЫ ПРОВЕРИТЕ?</h1><p class="ms-lead">Выберите минимум две. После открытия каждой придётся сказать, <strong>как именно она меняет вашу версию</strong>. Материал появится на столе и останется доступным.</p><div class="ms-line-grid">${Object.entries(lineData).map(([id,line])=>{const open=state.openedLines.includes(id);const interpretation=state.lineInterpretations[id]||'';return `<article class="ms-line-card${open?' is-open':''}"><small>${line.label}</small><h3>${line.title}</h3><p>${line.intro}</p>${open?`<div class="ms-line-result">${line.result}</div><div class="ms-task-banner" style="grid-template-columns:1fr;margin-top:14px;padding:14px"><div><strong>${line.question}</strong></div></div><div class="ms-choice-grid" style="grid-template-columns:1fr;margin-top:10px">${line.choices.map(([value,text])=>`<label class="ms-choice-card${interpretation===value?' is-selected':''}" style="min-height:auto;padding:14px"><input type="radio" name="line-${id}" value="${value}" data-line-interpret="${id}"${interpretation===value?' checked':''}><strong>${esc(text)}</strong></label>`).join('')}</div>`:`<button class="ms-button ms-button-secondary" type="button" data-line-open="${id}">Проверить эту линию</button>`}</article>`}).join('')}</div><div class="ms-feedback${processed>=2?' is-good':''}">${processed>=2?'Две линии уже не просто открыты — вы зафиксировали, как они влияют на версию. Можно собирать вывод.':`Интерпретировано линий: ${processed}/2. Просто открыть карточку недостаточно.`}</div>${actions('Собрать свою версию','to-synthesis',processed<2)}${mobileBoardButton()}</div></section>${boardHtml()}</div>`;
  };

  const synthesis=()=>{
    const available=[['trajectory','Траектория к дверному проёму','Пространственно связывает выстрел с квартирой.']];
    if(state.openedLines.includes('witness')) available.push(['witness','Свидетель этажом ниже','Видел мужчину над Патрицией и его уход обратно в квартиру.']);
    if(state.openedLines.includes('weapons')) available.push(['weapons','Доступ к .38 и угрозы','Добавляет доступ к подходящему оружию и контекст.']);
    if(state.openedLines.includes('alibi')) available.push(['alibi','Ложное алиби / история с креслом','Подрывает первоначальную защитную версию.']);
    const decisions=[['warrant','Я бы считал оснований достаточно, чтобы добиваться ареста бойфренда старшей дочери.'],['continue','Версия против него сильная, но перед арестом я бы продолжил проверку.'],['other','Я бы пока держал основной линией неизвестного внешнего стрелка.']];
    return `${topbar('Ход 6 · собственный вывод')}<div class="ms-workspace"><section class="ms-stage ms-workspace-main"><div class="ms-stage-inner"><p class="ms-eyebrow">До официального исхода</p><h1 class="ms-title">СОБЕРИТЕ ВЕРСИЮ</h1><p class="ms-lead">Теперь впервые нужно не открыть ещё один материал, а <strong>принять решение на уже собранном</strong>.</p><div class="ms-task-banner"><span class="ms-task-no">6</span><div><strong>Выберите главное доказательство своей версии.</strong><p>Не «самое страшное», а то, без чего ваша логическая цепочка сильнее всего развалится.</p></div></div><div class="ms-evidence-pick">${available.map(([id,title,text])=>`<label class="ms-evidence-check"><input type="radio" name="strongestEvidence" value="${id}"${state.strongestEvidence===id?' checked':''}><strong>${esc(title)}</strong><span>${esc(text)}</span></label>`).join('')}</div><div class="ms-final-choice"><div class="ms-task-banner"><span class="ms-task-no">→</span><div><strong>Что вы делаете с делом?</strong><p>Это ваш вывод до знания фамилии обвиняемого и результата суда.</p></div></div><div class="ms-choice-grid">${decisions.map(([id,text])=>`<label class="ms-choice-card${state.finalDecision===id?' is-selected':''}"><input type="radio" name="finalDecision" value="${id}"${state.finalDecision===id?' checked':''}><small>решение</small><strong>${esc(text)}</strong></label>`).join('')}</div></div>${actions('Открыть реальный исход','submit-final',!(state.strongestEvidence&&state.finalDecision))}${mobileBoardButton()}</div></section>${boardHtml()}</div>`;
  };

  const reveal=()=>{
    const strongest={trajectory:'траекторию к дверному проёму',witness:'свидетеля этажом ниже',weapons:'доступ к .38 и угрозы',alibi:'ложное алиби и историю с креслом'}[state.strongestEvidence]||'собранные материалы';
    const decision={warrant:'Вы бы добивались ареста.',continue:'Вы бы продолжили проверку, считая версию сильной.',other:'Вы сохраняли бы основную внешнюю версию.'}[state.finalDecision]||'';
    return `${topbar('Реальный исход')}<section class="ms-stage"><div class="ms-stage-inner"><p class="ms-eyebrow">Теперь можно раскрыть имя</p><h1 class="ms-title">РОДНИ ДЭНИЕЛС</h1><div class="ms-reveal"><div class="ms-reveal-photo"><img src="${OFFICIAL_PHOTO}" alt="Патриция Морено"></div><div class="ms-reveal-copy"><h2>32 ГОДА ДО ПРИГОВОРА</h2><p>Мужчина, которого мы до этого называли бойфрендом старшей дочери, — <strong>Rodney Daniels</strong>. В сентябре 2021 года его арестовали по делу об убийстве Патриции Морено. После шестидневного процесса 16 августа 2023 года присяжные признали его виновным в убийстве первой степени.</p><p>Официальное обвинение опиралось на совокупность поздней реконструкции траектории, нового свидетеля, информации об оружии и угрозах, а также сведений о ложном алиби.</p><div class="ms-outcome"><div><small>Ваше решение</small><strong>${esc(decision)}</strong></div><div><small>Главная улика по вашей версии</small><strong>${esc(strongest)}</strong></div></div><p>Важно: игра не просила угадать фамилию. Вы сначала построили пространственную версию, проверили её, а затем решили, достаточно ли собранного для действия.</p><div class="ms-ledger"><a href="${SOURCES.arrest}" target="_blank" rel="noopener noreferrer">Арест и реконструкция · Middlesex DA ↗</a><a href="${SOURCES.conviction}" target="_blank" rel="noopener noreferrer">Приговор 2023 · Middlesex DA ↗</a></div></div></div><div class="ms-actions"><button class="ms-button ms-button-secondary" type="button" data-action="reset">Пройти заново</button></div></div></section>`;
  };

  const render=()=>{
    const renderer={opening,scene,trajectory,trajectoryResult,occupants,alibi,investigate,synthesis,reveal}[state.stage]||opening;
    app.innerHTML=`<div class="ms-shell">${renderer()}<div class="ms-reset-row">${state.stage!=='opening'&&state.stage!=='reveal'?'<button class="ms-reset" type="button" data-action="reset">Сбросить вертикальный срез</button>':''}</div></div>`;
    bind();
  };

  const setStage=(stage)=>{state.stage=stage;save();render();window.scrollTo({top:0,behavior:'smooth'});};
  const choose=(selector,key)=>app.querySelectorAll(selector).forEach(input=>input.addEventListener('change',()=>{state[key]=input.value;save();render();}));
  const bind=()=>{
    app.querySelector('[data-action="start"]')?.addEventListener('click',()=>setStage('scene'));
    app.querySelector('[data-action="back-opening"]')?.addEventListener('click',()=>setStage('opening'));
    choose('input[name="initialTheory"]','initialTheory');
    app.querySelector('[data-action="to-trajectory"]')?.addEventListener('click',()=>{if(state.initialTheory)setStage('trajectory')});
    app.querySelectorAll('[data-zone]').forEach(button=>button.addEventListener('click',()=>{state.trajectoryZone=button.dataset.zone;save();render();}));
    app.querySelector('[data-action="submit-trajectory"]')?.addEventListener('click',()=>{if(state.trajectoryZone)setStage('trajectoryResult')});
    app.querySelector('[data-action="to-occupants"]')?.addEventListener('click',()=>setStage('occupants'));
    choose('input[name="occupantsAssessment"]','occupantsAssessment');
    app.querySelector('[data-action="to-alibi"]')?.addEventListener('click',()=>{if(state.occupantsAssessment)setStage('alibi')});
    choose('input[name="alibiAssessment"]','alibiAssessment');
    app.querySelector('[data-action="to-investigate"]')?.addEventListener('click',()=>{if(state.alibiAssessment)setStage('investigate')});
    app.querySelectorAll('[data-line-open]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.lineOpen;if(!state.openedLines.includes(id))state.openedLines.push(id);save();render();}));
    app.querySelectorAll('[data-line-interpret]').forEach(input=>input.addEventListener('change',()=>{state.lineInterpretations[input.dataset.lineInterpret]=input.value;save();render();}));
    app.querySelector('[data-action="to-synthesis"]')?.addEventListener('click',()=>{const processed=state.openedLines.filter(id=>state.lineInterpretations[id]).length;if(processed>=2)setStage('synthesis')});
    choose('input[name="strongestEvidence"]','strongestEvidence');
    choose('input[name="finalDecision"]','finalDecision');
    app.querySelector('[data-action="submit-final"]')?.addEventListener('click',()=>{if(state.strongestEvidence&&state.finalDecision){state.revealSeen=true;setStage('reveal')}});
    app.querySelectorAll('[data-action="reset"]').forEach(button=>button.addEventListener('click',()=>{if(confirm('Начать вертикальный срез заново?')){localStorage.removeItem(STORAGE_KEY);state=defaultState();render();window.scrollTo({top:0,behavior:'smooth'});}}));
    app.querySelector('[data-action="toggle-board"]')?.addEventListener('click',()=>{const board=app.querySelector('[data-board]');if(!board)return;board.classList.toggle('is-mobile-open');board.addEventListener('click',event=>{if(event.target===board)board.classList.remove('is-mobile-open')},{once:true});});
  };

  const smokeStage=()=>{
    try{
      const params=new URLSearchParams(location.search);
      const local=location.hostname==='127.0.0.1'||location.hostname==='localhost';
      if(!local||!params.has('smokeStage')) return;
      const stage=params.get('smokeStage');
      if(!STAGES.includes(stage)) return;
      state=defaultState();
      state.stage=stage;
      state.initialTheory='outside';
      state.trajectoryZone='door';
      state.occupantsAssessment='all';
      state.alibiAssessment='possible';
      if(['investigate','synthesis','reveal'].includes(stage)){
        state.openedLines=['witness','weapons','alibi'];
        state.lineInterpretations={witness:expectedInterpretation.witness,weapons:expectedInterpretation.weapons,alibi:expectedInterpretation.alibi};
      }
      if(['synthesis','reveal'].includes(stage)){
        state.strongestEvidence='witness';
        state.finalDecision='warrant';
      }
    }catch{}
  };

  smokeStage();
  render();
  window.MLMorenoSlice={version:VERSION,stages:[...STAGES],getState:()=>JSON.parse(JSON.stringify(state)),reset(){localStorage.removeItem(STORAGE_KEY);state=defaultState();render();}};
})();
