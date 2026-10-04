import { chromium } from 'playwright';
const base=process.env.EXACT_URL||'http://127.0.0.1:4174/';
const expect=(v,m)=>{if(!v)throw new Error(m)};
const browser=await chromium.launch({headless:true});
const desktop=await browser.newContext({viewport:{width:1440,height:1000}});
const p=await desktop.newPage();
let role='investigator';
let state={version:1,shared:{evidence:[],board:[],timeline:[],hypotheses:[]},mine:{evidence:[],notes:[]},interviews:{},final:null};
const mats={
 scene:{id:'scene',title:'Протокол обнаружения',kind:'Документ',text:'Анна Левина обнаружена в реставрационной рабочей зоне.'},
 passes:{id:'passes',title:'Журнал входов в служебную часть',kind:'Журнал',text:'Служебные проходы вечером 14 марта.'},
 catalog:{id:'catalog',title:'Карточка тетради Воронцова',kind:'Архив',text:'Архивное описание рукописи.'},
 photosession:{id:'photosession',title:'Съёмка Анны вечером 14 марта',kind:'Фотографии',text:'Рабочая фотосъёмка рукописи.'}
};
const list=()=>role==='investigator'?[mats.scene,mats.passes]:[mats.catalog,mats.photosession];
await p.route('**/functions/v1/**',async route=>{
 const req=route.request();let body={};try{body=JSON.parse(req.postData()||'{}')}catch{}
 const u=req.url();let out={ok:true};
 if(u.includes('zero-copy-room-v1')){
   if(body.action==='demo_create'){role='investigator';out={room:{code:'EXACT19'},me:{role},bothJoined:true,state,revision:1};}
   else if(body.action==='status'||body.action==='start'){out={me:{role},role,bothJoined:true,state,revision:1};}
   else if(body.action==='meta'){out={results:list().map(({id,title,kind})=>({id,title,kind}))};}
   else if(body.action==='search'){out={results:list().map(({id,title,kind})=>({id,title,kind}))};}
   else if(body.action==='open'){const m=mats[body.id]||list()[0];state.mine.evidence=[...new Set([...state.mine.evidence,m.id])];out={material:m};}
 }
 else if(u.includes('zero-copy-session-v1')){
   if(body.action==='patch'){
     if(body.patch?.board_note)state.shared.board.push({by:role,text:body.patch.board_note});
     if(body.patch?.private_note)state.mine.notes.push(body.patch.private_note);
   }
   out={role,bothJoined:true,state,revision:2};
 }
 else if(u.includes('zero-copy-interrogate-v1'))out={ok:true,suspect_id:body.suspect_id,reply:'Я отвечу только на то, что могу подтвердить.',mode:'ai',revision:3};
 else if(u.includes('zero-copy-final-v1'))out={ok:true,passed:true,message:'Реконструкция выдерживает проверку.',reveal:{title:'Разбор дела',paragraphs:['Тестовый reveal транспортного слоя.']}};
 await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(out)});
});
await p.goto(base,{waitUntil:'networkidle'});
expect(await p.locator('#intro').isVisible(),'intro not visible');
const asset=await p.request.get(new URL('assets/archive-lab-premium.png',base).href);
expect(asset.ok(),'premium hero asset HTTP load failed');
const assetBytes=(await asset.body()).length;expect(assetBytes>500000,'premium hero asset unexpectedly small');
const bg=await p.locator('#intro').evaluate(el=>getComputedStyle(el).backgroundImage);
expect(bg.includes('archive-lab-premium.png'),'premium hero background not applied');
await p.click('#demoBtn');
await p.locator('#game').waitFor({state:'visible'});
expect(await p.locator('#view-overview').isVisible(),'overview missing');
await p.locator('#starterMaterials .starter').first().waitFor({state:'visible',timeout:10000});
expect((await p.locator('#starterMaterials .starter').count())>=1,'starter materials missing');
await p.locator('#starterMaterials .starter').first().click();
await p.locator('#viewer.open').waitFor({state:'visible'});
expect(await p.locator('#shareViewerBoard').isVisible(),'viewer board handoff missing');
await p.click('#shareViewerBoard');
expect(await p.locator('#view-board').isVisible(),'board did not open');
const boardAsset=await p.request.get(new URL('assets/investigation-board.png',base).href);
expect(boardAsset.ok(),'investigation board asset HTTP load failed');
const boardBytes=(await boardAsset.body()).length;expect(boardBytes>500000,'investigation board asset unexpectedly small');
const boardImg=p.locator('#view-board .board-visual > img');
expect(await boardImg.isVisible(),'approved investigation board visual missing');
const boardNatural=await boardImg.evaluate(el=>({w:el.naturalWidth,h:el.naturalHeight}));
expect(boardNatural.w>500&&boardNatural.h>300,'investigation board visual failed to decode');
let v=await p.locator('#boardInput').inputValue();expect(v.length>3,'material title not carried');
await p.fill('#boardInput',v+' — проверено игроком');
await p.click('#boardBtn');
await p.locator('#board').getByText('проверено игроком',{exact:false}).waitFor({state:'visible'});
await p.click('[data-view="notes"]');
await p.fill('#noteInput','Личная гипотеза QA');
await p.click('#noteBtn');
await p.locator('#notes').getByText('Личная гипотеза QA',{exact:false}).waitFor({state:'visible'});
await p.click('[data-view="people"]');
await p.fill('#question','Что вы знаете об Анне?');await p.click('#talkBtn');
await p.locator('#dialog').getByText('подтвердить',{exact:false}).waitFor({state:'visible'});
await p.click('[data-view="final"]');
for(const id of ['who','why','how','where','when','evidence','lies'])await p.fill('#f_'+id,'Полная тестовая реконструкция '+id);
await p.click('#finalBtn');await p.locator('#reveal').waitFor({state:'visible'});
const mobile=await browser.newContext({viewport:{width:390,height:844}});const m=await mobile.newPage();
await m.route('**/functions/v1/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})}));
await m.goto(base,{waitUntil:'domcontentloaded'});
expect(await m.locator('#intro').isVisible(),'mobile intro missing');
expect((await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2)),'mobile horizontal overflow');
console.log(JSON.stringify({ok:true,checks:['exact-unpack','hero-asset','demo','overview','starter','viewer','board-handoff','private-note','ai-dialog','final-reveal','mobile-no-overflow'],heroBytes:assetBytes,boardBytes,boardNatural}));
await browser.close();
