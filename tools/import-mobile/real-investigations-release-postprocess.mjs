import fs from 'node:fs';
import path from 'node:path';

const NAV_LINK='<a class="ml-nav-new" data-nav-real-investigations href="./realnye-dela/">Реальные расследования <span class="ml-nav-new-badge">NEW</span></a>';
const LAUNCH_BAR='<div class="ml-launchbar" data-real-investigations-launchbar role="status"><strong>Новый продукт</strong><a href="./realnye-dela/">Реальные расследования — первое дело уже доступно →</a></div>';
const REAL_ROUTES=['https://mysterylogic.com/realnye-dela/','https://mysterylogic.com/realnye-dela/pozharnaya-lestnica-1991-premium/'];
let sitemapFinalizerRegistered=false;

const FEATURE=`<section class="ml-real-launch" id="real-investigations" data-real-investigations-launch>
  <div class="ml-real-launch-grid">
    <div class="ml-real-launch-copy">
      <p class="ml-kicker">Новый формат Mystery Logic</p>
      <h2>Реальные расследования</h2>
      <p class="ml-real-launch-lead">Дела, основанные на реальных событиях. Следствие ведёте вы.</p>
      <p>Изучайте материалы, задавайте свидетелям свободные вопросы, назначайте проверки и собирайте собственную версию. ИИ помогает выполнять ваши действия, но не отмечает противоречия и не называет виновного.</p>
      <div class="ml-real-tags"><span>реальное дело</span><span>AI-допрос</span><span>свободный маршрут</span><span>без прямых подсказок</span></div>
      <div class="ml-real-launch-actions">
        <a class="ref-btn ref-btn-primary" href="./realnye-dela/">Открыть расследования</a>
        <a class="ref-btn ref-btn-outline" href="./realnye-dela/pozharnaya-lestnica-1991-premium/">Начать первое дело</a>
      </div>
      <p class="ml-real-launch-note">Реальный исход остаётся закрытым, пока вы сами не сформулируете итоговую реконструкцию.</p>
    </div>
    <div class="ml-real-feature">
      <img src="./assets/real-investigations-hero.svg" alt="Стилизованный ночной двор с пожарной лестницей и материалами расследования" width="1200" height="900" loading="lazy" decoding="async">
      <div class="ml-real-feature-copy">
        <span class="ml-real-feature-status">Первое реальное дело</span>
        <h3>Девушка на пожарной лестнице</h3>
        <p>Malden, 1991. Семнадцатилетнюю Patricia Moreno находят тяжело раненой на пожарной лестнице. Дело остаётся без обвинения почти три десятилетия.</p>
        <a class="ml-real-feature-link" href="./realnye-dela/pozharnaya-lestnica-1991-premium/">Перейти к делу →</a>
      </div>
    </div>
  </div>
</section>`;

const FORMAT_CARD=`<a class="ref-format-card ref-format-card-real" data-real-investigations-card href="./realnye-dela/">
  <div class="ref-format-copy"><small>NEW · реальное дело</small><h3>Реальные<br>расследования</h3><p>Свободные AI-допросы, проверки и ваша собственная реконструкция событий.</p></div>
  <div class="ref-real-format-art"><img src="./assets/real-investigations-hero.svg" alt="Реальные расследования Mystery Logic" width="1200" height="900" loading="lazy" decoding="async"></div>
  <span class="ref-format-link">Открыть расследования →</span>
</a>`;

function finalizeSitemap(siteRoot){
  const file=path.join(siteRoot,'sitemap.xml');
  if(!fs.existsSync(file)) return;
  let xml=fs.readFileSync(file,'utf8');
  const lastmod=new Date().toISOString().slice(0,10);
  for(const url of REAL_ROUTES){
    if(xml.includes(`<loc>${url}</loc>`)) continue;
    xml=xml.replace('</urlset>',`<url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>\n</urlset>`);
  }
  fs.writeFileSync(file,xml);
}

function registerSitemapFinalizer(siteRoot){
  if(sitemapFinalizerRegistered) return;
  sitemapFinalizerRegistered=true;
  process.once('beforeExit',()=>finalizeSitemap(siteRoot));
}

export function preserveRealInvestigationsLaunch(siteRoot){
  const home=path.join(siteRoot,'index.html');
  const hub=path.join(siteRoot,'realnye-dela','index.html');
  const casePage=path.join(siteRoot,'realnye-dela','pozharnaya-lestnica-1991-premium','index.html');
  const hero=path.join(siteRoot,'assets','real-investigations-hero.svg');
  const css=path.join(siteRoot,'assets','real-investigations-launch.css');
  const compatCss=path.join(siteRoot,'assets','real-investigations-production-compat.css');
  for(const file of [home,hub,casePage,hero,css,compatCss]) if(!fs.existsSync(file)) throw new Error(`Real investigations release asset missing: ${file}`);

  let html=fs.readFileSync(home,'utf8');
  if(!html.includes('real-investigations-launch.css')) html=html.replace('</head>','  <link rel="stylesheet" href="./assets/real-investigations-launch.css?v=1.1.0">\n</head>');
  if(!html.includes('real-investigations-production-compat.css')) html=html.replace('</head>','  <link rel="stylesheet" href="./assets/real-investigations-production-compat.css?v=1.0.0">\n</head>');

  if(!html.includes('data-nav-real-investigations')){
    const logic='<a data-nav-logic href="./golovolomki-onlayn/">Головоломки</a>';
    if(html.includes(logic)) html=html.replace(logic,`${NAV_LINK}${logic}`);
    else html=html.replace('</nav>',`${NAV_LINK}</nav>`);
  }

  if(!html.includes('data-real-investigations-launchbar')){
    const main='<main class="ref-main ref-wrap">';
    if(!html.includes(main)) throw new Error('Production homepage main marker missing');
    html=html.replace(main,`${main}\n${LAUNCH_BAR}`);
  }

  if(!html.includes('data-real-investigations-launch>')){
    const heroPattern=/<section class="ref-home-hero">[\s\S]*?<\/section>/;
    const match=html.match(heroPattern);
    if(!match) throw new Error('Production homepage hero marker missing');
    html=html.replace(match[0],`${match[0]}\n${FEATURE}`);
  }

  if(!html.includes('data-real-investigations-card')){
    const formats=/<section class="ref-format-grid ml-material-formats"[^>]*>[\s\S]*?<\/section>/;
    const match=html.match(formats);
    if(!match) throw new Error('Production homepage format grid marker missing');
    const patched=match[0].replace('</section>',`${FORMAT_CARD}</section>`);
    html=html.replace(match[0],patched);
  }

  if(!html.includes('data-nav-real-investigations')) throw new Error('Real investigations nav item was not preserved');
  if(!html.includes('data-real-investigations-launchbar')) throw new Error('Real investigations launch bar was not preserved');
  if(!html.includes('data-real-investigations-launch')) throw new Error('Real investigations launch feature was not preserved');
  if(!html.includes('data-real-investigations-card')) throw new Error('Real investigations product card was not preserved');

  fs.writeFileSync(home,html);
  registerSitemapFinalizer(siteRoot);
  return {version:'1.1.0',homePatched:true,nav:true,launchbar:true,feature:true,card:true};
}
