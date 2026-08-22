import fs from 'node:fs';
import path from 'node:path';

const VERSION='1.0.0';
const LANDING='detektivnye-igry-dlya-dvoih/index.html';
const CASE='detektivnye-igry-dlya-dvoih/2317/index.html';

function addBodyClassAndMarker(html,className){
  return html.replace(/<body([^>]*)>/,(_,attrs='')=>{
    const wanted=className.trim().split(/\s+/).filter(Boolean);
    const classMatch=attrs.match(/\sclass=(['"])(.*?)\1/);
    let next=attrs;
    if(classMatch){
      const classes=[...new Set([...classMatch[2].split(/\s+/).filter(Boolean),...wanted])].join(' ');
      next=attrs.replace(classMatch[0],` class=${classMatch[1]}${classes}${classMatch[1]}`);
    }else next=`${attrs} class="${wanted.join(' ')}"`;
    if(!/\sdata-coop-v4=/.test(next)) next+=` data-coop-v4="${VERSION}"`;
    return `<body${next}>`;
  });
}

function addStyle(html,href,needle){
  if(html.includes(needle)) return html;
  return html.replace('</head>',`<link rel="stylesheet" href="${href}">\n</head>`);
}

function header(root){
  const nav=[['Главная',root],['Архив дел',`${root}dela/`],['Как это работает',`${root}#method`],['Первый том',`${root}tom-1/`],['О нас',`${root}#about`]];
  return `<header class="ref-header ref-wrap"><a class="ref-brand" href="${root}" aria-label="Mystery Logic — главная"><span class="ref-brand-mark">ML</span><span class="ref-brand-copy"><strong>Mystery Logic</strong><small>Детективные дела</small></span></a><nav class="ref-nav" aria-label="Основная навигация">${nav.map(([label,href])=>`<a href="${href}">${label}</a>`).join('')}</nav><a class="ref-login" href="${root}tom-1/"><span class="ref-login-icon" aria-hidden="true"></span>Доступ</a></header>`;
}

function footer(root){
  return `<footer class="ref-footer ref-wrap"><span>© 2026 Mystery Logic</span><span><a href="${root}dela/">Архив дел</a><a href="${root}detektivnye-igry-dlya-dvoih/">Для двоих</a><a href="${root}tom-1/">Первый том</a><a href="${root}offer/">Условия</a></span></footer>`;
}

function patchFile(file,{root,casePage=false}){
  let html=fs.readFileSync(file,'utf8');
  html=addStyle(html,`${root}assets/storefront-reference.css?v=4.0.1`,'storefront-reference.css');
  html=addStyle(html,`${root}assets/coop-v4.css?v=${VERSION}`,'coop-v4.css');
  html=addBodyClassAndMarker(html,'ref-storefront coop-v4');
  html=html.replace(/<header class="ml-header ml-shell(?: case2317-header)?">[\s\S]*?<\/header>/,header(root));
  if(!html.includes('class="ref-header ref-wrap"')) html=html.replace(/<body[^>]*>/,match=>`${match}${header(root)}`);
  if(!html.includes('class="ref-footer ref-wrap"')) html=html.replace('</body>',`${footer(root)}</body>`);
  const required=['data-coop-v4="1.0.0"','storefront-reference.css','coop-v4.css','class="ref-header ref-wrap"','class="ref-footer ref-wrap"'];
  if(casePage) required.push('data-case2317-app','case2317-boot'); else required.push('data-duel-room-app','coop-case-feature');
  for(const marker of required) if(!html.includes(marker)) throw new Error(`Co-op v4 missing ${marker}: ${path.relative(process.cwd(),file)}`);
  fs.writeFileSync(file,html);
}

export function applyCoopV4(siteRoot){
  const landing=path.join(siteRoot,LANDING);
  const caseFile=path.join(siteRoot,CASE);
  if(!fs.existsSync(landing)) throw new Error('Co-op v4 landing missing');
  if(!fs.existsSync(caseFile)) throw new Error('Co-op v4 23:17 case missing');
  patchFile(landing,{root:'../'});
  patchFile(caseFile,{root:'../../',casePage:true});
  return {pages:2,version:VERSION};
}
