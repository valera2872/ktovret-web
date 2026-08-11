const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const required = {
  'offer/index.html': ['Публичная оферта', 'возврат', 'цифров', 'support@mysterylogic.com'],
  'privacy/index.html': ['Политика конфиденциальности', '152-ФЗ', 'support@mysterylogic.com'],
  'personal-data-consent/index.html': ['Согласие на обработку', 'отдельной отметки', 'support@mysterylogic.com'],
  'contacts/index.html': ['ИП Барбарова Людмила Ивановна', 'ИНН 300800815628', 'ОГРНИП 317302500040403', 'support@mysterylogic.com'],
};

for (const [relative, needles] of Object.entries(required)) {
  const file = path.join(root, relative);
  assert(fs.existsSync(file), `Missing ${relative}`);
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes('noindex,follow'), `${relative} must be noindex,follow`);
  for (const needle of needles) assert(html.toLowerCase().includes(needle.toLowerCase()), `${relative} missing ${needle}`);
}

const footerSource = fs.readFileSync(path.join(root, 'tools/import-mobile/legal-footer-postprocess.mjs'), 'utf8');
for (const needle of [
  'ИП Барбарова Людмила Ивановна',
  '300800815628',
  '317302500040403',
  'support@mysterylogic.com',
  'contacts/',
  'privacy/',
  'offer/',
  'personal-data-consent/',
]) assert(footerSource.includes(needle), `Footer postprocess missing ${needle}`);

const reportPath = path.join(root, 'assets/generated/import-report.json');
if (fs.existsSync(reportPath)) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  if (Object.prototype.hasOwnProperty.call(report, 'legalFooterPages')) {
    assert(report.legalFooterPages > 100, 'Expected legal footer on the generated public surface');

    const skip = new Set(['.git', '.github', 'node_modules', 'tools', 'tests', 'supabase', 'artifacts', '.secure-backend']);
    const htmlFiles = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && skip.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
      }
    };
    walk(root);
    for (const file of htmlFiles) {
      const html = fs.readFileSync(file, 'utf8');
      assert(html.includes('data-ml-legal-footer'), `Missing legal footer: ${path.relative(root, file)}`);
      assert(html.includes('assets/legal.css'), `Missing legal CSS: ${path.relative(root, file)}`);
    }
  }
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const slug of ['/offer/', '/privacy/', '/personal-data-consent/', '/contacts/']) {
  assert(!sitemap.includes(slug), `Legal utility page should stay out of sitemap: ${slug}`);
}

console.log('Legal pages and seller footer contract: OK');
