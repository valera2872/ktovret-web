import fs from 'node:fs';
import path from 'node:path';
import { SITE_ORIGIN, STAGING_ORIGIN, siteUrl } from './site-config.mjs';

const TEXT_EXTENSIONS = new Set(['.html', '.xml', '.txt', '.json']);

const walk = (root) => {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === '.editorial-preview' || entry.name === 'node_modules') continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
};

export function applySiteOrigin(siteRoot) {
  const files = walk(siteRoot);
  let changedFiles = 0;
  let replacements = 0;

  if (SITE_ORIGIN !== STAGING_ORIGIN) {
    for (const file of files) {
      const before = fs.readFileSync(file, 'utf8');
      const count = before.split(STAGING_ORIGIN).length - 1;
      if (!count) continue;
      const after = before.replaceAll(STAGING_ORIGIN, SITE_ORIGIN);
      fs.writeFileSync(file, after);
      changedFiles += 1;
      replacements += count;
    }
  }

  const robotsPath = path.join(siteRoot, 'robots.txt');
  fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl('sitemap.xml')}\n`);

  if (SITE_ORIGIN !== STAGING_ORIGIN) {
    const leftovers = walk(siteRoot)
      .filter((file) => TEXT_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .filter((file) => fs.readFileSync(file, 'utf8').includes(STAGING_ORIGIN));
    if (leftovers.length) throw new Error(`После production origin остались staging URL: ${leftovers.map((file) => path.relative(siteRoot, file)).join(', ')}`);
  }

  return { siteOrigin: SITE_ORIGIN, stagingOrigin: STAGING_ORIGIN, changedFiles, replacements, robots: siteUrl('sitemap.xml') };
}
