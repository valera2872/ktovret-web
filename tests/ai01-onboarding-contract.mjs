import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const css=fs.readFileSync('assets/ai01-onboarding.css','utf8');

for(const phrase of [
  'Вы — следователь. Установите, кто забрал письмо, и докажите это.',
  'Допрашивайте',
  'Проверяйте',
  'Соберите версию',
  'С чего начать:',
  'после старта в комнату пригласят Марину',
  'Начать расследование',
  'Первый ориентир:',
  'placeholder="Задайте свой вопрос…"'
]) assert.ok(html.includes(phrase),`missing onboarding phrase: ${phrase}`);

assert.ok(html.includes('../assets/ai01-onboarding.css?v=0.1.0'),'onboarding stylesheet must be loaded');
assert.ok(css.includes('.aid-howto'),'onboarding steps styles must exist');
assert.ok(css.includes('@media(max-width:800px)'),'mobile onboarding styles must exist');

console.log('AI-01 onboarding contract OK');
