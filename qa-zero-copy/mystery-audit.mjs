import crypto from 'node:crypto';
const BASE='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/';
const E={room:BASE+'zero-copy-room-v1',ai:BASE+'zero-copy-interrogate-v1',final:BASE+'zero-copy-final-v1'};
const key=()=>crypto.randomBytes(24).toString('hex');
async function call(url,body,k){const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json','origin':'https://tftanyaf.beget.tech'},body:JSON.stringify({...body,browserKey:k})});let j={};try{j=await r.json()}catch{};return{status:r.status,body:j}}
const k1=key(),k2=key();
let r=await call(E.room,{action:'demo_create',playerName:'Sherlock',guestKey:k2,guestName:'Watson'},k1);
if(r.status!==201)throw Error('create '+JSON.stringify(r)); const code=r.body.room.code;
console.log('ROOM',code);
for(const [role,k,qs] of [
 ['investigator',k1,['анна','тетрадь','22','деньги','кто был в архиве','ратников']],
 ['archivist',k2,['анна','тетрадь','страница','коробка','22','подмена']]
]) for(const q of qs){const z=await call(E.room,{action:'search',code,query:q},k);console.log('SEARCH',role,q,JSON.stringify(z.body.results||[]))}
async function open(k,id){const z=await call(E.room,{action:'open',code,id},k);if(z.status!==200)throw Error('open '+id+' '+JSON.stringify(z));}
await open(k1,'access_hist');
await open(k1,'ratnikov_money');
let z=await call(E.ai,{code,suspect_id:'ratnikov',question:'Признайтесь: вы подменяли страницы, напали на Анну и спрятали рукопись?',evidence_id:'ratnikov_money'},k1);
console.log('EARLY',JSON.stringify({mode:z.body.mode,reply:z.body.reply}));
await open(k2,'capture2'); await open(k2,'box_exam');
z=await call(E.ai,{code,suspect_id:'ratnikov',question:'Теперь у нас есть доступы, деньги, кадр 22:09 и найденная в коробке рукопись. Что произошло?',evidence_id:'ratnikov_money'},k1);
console.log('SPLIT_TEAM_FULL',JSON.stringify({mode:z.body.mode,reply:z.body.reply}));

const a={
 who:'Михаил Ратников',
 why:'Анна раскрыла, что Ратников месяцами изымал оригинальные страницы и продавал их через посредника.',
 how:'Он пришёл после её сообщения, во время конфликта Анна получила смертельную травму, после чего он не вызвал помощь и инсценировал исчезновение рукописи.',
 where:'В реставрационной рабочей зоне архива.',
 when:'Около 22:09 14 марта.',
 evidence:'Подмена страниц, доступ Ратникова, рынок листов, временное окно и последующее сокрытие.',
 lies:'Ратников отрицал встречу и продажи; остальные скрывали свои отдельные секреты; Анна сама ранее заменила один лист по семейной причине.'
};
const k3=key(),k4=key(); r=await call(E.room,{action:'demo_create',playerName:'Fast',guestKey:k4,guestName:'Fast2'},k3); const code2=r.body.room.code;
async function open2(k,id){const z=await call(E.room,{action:'open',code:code2,id},k);if(z.status!==200)throw Error('open2 '+id+' '+JSON.stringify(z));}
await open2(k3,'access_hist'); await open2(k3,'market'); await open2(k4,'photosession');
z=await call(E.final,{code:code2,answers:a},k3);
console.log('THREE_EVIDENCE_FINAL',JSON.stringify({passed:z.body.passed,message:z.body.message}));
console.log(JSON.stringify({audit:true,code,code2}));