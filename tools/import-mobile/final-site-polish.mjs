import fs from 'node:fs';
import path from 'node:path';

const read=(file)=>fs.readFileSync(file,'utf8');
const write=(file,html)=>fs.writeFileSync(file,html);
const stripTags=(value)=>String(value||'').replace(/<[^>]+>/g,'').replace(/&quot;/g,'"').replace(/&amp;/g,'&').trim();

const descriptorFromH1=(h1)=>{
  const text=stripTags(h1).toLowerCase();
  if(text.includes('на время и маршрут')) return 'детективная задача на время';
  if(text.includes('ложь в показаниях')) return 'кто врёт? Детективная загадка';
  if(text.includes('по уликам и фактам')) return 'детективная задача с уликами';
  if(text.includes('пространственное мышление')) return 'логическая головоломка';
  if(text.includes('логическая головоломка с ответом')) return 'загадка на логику с ответом';
  if(text.includes('детективная загадка на логику')) return 'детективная загадка с ответом';
  return 'детективная задача онлайн';
};

const smartCaseTitle=(html)=>{
  const h1Match=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if(!h1Match) return null;
  const h1=stripTags(h1Match[1]);
  const caseName=h1.split(' — ')[0].trim();
  if(!caseName) return null;
  const descriptor=descriptorFromH1(h1);
  let title=`${caseName} — ${descriptor}`;
  if(title.length>72) title=`${caseName} — детективная задача`;
  return title;
};

const patchTitle=(html,title)=>{
  let out=html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${title}</title>`);
  out=out.replace(/<meta property="og:title" content="[^"]*">/i,`<meta property="og:title" content="${title.replaceAll('"','&quot;')}">`);
  return out;
};

const patchCaseTitles=(siteRoot)=>{
  const casesRoot=path.join(siteRoot,'ru/cases');
  if(!fs.existsSync(casesRoot)) return {patched:0,branded:0};
  let patched=0,branded=0;
  for(const entry of fs.readdirSync(casesRoot,{withFileTypes:true})){
    if(!entry.isDirectory()) continue;
    const file=path.join(casesRoot,entry.name,'index.html');
    if(!fs.existsSync(file)) continue;
    let html=read(file);
    const title=smartCaseTitle(html);
    if(!title) continue;
    html=patchTitle(html,title);
    write(file,html);
    patched+=1;
    if(/<title>[^<]*\|\s*Mystery Logic<\/title>/i.test(html)) branded+=1;
  }
  if(patched!==100) throw new Error(`Final polish expected 100 case titles, got ${patched}`);
  if(branded!==0) throw new Error(`Final polish left ${branded} branded case titles`);
  return {patched,branded};
};

const hubTitles=new Map([
  ['kto-vret/index.html','«Кто врёт?» — 100 детективных дел онлайн'],
  ['dela/index.html','Архив «Кто врёт?» — 100 детективных дел'],
  ['tom-1/index.html','Первый том «Кто врёт?» — 100 детективных дел'],
  ['detektivnye-igry-onlayn/index.html','Детективные игры онлайн бесплатно — 15 дел'],
  ['detektivnye-zagadki-s-otvetami/index.html','Детективные загадки на логику с ответами'],
  ['logicheskie-detektivnye-zadachi/index.html','Логические детективные задачи с ответами онлайн'],
  ['kto-vret-igra/index.html','Игра «Кто врёт?» онлайн — найдите ложь в показаниях'],
  ['ru/besplatnye-detektivnye-dela/index.html','15 бесплатных детективных дел онлайн'],
  ['golovolomki-onlayn/index.html','Головоломки онлайн для взрослых — бесплатно'],
  ['zagadki-na-logiku-dlya-vzroslyh/index.html','Загадки на логику для взрослых с ответами'],
  ['detektivnye-igry-dlya-dvoih/index.html','Детективная игра для двоих онлайн'],
]);

const patchHubTitles=(siteRoot)=>{
  let patched=0;
  for(const [relative,title] of hubTitles){
    const file=path.join(siteRoot,relative);
    if(!fs.existsSync(file)) continue;
    write(file,patchTitle(read(file),title));
    patched+=1;
  }
  return patched;
};

const patchRussianInterface=(siteRoot)=>{
  const replacements=new Map([
    ['Сто коротких дел: обстоятельства, показания, логические ограничения и единственный доказуемый ответ. 15 расследований доступны бесплатно.','Сто коротких дел: обстоятельства, показания, улики и один доказуемый ответ. Первые 15 дел доступны бесплатно.'],
    ['Определите, какая деталь не могла появиться из заявленного источника знания.','Найдите деталь, которая противоречит фактам или показаниям.'],
    ['Ключевая улика не возникает из воздуха, а решение не зависит от случайной догадки. Все необходимые данные находятся в материалах дела. Нужно только увидеть их связь.','Ключевая улика не возникает из воздуха, а решение не зависит от случайной догадки. Все нужные сведения есть в материалах дела. Остаётся понять, как они связаны между собой.'],
    ['Ложь определяется несовместимостью с материалами, а не интуицией.','Ложь выдаёт противоречие с фактами дела, а не интуиция.'],
    ['Игра показывает единственную логическую цепочку и ключевые фрагменты.','После ответа вы увидите полный разбор: какие факты связаны между собой и почему другая версия невозможна.'],
    ['Мини-детективы, которые можно действительно решить','Короткие детективные дела, которые решаются по фактам'],
    ['«Кто врёт?» — это не тест на совпадение с автором.','«Кто врёт?» — это не игра в угадывание мысли автора.'],
  ]);
  let pages=0;
  for(const relative of ['index.html','kto-vret/index.html']){
    const file=path.join(siteRoot,relative);
    if(!fs.existsSync(file)) continue;
    let html=read(file),changed=false;
    for(const [from,to] of replacements){
      if(html.includes(from)){html=html.replaceAll(from,to);changed=true;}
    }
    if(changed){write(file,html);pages+=1;}
  }
  return pages;
};

const challengeStyle=`<style data-volume-challenge-style>
.volume-hero-side{display:grid;gap:14px;align-content:start;min-width:0}
.volume-challenge-card{position:relative;overflow:hidden;display:block;padding:24px;border:1px solid rgba(130,183,150,.28);border-radius:24px;background:radial-gradient(circle at 100% 0,rgba(130,183,150,.13),transparent 14rem),linear-gradient(155deg,#102a35,#091823);color:inherit;text-decoration:none;box-shadow:0 20px 54px rgba(0,0,0,.20);transition:transform .16s ease,border-color .16s ease}
.volume-challenge-card:after{content:"VS";position:absolute;right:-10px;bottom:-30px;color:rgba(185,220,198,.055);font-family:Georgia,serif;font-size:8rem;font-weight:900;line-height:1;pointer-events:none}
.volume-challenge-kicker{display:block;color:#b9dcc6;font-size:.68rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
.volume-challenge-card h2{max-width:260px;margin:13px 0 0;font-size:1.65rem;line-height:1.05;letter-spacing:-.025em}
.volume-challenge-card p{max-width:330px;margin:12px 0 0;color:#b8c7d2;font-size:.84rem;line-height:1.55}
.volume-challenge-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}
.volume-challenge-meta span{padding:6px 8px;border:1px solid rgba(185,220,198,.18);border-radius:999px;color:#cfe4d6;font-size:.66rem;font-weight:800}
.volume-challenge-link{display:inline-flex;margin-top:18px;color:#cfe4d6;font-size:.78rem;font-weight:900}
.volume-challenge-card:hover{border-color:rgba(130,183,150,.52);transform:translateY(-1px)}
@media(max-width:759px){.volume-challenge-card{border-radius:20px}}
</style>`;

const patchVolumeChallenge=(siteRoot)=>{
  const file=path.join(siteRoot,'tom-1/index.html');
  if(!fs.existsSync(file)) return false;
  let html=read(file);
  if(html.includes('data-volume-challenge-card')) return false;
  const purchase=html.match(/<aside class="volume-purchase-card">[\s\S]*?<\/aside>/i);
  if(!purchase) throw new Error('Final polish could not find volume purchase card');
  const challenge=`<a class="volume-challenge-card" data-volume-challenge-card href="../detektivnye-igry-dlya-dvoih/"><span class="volume-challenge-kicker">Дуэль · бесплатно</span><h2>Бросьте вызов другу</h2><p>Раскройте бесплатное дело, отправьте другу ссылку на то же расследование и сравните результат. Ваш ответ останется скрыт, пока друг не завершит дело.</p><div class="volume-challenge-meta"><span>одно дело</span><span>два результата</span><span>без регистрации</span></div><span class="volume-challenge-link">Как проходит дуэль →</span></a>`;
  html=html.replace(purchase[0],`<div class="volume-hero-side">${purchase[0]}${challenge}</div>`);
  html=html.replace('</head>',`${challengeStyle}</head>`);
  write(file,html);
  return true;
};

export function applyFinalSitePolish(siteRoot){
  const caseTitles=patchCaseTitles(siteRoot);
  const hubTitles=patchHubTitles(siteRoot);
  const russianPages=patchRussianInterface(siteRoot);
  const volumeChallenge=patchVolumeChallenge(siteRoot);
  return {caseTitles:caseTitles.patched,hubTitles,russianPages,volumeChallenge};
}
