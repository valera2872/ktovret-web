import fs from 'node:fs';
import path from 'node:path';
import {applyPremiumSurfaceV2} from './premium-surface-v2-postprocess.mjs';

const VERSION='3.3.0';
const SKIP_DIRS=new Set(['.git','.github','node_modules','tools','tests','artifacts','docs','ops','supabase','old.bac','admin']);

function relativeAsset(fromDir,asset){return path.relative(fromDir,asset).replaceAll(path.sep,'/');}

function patchRefNav(html){
  if(!html.includes('class="ref-nav"')) return html;
  const dela=html.match(/href="([^"]*?)dela\/"/);
  if(!dela) return html;
  const href=`${dela[1]}golovolomki-onlayn/`;
  if(html.includes('data-nav-logic')){
    html=html.replace(/<a data-nav-logic href="[^"]*">[^<]*<\/a>/,`<a data-nav-logic href="${href}">Головоломки</a>`);
  }else{
    html=html.replace(/(<nav class="ref-nav"[^>]*>[\s\S]*?)(<\/nav>)/,`$1<a data-nav-logic href="${href}">Головоломки</a>$2`);
  }
  const daily='<a data-nav-daily data-telegram-cta="header" href="https://t.me/mysterylogic" target="_blank" rel="noopener">Мини-дело дня ↗</a>';
  if(html.includes('data-nav-daily')){
    html=html.replace(/<a data-nav-daily[^>]*>[^<]*<\/a>/,daily);
  }else{
    html=html.replace(/(<nav class="ref-nav"[^>]*>[\s\S]*?)(<\/nav>)/,`$1${daily}$2`);
  }
  return html;
}

export function applyLogicSitewide(siteRoot){
  const root=path.resolve(siteRoot);
  const styleFile=path.join(root,'assets','logic-sitewide.css');
  const scriptFile=path.join(root,'assets','logic-sitewide.js');
  const ai01PromoStyleFile=path.join(root,'assets','ai01-launch-promo.css');
  const ai01PromoScriptFile=path.join(root,'assets','ai01-launch-promo.js');
  if(!fs.existsSync(styleFile)||!fs.existsSync(scriptFile)) throw new Error('logic sitewide assets missing');
  if(!fs.existsSync(ai01PromoStyleFile)||!fs.existsSync(ai01PromoScriptFile)) throw new Error('AI-01 launch promo assets missing');
  let pages=0,navPatched=0,legacyLinksRewritten=0,styledPages=0,aiPromoPages=0;

  const walk=(dir)=>{
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      if(entry.isDirectory()){
        if(SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(dir,entry.name));
        continue;
      }
      if(!entry.isFile()||entry.name!=='index.html') continue;
      const file=path.join(dir,entry.name);
      let html=fs.readFileSync(file,'utf8');
      const before=html;
      const legacy=(html.match(/logicheskie-detektivnye-zadachi\//g)||[]).length;
      if(legacy){html=html.replaceAll('logicheskie-detektivnye-zadachi/','logicheskie-zadachi/');legacyLinksRewritten+=legacy;}
      const navBefore=html;
      html=patchRefNav(html);
      if(html!==navBefore) navPatched++;

      const styleHref=relativeAsset(dir,styleFile);
      const styleTag=`<link data-logic-sitewide-style rel="stylesheet" href="${styleHref}?v=${VERSION}">`;
      if(/<link[^>]+logic-sitewide\.css[^>]*>/i.test(html)){
        html=html.replace(/<link[^>]+logic-sitewide\.css[^>]*>/i,styleTag);
      }else{
        html=html.replace(/<\/head>/i,`${styleTag}\n</head>`);
        styledPages++;
      }
      const scriptSrc=relativeAsset(dir,scriptFile);
      const scriptTag=`<script data-logic-sitewide src="${scriptSrc}?v=${VERSION}" defer></script>`;
      if(/<script[^>]+data-logic-sitewide[^>]*><\/script>/i.test(html)){
        html=html.replace(/<script[^>]+data-logic-sitewide[^>]*><\/script>/i,scriptTag);
      }else{
        html=html.replace(/<\/body>/i,`${scriptTag}\n</body>`);
      }

      const aiPromoStyleHref=relativeAsset(dir,ai01PromoStyleFile);
      const aiPromoStyleTag=`<link data-ai01-launch-promo-style rel="stylesheet" href="${aiPromoStyleHref}?v=${VERSION}">`;
      if(/<link[^>]+data-ai01-launch-promo-style[^>]*>/i.test(html)){
        html=html.replace(/<link[^>]+data-ai01-launch-promo-style[^>]*>/i,aiPromoStyleTag);
      }else{
        html=html.replace(/<\/head>/i,`${aiPromoStyleTag}\n</head>`);
        aiPromoPages++;
      }
      const aiPromoScriptSrc=relativeAsset(dir,ai01PromoScriptFile);
      const aiPromoScriptTag=`<script data-ai01-launch-promo-script src="${aiPromoScriptSrc}?v=${VERSION}" defer></script>`;
      if(/<script[^>]+data-ai01-launch-promo-script[^>]*><\/script>/i.test(html)){
        html=html.replace(/<script[^>]+data-ai01-launch-promo-script[^>]*><\/script>/i,aiPromoScriptTag);
      }else{
        html=html.replace(/<\/body>/i,`${aiPromoScriptTag}\n</body>`);
      }

      if(html!==before){fs.writeFileSync(file,html);pages++;}
    }
  };
  walk(root);
  const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
  if(!home.includes('data-logic-home-launch')||!home.includes('data-logic-sitewide-style')||!home.includes('data-logic-sitewide')) throw new Error('logic sitewide: homepage launch integration incomplete');
  if(!home.includes('data-ai01-launch-promo-style')||!home.includes('data-ai01-launch-promo-script')) throw new Error('AI-01 launch promo: homepage integration incomplete');
  if(home.includes('class="ref-nav"')&&!home.includes('>Головоломки</a>')) throw new Error('logic sitewide: homepage puzzle nav missing');
  if(home.includes('class="ref-nav"')&&!home.includes('data-nav-daily')) throw new Error('logic sitewide: daily Telegram nav missing');
  const premiumSurface=applyPremiumSurfaceV2(root);
  return {version:VERSION,pages,navPatched,legacyLinksRewritten,styledPages,aiPromoPages,telegramRetention:true,ai01PromoPublic:false,premiumSurface};
}