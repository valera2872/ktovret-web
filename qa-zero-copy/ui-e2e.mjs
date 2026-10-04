import { chromium } from 'playwright';
const expect=(v,m)=>{if(!v)throw new Error(m)};
const browser=await chromium.launch({headless:true});
const c1=await browser.newContext({viewport:{width:1440,height:1000}});
const p1=await c1.newPage();
const BASE='http://127.0.0.1:4173/client/index.html';
await p1.goto(BASE);
expect(await p1.locator('#intro').isVisible(),'intro not visible');
expect(await p1.locator('#game').isHidden(),'game should start hidden');

await p1.click('#demoBtn');
await p1.locator('#game').waitFor({state:'visible',timeout:20000});
expect((await p1.locator('#badge').innerText()).includes('ДЕМО'),'demo badge missing');
expect((await p1.locator('#badge').innerText()).includes('Следователь'),'demo creator role wrong');
expect(await p1.locator('#view-overview').isVisible(),'overview not visible after start');

await p1.locator('#starterMaterials .starter').first().waitFor({state:'visible',timeout:15000});
expect(await p1.locator('#starterMaterials .starter').count()>=3,'starter package did not load');

await p1.locator('.navitem[data-view="materials"]').click();
expect(await p1.locator('#view-materials').isVisible(),'materials view not visible');
await p1.locator('#starterMaterialsFull .material-row').first().click();
await p1.locator('#viewer.open').waitFor({state:'visible',timeout:15000});
expect((await p1.locator('#viewerTitle').innerText()).length>3,'viewer title missing');
expect(await p1.locator('#shareViewerBoard').isVisible(),'share-to-board action missing in viewer');
await p1.click('#backViewer');
expect(await p1.locator('#materialStage .stage-doc').isVisible(),'material stage missing after open');
expect(await p1.locator('#stageBoard').isVisible(),'share-to-board action missing on material stage');
const sharedTitle=(await p1.locator('#materialStage h2').innerText()).trim();
await p1.click('#stageBoard');
expect(await p1.locator('#view-board').isVisible(),'share-to-board did not open board');
expect((await p1.locator('#boardInput').inputValue()).includes(sharedTitle),'share-to-board did not carry material title');
await p1.fill('#boardInput',(await p1.locator('#boardInput').inputValue())+' QA наблюдение');
await p1.click('#boardBtn');
await p1.locator('#board').getByText('QA наблюдение',{exact:false}).waitFor({state:'visible',timeout:10000});

await p1.locator('.navitem[data-view="search"]').click();
await p1.fill('#query','доступ Ратникова');
const sp=p1.waitForResponse(r=>r.url().includes('zero-copy-room-v1')&&(r.request().postData()||'').includes('"action":"search"'),{timeout:15000});
await p1.click('#searchBtn');
const sr=await sp; expect(sr.ok(),'search HTTP failed');
await p1.locator('#results .hit').first().waitFor({state:'visible',timeout:15000});
expect((await p1.locator('#results').innerText()).includes('История обращений к тетради'),'expected search result missing');

await p1.locator('.navitem[data-view="board"]').click();
await p1.fill('#boardInput','QA v15: Ратников имел доступ');
await p1.click('#boardBtn');
await p1.locator('#board').getByText('QA v15: Ратников имел доступ').waitFor({state:'visible',timeout:10000});

await p1.locator('.navitem[data-view="notes"]').click();
await p1.fill('#noteInput','Личная заметка v15');
await p1.click('#noteBtn');
await p1.locator('#notes').getByText('Личная заметка v15').waitFor({state:'visible',timeout:10000});

await p1.locator('.navitem[data-view="people"]').click();
await p1.fill('#question','Когда вы в последний раз видели Анну?');
await p1.click('#talkBtn');
await p1.locator('#dialog article').first().waitFor({state:'visible',timeout:45000});
expect((await p1.locator('#dialog article').first().innerText()).length>20,'interrogation reply empty');

const before=await p1.locator('#badge').innerText();
await p1.click('#demoSwitch');
await p1.locator('#badge').filter({hasText:'Эксперт архива'}).waitFor({state:'visible',timeout:20000});
const after=await p1.locator('#badge').innerText();
expect(before!==after,'demo role did not change');
await p1.locator('#starterMaterials .starter').first().waitFor({state:'visible',timeout:15000});

await p1.locator('.navitem[data-view="search"]').click();
await p1.fill('#query','что нашли в коробке');
const sp2=p1.waitForResponse(r=>r.url().includes('zero-copy-room-v1')&&(r.request().postData()||'').includes('"action":"search"'),{timeout:15000});
await p1.click('#searchBtn'); const sr2=await sp2; expect(sr2.ok(),'archivist search HTTP failed');
await p1.locator('#results .hit').first().waitFor({state:'visible',timeout:15000});
expect((await p1.locator('#results').innerText()).includes('Осмотр L17-203'),'archivist expected result missing');

const c2=await browser.newContext({viewport:{width:390,height:844}});
const p2=await c2.newPage(); await p2.goto(BASE);
await p2.click('#demoBtn');
await p2.locator('#game').waitFor({state:'visible',timeout:20000});
expect(await p2.locator('.sidebar').isVisible(),'mobile navigation hidden');
expect(await p2.locator('#view-overview').isVisible(),'mobile overview hidden');

console.log(JSON.stringify({ok:true,checks:['v15-intro','demo-start','overview','starter-package','materials-view','viewer','material-stage','evidence-board-handoff','search','shared-board','private-note','ai-dialog','role-switch','archivist-search','mobile']})); 
await browser.close();