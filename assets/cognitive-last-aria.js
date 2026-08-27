(() => {
  'use strict';

  const root = document.querySelector('[data-casearia-app]');
  if (!root) return;

  const ensureStyle = () => {
    if (document.querySelector('[data-cognitive-aria-style]')) return;
    const style = document.createElement('style');
    style.dataset.cognitiveAriaStyle = '1';
    style.textContent = `
      .casearia-code-guide{grid-column:1/-1;margin-top:12px;padding:0;border:1px solid rgba(211,174,97,.28);border-radius:14px;background:rgba(10,12,17,.78);overflow:hidden}
      .casearia-code-guide summary{padding:12px 14px;cursor:pointer;color:#ead6a6;font-weight:800}.casearia-code-guide[open] summary{border-bottom:1px solid rgba(255,255,255,.07)}
      .casearia-code-guide div{padding:12px 14px;color:#bcc3ca;font-size:.86rem;line-height:1.52}.casearia-code-guide p{margin:0 0 7px}.casearia-code-guide p:last-child{margin-bottom:0}.casearia-code-guide b{color:#ead6a6}
    `;
    document.head.appendChild(style);
  };

  const html = `
    <details class="casearia-code-guide" data-cognitive-aria-guide>
      <summary>Что означают служебные коды</summary>
      <div>
        <p><strong>Запоминайте предмет и смысл, а не буквенный код.</strong> Код нужен только для точной сверки с напарником.</p>
        <p><b>PR‑17</b> — бутафорский кинжал; <b>BR‑06</b> — латунный ограничитель, найденный внутри него.</p>
        <p><b>Q‑17B</b> — световая команда blackout; <b>K‑12</b> — профиль механического ключа нотного архива.</p>
        <p><b>MIC‑C</b> — живой микрофон дирижёра; <b>PB‑2</b> — линия воспроизведения заранее записанного материала.</p>
        <p><b>HEEL‑43C / CRESCENT‑43</b> — маркеры следа и ремонта обуви.</p>
        <p><b>T‑6M</b> — личный дирижёрский кофр; <b>MS‑1908</b> — музейная метка оригинальной партитуры.</p>
      </div>
    </details>`;

  const ensureGuide = () => {
    const brief = root.querySelector('.casearia-brief');
    if (!brief || brief.querySelector('[data-cognitive-aria-guide]')) return;
    brief.insertAdjacentHTML('beforeend', html);
  };

  let scheduled = false;
  const apply = () => {
    scheduled = false;
    ensureStyle();
    ensureGuide();
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(apply);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  apply();
})();
