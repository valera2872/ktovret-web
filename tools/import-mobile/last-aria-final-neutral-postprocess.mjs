import fs from 'node:fs';
import path from 'node:path';

const REVISION='1.7.0';
const BASE_RUNTIME_VERSION='1.4.0';
const CASE_PAGE='detektivnye-igry-dlya-dvoih/poslednyaya-ariya/index.html';
const INVESTIGATOR='assets/case-aria-investigator-v16.js';
const STOREFRONT='assets/case-aria-storefront.js';

const NEUTRAL_VOICE_TITLE='Что устанавливают технические материалы о трёх фразах интеркома?';
const NEUTRAL_SEQUENCE_TITLE='Какая версия выдерживает все материалы?';
const OLD_VOICE_TITLE='Что следует из материалов о голосе Михаила?';
const OLD_SEQUENCE_CANONICAL='PR-17 саботирован заранее → травма продлевает blackout → PB-2 имитирует присутствие → K-12 открывает архив → партитура оказывается в T-6M';
const OLD_SEQUENCE_MANAGER='Илья намеренно держит blackout → Дарья открывает архив → Михаил случайно получает партитуру';
const OLD_SEQUENCE_ANTON='Антон инсценирует ранение → сам идёт в архив → возвращается до рабочего света';

const patch=`\n;(() => {\n  'use strict';\n  const data=window.MLCaseAria;\n  if(!data?.final?.questions) return;\n  const voice=data.final.questions.find((question)=>question.id==='voice');\n  if(voice){\n    voice.title='${NEUTRAL_VOICE_TITLE}';\n    voice.options=[\n      ['recording','PB-2 передавал TAKE-6, тогда как MIC-C в это окно не имел входного сигнала'],\n      ['distance','MIC-C оставался живым, а PB-2 лишь дублировал тот же сигнал с задержкой'],\n      ['parallel','PB-2 и MIC-C не позволяют установить, был ли источник живым или заранее сохранённым'],\n      ['witness','Технические данные не определяют источник; его можно установить только по показаниям очевидцев']\n    ];\n  }\n  const sequence=data.final.questions.find((question)=>question.id==='sequence');\n  if(sequence){\n    sequence.title='${NEUTRAL_SEQUENCE_TITLE}';\n    sequence.options=[\n      ['canonical','PR-17 изменён до сцены → реальная травма запускает SAFE → вооружённая TAKE-6 срабатывает от Q-17B → K-12 открывает архив → MS-1908 затем фиксируется внутри T-6M'],\n      ['manager','PR-17 изменён до сцены → реальная травма запускает SAFE → сценический менеджер передаёт K-12 сообщнику → PB-2 запускается из техзоны → MS-1908 позже оказывается внутри T-6M'],\n      ['anton','PR-17 изменён до сцены → реальная травма запускает SAFE → другой человек использует K-12 и обувь 43-го размера → после рабочего света MS-1908 подбрасывают в T-6M'],\n      ['archivist','PR-17 изменён до сцены → реальная травма запускает SAFE → архивист пользуется законным доступом во время blackout → PB-2 маскирует движение → скан рядом с T-6M ошибочно принимают за содержимое кофра']\n    ];\n  }\n  window.MLAriaFinalNeutral=Object.freeze({revision:'${REVISION}',voiceNeutral:true,balancedSequence:true});\n})();\n`;

export function prepareLastAriaFinalNeutral(siteRoot){
  const storefrontFile=path.join(siteRoot,STOREFRONT);
  if(!fs.existsSync(storefrontFile)) return {prepared:false};
  let storefront=fs.readFileSync(storefrontFile,'utf8');
  if(storefront.includes(`const version = '${REVISION}';`)){
    storefront=storefront.replace(`const version = '${REVISION}';`,`const version = '${BASE_RUNTIME_VERSION}';`);
    fs.writeFileSync(storefrontFile,storefront);
  }
  return {prepared:true};
}

export function applyLastAriaFinalNeutral(siteRoot){
  const pageFile=path.join(siteRoot,CASE_PAGE);
  const investigatorFile=path.join(siteRoot,INVESTIGATOR);
  const storefrontFile=path.join(siteRoot,STOREFRONT);
  if(!fs.existsSync(pageFile)||!fs.existsSync(investigatorFile)||!fs.existsSync(storefrontFile)) return {applied:false,revision:REVISION};

  let investigator=fs.readFileSync(investigatorFile,'utf8');
  investigator=investigator.replace(/\n;\(\(\) => \{\n  'use strict';\n  const data=window\.MLCaseAria;[\s\S]*?window\.MLAriaFinalNeutral=Object\.freeze\(\{revision:'1\.7\.0',voiceNeutral:true,balancedSequence:true\}\);\n\}\)\(\);\n?$/,'');
  investigator+=patch;
  fs.writeFileSync(investigatorFile,investigator);

  let storefront=fs.readFileSync(storefrontFile,'utf8');
  storefront=storefront.replace(`const version = '${BASE_RUNTIME_VERSION}';`,`const version = '${REVISION}';`);
  if(!storefront.includes(`const version = '${REVISION}';`)) throw new Error('Last Aria final-neutral cache revision was not applied to storefront');
  fs.writeFileSync(storefrontFile,storefront);

  let page=fs.readFileSync(pageFile,'utf8');
  page=page.replaceAll(`?v=${BASE_RUNTIME_VERSION}`,`?v=${REVISION}`);
  fs.writeFileSync(pageFile,page);

  const combined=`${investigator}\n${storefront}\n${page}`;
  for(const marker of [NEUTRAL_VOICE_TITLE,NEUTRAL_SEQUENCE_TITLE,"['parallel'","['archivist'",`revision:'${REVISION}'`,`const version = '${REVISION}';`,`?v=${REVISION}`]){
    if(!combined.includes(marker)) throw new Error(`Last Aria final-neutral marker missing: ${marker}`);
  }
  for(const forbidden of [OLD_VOICE_TITLE,OLD_SEQUENCE_CANONICAL,OLD_SEQUENCE_MANAGER,OLD_SEQUENCE_ANTON]){
    if(investigator.includes(forbidden)) throw new Error(`Last Aria final form still contains leading option: ${forbidden}`);
  }
  return {applied:true,revision:REVISION,voiceTitle:NEUTRAL_VOICE_TITLE,sequenceTitle:NEUTRAL_SEQUENCE_TITLE};
}
