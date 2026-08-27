(() => {
  'use strict';

  const root = document.querySelector('[data-case407-app]');
  if (!root) return;

  const ensureStyle = () => {
    if (document.querySelector('[data-cognitive-407-style]')) return;
    const style = document.createElement('style');
    style.dataset.cognitive407Style = '1';
    style.textContent = `
      .case407-code-guide{margin:16px 0;padding:0;border:1px solid rgba(212,176,96,.26);border-radius:14px;background:rgba(7,14,20,.78);overflow:hidden}
      .case407-code-guide summary{padding:13px 15px;cursor:pointer;color:#ead7a5;font-weight:800}.case407-code-guide[open] summary{border-bottom:1px solid rgba(255,255,255,.07)}
      .case407-code-guide div{padding:13px 15px;color:#b9c3ca;font-size:.88rem;line-height:1.55}.case407-code-guide b{color:#ead7a5}.case407-code-guide p{margin:0 0 8px}.case407-code-guide p:last-child{margin-bottom:0}
      .case407-memory-recall{margin:10px 0 14px;padding:11px 13px;border-left:3px solid rgba(216,178,91,.72);border-radius:8px;background:rgba(216,178,91,.075);color:#cbd3d8;font-size:.86rem;line-height:1.5}.case407-memory-recall strong{color:#ead7a5}
    `;
    document.head.appendChild(style);
  };

  const guide = `
    <details class="case407-code-guide" data-cognitive-code-guide>
      <summary>Как читать технические обозначения</summary>
      <div>
        <p><strong>Не запоминайте коды отдельно.</strong> Они нужны для точной сверки с напарником; ориентируйтесь прежде всего на смысл объекта.</p>
        <p><b>H‑…</b> — маркировка таблички; <b>L‑…</b> — электроника дверного замка; <b>S‑407</b> — сейф.</p>
        <p><b>WEST‑4</b> — гостевая Wi‑Fi зона; <b>STAFF‑4</b> — служебная зона; <b>LOADING‑B1</b> — погрузочная зона.</p>
        <p><b>SVC‑407</b> — служебная дверь; <b>HK‑44</b> — мастер‑токен; <b>ER‑02</b> — служебный телефон Елены.</p>
      </div>
    </details>`;

  const ensureGuide = () => {
    if (root.querySelector('[data-cognitive-code-guide]')) return;
    const brief = root.querySelector('.case2317-brief');
    if (brief) brief.insertAdjacentHTML('beforeend', guide);
  };

  const ensureCartRecall = () => {
    for (const card of root.querySelectorAll('.case2317-evidence')) {
      const heading = card.querySelector('h3')?.textContent || '';
      if (!/Тележка №6/i.test(heading) || card.querySelector('[data-cognitive-cart-recall]')) continue;
      const first = card.querySelector('p');
      if (!first) continue;
      first.insertAdjacentHTML('beforebegin', '<div class="case407-memory-recall" data-cognitive-cart-recall><strong>Напоминание из предыдущего этапа.</strong> Ночная горничная Нина Круглова видела эту бельевую тележку около 01:05 у служебной зоны четвёртого этажа и отмечала, что ночью её там обычно не оставляют.</div>');
    }
  };

  let scheduled = false;
  const apply = () => {
    scheduled = false;
    ensureStyle();
    ensureGuide();
    ensureCartRecall();
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
