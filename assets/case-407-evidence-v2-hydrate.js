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
  const hydrate = (card) => {
    if (!(card instanceof HTMLElement) || card.dataset.evidenceHydrated === '1') return;
    const artifact = card.querySelector(':scope > .case407-artifact');
    if (!artifact) return;
    const materialLines = lines(card);
    const title = card.querySelector(':scope > h3')?.textContent.trim() || '';

    const transcript = artifact.querySelector('.case407-transcript');
    if (transcript && !transcript.children.length) transcript.innerHTML = materialLines.map((line, index) => `<div><span>${String(index + 1).padStart(2, '0')}</span><p>${esc(line.replace(/^«|»$/g, ''))}</p></div>`).join('');

    const log = artifact.querySelector('.case407-log-table');
    if (log && !log.children.length) log.innerHTML = materialLines.map((line, index) => { const [time, rest] = split(line); return `<div class="case407-log-row"><span>${esc(time || `#${String(index + 1).padStart(2, '0')}`)}</span><code>${highlightIds(rest)}</code></div>`; }).join('');

    const strip = artifact.querySelector('.case407-cctv-strip');
    if (strip && !strip.children.length) strip.innerHTML = materialLines.slice(0, 3).map((line, index) => { const [time, rest] = split(line); const basement = title.toLowerCase().includes('b1'); return `<div class="case407-cctv-frame"><div class="case407-cctv-scene ${basement ? 'is-b1' : ''}"><span class="door d1">407</span><span class="door d2">409</span><i class="figure f${index + 1}"></i>${basement && index === 1 ? '<b class="case407-gap">NO SIGNAL<br>94 SEC</b>' : ''}</div><div class="case407-cctv-meta"><b>${esc(time || ['00:52:18','00:54:03','01:16:00'][index])}</b><span>${esc(rest.slice(0, 72))}</span></div></div>`; }).join('');

    const lab = artifact.querySelector('.case407-lab-data');
    if (lab && !lab.children.length) lab.innerHTML = materialLines.slice(0, 3).map((line, index) => `<div><small>OBS-${index + 1}</small><p>${esc(line)}</p></div>`).join('');

    const request = artifact.querySelector('.case407-request-grid');
    if (request && !request.children.length) request.innerHTML = materialLines.slice(0, 3).map((line, index) => `<div><span>${['01:14','01:16','01:19'][index] || `0${index + 1}`}</span><p>${esc(line)}</p><b>${index === 0 ? 'EVENT' : index === 1 ? 'VERTICAL' : 'ZONE'}</b></div>`).join('');

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
