import fs from 'node:fs';
import path from 'node:path';

const HOME_TITLE='Детективные игры онлайн — 15 бесплатных дел без регистрации';
const HOME_DESCRIPTION='15 детективных расследований бесплатно прямо в браузере. Изучайте улики, допрашивайте подозреваемых и найдите, кто врёт. Без регистрации. Есть игры для двоих.';
const TARGETS=new Map([
  ['dela/index.html','Онлайн-детективы — выбрать дело и начать расследование'],
  ['kto-vret/index.html','Кто врёт? — бесплатная детективная игра онлайн'],
  ['detektivnye-igry-dlya-dvoih/index.html','Детективные игры для двоих онлайн — играть бесплатно'],
  ['detektivnye-igry-dlya-dvoih/2317/index.html','Онлайн-расследование «Последний звонок в 23:17» — детективная игра'],
  ['detektivnye-igry-dlya-dvoih/407/index.html','Онлайн-расследование «Номер 407» — детективная игра'],
  ['detektivnye-igry-dlya-dvoih/poslednyaya-ariya/index.html','Онлайн-расследование «Последняя ария» — детективная игра'],
]);

const read=(file)=>fs.readFileSync(file,'utf8');
const write=(file,html)=>fs.writeFileSync(file,html);
const escAttr=(value)=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;');

function setTitle(html,title){
  let out=html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${title}</title>`);
  if(/<meta property="og:title" content="[^"]*">/i.test(out)) out=out.replace(/<meta property="og:title" content="[^"]*">/i,`<meta property="og:title" content="${escAttr(title)}">`);
  else out=out.replace('</head>',`<meta property="og:title" content="${escAttr(title)}">\n</head>`);
  return out;
}
function setDescription(html,description){
  let out=html;
  if(/<meta name="description" content="[^"]*">/i.test(out)) out=out.replace(/<meta name="description" content="[^"]*">/i,`<meta name="description" content="${escAttr(description)}">`);
  else out=out.replace('</head>',`<meta name="description" content="${escAttr(description)}">\n</head>`);
  if(/<meta property="og:description" content="[^"]*">/i.test(out)) out=out.replace(/<meta property="og:description" content="[^"]*">/i,`<meta property="og:description" content="${escAttr(description)}">`);
  else out=out.replace('</head>',`<meta property="og:description" content="${escAttr(description)}">\n</head>`);
  return out;
}
function sitelinkHeader(){
  return `<header class="ref-header ref-wrap ref-functional-header" data-functional-nav="v2"><a class="ref-brand" href="./" aria-label="Mystery Logic — главная"><span class="ref-brand-mark">ML</span><span class="ref-brand-copy"><strong>Mystery Logic</strong><small>Детективные дела</small></span></a><nav class="ref-nav" aria-label="Основная навигация"><a href="./delo/chetyre-vhoda-v-arhiv/">Играть бесплатно</a><a data-nav-solo href="./detektivnye-igry-dlya-odnogo/">Для одного</a><a data-nav-coop href="./detektivnye-igry-dlya-dvoih/">Для двоих</a><a href="./dela/">Все дела</a><a href="#method">Как играть</a></nav><a class="ref-login ref-dossier-cta" href="./tom-1/"><span class="ref-dossier-icon" aria-hidden="true">▤</span>Первый том</a></header>`;
}
function patchHome(siteRoot){
  const file=path.join(siteRoot,'index.html');
  let html=read(file);
  html=setDescription(setTitle(html,HOME_TITLE),HOME_DESCRIPTION);
  if(/<header class="ref-header ref-wrap[^>]*>[\s\S]*?<\/header>/.test(html)) html=html.replace(/<header class="ref-header ref-wrap[^>]*>[\s\S]*?<\/header>/,sitelinkHeader());
  else if(/<header class="ml-header ml-shell[^>]*>[\s\S]*?<\/header>/.test(html)) html=html.replace(/<header class="ml-header ml-shell[^>]*>[\s\S]*?<\/header>/,sitelinkHeader());
  html=html.replace(/<div class="ref-home-copy">[\s\S]*?<p class="ref-home-lead">[\s\S]*?<\/p>/,match=>{
    let out=match.replace(/<h1>[\s\S]*?<\/h1>/,`<h1>Детективные<br>игры онлайн</h1>`);
    out=out.replace(/<p class="ref-home-lead">[\s\S]*?<\/p>/,`<p class="ref-home-lead">${HOME_DESCRIPTION}</p>`);
    return out;
  });
  if(!html.includes(HOME_TITLE)||!html.includes(HOME_DESCRIPTION)||!html.includes('>Играть бесплатно</a>')||!html.includes('data-nav-solo href="./detektivnye-igry-dlya-odnogo/">Для одного</a>')||!html.includes('>Для двоих</a>')||!html.includes('>Все дела</a>')||!html.includes('>Как играть</a>')||!html.includes('data-functional-nav="v2"')) throw new Error('CTR SEO homepage patch failed');
  if(/<title>[^<]*Mystery Logic/i.test(html)) throw new Error('CTR SEO homepage title still contains brand');
  write(file,html);
}
function patchTwoPlayerFirstScreen(html){
  let out=html;
  out=out.replace(/<h1>Детективная игра для двоих онлайн<\/h1>/,'<h1>Детективные игры для двоих онлайн</h1>');
  out=out.replace(/<h1>Детективные игры для двоих онлайн — играть бесплатно<\/h1>/,'<h1>Детективные игры для двоих онлайн</h1>');
  const lead='Играйте вдвоём прямо в браузере: отдельные роли, разные улики и большие совместные расследования. Есть бесплатный короткий режим, регистрация не нужна.';
  if(/<p class="duel-lead">[\s\S]*?<\/p>/.test(out)) out=out.replace(/<p class="duel-lead">[\s\S]*?<\/p>/,`<p class="duel-lead"><strong>Два игрока. Одно расследование.</strong> ${lead}</p>`);
  if(/<p class="coop-lead">[\s\S]*?<\/p>/.test(out)) out=out.replace(/<p class="coop-lead">[\s\S]*?<\/p>/,`<p class="coop-lead"><strong>Два игрока получают разные материалы и раскрывают дело вместе.</strong> ${lead}</p>`);
  return out;
}
function patchTargets(siteRoot){
  let patched=0;
  for(const [relative,title] of TARGETS){
    const file=path.join(siteRoot,relative);
    if(!fs.existsSync(file)) throw new Error(`CTR SEO target missing: ${relative}`);
    let html=setTitle(read(file),title);
    if(relative==='detektivnye-igry-dlya-dvoih/index.html') html=patchTwoPlayerFirstScreen(html);
    write(file,html);
    patched+=1;
  }
  return patched;
}

export function applySeoCtrModernization(siteRoot){
  patchHome(siteRoot);
  const pages=patchTargets(siteRoot);
  return {pages:pages+1,homeTitle:HOME_TITLE,homeDescription:HOME_DESCRIPTION};
}
