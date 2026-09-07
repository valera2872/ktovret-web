import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const css=fs.readFileSync('assets/ai01-onboarding.css','utf8');

for(const phrase of [
  'Вы — следователь. Установите, кто забрал письмо, и докажите это.',
  'Допрашивайте',
  'Проверяйте',
  'Соберите версию',
  'Свободное расследование:',
  'ход расследования определяете вы',
  'Принять дело',
  'Свободный допрос:',
  'спрашивайте о том, что считаете важным',
  'placeholder="Задайте свой вопрос…"'
]) assert.ok(html.includes(phrase),`missing onboarding phrase: ${phrase}`);

for(const leakedHint of [
  'Первый ориентир:',
  'установите, где человек был в окно пропажи',
  'после старта в комнату пригласят Марину',
  'Спросите, где она была между 21:24 и 21:36'
]) assert.ok(!html.includes(leakedHint),`investigation hint must not be shown: ${leakedHint}`);

assert.ok(html.includes('../assets/ai01-onboarding.css?v=0.1.0'),'onboarding stylesheet must be loaded');
assert.ok(css.includes('.aid-howto'),'onboarding steps styles must exist');
assert.ok(css.includes('@media(max-width:800px)'),'mobile onboarding styles must exist');

console.log('AI-01 onboarding contract OK');
