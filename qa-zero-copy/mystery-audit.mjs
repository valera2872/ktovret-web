import crypto from 'node:crypto';
const BASE='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/';
const E={room:BASE+'zero-copy-room-v1',ai:BASE+'zero-copy-interrogate-v1',final:BASE+'zero-copy-final-v1'};
const key=()=>crypto.randomBytes(24).toString('hex'), expect=(v,m)=>{if(!v)throw Error(m)};
async function call(url,body,k){const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json','origin':'https://tftanyaf.beget.tech'},body:JSON.stringify({...body,browserKey:k})});let j={};try{j=await r.json()}catch{};return{status:r.status,body:j}}
const k1=key(),k2=key(); let r=await call(E.room,{action:'demo_create',playerName:'Sherlock',guestKey:k2,guestName:'Watson'},k1);
expect(r.status===201,'create failed'); const code=r.body.room.code;
async function search(k,q){const z=await call(E.room,{action:'search',code,query:q},k);expect(z.status===200,'search failed '+q);return z.body.results||[]}
async function open(k,id){const z=await call(E.room,{action:'open',code,id},k);expect(z.status===200,'open failed '+id)}
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

const answer={who:'Михаил Ратников',why:'Анна раскрыла, что Ратников месяцами изымал оригинальные страницы и продавал их через посредника.',how:'Он пришёл после её сообщения, во время конфликта Анна получила смертельную травму, после чего он не вызвал помощь и инсценировал исчезновение рукописи.',where:'В реставрационной рабочей зоне архива.',when:'Около 22:09 14 марта.',evidence:'Физические подмены в разные годы; доступ, рынок и деньги; временное окно и присутствие; сокрытие в L17-203; отдельная подмена Анны.',lies:'Ратников отрицал встречу и продажи; Денис, Маркин, Софья и Ирина скрывали отдельные секреты; Анна ранее заменила один лист по семейной причине.'};
const a1=key(),a2=key();r=await call(E.room,{action:'demo_create',playerName:'Fast',guestKey:a2,guestName:'Fast2'},a1);const code2=r.body.room.code;
async function open2(k,id){const z=await call(E.room,{action:'open',code:code2,id},k);expect(z.status===200,'open2 '+id)}
await open2(a1,'access_hist');await open2(a1,'market');await open2(a2,'photosession');
z=await call(E.final,{code:code2,answers:answer},a1);console.log('INSUFFICIENT_FINAL',JSON.stringify({passed:z.body.passed,message:z.body.message}));expect(z.body.passed===false,'thin evidence gate accepted correct guess');

const b1=key(),b2=key();r=await call(E.room,{action:'demo_create',playerName:'Full',guestKey:b2,guestName:'Full2'},b1);const code3=r.body.room.code;
async function open3(k,id){const z=await call(E.room,{action:'open',code:code3,id},k);expect(z.status===200,'open3 '+id)}
for(const id of ['access_hist','market','ratnikov_money','passes','cards','medical','terminal'])await open3(b1,id);
for(const id of ['change_dates','treatment','page31','photosession','box_exam','seal','page12','anna_method','family_index'])await open3(b2,id);
z=await call(E.final,{code:code3,answers:answer},b1);console.log('FULL_FINAL',JSON.stringify({passed:z.body.passed,message:z.body.message}));expect(z.body.passed===true,'full fair-play reconstruction rejected');
console.log(JSON.stringify({ok:true,checks:['generic-search-hardening','no-early-confession','cross-role-threshold','thin-final-rejected','full-final-accepted'],code,code2,code3}));