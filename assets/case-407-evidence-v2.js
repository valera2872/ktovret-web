(() => {
  'use strict';

  const root = document.querySelector('[data-case407-app]');
  if (!root) return;

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const direct = (card, selector) => [...card.children].filter((node) => node.matches?.(selector));
  const lines = (card) => direct(card, ':scope > p').map((node) => node.textContent.trim()).filter(Boolean);
  const timeSplit = (text) => {
    const match = text.match(/^(\d{2}:\d{2}(?::\d{2})?)\s*[—–-]\s*(.+)$/);
    return match ? [match[1], match[2]] : ['', text];
  };
  const header = (kind, code = 'ML-0407') => `<div class="case407-artifact-head"><span>${esc(kind)}</span><b>${esc(code)}</b></div>`;
  const tagOf = (card) => card.querySelector(':scope > .tag')?.textContent.trim().toLowerCase() || '';
  const titleOf = (card) => card.querySelector(':scope > h3')?.textContent.trim() || '';

  const statementArtifact = (title, materialLines, tag) => `
    <div class="case407-artifact case407-paper case407-statement">
      ${header('ПРОТОКОЛ ОПРОСА', 'FORM 12-B')}
      <div class="case407-paper-title"><small>${esc(tag)}</small><strong>${esc(title)}</strong></div>
      <div class="case407-transcript">${materialLines.map((line, i) => `<div><span>${String(i + 1).padStart(2, '0')}</span><p>${esc(line.replace(/^«|»$/g, ''))}</p></div>`).join('')}</div>
      <div class="case407-signature"><span>ПОДПИСЬ ОПРАШИВАЕМОГО</span><i></i><b>протокол зафиксирован</b></div>
    </div>`;

  const plaqueArtifact = () => `
    <div class="case407-artifact case407-plaque-board">
      ${header('ОСМОТР ДВЕРИ', 'EVIDENCE D-04')}
      <div class="case407-plaque-grid">
        <div class="case407-plaque-front"><small>ЛИЦЕВАЯ СТОРОНА</small><strong>407</strong><span class="screw a"></span><span class="screw b"></span></div>
        <div class="case407-plaque-back"><small>ОБОРОТНАЯ СТОРОНА</small><div class="case407-scratch"></div><strong>H-409</strong><em>ЗАВОДСКАЯ МАРКИРОВКА</em><span class="case407-toolmark">свежие следы инструмента</span></div>
      </div>
      <div class="case407-measure"><span>монтажный край</span><i></i><b>слой пыли нарушен</b></div>
    </div>`;

  const logArtifact = (title, materialLines, tag) => {
    const rows = materialLines.map((line, i) => {
      const [time, rest] = timeSplit(line);
      const ids = rest.match(/\b(?:L|S|SVC|HK|WEST|STAFF|LOADING|ER|NIGHT)[-A-Z0-9]+\b/g) || [];
      let safe = esc(rest);
      ids.forEach((id) => { safe = safe.replaceAll(esc(id), `<mark>${esc(id)}</mark>`); });
      return `<div class="case407-log-row"><span>${esc(time || `#${String(i + 1).padStart(2, '0')}`)}</span><code>${safe}</code></div>`;
    }).join('');
    return `<div class="case407-artifact case407-terminal">${header(tag.toUpperCase(), 'ЗАЩИЩЁННЫЙ ЭКСПОРТ')}<div class="case407-terminal-bar"><i></i><i></i><i></i><span>MEYER / SECURITY CORE</span></div><h4>${esc(title)}</h4><div class="case407-log-table">${rows}</div><div class="case407-terminal-foot">контрольная сумма проверена · только чтение</div></div>`;
  };

  const cctvArtifact = (materialLines) => {
    const events = materialLines.slice(0, 3).map((line, i) => {
      const [time, rest] = timeSplit(line);
      return `<div class="case407-cctv-frame"><div class="case407-cctv-scene"><span class="door d1">407</span><span class="door d2">409</span><i class="figure f${i + 1}"></i></div><div class="case407-cctv-meta"><b>${esc(time || ['00:52:18','00:54:03','01:16:00'][i])}</b><span>${esc(rest.slice(0, 80))}</span></div></div>`;
    }).join('');
    return `<div class="case407-artifact case407-cctv">${header('КАМЕРА C4 / ЭТАЖ 4', 'АРХИВНАЯ КОПИЯ')}<div class="case407-cctv-strip">${events}</div><div class="case407-cctv-timeline"><span></span><span></span><span></span><b>непрерывная запись</b></div></div>`;
  };

  const registryArtifact = () => `
    <div class="case407-artifact case407-registry">
      ${header('РЕЕСТР ОБОРУДОВАНИЯ', 'АРХИВ 2019')}
      <div class="case407-registry-title">HOTEL MEYER · FLOOR 4 / DOOR HARDWARE</div>
      <div class="case407-registry-row head"><span>PHY NODE</span><span>LOCK ID</span><span>PLAQUE LOT</span><span>GUEST LABEL</span></div>
      <div class="case407-registry-row"><b>407</b><code>L-407</code><code>LOOKUP</code><span>редактируемое поле</span></div>
      <div class="case407-registry-row focus"><b>409</b><code>L-409</code><code>LOOKUP</code><span>редактируемое поле</span></div>
      <div class="case407-registry-note">Для сверки PLAQUE LOT нужен заводской H-код с самой физической таблички. В этом экспорте H-коды не раскрыты.</div>
    </div>`;

  const planArtifact = () => `
    <div class="case407-artifact case407-floorplan">
      ${header('АРХИВНЫЙ ПЛАН ЭТАЖА', 'REV. 1998 / СЛУЖЕБНОЕ')}
      <div class="case407-plan-canvas">
        <div class="case407-plan-corridor">ГОСТЕВОЙ КОРИДОР</div>
        <div class="case407-room r405"><b>405</b><span>guest room</span></div>
        <div class="case407-room r407"><b>407</b><span>former suite wing</span><i class="case407-hidden-door"></i></div>
        <div class="case407-room r409"><b>409</b><span>added 2007</span></div>
        <div class="case407-service">HOUSEKEEPING / SERVICE VOID</div>
        <div class="case407-shaft">VENT<br>SHAFT</div>
        <span class="case407-plan-note">исторический дверной проём</span>
      </div>
      <div class="case407-plan-legend"><span><i class="solid"></i>гостевая стена</span><span><i class="dash"></i>служебный контур</span><span><i class="gold"></i>исторический проём</span></div>
    </div>`;

  const labArtifact = (isCart, materialLines) => `
    <div class="case407-artifact case407-lab">
      ${header('ЛАБОРАТОРНАЯ КАРТА', 'FORENSICS / ML-0407')}
      <div class="case407-lab-grid"><div class="case407-lab-sample"><i></i><i></i><i></i><strong>${isCart ? 'BR-220' : 'SAMPLE A/B'}</strong><span>${isCart ? 'синие волокна / ювелирный воск' : 'край чашки / ручка / поверхность'}</span></div><div class="case407-lab-data">${materialLines.slice(0, 3).map((line, i) => `<div><small>OBS-${i + 1}</small><p>${esc(line)}</p></div>`).join('')}</div></div>
      <div class="case407-lab-footer"><span>цепочка хранения: без нарушений</span><b>ПРОВЕРЕНО</b></div>
    </div>`;

  const manualArtifact = () => `
    <div class="case407-artifact case407-manual">
      ${header('ЭЛЕКТРОННЫЙ СЕЙФ S-400', 'ИНСТРУКЦИЯ · §7.4')}
      <div class="case407-manual-page"><div class="case407-manual-copy"><h4>Открытие в режиме принуждения</h4><p>Введите персональный код хранителя. Для открытия с тихим сигналом добавьте дополнительную цифру после корректного кода.</p><div class="case407-code-line"><span>ВЕРНЫЙ КОД</span><b>••••••</b><i>+</i><strong>9</strong></div><p class="case407-warning">Замок открывается штатно. Сигнал передаётся на пульт без локальной индикации.</p></div><div class="case407-manual-margin"><span>ИНСТРУКТАЖ</span><b>M. ORLOVA</b><em>6 недель назад</em></div></div>
    </div>`;

  const wearableArtifact = () => `
    <div class="case407-artifact case407-network">
      ${header('WI-FI ASSOCIATION TRACE', 'СОПОСТАВЛЕНИЕ УСТРОЙСТВ')}
      <div class="case407-network-grid"><div class="case407-device phone"><span>ТЕЛЕФОН</span><b>WEST-4</b><small>00:54 → 03:08</small></div><div class="case407-device watch"><span>ЧАСЫ</span><b>WEST-4</b><small>00:54</small></div><i class="arrow"></i><div class="case407-node"><b>STAFF-4</b><small>01:16</small></div><i class="arrow"></i><div class="case407-node hot"><b>LOADING-B1</b><small>01:19</small></div></div>
      <div class="case407-network-foot"><span>телефон неподвижен</span><b>часы продолжают путь</b><em>OFFLINE 01:27</em></div>
    </div>`;

  const serviceMapArtifact = (materialLines) => `
    <div class="case407-artifact case407-request-export">
      ${header('КАРТА СЛУЖЕБНОЙ СЕТИ', 'ОГРАНИЧЕННЫЕ ДАННЫЕ')}
      <div class="case407-request-grid">${materialLines.slice(0, 3).map((line, i) => `<div><span>${['STAFF-4','LOADING-B1','ROUTE'][i]}</span><p>${esc(line)}</p><b>${['ZONE','ZONE','UNKNOWN'][i]}</b></div>`).join('')}</div>
      <div class="case407-redaction"><span>door IDs</span><i>████████</i><span>token</span><i>██████</i><b>маршрут не определён</b></div>
    </div>`;

  const auditArtifact = () => `
    <div class="case407-artifact case407-audit">
      ${header('ВНУТРЕННЯЯ СВЕРКА', 'НАЗНАЧЕНО 08:30')}
      <div class="case407-audit-title"><span>Ювелирный учёт / ночная касса</span><strong>31 800 €</strong></div>
      <div class="case407-audit-row head"><span>ОПЕРАЦИЯ</span><span>ХРАНИТЕЛЬ</span><span>НОЧНОЙ МЕНЕДЖЕР</span><span>СТАТУС</span></div>
      <div class="case407-audit-row"><span>TEMP-17</span><b>M. ORLOVA</b><b>E. RAEVA</b><em>не сведено</em></div>
      <div class="case407-audit-row"><span>TEMP-21</span><b>M. ORLOVA</b><b>E. RAEVA</b><em>не сведено</em></div>
      <div class="case407-audit-row"><span>TEMP-24</span><b>M. ORLOVA</b><b>E. RAEVA</b><em>не сведено</em></div>
      <div class="case407-ticket"><span>06:40 · BELGRADE</span><b>MARTA ORLOVA</b><b>ELENA RAEVA</b><em>2 пассажира · куплено за 3 дня</em></div>
    </div>`;

  const alibiArtifact = () => `
    <div class="case407-artifact case407-alibi">
      ${header('ПРОВЕРКА МАРШРУТА', 'D. LEVIN')}
      <div class="case407-alibi-line"><div><b>00:36</b><span>ОТЕЛЬ</span><small>такси</small></div><i></i><div><b>00:43</b><span>ПЕРЕКРЁСТОК A</span><small>камера</small></div><i></i><div><b>00:51</b><span>ПЕРЕКРЁСТОК B</span><small>камера</small></div><i></i><div><b>00:58</b><span>ДОМ</span><small>домофон</small></div></div>
      <div class="case407-alibi-verdict"><strong>НЕПРЕРЫВНАЯ ЦЕПОЧКА</strong><span>до 07:10 выход не зафиксирован</span></div>
    </div>`;

  const accessCameraArtifact = () => `
    <div class="case407-artifact case407-access">
      ${header('СЛУЖЕБНЫЙ ДОСТУП + CAM B1', 'ПРИОРИТЕТНЫЙ ЭКСПОРТ')}
      <div class="case407-access-token"><span>МАСТЕР-ТОКЕН</span><strong>HK-44</strong><small>штатно выдан: E. RAEVA</small></div>
      <div class="case407-access-path"><div><span>01:14:26</span><b>SVC-407</b><small>HK-44</small></div><i></i><div><span>01:15:02</span><b>SERVICE LIFT</b><small>HK-44</small></div><i></i><div><span>01:18:41</span><b>LOADING-B1</b><small>HK-44</small></div></div>
      <div class="case407-cctv case407-access-camera"><div class="case407-cctv-strip"><div class="case407-cctv-frame"><div class="case407-cctv-scene is-b1"><i class="figure f1"></i></div><div class="case407-cctv-meta"><b>01:17:42</b><span>камера активна · виден край тележки</span></div></div><div class="case407-cctv-frame"><div class="case407-cctv-scene is-b1"><b class="case407-gap">NO SIGNAL<br>94 SEC</b></div><div class="case407-cctv-meta"><b>01:17:43</b><span>NIGHT-MGR / ER-02 · maintenance</span></div></div><div class="case407-cctv-frame"><div class="case407-cctv-scene is-b1"><i class="figure f3"></i></div><div class="case407-cctv-meta"><b>01:19:17</b><span>запись восстановлена · тележки нет</span></div></div></div></div>
      <div class="case407-access-note">Журнал доступа фиксирует токен, а не личность носителя. Отключение камеры записано отдельным системным событием.</div>
    </div>`;

  const telemetryArtifact = () => `
    <div class="case407-artifact case407-car">
      ${header('ТЕЛЕМАТИКА АВТОМОБИЛЯ', 'ER-02 / PARKING B1')}
      <div class="case407-car-dash"><div><small>ЦИФРОВОЙ КЛЮЧ</small><strong>ER-02</strong><span>01:20 · unlock</span></div><div><small>ПАССАЖИР</small><strong>ЗАНЯТО</strong><span>01:20 → 01:31</span></div><div><small>ШЛАГБАУМ</small><strong>01:26</strong><span>служебный выезд</span></div></div>
      <div class="case407-road"><span>HOTEL B1</span><i></i><span>ГОРОДСКАЯ КАМЕРА 01:31</span><i></i><b>АЭРОПОРТ →</b></div>
    </div>`;

  const chatArtifact = (card) => {
    const messages = [...card.querySelectorAll(':scope > .case2317-messages .case2317-message')].map((node) => {
      const name = node.querySelector('b')?.textContent.trim() || '';
      const full = node.textContent.trim();
      return [name, full.slice(name.length).trim()];
    });
    return `<div class="case407-artifact case407-chat">${header('ВОССТАНОВЛЕННЫЙ ЧЕРНОВИК', 'ЧАСТИЧНЫЙ ИНДЕКС')}<div class="case407-phone"><div class="case407-phone-top"><span>01:35</span><b>удалённая ветка</b><i>42%</i></div><div class="case407-chat-body">${messages.map(([name, text], i) => `<div class="bubble ${i % 2 ? 'right' : 'left'}"><small>${esc(name)}</small><p>${esc(text)}</p></div>`).join('')}<div class="case407-deleted">часть текста не восстановлена</div></div></div></div>`;
  };

  const defaultArtifact = (title, materialLines, tag) => `<div class="case407-artifact case407-paper case407-generic">${header(tag.toUpperCase(), 'МАТЕРИАЛ ДЕЛА')}<h4>${esc(title)}</h4>${materialLines.map((line) => `<p>${esc(line)}</p>`).join('')}</div>`;

  const buildArtifact = (card) => {
    const tag = tagOf(card);
    const title = titleOf(card);
    const materialLines = lines(card);
    if (tag.includes('первичный рапорт') || tag.includes('опрос персонала')) return statementArtifact(title, materialLines, card.querySelector(':scope > .tag')?.textContent.trim() || '');
    if (tag.includes('осмотр двери')) return plaqueArtifact();
    if (tag.includes('фрагмент журнала замков')) return logArtifact(title, materialLines, card.querySelector(':scope > .tag')?.textContent.trim() || '');
    if (tag.includes('камера c4')) return cctvArtifact(materialLines);
    if (tag.includes('реестр оборудования')) return registryArtifact();
    if (tag.includes('архивный план')) return planArtifact();
    if (tag.includes('чай и стекло')) return labArtifact(false, materialLines);
    if (tag.includes('инструкция сейфа')) return manualArtifact();
    if (tag.includes('сеть носимых устройств')) return wearableArtifact();
    if (tag.includes('карта служебной сети')) return serviceMapArtifact(materialLines);
    if (tag.includes('бельевая тележка')) return labArtifact(true, materialLines);
    if (tag.includes('внутренняя проверка')) return auditArtifact();
    if (tag.includes('проверка подозреваемого')) return alibiArtifact();
    if (tag.includes('служебный доступ')) return accessCameraArtifact();
    if (tag.includes('телематика автомобиля')) return telemetryArtifact();
    if (tag.includes('удалённый черновик')) return chatArtifact(card);
    return defaultArtifact(title, materialLines, card.querySelector(':scope > .tag')?.textContent.trim() || '');
  };

  const collapseInterpretation = (card) => {
    if (card.querySelector(':scope > .case407-evidence-notes')) return;
    const paragraphs = direct(card, ':scope > p');
    const factsNode = card.querySelector(':scope > .case2317-facts');
    const stampNode = card.querySelector(':scope > .case2317-stamp');
    if (!paragraphs.length && !factsNode && !stampNode) return;
    const details = document.createElement('details');
    details.className = 'case407-evidence-notes';
    const summary = document.createElement('summary');
    summary.textContent = 'Расшифровка материала';
    details.appendChild(summary);
    paragraphs.forEach((node) => details.appendChild(node));
    if (factsNode) details.appendChild(factsNode);
    if (stampNode) details.appendChild(stampNode);
    card.appendChild(details);
  };

  const enhance = (card) => {
    if (!(card instanceof HTMLElement) || card.dataset.evidenceArtifact === '1') return;
    card.dataset.evidenceArtifact = '1';
    if (!card.classList.contains('has-photo')) {
      const artifact = buildArtifact(card);
      const title = card.querySelector(':scope > h3');
      if (artifact && title) title.insertAdjacentHTML('afterend', artifact);
    }
    collapseInterpretation(card);
    card.classList.add('case407-materialized');
  };

  const scan = () => root.querySelectorAll('.case2317-evidence').forEach(enhance);
  new MutationObserver(scan).observe(root, { childList: true, subtree: true });
  scan();
})();