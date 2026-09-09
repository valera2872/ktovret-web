import fs from 'node:fs';
import path from 'node:path';
import { siteUrl } from './site-config.mjs';

const ROUTES=[
  'detektivnye-igry-dlya-odnogo/mini/',
  'detektivnye-igry-dlya-odnogo/mini/krasnyy-svet/',
  'detektivnye-igry-dlya-odnogo/mini/dve-svechi/',
  'detektivnye-igry-dlya-odnogo/mini/medalon-na-shnure/',
  'detektivnye-igry-dlya-odnogo/mini/sled-poverh-sleda/',
  'detektivnye-igry-dlya-odnogo/mini/ten-ot-prozhektora/',
  'detektivnye-igry-dlya-odnogo/mini/shepot-za-steklom/',
  'detektivnye-igry-dlya-odnogo/mini/snimok-v-zerkale/',
  'detektivnye-igry-dlya-odnogo/mini/holodnaya-chashka/',
  'detektivnye-igry-dlya-odnogo/mini/lozh-ne-o-prestuplenii/',
  'detektivnye-igry-dlya-odnogo/mini/slovo-na-zerkale/'
];
let registered=false;

export function registerSoloMiniFinalizer(siteRoot){
  if(registered)return;
  registered=true;
  process.on('exit',()=>{
    const sitemap=path.join(siteRoot,'sitemap.xml');
    if(fs.existsSync(sitemap)){
      let xml=fs.readFileSync(sitemap,'utf8');
      const lastmod=new Date().toISOString().slice(0,10);
      const missing=ROUTES.filter(route=>!xml.includes(`<loc>${siteUrl(route)}</loc>`));
      if(missing.length){
        const block=missing.map(route=>`<url><loc>${siteUrl(route)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n');
        xml=xml.replace('</urlset>',`${block}\n</urlset>`);
        fs.writeFileSync(sitemap,xml);
      }
    }
    const reportFile=path.join(siteRoot,'assets/generated/import-report.json');
    if(fs.existsSync(reportFile)){
      const report=JSON.parse(fs.readFileSync(reportFile,'utf8'));
      report.soloMiniHub='detektivnye-igry-dlya-odnogo/mini';
      report.soloMiniCases=10;
      report.soloMiniPages=11;
      report.soloMiniVersion='1.0.0';
      report.indexableUrls=Number(report.indexableUrls||0)+ROUTES.filter(route=>route!=='detektivnye-igry-dlya-odnogo/mini/'||true).length;
      fs.writeFileSync(reportFile,JSON.stringify(report,null,2));
    }
  });
}
