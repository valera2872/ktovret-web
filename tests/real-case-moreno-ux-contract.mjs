import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const assets = new URL('../assets/', import.meta.url);
const read = (name) => readFileSync(new URL(name, assets), 'utf8');
const folder = read('real-case-moreno-reference-v11.js');
const metadata = read('real-case-moreno-reference-v13.js');
const css = read('real-case-moreno-production-v26.css');

// Never replace canonical earned evidence with unclickable decorative summaries.
assert.match(folder, /evidence\.querySelectorAll\(':scope > article:not\(\.v4-hyp\)'\)/);
assert.doesNotMatch(folder, /\[\.\.\.evidence\.children\]\.forEach\(el=>\{if\(el!==head\)el\.remove\(\)\}\)/);
assert.doesNotMatch(folder, /evidence\.insertAdjacentHTML\('beforeend',groups\.join/);
assert.doesNotMatch(folder, /<div class="ref11-card-status"><span>✓<\/span> Завершено<\/div>/);

// Journal presentation cannot claim to have completed a request that requires clarification.
assert.doesNotMatch(metadata, /Выполнено \$\{bundle\}/);
assert.doesNotMatch(metadata, /материалы сохранены/);
assert.match(metadata, /Ответ следственной группы/);
assert.match(metadata, /diagnostic=\['system','limit','dead'\]/);
assert.doesNotMatch(metadata, /ИИ-помощник активен/);

// Full canonical evidence text and mobile acceptance button must remain accessible.
assert.match(css, /-webkit-line-clamp:unset!important/);
assert.match(css, /\.v4-evidence > article:not\(\.ref11-folder-card\) p/);
assert.match(css, /\.ml-ai01-launch-promo\{display:none!important\}/);
assert.match(css, /@media\(max-width:560px\)/);
// The case opening must remain available after the player accepts the case.
assert.match(folder, /function caseBrief\(expanded\)/);
assert.match(folder, /Исходные обстоятельства и как расследовать/);
assert.match(folder, /ДЕЛО У ВАС/);
assert.doesNotMatch(folder, /empty\.innerHTML=initialReport\(\)/);
assert.match(folder, /briefingPreference===null\?!hasJournal:briefingPreference/);
assert.match(css, /\.ref11-case-brief-content\{/);
assert.match(css, /@media\(max-width:700px\)/);

console.log('PASS Moreno UX contracts: evidence visibility, truthful statuses, diagnostic cards, mobile start');
