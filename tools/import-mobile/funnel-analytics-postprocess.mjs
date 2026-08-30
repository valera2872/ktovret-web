import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['.git', '.github', 'node_modules', 'tools', 'tests', 'artifacts', 'docs', 'ops', 'supabase', 'old.bac', 'admin']);
const FUNNEL_MARKER = 'data-ml-funnel';
const PROOF_MARKER = 'data-ml-social-proof-client';
const CONVERSION_MARKER = 'data-ml-conversion-ux';
const CONVERSION_STYLE_MARKER = 'data-ml-conversion-style';
const JOURNEY_MARKER = 'data-ml-journey-analytics';
const SOLO_CONVERSION_STYLE_MARKER = 'data-ml-solo-conversion-style';

function patchSoloHubConversion(root, soloStyleFile) {
  const file = path.join(root, 'detektivnye-igry-dlya-odnogo', 'index.html');
  if (!fs.existsSync(file)) return false;
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (!html.includes(SOLO_CONVERSION_STYLE_MARKER)) {
    const styleAsset = path.relative(path.dirname(file), soloStyleFile).replaceAll(path.sep, '/');
    html = html.replace(/<\/head>/i, `<link ${SOLO_CONVERSION_STYLE_MARKER} rel="stylesheet" href="${styleAsset}?v=1.0.0">\n</head>`);
    changed = true;
  }

  if (!html.includes('data-solo-conversion-v3')) {
    const hero = `<section class="solo407-hub-hero solo407-conversion-hero" data-solo-conversion-v3><div class="solo407-conversion-copy"><p class="solo407-kicker">Mystery Logic · игры для одного</p><h1>Детективные игры онлайн для одного</h1><p class="solo407-conversion-lead">Начните с полноценного расследования: одна загадка, 18 материалов и ваша собственная версия событий. Никакого напарника и регистрации — дело открывается сразу в браузере.</p><div class="solo407-conversion-case"><span class="solo407-conversion-case-number">407</span><div><small>Большое расследование · бесплатно</small><strong>Номер 407</strong><p>Тихая тревога сейфа, запертая пустая комната и камера, которая не видела выхода. Вам предстоит запросить материалы, проверить гипотезы и подписать итоговое заключение.</p></div></div><div class="solo407-conversion-meta"><span>≈ 50–70 минут</span><span>18 материалов</span><span>3 этапа</span><span>прогресс сохраняется</span></div><a class="solo407-featured-cta" data-solo-featured-cta href="407/">Начать расследование бесплатно →</a><p class="solo407-conversion-note">Хотите короткий формат на 5–10 минут? «Кто врёт?» и 15 бесплатных мини-дел — сразу ниже.</p></div><div class="solo407-conversion-art" role="img" aria-label="Материалы дела Номер 407"><div class="solo407-conversion-dossier"><span>CASE FILE · ML-0407</span><strong>Номер 407</strong><small>SILENT ALARM · 01:12 · SOLO INVESTIGATION</small></div></div></section>`;
    const pattern = /<section class="solo407-hub-hero">[\s\S]*?<\/section><section class="solo407-hub-card">[\s\S]*?<\/section>/;
    if (!pattern.test(html)) throw new Error('Solo conversion: expected hero + featured card not found');
    html = html.replace(pattern, hero);
    changed = true;
  }

  if (!html.includes('<h1>Детективные игры онлайн для одного</h1>')) throw new Error('Solo conversion: canonical H1 changed');
  if (!html.includes('data-solo-featured-cta')) throw new Error('Solo conversion: featured CTA missing');
  if (!html.includes('href="407/"')) throw new Error('Solo conversion: 407 route missing');
  if (html.includes('<section class="solo407-hub-card">')) throw new Error('Solo conversion: duplicate legacy 407 card remains');

  if (changed) fs.writeFileSync(file, html);
  return changed;
}

export function applyFunnelAnalytics(siteRoot) {
  const root = path.resolve(siteRoot);
  const funnelFile = path.join(root, 'assets', 'funnel-analytics.js');
  const proofFile = path.join(root, 'assets', 'social-proof.js');
  const conversionFile = path.join(root, 'assets', 'conversion-ux-analytics.js');
  const conversionStyle = path.join(root, 'assets', 'conversion-ux.css');
  const journeyFile = path.join(root, 'assets', 'journey-analytics.js');
  const soloConversionStyle = path.join(root, 'assets', 'solo-conversion.css');
  if (!fs.existsSync(funnelFile)) throw new Error('assets/funnel-analytics.js missing');
  if (!fs.existsSync(proofFile)) throw new Error('assets/social-proof.js missing');
  if (!fs.existsSync(conversionFile)) throw new Error('assets/conversion-ux-analytics.js missing');
  if (!fs.existsSync(conversionStyle)) throw new Error('assets/conversion-ux.css missing');
  if (!fs.existsSync(journeyFile)) throw new Error('assets/journey-analytics.js missing');
  if (!fs.existsSync(soloConversionStyle)) throw new Error('assets/solo-conversion.css missing');

  const soloPatched = patchSoloHubConversion(root, soloConversionStyle);
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
      if (!html.includes(JOURNEY_MARKER)) {
        const journeyAsset = path.relative(dir, journeyFile).replaceAll(path.sep, '/');
        html = html.replace(/<\/body>/i, `<script ${JOURNEY_MARKER} src="${journeyAsset}?v=1.0.0" defer></script>\n</body>`);
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
    if (!html.includes(JOURNEY_MARKER)) throw new Error(`Journey analytics injection missing in ${relative}`);
  }

  const soloFile = path.join(root, 'detektivnye-igry-dlya-odnogo', 'index.html');
  if (fs.existsSync(soloFile)) {
    const soloHtml = fs.readFileSync(soloFile, 'utf8');
    if (!soloHtml.includes(SOLO_CONVERSION_STYLE_MARKER)) throw new Error('Solo conversion style missing');
    if (!soloHtml.includes('data-solo-conversion-v3')) throw new Error('Solo conversion hero missing');
  }

  return { pages: injected + alreadyPresent, injected, alreadyPresent, version: '1.3.0', socialProof: true, conversionUx: true, journeyAnalytics: true, soloConversion: soloPatched || true };
}
