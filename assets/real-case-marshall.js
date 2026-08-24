(()=>{
  'use strict';

  const VERSION='0.1.0';
  const STORAGE_KEY='ml-realcase-71-05-v1';
  const app=document.querySelector('[data-realcase-app]');
  if(!app) return;

  const SOURCES={
    M00:{title:'Фактические выводы Royal Commission',status:'ВЫВОД КОМИССИИ',url:'https://archives.novascotia.ca/pdf/marshall/1-1-Findings.pdf',unlock:0,summary:'Базовая реконструкция события и хронология дела.'},
    M01:{title:'Свидетель A · первое показание · 30 мая 1971',status:'ПЕРВОЕ ПОКАЗАНИЕ',url:'https://archives.novascotia.ca/pdf/marshall/RG44v243n2-ExhibitBook-12-1.PDF',unlock:3,summary:'Раннее показание: рядом присутствуют ещё два мужчины; свидетель не опознаёт их.'},
    M02:{title:'Свидетель B · первое показание · 30 мая 1971',status:'ПЕРВОЕ ПОКАЗАНИЕ',url:'https://archives.novascotia.ca/pdf/marshall/RG44v258n4-HearingsTranscript-91-2.PDF',unlock:4,summary:'Раннее сообщение о двух мужчинах, бегущих в сторону белого Volkswagen.'},
    M03:{title:'Свидетели C и D · совместное показание · 31 мая 1971',status:'ПЕРВОЕ ПОКАЗАНИЕ',url:'https://archives.novascotia.ca/pdf/marshall/1-1-Findings.pdf',unlock:5,summary:'Два других свидетеля независимо описывают двух мужчин в районе парка.'},
    M05:{title:'Свидетель B · второе показание · 4 июня 1971',status:'ВТОРОЕ ПОКАЗАНИЕ',url:'https://archives.novascotia.ca/pdf/marshall/RG44v246n1-ExhibitBook-39-1.PDF',unlock:9,summary:'Версия меняется: появляется прямое обвинение выжившего подростка.'},
    M06:{title:'Свидетель A · второе показание · 4 июня 1971',status:'ВТОРОЕ ПОКАЗАНИЕ',url:'https://archives.novascotia.ca/pdf/marshall/1-1-Findings.pdf',unlock:11,summary:'Версия также меняется к прямому обвинению, при этом внутри документа остаётся напряжение с ранней версией.'},
    M08:{title:'Crown Statement of Facts · 1971',status:'ВЕРСИЯ ОБВИНЕНИЯ',url:'https://archives.novascotia.ca/pdf/marshall/RG44v241n4-ExhibitBook-1-2.PDF',unlock:15,summary:'Документ обвинения сводит поздние показания в единую версию событий.'},
    M10:{title:'RCMP · повторное расследование · 1982',status:'ПОВТОРНОЕ РАССЛЕДОВАНИЕ',url:'https://archives.novascotia.ca/pdf/marshall/RG44v244n5-ExhibitBook-21-1.PDF',unlock:19,summary:'При новом расследовании один из ключевых свидетелей уже не подтверждает статус очевидца; появляется конкретная альтернативная линия.'},
    M11:{title:'Royal Commission · выводы о показаниях и расследовании',status:'ВЫВОД КОМИССИИ',url:'https://archives.novascotia.ca/pdf/marshall/0-DigestFindingsRecommendations.pdf',unlock:20,summary:'Комиссия оценивает изменение ключевых показаний и системные ошибки расследования.'},
    M12:{title:'Royal Commission · реальный исход дела',status:'ОФИЦИАЛЬНЫЙ ИСХОД',url:'https://archives.novascotia.ca/pdf/marshall/1-1-Findings.pdf',unlock:23,summary:'Имена, юридический исход и вывод о реальном нападавшем.'},
    M13:{title:'Royal Commission · системный контекст',status:'ВЫВОД КОМИССИИ',url:'https://archives.novascotia.ca/marshall/',unlock:25,summary:'Комиссия рассматривала не одну ошибку, а работу всей системы уголовного правосудия.'},
  };

  const earlyBoard=[
    {id:'eb1',text:'В районе парка фигурируют ещё два мужчины.',answer:'multi'},
    {id:'eb2',text:'Один ранний свидетель связывает нож с одним из двух других мужчин.',answer:'single'},
    {id:'eb3',text:'Два мужчины после криков бегут к белому Volkswagen.',answer:'single'},
    {id:'eb4',text:'Ранние материалы сами по себе называют выжившего подростка единственным возможным нападавшим.',answer:'conflict'},
    {id:'eb5',text:'Коричневая куртка появляется более чем в одном раннем описании.',answer:'multi'},
  ];

  const redlineB=[
    {id:'b1',text:'Прямое наблюдение самого удара',answer:'added'},
    {id:'b2',text:'Два мужчины, бегущие к белому Volkswagen',answer:'removed'},
    {id:'b3',text:'Спор между двумя молодыми людьми',answer:'added'},
    {id:'b4',text:'Сам выживший становится названным нападавшим',answer:'added'},
    {id:'b5',text:'Первое показание не описывает сам момент удара',answer:'changed'},
  ];

  const redlineA=[
    {id:'a1',text:'Два других мужчины рядом с парой молодых людей',answer:'changed'},
    {id:'a2',text:'Тёмноволосый мужчина у кустов',answer:'added'},
    {id:'a3',text:'Спор между двумя молодыми людьми',answer:'added'},
    {id:'a4',text:'Прямое утверждение, что выживший нанёс удар',answer:'added'},
    {id:'a5',text:'Рассказ выжившего о «тех двоих» внутри позднего документа',answer:'unchanged'},
  ];

  const screens=[
    {id:'S00',stage:'Вход',kind:'hero',title:'АРХИВНОЕ ДЕЛО №71-05',eyebrow:'Реальное уголовное дело · прототип',copy:['Это реальное уголовное дело 1971 года. Все ключевые обстоятельства взяты из официальных материалов.','Имена, точное место и исход дела скрыты до финала, чтобы вы могли проверить доказательства самостоятельно.','Ваша задача — не угадать преступника. Ваша задача — понять, можно ли доверять расследованию.'],action:'Начать расследование'},
    {id:'S01',stage:'Вход',kind:'intro',title:'НОЧЬ. ПАРК. ДВА РАНЕНЫХ.',eyebrow:'Исходная информация',copy:['Поздним вечером в городском парке после нападения с ножом оказались ранены два подростка. Один получил смертельное ранение. Второй выжил.','На этом этапе у вас нет права считать выжившего ни преступником, ни невиновным. У вас есть только первые свидетельства.'],action:'Открыть первые показания'},
    {id:'S02',stage:'Этап 1',kind:'intro',title:'ПЕРВЫЕ 72 ЧАСА',eyebrow:'Первичная папка',copy:['Перед вами три материала, полученных в первые дни после нападения.','Читайте их отдельно. Не собирайте удобную версию заранее — фиксируйте только то, что каждый источник действительно утверждает.'],action:'Открыть свидетельство A'},
    {id:'S03',stage:'Этап 1',kind:'evidence',title:'СВИДЕТЕЛЬ A — ПЕРВОЕ ПОКАЗАНИЕ',eyebrow:'30 мая 1971',material:'M01',facts:['Рядом с двумя подростками свидетель описывает ещё двух мужчин.','По его словам, один из этих двух мужчин достал нож и нанёс удар.','Позже раненый выживший подошёл к свидетелю и попросил помочь второму пострадавшему.','Свидетель не смог опознать двух других мужчин по лицам.'],requiredFacts:2,action:'Зафиксировать и продолжить'},
    {id:'S04',stage:'Этап 1',kind:'evidence',title:'СВИДЕТЕЛЬ B — ПЕРВОЕ ПОКАЗАНИЕ',eyebrow:'30 мая 1971',material:'M02',facts:['После криков свидетель сообщает о двух мужчинах, бегущих со стороны парка.','Они садятся в белый Volkswagen.','На одном из мужчин — коричневая вельветовая куртка.','В первом показании этот свидетель не говорит, что видел сам момент удара ножом.'],requiredFacts:3,action:'Добавить в картину'},
    {id:'S05',stage:'Этап 1',kind:'evidence',title:'СВИДЕТЕЛИ C И D — 31 МАЯ',eyebrow:'Совместное показание',material:'M03',facts:['После выхода с танцев два свидетеля видят в районе парка двух мужчин.','Один — старше, с седыми волосами и в светлом верхнем пальто.','Второй — выше ростом, тёмноволосый, в короткой коричневой куртке.','Эти свидетели не утверждают, что видели само нападение.'],requiredFacts:2,action:'Сопоставить свидетельства'},
    {id:'S06',stage:'Этап 1',kind:'board',title:'ЧТО У НАС ЕСТЬ НА САМОМ ДЕЛЕ?',eyebrow:'Аудит раннего файла',copy:['Разделите тезисы по силе подтверждения. «2+ источника» означает только независимое повторение — не автоматическую истинность.'],action:'Проверить классификацию'},
    {id:'S07',stage:'Этап 1',kind:'choice',title:'МОЖНО ЛИ УЖЕ НАЗВАТЬ УБИЙЦУ?',eyebrow:'Контрольная точка 1',question:'Выберите вывод, который лучше всего соответствует только первым материалам.',options:[['safe','Нет. Ранний файл оставляет несколько гипотез и не даёт надёжного основания назвать одного нападавшего.'],['accuse','Да. Выживший подросток уже является наиболее очевидным убийцей.'],['other','Да. Два других мужчины точно совершили преступление.']],correct:'safe',points:10,action:'Зафиксировать вывод'},
    {id:'S08',stage:'Этап 2',kind:'transition',title:'ПРОШЛО НЕСКОЛЬКО ДНЕЙ',eyebrow:'4 июня 1971',copy:['Двух ключевых свидетелей снова допрашивают.','Не решайте заранее, кто говорит правду. Сначала найдите, что именно изменилось.'],action:'Открыть новое показание B'},
    {id:'S09',stage:'Этап 2',kind:'evidence',title:'СВИДЕТЕЛЬ B — ВТОРОЕ ПОКАЗАНИЕ',eyebrow:'4 июня 1971',material:'M05',facts:['Теперь появляется спор между выжившим подростком и погибшим.','Свидетель уже утверждает, что видел движение руки выжившего к животу второго подростка и последующее отдёргивание руки.','Это прямое обвинение, которого в первом показании не было.'],requiredFacts:2,action:'Сравнить с первым'},
    {id:'S10',stage:'Этап 2',kind:'redline',title:'СВИДЕТЕЛЬ B: ЧТО ИЗМЕНИЛОСЬ?',eyebrow:'Первое ↔ второе показание',materialA:'M02',materialB:'M05',rows:redlineB,points:10,action:'Сохранить сравнение'},
    {id:'S11',stage:'Этап 2',kind:'evidence',title:'СВИДЕТЕЛЬ A — ВТОРОЕ ПОКАЗАНИЕ',eyebrow:'4 июня 1971',material:'M06',facts:['Появляется новый тёмноволосый мужчина у кустов.','Появляется спор между двумя подростками.','Свидетель теперь прямо утверждает, что выживший нанёс ножевое ранение.','В том же документе сохраняется эпизод, где раненый выживший говорит окружающим, что это сделали «те двое».'],requiredFacts:3,action:'Сравнить с первым'},
    {id:'S12',stage:'Этап 2',kind:'redline',title:'СВИДЕТЕЛЬ A: ЧТО ИЗМЕНИЛОСЬ?',eyebrow:'Первое ↔ второе показание',materialA:'M01',materialB:'M06',rows:redlineA,points:10,action:'Сохранить сравнение'},
    {id:'S13',stage:'Этап 2',kind:'patterns',title:'ДВА СВИДЕТЕЛЯ МЕНЯЮТ ВЕРСИЮ',eyebrow:'Сопоставление изменений',copy:['Сравните не людей, а направления изменений их показаний. Что появляется у обоих после повторных допросов?'],patterns:[['p1','Прямое обвинение выжившего подростка.'],['p2','Более подробная сцена спора/удара.'],['p3','Ранние версии о других мужчинах перестают быть центром рассказа.'],['p4','Оба свидетеля начинают описывать белый Volkswagen как автомобиль выжившего.']],correctPatterns:['p1','p2','p3'],points:5,action:'Собрать изменения'},
    {id:'S14',stage:'Этап 2',kind:'choice',title:'ЧТО МОЖНО СКАЗАТЬ СЕЙЧАС?',eyebrow:'Контрольная точка 2',question:'Вы ещё не знаете, почему показания изменились. Какой вывод допустим?',options:[['prudent','Оба ключевых показания существенно изменились в одном направлении. Это требует объяснения и проверки, но само по себе ещё не доказывает ложь или давление.'],['lie','Оба свидетеля доказанно солгали.'],['pressure','Полиция доказанно заставила их обвинить выжившего.']],correct:'prudent',points:10,action:'Зафиксировать вывод'},
    {id:'S15',stage:'Этап 3',kind:'prosecution',title:'ПАПКА ОБВИНЕНИЯ',eyebrow:'1971 · Statement of Facts',material:'M08',copy:['Теперь вы получаете документ, которым обвинение собирает материалы в одну версию событий.','В нём поздние версии двух свидетелей становятся ядром обвинительной истории, а ранняя версия свидетеля A объясняется как неправильная история, возникшая из страха.'],action:'Открыть аудит папки'},
    {id:'S16',stage:'Этап 3',kind:'audit',title:'ЧТО ИСЧЕЗЛО ИЗ ЦЕНТРА ПАПКИ?',eyebrow:'Аудит обвинительной версии',copy:['Отметьте сведения, которые в обвинительной истории получают меньший вес, переобъясняются или остаются неудобными для единой версии.'],items:[['au1','Первое показание A о двух других мужчинах и ноже.'],['au2','Первое показание B о двух мужчинах у белого Volkswagen без наблюдения удара.'],['au3','Совместное показание C/D о двух других мужчинах в районе парка.'],['au4','Сам факт, что оба ключевых свидетеля существенно изменили версии.'],['au5','Цвет автомобиля полиции, приехавшей позже.']],correctAudit:['au1','au2','au3','au4'],points:10,action:'Провести аудит'},
    {id:'S17',stage:'Этап 3',kind:'decision',title:'ВЫ БЫ ПОДПИСАЛИ ЭТУ ВЕРСИЮ?',eyebrow:'Решение до суда',copy:['На столе только материалы, которыми располагало расследование до суда. Выберите позицию и подтвердите её документами.'],options:[['support','Материалов достаточно, чтобы считать обвинительную версию надёжной.'],['insufficient','Материалов недостаточно для надёжного обвинительного вывода.'],['reinvestigate','Файл требует повторной проверки до окончательного вывода.']],preferred:['insufficient','reinvestigate'],minCitations:3,points:15,action:'Вынести промежуточное заключение'},
    {id:'S18',stage:'Этап 4',kind:'transition',title:'11 ЛЕТ СПУСТЯ',eyebrow:'Повторное расследование',copy:['Дело открывают заново. Появляются сведения, которые меняют вес прежних показаний.'],action:'Открыть повторное расследование'},
    {id:'S19',stage:'Этап 4',kind:'reopen',title:'СВИДЕТЕЛЬ B БОЛЬШЕ НЕ ОЧЕВИДЕЦ',eyebrow:'Материалы RCMP · 1982',material:'M10',copy:['В материалах повторного расследования свидетель B уже сообщает, что очевидцем убийства не был.','Параллельно появляется конкретная альтернативная линия по другому мужчине и сведения из его окружения.'],updates:[['u1','Надёжность прямого обвинения B резко падает.'],['u2','Ранние сведения о других мужчинах нельзя считать закрытыми только поздними показаниями.'],['u3','Версия обвинения 1971 года не требует пересмотра.']],correctUpdates:['u1','u2'],points:5,action:'Пересобрать дело'},
    {id:'S20',stage:'Этап 4',kind:'official',title:'ЧТО УСТАНОВИЛА КОМИССИЯ',eyebrow:'Royal Commission',material:'M11',copy:['Позднее независимая Royal Commission изучила первоначальное расследование, суды и повторное расследование.','Комиссия пришла к выводу, что вторые показания двух ключевых свидетелей были неправдивыми и сформировались после принятия полицейских подсказок и давления. Она также установила серьёзные ошибки на последующих стадиях правосудия.'],action:'Сравнить с моим аудитом'},
    {id:'S21',stage:'Этап 4',kind:'audit-final',title:'ГДЕ СЛОМАЛОСЬ РАССЛЕДОВАНИЕ?',eyebrow:'Контрольная точка 4',items:[['f1','Изменившиеся показания стали основой единой версии.'],['f2','Противоречащие ранние материалы получили недостаточный вес.'],['f3','Альтернативные линии не были проверены с необходимой тщательностью.'],['f4','Ошибки продолжились за пределами одного полицейского допроса.'],['f5','Главная проблема — отсутствие современной ДНК-технологии.']],correctAudit:['f1','f2','f3','f4'],points:10,action:'Зафиксировать ошибки'},
    {id:'S22',stage:'Этап 5',kind:'final',title:'ВАШЕ ЗАКЛЮЧЕНИЕ',eyebrow:'Финальное решение',copy:['Был ли обвинительный приговор надёжным на основании всей изученной вами цепочки доказательств?','Сформулируйте вывод и приложите пять материалов, на которых он основан.'],minCitations:5,points:15,action:'Передать заключение'},
    {id:'S23',stage:'Финал',kind:'reveal',title:'ЭТО БЫЛО РЕАЛЬНОЕ ДЕЛО',eyebrow:'Дело раскрыто',copy:['Дональд Маршалл-младший был ошибочно осуждён за убийство 17-летнего Сэнди Сила в Сиднее, Новая Шотландия, в 1971 году.','Royal Commission впоследствии пришла к выводу, что нет сомнений: ножевое ранение Сэнди нанёс Рой Эбсари. Эбсари был осуждён за manslaughter. Маршалл провёл в заключении 11 лет.'],action:'Посмотреть, что было настоящим'},
    {id:'S24',stage:'Финал',kind:'ledger',title:'ЧТО ВЫ ТОЛЬКО ЧТО ИЗУЧАЛИ',eyebrow:'Реестр источников',copy:['Ключевые материалы связаны с официальным архивом Nova Scotia и документами Royal Commission. В этом прототипе архивные сканы не встраиваются: используются наши транскрипции и аналитические интерфейсы.'],action:'К эпилогу'},
    {id:'S25',stage:'Финал',kind:'epilogue',title:'ПОЧЕМУ ЭТО ПРОИЗОШЛО',eyebrow:'После расследования',copy:['Royal Commission пришла к выводу, что дело нельзя объяснить только ошибкой двух свидетелей. Решения полиции, обвинения, защиты и других частей системы усиливали ошибочную версию и ослабляли противоречащие ей сведения.','Комиссия также установила, что расизм сыграл роль в ошибочном осуждении Маршалла.'],action:'Завершить дело'},
  ];

  const defaultState=()=>({screen:0,maxScreen:0,score:0,awards:{},facts:{},answers:{},citations:{},redlines:{},board:{},patterns:{},audits:{},notes:{},finalText:'',completed:false});
  const load=()=>{
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(!raw||typeof raw!=='object') return defaultState();
      return {...defaultState(),...raw,screen:Math.min(Math.max(Number(raw.screen)||0,0),screens.length-1),maxScreen:Math.min(Math.max(Number(raw.maxScreen)||0,0),screens.length-1)};
    }catch{return defaultState();}
  };
  let state=load();

  const esc=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const save=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  const current=()=>screens[state.screen];
  const award=(key,points)=>{if(!state.awards[key]){state.awards[key]=points;state.score=Math.min(100,state.score+points);save();}};
  const advance=()=>{if(state.screen>=screens.length-1){state.completed=true;save();render();return;} state.screen+=1;state.maxScreen=Math.max(state.maxScreen,state.screen);save();window.scrollTo({top:0,behavior:'smooth'});render();};
  const go=(index)=>{if(index<0||index>state.maxScreen) return;state.screen=index;save();window.scrollTo({top:0,behavior:'smooth'});render();};
  const keyFor=(prefix,id)=>`${prefix}:${id}`;
  const checked=(obj,key,value)=>obj?.[key]===value?' checked':'';

  const sourceStatus=(id)=>SOURCES[id]?`<span class="rc-status">${esc(SOURCES[id].status)}</span>`:'';
  const sourceDoc=(screen)=>{
    const src=SOURCES[screen.material];
    if(!src) return '';
    const paragraphs=(screen.facts||screen.copy||[]).map(text=>`<p>${esc(text)}</p>`).join('');
    return `<article class="rc-document">
      <div class="rc-document-top"><div><small>${esc(src.status)}</small><strong>${esc(src.title)}</strong></div><span class="rc-document-ref">${esc(screen.material)}</span></div>
      <div class="rc-document-body">${paragraphs}</div>
      <div class="rc-document-note">Прототип показывает источник как транскрипцию/пересказ по официальному материалу. Архивный скан не имитируется и не встраивается без разрешения на коммерческую публикацию.</div>
    </article>`;
  };

  const factsHtml=(screen)=>{
    if(!screen.facts?.length) return '';
    const selected=state.facts[screen.id]||{};
    return `<div class="rc-fact-grid">${screen.facts.map((fact,index)=>`<div class="rc-fact"><input type="checkbox" id="fact-${screen.id}-${index}" data-fact="${index}"${selected[index]?' checked':''}><label for="fact-${screen.id}-${index}">${esc(fact)}</label></div>`).join('')}</div>`;
  };

  const boardHtml=()=>`<div class="rc-board">${earlyBoard.map(row=>`<label class="rc-board-row"><span>${esc(row.text)}</span><select class="rc-select" data-board="${row.id}"><option value="">Выберите статус</option><option value="single"${state.board[row.id]==='single'?' selected':''}>1 источник</option><option value="multi"${state.board[row.id]==='multi'?' selected':''}>2+ источника</option><option value="conflict"${state.board[row.id]==='conflict'?' selected':''}>противоречит раннему файлу</option></select></label>`).join('')}</div>`;

  const choicesHtml=(screen)=>`<div class="rc-choice-list">${screen.options.map(([id,text])=>`<label class="rc-choice"><input type="radio" name="choice-${screen.id}" value="${id}"${checked(state.answers,screen.id,id)}><span>${esc(text)}</span></label>`).join('')}</div>`;

  const materialIdsAt=(index=state.maxScreen)=>Object.entries(SOURCES).filter(([,src])=>src.unlock<=index).map(([id])=>id);
  const citationsHtml=(screen,min=0)=>{
    const selected=state.citations[screen.id]||[];
    return `<div class="rc-citations"><h3>Материалы в обоснование${min?` · минимум ${min}`:''}</h3><div class="rc-citation-grid">${materialIdsAt(state.screen).filter(id=>!['M00','M12','M13'].includes(id)).map(id=>`<label class="rc-citation"><input type="checkbox" value="${id}" data-citation="${screen.id}"${selected.includes(id)?' checked':''}><span>${id} · ${esc(SOURCES[id].title.replace(/ · .*/,''))}</span></label>`).join('')}</div></div>`;
  };

  const redlineHtml=(screen)=>{
    const values=state.redlines[screen.id]||{};
    const opts=[['added','ДОБАВЛЕНО'],['removed','ИСЧЕЗЛО'],['changed','ИЗМЕНИЛОСЬ'],['unchanged','НЕ ИЗМЕНИЛОСЬ']];
    return `<div class="rc-split"><div class="rc-version"><small>Версия 1</small><h3>${esc(SOURCES[screen.materialA].title)}</h3><p>${esc(SOURCES[screen.materialA].summary)}</p></div><div class="rc-version"><small>Версия 2</small><h3>${esc(SOURCES[screen.materialB].title)}</h3><p>${esc(SOURCES[screen.materialB].summary)}</p></div></div><div class="rc-board">${screen.rows.map(row=>`<label class="rc-board-row"><span>${esc(row.text)}</span><select class="rc-select" data-redline="${row.id}"><option value="">Статус изменения</option>${opts.map(([id,label])=>`<option value="${id}"${values[row.id]===id?' selected':''}>${label}</option>`).join('')}</select></label>`).join('')}</div>`;
  };

  const patternsHtml=(screen)=>{
    const selected=state.patterns[screen.id]||[];
    return `<div class="rc-choice-list">${screen.patterns.map(([id,text])=>`<label class="rc-choice"><input type="checkbox" data-pattern="${id}"${selected.includes(id)?' checked':''}><span>${esc(text)}</span></label>`).join('')}</div>`;
  };

  const auditHtml=(screen)=>{
    const selected=state.audits[screen.id]||[];
    return `<div class="rc-choice-list">${screen.items.map(([id,text])=>`<label class="rc-choice"><input type="checkbox" data-audit="${id}"${selected.includes(id)?' checked':''}><span>${esc(text)}</span></label>`).join('')}</div>`;
  };

  const unlockedMaterialList=()=>{
    const ids=materialIdsAt();
    if(!ids.length) return '<div class="rc-side-empty">Материалы появятся после начала дела.</div>';
    return `<div class="rc-materials">${ids.filter(id=>id!=='M00').map(id=>`<button class="rc-material-button" type="button" data-open-material="${id}"><small>${esc(SOURCES[id].status)}</small><strong>${esc(SOURCES[id].title)}</strong></button>`).join('')}</div>`;
  };

  const mainCopy=(screen)=>screen.copy?.length?`<div class="rc-copy">${screen.copy.map(text=>`<p>${esc(text)}</p>`).join('')}</div>`:'';

  const renderBody=(screen)=>{
    let body=mainCopy(screen);
    if(screen.kind==='evidence') body=sourceDoc(screen)+factsHtml(screen);
    if(screen.kind==='board') body=mainCopy(screen)+boardHtml();
    if(screen.kind==='choice') body=`<div class="rc-copy"><p>${esc(screen.question)}</p></div>${choicesHtml(screen)}`;
    if(screen.kind==='redline') body=redlineHtml(screen);
    if(screen.kind==='patterns') body=mainCopy(screen)+patternsHtml(screen);
    if(screen.kind==='prosecution'||screen.kind==='official') body=sourceDoc(screen);
    if(screen.kind==='audit'||screen.kind==='audit-final') body=mainCopy(screen)+auditHtml(screen);
    if(screen.kind==='decision') body=mainCopy(screen)+choicesHtml({...screen,correct:''})+citationsHtml(screen,screen.minCitations)+`<textarea class="rc-textarea" data-reason="${screen.id}" placeholder="Коротко объясните, почему вы выбрали эту позицию…">${esc(state.answers[`${screen.id}:reason`]||'')}</textarea>`;
    if(screen.kind==='reopen') body=sourceDoc(screen)+`<div class="rc-choice-list">${screen.updates.map(([id,text])=>`<label class="rc-choice"><input type="checkbox" data-update="${id}"${(state.audits[screen.id]||[]).includes(id)?' checked':''}><span>${esc(text)}</span></label>`).join('')}</div>`;
    if(screen.kind==='final') body=mainCopy(screen)+`<textarea class="rc-textarea" data-final-text placeholder="Ваше заключение: что в цепочке доказательств делает приговор ненадёжным или, наоборот, подтверждает его?">${esc(state.finalText||'')}</textarea>${citationsHtml(screen,screen.minCitations)}`;
    if(screen.kind==='reveal') body=`<div class="rc-reveal"><div class="rc-reveal-card"><small>Настоящее дело</small><h3>Donald Marshall Jr. / Sandy Seale</h3>${mainCopy(screen)}</div><div class="rc-score"><strong>${state.score}</strong><span>из 100 · доказательный аудит</span></div></div>`;
    if(screen.kind==='ledger') body=mainCopy(screen)+`<div class="rc-ledger">${Object.entries(SOURCES).filter(([id])=>id!=='M00').map(([id,src])=>`<article class="rc-ledger-item"><div class="rc-ledger-top"><strong>${id} · ${esc(src.title)}</strong><span>${esc(src.status)}</span></div><p>${esc(src.summary)}</p><a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">Открыть официальный источник ↗</a></article>`).join('')}</div>`;
    if(screen.kind==='epilogue') body=mainCopy(screen)+`<div class="rc-feedback is-good">Вы завершили прототип документального дела. Итоговая оценка: <strong>${state.score}/100</strong>. Она отражает не угадывание имени, а дисциплину работы с источниками.</div>`;
    return body;
  };

  const feedbackFor=(screen)=>state.answers[`${screen.id}:feedback`]||'';
  const feedbackHtml=(screen)=>feedbackFor(screen)?`<div class="rc-feedback ${state.answers[`${screen.id}:feedbackType`]||''}">${esc(feedbackFor(screen))}</div>`:'';

  const buttonLabel=(screen)=>screen.action||'Продолжить';
  const screenClass=(screen)=>['evidence','prosecution'].includes(screen.kind)?' is-paper':'';

  const render=()=>{
    const screen=current();
    const progress=Math.round((state.maxScreen/(screens.length-1))*100);
    app.innerHTML=`
      <div class="rc-topline">
        <div class="rc-case-id"><strong>71-05</strong><span>документальное расследование</span></div>
        <div class="rc-stage-meta">${esc(screen.stage)} · ${state.screen+1}/${screens.length}</div>
      </div>
      <div class="rc-progress" aria-label="Прогресс"><span style="width:${progress}%"></span></div>
      <div class="rc-frame">
        <div class="rc-main">
          <article class="rc-screen${screenClass(screen)}" data-screen="${screen.id}">
            <div class="rc-screen-inner">
              <p class="rc-eyebrow">${esc(screen.eyebrow||screen.stage)}</p>
              <h1 class="rc-title">${esc(screen.title)}</h1>
              ${renderBody(screen)}
              ${feedbackHtml(screen)}
              <div class="rc-actions"><button class="rc-button rc-button-primary" type="button" data-action="primary">${esc(buttonLabel(screen))}</button>${state.screen>0?'<button class="rc-button rc-button-quiet" type="button" data-action="back">Назад</button>':''}</div>
            </div>
          </article>
          <div class="rc-footer-actions"><span>Автосохранение включено · версия ${VERSION}</span><button class="rc-reset" type="button" data-action="reset">Сбросить прогресс прототипа</button></div>
        </div>
        <aside class="rc-side">
          <section class="rc-side-card"><div class="rc-side-card-head"><strong>Материалы</strong><span>${materialIdsAt().length-1>0?materialIdsAt().length-1:0}</span></div>${unlockedMaterialList()}</section>
          <section class="rc-side-card"><div class="rc-side-card-head"><strong>Блокнот</strong><span>${Object.values(state.notes).filter(Boolean).length}</span></div><div class="rc-notebook-mini"><p>Фиксируйте сомнения и связи. Записи сохраняются на этом устройстве.</p><button class="rc-button rc-button-secondary" type="button" data-action="open-notebook">Открыть блокнот</button></div></section>
        </aside>
      </div>
      <div class="rc-modal" data-modal hidden><div class="rc-modal-card"><div class="rc-modal-head"><strong data-modal-title>Материал</strong><button class="rc-modal-close" type="button" data-action="close-modal" aria-label="Закрыть">×</button></div><div class="rc-modal-body" data-modal-body></div></div></div>
    `;
    bind();
  };

  const setFeedback=(screen,text,type='is-warn')=>{state.answers[`${screen.id}:feedback`]=text;state.answers[`${screen.id}:feedbackType`]=type;save();render();};
  const countSelectedFacts=(screen)=>Object.values(state.facts[screen.id]||{}).filter(Boolean).length;

  const validateBoard=(screen)=>{
    const correct=earlyBoard.filter(row=>state.board[row.id]===row.answer).length;
    if(correct<4){setFeedback(screen,`Подтверждено документами: ${correct}/5. Пересмотрите, какие тезисы повторяются, а какие противоречат раннему файлу.`);return false;}
    state.answers[`${screen.id}:feedback`]=`Подтверждено документами: ${correct}/5. Вы отделили повторяющиеся сведения от одиночных утверждений.`;state.answers[`${screen.id}:feedbackType`]='is-good';save();return true;
  };

  const validateChoice=(screen)=>{
    const value=state.answers[screen.id];
    if(!value){setFeedback(screen,'Сначала выберите позицию, которую можно защитить только текущими материалами.');return false;}
    if(value===screen.correct){award(screen.id,screen.points);state.answers[`${screen.id}:feedback`]='Вывод поддерживается текущим файлом: вы не закрываете альтернативы раньше времени.';state.answers[`${screen.id}:feedbackType`]='is-good';save();return true;}
    state.answers[`${screen.id}:feedback`]='Этот вывод выходит дальше того, что текущие документы позволяют установить. Попробуйте отделить гипотезу от доказанного факта.';state.answers[`${screen.id}:feedbackType`]='is-warn';save();render();return false;
  };

  const validateRedline=(screen)=>{
    const values=state.redlines[screen.id]||{};
    const correct=screen.rows.filter(row=>values[row.id]===row.answer).length;
    if(correct<4){setFeedback(screen,`Сверено с документами: ${correct}/${screen.rows.length}. Для перехода нужно подтвердить минимум четыре изменения.`);return false;}
    award(screen.id,screen.points);state.answers[`${screen.id}:feedback`]=`Сверено с документами: ${correct}/${screen.rows.length}. Вы зафиксировали изменение версии без объяснения причин раньше времени.`;state.answers[`${screen.id}:feedbackType`]='is-good';save();return true;
  };

  const validatePatterns=(screen)=>{
    const selected=state.patterns[screen.id]||[];
    const hits=screen.correctPatterns.filter(id=>selected.includes(id)).length;
    const extras=selected.filter(id=>!screen.correctPatterns.includes(id)).length;
    if(hits<3||extras){setFeedback(screen,'Нужно выбрать только те общие направления изменений, которые прямо видны в двух версиях документов.');return false;}
    award(screen.id,screen.points);return true;
  };

  const validateAudit=(screen)=>{
    const selected=state.audits[screen.id]||[];
    const correct=screen.correctAudit.filter(id=>selected.includes(id)).length;
    const wrong=selected.filter(id=>!screen.correctAudit.includes(id)).length;
    const threshold=screen.kind==='audit-final'?3:3;
    if(correct<threshold||wrong){setFeedback(screen,'Выберите только проблемы, которые подтверждаются уже открытыми материалами. Не добавляйте удобные объяснения, которых в файле нет.');return false;}
    award(screen.id,screen.points);return true;
  };

  const validateDecision=(screen)=>{
    const choice=state.answers[screen.id];
    const reason=(state.answers[`${screen.id}:reason`]||'').trim();
    const citations=state.citations[screen.id]||[];
    if(!choice||citations.length<screen.minCitations||reason.length<25){setFeedback(screen,`Нужны позиция, короткое объяснение и минимум ${screen.minCitations} ссылки на материалы.`);return false;}
    if(screen.preferred.includes(choice)){award(screen.id,screen.points);state.answers[`${screen.id}:feedback`]='Позиция дисциплинированно отделяет доказательную недостаточность от угадывания альтернативного преступника.';state.answers[`${screen.id}:feedbackType`]='is-good';save();return true;}
    award(screen.id,Math.floor(screen.points*.45));state.answers[`${screen.id}:feedback`]='Вы можете защищать эту позицию, но часть раннего файла и изменения ключевых показаний требуют отдельного объяснения. Баллы начислены за доказательное обоснование.';state.answers[`${screen.id}:feedbackType`]='is-warn';save();return true;
  };

  const validateReopen=(screen)=>{
    const selected=state.audits[screen.id]||[];
    const hits=screen.correctUpdates.filter(id=>selected.includes(id)).length;
    const wrong=selected.filter(id=>!screen.correctUpdates.includes(id)).length;
    if(hits<2||wrong){setFeedback(screen,'Обновите выводы только там, где новый материал реально меняет доказательный вес.');return false;}
    award(screen.id,screen.points);return true;
  };

  const validateFinal=(screen)=>{
    const text=(state.finalText||'').trim();
    const citations=state.citations[screen.id]||[];
    if(text.length<80||citations.length<screen.minCitations){setFeedback(screen,`Финальное заключение должно содержать не менее 80 знаков и минимум ${screen.minCitations} материалов в обоснование.`);return false;}
    award(screen.id,screen.points);return true;
  };

  const handlePrimary=()=>{
    const screen=current();
    if(screen.kind==='evidence'&&countSelectedFacts(screen)<(screen.requiredFacts||1)){setFeedback(screen,`Отметьте минимум ${screen.requiredFacts||1} факта, которые вы считаете важными для дальнейшей проверки.`);return;}
    if(screen.kind==='board'&&!validateBoard(screen)) return;
    if(screen.kind==='choice'&&!validateChoice(screen)) return;
    if(screen.kind==='redline'&&!validateRedline(screen)) return;
    if(screen.kind==='patterns'&&!validatePatterns(screen)) return;
    if((screen.kind==='audit'||screen.kind==='audit-final')&&!validateAudit(screen)) return;
    if(screen.kind==='decision'&&!validateDecision(screen)) return;
    if(screen.kind==='reopen'&&!validateReopen(screen)) return;
    if(screen.kind==='final'&&!validateFinal(screen)) return;
    if(screen.kind==='epilogue'){state.completed=true;save();setFeedback(screen,'Дело завершено. Прогресс сохранён на этом устройстве.','is-good');return;}
    advance();
  };

  const openModal=(title,html)=>{
    const modal=app.querySelector('[data-modal]');
    modal.hidden=false;
    modal.querySelector('[data-modal-title]').textContent=title;
    modal.querySelector('[data-modal-body]').innerHTML=html;
  };

  const openMaterial=(id)=>{
    const src=SOURCES[id]; if(!src||src.unlock>state.maxScreen) return;
    const sourceLink=state.maxScreen>=24?`<p><a class="rc-button rc-button-secondary" href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">Открыть официальный источник ↗</a></p>`:'<p class="rc-note-help">Ссылка на официальный источник откроется в финальном реестре, чтобы не раскрывать дело раньше времени.</p>';
    openModal(`${id} · ${src.title}`,`<p class="rc-status">${esc(src.status)}</p><div class="rc-copy"><p>${esc(src.summary)}</p></div>${sourceLink}`);
  };

  const openNotebook=()=>{
    const text=state.notes[current().id]||'';
    openModal(`Блокнот · ${current().id}`,`<textarea class="rc-note-area" data-note-editor placeholder="Что в этом материале требует проверки? Какие версии пока нельзя закрывать?">${esc(text)}</textarea><p class="rc-note-help">Запись относится к текущему экрану и сохраняется автоматически.</p>`);
    const editor=app.querySelector('[data-note-editor]');
    editor?.addEventListener('input',()=>{state.notes[current().id]=editor.value;save();});
  };

  const bind=()=>{
    app.querySelector('[data-action="primary"]')?.addEventListener('click',handlePrimary);
    app.querySelector('[data-action="back"]')?.addEventListener('click',()=>go(state.screen-1));
    app.querySelectorAll('[data-open-material]').forEach(button=>button.addEventListener('click',()=>openMaterial(button.dataset.openMaterial)));
    app.querySelectorAll('[data-action="open-notebook"]').forEach(button=>button.addEventListener('click',openNotebook));
    document.querySelectorAll('[data-action="open-notebook"]').forEach(button=>{if(!app.contains(button)){button.onclick=openNotebook;}});
    app.querySelector('[data-action="close-modal"]')?.addEventListener('click',()=>{app.querySelector('[data-modal]').hidden=true;});
    app.querySelector('[data-modal]')?.addEventListener('click',(event)=>{if(event.target===event.currentTarget) event.currentTarget.hidden=true;});
    app.querySelector('[data-action="reset"]')?.addEventListener('click',()=>{if(confirm('Сбросить весь прогресс этого прототипа?')){localStorage.removeItem(STORAGE_KEY);state=defaultState();render();}});

    app.querySelectorAll('[data-fact]').forEach(input=>input.addEventListener('change',()=>{state.facts[current().id]??={};state.facts[current().id][input.dataset.fact]=input.checked;save();}));
    app.querySelectorAll('[data-board]').forEach(select=>select.addEventListener('change',()=>{state.board[select.dataset.board]=select.value;save();}));
    app.querySelectorAll(`input[name="choice-${current().id}"]`).forEach(input=>input.addEventListener('change',()=>{state.answers[current().id]=input.value;save();}));
    app.querySelectorAll('[data-redline]').forEach(select=>select.addEventListener('change',()=>{state.redlines[current().id]??={};state.redlines[current().id][select.dataset.redline]=select.value;save();}));
    app.querySelectorAll('[data-pattern]').forEach(input=>input.addEventListener('change',()=>{const list=new Set(state.patterns[current().id]||[]);input.checked?list.add(input.dataset.pattern):list.delete(input.dataset.pattern);state.patterns[current().id]=[...list];save();}));
    app.querySelectorAll('[data-audit]').forEach(input=>input.addEventListener('change',()=>{const list=new Set(state.audits[current().id]||[]);input.checked?list.add(input.dataset.audit):list.delete(input.dataset.audit);state.audits[current().id]=[...list];save();}));
    app.querySelectorAll('[data-update]').forEach(input=>input.addEventListener('change',()=>{const list=new Set(state.audits[current().id]||[]);input.checked?list.add(input.dataset.update):list.delete(input.dataset.update);state.audits[current().id]=[...list];save();}));
    app.querySelectorAll('[data-citation]').forEach(input=>input.addEventListener('change',()=>{const key=input.dataset.citation;const list=new Set(state.citations[key]||[]);input.checked?list.add(input.value):list.delete(input.value);state.citations[key]=[...list];save();}));
    app.querySelector('[data-reason]')?.addEventListener('input',(event)=>{state.answers[`${current().id}:reason`]=event.target.value;save();});
    app.querySelector('[data-final-text]')?.addEventListener('input',(event)=>{state.finalText=event.target.value;save();});
  };

  window.MLRealCase7105={version:VERSION,screens:screens.map(({id,stage,kind,title})=>({id,stage,kind,title})),sourceIds:Object.keys(SOURCES),reset(){localStorage.removeItem(STORAGE_KEY);state=defaultState();render();}};
  render();
})();
