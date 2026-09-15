import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const expect = (cond, message) => {
  if (!cond) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${message}`);
  }
};

const home = read('index.html');
const hub = read('realnye-dela/index.html');
const css = read('assets/real-investigations-launch.css');
const art = read('assets/real-investigations-hero.svg');
const sitemap = read('sitemap.xml');

expect(home.includes('href="./realnye-dela/"'), 'homepage links to Real Investigations hub');
expect(home.includes('Реальные расследования — первое дело уже доступно'), 'homepage announces the new product');
expect(home.includes('class="ml-product ml-product-real"'), 'homepage includes a dedicated product card');
expect(home.includes('real-investigations-launch.css'), 'homepage loads launch styling');
expect(home.includes('real-investigations-hero.svg'), 'homepage uses dedicated launch artwork');
expect(home.includes('https://mysterylogic.com/'), 'homepage uses production canonical origin');

expect(hub.includes('<h1>Реальные<br>расследования</h1>'), 'hub has dedicated product H1');
expect(hub.includes('pozharnaya-lestnica-1991-premium'), 'hub exposes the first real case');
expect(hub.includes('Игрок ведёт следствие'), 'hub explains player-led investigation');
expect(hub.includes('ИИ не имеет права придумывать новые улики'), 'hub states source-bounded AI rule');
expect(hub.includes('Реальный ответ останется закрытым'), 'hub promises spoiler-free discovery');
expect(hub.includes('CollectionPage'), 'hub includes structured data');
expect(hub.includes('index,follow,max-image-preview:large'), 'hub is indexable');

for (const spoiler of ['Rodney Daniels', 'Родни Дэниелс', 'convicted', 'осуждён', 'осужден']) {
  expect(!home.includes(spoiler) && !hub.includes(spoiler), `launch pages do not reveal outcome: ${spoiler}`);
}

expect(css.includes('.ml-real-launch-grid'), 'launch CSS contains homepage product section');
expect(css.includes('.ri-hero'), 'launch CSS contains product hub hero');
expect(art.includes('<svg') && art.includes('пожарная лестница'), 'launch artwork is present and described');
expect(sitemap.includes('https://mysterylogic.com/realnye-dela/</loc>'), 'sitemap includes product hub');
expect(sitemap.includes('pozharnaya-lestnica-1991-premium'), 'sitemap includes first real case');

if (process.exitCode) process.exit(process.exitCode);
console.log('Real Investigations launch validation passed.');
