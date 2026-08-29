import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'tools', 'tests', 'artifacts', 'docs', 'ops', 'supabase', 'old.bac', 'admin']);
const FUNNEL_MARKER = 'data-ml-funnel';
const PROOF_MARKER = 'data-ml-social-proof-client';
const CONVERSION_MARKER = 'data-ml-conversion-ux';
const CONVERSION_STYLE_MARKER = 'data-ml-conversion-style';

export function applyFunnelAnalytics(siteRoot) {
  const root = path.resolve(siteRoot);
  const funnelFile = path.join(root, 'assets', 'funnel-analytics.js');
  const proofFile = path.join(root, 'assets', 'social-proof.js');
  const conversionFile = path.join(root, 'assets', 'conversion-ux-analytics.js');
  const conversionStyle = path.join(root, 'assets', 'conversion-ux.css');
  if (!fs.existsSync(funnelFile)) throw new Error('assets/funnel-analytics.js missing');
  if (!fs.existsSync(proofFile)) throw new Error('assets/social-proof.js missing');
  if (!fs.existsSync(conversionFile)) throw new Error('assets/conversion-ux-analytics.js missing');
  if (!fs.existsSync(conversionStyle)) throw new Error('assets/conversion-ux.css missing');

  let injected = 0;
  let alreadyPresent = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
        continue;
      }
      if (!entry.isFile() || entry.name !== 'index.html') continue;
      const file = path.join(dir, entry.name);
      let html = fs.readFileSync(file, 'utf8');
      if (!/<\/body>/i.test(html)) throw new Error(`Analytics injection: </body> missing in ${path.relative(root, file)}`);
      if (!/<\/head>/i.test(html)) throw new Error(`Analytics injection: </head> missing in ${path.relative(root, file)}`);
      let changed = false;

      if (!html.includes(FUNNEL_MARKER)) {
        const funnelAsset = path.relative(dir, funnelFile).replaceAll(path.sep, '/');
        html = html.replace(/<\/body>/i, `<script ${FUNNEL_MARKER} src="${funnelAsset}?v=1.0.0" defer></script>\n</body>`);
        changed = true;
      }
      if (!html.includes(PROOF_MARKER)) {
        const proofAsset = path.relative(dir, proofFile).replaceAll(path.sep, '/');
        html = html.replace(/<\/body>/i, `<script ${PROOF_MARKER} src="${proofAsset}?v=1.0.0" defer></script>\n</body>`);
        changed = true;
      }
      if (!html.includes(CONVERSION_STYLE_MARKER)) {
        const styleAsset = path.relative(dir, conversionStyle).replaceAll(path.sep, '/');
        html = html.replace(/<\/head>/i, `<link ${CONVERSION_STYLE_MARKER} rel="stylesheet" href="${styleAsset}?v=1.0.0">\n</head>`);
        changed = true;
      }
      if (!html.includes(CONVERSION_MARKER)) {
        const conversionAsset = path.relative(dir, conversionFile).replaceAll(path.sep, '/');
        html = html.replace(/<\/body>/i, `<script ${CONVERSION_MARKER} src="${conversionAsset}?v=1.0.0" defer></script>\n</body>`);
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(file, html);
        injected += 1;
      } else alreadyPresent += 1;
    }
  };

  walk(root);
  const mustContain = [
    'index.html',
    'dela/index.html',
    'kto-vret/index.html',
    'tom-1/index.html',
    'detektivnye-igry-dlya-odnogo/index.html',
    'detektivnye-igry-dlya-odnogo/407/index.html',
    'detektivnye-igry-dlya-dvoih/index.html',
    'detektivnye-igry-dlya-dvoih/2317/index.html',
    'detektivnye-igry-dlya-dvoih/407/index.html',
    'logicheskie-zadachi/index.html',
  ];
  for (const relative of mustContain) {
    const file = path.join(root, relative);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes(FUNNEL_MARKER)) throw new Error(`Funnel injection missing in ${relative}`);
    if (!html.includes(PROOF_MARKER)) throw new Error(`Social proof injection missing in ${relative}`);
    if (!html.includes(CONVERSION_MARKER)) throw new Error(`Conversion UX injection missing in ${relative}`);
    if (!html.includes(CONVERSION_STYLE_MARKER)) throw new Error(`Conversion UX style missing in ${relative}`);
  }

  return { pages: injected + alreadyPresent, injected, alreadyPresent, version: '1.2.0', socialProof: true, conversionUx: true };
}
