import { chromium } from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('qa-zero-copy/screenshots/build19',{recursive:true});
const browser=await chromium.launch({headless:true});
async function setup(viewport,name){
 const c=await browser.newContext({viewport}); const p=await c.newPage();
 let state={version:1,shared:{evidence:[],board:[{by:'investigator',text:'Материал «Протокол обнаружения» — место обнаружения требует сверки со временем проходов.'}],timeline:[],hypotheses:[]},mine:{evidence:[],notes:[]},interviews:{},final:null};
 const mats=[{id:'scene',title:'Протокол обнаружения',kind:'Документ',text:'Анна Левина обнаружена в реставрационной рабочей зоне.'},{id:'passes',title:'Журнал входов в служебную часть',kind:'Журнал',text:'Служебные проходы вечером 14 марта.'},{id:'cards',title:'Кому выданы служебные карты',kind:'Справка',text:'Список выданных служебных карт.'}];
 await p.route('**/functions/v1/**',async route=>{
   let body={};try{body=JSON.parse(route.request().postData()||'{}')}catch{}
   let out={ok:true};const u=route.request().url();
   if(u.includes('zero-copy-room-v1')){
     if(body.action==='demo_create')out={room:{code:'VISUAL19'},me:{role:'investigator'},bothJoined:true,state,revision:1};
     else if(body.action==='status'||body.action==='start')out={me:{role:'investigator'},role:'investigator',bothJoined:true,state,revision:1};
     else if(body.action==='meta'||body.action==='search')out={results:mats};
     else if(body.action==='open')out={material:mats.find(x=>x.id===body.id)||mats[0]};
   } else if(u.includes('zero-copy-session-v1'))out={role:'investigator',bothJoined:true,state,revision:2};
   else if(u.includes('zero-copy-interrogate-v1'))out={ok:true,reply:'Я отвечу только на то, что могу подтвердить.',mode:'ai'};
   else if(u.includes('zero-copy-final-v1'))out={ok:true,passed:false,message:'Реконструкция пока не выдерживает проверку.'};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(out)});
 });
 await p.goto('http://127.0.0.1:4175/',{waitUntil:'networkidle'});
 await p.screenshot({path:`qa-zero-copy/screenshots/build19/${name}-intro.png`,fullPage:true});
 await p.click('#demoBtn');await p.locator('#game').waitFor({state:'visible'});
 await p.locator('#starterMaterials .starter').first().waitFor({state:'visible',timeout:10000});
 await p.screenshot({path:`qa-zero-copy/screenshots/build19/${name}-overview.png`,fullPage:true});
 await p.click('[data-view="board"]');await p.screenshot({path:`qa-zero-copy/screenshots/build19/${name}-board.png`,fullPage:true});
 await c.close();
}
await setup({width:1440,height:1000},'desktop');
await setup({width:390,height:844},'mobile');
await browser.close();
console.log('visual screenshots written');
