import { chromium } from 'playwright';
const expect=(v,m)=>{if(!v)throw new Error(m)};
const browser=await chromium.launch({headless:true});
const c1=await browser.newContext({viewport:{width:1440,height:1000}});
const c2=await browser.newContext({viewport:{width:390,height:844}});
const p1=await c1.newPage(), p2=await c2.newPage();
const BASE='http://127.0.0.1:4173/client/index.html';
await p1.goto(BASE);
expect(await p1.locator('#intro').isVisible(),'intro not visible');
expect(await p1.locator('#game').isHidden(),'game should start hidden');
await p1.fill('#playerName','QA Следователь');
await p1.click('#createBtn');
await p1.locator('#lobby').waitFor({state:'visible',timeout:15000});
const code=(await p1.locator('#lobbyCode').innerText()).trim();
expect(/^[A-HJ-NP-Z2-9]{8}$/.test(code),'bad room code '+code);

await p2.goto(BASE+'?room='+code);
await p2.fill('#playerName','QA Эксперт');
await p2.click('#joinBtn');
await p2.locator('#game').waitFor({state:'visible',timeout:20000});
await p1.locator('#game').waitFor({state:'visible',timeout:20000});
expect((await p1.locator('#badge').innerText()).includes('Следователь'),'creator role wrong');
expect((await p2.locator('#badge').innerText()).includes('Эксперт архива'),'guest role wrong');

async function searchOpen(page,q,needle){
  await page.fill('#query',q);
  const responsePromise=page.waitForResponse(r=>r.url().includes('zero-copy-room-v1')&&r.request().method()==='POST'&&(r.request().postData()||'').includes('"action":"search"'),{timeout:15000});
  await page.click('#searchBtn');
  const sr=await responsePromise;
  expect(sr.ok(),'search HTTP failed '+sr.status());
  await page.locator('#searchBtn').filter({hasText:'Искать'}).waitFor({state:'visible',timeout:15000});
  const hits=page.locator('#results .hit'); const n=await hits.count(); let chosen=null;
  for(let i=0;i<n;i++){const t=await hits.nth(i).innerText(); if(t.includes(needle)){chosen=hits.nth(i);break}}
  expect(chosen,'missing search result '+needle+' for '+q);
  await chosen.click();
  await page.locator('#viewer.open').waitFor({state:'visible',timeout:15000});
  expect((await page.locator('#viewerTitle').innerText()).includes(needle),'wrong viewer material');
  await page.click('#backViewer');
}
await searchOpen(p1,'доступ Ратникова','История обращений');
await searchOpen(p2,'что нашли в коробке','Осмотр L17-203');

await p1.fill('#boardInput','QA общая доска: Ратников имел доступ');
await p1.click('#boardBtn');
await p2.locator('#board').getByText('QA общая доска: Ратников имел доступ').waitFor({timeout:10000});

await p1.fill('#noteInput','Моя личная заметка QA');
await p1.click('#noteBtn');
await p1.locator('#notes').getByText('Моя личная заметка QA').waitFor({state:'visible',timeout:10000});
expect(await p2.locator('#notes').getByText('Моя личная заметка QA').count()===0,'private note leaked');

await p1.fill('#question','Когда вы в последний раз видели Анну?');
await p1.click('#talkBtn');
await p1.locator('#dialog article').first().waitFor({state:'visible',timeout:45000});
expect((await p1.locator('#dialog article').first().innerText()).length>20,'dialog reply empty');

await searchOpen(p1,'частные продажи посредник','Справка по частным продажам');
await searchOpen(p1,'деньги Ратникова посредник','Поступления Михаилу Ратникову');
await searchOpen(p2,'съёмка 22 09','Съёмка Анны');
await searchOpen(p2,'кадр 22 09 лампа','Кадр рабочей серии 22:09');

const fields={
'#f_who':'Михаил Ратников',
'#f_why':'Анна раскрыла, что Ратников месяцами изымал отдельные оригинальные страницы Воронцова, заменял их копиями и продавал через посредника. Она отказалась молчать.',
'#f_how':'После сообщения Анны Ратников пришёл к ней. Во время конфликта он пытался забрать телефон, Анна упала и получила смертельную травму. Он не вызвал помощь, затем спрятал оставшуюся тетрадь в коробке L17-203 и создал видимость кражи всей рукописи.',
'#f_where':'Ключевой конфликт произошёл в реставрационной рабочей зоне архива, а оставшуюся тетрадь спрятали внутри архива в L17-203.',
'#f_when':'Около 22:09 14 марта, после сообщения Анны в 22:04 и входа служебной карты в сектор.',
'#f_evidence':'Независимые линии: физические подмены страниц в разные годы; доступ Ратникова плюс рынок и деньги посредника; окно 22:09 и служебные проходы; действия после травмы и обнаружение тетради в L17-203.',
'#f_lies':'Ратников отрицал встречу и продажи. Денис скрывал платные цифровые копии, Маркин скрывал научную ошибку и разговор, Софья пыталась выкупить компрометирующий лист, Ирина скрывала финансовые проблемы. Анна сама раньше заменила один лист по семейной причине, но это отдельная тайна.'
};
for(const [sel,val] of Object.entries(fields)) await p1.fill(sel,val);
await p1.click('#finalBtn');
await p1.locator('#reveal').waitFor({state:'visible',timeout:45000});
expect((await p1.locator('#reveal').innerText()).includes('Тетрадь не исчезла целиком'),'reveal incorrect or missing');

const c3=await browser.newContext({viewport:{width:390,height:844}});
const p3=await c3.newPage(); await p3.goto(BASE);
await p3.click('#demoBtn');
await p3.locator('#game').waitFor({state:'visible',timeout:20000});
expect((await p3.locator('#badge').innerText()).includes('ДЕМО'),'demo badge missing');
const before=await p3.locator('#badge').innerText();
await p3.click('#demoSwitch');
await p3.waitForTimeout(1500);
const after=await p3.locator('#badge').innerText();
expect(before!==after&&after.includes('Эксперт архива'),'demo role switch failed');

console.log(JSON.stringify({ok:true,room:code,checks:['exact-client-intro','hidden-css','create-lobby','join-two-browser','desktop-mobile','role-ui','search-open','shared-board','private-notes','ai-dialog','correct-final-reveal','demo-open','demo-role-switch']}));
await browser.close();