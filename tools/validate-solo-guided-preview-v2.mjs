import fs from 'node:fs';

const html=fs.readFileSync('admin/solo-guided-preview/index.html','utf8');
const js=fs.readFileSync('assets/solo-guided-preview-v2.mjs','utf8');

const fail=(message)=>{throw new Error(message)};

if(!html.includes('solo-guided-preview-v2.mjs')) fail('guided preview HTML must load v2 client');
if(!html.includes('Проверяем ссылку')) fail('boot copy must describe link verification');
if(!js.includes('function showIntro()')) fail('v2 client must expose intro before game session start');
if(!js.includes("await authPreview();showIntro()")) fail('boot must show intro immediately after auth');
if(!js.includes("await ensureSession();await advance()")) fail('game session must start only after player enters investigation');
if(!js.includes('AbortController')) fail('network calls need a timeout guard');
if(js.includes('—')) fail('Russian player-facing client copy must not contain em dash');
console.log('SOLO_GUIDED_PREVIEW_V2_PASS');
