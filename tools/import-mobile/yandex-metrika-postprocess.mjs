import fs from 'node:fs';
import path from 'node:path';

const COUNTER_ID='111664459';
const SCRIPT_MARKER=`mc.yandex.ru/metrika/tag.js?id=${COUNTER_ID}`;
const NOSCRIPT_MARKER=`mc.yandex.ru/watch/${COUNTER_ID}`;

const scriptBlock=`<!-- Yandex.Metrika counter -->
<script type="text/javascript">
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=111664459', 'ym');

    ym(111664459, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
</script>
<!-- /Yandex.Metrika counter -->`;

const noscriptBlock=`<noscript><div><img src="https://mc.yandex.ru/watch/111664459" style="position:absolute; left:-9999px;" alt="" /></div></noscript>`;

const skipDirs=new Set(['.git','.github','node_modules','tools','tests']);

function htmlFiles(root){
  const files=[];
  const walk=(dir)=>{
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      if(entry.isDirectory()&&skipDirs.has(entry.name)) continue;
      const full=path.join(dir,entry.name);
      if(entry.isDirectory()) walk(full);
      else if(entry.isFile()&&entry.name.toLowerCase().endsWith('.html')) files.push(full);
    }
  };
  walk(root);
  return files;
}

export function applyYandexMetrika(siteRoot){
  let scanned=0,patched=0,alreadyPresent=0,skipped=0;
  for(const file of htmlFiles(siteRoot)){
    scanned+=1;
    let html=fs.readFileSync(file,'utf8');
    if(!/<head(?:\s[^>]*)?>/i.test(html)||!/<body(?:\s[^>]*)?>/i.test(html)){
      skipped+=1;
      continue;
    }

    const hasScript=html.includes(SCRIPT_MARKER);
    const hasNoscript=html.includes(NOSCRIPT_MARKER);
    if(hasScript&&hasNoscript){
      alreadyPresent+=1;
      continue;
    }

    if(!hasScript){
      html=html.replace(/<\/head>/i,`${scriptBlock}\n</head>`);
    }
    if(!hasNoscript){
      html=html.replace(/<body([^>]*)>/i,`<body$1>\n${noscriptBlock}`);
    }

    if(!html.includes(SCRIPT_MARKER)||!html.includes(NOSCRIPT_MARKER)){
      throw new Error(`Yandex Metrika injection failed for ${path.relative(siteRoot,file)}`);
    }
    fs.writeFileSync(file,html);
    patched+=1;
  }

  if(patched+alreadyPresent===0) throw new Error('Yandex Metrika did not find any public HTML pages');
  return {counterId:COUNTER_ID,scanned,patched,alreadyPresent,skipped};
}
