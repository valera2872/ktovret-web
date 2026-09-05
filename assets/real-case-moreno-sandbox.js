(()=>{
'use strict';
const VERSION='0.4.0';
const KEY='ml-realcase-moreno-sandbox-v4';
const app=document.querySelector('[data-moreno-app]');
if(!app)return;
const PHOTO='https://www.middlesexda.com/sites/g/files/vyhlif11841/f/styles/news_image/public/news/capture_3.jpg?itok=RK3zkJ6R';
const SOURCES={arrest:'https://www.middlesexda.com/press-releases/news/middlesex-district-attorney-and-malden-police-announce-arrest-30-year-old-murder',conviction:'https://www.middlesexda.com/press-releases/news/man-convicted-first-degree-murder-connection-32-year-old-murder-patricia-moreno'};
const fresh=()=>({view:'opening',completed:[],journal:[],hypothesis:'',suspect:'',submitted:false});
const load=()=>{try{return {...fresh(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return fresh()}};
let state=load();
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[.,!?;:()«»"']/g,' ').replace(/\s+/g,' ').trim();
const has=id=>state.completed.includes(id);
const done=id=>{if(!has(id))state.completed.push(id)};
const entry=(command,title,body,kind='result')=>{state.journal.push({command,title,body,kind,at:new Date().toISOString()});if(state.journal.length>60)state.journal=state.journal.slice(-60)};
const sourceLink=()=>`<a href="${SOURCES.arrest}" target="_blank" rel="noopener noreferrer">официальный материал Middlesex DA ↗</a>`;

function initialFacts(){return [
 ['1991','17-летняя Patricia Moreno найдена после 03:00 на площадке пожарной лестницы третьего этажа.'],
 ['РАНЕНИЕ','Одно огнестрельное ранение головы; она ещё дышала, но умерла в тот же день.'],
 ['СЦЕНА','На месте не нашли оружия и гильзы.']
]}
function evidence(){const x=[];
 if(has('scene'))x.push(['ОСМОТР','Patricia была одна, лицом вниз, на площадке третьего этажа. Оружия и гильзы нет. Следов взлома квартиры не установлено.']);
 if(has('people'))x.push(['КРУГ ЛИЦ','В квартире были приёмная мать, две её дочери-подростка и бойфренд старшей дочери.']);
 if(has('interview'))x.push(['ОПРОС','Жильцы сообщили о двух выстрелах. Бойфренд старшей дочери заявил, что спал в кресле, проснулся от выстрелов и затем нашёл Patricia.']);
 if(has('canvass'))x.push(['НЕЗАВИСИМЫЙ СВИДЕТЕЛЬ','Житель второго этажа видел мужчину над раненой; мужчина после этого ушёл обратно в квартиру. Его описание соответствовало бойфренду старшей дочери.']);
 if(has('ballistics'))x.push(['БАЛЛИСТИКА','Из тела извлечена пуля, совместимая с оружием калибра .38.']);
 if(has('trajectory'))x.push(['РЕКОНСТРУКЦИЯ','Положение ранения и нисходящая траектория были совместимы с выстрелом из района дверного проёма квартиры.']);
 if(has('weapon'))x.push(['ОРУЖИЕ','У бойфренда старшей дочери в близкий период было несколько пистолетов; среди них — оружие, совместимое с .38.']);
 if(has('motive'))x.push(['КОНФЛИКТ','Следствие установило угрожающее поведение бойфренда по отношению к Patricia в недели перед её смертью.']);
 if(has('alibi'))x.push(['ПРОВЕРКА ВЕРСИИ','Позднее женщина, защищавшая бойфренда в 1991 году, призналась близким, что лгала; по её словам, он спрятал оружие в кресле и затем избавился от него.']);
 return x;
}
function peopleKnown(){return has('people')}
function interviewKnown(){return has('interview')}

function resolve(raw){const q=norm(raw);if(!q)return {title:'Нужно распоряжение',body:'Сформулируйте, что именно вы хотите сделать как следователь.',kind:'system'};
 const repeated=id=>has(id)?{title:'Это уже проверено',body:'Результат этой проверки уже лежит в рабочей папке. Если хотите двигаться дальше, сформулируйте другое действие.',kind:'system'}:null;

 if(/^(передат|направит|отдат).*прокур|закрыт.*дел|завершит.*расслед|добиват.*арест|арестоват/.test(q)){
   if(!state.hypothesis)return {title:'Нечего передавать',body:'В материалах нет сформулированной вами рабочей версии. Сначала запишите своим текстом, что, по-вашему, произошло и кто за это отвечает.',kind:'dead'};
   const independent=has('canvass')||has('alibi'); const physical=has('trajectory')||has('weapon'); const depth=[has('canvass'),has('alibi'),has('trajectory'),has('weapon'),has('motive')].filter(Boolean).length;
   if(state.suspect!=='boyfriend')return {title:'Версия не выдержала внутренней проверки',body:'Собранные вами материалы не образуют согласованную цепочку вокруг указанной версии. Дело остаётся открытым. Вы можете продолжать расследование и менять рабочую гипотезу.',kind:'dead'};
   if(!(independent&&physical&&depth>=3))return {title:'Материал вернули на дополнительную проверку',body:'Рабочая версия есть, но в ней пока недостаточно независимого подтверждения и физической опоры, чтобы закрыть cold case. Дело остаётся у вас. Что проверять дальше — решаете вы.',kind:'dead'};
   state.submitted=true;state.view='reveal';return {title:'Материал принят',body:'',kind:'reveal'};
 }

 if(/^(моя версия|считаю|подозреваю|думаю что|полагаю|стрелял|убил)/.test(q)){
   state.hypothesis=raw.trim();
   if(/бойфренд|парень.*доч|мужчин.*квартир/.test(q))state.suspect='boyfriend';
   else if(/неизвест|снаруж|улиц|внешн/.test(q))state.suspect='external';
   else if(/сама|самострел|случайн/.test(q))state.suspect='accident';
   else state.suspect='other';
   return {title:'Рабочая версия зафиксирована',body:'Она записана в журнал без оценки правильности. Вы можете продолжать проверки, изменить её позже или попытаться передать дело дальше.',kind:'hypothesis'};
 }

 if(/экспертиз/.test(q)&&!/(пул|баллист|калибр|траектор|ранев|выстрел|оруж)/.test(q))return {title:'Запрос в лабораторию не принят',body:'Нужно указать объект исследования и вопрос эксперту. Общего распоряжения «назначить экспертизу» недостаточно.',kind:'dead'};
 if(/допрос|опрос/.test(q)&&!/(жильц|наход|квартир|мать|доч|бойфренд|парн|сосед|свидетел|очевид|всех)/.test(q))return {title:'Кого опрашивать?',body:'В распоряжении не указано конкретное лицо или группа лиц. Следственная группа не может выполнить такой запрос.',kind:'dead'};

 if(/осмотр|мест.{0,12}происшеств|осмотрет.*площад|осмотрет.*лестниц/.test(q)){
   const r=repeated('scene');if(r)return r;done('scene');return {title:'Протокол повторного изучения сцены',body:'Patricia была найдена одна, лицом вниз, на площадке пожарной лестницы третьего этажа. Оружия и гильзы на месте не нашли. В материалах также не зафиксировано следов насильственного проникновения в квартиру.',kind:'result'};
 }
 if(/кто.*(был|наход|жил).*(квартир|дом)|установ.*(лиц|жильц|кто)|состав.*квартир|жильц/.test(q)&&!/(опрос|допрос)/.test(q)){
   const r=repeated('people');if(r)return r;done('people');return {title:'Установлен круг лиц в квартире',body:'На момент происшествия в квартире находились приёмная мать Patricia, две её дочери-подростка и бойфренд старшей дочери. Это не список подозреваемых — только установленный круг присутствовавших.',kind:'result'};
 }
 if(/(опрос|допрос).*(жильц|наход|квартир|всех|мать|доч|бойфренд|парн)/.test(q)){
   if(!peopleKnown())return {title:'Запрос преждевременный',body:'Вы просите опросить людей, состав которых в поднятых вами материалах ещё не установлен. Укажите конкретное известное лицо либо сначала установите круг присутствовавших.',kind:'dead'};
   const r=repeated('interview');if(r)return r;done('interview');return {title:'Сводка опросов находившихся в квартире',body:'Все сообщили, что слышали два выстрела, но не назвали стрелка. Бойфренд старшей дочери заявил полиции, что спал в кресле в гостиной, проснулся от двух выстрелов, вышел на пожарную лестницу и там обнаружил Patricia.',kind:'result'};
 }
 if(/сосед|поквартир|обход|искать.*свидетел|найти.*свидетел|очевид|кто.*видел|кто.*слышал/.test(q)){
   const r=repeated('canvass');if(r)return r;done('canvass');return {title:'Найден независимый свидетель',body:'Житель квартиры этажом ниже сообщил, что после громкого звука посмотрел на пожарную лестницу. Он видел Patricia, тяжело дышавшую, и мужчину над ней. Мужчина затем отступил обратно в квартиру и закрыл дверь. Описание мужчины соответствовало внешности бойфренда старшей дочери.',kind:'result'};
 }
 if(/баллист|исслед.*пул|пул.*эксперт|калибр|что.*за.*пул/.test(q)){
   const r=repeated('ballistics');if(r)return r;done('ballistics');return {title:'Баллистическое исследование',body:'При вскрытии из тела Patricia был извлечён снаряд. Эксперт State Police определил, что он совместим с выстрелом из оружия калибра .38.',kind:'result'};
 }
 if(/траектор|реконструк.*(сцен|выстр|полож)|откуда.*(пул|стрел|выстр)|направлен.*пул/.test(q)){
   const r=repeated('trajectory');if(r)return r;done('trajectory');return {title:'Криминалистическая реконструкция',body:'Следователи вернулись на адрес и восстановили положение Patricia на площадке. С учётом положения входного ранения и нисходящей траектории путь пули был совместим с выстрелом человеком, находившимся в районе дверного проёма квартиры. Точный угол в публичном источнике не опубликован, поэтому игра его не моделирует.',kind:'result'};
 }
 if(/алиби|провер.*(спал|кресл|слов|показан|верси)|подтверд.*(спал|кресл)|правд.*спал/.test(q)){
   if(!interviewKnown())return {title:'Проверять пока нечего',body:'В поднятых вами материалах ещё нет конкретного утверждения, которое оформлено как алиби. Сначала получите показания человека, чью версию хотите проверить.',kind:'dead'};
   const r=repeated('alibi');if(r)return r;done('alibi');return {title:'Проверка версии о сне в кресле',body:'В ходе поздней повторной проверки появилась информация об алиби-свидетеле, защищавшем бойфренда в 1991 году. Позже эта женщина призналась друзьям и родственникам, что лгала полиции и большому жюри. По её словам, бойфренд спрятал оружие в кресле и затем избавился от него.',kind:'result'};
 }
 if(/угроз|конфликт|отношен.*патриц|мотив|ссор|вражд/.test(q)){
   if(!peopleKnown())return {title:'Нужен объект проверки',body:'Вы ещё не установили круг людей, чьи отношения с Patricia можно предметно проверять.',kind:'dead'};
   const r=repeated('motive');if(r)return r;done('motive');return {title:'Проверка отношений и конфликтов',body:'Следствие установило, что в недели перед смертью Patricia бойфренд старшей дочери проявлял по отношению к ней угрожающее поведение.',kind:'result'};
 }
 if(/оруж|пистолет|револьвер|ствол|влад.*пист|доступ.*оруж/.test(q)){
   if(!peopleKnown())return {title:'Слишком широкий запрос',body:'Вы ещё не установили круг конкретных лиц, по которым можно проводить адресную проверку владения оружием.',kind:'dead'};
   const r=repeated('weapon');if(r)return r;done('weapon');return {title:'Проверка доступа к оружию',body:`Следствие установило, что бойфренд старшей дочери владел несколькими пистолетами в период, близкий к убийству.${has('ballistics')?' Среди них было оружие, совместимое с уже установленным калибром .38.':' Позднее один из этих стволов был описан как совместимый с оружием калибра .38.'}`,kind:'result'};
 }
 if(/вскрыт|аутопс|судмед|причин.*смерт|рана/.test(q)){
   if(has('autopsy'))return repeated('autopsy');done('autopsy');return {title:'Судебно-медицинские материалы',body:'Patricia получила одно огнестрельное ранение головы, повлёкшее необратимое повреждение мозга. Она умерла днём 20 июля 1991 года. При последующем вскрытии из тела был извлечён снаряд.',kind:'result'};
 }
 if(/отпечат|днк|камер|телефон|звонк|волосн|кров.*след|порох|смыт|след.*рук/.test(q))return {title:'В опубликованном пакете нет результата',body:'Официальные материалы, на которых построен этот прототип, не дают достоверного результата такой проверки. Игра не будет придумывать отсутствующую улику.',kind:'limit'};
 return {title:'Следственная группа не поняла распоряжение',body:'Переформулируйте его как конкретное действие: что именно установить, кого именно опросить, какой объект исследовать или какую версию проверить. Игра не покажет список правильных вариантов.',kind:'system'};
}

function opening(){return `<div class="v4-shell"><div class="v4-top"><strong>CASE 91-M</strong><span>Cold Case Unit · 2020</span></div><main class="v4-opening"><section class="v4-opening-copy"><p class="v4-kicker">НЕРАСКРЫТОЕ УБИЙСТВО · МАТЕРИАЛЫ 1991 ГОДА</p><h1>ДЕВУШКА НА<br>ПОЖАРНОЙ ЛЕСТНИЦЕ</h1><p class="v4-lead">Вам передают старое дело. 20 июля 1991 года после трёх часов ночи 17-летнюю Patricia Moreno нашли тяжело раненой на пожарной лестнице третьего этажа. Она умерла в тот же день.</p><div class="v4-brief">${initialFacts().map(([a,b])=>`<article><small>${esc(a)}</small><p>${esc(b)}</p></article>`).join('')}</div><p class="v4-rule">Перед вами не маршрут и не список задач. Дальше материалы будут появляться только в ответ на <strong>ваши собственные следственные действия</strong>.</p><button class="v4-accept" data-action="accept">Принять дело</button><p class="v4-source">Исходные обстоятельства: ${sourceLink()}</p></section><aside class="v4-victim"><div class="v4-filetag">VICTIM FILE<br><small>91-M / P.M.</small></div><img src="${PHOTO}" alt="Patricia Moreno"><div><strong>Patricia Moreno</strong><span>17 лет · Malden, Massachusetts</span></div></aside></main></div>`}
function factPanel(){const items=evidence();return `<aside class="v4-evidence"><div class="v4-evidence-head"><strong>Рабочая папка</strong><span>${items.length}</span></div>${items.length?items.map(([a,b])=>`<article><small>${esc(a)}</small><p>${esc(b)}</p></article>`).join(''):'<p class="v4-empty">Пока только исходный рапорт. Новые материалы появятся после ваших действий.</p>'}${state.hypothesis?`<article class="v4-hyp"><small>ВАША ВЕРСИЯ</small><p>${esc(state.hypothesis)}</p></article>`:''}</aside>`}
function journal(){if(!state.journal.length)return `<div class="v4-journal-empty"><span>01</span><h2>ДЕЛО У ВАС</h2><p>Сформулируйте первое действие самостоятельно. Интерфейс не покажет, что здесь «правильно» нажимать.</p></div>`;return `<div class="v4-journal">${state.journal.map((x,i)=>`<article class="v4-log ${esc(x.kind)}"><div class="v4-log-no">${String(i+1).padStart(2,'0')}</div><div><p class="v4-command">Вы: ${esc(x.command)}</p><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></div></article>`).join('')}</div>`}
function desk(){return `<div class="v4-shell"><div class="v4-top"><div><strong>CASE 91-M</strong><span>повторное расследование</span></div><button class="v4-reset" data-action="reset">начать заново</button></div><main class="v4-work"><section class="v4-console"><header><p class="v4-kicker">ЖУРНАЛ СЛЕДОВАТЕЛЯ</p><h1>Что вы делаете?</h1><p>Пишите распоряжение своими словами. Не выбирайте из вариантов — вариантов на экране нет.</p></header>${journal()}<form class="v4-composer" data-command-form><label for="v4-command">Ваше следственное действие</label><textarea id="v4-command" data-command rows="3" autocomplete="off" placeholder=""></textarea><div><span>Конкретное действие, вопрос или рабочая версия.</span><button type="submit">Выполнить</button></div></form></section>${factPanel()}</main></div>`}
function reveal(){return `<div class="v4-shell"><div class="v4-top"><strong>CASE 91-M</strong><span>официальный исход</span></div><main class="v4-reveal"><p class="v4-kicker">ВАША ВЕРСИЯ ПРОШЛА ВНУТРЕННЮЮ ПРОВЕРКУ</p><h1>RODNEY DANIELS</h1><p>Мужчина, которого в ваших материалах до этого обозначали как бойфренда старшей дочери, — Rodney Daniels. Его арестовали в сентябре 2021 года. 16 августа 2023 года после шестидневного процесса присяжные признали его виновным в убийстве первой степени.</p><div class="v4-reveal-grid"><article><small>ВАША ВЕРСИЯ</small><p>${esc(state.hypothesis)}</p></article><article><small>РЕАЛЬНЫЙ ИСХОД</small><p>Обвинение строилось на совокупности реконструкции сцены, нового свидетеля, оружия, угроз и разрушенного алиби.</p></article></div><div class="v4-source-links"><a href="${SOURCES.arrest}" target="_blank" rel="noopener">Арест 2021 · Middlesex DA ↗</a><a href="${SOURCES.conviction}" target="_blank" rel="noopener">Приговор 2023 · Middlesex DA ↗</a></div><button class="v4-accept" data-action="reset">Пройти заново</button></main></div>`}
function render(){app.innerHTML=state.view==='opening'?opening():state.view==='reveal'?reveal():desk();bind()}
function bind(){app.querySelector('[data-action="accept"]')?.addEventListener('click',()=>{state.view='desk';save();render();window.scrollTo(0,0)});app.querySelectorAll('[data-action="reset"]').forEach(b=>b.addEventListener('click',()=>{localStorage.removeItem(KEY);state=fresh();render();window.scrollTo(0,0)}));const form=app.querySelector('[data-command-form]');if(form)form.addEventListener('submit',e=>{e.preventDefault();const box=app.querySelector('[data-command]');const raw=box.value.trim();if(!raw)return;const result=resolve(raw);if(result.kind!=='reveal')entry(raw,result.title,result.body,result.kind);save();render();requestAnimationFrame(()=>{const logs=app.querySelector('.v4-journal');if(logs)logs.lastElementChild?.scrollIntoView({behavior:'smooth',block:'nearest'});app.querySelector('[data-command]')?.focus()})})}
render();
window.MLMorenoSandbox={version:VERSION,getState:()=>JSON.parse(JSON.stringify(state)),reset(){localStorage.removeItem(KEY);state=fresh();render()}};
})();