(() => {
  'use strict';
  const root=document.querySelector('[data-casearia-app]');
  if(!root) return;

  const artifact=(type,text='')=>{
    const has=(needle)=>text.includes(needle);
    switch(type){
      case 'prop': return `<div class="aria-artifact aa-prop" aria-hidden="true"><div class="aa-prop-id"><small>РЕКВИЗИТ</small><strong>PR-17</strong></div><div class="aa-blade"><i></i><span>9 mm</span></div><div class="aa-part"><b>BR-06</b><small>ограничитель</small></div><div class="aa-scale"></div></div>`;
      case 'cue': return `<div class="aria-artifact aa-cue" aria-hidden="true"><div class="aa-cue-line"><span>A-17</span><i></i><span>Q-17B</span><i></i><b>8 SEC</b></div><div class="aa-cue-note">ПРИ ТРАВМЕ → BLACKOUT ДО КОМАНДЫ</div></div>`;
      case 'plan': return `<div class="aria-artifact aa-plan" aria-hidden="true"><div class="aa-room pit">ПОДИУМ</div><div class="aa-route"><span>STAIR-18</span><i></i><b>16–20 s</b></div><div class="aa-room archive">АРХИВ</div><div class="aa-long">СЦЕНА <i></i> ≥58 s</div></div>`;
      case 'lighting': return `<div class="aria-artifact aa-light" aria-hidden="true"><div class="aa-time"><b>21:49:12</b><span>Q-17B</span></div><div class="aa-light-track"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="aa-safe"><span>SAFE-L</span><span>SAFE-R</span></div><div class="aa-time end"><b>21:50:04</b><span>WORK LIGHT</span></div></div>`;
      case 'access': return `<div class="aria-artifact aa-access" aria-hidden="true"><div class="aa-door"><i></i><strong>K-12</strong></div><div class="aa-access-log"><span><b>21:49:31</b> OPEN</span><span><b>21:49:43</b> CLOSED</span><small>NO FORCED ENTRY</small></div></div>`;
      case 'audio': return `<div class="aria-artifact aa-audio" aria-hidden="true"><div class="aa-audio-head"><span>SOURCE</span><strong>PB-2</strong>${has('MIC-C')?'<em>MIC-C · 0 INPUT</em>':''}</div><div class="aa-wave">${Array.from({length:28},(_,i)=>`<i style="--h:${[18,32,55,26,70,45,24,62,38,76,29,52,68,21][i%14]}%"></i>`).join('')}</div><div class="aa-audio-times"><span>21:49:22</span><span>21:49:35</span></div></div>`;
      case 'medical': return `<div class="aria-artifact aa-medical" aria-hidden="true"><div class="aa-cross">+</div><div class="aa-med-line"><span>21:49:22</span><i></i><b>21:49:46</b><i></i><span>22:03</span></div><div class="aa-wound"><strong>17 mm</strong><span>≤ 8 mm depth</span></div></div>`;
      case 'forensic': return `<div class="aria-artifact aa-trace" aria-hidden="true"><div class="aa-shoe"><i></i><i></i><i></i><i></i><b>43</b></div><div class="aa-trace-label"><small>ЛАБ. МАРКЕР</small><strong>HEEL-43C</strong><span>CRESCENT HEEL</span></div></div>`;
      case 'routing': return `<div class="aria-artifact aa-routing" aria-hidden="true"><div class="aa-bus live"><small>LIVE</small><strong>MIC-C</strong></div><i class="aa-arrow"></i><div class="aa-mix">INTERCOM<br>BUS</div><i class="aa-arrow"></i><div class="aa-bus playback"><small>REC</small><strong>PB-2</strong></div></div>`;
      case 'wardrobe': return `<div class="aria-artifact aa-wardrobe" aria-hidden="true"><div class="aa-sole"><b>43</b><i></i></div><div class="aa-repair"><span>CRESCENT-43</span><small>ПРАВЫЙ КАБЛУК · РЕМОНТ 16:20</small></div></div>`;
      case 'keys': return `<div class="aria-artifact aa-key" aria-hidden="true"><div class="aa-key-shape"><i></i><i></i><i></i></div><div><small>ВРЕМЕННЫЙ ДУБЛИКАТ</small><strong>K-12</strong><span>18 NOV · 15:06</span></div></div>`;
      case 'workshop': return `<div class="aria-artifact aa-workshop" aria-hidden="true"><div class="aa-bench"><b>B-3</b><span>18:40</span></div><div class="aa-custody"><span>18:36</span><i></i><span>BR-06</span><i></i><strong>P-771</strong><i></i><span>21:44</span></div><small>CHAIN OF CUSTODY</small></div>`;
      case 'interview': return `<div class="aria-artifact aa-interview" aria-hidden="true"><div class="aa-quote">“</div><div><span>ПОВТОРНЫЙ ОПРОС</span><strong>«Я не покидал подиум»</strong><i></i><i></i><i></i></div></div>`;
      case 'seizure': return `<div class="aria-artifact aa-case" aria-hidden="true"><div class="aa-case-box"><b>T-6M</b><i></i></div><div class="aa-case-track"><span>20:57 · PIT</span><span>21:51 · OPEN</span><span>22:14 · SEIZED</span></div></div>`;
      case 'correspondence': return `<div class="aria-artifact aa-fax" aria-hidden="true"><div class="aa-fax-head"><span>FAX · A. STEIN</span><b>16 NOV</b></div><div class="aa-fax-price">42 000 <small>EUR</small></div><div class="aa-fax-lines"><i></i><i></i><i></i></div><span class="aa-fax-pin">PIN · M.KAREV</span></div>`;
      case 'presence': return `<div class="aria-artifact aa-presence" aria-hidden="true"><div><b>ИЛЬЯ</b><span>SAFE-L/R</span></div><div><b>ДАРЬЯ</b><span>FOYER</span></div><div><b>МАКСИМ</b><span>LX-4</span></div><div><b>АНТОН</b><span>STAGE</span></div></div>`;
      case 'rfid': return `<div class="aria-artifact aa-rfid" aria-hidden="true"><div class="aa-gate left"></div><div class="aa-scan"><span>PASSIVE TAG</span><strong>MS-1908</strong><i></i><small>CONTAINER · ?</small></div><div class="aa-gate right"></div></div>`;
      default: return '';
    }
  };

  const decorate=()=>{
    root.querySelectorAll('.casearia-evidence:not([data-materialized-v2])').forEach((card)=>{
      const type=[...card.classList].find((c)=>c.startsWith('type-'))?.slice(5)||'';
      const html=artifact(type,card.textContent||'');
      card.dataset.materializedV2='1';
      if(!html) return;
      card.querySelector('header')?.insertAdjacentHTML('afterend',html);
    });
  };
  const observer=new MutationObserver(decorate);
  observer.observe(root,{childList:true,subtree:true});
  decorate();
})();
