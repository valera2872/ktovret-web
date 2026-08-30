import fs from 'node:fs';
import path from 'node:path';

const CASE_FILE = 'detektivnye-igry-dlya-odnogo/407/index.html';
const HUB_FILE = 'detektivnye-igry-dlya-odnogo/index.html';
const VERSION = '1.3.0';

export function applySolo407PlayerFeedback(siteRoot) {
  const file = path.join(siteRoot, CASE_FILE);
  if (!fs.existsSync(file)) throw new Error('Solo 407 page missing before player feedback polish');

  let html = fs.readFileSync(file, 'utf8');
  for (const css of ['case-407-solo-player-feedback.css', 'case-407-solo-progressive-entry.css', 'case-407-solo-clarity.css']) {
    if (!html.includes(css)) {
      html = html.replace('</head>', `<link rel="stylesheet" href="../../assets/${css}?v=${VERSION}"></head>`);
    }
  }
  if (!html.includes('case-407-solo-player-feedback.js')) {
    const soloRuntime = /<script src="\.\.\/\.\.\/assets\/case-407-solo\.js[^>]*><\/script>/;
    if (!soloRuntime.test(html)) throw new Error('Solo 407 runtime missing before player feedback polish');
    html = html.replace(soloRuntime, (match) => `${match}<script src="../../assets/case-407-solo-player-feedback.js?v=${VERSION}"></script>`);
  }
  if (!html.includes('case-407-solo-progressive-entry.js')) {
    const feedbackRuntime = /<script src="\.\.\/\.\.\/assets\/case-407-solo-player-feedback\.js[^>]*><\/script>/;
    if (!feedbackRuntime.test(html)) throw new Error('Solo 407 feedback runtime missing before progressive entry');
    html = html.replace(feedbackRuntime, (match) => `${match}<script src="../../assets/case-407-solo-progressive-entry.js?v=${VERSION}"></script>`);
  }
  if (!html.includes('case-407-solo-clarity.js')) {
    const progressiveRuntime = /<script src="\.\.\/\.\.\/assets\/case-407-solo-progressive-entry\.js[^>]*><\/script>/;
    if (!progressiveRuntime.test(html)) throw new Error('Solo 407 progressive runtime missing before clarity layer');
    html = html.replace(progressiveRuntime, (match) => `${match}<script src="../../assets/case-407-solo-clarity.js?v=${VERSION}"></script>`);
  }
  if (!html.includes('cognitive-solo-analytics.js')) {
    html = html.replace('</body>', `<script src="../../assets/cognitive-solo-analytics.js?v=${VERSION}"></script></body>`);
  }

  for (const marker of [
    'case-407-solo-player-feedback.css',
    'case-407-solo-player-feedback.js',
    'case-407-solo-progressive-entry.css',
    'case-407-solo-progressive-entry.js',
    'case-407-solo-clarity.css',
    'case-407-solo-clarity.js',
    'cognitive-solo-analytics.js',
  ]) {
    if (!html.includes(marker)) throw new Error(`Solo 407 feedback layer missing ${marker}`);
  }
  fs.writeFileSync(file, html);

  const hubFile = path.join(siteRoot, HUB_FILE);
  if (fs.existsSync(hubFile)) {
    let hub = fs.readFileSync(hubFile, 'utf8');
    hub = hub.replace(
      'На контрольных точках фиксируете только то, что уже доказано материалами.',
      'На контрольных точках фиксируете рабочую гипотезу; игра не сообщает, правы ли вы, пока дело не раскрыто.'
    );
    fs.writeFileSync(hubFile, hub);
  }

  return { route: CASE_FILE.replace('/index.html', ''), version: VERSION, progressiveEntry: true, clarityLayer: true };
}
