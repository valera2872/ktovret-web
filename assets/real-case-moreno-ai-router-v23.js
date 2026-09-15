(()=>{
'use strict';
const FROM='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v2';
const TO='https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/ai-moreno-investigator-v10';
const KEY='ml-realcase-moreno-ai-v6';
const MARKER='moreno-public-v23';
const original=window.fetch.bind(window);
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const ACTORS={
 'бойфренд старшей дочери':'boyfriend',
 'приёмная мать Patricia':'mother',
 'приемная мать Patricia':'mother',
 'старшая дочь приёмной матери':'older_daughter',
 'старшая дочь приемной матери':'older_daughter',
 'младшая дочь приёмной матери':'younger_daughter',
 'младшая дочь приемной матери':'younger_daughter',
 'бывший житель второго этажа':'second_floor_witness'
};
function actorId(name){const n=norm(name);if(ACTORS[n])return ACTORS[n];if(/бойфренд/.test(n))return'boyfriend';if(/при[её]мн.*мать/.test(n))return'mother';if(/старш.*доч/.test(n))return'older_daughter';if(/младш.*доч/.test(n))return'younger_daughter';if(/втор.*этаж|сосед/.test(n))return'second_floor_witness';return''}
function actorFromItem(title){let m=norm(title).match(/^Ответ:\s*(.+)$/i);if(m){const id=actorId(m[1]);if(id)return[id,norm(m[1])]}const map=[[/^Опрос бойфренда/i,'boyfriend','бойфренд старшей дочери'],[/^Опрос при[её]мной матери/i,'mother','приёмная мать Patricia'],[/^Опрос бывшего жильца второго этажа/i,'second_floor_witness','бывший житель второго этажа']];for(const [re,id,label] of map)if(re.test(norm(title)))return[id,label];return['','']}
function buildMemory(){let state={};try{state=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}const entries=[];for(let i=0;i<(Array.isArray(state.journal)?state.journal:[]).length;i++){const turn=state.journal[i]||{},items=Array.isArray(turn.items)?turn.items:[];for(let j=0;j<items.length;j++){const item=items[j],title=norm(item?.title),body=norm(item?.body);if(!body||/^Память дела:/i.test(body)||/^Прямой допрос открыт$/i.test(title))continue;let [id,actor]=actorFromItem(title),storedBody=body;if(!id&&/^Опрос жильцов квартиры$/i.test(title)){const marker='Бойфренд старшей дочери заявил';const at=body.indexOf(marker);if(at>=0){id='boyfriend';actor='бойфренд старшей дочери';storedBody=body.slice(at)}}if(!id)continue;entries.push({entry_id:`t${i+1}-i${j+1}`,turn:i+1,actor_id:id,actor,type:/^Вы предъявили\s/i.test(body)?'confrontation':'statement',command:norm(turn.command).slice(0,260),title:title.slice(0,180),body:storedBody.slice(0,1200)})}}return{entries:entries.slice(-40)}}
function augmentBody(body){if(!body||typeof body!=='string')return body;try{const data=JSON.parse(body);if(data&&typeof data==='object'&&(data.action==='plan'||data.action==='interrogate'))data.memory=buildMemory();return JSON.stringify(data)}catch{return body}}
function publicHeaders(source){const h=new Headers(source||{});h.delete('authorization');h.delete('apikey');h.set('content-type','application/json');h.set('x-ml-client-version',MARKER);return h}
window.fetch=(input,init={})=>{
 if(typeof input==='string'&&input===FROM){const next={...init,headers:publicHeaders(init.headers),body:augmentBody(init.body)};return original(TO,next)}
 if(input instanceof Request&&input.url===FROM){const first=new Request(TO,input);const headers=publicHeaders(init.headers||first.headers);const request=new Request(first,{headers});const next={...init,headers,body:typeof init.body==='string'?augmentBody(init.body):init.body};return original(request,next)}
 return original(input,init);
};
window.MLMorenoAIRouterV23={version:'2.4.0',from:FROM,to:TO,buildMemory};
})();
