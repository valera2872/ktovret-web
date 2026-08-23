(() => {
  'use strict';

  const root = document.querySelector('[data-case407-app]');
  if (!root) return;

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const direct = (card, selector) => [...card.children].filter((node) => node.matches?.(selector));
  const textList = (card, selector) => direct(card, selector).map((node) => node.textContent.trim()).filter(Boolean);
  const facts = (card) => [...card.querySelectorAll(':scope > .case2317-facts span')].map((node) => node.textContent.trim()).filter(Boolean);
  const timeSplit = (text) => {
    const match = text.match(/^(\d{2}:\d{2}(?::\d{2})?)\s*[—–-]\s*(.+)$/);
    return match ? [match[1], match[2]] : ['', text];
  };
  const documentHeader = (kind, code = 'ML-0407') => `<div class="case407-artifact-head"><span>${esc(kind)}</span><b>${esc(code)}</b></div>`;

  const statementArtifact = (title, lines, tag) => `
    <div class="case407-artifact case407-paper case407-statement">
      ${documentHeader('ПРОТОКОЛ ОПРОСА', 'FORM 12-B')}
      <div class="case407-paper-title"><small>${esc(tag)}</small><strong>${esc(title)}</strong></div>
      <div class="case407-transcript">${lines.map((line, index) => `<div><span>${String(index + 1).padStart(2, '0')}</span><p>${esc(line.replace(/^«|»$/g, ''))}</p></div>`).join('')}</div>
      <div class="case407-signature"><span>ПОДПИСЬ ОПРАШИВАЕМОГО</span><i></i><b>зафиксировано цифровой системой</b></div>
    </div>`;

  const plaqueArtifact = () => `
    <div class="case407-artifact case407-plaque-board">
      ${documentHeader('ОСМОТР ДВЕРИ', 'EVIDENCE D-04')}
      <div class="case407-plaque-grid">
        <div class="case407-plaque-front"><small>ЛИЦЕВАЯ СТОРОНА</small><strong>407</strong><span class="screw a"></span><span class="screw b"></span></div>
        <div class="case407-plaque-back"><small>ОБОРОТНАЯ СТОРОНА</small><div class="case407-scratch"></div><strong>H-409</strong><em>FACTORY / LOT 2019</em><span class="case407-toolmark">свежие следы инструмента</span></div>
      </div>
      <div class="case407-measure"><span>монтажный край</span><i></i><b>след пыли нарушен</b></div>
    </div>`;

  const logArtifact = (title, lines, tag) => {
    const rows = lines.map((line, index) => {
      const [time, rest] = timeSplit(line);
      const ids = rest.match(/\b(?:L|S|SVC|HK|WEST|STAFF|LOADING|ER|NIGHT)[-A-Z0-9]+\b/g) || [];
      let safe = esc(rest);
      ids.forEach((id) => { safe = safe.replaceAll(esc(id), `<mark>${esc(id)}</mark>`); });
      return `<div class="case407-log-row"><span>${esc(time || `#${String(index + 1).padStart(2, '0')}`)}</span><code>${safe}</code></div>`;
    }).join('');
    return `<div class="case407-artifact case407-terminal">${documentHeader(tag.toUpperCase(), 'SECURE EXPORT')}<div class="case407-terminal-bar"><i></i><i></i><i></i><span>MEYER / SECURITY CORE</span></div><h4>${esc(title)}</h4><div class="case407-log-table">${rows}</div><div class="case407-terminal-foot">checksum verified · read only</div></div>`;
  };

  const cctvArtifact = (lines, basement = false) => {
    const events = lines.slice(0, 3).map((line, index) => {
      const [time, rest] = timeSplit(line);
      return `<div class="case407-cctv-frame"><div class="case407-cctv-scene ${basement ? 'is-b1' : ''}"><span class="door d1">407</span><span class="door d2">409</span><i class="figure f${index + 1}"></i>${basement && index === 1 ? '<b class="case407-gap">NO SIGNAL<br>94 SEC</b>' : ''}</div><div class="case407-cctv-meta"><b>${esc(time || ['00:52:18','00:54:03','01:16:00'][index])}</b><span>${esc(rest.slice(0, 72))}</span></div></div>`;
    }).join('');
    return `<div class="case407-artifact case407-cctv">${documentHeader(basement ? 'CAM B1 / SERVICE' : 'CAM C4 / FLOOR 4', basement ? 'RECOVERY COPY' : 'ARCHIVE COPY')}<div class="case407-cctv-strip">${events}</div><div class="case407-cctv-timeline"><span></span><span></span><span></span><b>${basement ? 'служебная зона' : 'непрерывная запись'}</b></div></div>`;
  };

  const registryArtifact = () => `
    <div class="case407-artifact case407-registry">
      ${documentHeader('РЕЕСТР ОБОРУДОВАНИЯ', 'ARCHIVE 2019')}
      <div class="case407-registry-title">HOTEL MEYER · FLOOR 4 / DOOR HARDWARE</div>
      <div class="case407-registry-row head"><span>PHY NODE</span><span>LOCK ID</span><span>PLAQUE LOT</span><span>GUEST LABEL</span></div>
      <div class="case407-registry-row"><b>407</b><code>L-407</code><code class="blurred">H-???</code><span>редактируемое поле</span></div>
      <div class="case407-registry-row focus"><b>409</b><code>L-409</code><code>H-409</code><span>редактируемое поле</span></div>
      <div class="case407-registry-note">Физические ID контроллеров не менялись после ремонта. Гостевая надпись хранится отдельно.</div>
    </div>`;

  const planArtifact = () => `
    <div class="case407-artifact case407-floorplan">
      ${documentHeader('АРХИВНЫЙ ПЛАН ЭТАЖА', 'REV. 1998 / NOT FOR GUESTS')}
      <div class="case407-plan-canvas">
        <div class="case407-plan-corridor">ГОСТЕВОЙ КОРИДОР</div>
        <div class="case407-room r405"><b>405</b><span>guest room</span></div>
        <div class="case407-room r407"><b>407</b><span>former suite wing</span><i class="case407-hidden-door"></i></div>
        <div class="case407-room r409"><b>409</b><span>added 2007</span></div>
        <div class="case407-service">HOUSEKEEPING / SERVICE VOID</div>
        <div class="case407-shaft">VENT<br>SHAFT</div>
        <span class="case407-plan-note">скрытая дверь в старом контуре</span>
      </div>
      <div class="case407-plan-legend"><span><i class="solid"></i>гостевая стена</span><span><i class="dash"></i>служебный контур</span><span><i class="gold"></i>историческая дверь</span></div>
    </div>`;

  const labArtifact = (title, lines) => `
    <div class="case407-artifact case407-lab">
      ${documentHeader('ЛАБОРАТОРНАЯ КАРТА', 'FORENSICS / ML-0407')}
      <div class="case407-lab-grid"><div class="case407-lab-sample"><i></i><i></i><i></i><strong>${title.includes('тележк') ? 'BR-220' : 'SAMPLE A/B'}</strong><span>${title.includes('тележк') ? 'blue wool + jewelry wax' : 'cup rim / handle / surface'}</span></div><div class="case407-lab-data">${lines.slice(0, 3).map((line, i) => `<div><small>OBS-${i + 1}</small><p>${esc(line)}</p></div>`).join('')}</div></div>
      <div class="case407-lab-footer"><span>chain of custody: intact</span><b>VERIFIED</b></div>
    </div>`;

  const manualArtifact = () => `
    <div class="case407-artifact case407-manual">
      ${documentHeader('S-400 ELECTRONIC SAFE', 'OPERATOR MANUAL · §7.4')}
      <div class="case407-manual-page"><div class="case407-manual-copy"><h4>Duress opening procedure</h4><p>Введите персональный код хранителя. Для открытия в режиме принуждения добавьте дополнительную цифру после корректного кода.</p><div class="case407-code-line"><span>VALID CODE</span><b>••••••</b><i>+</i><strong>9</strong></div><p class="case407-warning">Замок открывается штатно. Сигнал тревоги передаётся на пульт без локальной индикации.</p></div><div class="case407-manual-margin"><span>TRAINING</span><b>M. ORLOVA</b><em>06 weeks ago</em></div></div>
    </div>`;

  const networkArtifact = () => `
    <div class="case407-artifact case407-network">
      ${documentHeader('WI-FI ASSOCIATION TRACE', 'DEVICE CORRELATION')}
      <div class="case407-network-grid"><div class="case407-device phone"><span>PHONE</span><b>WEST-4</b><small>00:54 → 03:08</small></div><div class="case407-device watch"><span>WATCH</span><b>WEST-4</b><small>00:54</small></div><i class="arrow"></i><div class="case407-node"><b>STAFF-4</b><small>01:16</small></div><i class="arrow"></i><div class="case407-node hot"><b>LOADING-B1</b><small>01:19</small></div></div>
      <div class="case407-network-foot"><span>phone stationary</span><b>wearable path continues</b><em>OFFLINE 01:27</em></div>
    </div>`;

  const preliminaryArtifact = (lines) => `
    <div class="case407-artifact case407-request-export">
      ${documentHeader('ПРЕДВАРИТЕЛЬНЫЙ ЭКСПОРТ', 'LIMITED SCOPE')}
      <div class="case407-request-grid">${lines.slice(0, 3).map((line, i) => `<div><span>${['01:14','01:16','01:19'][i] || `0${i + 1}`}</span><p>${esc(line)}</p><b>${i === 0 ? 'EVENT' : i === 1 ? 'VERTICAL' : 'ZONE'}</b></div>`).join('')}</div>
      <div class="case407-redaction"><span>door IDs</span><i>████████</i><span>token</span><i>██████</i><b>requires priority request</b></div>
    </div>`;

  const auditArtifact = () => `
    <div class="case407-artifact case407-audit">
      ${documentHeader('ВНУТРЕННЯЯ СВЕРКА', 'SCHEDULED 08:30')}
      <div class="case407-audit-title"><span>Jewelry / night cash cross-check</span><strong>31 800 €</strong></div>
      <div class="case407-audit-row head"><span>OPERATION</span><span>CUSTODIAN</span><span>NIGHT MGR</span><span>STATUS</span></div>
      <div class="case407-audit-row"><span>TEMP-17</span><b>M. ORLOVA</b><b>E. RAEVA</b><em>unreconciled</em></div>
      <div class="case407-audit-row"><span>TEMP-21</span><b>M. ORLOVA</b><b>E. RAEVA</b><em>unreconciled</em></div>
      <div class="case407-audit-row"><span>TEMP-24</span><b>M. ORLOVA</b><b>E. RAEVA</b><em>unreconciled</em></div>
      <div class="case407-ticket"><span>06:40 · BELGRADE</span><b>MARTA ORLOVA</b><b>ELENA RAEVA</b><em>2 passengers / purchased 3 days earlier</em></div>
    </div>`;

  const alibiArtifact = () => `
    <div class="case407-artifact case407-alibi">
      ${documentHeader('ПРОВЕРКА АЛИБИ', 'D. LEVIN')}
      <div class="case407-alibi-line"><div><b>00:36</b><span>HOTEL</span><small>taxi pickup</small></div><i></i><div><b>00:43</b><span>CROSSROAD A</span><small>city camera</small></div><i></i><div><b>00:51</b><span>CROSSROAD B</span><small>city camera</small></div><i></i><div><b>00:58</b><span>HOME</span><small>intercom</small></div></div>
      <div class="case407-alibi-verdict"><strong>CONTINUOUS ROUTE</strong><span>до 07:10 выход из дома не зафиксирован</span></div>
    </div>`;

  const b1Artifact = (lines) => cctvArtifact(lines, true);

  const accessArtifact = (lines) => `
    <div class="case407-artifact case407-access">
      ${documentHeader('СЛУЖЕБНЫЙ ДОСТУП', 'PRIORITY EXPORT')}
      <div class="case407-access-token"><span>MASTER TOKEN</span><strong>HK-44</strong><small>issued: E. RAEVA</small></div>
      <div class="case407-access-path">${['SVC-407','SERVICE LIFT','LOADING-B1'].map((node, i) => `<div><span>${['01:14:26','01:15:02','01:18:41'][i]}</span><b>${node}</b><small>HK-44</small></div>${i < 2 ? '<i></i>' : ''}`).join('')}</div>
      <div class="case407-access-note">Журнал фиксирует токен, а не личность человека, который держал его в руке.</div>
    </div>`;

  const telemetryArtifact = () => `
    <div class="case407-artifact case407-car">
      ${documentHeader('VEHICLE TELEMATICS', 'ER-02 / PARKING B1')}
      <div class="case407-car-dash"><div><small>DIGITAL KEY</small><strong>ER-02</strong><span>01:20 unlock</span></div><div><small>PASSENGER</small><strong>OCCUPIED</strong><span>01:20 → 01:31</span></div><div><small>GATE</small><strong>01:26</strong><span>service exit</span></div></div>
      <div class="case407-road"><span>HOTEL B1</span><i></i><span>CITY CAM 01:31</span><i></i><b>AIRPORT →</b></div>
    </div>`;

  const chatArtifact = (card) => {
    const messages = [...card.querySelectorAll(':scope > .case2317-messages .case2317-message')].map((node) => {
      const name = node.querySelector('b')?.textContent.trim() || '';
      const full = node.textContent.trim();
      return [name, full.slice(name.length).trim()];
    });
    return `<div class="case407-artifact case407-chat">${documentHeader('RECOVERED DRAFT', 'PARTIAL INDEX')}<div class="case407-phone"><div class="case407-phone-top"><span>01:35</span><b>deleted thread</b><i>42%</i></div><div class="case407-chat-body">${messages.map(([name, text], i) => `<div class="bubble ${i % 2 ? 'right' : 'left'}"><small>${esc(name)}</small><p>${esc(text)}</p></div>`).join('')}<div class="case407-deleted">часть текста не восстановлена</div></div></div></div>`;
  };

  const defaultArtifact = (title, lines, tag) => `
    <div class="case407-artifact case407-paper case407-generic">${documentHeader(tag.toUpperCase(), 'CASE MATERIAL')}<h4>${esc(title)}</h4>${lines.map((line) => `<p>${esc(line)}</p>`).join('')}</div>`;

  const buildArtifact = (card) => {
    if (card.classList.contains('has-photo')) return '';
    const title = card.querySelector(':scope > h3')?.textContent.trim() || '';
    const tag = card.querySelector(':scope > .tag')?.textContent.trim() || '';
    const lines = textList(card, ':scope > p');
    const key = `${tag} ${title}`.toLowerCase();

    if (key.includes('павел зорин') || key.includes('нина круглова')) return statementArtifact(title, lines, tag);
    if (key.includes('осмотр двери') || key.includes('табличк')) return plaqueArtifact();
    if (key.includes('фрагмент журнала замков')) return logArtifact(title, lines, tag);
    if (key.includes('камера c4')) return cctvArtifact(lines, false);
    if (key.includes('реестр оборудования')) return registryArtifact();
    if (key.includes('архивный план')) return planArtifact();
    if (key.includes('чай и стекло')) return labArtifact(title, lines);
    if (key.includes('инструкция сейфа')) return manualArtifact();
    if (key.includes('сеть носимых')) return networkArtifact();
    if (key.includes('предварительный экспорт')) return preliminaryArtifact(lines);
    if (key.includes('бельевая тележка')) return labArtifact(title, lines);
    if (key.includes('внутренняя проверка')) return auditArtifact();
    if (key.includes('проверка подозреваемого')) return alibiArtifact();
    if (key.includes('служебные события доступа')) return accessArtifact(lines);
    if (key.includes('служебная камера b1')) return b1Artifact(lines);
    if (key.includes('телематика автомобиля')) return telemetryArtifact();
    if (key.includes('удалённый черновик')) return chatArtifact(card);
    if (key.includes('лаборатор')) return labArtifact(title, lines);
    return defaultArtifact(title, lines, tag);
  };

  const moveNarrativeToDetails = (card) => {
    const paragraphs = direct(card, ':scope > p');
    if (!paragraphs.length) return;
    const details = document.createElement('details');
    details.className = 'case407-evidence-notes';
    const summary = document.createElement('summary');
    summary.textContent = 'Комментарий эксперта';
    details.appendChild(summary);
    paragraphs.forEach((node) => details.appendChild(node));
    const factsNode = card.querySelector(':scope > .case2317-facts');
    if (factsNode) card.insertBefore(details, factsNode); else card.appendChild(details);
  };

  const enhance = (card) => {
    if (!(card instanceof HTMLElement) || card.dataset.evidenceArtifact === '1') return;
    card.dataset.evidenceArtifact = '1';
    const artifact = buildArtifact(card);
    if (!artifact) return;
    const title = card.querySelector(':scope > h3');
    if (!title) return;
    title.insertAdjacentHTML('afterend', artifact);
    moveNarrativeToDetails(card);
    card.classList.add('case407-materialized');
  };

  const scan = () => root.querySelectorAll('.case2317-evidence').forEach(enhance);
  const observer = new MutationObserver(scan);
  observer.observe(root, { childList: true, subtree: true });
  scan();
})();
