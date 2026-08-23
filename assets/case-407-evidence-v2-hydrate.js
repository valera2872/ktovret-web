(() => {
  'use strict';
  const root = document.querySelector('[data-case407-app]');
  if (!root) return;
  const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const lines = (card) => [...card.querySelectorAll(':scope > p')].map((node) => node.textContent.trim()).filter(Boolean);
  const split = (text) => {
    const match = text.match(/^(\d{2}:\d{2}(?::\d{2})?)\s*[—–-]\s*(.+)$/);
    return match ? [match[1], match[2]] : ['', text];
  };
  const highlightIds = (value) => {
    let safe = esc(value);
    const ids = value.match(/\b(?:L|S|SVC|HK|WEST|STAFF|LOADING|ER|NIGHT)[-A-Z0-9]+\b/g) || [];
    ids.forEach((id) => { safe = safe.replaceAll(esc(id), `<mark>${esc(id)}</mark>`); });
    return safe;
  };
  const requestArtifact = () => `<div class="case407-artifact case407-request-export"><div class="case407-artifact-head"><span>КАРТА СЛУЖЕБНОЙ СЕТИ</span><b>LIMITED SCOPE</b></div><div class="case407-request-grid"></div><div class="case407-redaction"><span>door IDs</span><i>████████</i><span>token</span><i>██████</i><b>требуется срочный запрос доступа</b></div></div>`;
  const accessCameraArtifact = () => `<div class="case407-artifact case407-access"><div class="case407-artifact-head"><span>СЛУЖЕБНЫЙ ДОСТУП + CAM B1</span><b>PRIORITY EXPORT</b></div><div class="case407-access-token"><span>MASTER TOKEN</span><strong>HK-44</strong><small>issued: E. RAEVA</small></div><div class="case407-access-path"><div><span>01:14:26</span><b>SVC-407</b><small>HK-44</small></div><i></i><div><span>01:15:02</span><b>SERVICE LIFT</b><small>HK-44</small></div><i></i><div><span>01:18:41</span><b>LOADING-B1</b><small>HK-44</small></div></div><div class="case407-cctv case407-access-camera"><div class="case407-cctv-strip"><div class="case407-cctv-frame"><div class="case407-cctv-scene is-b1"><i class="figure f1"></i></div><div class="case407-cctv-meta"><b>01:17:42</b><span>camera active · cart visible</span></div></div><div class="case407-cctv-frame"><div class="case407-cctv-scene is-b1"><b class="case407-gap">NO SIGNAL<br>94 SEC</b></div><div class="case407-cctv-meta"><b>01:17:43</b><span>NIGHT-MGR / ER-02 maintenance window</span></div></div><div class="case407-cctv-frame"><div class="case407-cctv-scene is-b1"><i class="figure f3"></i></div><div class="case407-cctv-meta"><b>01:19:17</b><span>recording restored · cart gone</span></div></div></div></div><div class="case407-access-note">Журнал фиксирует токен, а не личность человека, который держал его. Команда отключения камеры отдельно привязана к NIGHT-MGR и ER-02.</div></div>`;
  const normalizeCurrentMaterial = (card, artifact, title) => {
    const key = title.toLowerCase();
    if (key.includes('staff-4') && key.includes('loading-b1') && !artifact.classList.contains('case407-request-export')) {
      artifact.outerHTML = requestArtifact();
      return card.querySelector(':scope > .case407-artifact');
    }
    if (key.includes('hk-44') && key.includes('камера') && !artifact.classList.contains('case407-access')) {
      artifact.outerHTML = accessCameraArtifact();
      return card.querySelector(':scope > .case407-artifact');
    }
    return artifact;
  };
  const hydrate = (card) => {
    if (!(card instanceof HTMLElement) || card.dataset.evidenceHydrated === '1') return;
    let artifact = card.querySelector(':scope > .case407-artifact');
    if (!artifact) return;
    const materialLines = lines(card);
    const title = card.querySelector(':scope > h3')?.textContent.trim() || '';
    artifact = normalizeCurrentMaterial(card, artifact, title);

    const transcript = artifact.querySelector('.case407-transcript');
    if (transcript && !transcript.children.length) transcript.innerHTML = materialLines.map((line, index) => `<div><span>${String(index + 1).padStart(2, '0')}</span><p>${esc(line.replace(/^«|»$/g, ''))}</p></div>`).join('');

    const log = artifact.querySelector('.case407-log-table');
    if (log && !log.children.length) log.innerHTML = materialLines.map((line, index) => { const [time, rest] = split(line); return `<div class="case407-log-row"><span>${esc(time || `#${String(index + 1).padStart(2, '0')}`)}</span><code>${highlightIds(rest)}</code></div>`; }).join('');

    const strip = artifact.querySelector('.case407-cctv-strip');
    if (strip && !strip.children.length) strip.innerHTML = materialLines.slice(0, 3).map((line, index) => { const [time, rest] = split(line); const basement = title.toLowerCase().includes('b1'); return `<div class="case407-cctv-frame"><div class="case407-cctv-scene ${basement ? 'is-b1' : ''}"><span class="door d1">407</span><span class="door d2">409</span><i class="figure f${index + 1}"></i>${basement && index === 1 ? '<b class="case407-gap">NO SIGNAL<br>94 SEC</b>' : ''}</div><div class="case407-cctv-meta"><b>${esc(time || ['00:52:18','00:54:03','01:16:00'][index])}</b><span>${esc(rest.slice(0, 72))}</span></div></div>`; }).join('');

    const lab = artifact.querySelector('.case407-lab-data');
    if (lab && !lab.children.length) lab.innerHTML = materialLines.slice(0, 3).map((line, index) => `<div><small>OBS-${index + 1}</small><p>${esc(line)}</p></div>`).join('');

    const request = artifact.querySelector('.case407-request-grid');
    if (request && !request.children.length) request.innerHTML = materialLines.slice(0, 3).map((line, index) => `<div><span>${['01:14','01:16','01:19'][index] || `0${index + 1}`}</span><p>${esc(line)}</p><b>${index === 0 ? 'ZONE' : index === 1 ? 'VERTICAL' : 'ACCESS'}</b></div>`).join('');

    if (!card.querySelector(':scope > .case407-evidence-notes') && materialLines.length) {
      const details = document.createElement('details');
      details.className = 'case407-evidence-notes';
      const summary = document.createElement('summary');
      summary.textContent = 'Комментарий эксперта';
      details.appendChild(summary);
      [...card.querySelectorAll(':scope > p')].forEach((node) => details.appendChild(node));
      const facts = card.querySelector(':scope > .case2317-facts');
      if (facts) card.insertBefore(details, facts); else card.appendChild(details);
    }
    card.dataset.evidenceHydrated = '1';
  };
  const scan = () => root.querySelectorAll('.case2317-evidence.case407-materialized').forEach(hydrate);
  new MutationObserver(scan).observe(root, { childList: true, subtree: true });
  scan();
})();
