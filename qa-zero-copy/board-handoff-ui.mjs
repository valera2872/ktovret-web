import { chromium } from 'playwright';
const expect=(v,m)=>{if(!v)throw new Error(m)};
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1280,height:900}});
const page=await ctx.newPage();
let state={version:1,shared:{evidence:[],board:[],timeline:[],hypotheses:[]},mine:{evidence:[],notes:[]},interviews:{},final:null};
const material={id:'scene',title:'Протокол обнаружения',kind:'Документ',text:'Тестовый материал без сценарных выводов.'};
await page.route('**/functions/v1/**',async route=>{
  const req=route.request(); let body={}; try{body=JSON.parse(req.postData()||'{}')}catch{}
  const url=req.url(); let out={ok:true};
  if(url.includes('zero-copy-room-v1')){
    if(body.action==='demo_create') out={room:{code:'QATEST22'},me:{role:'investigator'},bothJoined:true,state,revision:1};
    else if(body.action==='status'||body.action==='start') out={me:{role:'investigator'},role:'investigator',bothJoined:true,state,revision:1};
    else if(body.action==='meta') out={results:[{id:'scene',title:material.title,kind:material.kind}]};
    else if(body.action==='open'){state.mine.evidence=['scene'];out={material};}
    else out={results:[]};
  } else if(url.includes('zero-copy-session-v1')){
    if(body.action==='patch'&&body.patch?.board_note){state.shared.board.push({by:'investigator',text:body.patch.board_note});}
    out={role:'investigator',bothJoined:true,state,revision:2};
  } else out={ok:true,reply:'QA'};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(out)});
});
await page.goto('http://127.0.0.1:4173/client/index.html');
await page.click('#demoBtn');
await page.locator('#game').waitFor({state:'visible'});
await page.locator('#starterMaterials .starter').first().click();
await page.locator('#viewer.open').waitFor({state:'visible'});
expect(await page.locator('#shareViewerBoard').isVisible(),'viewer board action missing');
await page.click('#shareViewerBoard');
expect(await page.locator('#view-board').isVisible(),'board not opened');
let v=await page.locator('#boardInput').inputValue();
expect(v.includes('Протокол обнаружения'),'material title not carried to board');
await page.fill('#boardInput',v+' заметка игрока');
await page.click('#boardBtn');
await page.locator('#board').getByText('заметка игрока',{exact:false}).waitFor({state:'visible'});
console.log(JSON.stringify({ok:true,checks:['viewer-handoff','title-prefill','player-observation','shared-board-render']}));
await browser.close();
