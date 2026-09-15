import fs from 'node:fs';

const html=fs.readFileSync('admin/solo-guided-preview/index.html','utf8');
const js=fs.readFileSync('assets/solo-guided-preview-v3.js','utf8');

const fail=(message)=>{throw new Error(message)};

if(html.includes('Проверяем ссылку')) fail('technical boot gate must not be visible');
if(html.includes('data-loading')) fail('loading screen must be removed from guided intro');
if(html.includes('data-intro hidden')) fail('intro must be visible in static HTML');
if(!html.includes('solo-guided-preview-v3.js')) fail('guided preview HTML must load classic v3 client');
if(html.includes('type="module"')) fail('guided preview must not depend on module loading');
if(!html.includes('data-intro-restart')) fail('saved investigation must expose restart before resume');
if(!html.includes("enterButton.textContent = 'Продолжить расследование'")) fail('saved investigation must make resume explicit');
if(!html.includes("localStorage.getItem(sessionKey)")) fail('resume choice must be derived locally without startup network');
if(!html.includes('resetSession(introRestartButton, true)')) fail('intro restart must reset the server session before entering');
if(js.includes('solo-preview-auth')) fail('v3 client must not call preview-auth on page load');
if(!js.includes("const caseId='ML0512_PREVIEW_")) fail('v3 client must know the scoped preview alias without boot auth');
if(!js.includes("$('[data-enter]')?.addEventListener")) fail('player entry action must be explicit');
if(!js.includes("await ensureSession();await advance()")) fail('session must start only after player enters investigation');
if(!js.includes('AbortController')) fail('network calls need a timeout guard');
if(html.includes('—')||js.includes('—')) fail('Russian player-facing copy must not contain em dash');
console.log('SOLO_GUIDED_PREVIEW_V3_PASS');
