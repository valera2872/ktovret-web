import fs from 'node:fs';
import path from 'node:path';
import { SITE_ORIGIN, STAGING_ORIGIN, siteUrl } from './site-config.mjs';
import { applyLastAriaFinalNeutral, prepareLastAriaFinalNeutral } from './last-aria-final-neutral-postprocess.mjs';

const TEXT_EXTENSIONS = new Set(['.html', '.xml', '.txt', '.json']);
const PRODUCTION_ORIGIN = 'https://mysterylogic.com/';

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

export function applySiteOrigin(siteRoot) {
  const files = walk(siteRoot);
  let changedFiles = 0;
  let replacements = 0;

  if (SITE_ORIGIN !== STAGING_ORIGIN) {
    for (const file of files) {
      const before = fs.readFileSync(file, 'utf8');
      const count = before.split(STAGING_ORIGIN).length - 1;
      if (!count) continue;
      fs.writeFileSync(file, before.replaceAll(STAGING_ORIGIN, SITE_ORIGIN));
      changedFiles += 1;
      replacements += count;
    }
  }

  fs.writeFileSync(
    path.join(siteRoot, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${siteUrl('sitemap.xml')}\n`,
  );

  if (SITE_ORIGIN !== STAGING_ORIGIN) {
    const leftovers = walk(siteRoot).filter((file) => fs.readFileSync(file, 'utf8').includes(STAGING_ORIGIN));
    if (leftovers.length) {
      throw new Error(`После production origin остались staging URL: ${leftovers.map((file) => path.relative(siteRoot, file)).join(', ')}`);
    }
  }

  return { siteOrigin: SITE_ORIGIN, changedFiles, replacements, sitemap: siteUrl('sitemap.xml') };
}

const readArg = (name, fallback = '') => {
  const args = process.argv.slice(2);
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

export function registerSiteOriginFinalizer() {
  const entry = path.basename(process.argv[1] || '');
  if (entry !== 'import-mobile-cases.mjs') return false;
  const siteRoot = path.resolve(readArg('site', '.'));
  prepareLastAriaFinalNeutral(siteRoot);
  process.once('beforeExit', () => {
    applyLastAriaFinalNeutral(siteRoot);
    applySiteOrigin(siteRoot);
    removeInternalReleaseGateAssets(siteRoot);
  });
  return true;
}
