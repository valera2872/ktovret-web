(()=>{
'use strict';
const app=document.querySelector('[data-moreno-app]');if(!app)return;
document.body.classList.add('moreno-reference-v19');
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
function enhance(){for(const card of app.querySelectorAll('.v6-item')){const body=norm(card.querySelector('p')?.textContent);if(!/^Вы предъявили ранее зафиксированное показание/i.test(body))continue;card.classList.add('ref19-statement-present');const tag=card.querySelector('.ref17-evidence-tag');if(tag&&tag.textContent!=='МАТЕРИАЛ · ПОКАЗАНИЯ')tag.textContent='МАТЕРИАЛ · ПОКАЗАНИЯ';const bar=card.querySelector(':scope > .ref16-statebar');if(bar&&bar.dataset.v19Statement!=='1'){bar.dataset.v19Statement='1';const strong=bar.querySelector('strong'),span=bar.querySelector('span');if(strong)strong.textContent='ПРЕДЪЯВЛЕНИЕ';if(span)span.textContent='выбранное следователем показание предъявлено собеседнику'}}}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;enhance()})}
new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
enhance();
window.MLMorenoReferenceV19={version:'1.9.0',refresh:enhance};
})();
