import fs from 'node:fs';
import path from 'node:path';

const insertBeforeMainEnd=(file,html)=>{
  let source=fs.readFileSync(file,'utf8');
  if(source.includes('data-storefront-v2-contract')) return;
  source=source.replace('</main>',`${html}</main>`);
  fs.writeFileSync(file,source);
};

export function applyStorefrontV2Contracts(siteRoot){
  const catalog=path.join(siteRoot,'dela/index.html');
  const volume=path.join(siteRoot,'tom-1/index.html');
  if(!fs.existsSync(catalog)||!fs.existsSync(volume)) throw new Error('storefront v2 contract pages missing');

  insertBeforeMainEnd(catalog,`<section class="sf-contract-note" data-storefront-v2-contract><p class="ml-kicker">Полный первый том</p><h2>Ещё 85 дел — одной покупкой</h2><p>Одна разовая покупка открывает продолжение архива без подписки и регулярных списаний.</p></section>`);

  insertBeforeMainEnd(volume,`<section class="sf-contract-note" data-storefront-v2-contract><p class="ml-kicker">Первый том «Кто врёт?» — 100 детективных задач</p><h2>Архив первого тома</h2><p>Внутри — несколько тематических архивов и 100 расследований. 15 дел доступны без покупки. Для вопросов об оплате и восстановлении доступа: <a href="mailto:support@mysterylogic.com">support@mysterylogic.com</a>.</p></section>`);

  return {pages:2};
}