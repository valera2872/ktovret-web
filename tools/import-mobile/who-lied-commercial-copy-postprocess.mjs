import fs from 'node:fs';
import path from 'node:path';

const STALE_PATTERNS=[
  /15\s+бесплатн/iu,
  /ещ[ёе]\s+85\s+дел/iu,
  /85\s+дополнительных\s+дел/iu,
  /Открыть\s+85\s+дел\s+за\s+99/iu,
];

export function normalizeWhoLiedCommercialCopy(siteRoot){
  const target=path.join(siteRoot,'detektivnye-golovolomki','index.html');
  if(!fs.existsSync(target)) return {pages:0,replacements:0};
  let html=fs.readFileSync(target,'utf8');
  const before=html;
  html=html
    .replace('В «Кто врёт?» уже 15 бесплатных законченных дел. Для длинной игры есть solo «Номер 407» и отдельные расследования для двух игроков.','В «Кто врёт?» — 10 бесплатных законченных дел. Ещё 100 расследований собраны в двух томах по 50 дел. Для длинной игры есть solo «Номер 407» и отдельные расследования для двух игроков.')
    .replace('>15 дел бесплатно →</a>','>10 дел бесплатно →</a>');
  for(const pattern of STALE_PATTERNS){
    if(pattern.test(html)) throw new Error(`stale Who Lied commercial copy remains in detektivnye-golovolomki: ${pattern}`);
  }
  if(html!==before) fs.writeFileSync(target,html);
  return {pages:1,replacements:html===before?0:1};
}
