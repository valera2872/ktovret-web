import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'tools', 'tests', 'supabase', 'artifacts', '.secure-backend']);
const YANDEX_METRIKA_ID = '111664459';
const YANDEX_METRIKA_SCRIPT_MARKER = `mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}`;
const YANDEX_METRIKA_NOSCRIPT_MARKER = `mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`;

const yandexMetrikaScript = `<!-- Yandex.Metrika counter -->
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

const yandexMetrikaNoscript = `<noscript><div><img src="https://mc.yandex.ru/watch/111664459" style="position:absolute; left:-9999px;" alt="" /></div></noscript>`;

const walkHtml = (root) => {
  const files = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
    }
  };
  visit(root);
  return files;
};

const prefixForFile = (siteRoot, file) => {
  const relativeDir = path.dirname(path.relative(siteRoot, file));
  if (!relativeDir || relativeDir === '.') return './';
  const depth = relativeDir.split(path.sep).filter(Boolean).length;
  return '../'.repeat(depth);
};

const footerHtml = (prefix) => `<footer class="ml-legal-footer" data-ml-legal-footer><div class="ml-legal-footer-inner"><div class="ml-legal-owner"><strong>Владелец сайта и продавец: ИП Барбарова Людмила Ивановна</strong><span>ИНН 300800815628 · ОГРНИП 317302500040403 · 414056, г. Астрахань, ул. Татищева, корп. 9</span><a href="mailto:support@mysterylogic.com">support@mysterylogic.com</a></div><nav class="ml-legal-links" aria-label="Юридическая информация"><a href="${prefix}contacts/">Контакты</a><a href="${prefix}privacy/">Политика конфиденциальности</a><a href="${prefix}offer/">Публичная оферта</a><a href="${prefix}personal-data-consent/">Согласие на обработку ПДн</a></nav></div></footer>`;

export const applyLegalFooter = (siteRoot) => {
  const root = path.resolve(siteRoot);
  let changed = 0;

  for (const file of walkHtml(root)) {
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('</head>') || !html.includes('</body>')) continue;

    const prefix = prefixForFile(root, file);
    if (!html.includes('assets/legal.css')) {
      html = html.replace('</head>', `<link rel="stylesheet" href="${prefix}assets/legal.css?v=1.0.0"></head>`);
    }
    if (!html.includes('assets/typography-polish.css')) {
      html = html.replace('</head>', `<link rel="stylesheet" href="${prefix}assets/typography-polish.css?v=1.0.0"></head>`);
    }
    if (!html.includes('assets/interface-polish.css')) {
      html = html.replace('</head>', `<link rel="stylesheet" href="${prefix}assets/interface-polish.css?v=1.0.0"></head>`);
    }

    if (!html.includes(YANDEX_METRIKA_SCRIPT_MARKER)) {
      html = html.replace('</head>', `${yandexMetrikaScript}</head>`);
    }
    if (!html.includes(YANDEX_METRIKA_NOSCRIPT_MARKER)) {
      html = html.replace(/<body([^>]*)>/i, `<body$1>${yandexMetrikaNoscript}`);
    }

    if (!html.includes('data-ml-legal-footer')) {
      html = html.replace('</body>', `${footerHtml(prefix)}</body>`);
    }

    if (!html.includes(YANDEX_METRIKA_SCRIPT_MARKER) || !html.includes(YANDEX_METRIKA_NOSCRIPT_MARKER)) {
      throw new Error(`Yandex Metrika injection failed for ${path.relative(root, file)}`);
    }

    fs.writeFileSync(file, html);
    changed += 1;
  }

  return changed;
};
