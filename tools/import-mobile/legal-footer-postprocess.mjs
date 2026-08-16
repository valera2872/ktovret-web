import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'tools', 'tests', 'supabase', 'artifacts', '.secure-backend']);

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

    if (!html.includes('data-ml-legal-footer')) {
      html = html.replace('</body>', `${footerHtml(prefix)}</body>`);
    }

    fs.writeFileSync(file, html);
    changed += 1;
  }

  return changed;
};
