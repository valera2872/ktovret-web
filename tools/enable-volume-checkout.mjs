import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const siteIndex = args.indexOf('--site');
const siteRoot = path.resolve(siteIndex >= 0 && args[siteIndex + 1] ? args[siteIndex + 1] : '.');
const pagePath = path.join(siteRoot, 'tom-1', 'index.html');

if (!fs.existsSync(pagePath)) throw new Error(`Storefront not found: ${pagePath}`);

let html = fs.readFileSync(pagePath, 'utf8');

const actionsPattern = /<div class="volume-actions"><button class="ml-button ml-button-primary" type="button" data-volume-buy disabled>([^<]+)<\/button><a class="ml-button ml-button-secondary" href="\.\.\/dela\/">Сначала пройти бесплатные<\/a><\/div><p class="volume-payment-note" data-volume-payment-note>[^<]*<\/p>/;
const match = html.match(actionsPattern);
if (!match) throw new Error('Storefront checkout block not found');

const replacement = `<div class="volume-checkout"><label class="volume-checkout-email"><span>E-mail для электронного чека</span><input type="email" autocomplete="email" inputmode="email" data-volume-email placeholder="name@example.com"></label><div class="volume-actions"><button class="ml-button ml-button-primary" type="button" data-volume-buy disabled>${match[1]}</button><a class="ml-button ml-button-secondary" href="../dela/">Сначала пройти бесплатные</a></div><p class="volume-payment-note" data-volume-payment-note>Подготавливаем безопасную оплату через T‑Bank…</p></div>`;
html = html.replace(actionsPattern, replacement);

if (!html.includes('paid-access-config.js')) {
  html = html.replace(
    '</body>',
    '<script src="../assets/paid-access-config.js?v=1.14.0"></script><script src="../assets/volume-storefront.js?v=1.14.0"></script></body>',
  );
}

if (!html.includes('data-volume-email')) throw new Error('Email field was not added to storefront');
if (!html.includes('volume-storefront.js')) throw new Error('Storefront checkout script was not added');

fs.writeFileSync(pagePath, html);
console.log('volume storefront checkout enabled');
