import fs from 'node:fs';
import path from 'node:path';

const VERSION = '2.0.0';
const prefixFor = (route) => '../'.repeat(String(route || '').split('/').filter(Boolean).length);
const volumeLabel = (item) => item.productId === 'volume2' ? 'Том II' : 'Том I';
const volumeQuery = (item) => item.productId === 'volume2' ? '?product=volume2' : '?product=volume1';

export function attachPaidAccessGateway(siteRoot, cases, editorial = false) {
  if (editorial) return 0;
  let processed = 0;
  const premium = cases.filter((entry) => entry.access === 'premium');

  for (const item of premium) {
    const route = item.legacyPath || item.path;
    const pagePath = path.join(siteRoot, route, 'index.html');
    if (!fs.existsSync(pagePath)) throw new Error(`Не найдена закрытая страница ${route}`);

    let html = fs.readFileSync(pagePath, 'utf8');
    if (html.includes('paid-access-client.js')) continue;
    if (html.includes('window.KtoVretWeb=')) throw new Error(`Платный payload уже находится в публичной странице ${route}`);

    const prefix = prefixFor(route);
    const label = volumeLabel(item);
    const storefront = `${prefix}tom-1/${volumeQuery(item)}`;
    const panel = `<a class="ml-button ml-button-primary" data-paid-coming-soon href="${storefront}">Открыть ${label}</a><div class="ml-paid-access" data-paid-access-panel data-paid-product="${item.productId || 'volume1'}" hidden><p class="ml-paid-access-intro"><strong>Это дело входит в ${label} серии «Кто врёт?».</strong> Если доступ уже куплен, он проверится автоматически. Для новой покупки откройте страницу томов — там можно купить один том за 199 ₽ или два тома за 299 ₽.</p><label><span>Ключ доступа</span><input type="password" inputmode="text" autocomplete="off" spellcheck="false" data-paid-token placeholder="Ключ доступа"></label><div class="ml-paid-access-actions"><button class="ml-button ml-button-secondary" type="button" data-paid-unlock>Открыть купленное дело</button><a class="ml-button ml-button-primary" href="${storefront}">Выбрать том</a></div><p class="ml-paid-access-status" data-paid-status>Материалы дела загружаются только после серверной проверки доступа.</p></div>`;

    html = html.replace(
      '<span class="ml-button ml-button-secondary">Полный том · скоро</span>',
      panel,
    );
    html = html.replace(
      'data-paywall-view="true"',
      `data-paywall-view="true" data-paid-case-gateway="${VERSION}" data-product-id="${item.productId || 'volume1'}"`,
    );
    html = html.replace(
      '</head>',
      `<link rel="stylesheet" href="${prefix}assets/paid-access.css?v=${VERSION}"></head>`,
    );
    html = html.replace(
      '</body>',
      `<script src="${prefix}assets/paid-access-config.js?v=${VERSION}"></script><script src="${prefix}assets/paid-access-client.js?v=${VERSION}"></script></body>`,
    );

    if (!html.includes('data-paid-access-panel')) throw new Error(`Не удалось встроить панель доступа в ${route}`);
    if (!html.includes(`${prefix}tom-1/`)) throw new Error(`Не удалось связать платное дело с витриной томов ${route}`);
    if (html.includes('data-purchase-start')) throw new Error(`Прямой checkout не должен присутствовать на странице ${route}`);
    fs.writeFileSync(pagePath, html);
    processed += 1;
  }

  if (processed !== premium.length) throw new Error(`Ожидалось ${premium.length} защищённых страниц, обработано ${processed}`);
  return processed;
}
