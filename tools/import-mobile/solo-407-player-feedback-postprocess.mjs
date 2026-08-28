import fs from 'node:fs';
import path from 'node:path';

const CASE_FILE = 'detektivnye-igry-dlya-odnogo/407/index.html';
const VERSION = '1.2.0';

export function applySolo407PlayerFeedback(siteRoot) {
  const file = path.join(siteRoot, CASE_FILE);
  if (!fs.existsSync(file)) throw new Error('Solo 407 page missing before player feedback polish');

  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('case-407-solo-player-feedback.css')) {
    html = html.replace('</head>', `<link rel="stylesheet" href="../../assets/case-407-solo-player-feedback.css?v=${VERSION}"></head>`);
  }
  if (!html.includes('case-407-solo-player-feedback.js')) {
    const soloRuntime = /<script src="\.\.\/\.\.\/assets\/case-407-solo\.js[^>]*><\/script>/;
    if (!soloRuntime.test(html)) throw new Error('Solo 407 runtime missing before player feedback polish');
    html = html.replace(soloRuntime, (match) => `${match}<script src="../../assets/case-407-solo-player-feedback.js?v=${VERSION}"></script>`);
  }
  if (!html.includes('cognitive-solo-analytics.js')) {
    html = html.replace('</body>', `<script src="../../assets/cognitive-solo-analytics.js?v=${VERSION}"></script></body>`);
  }

  for (const marker of ['case-407-solo-player-feedback.css', 'case-407-solo-player-feedback.js', 'cognitive-solo-analytics.js']) {
    if (!html.includes(marker)) throw new Error(`Solo 407 feedback layer missing ${marker}`);
  }
  fs.writeFileSync(file, html);
  return { route: CASE_FILE.replace('/index.html', ''), version: VERSION };
}