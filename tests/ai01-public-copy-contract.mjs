import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('detektivnaya-igra-s-ii/index.html','utf8');
const promo=fs.readFileSync('assets/ai01-launch-promo.js','utf8');

for(const phrase of ['Восемь минут без камеры','AI-расследование · бесплатно','Задавайте любые вопросы своими словами — голосом или текстом','Принять дело']) {
  assert.ok(html.includes(phrase),`public AI-01 copy missing: ${phrase}`);
}
assert.ok(!/прототип|prototype|owner preview|изолированный стенд/i.test(html),'internal preview language leaked into public AI-01');
assert.ok(promo.includes('три фигуранта, улики, свободные вопросы'),'sitewide promo must explain the product');

console.log('AI-01 public copy contract OK');