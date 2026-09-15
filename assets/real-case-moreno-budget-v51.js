(()=>{
'use strict';
const ENDPOINT='/functions/v1/ai-moreno-investigator-v1';
const VISITOR_KEY='ml-ai-detective-visitor-v1';
const nativeFetch=window.fetch.bind(window);
function newId(){return `v-${crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`}`}
function visitorId(){let id='';try{id=localStorage.getItem(VISITOR_KEY)||''}catch{}if(!/^v-[a-zA-Z0-9-]{8,120}$/.test(id)){id=newId();try{localStorage.setItem(VISITOR_KEY,id)}catch{}}return id}
function quotaPayload(action,message,code){if(action==='interrogate')return {topic:'quota',reply:message,unlocks:[],mode:'source_limit',quota_code:code};return {intent:'clarify',target:null,object:null,question:null,hypothesis:null,clarification:message,mode:'quota',quota_code:code}}
window.fetch=async function(input,init){const url=typeof input==='string'?input:(input?.url||'');if(!url.includes(ENDPOINT))return nativeFetch(input,init);let body=null;try{body=JSON.parse(String(init?.body||'{}'))}catch{return nativeFetch(input,init)}if(body.action!=='status')body.visitor_id=visitorId();const response=await nativeFetch(input,{...init,body:JSON.stringify(body)});if(response.status!==429)return response;let data={};try{data=await response.clone().json()}catch{}const message=String(data?.message||'Лимит ИИ временно исчерпан. Попробуйте позже.');const safe=quotaPayload(body.action,message,String(data?.code||'quota'));return new Response(JSON.stringify(safe),{status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})};
window.MLMorenoBudget={visitorId,version:'0.5.1'};
})();