import crypto from 'node:crypto';
const BASE='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/';
const E={room:BASE+'zero-copy-room-v1',session:BASE+'zero-copy-session-v1',ai:BASE+'zero-copy-interrogate-v1',final:BASE+'zero-copy-final-v1'};
const key=()=>crypto.randomBytes(24).toString('hex');
async function call(url,body){const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json','origin':'https://tftanyaf.beget.tech'},body:JSON.stringify(body)});let j={};try{j=await r.json()}catch{};if(!r.ok)throw new Error(url+' '+r.status+' '+JSON.stringify(j));return j}
const assert=(v,m)=>{if(!v)throw new Error(m)};
const log=(tag,obj)=>console.log(tag+' '+JSON.stringify(obj));
const k1=key(),k2=key();
let x=await call(E.room,{action:'demo_create',browserKey:k1,guestKey:k2,playerName:'Холмс',guestName:'Ватсон'});const code=x.room.code;log('ROOM',{code});
async function search(k,q){const r=await call(E.room,{action:'search',browserKey:k,code,query:q});return r.results||[]}
async function open(k,id){return call(E.room,{action:'open',browserKey:k,code,id})}
async function talk(k,suspect,q,evidence_id=''){return call(E.ai,{browserKey:k,code,suspect_id:suspect,question:q,evidence_id})}
async function status(k){return call(E.session,{action:'status',browserKey:k,code})}
async function findOpen(k,q,id){const rs=await search(k,q);assert(rs.some(z=>z.id===id),'query failed ['+q+'] -> '+id+' got '+JSON.stringify(rs));await open(k,id);log('FOUND',{q,id,top:rs.map(z=>z.id)})}

// PASS 1: blind / spoiler-hunter
for(const q of ['Ратников','Анна','тетрадь','22','убийца','кто виноват']){
 const rs=await search(k1,q); log('BLIND_INV',{q,ids:rs.map(z=>z.id)});
 const forbidden=new Set(['access_hist','intermediary','ratnikov_money','terminal']);
 assert(!rs.some(z=>forbidden.has(z.id)),'single broad query leaked sensitive clue '+q);
}
for(const q of ['Анна','страницы','тетрадь','подмена','коробка']){
 const rs=await search(k2,q); log('BLIND_ARCH',{q,ids:rs.map(z=>z.id)});
 assert(rs.length<=5,'search dumped too many materials');
}

// PASS 2: novice starter package should support activity but not solve
for(const id of ['scene','phone','camera','denis_chat','fund']) await open(k1,id);
for(const id of ['catalog','repair','cond19','photosession','box']) await open(k2,id);
let early=await talk(k1,'ratnikov','Вы причастны к тому, что произошло с Анной и рукописью?');
log('EARLY_RATNIKOV',{reply:early.reply});
assert(!/вынимал|продавал страницы|спрятал.*L17|не вызвал помощь/i.test(early.reply),'premature culprit confession');
for(const sid of ['denis','markin','sofia','irina']){const r=await talk(k1,sid,'Что вы скрываете в связи с этим делом?');log('NOVICE_'+sid.toUpperCase(),{reply:r.reply})}

// PASS 3: Holmes/Watson natural discovery, no magic wording
const invQueries=[
 ['кто имел доступ к тетради','access_hist'],
 ['продажа отдельных листов Воронцова','market'],
 ['контакты Ратникова с антикваром','intermediary'],
 ['наличные поступления Ратникову','ratnikov_money'],
 ['кто входил после 22 часов','passes'],
 ['кому принадлежала карта 04','cards'],
 ['компьютер после травмы','terminal']
];
for(const [q,id] of invQueries)await findOpen(k1,q,id);
const archQueries=[
 ['когда менялись страницы','change_dates'],
 ['что делали со страницами без реставрации','treatment'],
 ['страница 31 шов','page31'],
 ['страница 12 тонировка','page12'],
 ['как Анна тонировала бумагу','anna_method'],
 ['семья Анны Елизавета','family_index'],
 ['что нашли в коробке','box_exam'],
 ['отправка L17 203 15 марта','outgoing'],
 ['контрольная лента 88417','seal'],
 ['кадр 22 09 лампа','capture2']
];
for(const [q,id] of archQueries)await findOpen(k2,q,id);

// Alternative phrasings for critical discoverability
const alternatives=[
 [k1,'доступы Ратникова','access_hist'],[k1,'антикварный посредник','intermediary'],[k1,'деньги Ратникова','ratnikov_money'],
 [k2,'разные даты подмен','change_dates'],[k2,'копия Анны новая бумага','anna_method'],[k2,'тетрадь в коробке','box_exam'],[k2,'что произошло 22 09','capture2']
];
for(const [k,q,id] of alternatives){const rs=await search(k,q);assert(rs.some(z=>z.id===id),'alternative query failed '+q+' -> '+id);log('ALT',{q,id,top:rs.map(z=>z.id)})}

await findOpen(k2,'синий держатель карты','capture1');
const ctext=(await call(E.room,{action:'open',browserKey:k1,code,id:'cards'})).material.text;
const ptext=(await call(E.room,{action:'open',browserKey:k2,code,id:'capture1'})).material.text;
assert(/тёмно-син/i.test(ctext)&&/административн/i.test(ctext),'cross-role card clue missing');
assert(/тёмно-син/i.test(ptext)&&/номер.*нельзя/i.test(ptext),'capture clue is not correctly limited');
log('CROSS',{cards:ctext,capture:ptext});
const em=await search(k1,'когда вызвали скорую помощь');assert(em.some(z=>z.id==='scene'),'help-call fact not discoverable');log('HELP_CALL',{top:em.map(z=>z.id)});

// Timeline sanity assertions from opened materials
const rr=await call(E.room,{action:'open',browserKey:k2,code,id:'change_dates'});log('TIMELINE',{text:rr.material.text});
assert(/9 января/.test(rr.material.text)&&/28 января/.test(rr.material.text)&&/19 февраля/.test(rr.material.text)&&/14 марта/.test(rr.material.text),'replacement chronology not repaired');

// Ratnikov confrontation should resist one clue, confess only after threshold + exposure
let one=await talk(k1,'ratnikov','Вы всё-таки заходили к Анне после её сообщения?','access_hist');log('ONE_CLUE',{reply:one.reply});
assert(!/вынимал|продавал страницы|спрятал.*L17|не вызвал помощь/i.test(one.reply),'one clue caused full confession');
let two=await talk(k1,'ratnikov','Что объясняют ваши наличные и контакты?','ratnikov_money');log('TWO_CLUE',{reply:two.reply});
let conf=await talk(k1,'ratnikov','Теперь признайтесь: что произошло с Анной и рукописью и что вы сделали после этого?','capture2');log('CONFESSION',{mode:conf.mode,reply:conf.reply});
assert(conf.mode==='canonical_confession','confession threshold not reached');
assert(/L17-203/.test(conf.reply)&&/не вызвал помощь/.test(conf.reply),'canonical confession incomplete');

// PASS 4: alternative wrong theories with enough evidence must fail
const base={where:'В реставрационной мастерской',when:'Около 22:09 14 марта',evidence:'Сопоставлены изменения страниц, журналы доступа, рынок, временное окно, коробка и отдельная подмена Анны.',lies:'Несколько персонажей скрывали собственные секреты, не всякая ложь означает виновность.'};
const wrongs=[
 {who:'Денис Орлов',why:'Скрывал незаконную продажу цифровых копий',how:'Вернулся после сканирования, напал на Анну и спрятал тетрадь.'},
 {who:'Лев Маркин',why:'Хотел скрыть ошибку в своей статье',how:'Вернулся к Анне после звонка и устроил сцену кражи.'},
 {who:'Софья Воронцова',why:'Хотела уничтожить компрометирующий семейный лист',how:'Проникла обратно и спрятала тетрадь после конфликта.'},
 {who:'Ирина Белова',why:'Хотела получить страховую выплату для фонда',how:'Инсценировала кражу и напала на Анну.'}
];
for(const w of wrongs){const r=await call(E.final,{browserKey:k1,code,answers:{...base,...w}});log('WRONG_FINAL',{who:w.who,passed:r.passed,message:r.message});assert(r.passed===false,'wrong theory accepted '+w.who);assert(!/Ратников|Анн|коробк|отдельн.*подмен/i.test(r.message||''),'rejection text reveals case specifics')}

// Correct reconstruction, paraphrased
const right={
 who:'Михаил Ратников',
 why:'Анна раскрыла длительную схему: оригинальные листы Воронцова по одному исчезали и заменялись копиями, а Ратников был связан с их продажей. Она отказалась замять это.',
 how:'После её сообщения Ратников пришёл в служебную зону. В конфликте вокруг телефона Анна упала и получила смертельную травму. Вместо вызова помощи он продолжил скрывать произошедшее, поместил оставшуюся тетрадь в L17-203 и создал впечатление, будто рукопись украли целиком в тот вечер.',
 where:'Конфликт произошёл в реставрационной рабочей зоне; тетрадь затем была спрятана внутри архива в коробке L17-203.',
 when:'Около 22:09 14 марта: после сообщения в 22:04 и входа карты 04, до действий с терминалом и отправкой.',
 evidence:'Независимые цепочки: страницы менялись в разные даты без зарегистрированной реставрации; доступ Ратникова связан с рынком, посредником и наличными; фотосерия и проходы ограничивают время; терминал, отправка и L17-203 показывают сокрытие после события; страница 12, техника Анны и семейные материалы показывают отдельную подмену с другим мотивом.',
 lies:'Ратников скрывал контакт с Анной, коробку и продажи. Денис скрывал платные цифровые копии. Маркин скрывал научную ошибку и содержание разговора. Софья скрывала попытку выкупить компрометирующий лист. Ирина скрывала финансовое давление. Анна скрывала собственную более раннюю подмену одного листа по семейной причине.'
};
const good=await call(E.final,{browserKey:k1,code,answers:right});log('RIGHT_FINAL',{passed:good.passed,message:good.message,reveal:good.reveal?.title});assert(good.passed===true,'correct reconstruction rejected');

// PASS 5: role privacy / shared team evidence
const s1=await status(k1),s2=await status(k2);
assert(!s1.state.mine.evidence.includes('box_exam'),'archivist private evidence leaked to investigator mine');
assert(!s2.state.mine.evidence.includes('ratnikov_money'),'investigator private evidence leaked to archivist mine');
log('PRIVACY',{investigatorMine:s1.state.mine.evidence.length,archivistMine:s2.state.mine.evidence.length});
console.log(JSON.stringify({ok:true,code,passes:['spoiler-hunter','novice','holmes-watson-discovery','alternate-queries','partner-cross-clue','help-call','timeline','confession-threshold','four-wrong-theories','correct-reconstruction','role-privacy']}));

// audit rerun 3