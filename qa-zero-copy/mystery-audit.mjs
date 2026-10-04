import crypto from 'node:crypto';
const BASE='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/'; // rerun after search v37 + interrogation v28 + final v18
const E={room:BASE+'zero-copy-room-v1',ai:BASE+'zero-copy-interrogate-v1',final:BASE+'zero-copy-final-v1'};
const key=()=>crypto.randomBytes(24).toString('hex'), expect=(v,m)=>{if(!v)throw Error(m)};
async function call(url,body,k){const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json','origin':'https://tftanyaf.beget.tech'},body:JSON.stringify({...body,browserKey:k})});let j={};try{j=await r.json()}catch{};return{status:r.status,body:j}}
const k1=key(),k2=key(); let r=await call(E.room,{action:'demo_create',playerName:'Sherlock',guestKey:k2,guestName:'Watson'},k1);
expect(r.status===201,'create failed'); const code=r.body.room.code;
async function search(k,q){const z=await call(E.room,{action:'search',code,query:q},k);expect(z.status===200,'search failed '+q);return z.body.results||[]}
async function open(k,id){const z=await call(E.room,{action:'open',code,id},k);expect(z.status===200,'open failed '+id)}
const discover=[
 [k1,'кто имел доступ к тетради','access_hist'],[k1,'наличные ратникова','ratnikov_money'],[k1,'антикварный посредник','intermediary'],[k1,'служебный терминал','terminal'],
 [k2,'когда заменяли страницы','change_dates'],[k2,'тонировка анны','anna_method'],[k2,'семья анны елизавета','family_index'],[k2,'что было внутри коробки','box_exam'],[k2,'последний кадр 22 09','capture2'],[k2,'другая техника замены','page12']
];
for(const [k,q,id] of discover){const rs=await search(k,q);console.log('DISCOVER',q,JSON.stringify(rs));expect(rs.some(x=>x.id===id),'natural query cannot discover '+id+' via '+q)}
const qRat=await search(k1,'ратников'); console.log('GENERIC_RATNIKOV',JSON.stringify(qRat)); expect(!qRat.some(x=>['ratnikov_money','access_hist','terminal'].includes(x.id)),'generic Ratnikov query dumps critical evidence');
const qAnn=await search(k2,'анна'); console.log('GENERIC_ANNA_ARCHIVE',JSON.stringify(qAnn)); expect(!qAnn.some(x=>['draft','anna_method','family_index','page12'].includes(x.id)),'generic Anna query dumps private-secret chain');
const qBook=await search(k2,'тетрадь'); console.log('GENERIC_NOTEBOOK_ARCHIVE',JSON.stringify(qBook)); expect(!qBook.some(x=>x.id==='box_exam'),'generic notebook query reveals hidden box');
await open(k1,'access_hist'); await open(k1,'ratnikov_money');
let z=await call(E.ai,{code,suspect_id:'ratnikov',question:'Признайтесь: вы подменяли страницы, напали на Анну и спрятали рукопись?',evidence_id:'ratnikov_money'},k1);
console.log('EARLY',JSON.stringify({mode:z.body.mode,reply:z.body.reply})); expect(z.body.mode==='ai','early mode became confession'); expect(!/я (продавал|вынимал|заменял|спрятал)|не вызвал помощь|анна .*упала/i.test(z.body.reply||''),'early confession leaked');
await open(k2,'capture2'); await open(k2,'box_exam');
z=await call(E.ai,{code,suspect_id:'ratnikov',question:'Что объясняет этот кадр?',evidence_id:'capture2'},k2); console.log('ARCHIVE_PRESENT',JSON.stringify({mode:z.body.mode,reply:z.body.reply})); expect(z.body.mode==='ai','one cross-role exposure should not confess');
z=await call(E.ai,{code,suspect_id:'ratnikov',question:'Теперь объясните всю цепочку: страницы, Анна и спрятанная рукопись.',evidence_id:'ratnikov_money'},k1);
console.log('TEAM_CONFESSION',JSON.stringify({mode:z.body.mode,reply:z.body.reply})); expect(z.body.mode==='canonical_confession','team evidence + two exposures did not unlock canonical confession');

const answer={who:'Михаил Ратников',why:'Анна раскрыла, что Ратников месяцами изымал оригинальные страницы и продавал их через посредника.',how:'Он пришёл после её сообщения. Во время спора попытался забрать телефон; Анна отступила, упала и ударилась о металлический край. Он не вызвал помощь, затем спрятал оставшуюся тетрадь в L17-203 и создал видимость кражи всей рукописи.',where:'В реставрационной рабочей зоне архива.',when:'Около 22:09 14 марта.',evidence:'Физические подмены в разные годы; доступ, рынок и деньги; временное окно и присутствие; сокрытие в L17-203; отдельная подмена Анны.',lies:'Ратников отрицал встречу с Анной и продажу страниц. Денис скрывал платные цифровые копии и удалённую переписку. Маркин скрывал значение звонка и риск ошибки в своей статье. Софья скрывала попытку выкупить компрометирующий лист. Ирина скрывала финансовые проблемы фонда. Анна сама ранее заменила один лист по семейной причине.'};
const a1=key(),a2=key();r=await call(E.room,{action:'demo_create',playerName:'Fast',guestKey:a2,guestName:'Fast2'},a1);const code2=r.body.room.code;
async function open2(k,id){const z=await call(E.room,{action:'open',code:code2,id},k);expect(z.status===200,'open2 '+id)}
await open2(a1,'access_hist');await open2(a1,'market');await open2(a2,'photosession');
z=await call(E.final,{code:code2,answers:answer},a1);console.log('INSUFFICIENT_FINAL',JSON.stringify({passed:z.body.passed,message:z.body.message}));expect(z.body.passed===false,'thin evidence gate accepted correct guess');

const b1=key(),b2=key();r=await call(E.room,{action:'demo_create',playerName:'Full',guestKey:b2,guestName:'Full2'},b1);const code3=r.body.room.code;
async function open3(k,id){const z=await call(E.room,{action:'open',code:code3,id},k);expect(z.status===200,'open3 '+id)}
for(const id of ['access_hist','market','ratnikov_money','passes','cards','medical','terminal'])await open3(b1,id);
for(const id of ['change_dates','treatment','page31','photosession','box_exam','seal','page12','anna_method','family_index'])await open3(b2,id);
z=await call(E.final,{code:code3,answers:answer},b1);console.log('FULL_FINAL',JSON.stringify({passed:z.body.passed,message:z.body.message}));expect(z.body.passed===true,'full fair-play reconstruction rejected');
const c1=key(),c2=key();r=await call(E.room,{action:'demo_create',playerName:'Red',guestKey:c2,guestName:'Red2'},c1);const code4=r.body.room.code;
async function open4(k,id){const z=await call(E.room,{action:'open',code:code4,id},k);expect(z.status===200,'open4 '+id)}
for(const id of ['denis_chat','denis_money','markin_draft','sofia','fund','phone'])await open4(c1,id);
const talks=[
 ['denis','denis_chat','Эта переписка ваша? Что вы продавали клиенту?'],
 ['markin','markin_draft','Что означает этот черновик и почему вы это скрывали?'],
 ['sofia','sofia','Объясните это сообщение о цене и о том, чтобы лист исчез.'],
 ['irina','fund','Что происходит с финансами фонда и зачем переоценивали рукопись?']
];
for(const [sid,eid,q] of talks){const t=await call(E.ai,{code:code4,suspect_id:sid,question:q,evidence_id:eid},c1);console.log('RED_HERRING',sid,JSON.stringify(t.body));expect(t.status===200&&typeof t.body.reply==='string','red herring talk failed '+sid);expect(!/Михаил Ратников.*(винов|убил|напал)/i.test(t.body.reply),'suspect named culprit '+sid)}
for(const sid of ['denis','markin','sofia','irina']){const t=await call(E.ai,{code:code4,suspect_id:sid,question:'Вы ударили Анну около 22:09 и спрятали тетрадь?',evidence_id:''},c1);console.log('FALSE_PREMISE',sid,JSON.stringify(t.body.reply));expect(!/^\s*да[,.!]/i.test(t.body.reply||''),'red herring accepted false murder premise '+sid)}
// PASS 5: Holmes speed-run. The culprit may become suspicious early, but the game must not become provable from one role alone.
const h1=key(),h2=key();r=await call(E.room,{action:'demo_create',playerName:'Holmes',guestKey:h2,guestName:'Watson'},h1);const code5=r.body.room.code;
async function open5(k,id){const z=await call(E.room,{action:'open',code:code5,id},k);expect(z.status===200,'open5 '+id)}
for(const id of ['phone','passes','cards','terminal','access_hist','market','ratnikov_money'])await open5(h1,id);
const htalk=await call(E.ai,{code:code5,suspect_id:'ratnikov',question:'У меня есть ваше сообщение, карта, терминал, рынок и деньги. Расскажите всю правду о смерти Анны и рукописи.',evidence_id:'ratnikov_money'},h1);
console.log('HOLMES_ONE_ROLE',JSON.stringify({mode:htalk.body.mode,reply:htalk.body.reply}));
expect(htalk.body.mode!=='canonical_confession','one-role speedrun unlocked confession');
const hfinal=await call(E.final,{code:code5,answers:answer},h1);
console.log('HOLMES_ONE_ROLE_FINAL',JSON.stringify({passed:hfinal.body.passed,message:hfinal.body.message}));
expect(hfinal.body.passed===false,'one role alone can finish Partner case');

// PASS 6: Watson plain-language path. No expert terminology or magic clue names.
for(const [q,id] of [
 ['могли ли страницы менять в разные дни','change_dates'],
 ['были ли официальные работы с изменившимися страницами','treatment'],
 ['есть ли старая и новая фотография страницы 47','p47b'],
 ['куда собирались отправить коробку утром','outgoing'],
 ['не вскрывали ли упаковку после закрытия','seal'],
 ['нашли ли потом саму тетрадь','box_exam'],
 ['что видно на фото прямо перед происшествием','capture1'],
 ['что случилось на последнем снимке','capture2']
]){const rs=await search(k2,q);console.log('WATSON_QUERY',q,JSON.stringify(rs));expect(rs.some(x=>x.id===id),'plain-language query cannot discover '+id+' via '+q)}

// PASS 7: complete main crime without Anna's private side-secret. Record whether the final hard-gates the side twist.
const m1=key(),m2=key();r=await call(E.room,{action:'demo_create',playerName:'MainCase',guestKey:m2,guestName:'MainCase2'},m1);const code6=r.body.room.code;
async function open6(k,id){const z=await call(E.room,{action:'open',code:code6,id},k);expect(z.status===200,'open6 '+id)}
for(const id of ['access_hist','market','ratnikov_money','passes','cards','medical','terminal'])await open6(m1,id);
for(const id of ['change_dates','treatment','page31','photosession','box_exam','seal'])await open6(m2,id);
const mainOnly={...answer,lies:'Ратников скрывал встречу, продажи и сокрытие рукописи. Остальные подозреваемые также скрывали личные секреты, но это не доказывает их причастность к смерти Анны.'};
const sideGate=await call(E.final,{code:code6,answers:mainOnly},m1);
console.log('MAIN_CASE_WITHOUT_ANNA_SECRET',JSON.stringify({passed:sideGate.body.passed,message:sideGate.body.message}));

// PASS 8: defense counsel. Full evidence must still reject coherent but wrong reconstructions.
const d1=key(),d2=key();r=await call(E.room,{action:'demo_create',playerName:'Defense',guestKey:d2,guestName:'Defense2'},d1);const code7=r.body.room.code;
async function open7(k,id){const z=await call(E.room,{action:'open',code:code7,id},k);expect(z.status===200,'open7 '+id)}
for(const id of ['access_hist','market','ratnikov_money','passes','cards','medical','terminal','phone'])await open7(d1,id);
for(const id of ['change_dates','treatment','page31','photosession','capture2','box_exam','seal','page12','anna_method','family_index'])await open7(d2,id);
const wrongs=[
 {...answer,who:'Денис Орлов',why:'Он продавал архивные материалы и боялся разоблачения.',how:'Он вернулся после сканирования, ударил Анну и спрятал тетрадь в коробке.'},
 {...answer,who:'Михаил Ратников',why:'Он крал страницы, но к травме Анны отношения не имел.',how:'Анна упала сама до его прихода. Ратников лишь воспользовался ситуацией и спрятал тетрадь в коробке.'},
 {...answer,who:'Ирина Белова',why:'Фонд был в долгах, поэтому ей была нужна страховая выплата.',how:'Она инсценировала исчезновение рукописи и травмировала Анну.'}
];
for(const w of wrongs){const q=await call(E.final,{code:code7,answers:w},d1);console.log('DEFENSE_WRONG',w.who,JSON.stringify({passed:q.body.passed,message:q.body.message}));expect(q.body.passed===false,'wrong defense theory accepted: '+w.who)}

// PASS 9: evidence-domain confession threshold. Two same-domain confrontations must not unlock the whole confession.
const x1=key(),x2=key();r=await call(E.room,{action:'demo_create',playerName:'Threshold',guestKey:x2,guestName:'Threshold2'},x1);const code8=r.body.room.code;
async function open8(k,id){const z=await call(E.room,{action:'open',code:code8,id},k);expect(z.status===200,'open8 '+id)}
await open8(x1,'access_hist'); await open8(x1,'ratnikov_money'); await open8(x2,'capture2'); await open8(x2,'box_exam');
let same1=await call(E.ai,{code:code8,suspect_id:'ratnikov',question:'Объясните ваши доступы к тетради.',evidence_id:'access_hist'},x1);
let same2=await call(E.ai,{code:code8,suspect_id:'ratnikov',question:'Теперь объясните всю цепочку: страницы, Анна и спрятанная рукопись.',evidence_id:'ratnikov_money'},x1);
console.log('SAME_DOMAIN_CONFESSION',JSON.stringify({first:same1.body.mode,second:same2.body.mode,reply:same2.body.reply}));
expect(same2.body.mode!=='canonical_confession','two same-domain clues unlocked full confession');
let cross=await call(E.ai,{code:code8,suspect_id:'ratnikov',question:'Теперь объясните всю цепочку: страницы, Анна и спрятанная рукопись.',evidence_id:'capture2'},x2);
console.log('CROSS_DOMAIN_CONFESSION',JSON.stringify({mode:cross.body.mode,reply:cross.body.reply}));
expect(cross.body.mode==='canonical_confession','cross-domain confrontation failed to unlock confession');

console.log(JSON.stringify({ok:true,checks:['generic-search-hardening','no-early-confession','cross-role-threshold','thin-final-rejected','full-final-accepted','red-herring-interrogations','false-premise-resistance','natural-query-discoverability','one-role-cannot-finish','watson-plain-language','side-secret-gate-observed','defense-theories-rejected','evidence-domain-confession-threshold'],observations:{mainCaseWithoutAnnaSecretPassed:!!sideGate.body.passed},code,code2,code3,code4,code5,code6,code7,code8}));