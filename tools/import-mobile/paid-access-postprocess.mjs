import fs from 'node:fs';
import path from 'node:path';

const VERSION = '1.13.0';
const prefixFor = (route) => '../'.repeat(String(route || '').split('/').filter(Boolean).length);

export function attachPaidAccessGateway(siteRoot, cases, editorial = false) {
  if (editorial) return 0;
  let processed = 0;

  for (const item of cases.filter((entry) => entry.access === 'premium')) {
    const route = item.legacyPath || item.path;
    const pagePath = path.join(siteRoot, route, 'index.html');
    if (!fs.existsSync(pagePath)) throw new Error(`Не найдена закрытая страница ${route}`);

    let html = fs.readFileSync(pagePath, 'utf8');
    if (html.includes('paid-access-client.js')) continue;
    if (html.includes('window.KtoVretWeb=')) throw new Error(`Платный payload уже находится в публичной странице ${route}`);

    const prefix = prefixFor(route);
    const panel = `<a class="ml-button ml-button-primary" data-paid-coming-soon href="${prefix}tom-1/">Открыть первый том</a><div class="ml-paid-access" data-paid-access-panel hidden><p class="ml-paid-access-intro"><strong>Это дело входит в полный первый том.</strong> Если доступ уже куплен, подтвердите его ключом. Если нет — сначала посмотрите состав тома и условия покупки.</p><label><span>Ключ доступа к полному тому</span><input type="password" inputmode="text" autocomplete="off" spellcheck="false" data-paid-token placeholder="Ключ доступа"></label><label data-purchase-email-wrap hidden><span>E-mail для электронного чека</span><input type="email" autocomplete="email" inputmode="email" data-purchase-email placeholder="name@example.com"></label><div class="ml-paid-access-actions"><button class="ml-button ml-button-secondary" type="button" data-paid-unlock>Открыть купленное дело</button><a class="ml-button ml-button-secondary" href="${prefix}tom-1/">О первом томе</a><a class="ml-button ml-button-primary" data-purchase-start data-analytics-event="purchase_started" href="#" hidden>Купить полный том</a></div><p class="ml-paid-access-status" data-paid-status>Материалы дела загружаются только после серверной проверки доступа.</p></div>`;

    html = html.replace(
      '<span class="ml-button ml-button-secondary">Полный том · скоро</span>',
      panel,
    );
    html = html.replace(
      'data-paywall-view="true"',
      `data-paywall-view="true" data-paid-case-gateway="${VERSION}"`,
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
    if (!html.includes(`${prefix}tom-1/`)) throw new Error(`Не удалось связать платное дело с витриной тома ${route}`);
    fs.writeFileSync(pagePath, html);
    processed += 1;
  }

  if (processed !== 85) throw new Error(`Ожидалось 85 защищённых страниц, обработано ${processed}`);
  return processed;
}