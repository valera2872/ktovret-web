import fs from 'node:fs';
import path from 'node:path';

const clip = (value, max = 158) => {
  const compact = String(value || '').replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  const cut = compact.slice(0, max - 1).replace(/\s+\S*$/u, '').trim();
  return `${cut || compact.slice(0, max - 1)}…`;
};

const prefixFor = (route) => '../'.repeat(String(route || '').split('/').filter(Boolean).length);

export function postprocessSeoNativeCases(siteRoot, cases, collections) {
  const collection = collections.find((item) => item.indexable === true && item.status === 'published');
  if (!collection) throw new Error('Не найдена индексируемая SEO-коллекция');

  let processed = 0;
  for (const item of cases.filter((entry) => entry.seoPublished === true)) {
    const pagePath = path.join(siteRoot, item.path, 'index.html');
    if (!fs.existsSync(pagePath)) throw new Error(`Не найдена SEO-native страница ${item.path}`);

    let html = fs.readFileSync(pagePath, 'utf8');
    const language = item.language || 'ru';
    const prefix = prefixFor(item.path);
    const description = clip(`${item.title}. ${item.shortDescription || item.intro}`);

    html = html.replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${description.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">`,
    );
    html = html.replace(
      /<meta property="og:description" content="[^"]*">/,
      `<meta property="og:description" content="${description.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">`,
    );
    html = html.replace(
      /<link rel="alternate" hreflang="[^"]+" href="([^"]+)">/,
      `<link rel="alternate" hreflang="${language}" href="$1">`,
    );

    if (!html.includes('data-seo-collection-link')) {
      const link = `<p data-seo-collection-link><a href="${prefix}${collection.route}">${collection.shortTitle || collection.title}</a></p>`;
      html = html.replace('<noscript>', `${link}<noscript>`);
    }

    fs.writeFileSync(pagePath, html);
    processed += 1;
  }

  return processed;
}
