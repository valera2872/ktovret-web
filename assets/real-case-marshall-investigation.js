(()=>{
  'use strict';

  const VERSION='2.0.0';
  const STORAGE_KEY='ml-realcase-71-05-investigation-v2';
  const app=document.querySelector('[data-realcase-app]');
  if(!app) return;

  const esc=(value)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  const SOURCES={
    M00:{short:'Исходные обстоятельства',status:'УСТАНОВЛЕННЫЙ ФОН',title:'Royal Commission · factual findings',url:'https://archives.novascotia.ca/pdf/marshall/1-1-Findings.pdf'},
    SCENE:{short:'Первичное реагирование',status:'ОФИЦИАЛЬНЫЙ ВЫВОД',title:'Royal Commission · Digest of Findings',url:'https://novascotia.ca/just/marshall_inquiry/_docs/royal%20commission%20on%20the%20donald%20marshall%20jr%20prosecution_findings.pdf'},
    M01:{short:'Свидетель A · 30 мая',status:'ПЕРВОЕ ПОКАЗАНИЕ',title:'Exhibit Book Volume 12 · first statement',url:'https://archives.novascotia.ca/pdf/marshall/RG44v243n2-ExhibitBook-12-1.PDF'},
    M02:{short:'Свидетель B · 30 мая',status:'ПЕРВОЕ ПОКАЗАНИЕ',title:'Exhibit 16 p.22 · reproduced in Commission record',url:'https://archives.novascotia.ca/pdf/marshall/RG44v258n4-HearingsTranscript-91-2.PDF'},
    M03:{short:'Свидетели C/D · 31 мая',status:'ПЕРВОЕ ПОКАЗАНИЕ',title:'Exhibit 16 pp.26–27 · Commission record',url:'https://archives.novascotia.ca/pdf/marshall/1-1-Findings.pdf'},
    M05:{short:'Свидетель B · 4 июня',status:'ВТОРОЕ ПОКАЗАНИЕ',title:'Exhibit Book Volume 39 · second statement',url:'https://archives.novascotia.ca/pdf/marshall/RG44v246n1-ExhibitBook-39-1.PDF'},
    M06:{short:'Свидетель A · 4 июня',status:'ВТОРОЕ ПОКАЗАНИЕ',title:'Exhibit 31 · second statement reproduced in findings',url:'https://archives.novascotia.ca/pdf/marshall/1-1-Findings.pdf'},
    M08:{short:'Версия обвинения · 1971',status:'ВЕРСИЯ ОБВИНЕНИЯ',title:'Crown Statement of Facts · Exhibit Book Volume 1',url:'https://archives.novascotia.ca/pdf/marshall/RG44v241n4-ExhibitBook-1-2.PDF'},
    LATE:{short:'Новая линия после приговора',status:'ПОЗДНЕЕ СВИДЕТЕЛЬСТВО',title:'Royal Commission · post-conviction evidence',url:'https://novascotia.ca/just/marshall_inquiry/_docs/royal%20commission%20on%20the%20donald%20marshall%20jr%20prosecution_findings.pdf'},
    KNIFE:{short:'Сообщение о ноже · 1974',status:'ПОЗДНЕЕ СВИДЕТЕЛЬСТВО',title:'Royal Commission · later evidence',url:'https://novascotia.ca/just/marshall_inquiry/_docs/royal%20commission%20on%20the%20donald%20marshall%20jr%20prosecution_findings.pdf'},
    M10:{short:'RCMP · 1982',status:'ПОВТОРНОЕ РАССЛЕДОВАНИЕ',title:'RCMP Red Booklet · Exhibit Book Volume 21',url:'https://archives.novascotia.ca/pdf/marshall/RG44v244n5-ExhibitBook-21-1.PDF'},
    M11:{short:'Royal Commission',status:'ВЫВОД КОМИССИИ',title:'Royal Commission · findings on witnesses and investigation',url:'https://archives.novascotia.ca/pdf/marshall/1-1-Findings.pdf'},
    M12:{short:'Реальный исход',status:'ОФИЦИАЛЬНЫЙ ИСХОД',title:'Royal Commission · Digest / Findings',url:'https://archives.novascotia.ca/pdf/marshall/0-DigestFindingsRecommendations.pdf'},
    M13:{short:'Системный контекст',status:'ВЫВОД КОМИССИИ',title:'Royal Commission archive portal',url:'https://archives.novascotia.ca/marshall/'}
  };

  const LEADS={
    scene_gap:{tag:'ПРОБЕЛ',title:'Место происшествия не было сохранено',text:'Первые сотрудники не оградили и не обыскали место, не опросили свидетелей на месте; после отправки раненого в больницу никто не остался охранять участок.',source:'SCENE'},
    survivor_two:{tag:'ВЕРСИЯ',title:'Выживший указывает на двух других мужчин',text:'Ранняя версия выжившего строится вокруг присутствия двух других мужчин. Пока это его утверждение, а не установленный факт.',source:'M00'},
    witness_pool:{tag:'ЛИНИЯ',title:'Найдены три независимые свидетельские линии',text:'В раннем файле есть отдельные материалы свидетеля A, свидетеля B и пары свидетелей C/D. Их можно проверять в любом порядке.',source:'M00'},
    chant_two:{tag:'ПОКАЗАНИЕ',title:'Свидетель A: рядом были ещё двое',text:'В первом показании A описывает двух других мужчин рядом с двумя подростками.',source:'M01'},
    chant_knife:{tag:'ПОКАЗАНИЕ',title:'Свидетель A связывает нож с другим мужчиной',text:'По первому показанию A, один из двух других мужчин достал нож и нанёс удар.',source:'M01'},
    chant_no_id:{tag:'ОГРАНИЧЕНИЕ',title:'Свидетель A не может опознать двух мужчин',text:'A говорит, что не знает этих мужчин и не видел их лица достаточно для опознания; остаются только общие приметы.',source:'M01'},
    pratico_two:{tag:'ПОКАЗАНИЕ',title:'Свидетель B видит двух бегущих мужчин',text:'Первое показание B описывает двух мужчин, бегущих со стороны криков.',source:'M02'},
    white_vw:{tag:'СЛЕД',title:'Белый Volkswagen',text:'По первому показанию B, двое бегущих мужчин садятся в белый Volkswagen; один из них в коричневой вельветовой куртке.',source:'M02'},
    pratico_no_stab:{tag:'ОГРАНИЧЕНИЕ',title:'Первое показание B не описывает удар',text:'В первом материале B нет утверждения, что он видел момент ножевого удара.',source:'M02'},
    macneil_two:{tag:'ПОДТВЕРЖДЕНИЕ',title:'C/D независимо описывают двух других мужчин',text:'Совместное показание C/D помещает в район парка старшего седовласого мужчину и более высокого тёмноволосого мужчину в короткой коричневой куртке.',source:'M03'},
    macneil_limit:{tag:'ОГРАНИЧЕНИЕ',title:'C/D не видели самого нападения',text:'Их материал подтверждает присутствие и описание двух мужчин, но не делает C/D очевидцами удара.',source:'M03'},
    two_men_open:{tag:'ОТКРЫТАЯ ЛИНИЯ',title:'Линия двух мужчин требует проверки',text:'Несколько ранних материалов указывают на двух других мужчин, но в доступном раннем пакете нет надёжной идентификации обоих. Линию нельзя ни закрыть, ни объявить доказанной.',source:'M03'},
    vw_open:{tag:'ОТКРЫТАЯ ЛИНИЯ',title:'Автомобиль пока не идентифицирует человека',text:'Белый Volkswagen появляется в одном раннем свидетельстве. Этого недостаточно, чтобы привязать автомобиль к конкретному человеку без дополнительной проверки.',source:'M02'},
    pratico_flip:{tag:'ПРОТИВОРЕЧИЕ',title:'B меняет статус: от наблюдателя после криков к очевидцу удара',text:'4 июня B уже описывает спор и утверждает, что видел движение руки выжившего в живот второго подростка. Такого прямого обвинения в первом показании не было.',source:'M05'},
    chant_flip:{tag:'ПРОТИВОРЕЧИЕ',title:'A меняет ключевую версию удара',text:'4 июня A уже прямо обвиняет выжившего в ударе ножом; первая версия связывала нож с одним из двух других мужчин.',source:'M06'},
    chant_tension:{tag:'ВНУТРЕННЕЕ ПРОТИВОРЕЧИЕ',title:'В позднем показании A остаётся фраза про «тех двоих»',text:'В том же документе, где появляется обвинение выжившего, A передаёт его слова помощникам о том, что это сделали «те двое». Документ сам содержит напряжение между двумя линиями.',source:'M06'},
    change_unchecked:{tag:'НЕПРОВЕРЕНО',title:'Причина резкой смены показаний в файле не проверена независимо',text:'На этом историческом этапе у вас есть факт изменения версий, но нет надёжной независимой проверки причины. Давление или ложь нельзя объявлять установленными заранее.',source:'M06'},
    crown_theory:{tag:'ВЕРСИЯ ОБВИНЕНИЯ',title:'Обвинительная история опирается на поздние версии A и B',text:'Crown Statement of Facts собирает поздние показания в единую обвинительную версию и переобъясняет раннюю историю A как ложную. Это позиция обвинения, не установленный факт.',source:'M08'},
    late_eyewitness:{tag:'НОВАЯ ЛИНИЯ',title:'Через 10 дней после приговора появляется новый очевидец',text:'Новый свидетель сообщает, что видел, как смертельный удар нанёс другой мужчина — обозначим его как Мужчина X.',source:'LATE'},
    knife_report:{tag:'НОВАЯ ЛИНИЯ',title:'1974: сообщение о возможных следах крови на ноже',text:'Член семьи Мужчины X сообщает, что в ночь убийства видела, как он отмывал с ножа вещество, похожее на кровь. Это позднее свидетельское сообщение, а не само по себе лабораторное доказательство.',source:'KNIFE'},
    rcmp_collapse:{tag:'ПОВТОРНОЕ РАССЛЕДОВАНИЕ',title:'1982: B больше не подтверждает, что был очевидцем',text:'При повторном расследовании B уже говорит, что убийства не видел. Одновременно появляется конкретная линия к Мужчине X и материалам из его дома.',source:'M10'},
    commission_pressure:{tag:'ОФИЦИАЛЬНЫЙ ВЫВОД',title:'Комиссия: вторые показания A и B были неправдивыми',text:'Royal Commission установила, что инкриминирующие вторые показания возникли через принятие свидетелями полицейских внушений и давление; первоначальное расследование игнорировало противоречащие материалы.',source:'M11'},
    systemic:{tag:'СИСТЕМНЫЙ ВЫВОД',title:'Ошибка не ограничивалась одним допросом',text:'Комиссия связала ошибочный приговор с провалами полиции, обвинения, защиты и системы правосудия; расизм также сыграл роль.',source:'M13'}
  };

  const TOPICS={
    chant1:[
      {id:'who',q:'Кто ещё был рядом?',a:'В первом письменном показании A описывает рядом с двумя подростками ещё двух мужчин.',leads:['chant_two']},
      {id:'blow',q:'Вы видели сам удар?',a:'Да. В этой ранней версии A говорит, что один из двух других мужчин достал нож и ударил одного из подростков.',leads:['chant_knife']},
      {id:'identify',q:'Вы можете опознать этих мужчин?',a:'Нет. A говорит, что не знает их и не видел лица достаточно для опознания; он даёт лишь общие приметы.',leads:['chant_no_id']}
    ],
    pratico1:[
      {id:'after',q:'Что вы увидели после крика?',a:'B сообщает о двух мужчинах, бегущих со стороны криков.',leads:['pratico_two']},
      {id:'where',q:'Куда они направились?',a:'По его словам, они сели в белый Volkswagen; на одном была коричневая вельветовая куртка.',leads:['white_vw']},
      {id:'blow',q:'Вы видели сам удар?',a:'В первом показании B не утверждает, что видел момент удара ножом.',leads:['pratico_no_stab']}
    ],
    macneils:[
      {id:'who',q:'Кого вы видели возле парка?',a:'C/D описывают двух мужчин: один старше, седовласый, в светлом верхнем пальто; второй выше, тёмноволосый, в короткой коричневой куртке.',leads:['macneil_two']},
      {id:'contact',q:'Где они находились?',a:'В совместном показании мужчины находятся в районе парка и вступают в контакт с парой молодых людей.',leads:['macneil_two']},
      {id:'attack',q:'Вы видели нападение?',a:'Нет. Этот материал подтверждает присутствие двух мужчин, но C/D не утверждают, что видели ножевой удар.',leads:['macneil_limit']}
    ],
    pratico2:[
      {id:'claim',q:'Что теперь утверждает B?',a:'4 июня B уже описывает спор между подростками и говорит, что видел движение руки выжившего к животу второго подростка и её отдёргивание.',leads:['pratico_flip']},
      {id:'old',q:'А что с двумя бегущими мужчинами?',a:'В новой обвиняющей версии ранняя линия двух мужчин и белого Volkswagen больше не выполняет прежнюю роль в рассказе.',leads:['pratico_flip']}
    ],
    chant2:[
      {id:'claim',q:'Что теперь утверждает A?',a:'4 июня A уже прямо говорит, что выживший подросток достал нож и нанёс удар.',leads:['chant_flip']},
      {id:'new',q:'Что появляется нового?',a:'Появляются новые детали сцены: тёмноволосый мужчина у кустов и спор между подростками перед ударом.',leads:['chant_flip']},
      {id:'tension',q:'В документе осталось что-то от прежней версии?',a:'Да. Позже в том же показании A передаёт слова раненого выжившего о том, что это сделали «те двое».',leads:['chant_tension']}
    ]
  };

  const ACTIONS={
    scene:{group:'МЕСТО',title:'Осмотреть место происшествия',hint:'Понять, что было сохранено в первые часы.',source:'SCENE',detailTitle:'МЕСТО ПРОИСШЕСТВИЯ: ПЕРВАЯ ПОТЕРЯ',detail:['Вы проверяете первичную работу на месте. Официальная реконструкция показывает критический провал: участок не был ограждён и обыскан, свидетелей на месте не опросили, после отправки раненого в больницу никто не остался охранять место.','Это не «найденная улика». Наоборот: часть возможных улик могла быть потеряна ещё до того, как расследование по-настоящему началось.'],leads:['scene_gap']},
    survivor:{group:'ЛЮДИ',title:'Допросить выжившего',hint:'Получить его первую версию событий.',source:'M00',detailTitle:'ПЕРВАЯ ВЕРСИЯ ВЫЖИВШЕГО',detail:['Выживший сам ранен. Его ранняя версия указывает на двух других мужчин, присутствовавших при нападении.','Пока это только версия участника события. Правильный следующий вопрос — есть ли независимые свидетели, которые подтверждают хотя бы присутствие этих людей.'],leads:['survivor_two']},
    find_witnesses:{group:'ПОИСК',title:'Найти свидетелей в районе парка',hint:'Не ждать, пока люди сами окажутся в папке.',source:'M00',detailTitle:'ТРИ ОТДЕЛЬНЫЕ СВИДЕТЕЛЬСКИЕ ЛИНИИ',detail:['В ранних материалах находятся три независимые ветки: свидетель A, свидетель B и пара свидетелей C/D.','Теперь вы сами решаете, кого опрашивать первым. Вопросы внутри допроса можно задавать в любом порядке. Ответы — только содержание реально сохранившихся письменных материалов.'],leads:['witness_pool']},
    chant1:{group:'ДОПРОС',title:'Допросить свидетеля A',hint:'Первое показание · 30 мая 1971',source:'M01',topicKey:'chant1',detailTitle:'СВИДЕТЕЛЬ A · ПЕРВОЕ ПОКАЗАНИЕ'},
    pratico1:{group:'ДОПРОС',title:'Допросить свидетеля B',hint:'Первое показание · 30 мая 1971',source:'M02',topicKey:'pratico1',detailTitle:'СВИДЕТЕЛЬ B · ПЕРВОЕ ПОКАЗАНИЕ'},
    macneils:{group:'ДОПРОС',title:'Допросить свидетелей C/D',hint:'Совместное показание · 31 мая 1971',source:'M03',topicKey:'macneils',detailTitle:'СВИДЕТЕЛИ C/D · СОВМЕСТНОЕ ПОКАЗАНИЕ'},
    two_men:{group:'ПРОВЕРКА ЛИНИИ',title:'Проверить двух других мужчин',hint:'Свести независимые ранние описания.',source:'M03',detailTitle:'ЛИНИЯ ДВУХ МУЖЧИН ОСТАЁТСЯ ОТКРЫТОЙ',detail:['Вы сводите ранние материалы. Присутствие двух других мужчин повторяется в нескольких независимых источниках, но надёжной идентификации обоих в доступном раннем пакете нет.','Это важная разница: линия заслуживает проверки, но повторение версии ещё не превращает её в доказанный факт.'],leads:['two_men_open']},
    white_vw_check:{group:'ПРОВЕРКА ЛИНИИ',title:'Проверить белый Volkswagen',hint:'Может ли автомобиль идентифицировать людей?',source:'M02',detailTitle:'БЕЛЫЙ VOLKSWAGEN: СЛЕД, НО НЕ ОТВЕТ',detail:['На этом этапе автомобиль существует только внутри раннего показания B. Сам по себе цвет и тип машины не устанавливают личность водителя или пассажиров.','Линию следует сохранить открытой, но обвинительный вывод из неё сделать нельзя без дополнительной проверки.'],leads:['vw_open']},
    pratico2:{group:'НОВЫЙ МАТЕРИАЛ',title:'Повторно допросить свидетеля B',hint:'Новое показание · 4 июня 1971',source:'M05',topicKey:'pratico2',detailTitle:'СВИДЕТЕЛЬ B · ВТОРОЕ ПОКАЗАНИЕ'},
    chant2:{group:'НОВЫЙ МАТЕРИАЛ',title:'Повторно допросить свидетеля A',hint:'Новое показание · 4 июня 1971',source:'M06',topicKey:'chant2',detailTitle:'СВИДЕТЕЛЬ A · ВТОРОЕ ПОКАЗАНИЕ'},
    compare_pratico:{group:'СОПОСТАВЛЕНИЕ',title:'Сопоставить две версии B',hint:'Что именно изменилось между 30 мая и 4 июня?',source:'M05',detailTitle:'B: ИЗ НАБЛЮДАТЕЛЯ — В ОЧЕВИДЦА',detail:['30 мая: B сообщает о двух мужчинах, бегущих со стороны криков к белому Volkswagen; момент удара он не описывает.','4 июня: B уже описывает спор и утверждает, что видел движение руки выжившего в живот второго подростка.','Это не требует от вас выбирать метку «добавлено/исчезло». В дело автоматически заносится главное: ключевой свидетель радикально изменил доказательный статус своей версии.'],leads:['pratico_flip']},
    compare_chant:{group:'СОПОСТАВЛЕНИЕ',title:'Сопоставить две версии A',hint:'Что стало несовместимо между 30 мая и 4 июня?',source:'M06',detailTitle:'A: ДВА НЕСОВМЕСТИМЫХ РАССКАЗА',detail:['30 мая: A связывает нож с одним из двух других мужчин.','4 июня: A уже обвиняет выжившего. При этом в позднем документе остаётся эпизод со словами выжившего о «тех двоих».','Перед вами не тест на память, а реальное противоречие, которое следствие должно объяснить прежде, чем строить на нём обвинение.'],leads:['chant_flip','chant_tension']},
    why_changed:{group:'ПРОВЕРКА',title:'Выяснить, почему показания изменились',hint:'Не принимать новую версию просто потому, что она появилась позже.',source:'M06',detailTitle:'ПРИЧИНА ИЗМЕНЕНИЯ НЕ ПРОВЕРЕНА',detail:['На этом историческом этапе сам файл не даёт вам надёжной независимой проверки причины резкой смены двух ключевых показаний.','Поэтому допустимый вывод сейчас узкий: версии изменились существенно и в одном направлении. Нельзя заранее объявить свидетелей лжецами или утверждать давление — это станет известно только позднее.'],leads:['change_unchecked']},
    crown:{group:'ПАПКА ОБВИНЕНИЯ',title:'Открыть версию обвинения',hint:'Посмотреть, как из материалов собрали одну историю.',source:'M08',detailTitle:'CROWN STATEMENT OF FACTS · 1971',detail:['Обвинительная папка делает поздние версии A и B ядром единой истории: выживший представлен как человек, нанёсший смертельный удар.','Ранняя версия A о двух других мужчинах переобъясняется как ложная история, возникшая из страха. Другие ранние материалы, поддерживающие линию двух мужчин, не получают сопоставимого веса.','Это версия обвинения того времени. Она не является установленным фактом.'],leads:['crown_theory']},
    late_witness:{group:'ПОСЛЕ ПРИГОВОРА',title:'Проверить сообщение нового очевидца',hint:'Через 10 дней после приговора',source:'LATE',detailTitle:'НОВЫЙ ОЧЕВИДЕЦ · 10 ДНЕЙ ПОСЛЕ ПРИГОВОРА',detail:['Новый свидетель сообщает, что видел смертельный удар и что его нанёс другой мужчина — пока обозначим его Мужчина X.','Это свидетельское утверждение требовало полноценной проверки. Последующая проверка этой линии в реальности оказалась неполной.'],leads:['late_eyewitness']},
    knife_1974:{group:'ПОЗДНЯЯ ЛИНИЯ',title:'Проверить сообщение о ноже',hint:'1974 год',source:'KNIFE',detailTitle:'1974 · СООБЩЕНИЕ ИЗ СЕМЬИ МУЖЧИНЫ X',detail:['Член семьи Мужчины X сообщает, что в ночь убийства видела, как он отмывал с ножа вещество, похожее на кровь.','Это сильный повод возобновить проверку, но само сообщение не равно лабораторно подтверждённой крови и не должно подаваться как готовое вещественное доказательство.'],leads:['knife_report']},
    rcmp1982:{group:'ПОВТОРНОЕ РАССЛЕДОВАНИЕ',title:'Открыть материалы RCMP 1982',hint:'Проверить старые опорные точки заново.',source:'M10',detailTitle:'1982 · ОПОРА ОБВИНЕНИЯ РАЗРУШАЕТСЯ',detail:['При повторном расследовании свидетель B уже сообщает, что очевидцем убийства не был.','Одновременно материалы выводят следствие на Мужчину X и на доказательственную линию, связанную с его домом. Это уже повторное расследование, но ещё не финальный вывод Royal Commission.'],leads:['rcmp_collapse']},
    commission:{group:'ОФИЦИАЛЬНАЯ ПРОВЕРКА',title:'Сверить своё расследование с Royal Commission',hint:'Что официально установили после пересмотра?',source:'M11',detailTitle:'ROYAL COMMISSION · ЧТО БЫЛО УСТАНОВЛЕНО',detail:['Комиссия пришла к выводу, что инкриминирующие вторые показания A и B были неправдивыми и возникли через принятие свидетелями полицейских внушений и давление.','Она также установила, что первоначальное расследование игнорировало материалы, противоречащие выбранной версии.','Теперь можно открыть реальные имена и юридический исход дела.'],leads:['commission_pressure']}
  };

  const defaultState=()=>({
    started:false,
    completed:[],
    topics:{},
    leads:[],
    decision:null,
    decisionNote:'',
    view:'brief',
    completedCase:false
  });

  const load=()=>{
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(!raw) return defaultState();
      const parsed=JSON.parse(raw);
      return {...defaultState(),...parsed,completed:Array.isArray(parsed.completed)?parsed.completed:[],leads:Array.isArray(parsed.leads)?parsed.leads:[],topics:parsed.topics||{}};
    }catch{return defaultState();}
  };
  let state=load();
  const save=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  const has=(id)=>state.completed.includes(id);
  const doneCount=(ids)=>ids.filter(has).length;
  const addLead=(id)=>{if(LEADS[id]&&!state.leads.includes(id)) state.leads.push(id);};
  const addLeads=(ids=[])=>ids.forEach(addLead);
  const complete=(id)=>{if(!has(id)) state.completed.push(id);};

  const june4Unlocked=()=>doneCount(['chant1','pratico1','macneils'])>=2&&doneCount(['scene','survivor'])>=1;
  const crownUnlocked=()=>has('pratico2')&&has('chant2')&&doneCount(['compare_pratico','compare_chant'])>=1;
  const laterUnlocked=()=>Boolean(state.decision);
  const commissionUnlocked=()=>has('rcmp1982')&&doneCount(['late_witness','knife_1974'])>=1;
  const revealUnlocked=()=>has('commission');

  const availableActions=()=>{
    const list=[];
    if(!has('scene')) list.push('scene');
    if(!has('survivor')) list.push('survivor');
    if(!has('find_witnesses')) list.push('find_witnesses');
    if(has('find_witnesses')){
      if(!has('chant1')) list.push('chant1');
      if(!has('pratico1')) list.push('pratico1');
      if(!has('macneils')) list.push('macneils');
    }
    if(doneCount(['chant1','pratico1','macneils'])>=2){
      if(!has('two_men')) list.push('two_men');
      if(has('pratico1')&&!has('white_vw_check')) list.push('white_vw_check');
    }
    if(june4Unlocked()){
      if(!has('pratico2')) list.push('pratico2');
      if(!has('chant2')) list.push('chant2');
      if(has('pratico1')&&has('pratico2')&&!has('compare_pratico')) list.push('compare_pratico');
      if(has('chant1')&&has('chant2')&&!has('compare_chant')) list.push('compare_chant');
      if(doneCount(['compare_pratico','compare_chant'])>=1&&!has('why_changed')) list.push('why_changed');
      if(crownUnlocked()&&!has('crown')) list.push('crown');
    }
    if(has('crown')&&!state.decision) list.push('decision');
    if(laterUnlocked()){
      if(!has('late_witness')) list.push('late_witness');
      if(!has('knife_1974')) list.push('knife_1974');
      if(!has('rcmp1982')) list.push('rcmp1982');
      if(commissionUnlocked()&&!has('commission')) list.push('commission');
    }
    if(revealUnlocked()&&!has('reveal')) list.push('reveal');
    if(has('reveal')&&!has('sources')) list.push('sources');
    if(has('reveal')&&!has('epilogue')) list.push('epilogue');
    return list;
  };

  const phase=()=>{
    if(has('reveal')) return {date:'1989 · после Комиссии',label:'Дело раскрыто'};
    if(has('commission')) return {date:'1987–1989',label:'Royal Commission'};
    if(laterUnlocked()) return {date:'после приговора → 1982',label:'Повторная проверка'};
    if(has('crown')) return {date:'1971 · до суда',label:'Решение по файлу'};
    if(june4Unlocked()) return {date:'4 июня 1971',label:'Новые показания'};
    return {date:'28–31 мая 1971',label:'Первые дни'};
  };

  const boardHtml=()=>{
    const items=[...state.leads].reverse();
    return `<aside class="ri-board" data-case-board>
      <div class="ri-board-head"><div><small>ДОСКА ДЕЛА</small><strong>${items.length?`${items.length} ${items.length===1?'запись':'записей'}`:'Пока пусто'}</strong></div><button type="button" class="ri-icon-button" data-action="toggle-board" aria-label="Свернуть доску">×</button></div>
      <p class="ri-board-note">Запоминать ничего не нужно. Значимые факты и противоречия попадают сюда автоматически вместе с источником.</p>
      <div class="ri-board-list">${items.length?items.map(id=>{
        const lead=LEADS[id]; const src=SOURCES[lead.source];
        return `<article class="ri-lead"><div class="ri-lead-top"><span>${esc(lead.tag)}</span><small>${esc(lead.source)}</small></div><h3>${esc(lead.title)}</h3><p>${esc(lead.text)}</p><footer>${esc(src?.short||lead.source)}</footer></article>`;
      }).join(''):'<div class="ri-empty">Вы ещё ничего не проверили. Начните с действия, которое выбрали бы на месте следователя.</div>'}</div>
    </aside>`;
  };

  const actionCard=(id)=>{
    if(id==='decision') return `<button class="ri-action-card is-decision" type="button" data-open="decision"><small>ВАШЕ РЕШЕНИЕ</small><strong>Что делать с обвинительной папкой?</strong><span>Поддержать обвинение, вернуть дело на проверку или оставить альтернативную линию открытой.</span><b>Принять решение →</b></button>`;
    if(id==='reveal') return `<button class="ri-action-card is-event" type="button" data-open="reveal"><small>ФИНАЛ</small><strong>Открыть реальные имена и исход</strong><span>Сначала вы уже сделали собственные выводы. Теперь можно сверить их с историей.</span><b>Открыть дело →</b></button>`;
    if(id==='sources') return `<button class="ri-action-card" type="button" data-open="sources"><small>ИСТОЧНИКИ</small><strong>Открыть официальный реестр</strong><span>Все материалы и ссылки на архив Новой Шотландии.</span><b>Открыть →</b></button>`;
    if(id==='epilogue') return `<button class="ri-action-card" type="button" data-open="epilogue"><small>ПОСЛЕ ДЕЛА</small><strong>Почему ошибка стала системной</strong><span>Что Royal Commission установила о полиции, обвинении, защите и расизме.</span><b>Открыть →</b></button>`;
    const action=ACTIONS[id];
    return `<button class="ri-action-card" type="button" data-open="${esc(id)}"><small>${esc(action.group)}</small><strong>${esc(action.title)}</strong><span>${esc(action.hint)}</span><b>Проверить →</b></button>`;
  };

  const historyHtml=()=>{
    const recent=[...state.completed].slice(-5).reverse();
    return `<section class="ri-history"><div class="ri-section-kicker">ВАШ МАРШРУТ</div>${recent.length?recent.map(id=>{
      if(id==='reveal') return '<div class="ri-history-row"><span>✓</span><p><strong>Открыт реальный исход дела</strong></p></div>';
      if(id==='sources') return '<div class="ri-history-row"><span>✓</span><p><strong>Открыт реестр источников</strong></p></div>';
      if(id==='epilogue') return '<div class="ri-history-row"><span>✓</span><p><strong>Открыт системный эпилог</strong></p></div>';
      const a=ACTIONS[id]; if(!a) return '';
      return `<div class="ri-history-row"><span>✓</span><p><strong>${esc(a.title)}</strong><small>${esc(SOURCES[a.source]?.short||'')}</small></p></div>`;
    }).join(''):'<p class="ri-muted">Маршрут появится после первого действия.</p>'}</section>`;
  };

  const deskHtml=()=>{
    const p=phase();
    const actions=availableActions();
    const eventJune=june4Unlocked()&&!has('crown')&&!state.decision;
    const eventLater=laterUnlocked()&&!has('commission');
    return `<div class="ri-layout">
      <main class="ri-desk">
        <div class="ri-case-meta"><span>${esc(p.date)}</span><b>${esc(p.label)}</b></div>
        ${eventJune?`<section class="ri-event"><small>ИСТОРИЧЕСКОЕ СОБЫТИЕ</small><h2>В деле появились новые показания</h2><p>4 июня двух ключевых свидетелей допрашивают снова. Их новые версии существуют независимо от вашего маршрута. Вы сами решаете, когда открыть их и с чем сопоставить.</p></section>`:''}
        ${eventLater?`<section class="ri-event is-timejump"><small>ИСТОРИЯ ДЕЛА</small><h2>Приговор вынесен. Но новые сведения продолжают появляться.</h2><p>Ваше решение сохранено отдельно от исторического исхода. Теперь вы можете выбирать, какие поздние сигналы проверить и в каком порядке.</p></section>`:''}
        <section class="ri-question"><small>СЛЕДУЮЩИЙ ХОД</small><h1>Ваши действия?</h1><p>Выберите то, что действительно сделали бы дальше. Здесь нет обязательного порядка и нет задачи запомнить предыдущие страницы.</p></section>
        <div class="ri-action-grid">${actions.length?actions.map(actionCard).join(''):'<div class="ri-empty is-wide">На этом этапе все доступные линии проверены.</div>'}</div>
        ${historyHtml()}
      </main>
      ${boardHtml()}
    </div>`;
  };

  const briefHtml=()=>`<section class="ri-hero">
    <div class="ri-hero-code">71—05</div>
    <div class="ri-hero-copy">
      <p class="ri-eyebrow">РЕАЛЬНОЕ УГОЛОВНОЕ ДЕЛО · 1971</p>
      <h1>НОЧЬ. ПАРК.<br>ДВА РАНЕНЫХ.</h1>
      <div class="ri-brief"><p>Поздним вечером в городском парке после ножевого нападения ранены два подростка. Один умирает. Второй выживает.</p><p>Личность нападавшего вам неизвестна. Имена, город и исторический исход скрыты до финала.</p></div>
      <div class="ri-role"><strong>Вы ведёте проверку.</strong><span>История не переписывается: вам доступны только реально существовавшие к соответствующему моменту материалы. Но что проверять, кого опрашивать и какую линию не закрывать — решаете вы.</span></div>
      <button class="ri-primary" type="button" data-action="start">Принять дело</button>
    </div>
  </section>`;

  const topicHtml=(actionId,topic)=>{
    const opened=(state.topics[actionId]||[]).includes(topic.id);
    return `<article class="ri-topic${opened?' is-open':''}"><button type="button" data-topic="${esc(actionId)}:${esc(topic.id)}"><span>${opened?'✓':'?'}</span><strong>${esc(topic.q)}</strong></button>${opened?`<div class="ri-topic-answer"><small>ПО ПИСЬМЕННОМУ МАТЕРИАЛУ</small><p>${esc(topic.a)}</p></div>`:''}</article>`;
  };

  const detailHtml=(id)=>{
    const action=ACTIONS[id];
    if(!action) return deskHtml();
    const src=SOURCES[action.source];
    const topics=action.topicKey?TOPICS[action.topicKey]||[]:null;
    return `<div class="ri-layout">
      <main class="ri-desk">
        <button class="ri-back" type="button" data-action="desk">← На стол расследования</button>
        <article class="ri-file">
          <header><p class="ri-eyebrow">${esc(action.group)} · ${esc(src?.status||'МАТЕРИАЛ')}</p><h1>${esc(action.detailTitle)}</h1><div class="ri-source-chip"><span>${esc(action.source)}</span>${esc(src?.short||'')}</div></header>
          ${topics?`<div class="ri-file-intro"><p>Выберите, что хотите уточнить. Вопросы — навигация по сохранившемуся показанию; ответы не сочиняются и не моделируются.</p></div><div class="ri-topic-list">${topics.map(topic=>topicHtml(action.topicKey,topic)).join('')}</div>`:`<div class="ri-file-body">${(action.detail||[]).map(par=>`<p>${esc(par)}</p>`).join('')}</div>`}
          <footer class="ri-file-footer"><span>Источник зафиксирован в деле. Официальная ссылка откроется в финальном реестре.</span><button class="ri-primary" type="button" data-action="finish-detail" data-id="${esc(id)}">${topics?'Завершить этот допрос':'Зафиксировать результат'}</button></footer>
        </article>
      </main>
      ${boardHtml()}
    </div>`;
  };

  const decisionHtml=()=>{
    const options=[
      ['support','Поддержать обвинительную версию','Считать поздние показания достаточной опорой для обвинения.'],
      ['reinvestigate','Вернуть дело на дополнительную проверку','Не передавать обвинительную версию дальше, пока противоречия не объяснены.'],
      ['keep-open','Не закрывать линию двух других мужчин','Продолжить альтернативную линию и одновременно перепроверить изменившиеся показания.']
    ];
    return `<div class="ri-layout"><main class="ri-desk"><button class="ri-back" type="button" data-action="desk">← На стол расследования</button><section class="ri-decision"><p class="ri-eyebrow">ВАШЕ РЕШЕНИЕ · ДО СУДА</p><h1>Что вы делаете с этим файлом?</h1><p>Перед вами уже открытые материалы и ваша доска дела. Никаких ссылок по памяти выбирать не нужно.</p><div class="ri-decision-options">${options.map(([id,title,text])=>`<label class="ri-decision-option"><input type="radio" name="decision" value="${id}"${state.decision===id?' checked':''}><span><strong>${esc(title)}</strong><small>${esc(text)}</small></span></label>`).join('')}</div><textarea class="ri-note" data-decision-note placeholder="Необязательно: одним предложением — почему?">${esc(state.decisionNote)}</textarea><button class="ri-primary" type="button" data-action="commit-decision">Зафиксировать решение</button><div class="ri-decision-warning" data-decision-warning hidden>Сначала выберите действие.</div></section></main>${boardHtml()}</div>`;
  };

  const outcomeLabel=()=>({support:'Вы поддержали обвинительную версию.',reinvestigate:'Вы вернули бы дело на дополнительную проверку.','keep-open':'Вы оставили бы линию двух других мужчин открытой.'}[state.decision]||'');

  const revealHtml=()=>`<div class="ri-layout"><main class="ri-desk"><button class="ri-back" type="button" data-action="desk">← На стол расследования</button><article class="ri-reveal"><p class="ri-eyebrow">НАСТОЯЩЕЕ ДЕЛО</p><h1>Donald Marshall Jr.<br><span>/ Sandy Seale</span></h1><div class="ri-reveal-grid"><section><small>СИДНИ, НОВАЯ ШОТЛАНДИЯ · 1971</small><p>Donald Marshall Jr. был выжившим подростком. Sandy Seale погиб.</p><p>Marshall был осуждён за убийство и провёл в заключении 11 лет.</p></section><section><small>КТО НАНЁС УДАР</small><p>Royal Commission пришла к выводу, что нет сомнений: смертельный удар Sandy Seale нанёс Roy Ebsary.</p><p>Ebsary был осуждён за manslaughter после трёх судебных процессов.</p></section></div><div class="ri-your-path"><strong>Ваше решение до раскрытия:</strong><span>${esc(outcomeLabel())}</span>${state.decisionNote?`<em>«${esc(state.decisionNote)}»</em>`:''}</div><button class="ri-primary" type="button" data-action="finish-reveal">Вернуться к делу</button></article></main>${boardHtml()}</div>`;

  const sourcesHtml=()=>`<div class="ri-layout"><main class="ri-desk"><button class="ri-back" type="button" data-action="desk">← На стол расследования</button><section class="ri-sources"><p class="ri-eyebrow">РЕЕСТР ИСТОЧНИКОВ</p><h1>Официальные материалы</h1><p>Игровой интерфейс использует текстовые выписки и пересказы, привязанные к официальному архиву. Архивные сканы не имитируются.</p><div class="ri-source-list">${Object.entries(SOURCES).map(([id,src])=>`<article><div><small>${esc(src.status)}</small><strong>${esc(id)} · ${esc(src.title)}</strong></div><a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">Открыть источник ↗</a></article>`).join('')}</div><button class="ri-primary" type="button" data-action="finish-sources">Вернуться к столу</button></section></main>${boardHtml()}</div>`;

  const epilogueHtml=()=>`<div class="ri-layout"><main class="ri-desk"><button class="ri-back" type="button" data-action="desk">← На стол расследования</button><article class="ri-epilogue"><p class="ri-eyebrow">ПОСЛЕ ДЕЛА</p><h1>Ошибка пережила собственные противоречия</h1><p>Royal Commission рассматривала не только два изменившихся показания. Она описала системные провалы полиции, обвинения, защиты и институтов правосудия. Комиссия также установила, что расизм сыграл роль в ошибочном осуждении Donald Marshall Jr.</p><p>В этой версии дела важен не «правильный ответ», а маршрут: сохранили ли вы альтернативы достаточно долго, проверяли ли источник до вывода и замечали ли места, где следствие потеряло возможность узнать больше.</p><div class="ri-route-summary"><strong>${state.completed.length}</strong><span>проверенных действий и материалов в вашем маршруте</span></div><button class="ri-primary" type="button" data-action="complete-case">Завершить дело</button></article></main>${boardHtml()}</div>`;

  const render=()=>{
    const p=phase();
    document.body.dataset.riPhase=p.label;
    let content='';
    if(!state.started||state.view==='brief') content=briefHtml();
    else if(state.view==='decision') content=decisionHtml();
    else if(state.view==='reveal') content=revealHtml();
    else if(state.view==='sources') content=sourcesHtml();
    else if(state.view==='epilogue') content=epilogueHtml();
    else if(state.view.startsWith('detail:')) content=detailHtml(state.view.slice(7));
    else content=deskHtml();
    app.innerHTML=`<div class="ri-topbar"><div class="ri-case"><strong>71—05</strong><span>реальное дело · ваше расследование</span></div><div class="ri-time"><small>${esc(p.date)}</small><strong>${esc(p.label)}</strong></div><button type="button" class="ri-board-open" data-action="open-board">Доска дела <b>${state.leads.length}</b></button></div>${content}<footer class="ri-footer"><span>Автосохранение включено</span><button type="button" data-action="reset">Сбросить расследование</button></footer>`;
    bind();
  };

  const openAction=(id)=>{
    if(id==='decision'){state.view='decision';save();render();return;}
    if(id==='reveal'){state.view='reveal';save();render();return;}
    if(id==='sources'){state.view='sources';save();render();return;}
    if(id==='epilogue'){state.view='epilogue';save();render();return;}
    if(!ACTIONS[id]) return;
    state.view=`detail:${id}`;
    save();render();
  };

  const finishDetail=(id)=>{
    const action=ACTIONS[id]; if(!action) return;
    complete(id); addLeads(action.leads||[]);
    state.view='desk';save();render();window.scrollTo({top:0,behavior:'smooth'});
  };

  const openTopic=(value)=>{
    const [key,id]=value.split(':');
    const topic=(TOPICS[key]||[]).find(item=>item.id===id); if(!topic) return;
    const set=new Set(state.topics[key]||[]); set.add(id); state.topics[key]=[...set]; addLeads(topic.leads||[]);save();render();
  };

  const commitDecision=()=>{
    const selected=app.querySelector('input[name="decision"]:checked')?.value;
    if(!selected){const warning=app.querySelector('[data-decision-warning]');if(warning) warning.hidden=false;return;}
    state.decision=selected;
    state.decisionNote=app.querySelector('[data-decision-note]')?.value.trim()||'';
    complete('decision');
    state.view='desk';save();render();window.scrollTo({top:0,behavior:'smooth'});
  };

  const bind=()=>{
    app.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>openAction(button.dataset.open)));
    app.querySelectorAll('[data-topic]').forEach(button=>button.addEventListener('click',()=>openTopic(button.dataset.topic)));
    app.querySelector('[data-action="start"]')?.addEventListener('click',()=>{state.started=true;state.view='desk';save();render();});
    app.querySelectorAll('[data-action="desk"]').forEach(button=>button.addEventListener('click',()=>{state.view='desk';save();render();}));
    app.querySelector('[data-action="finish-detail"]')?.addEventListener('click',event=>finishDetail(event.currentTarget.dataset.id));
    app.querySelector('[data-action="commit-decision"]')?.addEventListener('click',commitDecision);
    app.querySelector('[data-decision-note]')?.addEventListener('input',event=>{state.decisionNote=event.target.value;save();});
    app.querySelector('[data-action="finish-reveal"]')?.addEventListener('click',()=>{complete('reveal');state.view='desk';save();render();});
    app.querySelector('[data-action="finish-sources"]')?.addEventListener('click',()=>{complete('sources');state.view='desk';save();render();});
    app.querySelector('[data-action="complete-case"]')?.addEventListener('click',()=>{complete('epilogue');state.completedCase=true;state.view='desk';save();render();});
    app.querySelector('[data-action="reset"]')?.addEventListener('click',()=>{if(confirm('Сбросить весь прогресс этого расследования?')){localStorage.removeItem(STORAGE_KEY);state=defaultState();render();}});
    const board=app.querySelector('[data-case-board]');
    app.querySelector('[data-action="toggle-board"]')?.addEventListener('click',()=>board?.classList.remove('is-open'));
    app.querySelector('[data-action="open-board"]')?.addEventListener('click',()=>board?.classList.add('is-open'));
  };

  const seedSmoke=(stage)=>{
    if(!stage) return;
    const allTopics=(key)=>{state.topics[key]=(TOPICS[key]||[]).map(item=>item.id);(TOPICS[key]||[]).forEach(item=>addLeads(item.leads));};
    state=defaultState();state.started=true;state.view='desk';
    if(['witnesses','june4','contradictions','crown','decision','later','commission','reveal','sources','epilogue'].includes(stage)){complete('scene');addLeads(ACTIONS.scene.leads);complete('survivor');addLeads(ACTIONS.survivor.leads);complete('find_witnesses');addLeads(ACTIONS.find_witnesses.leads);}
    if(['june4','contradictions','crown','decision','later','commission','reveal','sources','epilogue'].includes(stage)){complete('chant1');allTopics('chant1');complete('pratico1');allTopics('pratico1');complete('macneils');allTopics('macneils');}
    if(['contradictions','crown','decision','later','commission','reveal','sources','epilogue'].includes(stage)){complete('pratico2');allTopics('pratico2');complete('chant2');allTopics('chant2');complete('compare_pratico');addLeads(ACTIONS.compare_pratico.leads);complete('compare_chant');addLeads(ACTIONS.compare_chant.leads);complete('why_changed');addLeads(ACTIONS.why_changed.leads);}
    if(['crown','decision','later','commission','reveal','sources','epilogue'].includes(stage)){complete('crown');addLeads(ACTIONS.crown.leads);}
    if(['decision'].includes(stage)){state.view='decision';}
    if(['later','commission','reveal','sources','epilogue'].includes(stage)){state.decision='reinvestigate';complete('decision');}
    if(['commission','reveal','sources','epilogue'].includes(stage)){complete('late_witness');addLeads(ACTIONS.late_witness.leads);complete('knife_1974');addLeads(ACTIONS.knife_1974.leads);complete('rcmp1982');addLeads(ACTIONS.rcmp1982.leads);}
    if(['commission'].includes(stage)){state.view='detail:commission';}
    if(['reveal','sources','epilogue'].includes(stage)){complete('commission');addLeads(ACTIONS.commission.leads);}
    if(stage==='reveal') state.view='reveal';
    if(stage==='sources'){complete('reveal');state.view='sources';}
    if(stage==='epilogue'){complete('reveal');state.view='epilogue';addLead('systemic');}
  };

  try{
    const params=new URLSearchParams(location.search);
    const local=location.hostname==='127.0.0.1'||location.hostname==='localhost';
    if(local&&params.has('smokeStage')) seedSmoke(params.get('smokeStage'));
  }catch{}

  window.MLRealCase7105Investigation={version:VERSION,storageKey:STORAGE_KEY,getState:()=>JSON.parse(JSON.stringify(state)),actions:Object.keys(ACTIONS),sources:Object.keys(SOURCES),reset(){localStorage.removeItem(STORAGE_KEY);state=defaultState();render();}};
  render();
})();