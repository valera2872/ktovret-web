(()=>{
  'use strict';

  const VERSION='0.3.0';
  const STORAGE_KEY='ml-realcase-moreno-investigator-v3';
  const app=document.querySelector('[data-moreno-app]');
  if(!app) return;

  const SOURCES={
    arrest:'https://www.middlesexda.com/press-releases/news/middlesex-district-attorney-and-malden-police-announce-arrest-30-year-old-murder',
    conviction:'https://www.middlesexda.com/press-releases/news/man-convicted-first-degree-murder-connection-32-year-old-murder-patricia-moreno'
  };

  const defaultState=()=>({
    view:'opening',
    resultKey:'',
    completed:[],
    forensicChoice:'',
    forensicInterpretation:'',
    claimChoice:'',
    theoryOrigin:'',
    theoryPerson:'',
    finalAction:'',
    deadendReason:'',
    revealSeen:false
  });

  let state=load();
  function load(){
    try{return {...defaultState(),...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch{return defaultState()}
  }
  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  function esc(value=''){return String(value).replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
  const done=id=>state.completed.includes(id);
  function mark(id){if(!done(id))state.completed.push(id);save();}
  function reset(){localStorage.removeItem(STORAGE_KEY);state=defaultState();render();window.scrollTo({top:0,behavior:'smooth'});}

  function sourceLink(source='arrest'){return `<a href="${SOURCES[source]}" target="_blank" rel="noopener noreferrer">официальный источник ↗</a>`;}

  function topbar(label='Следственный стол'){
    const count=state.completed.length;
    return `<div class="v3-topbar"><div><strong>CASE 91-M</strong><span>cold case · Malden · 1991</span></div><div class="v3-top-state">${esc(label)} · материалов ${count}</div></div>`;
  }

  function opening(){
    return `${topbar('Вход')}<section class="v3-opening">
      <div class="v3-opening-art" aria-hidden="true">
        <div class="v3-building"><span class="v3-window w1"></span><span class="v3-window w2"></span><span class="v3-window w3"></span><span class="v3-fireescape"></span><span class="v3-landing"></span></div>
        <div class="v3-file-stamp">20 JUL 1991<br><small>03:00</small></div>
      </div>
      <div class="v3-opening-copy">
        <p class="v3-eyebrow">Реальное нераскрытое на тот момент дело</p>
        <h1>ДЕВУШКА НА ПОЖАРНОЙ ЛЕСТНИЦЕ</h1>
        <p class="v3-lead">После трёх часов ночи полиция находит 17-летнюю Патрицию Морено на площадке пожарной лестницы третьего этажа. Она ещё дышит. У неё одно огнестрельное ранение головы.</p>
        <div class="v3-brief"><div><b>На месте</b><span>нет оружия</span></div><div><b>На месте</b><span>нет гильзы</span></div><div><b>Пока неизвестно</b><span>кто стрелял и откуда</span></div></div>
        <p>У вас нет списка подозреваемых и нет правильного первого шага. Всё, что появится дальше, должно быть результатом выбранного вами следственного действия.</p>
        <button class="v3-primary" data-action="enter">Принять дело</button>
        <p class="v3-source">Исходные обстоятельства: ${sourceLink('arrest')}</p>
      </div>
    </section>`;
  }

  function notes(){
    const items=[];
    if(done('scene')) items.push(['ОСМОТР','Патриция была одна, лицом вниз, на площадке третьего этажа. Оружие и гильза не найдены. Следов насильственного проникновения в квартиру не обнаружено.']);
    if(done('people')) items.push(['ЛИЦА','Установлено: приёмная мать, две её дочери-подростка и бойфренд старшей дочери находились в квартире.']);
    if(done('interview')) items.push(['ОПРОС','Все находившиеся в квартире говорили, что слышали два выстрела и не знали стрелка. Бойфренд старшей дочери отдельно сообщил, что спал в кресле, проснулся от выстрелов и затем вышел к Патриции.']);
    if(done('canvass')) items.push(['ДОМ','Свидетель со второго этажа сообщил, что после громкого звука видел мужчину над Патрицией; мужчина затем ушёл обратно в квартиру.']);
    if(done('ballistics')) items.push(['ЭКСПЕРТИЗА','Из тела была извлечена пуля; баллистик определил, что она совместима с оружием калибра .38.']);
    if(done('trajectory')) items.push(['РЕКОНСТРУКЦИЯ','В 2020 году следователи восстановили положение Патриции и установили нисходящую траекторию. Официальный вывод: путь пули совместим со стрелком в районе дверного проёма квартиры.']);
    if(done('weaponAccess')) items.push(['ПРОВЕРКА ДОСТУПА','Установлено, что бойфренд старшей дочери имел несколько пистолетов в тот период, включая оружие, совместимое с .38; также имелись сведения об угрозах Патриции.']);
    if(done('claimSleep')) items.push(['ПРОВЕРКА ВЕРСИИ','Позднее следствие получило сведения, что женщина, защищавшая его в 1991 году, признавала ложь и рассказывала о сокрытии оружия в кресле и последующем избавлении от него.']);
    return items;
  }

  function actionCard(id,title,text,tag='действие',locked=false){
    const complete=done(id);
    return `<button class="v3-action-card${complete?' is-done':''}${locked?' is-locked':''}" data-investigate="${id}" ${locked?'disabled':''}>
      <span>${esc(tag)}</span><strong>${esc(title)}</strong><p>${esc(text)}</p>${complete?'<em>материал получен</em>':''}
    </button>`;
  }

  function desk(){
    const peopleKnown=done('people');
    const interviewed=done('interview');
    const caliberKnown=done('ballistics');
    const cards=[
      actionCard('scene','Осмотреть место происшествия','Зафиксировать положение потерпевшей, отсутствие предметов и состояние входа.'),
      actionCard('people','Установить, кто находился рядом','Поднять первоначальные материалы и установить людей, находившихся в квартире.'),
      actionCard('canvass','Провести поквартирный обход','Искать независимых свидетелей в доме, не исходя из чьей-либо версии.'),
      actionCard('experts','Назначить экспертизы','Выбрать, какие исследования нужны по ране, пуле и сцене.','лаборатория')
    ];
    if(peopleKnown) cards.push(actionCard('interview','Опросить находившихся в квартире','Получить их версии произошедшего.','новое действие'));
    if(interviewed) cards.push(actionCard('claims','Проверить утверждения из опросов','Вы сами выберете, какое конкретное утверждение проверять.','новое действие'));
    if(caliberKnown && peopleKnown) cards.push(actionCard('weaponAccess','Проверить доступ к оружию нужного калибра','Теперь известен калибр. Можно проверить, был ли у кого-то из установленных лиц доступ к такому оружию.','новая линия'));

    const noteItems=notes();
    return `${topbar('Ваше расследование')}<section class="v3-desk">
      <div class="v3-desk-main">
        <div class="v3-desk-head"><p class="v3-eyebrow">Вы руководите расследованием</p><h1>ЧТО ДЕЛАТЬ ДАЛЬШЕ?</h1><p>Ни один пункт не означает «правильный ход». Новые линии появляются только после того, как вы сами добыли для них основание.</p></div>
        <div class="v3-action-grid">${cards.join('')}</div>
        <div class="v3-theory-row"><button class="v3-secondary" data-action="theory">Сформулировать рабочую версию</button><button class="v3-danger" data-action="close-case">Попробовать закрыть дело</button></div>
      </div>
      <aside class="v3-notes"><div class="v3-notes-head"><strong>Материалы дела</strong><span>${noteItems.length}</span></div>${noteItems.length?noteItems.map(([k,t])=>`<article><small>${esc(k)}</small><p>${esc(t)}</p></article>`).join(''):'<p class="v3-empty">Пока только исходное сообщение. Всё остальное нужно добыть самостоятельно.</p>'}</aside>
    </section>`;
  }

  const results={
    scene:{title:'ОСМОТР МЕСТА',body:`<p>Патриция была найдена одна, лицом вниз, на площадке пожарной лестницы третьего этажа. Оружия и гильзы на месте не нашли.</p><p>Следов насильственного проникновения в квартиру не обнаружено.</p><div class="v3-question"><strong>Что из этого следует?</strong><p>Пока — почти ничего о личности стрелка. Осмотр ограничивает версии, но никого не называет.</p></div>`,source:'arrest'},
    people:{title:'КТО БЫЛ В КВАРТИРЕ',body:`<p>По материалам 1991 года установлены четыре человека, находившиеся в квартире в момент событий:</p><div class="v3-people"><div>Приёмная мать</div><div>Старшая дочь</div><div>Младшая дочь</div><div>Бойфренд старшей дочери</div></div><p>До этого момента игра намеренно не показывала эти отношения. Теперь появилась первая естественная причина кого-то опрашивать.</p>`,source:'arrest'},
    interview:{title:'ОПРОС НАХОДИВШИХСЯ В КВАРТИРЕ',body:`<p>Все находившиеся в квартире утверждали, что слышали два выстрела, но не знали, кто стрелял.</p><div class="v3-statement"><small>Версия бойфренда старшей дочери</small><p>Он сообщил полиции, что спал в кресле в гостиной, проснулся от двух выстрелов, затем вышел на пожарную лестницу и обнаружил Патрицию.</p></div><p class="v3-muted">Это пересказ официального описания интервью, не дословная цитата.</p><div class="v3-question"><strong>Теперь у вас впервые есть конкретные утверждения, которые можно проверять.</strong><p>Какое именно — решаете вы на следственном столе.</p></div>`,source:'arrest'},
    canvass:{title:'ПОКВАРТИРНЫЙ ОБХОД',body:`<p>При повторном расследовании удалось найти человека, который во время убийства жил этажом ниже и долго находился за пределами США.</p><p>После громкого звука он посмотрел на пожарную лестницу и увидел молодую женщину, тяжело дышавшую, и мужчину над ней. Мужчина затем ушёл обратно в квартиру и закрыл дверь.</p><p>Свидетель также дал физическое описание мужчины. До финального раскрытия имя, которому это описание соответствовало, скрыто.</p><div class="v3-question"><strong>Это не доказывает сам выстрел.</strong><p>Но теперь у вас есть независимый источник, связывающий мужчину со сценой сразу после события.</p></div>`,source:'arrest'},
    weaponAccess:{title:'ДОСТУП К ОРУЖИЮ',body:`<p>Проверка стала осмысленной только после того, как баллистика дала калибр .38 и вы установили круг лиц.</p><p>Следствие выяснило, что бойфренд старшей дочери имел несколько пистолетов примерно в тот период, включая оружие, совместимое с револьвером .38 калибра.</p><p>Также были получены сведения о его угрожающем поведении в отношении Патриции в недели до её смерти.</p><div class="v3-question"><strong>Совместимость — не идентификация конкретного оружия.</strong><p>Оружие убийства так и не было найдено на месте.</p></div>`,source:'conviction'}
  };

  function resultView(){
    const r=results[state.resultKey];
    if(!r) return desk();
    return `${topbar('Получен материал')}<section class="v3-result"><p class="v3-eyebrow">Результат выбранного вами действия</p><h1>${r.title}</h1><div class="v3-result-paper">${r.body}</div><p class="v3-source">Источник: ${sourceLink(r.source)}</p><button class="v3-primary" data-action="back-desk">Вернуться к следственному столу</button></section>`;
  }

  function experts(){
    return `${topbar('Экспертизы')}<section class="v3-result"><p class="v3-eyebrow">Выберите, что заказать</p><h1>ЛАБОРАТОРИЯ И РЕКОНСТРУКЦИЯ</h1><p class="v3-lead">Сам факт огнестрельного ранения позволяет назначать исследования, но игра не выбирает их за вас.</p><div class="v3-action-grid two">
      <button class="v3-action-card${done('ballistics')?' is-done':''}" data-forensic="ballistics"><span>экспертиза</span><strong>Исследовать извлечённый снаряд</strong><p>Определить, что можно сказать о типе оружия по пуле, извлечённой при вскрытии.</p>${done('ballistics')?'<em>выполнено</em>':''}</button>
      <button class="v3-action-card${done('trajectory')?' is-done':''}" data-forensic="trajectory"><span>реконструкция</span><strong>Восстановить положение потерпевшей и путь пули</strong><p>Вернуться на адрес и проверить пространственную версию события.</p>${done('trajectory')?'<em>выполнено</em>':''}</button>
    </div><button class="v3-secondary" data-action="back-desk">Не заказывать сейчас</button></section>`;
  }

  function forensicBallistics(){
    return `${topbar('Заключение эксперта')}<section class="v3-result"><p class="v3-eyebrow">Вы заказали баллистическое исследование</p><h1>ПУЛЯ СОВМЕСТИМА С .38</h1><div class="v3-result-paper"><p>При вскрытии из тела Патриции был извлечён снаряд. Эксперт полиции штата установил, что он совместим с выстрелом из оружия калибра .38.</p><div class="v3-question"><strong>Что теперь можно сделать?</strong><p>Вы впервые получили объективное основание проверять доступ установленных лиц именно к оружию этого калибра. До этой экспертизы такая линия была бы подсказкой от игры.</p></div></div><p class="v3-source">Источник: ${sourceLink('conviction')}</p><button class="v3-primary" data-action="finish-ballistics">Принять заключение</button></section>`;
  }

  function forensicTrajectory(){
    return `${topbar('Криминалистическая реконструкция')}<section class="v3-result"><p class="v3-eyebrow">Вы сами назначили реконструкцию</p><h1>КАК ИНТЕРПРЕТИРОВАТЬ ТРАЕКТОРИЮ?</h1><div class="v3-forensic-layout"><div class="v3-scene-diagram"><div class="v3-door">дверь квартиры</div><div class="v3-platform">площадка 3 этажа</div><div class="v3-lower">этаж ниже</div><div class="v3-victim-dot"></div><div class="v3-arrow">↘</div><small>условная схема, не план помещения</small></div><div class="v3-result-paper"><p>В 2020 году криминалисты вернулись на адрес и восстановили положение Патриции на площадке.</p><p>В опубликованных материалах раскрыты два параметра: <strong>положение входного ранения</strong> и <strong>нисходящая траектория пули</strong>. Точный угол и числовые измерения публично не приведены — игра их не придумывает.</p><p><strong>Какую пространственную версию вы считаете наиболее совместимой с этими данными?</strong></p><div class="v3-radio-stack">
      ${[['door','Стрелок находился в районе дверного проёма квартиры'],['landing','Стрелок находился на самой площадке рядом с Патрицией'],['below','Стрелок находился ниже / снаружи']].map(([id,t])=>`<label><input type="radio" name="forensicInterpretation" value="${id}" ${state.forensicInterpretation===id?'checked':''}><span>${t}</span></label>`).join('')}
      </div></div></div><button class="v3-primary" data-action="submit-trajectory" ${state.forensicInterpretation?'':'disabled'}>Зафиксировать свой вывод</button></section>`;
  }

  function trajectoryControl(){
    const correct=state.forensicInterpretation==='door';
    return `${topbar('Сверка с заключением')}<section class="v3-result"><p class="v3-eyebrow">После вашего вывода</p><h1>${correct?'ВАША ВЕРСИЯ СОВПАЛА С РЕКОНСТРУКЦИЕЙ':'ОФИЦИАЛЬНЫЙ ВЫВОД РАСХОДИТСЯ С ВАШИМ'}</h1><div class="v3-result-paper"><p>Официальная реконструкция пришла к выводу, что путь пули был совместим с выстрелом человеком, стоявшим в районе дверного проёма квартиры.</p><p>${correct?'Вы пришли к тому же пространственному выводу до раскрытия заключения.':'Это не «ошибка в тесте». Ваша рабочая геометрия требует пересмотра — теперь вы сами решаете, какие другие материалы проверить.'}</p></div><p class="v3-source">Источник: ${sourceLink('arrest')}</p><button class="v3-primary" data-action="finish-trajectory">Вернуться к делу</button></section>`;
  }

  function claims(){
    return `${topbar('Проверка показаний')}<section class="v3-result"><p class="v3-eyebrow">Выберите утверждение, которое хотите проверить</p><h1>НЕ ВСЁ В ПОКАЗАНИЯХ РАВНОЦЕННО</h1><p>Это уже не подсказка от игры: эти утверждения появились только после вашего собственного решения опросить находившихся в квартире.</p><div class="v3-action-grid three">
      <button class="v3-action-card" data-claim="sleep"><span>утверждение</span><strong>«Я спал в кресле»</strong><p>Проверить, было ли независимое подтверждение этой части версии.</p></button>
      <button class="v3-action-card" data-claim="shots"><span>утверждение</span><strong>«Я проснулся от двух выстрелов»</strong><p>Проверить, есть ли независимое подтверждение именно двум выстрелам.</p></button>
      <button class="v3-action-card" data-claim="found"><span>утверждение</span><strong>«Я вышел и нашёл Патрицию»</strong><p>Проверить, есть ли независимый свидетель того, кто был рядом с ней.</p></button>
    </div><button class="v3-secondary" data-action="back-desk">Пока ничего не проверять</button></section>`;
  }

  function claimResult(){
    let title='',body='';
    if(state.claimChoice==='sleep'){
      title='ВЕРСИЯ «СПАЛ В КРЕСЛЕ» ПОЛУЧИЛА ПРОБЛЕМУ';
      body=`<p>В позднем расследовании появились сведения, что женщина, которая защищала его в 1991 году, позже признавалась близким, что лгала полиции и большому жюри.</p><p>По её словам, после убийства он спрятал оружие внутри кресла, а затем избавился от него.</p><div class="v3-question"><strong>Это уже не просто «сомнительное алиби».</strong><p>Проверка конкретного утверждения вывела вас на отдельную линию сокрытия оружия.</p></div>`;
      mark('claimSleep');
    }else if(state.claimChoice==='shots'){
      title='НЕЗАВИСИМОГО ПОДТВЕРЖДЕНИЯ ДВУМ ВЫСТРЕЛАМ НЕТ В ПУБЛИЧНОМ ПАКЕТЕ';
      body=`<p>Официальные материалы сообщают, что другие находившиеся в квартире тоже говорили о паре выстрелов. Но открытый пакет, на котором построена игра, не даёт отдельного объективного подтверждения именно второго выстрела.</p><div class="v3-question"><strong>Линия остаётся открытой.</strong><p>Мы не будем придумывать гильзу, след или экспертизу, которых нет в доступном источнике.</p></div>`;
      mark('claimShots');
    }else{
      title=done('canvass')?'У ВАС УЖЕ ЕСТЬ НЕЗАВИСИМЫЙ СВИДЕТЕЛЬ':'ЭТУ ЧАСТЬ МОЖНО ПРОВЕРИТЬ ЧЕРЕЗ НЕЗАВИСИМЫХ СВИДЕТЕЛЕЙ';
      body=done('canvass')?`<p>Свидетель этажом ниже видел мужчину над Патрицией сразу после громкого звука и видел, как тот ушёл обратно в квартиру.</p><p>Это не подтверждает формулу «я просто вышел и нашёл её» нейтральным образом — свидетель помещает мужчину непосредственно над потерпевшей в критический момент.</p>`:`<p>В открытом деле есть независимый свидетель из дома, но вы его ещё не искали.</p><div class="v3-question"><strong>Игра не откроет его автоматически.</strong><p>Если считаете эту часть показаний важной — вернитесь на стол и сами выберите поквартирный обход.</p></div>`;
      mark('claimFound');
    }
    return `${topbar('Результат проверки')}<section class="v3-result"><p class="v3-eyebrow">Проверено выбранное вами утверждение</p><h1>${title}</h1><div class="v3-result-paper">${body}</div><p class="v3-source">Источник: ${sourceLink('conviction')}</p><button class="v3-primary" data-action="back-desk">Вернуться к делу</button></section>`;
  }

  function theory(){
    const peopleKnown=done('people');
    return `${topbar('Рабочая версия')}<section class="v3-result"><p class="v3-eyebrow">Можно менять сколько угодно раз</p><h1>ЧТО, ПО-ВАШЕМУ, ПРОИЗОШЛО?</h1><div class="v3-theory-grid"><div><h3>Откуда был произведён выстрел?</h3>${[['door','Из района двери квартиры'],['landing','С площадки рядом с Патрицией'],['outside','Снаружи / снизу'],['unknown','Пока не знаю']].map(([id,t])=>`<label class="v3-radio"><input type="radio" name="theoryOrigin" value="${id}" ${state.theoryOrigin===id?'checked':''}><span>${t}</span></label>`).join('')}</div><div><h3>Кто наиболее вероятен?</h3>${(peopleKnown?[['boyfriend','Бойфренд старшей дочери'],['resident','Кто-то другой из квартиры'],['outsider','Неизвестный человек извне'],['accident','Случайный выстрел / самострел'],['unknown','Пока не знаю']]:[['outsider','Неизвестный человек'],['accident','Случайный выстрел / самострел'],['unknown','Пока не знаю']]).map(([id,t])=>`<label class="v3-radio"><input type="radio" name="theoryPerson" value="${id}" ${state.theoryPerson===id?'checked':''}><span>${t}</span></label>`).join('')}</div></div><button class="v3-primary" data-action="save-theory">Зафиксировать рабочую версию</button><button class="v3-secondary" data-action="back-desk">Отмена</button></section>`;
  }

  function evaluateClose(){
    const holes=[];
    if(!done('trajectory')) holes.push('forensics');
    if(!done('people')) holes.push('people');
    const humanChecks=[done('canvass'),done('weaponAccess'),done('claimSleep')].filter(Boolean).length;
    if(humanChecks<2) holes.push('corroboration');
    if(!state.theoryOrigin || !state.theoryPerson || state.theoryOrigin==='unknown' || state.theoryPerson==='unknown') holes.push('theory');
    if(holes.length){
      state.deadendReason=holes[0];state.view='deadend';save();render();return;
    }
    state.view='synthesis';save();render();
  }

  function deadend(){
    const map={
      forensics:['ВЕРСИЯ НЕ ОТВЕЧАЕТ НА ФИЗИЧЕСКИЙ ВОПРОС','Вы пытаетесь закрыть дело, но не установили пространственную механику выстрела. Свидетели и мотив не заменяют вопрос «откуда шла пуля?». Игра не говорит, какую именно экспертизу заказать — это снова ваше решение.'],
      people:['ВЫ ЕЩЁ НЕ УСТАНОВИЛИ КРУГ ЛИЦ','Нельзя обоснованно назвать человека, если вы даже не установили, кто находился в квартире в момент события.'],
      corroboration:['СЛИШКОМ МАЛО НЕЗАВИСИМЫХ ЛИНИЙ','У вас есть пространственная версия, но человек ещё почти не проверен независимыми линиями. Попробуйте найти подтверждение или опровержение вне его собственных слов.'],
      theory:['У ВАС НЕТ СФОРМУЛИРОВАННОЙ ВЕРСИИ','Материалы собраны, но вы ещё не ответили себе, откуда стреляли и кто наиболее вероятен.']
    };
    const [title,text]=map[state.deadendReason]||map.theory;
    return `${topbar('Тупик')}<section class="v3-deadend"><div class="v3-deadend-icon">×</div><p class="v3-eyebrow">Вы сами дошли до слабого места версии</p><h1>${title}</h1><p>${text}</p><button class="v3-primary" data-action="back-desk">Вернуться к расследованию</button></section>`;
  }

  function synthesis(){
    return `${topbar('Решение')}<section class="v3-result"><p class="v3-eyebrow">До раскрытия имени и приговора</p><h1>ГОТОВЫ ЛИ ВЫ ДЕЙСТВОВАТЬ ПО ЭТОЙ ВЕРСИИ?</h1><div class="v3-result-paper"><p><strong>Ваша пространственная версия:</strong> ${esc({door:'выстрел из района двери',landing:'выстрел с площадки',outside:'выстрел снаружи / снизу'}[state.theoryOrigin]||'не сформулирована')}.</p><p><strong>Ваш основной человек/версия:</strong> ${esc({boyfriend:'бойфренд старшей дочери',resident:'другой человек из квартиры',outsider:'неизвестный внешний стрелок',accident:'случайный выстрел / самострел'}[state.theoryPerson]||'не сформулирована')}.</p><p>Теперь выберите не «правильный ответ», а процессуальное решение.</p><div class="v3-radio-stack">${[['arrest','Добиваться ареста по собранной совокупности'],['continue','Продолжить расследование — доказательств пока недостаточно']].map(([id,t])=>`<label><input type="radio" name="finalAction" value="${id}" ${state.finalAction===id?'checked':''}><span>${t}</span></label>`).join('')}</div></div><button class="v3-primary" data-action="reveal" ${state.finalAction?'':'disabled'}>Зафиксировать решение и открыть реальный исход</button></section>`;
  }

  function reveal(){
    return `${topbar('Реальный исход')}<section class="v3-result"><p class="v3-eyebrow">Только теперь раскрывается имя</p><h1>РОДНИ ДЭНИЕЛС</h1><div class="v3-reveal"><strong>32 года до обвинительного вердикта</strong><p>Мужчина, которого вы могли установить как бойфренда старшей дочери, — Rodney Daniels. Его арестовали в 2021 году. 16 августа 2023 года после шестидневного процесса присяжные признали его виновным в убийстве первой степени.</p><p>Обвинение опиралось на совокупность реконструкции траектории, независимого свидетеля, сведений об оружии и угрозах, а также информации о ложном алиби и сокрытии оружия.</p><p><strong>Ваше решение до раскрытия:</strong> ${state.finalAction==='arrest'?'добиваться ареста':'продолжить расследование'}.</p></div><div class="v3-source-list">${sourceLink('arrest')} ${sourceLink('conviction')}</div><button class="v3-secondary" data-action="reset">Начать заново</button></section>`;
  }

  function render(){
    const views={opening,desk,result:resultView,experts,ballistics:forensicBallistics,trajectory:forensicTrajectory,trajectoryControl,claims,claimResult,theory,deadend,synthesis,reveal};
    const fn=views[state.view]||opening;
    app.innerHTML=`<div class="v3-shell">${fn()}</div>`;
    bind();
  }

  function showResult(key){state.resultKey=key;state.view='result';mark(key);save();render();window.scrollTo({top:0,behavior:'smooth'});}

  function bind(){
    app.querySelector('[data-action="enter"]')?.addEventListener('click',()=>{state.view='desk';save();render();});
    app.querySelectorAll('[data-investigate]').forEach(btn=>btn.addEventListener('click',()=>{
      const id=btn.dataset.investigate;
      if(id==='experts'){state.view='experts';save();render();return;}
      if(id==='claims'){state.view='claims';save();render();return;}
      showResult(id);
    }));
    app.querySelectorAll('[data-forensic]').forEach(btn=>btn.addEventListener('click',()=>{
      state.view=btn.dataset.forensic==='ballistics'?'ballistics':'trajectory';save();render();
    }));
    app.querySelectorAll('input[name="forensicInterpretation"]').forEach(i=>i.addEventListener('change',()=>{state.forensicInterpretation=i.value;save();render();}));
    app.querySelector('[data-action="finish-ballistics"]')?.addEventListener('click',()=>{mark('ballistics');state.view='desk';save();render();});
    app.querySelector('[data-action="submit-trajectory"]')?.addEventListener('click',()=>{if(!state.forensicInterpretation)return;state.view='trajectoryControl';save();render();});
    app.querySelector('[data-action="finish-trajectory"]')?.addEventListener('click',()=>{mark('trajectory');state.view='desk';save();render();});
    app.querySelectorAll('[data-claim]').forEach(btn=>btn.addEventListener('click',()=>{state.claimChoice=btn.dataset.claim;state.view='claimResult';save();render();}));
    app.querySelector('[data-action="theory"]')?.addEventListener('click',()=>{state.view='theory';save();render();});
    app.querySelectorAll('input[name="theoryOrigin"]').forEach(i=>i.addEventListener('change',()=>{state.theoryOrigin=i.value;save();render();}));
    app.querySelectorAll('input[name="theoryPerson"]').forEach(i=>i.addEventListener('change',()=>{state.theoryPerson=i.value;save();render();}));
    app.querySelector('[data-action="save-theory"]')?.addEventListener('click',()=>{state.view='desk';save();render();});
    app.querySelector('[data-action="close-case"]')?.addEventListener('click',evaluateClose);
    app.querySelectorAll('input[name="finalAction"]').forEach(i=>i.addEventListener('change',()=>{state.finalAction=i.value;save();render();}));
    app.querySelector('[data-action="reveal"]')?.addEventListener('click',()=>{if(!state.finalAction)return;state.revealSeen=true;state.view='reveal';save();render();});
    app.querySelectorAll('[data-action="back-desk"]').forEach(btn=>btn.addEventListener('click',()=>{state.view='desk';save();render();}));
    app.querySelector('[data-action="reset"]')?.addEventListener('click',()=>{if(confirm('Начать расследование заново?'))reset();});
  }

  const params=new URLSearchParams(location.search);
  if((location.hostname==='127.0.0.1'||location.hostname==='localhost')&&params.has('smokeView')){
    const v=params.get('smokeView');
    state=defaultState();state.view=v;
    if(['desk','result','experts','ballistics','trajectory','trajectoryControl','claims','claimResult','theory','deadend','synthesis','reveal'].includes(v)){
      state.completed=['scene','people','interview','canvass','ballistics','trajectory','weaponAccess','claimSleep'];
      state.resultKey='people';state.forensicInterpretation='door';state.claimChoice='sleep';state.theoryOrigin='door';state.theoryPerson='boyfriend';state.finalAction='arrest';state.deadendReason='forensics';
    }
  }

  render();
  window.MLMorenoV3={version:VERSION,getState:()=>JSON.parse(JSON.stringify(state)),reset};
})();