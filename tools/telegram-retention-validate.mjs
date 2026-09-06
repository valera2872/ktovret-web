#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,'..');
const read=(p)=>fs.readFileSync(path.join(repo,p),'utf8');
const must=(text,fragment,label)=>{if(!text.includes(fragment))throw new Error(`${label} missing: ${fragment}`);};

const sitewide=read('assets/logic-sitewide.js');
for(const placement of ['sticky','after_puzzle','after_case','after_solo_case']) must(sitewide,placement,'sitewide retention placement');
for(const marker of ['ml:logic_complete','ml:solo_complete','step_view','primary_action','telegram-retention','who-lied-offer','data-who-lied-cta','ml_telegram_click','18_000']) must(sitewide,marker,'sitewide retention runtime');
if(sitewide.includes("sendFunnel('telegram_prompt_view'")) throw new Error('unsupported telegram_prompt_view event must not be sent to funnel endpoint');
if(sitewide.includes("sendFunnel('telegram_click'")) throw new Error('unsupported telegram_click event must not be sent to funnel endpoint');
if(!sitewide.includes("/^\\/detektivnye-igry-dlya-odnogo\\/407$/.test(path)")) throw new Error('Solo 407 must be excluded from sticky Telegram prompts');

const expert=read('assets/logic-expert.js');
for(const marker of ['ml:logic_complete','CustomEvent','emitCompletion']) must(expert,marker,'logic completion bridge');

const css=read('assets/logic-sitewide.css');
for(const marker of ['.ml-telegram-sticky','.ml-telegram-retention','.ml-who-lied-bridge','[data-nav-daily]']) must(css,marker,'retention styles');

const post=read('tools/import-mobile/logic-sitewide-postprocess.mjs');
for(const marker of ['Мини-дело дня ↗','data-nav-daily','data-telegram-cta="header"','data-logic-sitewide-style','telegramRetention:true',"VERSION='3.2.0'"]) must(post,marker,'sitewide generator');

const who=read('tools/import-mobile/storefront-v4-who-postprocess.mjs');
for(const marker of ['data-who-play-modes','Вслух с семьёй','99 ₽','100 коротких детективных загадок']) must(who,marker,'Who Lied product framing');

console.log(JSON.stringify({telegramRetention:true,allowedFunnelEvents:['step_view','primary_action'],placements:['header','sticky','after_puzzle','after_case','after_solo_case'],whoLiedBridge:true,solo407EarlyPromptSuppressed:true},null,2));
