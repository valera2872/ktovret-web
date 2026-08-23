(() => {
  'use strict';
  const root = document.querySelector('[data-case407-app]');
  if (!root) return;
  const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const directParagraphs = (card) => [...card.querySelectorAll(':scope > p')];
  const splitTime = (text) => {
    const match = text.match(/^(\d{2}:\d{2}(?::\d{2})?)\s*[—–-]\s*(.+)$/);
    return match ? [match[1], match[2]] : ['', text];
  };
  const highlight = (value) => {
    let safe = esc(value);
    const ids = value.match(/\b(?:L|S|SVC|HK|WEST|STAFF|LOADING|ER|NIGHT)[-A-Z0-9]+\b/g) || [];
    ids.forEach((id) => { safe = safe.replaceAll(esc(id), `<mark>${esc(id)}</mark>`); });
    return safe;
  };
  const fillArtifact = (card, materialLines) => {
    const transcript = card.querySelector('.case407-transcript');
    if (transcript && !transcript.children.length) transcript.innerHTML = materialLines.map((line, i) => `<div><span>${String(i + 1).padStart(2, '0')}</span><p>${esc(line.replace(/^«|»$/g, ''))}</p></div>`).join('');

    const log = card.querySelector('.case407-log-table');
    if (log && !log.children.length) log.innerHTML = materialLines.map((line, i) => { const [time, rest] = splitTime(line); return `<div class="case407-log-row"><span>${esc(time || `#${String(i + 1).padStart(2, '0')}`)}</span><code>${highlight(rest)}</code></div>`; }).join('');

    const cctv = card.querySelector('.case407-cctv-strip');
    if (cctv && !cctv.children.length) cctv.innerHTML = materialLines.slice(0, 3).map((line, i) => { const [time, rest] = splitTime(line); return `<div class="case407-cctv-frame"><div class="case407-cctv-scene"><span class="door d1">407</span><span class="door d2">409</span><i class="figure f${i + 1}"></i></div><div class="case407-cctv-meta"><b>${esc(time || ['00:52:18','00:54:03','01:16:00'][i])}</b><span>${esc(rest.slice(0, 80))}</span></div></div>`; }).join('');

    const lab = card.querySelector('.case407-lab-data');
    if (lab && !lab.children.length) lab.innerHTML = materialLines.slice(0, 3).map((line, i) => `<div><small>OBS-${i + 1}</small><p>${esc(line)}</p></div>`).join('');

    const request = card.querySelector('.case407-request-grid');
    if (request && !request.children.length) request.innerHTML = materialLines.slice(0, 3).map((line, i) => `<div><span>${['STAFF-4','LOADING-B1','ROUTE'][i]}</span><p>${esc(line)}</p><b>${['ZONE','ZONE','UNKNOWN'][i]}</b></div>`).join('');
  };
  const collapse = (card, paragraphs) => {
    let details = card.querySelector(':scope > .case407-evidence-notes');
    if (!details) {
      details = document.createElement('details');
      details.className = 'case407-evidence-notes';
      const summary = document.createElement('summary');
      summary.textContent = 'Расшифровка материала';
      details.appendChild(summary);
      card.appendChild(details);
    }
    const facts = details.querySelector(':scope > .case2317-facts') || card.querySelector(':scope > .case2317-facts');
    const stamp = details.querySelector(':scope > .case2317-stamp') || card.querySelector(':scope > .case2317-stamp');
    const anchor = facts || stamp || null;
    paragraphs.forEach((node) => details.insertBefore(node, anchor));
    if (facts && facts.parentElement !== details) details.appendChild(facts);
    if (stamp && stamp.parentElement !== details) details.appendChild(stamp);
  };
  const finalize = (card) => {
    if (!(card instanceof HTMLElement) || card.dataset.evidenceFinalized === '1' || !card.classList.contains('case407-materialized')) return;
    const paragraphs = directParagraphs(card);
    const materialLines = paragraphs.map((node) => node.textContent.trim()).filter(Boolean);
    fillArtifact(card, materialLines);
    collapse(card, paragraphs);
    card.dataset.evidenceFinalized = '1';
  };
  const scan = () => root.querySelectorAll('.case2317-evidence.case407-materialized').forEach(finalize);
  new MutationObserver(scan).observe(root, { childList: true, subtree: true });
  scan();
})();