#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applySolo407, finalizeSolo407 } from './import-mobile/solo-407-postprocess.mjs';
import { applySolo407PlayerFeedback } from './import-mobile/solo-407-player-feedback-postprocess.mjs';

const solo = fs.readFileSync('assets/case-407-solo.js','utf8');
const css = fs.readFileSync('assets/case-407-solo.css','utf8');
const progressiveRuntime = fs.readFileSync('assets/case-407-solo-progressive-entry.js','utf8');
const progressiveStyle = fs.readFileSync('assets/case-407-solo-progressive-entry.css','utf8');
const ktoVretCss = fs.readFileSync('assets/solo-hub-kto-vret.css','utf8');
const post = fs.readFileSync('tools/import-mobile/solo-407-postprocess.mjs','utf8');
const feedbackPost = fs.readFileSync('tools/import-mobile/solo-407-player-feedback-postprocess.mjs','utf8');
const two407 = fs.readFileSync('tools/import-mobile/two-player-407-postprocess.mjs','utf8');
const checks = [
  [solo.includes("STORAGE_KEY = 'ml:solo:407:v1'"),'stable solo storage'],
  [solo.includes("answer: 'ids'") && solo.includes("answer: 'zones'") && solo.includes("answer: 'owner'"),'three neutral checkpoints'],
  [solo.includes("title: 'Первые двадцать минут'") && solo.includes("title: 'След после тревоги'") && solo.includes("title: 'Последние подтверждения'"),'spoiler-neutral stage headings'],
  [solo.includes('const soloFinal =') && solo.includes('чьи действия независимо подтверждаются материалами'),'spoiler-neutral final framing'],
  [!solo.includes("title: 'Кто помог Марте'") && !solo.includes('роль Елены в вывозе Марты и сапфира'),'old answer-leading copy removed from solo runtime'],
  [!solo.includes('stageData = data.stages') && !solo.includes('data.final.intro') && !solo.includes('data.final.questions.map'),'solo presentation isolated from answer-leading source copy'],
  [solo.includes('score === soloFinal.questions.length'),'no reveal before full solution'],
  [solo.includes('Версия пока не выдерживает все материалы.') && solo.includes('Я не покажу, какое именно звено слабое'),'non-nudging final feedback'],
  [!solo.includes('${score} из ${soloFinal.questions.length}') && !solo.includes('${score} из ${data.final.questions.length}'),'wrong final does not leak score'],
  [solo.includes('solo407-hint-panel') && !solo.includes('alert('),'premium inline hints'],
  [post.includes('Детективные игры и квесты онлайн для одного — бесплатно'),'SEO title'],
  [post.includes('два формата бесплатно'),'clear two-format solo promise'],
  [post.includes('solo407-kv') && post.includes('Играть в 15 дел бесплатно'),'Who Lies showcase and CTA'],
  [post.includes('Четыре входа в архив') && post.includes('Три несинхронных журнала') && post.includes('Пять папок и пустое место'),'Who Lies starter cases'],
  [post.includes('solo407-format-switch'),'two-player rescue switch'],
  [post.includes('solo407-home-switch'),'home 1/2-player chooser'],
  [feedbackPost.includes("const VERSION = '1.3.0'") && feedbackPost.includes('case-407-solo-player-feedback.js') && feedbackPost.includes('case-407-solo-progressive-entry.js'),'feedback/progressive layer revision'],
  [progressiveRuntime.includes("DONE_KEY = 'ml:solo:407:progressive-entry:v1'") && progressiveRuntime.includes('Осмотреть номер') && progressiveRuntime.includes('Опросить охрану') && progressiveRuntime.includes('Осмотреть дверь') && progressiveRuntime.includes('Запросить журнал замка'),'progressive first-entry direction'],
  [progressiveRuntime.includes("completedNext(state).length >= 2") && progressiveRuntime.includes("'[data-open=\"s1-i0\"]'") && progressiveRuntime.includes("'[data-request=\"s1-i2\"]'"),'progressive flow uses authoritative evidence state'],
  [progressiveStyle.includes('.solo407-progressive-active > .solo407-desk') && progressiveStyle.includes('.solo407-entry-copy [data-solo407-context]'),'progressive visual hierarchy'],
  [css.includes('.solo407-entry-visual') && css.includes('.solo407-desk'),'premium entry and desk styling'],
  [ktoVretCss.includes('.solo407-kv') && ktoVretCss.includes('.solo407-kv-cases') && ktoVretCss.includes('@media'),'premium Who Lies showcase styling'],
  [two407.includes("./solo-407-postprocess.mjs") && two407.includes('applySolo407(siteRoot)'),'generator integration'],
];
for (const [ok,label] of checks) if (!ok) throw new Error(`Solo 407 validation failed: ${label}`);
for (const forbidden of ['Сверьтесь с напарником','отправьте второму игроку','создайте комнату']) if (solo.toLowerCase().includes(forbidden.toLowerCase())) throw new Error(`Solo runtime contains co-op language: ${forbidden}`);

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ml-solo-407-'));
try {
  fs.mkdirSync(path.join(tmp,'detektivnye-igry-dlya-dvoih'),{recursive:true});
  fs.mkdirSync(path.join(tmp,'assets/generated'),{recursive:true});
  fs.writeFileSync(path.join(tmp,'detektivnye-igry-dlya-dvoih/index.html'),'<!doctype html><html><head></head><body><main><h1>Для двоих</h1></main></body></html>');
  fs.writeFileSync(path.join(tmp,'index.html'),'<!doctype html><html><head></head><body><main><h1>Mystery Logic</h1></main></body></html>');
  fs.writeFileSync(path.join(tmp,'sitemap.xml'),'<?xml version="1.0"?><urlset><url><loc>https://valera2872.github.io/ktovret-web/</loc></url></urlset>');
  fs.writeFileSync(path.join(tmp,'assets/generated/import-report.json'),JSON.stringify({indexableUrls:1},null,2));
  const result=applySolo407(tmp);
  applySolo407PlayerFeedback(tmp);
  finalizeSolo407(tmp);
  const hub=fs.readFileSync(path.join(tmp,'detektivnye-igry-dlya-odnogo/index.html'),'utf8');
  const game=fs.readFileSync(path.join(tmp,'detektivnye-igry-dlya-odnogo/407/index.html'),'utf8');
  const duo=fs.readFileSync(path.join(tmp,'detektivnye-igry-dlya-dvoih/index.html'),'utf8');
  const home=fs.readFileSync(path.join(tmp,'index.html'),'utf8');
  const sitemap=fs.readFileSync(path.join(tmp,'sitemap.xml'),'utf8');
  const report=JSON.parse(fs.readFileSync(path.join(tmp,'assets/generated/import-report.json'),'utf8'));
  for(const [ok,label] of [
    [result.materials===18,'18 source materials'],
    [hub.includes('1 игрок')&&hub.includes('два формата бесплатно'),'solo hub promise'],
    [hub.includes('solo407-kv')&&hub.includes('Играть в 15 дел бесплатно'),'Who Lies hub showcase'],
    [hub.includes('../assets/solo-hub-kto-vret.css?v=1.0.0'),'Who Lies showcase stylesheet'],
    [game.includes('data-solo407-app')&&game.includes('case-407-solo.js'),'solo case runtime'],
    [game.includes('case-407-solo-player-feedback.css?v=1.3.0'),'generated feedback stylesheet'],
    [game.includes('case-407-solo-progressive-entry.css?v=1.3.0'),'generated progressive stylesheet'],
    [game.includes('case-407-solo-player-feedback.js?v=1.3.0'),'generated feedback runtime'],
    [game.includes('case-407-solo-progressive-entry.js?v=1.3.0'),'generated progressive runtime'],
    [game.includes('cognitive-solo-analytics.js?v=1.3.0'),'generated solo cognitive analytics'],
    [duo.includes('solo407-format-switch'),'two-player rescue'],
    [home.includes('solo407-home-switch')&&home.includes('Расследовать одному')&&home.includes('Расследовать вдвоём'),'home format chooser'],
    [sitemap.includes('/detektivnye-igry-dlya-odnogo/'),'solo hub in sitemap'],
    [report.soloMaterials===18&&report.soloCaseRoute==='detektivnye-igry-dlya-odnogo/407','solo report'],
  ]) if(!ok) throw new Error(`Solo generated integration failed: ${label}`);
} finally { fs.rmSync(tmp,{recursive:true,force:true}); }

console.log(JSON.stringify({solo407:true, ktoVretShowcase:true, checkpoints:3, materials:18, roomless:true, spoilerNeutral:true, wrongFinalScoreHidden:true, revealGate:'4/4', premiumUi:true, generatedIntegration:true, playerFeedbackLayer:'1.3.0', progressiveEntry:true},null,2));
