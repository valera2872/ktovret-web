import fs from 'node:fs';
const html=fs.readFileSync('admin/solo-v2-live-preview/index.html','utf8');
const auth=fs.readFileSync('assets/solo-v2-preview-auth.mjs','utf8');
const onboarding=fs.readFileSync('assets/solo-v2-onboarding.mjs','utf8');
const css=fs.readFileSync('assets/solo-v2-onboarding.css','utf8');
const need=(ok,msg)=>{if(!ok)throw new Error(msg)};
need(html.includes('data-solo-onboarding'),'onboarding root missing');
need(html.includes('data-onb-stage="film"'),'film stage missing');
need(html.includes('data-onb-stage="briefing"'),'briefing stage missing');
need(html.includes('data-onb-stage="primer"'),'primer stage missing');
need(html.includes('Что произошло этой ночью'),'full briefing missing');
need(html.includes('Что нужно установить'),'mission briefing missing');
need(html.includes('Не нужно разбираться во всём сразу'),'friendly first-step screen missing');
need(html.includes('24 материала'),'case scope missing');
need(html.includes('data-solo-runtime-shell hidden'),'runtime must be hidden before onboarding');
need(onboarding.includes("ml-preview-start"),'onboarding must hand off to preview runtime');
need(auth.includes("ml-preview-ready"),'preview auth must expose onboarding ready event');
need(auth.includes("ONBOARDING_PREFIX"),'onboarding resume guard missing');
need(auth.includes("recoverStaleSoloSession"),'stale session recovery regressed');
need(css.includes('.ml-film'),'cinematic visual styles missing');
for(const token of ['DENIS_KILLED_LEV','correct_choice','effects_on_confirm','expectedReconstruction']){
  need(!html.includes(token),`private token leaked into onboarding html: ${token}`);
  need(!onboarding.includes(token),`private token leaked into onboarding js: ${token}`);
}
console.log('ML-0512 cinematic onboarding contract: PASS');
