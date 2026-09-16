import fs from 'node:fs';
import path from 'node:path';
import { ensureDir } from './common.mjs';

export const PARTNER_PREMIUM_ROUTE = 'detektivnye-igry-dlya-dvoih/ne-publikovat';
const SOURCE = 'admin/partner-premium-preview/index.html';
const CANONICAL = `https://mysterylogic.com/${PARTNER_PREMIUM_ROUTE}/`;

export function applyPartnerPremiumNePublikovat(siteRoot) {
  const sourceFile = path.join(siteRoot, SOURCE);
  if (!fs.existsSync(sourceFile)) throw new Error('Partner Premium: source preview is missing');

  let html = fs.readFileSync(sourceFile, 'utf8');
  const required = [
    'НЕ ПУБЛИКОВАТЬ',
    '599 ₽ за всю комнату',
    'data-purchase-email',
    'data-guest-code',
    'partner-premium-v2.js',
    'partner-premium-commerce-v1.js',
  ];
  for (const marker of required) if (!html.includes(marker)) throw new Error(`Partner Premium: source contract missing ${marker}`);

  if (!html.includes('<link rel="canonical"')) {
    html = html.replace('</head>', `  <link rel="canonical" href="${CANONICAL}">\n</head>`);
  }
  if (!html.includes('name="description"')) {
    html = html.replace('<meta name="theme-color" content="#061019">', '<meta name="theme-color" content="#061019">\n  <meta name="description" content="Не публиковать — премиальное асимметричное расследование Mystery Logic для двух игроков на двух устройствах.">');
  }

  // Pre-release boundary: the route must exist for T-Bank return URLs and room invites,
  // but it stays out of search and is not linked from the public two-player hub until human UX QA.
  if (!html.includes('noindex,nofollow,noarchive')) throw new Error('Partner Premium: pre-release robots boundary missing');

  const targetDir = path.join(siteRoot, PARTNER_PREMIUM_ROUTE);
  ensureDir(targetDir);
  fs.writeFileSync(path.join(targetDir, 'index.html'), html);

  return { route: PARTNER_PREMIUM_ROUTE, indexed: false, priceRub: 599, seats: 2 };
}
