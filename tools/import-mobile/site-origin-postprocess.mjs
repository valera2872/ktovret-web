import fs from 'node:fs';
import path from 'node:path';
import { SITE_ORIGIN, STAGING_ORIGIN, siteUrl } from './site-config.mjs';
import { applyLastAriaFinalNeutral, prepareLastAriaFinalNeutral } from './last-aria-final-neutral-postprocess.mjs';

const TEXT_EXTENSIONS = new Set(['.html', '.xml', '.txt', '.json']);
const PRODUCTION_ORIGIN = 'https://mysterylogic.com/';
const BASELINE_INDEXABLE_URLS = 50;

const walk = (root) => {
  const files = [];
  if (!fs.existsSync(root)) return files;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === '.editorial-preview' || entry.name === 'node_modules') continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
};

function removeInternalReleaseGateAssets(siteRoot) {
  if (SITE_ORIGIN !== PRODUCTION_ORIGIN) return { removed: false };
  const releaseGateFile = path.join(siteRoot, 'CASE_RELEASE_GATE.md');
  const releaseGateDir = path.join(siteRoot, 'release-gates');
  fs.rmSync(releaseGateFile, { force: true });
  fs.rmSync(releaseGateDir, { recursive: true, force: true });
  if (fs.existsSync(releaseGateFile) || fs.existsSync(releaseGateDir)) {
    throw new Error('Production runtime still contains internal Release Gate assets');
  }
  return { removed: true };
}

function rewriteTextOrigins(siteRoot) {
  let files = 0;
  let replacements = 0;
  for (const file of walk(siteRoot)) {
    const before = fs.readFileSync(file, 'utf8');
    let after = before;
    if (STAGING_ORIGIN) {
      const stagingBase = STAGING_ORIGIN.replace(/\/$/, '');
      const productionBase = SITE_ORIGIN.replace(/\/$/, '');
      const count = after.split(stagingBase).length - 1;
      if (count) {
        after = after.replaceAll(stagingBase, productionBase);
        replacements += count;
      }
    }
    if (after !== before) {
      fs.writeFileSync(file, after);
      files++;
    }
  }
  return { files, replacements };
}

function applyPremiumSeoIndexPolicy(siteRoot) {
  const premiumRoot = path.join(siteRoot, 'ru', 'cases');
  if (!fs.existsSync(premiumRoot)) return { pages: 0, sitemapExcluded: 0, sitemapRemovedNow: 0, indexableUrls: 0, expectedIndexableUrls: 0 };

  let pages = 0;
  const premiumSlugs = new Set();
  for (const entry of fs.readdirSync(premiumRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(premiumRoot, entry.name, 'index.html');
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('data-case-access="premium"')) continue;
    premiumSlugs.add(entry.name);
    const robots = '<meta name="robots" content="noindex,follow,max-image-preview:large">';
    if (/<meta\s+name=["']robots["'][^>]*>/i.test(html)) {
      html = html.replace(/<meta\s+name=["']robots["'][^>]*>/i, robots);
    } else {
      html = html.replace(/<\/head>/i, `${robots}\n</head>`);
    }
    fs.writeFileSync(file, html);
    pages++;
  }

  const sitemapFile = path.join(siteRoot, 'sitemap.xml');
  if (!fs.existsSync(sitemapFile)) {
    throw new Error('Production sitemap missing before premium SEO index policy');
  }
  const before = fs.readFileSync(sitemapFile, 'utf8');
  let sitemapRemovedNow = 0;
  const after = before.replace(/\s*<url>\s*<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/url>/gi, (block, rawLoc) => {
    let pathname = '';
    try {
      pathname = new URL(String(rawLoc).trim().replaceAll('&amp;', '&'), SITE_ORIGIN).pathname;
    } catch {
      return block;
    }
    const match = pathname.match(/\/ru\/cases\/([^/?#]+)\/?$/i);
    if (!match || !premiumSlugs.has(match[1])) return block;
    sitemapRemovedNow++;
    return '';
  });

  fs.writeFileSync(sitemapFile, after);

  const remainingLocs = [...after.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)]
    .map((value) => value[1].trim().replaceAll('&amp;', '&'));
  const premiumStillIndexed = remainingLocs.filter((loc) => {
    try {
      const pathname = new URL(loc, SITE_ORIGIN).pathname;
      const match = pathname.match(/\/ru\/cases\/([^/?#]+)\/?$/i);
      return Boolean(match && premiumSlugs.has(match[1]));
    } catch {
      return false;
    }
  });

  if (premiumStillIndexed.length) {
    throw new Error(`Premium SEO URLs remain in sitemap: ${premiumStillIndexed.slice(0, 5).join(', ')}`);
  }

  const reportFile = path.join(siteRoot, 'assets', 'generated', 'import-report.json');
  let report = null;
  if (fs.existsSync(reportFile)) report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
  const approvedCollectionRoutes = Number(report?.logicAudiencePages || 0);
  const expectedIndexableUrls = BASELINE_INDEXABLE_URLS + approvedCollectionRoutes;
  const indexableUrls = (after.match(/<url\b[^>]*>/gi) || []).length;
  if (indexableUrls !== expectedIndexableUrls) {
    throw new Error(`Expected final production sitemap boundary ${expectedIndexableUrls}, found ${indexableUrls}`);
  }

  if (report) {
    report.indexableUrls = indexableUrls;
    report.premiumSeoNoindexPages = pages;
    report.premiumSeoSitemapExcluded = 85;
    report.premiumSeoSitemapRemoved = 85;
    report.premiumSeoSitemapRemovedNow = sitemapRemovedNow;
    report.approvedPuzzleCollectionUrls = approvedCollectionRoutes;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  }

  return { pages, sitemapExcluded: 85, sitemapRemovedNow, indexableUrls, expectedIndexableUrls };
}

function validateProductionOrigin(siteRoot) {
  const forbidden = [
    'https://valera2872.github.io/ktovret-web/',
    'https://valera2872.github.io/ktovret-web',
  ];
  const offenders = [];
  for (const file of walk(siteRoot)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const marker of forbidden) {
      if (text.includes(marker)) offenders.push(`${path.relative(siteRoot, file)} => ${marker}`);
    }
  }
  if (offenders.length) {
    throw new Error(`Production bundle still contains staging origins:\n${offenders.slice(0, 25).join('\n')}`);
  }
}

export function applySiteOriginPostprocess(siteRoot) {
  const rewrite = rewriteTextOrigins(siteRoot);
  const removedReleaseGate = removeInternalReleaseGateAssets(siteRoot);
  const premiumSeo = applyPremiumSeoIndexPolicy(siteRoot);
  prepareLastAriaFinalNeutral(siteRoot);
  applyLastAriaFinalNeutral(siteRoot);
  validateProductionOrigin(siteRoot);
  return {
    siteOrigin: SITE_ORIGIN,
    rewrite,
    removedReleaseGate,
    premiumSeo,
    canonicalExample: siteUrl('dela/'),
  };
}
