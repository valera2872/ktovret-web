import fs from 'node:fs';
import path from 'node:path';

const read=(file)=>fs.readFileSync(file,'utf8');
const write=(file,html)=>fs.writeFileSync(file,html);
const stripTags=(value)=>String(value||'').replace(/<[^>]+>/g,'').replace(/&quot;/g,'"').replace(/&amp;/g,'&').trim();
const escAttr=(value)=>String(value||'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');

const descriptorFromH1=(h1)=>{
  const text=stripTags(h1).toLowerCase();
  if(text.includes('на время и маршрут')) return ['детективная задача на время','задача на время'];
  if(text.includes('ложь в показаниях')) return ['детективная загадка: кто врёт?','кто врёт?'];
  if(text.includes('по уликам и фактам')) return ['детективная задача с уликами','задача с уликами'];
  if(text.includes('пространственное мышление')) return ['логическая головоломка','головоломка'];
  if(text.includes('логическая головоломка с ответом')) return ['загадка на логику с ответом','загадка на логику'];
  if(text.includes('детективная загадка на логику')) return ['детективная загадка с ответом','детективная загадка'];
  return ['детективная задача онлайн','детективная задача'];
};

const fitCaseTitle=(caseName,longDescriptor,shortDescriptor)=>{
  const variants=[longDescriptor,shortDescriptor,'детективная задача'];
  for(const descriptor of variants){
    const title=`${caseName} — ${descriptor}`;
    if(title.length<=60) return title;
  }
  return caseName;
};

const patchTitle=(html,title)=>{
  let out=html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${title}</title>`);
  out=out.replace(/<meta property="og:title" content="[^"]*">/i,`<meta property="og:title" content="${escAttr(title)}">`);
  return out;
};

const patchDescription=(html,description)=>{
  let out=html.replace(/<meta name="description" content="[^"]*">/i,`<meta name="description" content="${escAttr(description)}">`);
  out=out.replace(/<meta property="og:description" content="[^"]*">/i,`<meta property="og:description" content="${escAttr(description)}">`);
  return out;
};

const patchH1=(html,h1)=>html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i,`<h1>${h1}</h1>`);

const patchCaseSeo=(siteRoot)=>{
  const casesRoot=path.join(siteRoot,'ru/cases');
  if(!fs.existsSync(casesRoot)) return {patched:0,maxTitle:0,maxDescription:0};
  const titles=[];
  let patched=0,maxTitle=0,maxDescription=0;
  for(const entry of fs.readdirSync(casesRoot,{withFileTypes:true})){
    if(!entry.isDirectory()) continue;
    const file=path.join(casesRoot,entry.name,'index.html');
    if(!fs.existsSync(file)) continue;
    let html=read(file);
    const h1Match=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if(!h1Match) throw new Error(`Final SEO: missing H1 in ${entry.name}`);
    const h1=stripTags(h1Match[1]);
    const caseName=h1.split(' — ')[0].trim();
    if(!caseName) throw new Error(`Final SEO: missing case name in ${entry.name}`);
    const [longDescriptor,shortDescriptor]=descriptorFromH1(h1);
    const title=fitCaseTitle(caseName,longDescriptor,shortDescriptor);
    const isFree=/Бесплатно в браузере без регистрации|Играйте онлайн бесплатно/i.test(html);
    const description=isFree
      ? `«${caseName}» — ${shortDescriptor}. Найдите противоречие и проверьте решение. Бесплатно онлайн, без регистрации.`
      : `«${caseName}» — ${shortDescriptor}. Сопоставьте факты, найдите противоречие. Полное дело с разбором — в Первом томе.`;
    html=patchDescription(patchTitle(html,title),description);
    write(file,html);
    titles.push(title);
    maxTitle=Math.max(maxTitle,title.length);
    maxDescription=Math.max(maxDescription,description.length);
    patched+=1;
  }
  if(patched!==100) throw new Error(`Final SEO expected 100 case pages, got ${patched}`);
  if(new Set(titles).size!==titles.length) throw new Error('Final SEO produced duplicate case titles');
  if(maxTitle>60) throw new Error(`Final SEO case title exceeds 60 chars: ${maxTitle}`);
  if(maxDescription>160) throw new Error(`Final SEO case description exceeds 160 chars: ${maxDescription}`);
  return {patched,maxTitle,maxDescription};
};

const hubSeo=new Map([
  ['index.html',{title:'Детективные игры онлайн — Mystery Logic',meta:'Mystery Logic — детективные игры онлайн, логические загадки и головоломки. 15 дел доступны бесплатно в браузере без регистрации.'}],
  ['kto-vret/index.html',{title:'«Кто врёт?» — 100 детективных дел онлайн',meta:'«Кто врёт?» — 100 коротких детективных задач с уликами и показаниями. Найдите противоречие, докажите ответ; первые 15 дел бесплатны.'}],
  ['dela/index.html',{title:'Архив «Кто врёт?» — 100 детективных дел',meta:'Архив «Кто врёт?»: 15 бесплатных детективных дел онлайн и полный Первый том из 100 детективных задач. Выбирайте дело по теме и сложности.'}],
  ['tom-1/index.html',{title:'Первый том «Кто врёт?» — 100 детективных задач',meta:'Первый том «Кто врёт?»: 100 детективных задач, 15 бесплатно и ещё 85 по одной покупке за 99 ₽. Без подписки и рекламы.',h1:'Первый том «Кто врёт?» — 100 детективных задач'}],
  ['detektivnye-igry-onlayn/index.html',{title:'Детективные игры онлайн бесплатно — 15 дел',meta:'Детективные игры онлайн бесплатно: 15 коротких дел в браузере без регистрации. Изучайте показания, находите противоречия и проверяйте версии.'}],
  ['detektivnye-zagadki-s-otvetami/index.html',{title:'Детективные загадки на логику с ответами',meta:'Детективные загадки на логику с ответами для взрослых и подростков. Найдите противоречие и получите подробный разбор решения.'}],
  ['logicheskie-detektivnye-zadachi/index.html',{title:'Логические детективные задачи с ответами онлайн',meta:'Логические детективные задачи онлайн: время, маршруты, улики и показания. Решайте по фактам и проверяйте ответ с подробным объяснением.'}],
  ['kto-vret-igra/index.html',{title:'Игра «Кто врёт?» онлайн — найдите ложь в показаниях',meta:'Игра «Кто врёт?» онлайн: сопоставьте показания с фактами, найдите невозможную деталь и получите полный логический разбор.'}],
  ['ru/besplatnye-detektivnye-dela/index.html',{title:'15 бесплатных детективных дел онлайн',meta:'15 бесплатных детективных дел онлайн без регистрации. Изучайте материалы, находите противоречия и сразу проверяйте решение.'}],
  ['golovolomki-onlayn/index.html',{title:'Головоломки онлайн для взрослых — бесплатно',meta:'Логические головоломки онлайн для взрослых: бесплатные детективные задачи в браузере без регистрации. Решайте и сразу проверяйте ответ.'}],
  ['zagadki-na-logiku-dlya-vzroslyh/index.html',{title:'Загадки на логику для взрослых с ответами',meta:'Загадки на логику для взрослых с ответами и подробными объяснениями. Бесплатные задачи в браузере без регистрации и случайных догадок.'}],
  ['detektivnye-igry-dlya-dvoih/index.html',{title:'Детективная игра для двоих онлайн',meta:'Детективная игра для двоих онлайн: пройдите одно дело, отправьте вызов другу и сравните время, попытки и подсказки. Начать можно бесплатно.'}],
]);

const patchHubSeo=(siteRoot)=>{
  let patched=0,maxTitle=0,maxDescription=0;
  const titles=[];
  for(const [relative,copy] of hubSeo){
    const file=path.join(siteRoot,relative);
    if(!fs.existsSync(file)) continue;
    let html=patchDescription(patchTitle(read(file),copy.title),copy.meta);
    if(copy.h1) html=patchH1(html,copy.h1);
    write(file,html);
    titles.push(copy.title);
    maxTitle=Math.max(maxTitle,copy.title.length);
    maxDescription=Math.max(maxDescription,copy.meta.length);
    patched+=1;
  }
  if(patched!==hubSeo.size) throw new Error(`Final SEO expected ${hubSeo.size} hubs, got ${patched}`);
  if(new Set(titles).size!==titles.length) throw new Error('Final SEO produced duplicate hub titles');
  if(maxTitle>60) throw new Error(`Final SEO hub title exceeds 60 chars: ${maxTitle}`);
  if(maxDescription>160) throw new Error(`Final SEO hub description exceeds 160 chars: ${maxDescription}`);
  return {patched,maxTitle,maxDescription};
};

export function applyFinalSeoPostprocess(siteRoot){
  const cases=patchCaseSeo(siteRoot);
  const hubs=patchHubSeo(siteRoot);
  return {casePages:cases.patched,hubPages:hubs.patched,maxCaseTitle:cases.maxTitle,maxCaseDescription:cases.maxDescription,maxHubTitle:hubs.maxTitle,maxHubDescription:hubs.maxDescription};
}
