(() => {
  'use strict';

  const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

  const frame=(inner,label='')=>`<div class="mlq-admin-art"><svg viewBox="0 0 520 205" role="img" aria-label="${esc(label)}">
    <defs>
      <linearGradient id="desk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#183752"/><stop offset=".52" stop-color="#10283d"/><stop offset="1" stop-color="#071725"/></linearGradient>
      <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ecd4"/><stop offset="1" stop-color="#dbc391"/></linearGradient>
      <radialGradient id="warm" cx=".80" cy=".12" r=".72"><stop offset="0" stop-color="#d3a95e" stop-opacity=".42"/><stop offset=".45" stop-color="#b88d47" stop-opacity=".12"/><stop offset="1" stop-color="#c49a50" stop-opacity="0"/></radialGradient>
      <radialGradient id="vignette" cx=".5" cy=".45" r=".8"><stop offset=".55" stop-color="#00101e" stop-opacity="0"/><stop offset="1" stop-color="#00101e" stop-opacity=".58"/></radialGradient>
      <pattern id="grain" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M0 8 H26 M0 21 H26" stroke="#8ca4b7" stroke-opacity=".035"/><path d="M7 0 V26 M19 0 V26" stroke="#d5bd87" stroke-opacity=".025"/></pattern>
      <filter id="objectShadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#000814" flood-opacity=".55"/></filter>
    </defs>
    <rect width="520" height="205" fill="url(#desk)"/>
    <rect width="520" height="205" fill="url(#grain)"/>
    <rect width="520" height="205" fill="url(#warm)"/>
    <g opacity=".34"><path d="M18 26 H132 M18 32 H96" stroke="#8fa5b7"/><circle cx="482" cy="30" r="12" fill="none" stroke="#d6b16d"/><path d="M476 30 H488 M482 24 V36" stroke="#d6b16d"/><path d="M27 174 H150" stroke="#9cb0c0" stroke-dasharray="4 6"/></g>
    <g transform="translate(17 13)"><rect width="112" height="23" rx="6" fill="#081725" fill-opacity=".72" stroke="#d6b16d" stroke-opacity=".23"/><text x="10" y="15" fill="#d8c28d" font-size="8.5" font-weight="700" letter-spacing="1.3">MYSTERY LOGIC</text></g>
    <g filter="url(#objectShadow)">${inner}</g>
    <rect width="520" height="205" fill="url(#vignette)" pointer-events="none"/>
  </svg></div>`;

  const mini=(x,y,dir,dot,strokes)=>{
    const rot={up:0,right:90,down:180,left:270}[dir]||0;
    const dots={tl:[12,12],tr:[53,12],br:[53,58],bl:[12,58]}; const [dx,dy]=dots[dot];
    let bars=''; for(let i=0;i<strokes;i++) bars+=`<line x1="${20+i*8}" y1="62" x2="${20+i*8}" y2="72" stroke="#9f783d" stroke-width="3" stroke-linecap="round"/>`;
    return `<g transform="translate(${x} ${y})"><rect width="65" height="80" rx="9" fill="url(#paper)" stroke="#cab483"/><g transform="translate(32.5 36) rotate(${rot})"><line x1="0" y1="13" x2="0" y2="-13" stroke="#172230" stroke-width="4" stroke-linecap="round"/><path d="M-7 -7 L0 -16 L7 -7" fill="none" stroke="#172230" stroke-width="4" stroke-linejoin="round"/></g><circle cx="${dx}" cy="${dy}" r="4" fill="#9f783d"/>${bars}</g>`;
  };

  const visuals={
    'quick:038':()=>frame(`${mini(38,62,'up','tl',1)}${mini(116,62,'right','tr',2)}${mini(194,62,'down','br',3)}${mini(272,62,'left','bl',1)}${mini(350,62,'up','tl',2)}<g transform="translate(428 62)"><rect width="65" height="80" rx="9" fill="none" stroke="#d6b16d" stroke-width="2" stroke-dasharray="7 5"/><text x="32" y="52" text-anchor="middle" fill="#e9d49d" font-size="30">?</text></g>`,'Три ритма'),
    'quick:039':()=>frame(`<g transform="translate(115 30)"><circle cx="120" cy="72" r="60" fill="#b98c45" stroke="#e6c77c" stroke-width="5"/><circle cx="120" cy="72" r="42" fill="#8d672f"/><path d="M120 45 L148 92 H92 Z" fill="none" stroke="#f5e6bf" stroke-width="6"/><circle cx="120" cy="72" r="8" fill="#0d2134"/></g><g transform="translate(330 48)"><path d="M35 10 C4 10 4 84 35 84 M82 10 C113 10 113 84 82 84" fill="none" stroke="#cbd8e4" stroke-width="18"/><rect x="24" y="0" width="22" height="28" rx="4" fill="#cf665f"/><rect x="72" y="0" width="22" height="28" rx="4" fill="#4e80bd"/><path d="M58 72 L58 103 M49 94 L58 106 L67 94" fill="none" stroke="#d6b16d" stroke-width="3"/></g>`,'Магнитный жетон'),
    'quick:040':()=>{
      let cells=''; const ox=70,oy=28,s=30;
      for(let r=0;r<5;r++)for(let c=0;c<5;c++)cells+=`<rect x="${ox+c*s}" y="${oy+r*s}" width="${s}" height="${s}" fill="${(r+c)%2?'#16314c':'#0d253b'}" stroke="#54708a"/>`;
      return frame(`${cells}<g transform="translate(${ox+2*s+s/2} ${oy+2*s+s/2})"><circle r="13" fill="#d6b16d"/><circle r="6" fill="#17314c"/><path d="M0 -28 L-8 -16 H8 Z" fill="#f1dfb1"/></g><g transform="translate(295 40)" fill="#dce6ed" font-size="15"><text x="0" y="0" font-weight="700">C3 · север</text><text x="0" y="34">↑↑  ↻  ↑  ↻  ↑↑</text><text x="0" y="75" fill="#9fb0c0">Где окажется робот?</text></g>`,'Маршрут робота');
    },
    'quick:041':()=>{
      const nums=[1,2,6,15,31,56,'?'],xs=[35,105,175,245,315,385,455];
      return frame(nums.map((n,i)=>`<g><circle cx="${xs[i]}" cy="92" r="25" fill="${i===6?'#2a4157':'#e5cf9d'}" stroke="#d6b16d" stroke-width="2"/><text x="${xs[i]}" y="100" text-anchor="middle" fill="${i===6?'#f2dfad':'#172230'}" font-size="19" font-weight="700">${n}</text></g>`).join('')+`<g fill="#d6b16d" font-size="13"><text x="70" y="145" text-anchor="middle">+1</text><text x="140" y="145" text-anchor="middle">+4</text><text x="210" y="145" text-anchor="middle">+9</text><text x="280" y="145" text-anchor="middle">+16</text><text x="350" y="145" text-anchor="middle">+25</text><text x="420" y="145" text-anchor="middle">+?</text></g>`,'Квадраты между числами');
    },
    'quick:042':()=>frame(`<g transform="translate(80 35) rotate(-5 130 65)"><rect width="250" height="130" rx="8" fill="#f0e5ca" stroke="#c9b486"/><path d="M38 38 C75 25 116 49 164 34 M43 58 C86 46 132 69 197 51 M39 81 C91 66 140 91 211 72 M72 102 C112 88 152 113 191 98" fill="none" stroke="#3a4350" stroke-width="4" stroke-linecap="round"/></g><g transform="translate(190 50) rotate(4 130 65)"><rect width="250" height="130" rx="8" fill="#e6dbc0" stroke="#b9a57a"/><path d="M38 38 C75 25 116 49 164 34 M43 58 C86 46 132 69 197 51 M39 81 C91 66 140 91 211 72 M72 102 C112 88 152 113 191 98" fill="none" stroke="#766e60" stroke-width="2.5" stroke-dasharray="3 3"/></g>`,'Следы без чернил'),
    'quick:043':()=>{
      const n={A:[80,102],B:[205,45],C:[205,158],D:[360,45],E:[360,158]},e=[['A','B'],['A','C'],['B','C'],['B','D'],['C','E'],['D','E']];
      const lines=e.map(([a,b])=>`<line x1="${n[a][0]}" y1="${n[a][1]}" x2="${n[b][0]}" y2="${n[b][1]}" stroke="#9db0c1" stroke-width="4"/>`).join('');
      const circles=Object.entries(n).map(([k,[x,y]])=>`<g><circle cx="${x}" cy="${y}" r="24" fill="#e4cf9d" stroke="#d6b16d" stroke-width="2"/><text x="${x}" y="${y+7}" text-anchor="middle" fill="#172230" font-size="19" font-weight="700">${k}</text></g>`).join('');
      return frame(lines+circles,'Пять комнат');
    },
    'quick:044':()=>frame(`<g stroke="#f1dfb1" stroke-width="6" stroke-linecap="round"><line x1="92" y1="58" x2="92" y2="124"/><line x1="180" y1="58" x2="180" y2="124"/><line x1="147" y1="91" x2="213" y2="91"/><line x1="355" y1="58" x2="355" y2="124"/><line x1="322" y1="91" x2="388" y2="91"/><line x1="421" y1="58" x2="487" y2="124"/></g><g fill="#d6b16d" font-size="31"><text x="124" y="101">+</text><text x="235" y="101">→</text><text x="403" y="101">+</text><text x="484" y="101">?</text></g><text x="260" y="165" text-anchor="middle" fill="#9fb0c0" font-size="14">Общие линии исчезают</text>`,'Исчезающие линии'),
    'quick:045':()=>{
      const vals=['K','M','4','7'],xs=[65,170,275,380];
      return frame(vals.map((v,i)=>`<g transform="translate(${xs[i]} 36) rotate(${i%2?-3:3} 42 62)"><rect width="84" height="124" rx="9" fill="#f1e5c9" stroke="#d6b16d" stroke-width="2"/><text x="42" y="75" text-anchor="middle" fill="#172230" font-size="36" font-family="Georgia" font-weight="700">${v}</text></g>`).join('')+`<path d="M70 178 H455" stroke="#9db0c1" stroke-width="2" stroke-dasharray="7 6"/><text x="260" y="198" text-anchor="middle" fill="#b6c4d1" font-size="13">Какие перевернуть?</text>`,'Какие карточки перевернуть');
    },
    'quick:046':()=>frame(`<g transform="translate(88 45)"><rect width="335" height="118" rx="18" fill="#273846" stroke="#71879b" stroke-width="3"/><rect x="38" y="26" width="258" height="58" rx="9" fill="#080e14" stroke="#d6b16d" stroke-width="2"/><text x="167" y="70" text-anchor="middle" fill="#f1d687" font-size="44" font-family="monospace" letter-spacing="10">8421</text><circle cx="310" cy="55" r="10" fill="#639873"/><text x="167" y="108" text-anchor="middle" fill="#adbdc9" font-size="13">12:00 → 13:00 · без изменения</text></g>`,'Счётчик не сдвинулся'),
    'quick:047':()=>frame(`<g transform="translate(75 25) rotate(-4 170 75)"><rect width="340" height="150" rx="8" fill="#efe3c8" stroke="#c6b181"/><path d="M170 0 V150" stroke="#b9a276" stroke-width="2" stroke-dasharray="7 6"/><circle cx="170" cy="75" r="52" fill="none" stroke="#7b4d2b" stroke-width="10" opacity=".82"/><path d="M178 27 C207 36 222 52 226 78" fill="none" stroke="#9a6845" stroke-width="4" opacity=".65"/></g><path d="M442 59 C478 67 491 99 475 127 C462 151 428 155 410 136" fill="none" stroke="#d6b16d" stroke-width="4"/><text x="456" y="101" text-anchor="middle" fill="#e9d9b5" font-size="13">след чашки</text>`,'Кофейный круг'),
    'quick:048':()=>frame(`<g transform="translate(95 25)"><polygon points="110,20 200,62 110,104 20,62" fill="#e6d2a4" stroke="#9b8358" stroke-width="3"/><polygon points="20,62 110,104 110,190 20,148" fill="#cdb888" stroke="#9b8358" stroke-width="3"/><polygon points="110,104 200,62 200,148 110,190" fill="#f1e2bc" stroke="#9b8358" stroke-width="3"/><text x="110" y="70" text-anchor="middle" fill="#172230" font-size="27" font-weight="700">1</text><text x="64" y="139" text-anchor="middle" fill="#172230" font-size="25" font-weight="700">4</text><text x="154" y="139" text-anchor="middle" fill="#172230" font-size="25" font-weight="700">3</text></g><g transform="translate(335 56)" fill="#e7d4a2"><text x="0" y="0" font-size="15" font-weight="700">E → N ↑ N ↑ W ←</text><text x="0" y="42" font-size="13" fill="#aebdcc">Что окажется сверху?</text></g>`,'Куб в коридоре'),
    'quick:049':()=>{
      const boxes=['A','B','C','D'].map((k,i)=>`<g transform="translate(${34+i*92} 67)"><rect width="72" height="65" rx="7" fill="#ba874a" stroke="#e0bd78" stroke-width="2"/><path d="M0 18 H72" stroke="#81592f" stroke-width="2"/><circle cx="18" cy="8" r="6" fill="#d6b16d"/><circle cx="35" cy="10" r="6" fill="#d6b16d"/><circle cx="52" cy="8" r="6" fill="#d6b16d"/><text x="36" y="52" text-anchor="middle" fill="#172230" font-size="21" font-weight="700">${k}</text></g>`).join('');
      return frame(boxes+`<g transform="translate(414 48)"><rect width="78" height="92" rx="12" fill="#273846" stroke="#8ca0b2" stroke-width="2"/><rect x="14" y="18" width="50" height="25" rx="4" fill="#d5ead1"/><text x="39" y="36" text-anchor="middle" fill="#23402d" font-family="monospace" font-size="14">?.?g</text><rect x="17" y="52" width="44" height="8" rx="4" fill="#1b2833"/><circle cx="27" cy="74" r="5" fill="#d6b16d"/><circle cx="51" cy="74" r="5" fill="#7890a5"/></g><text x="260" y="174" text-anchor="middle" fill="#b5c2ce" font-size="13">Одно взвешивание. Восемь состояний.</text>`,'Одно взвешивание');
    }
  };

  function renderAll(root=document){
    root.querySelectorAll('[data-puzzle-visual]').forEach((node)=>{
      const id=String(node.dataset.puzzleVisual||'');
      const render=visuals[id];
      if(!render){ node.hidden=true; return; }
      node.hidden=false;
      node.innerHTML=render();
    });
  }

  window.MysteryLogicPuzzleVisuals={renderAll,has:(id)=>Boolean(visuals[id])};
})();