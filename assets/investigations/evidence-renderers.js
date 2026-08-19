(function (root) {
  'use strict';

  const definition = root.MysteryLogicInvestigationCase;
  const dialog = document.querySelector('[data-mli-dialog]');
  if (!definition || !dialog) return;

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const lines = (items) => (items || []).map((item) => `<div class="mli-ev-line">${escapeHtml(item)}</div>`).join('');
  const rows = (items) => (items || []).map((row) => `
    <div class="mli-ev-row${row.emphasis ? ' is-emphasis' : ''}">
      <span>${escapeHtml(row.left || '')}</span>
      <strong>${escapeHtml(row.middle || '')}</strong>
      <span>${escapeHtml(row.right || '')}</span>
    </div>
  `).join('');

  function renderMessage(p) {
    return `<div class="mli-ev-phone">
      <div class="mli-ev-phone-top"><span>${escapeHtml(p.app || 'Сообщения')}</span><small>${escapeHtml(p.date || '')}</small></div>
      <div class="mli-ev-chat">
        ${(p.messages || []).map((message) => `<div class="mli-ev-bubble ${message.outgoing ? 'is-outgoing' : ''}">
          <small>${escapeHtml(message.sender || '')}${message.time ? ` · ${escapeHtml(message.time)}` : ''}</small>
          <p>${escapeHtml(message.text)}</p>
        </div>`).join('')}
      </div>
    </div>`;
  }

  function renderReceipt(p) {
    return `<div class="mli-ev-split">
      <div class="mli-ev-receipt">
        <div class="mli-ev-receipt-brand">${escapeHtml(p.venue || 'ЧЕК')}</div>
        <div class="mli-ev-receipt-rule"></div>
        ${(p.lines || []).map((item) => `<div><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`).join('')}
        <div class="mli-ev-receipt-rule"></div>
        <small>${escapeHtml(p.note || '')}</small>
      </div>
      <div class="mli-ev-message-card">
        <small>${escapeHtml(p.messageLabel || 'Сообщение')}</small>
        <strong>${escapeHtml(p.messageTime || '')}</strong>
        <p>${escapeHtml(p.message || '')}</p>
        ${p.caution ? `<div class="mli-ev-caution">${escapeHtml(p.caution)}</div>` : ''}
      </div>
    </div>`;
  }

  function renderTerminal(p) {
    return `<div class="mli-ev-terminal">
      <header><span></span><span></span><span></span><strong>${escapeHtml(p.title || 'SYSTEM AUDIT')}</strong></header>
      <div class="mli-ev-terminal-body">
        ${lines(p.lines)}
      </div>
      ${p.note ? `<footer>${escapeHtml(p.note)}</footer>` : ''}
    </div>`;
  }

  function renderAccess(p) {
    return `<div class="mli-ev-access">
      <header><div><small>${escapeHtml(p.system || 'ACCESS CONTROL')}</small><strong>${escapeHtml(p.period || '')}</strong></div><span>${escapeHtml(p.status || 'EXPORT')}</span></header>
      <div class="mli-ev-access-table">${rows(p.rows)}</div>
      ${p.note ? `<p class="mli-ev-footnote">${escapeHtml(p.note)}</p>` : ''}
    </div>`;
  }

  function renderRegistry(p) {
    return `<div class="mli-ev-registry">
      <header><small>${escapeHtml(p.kicker || 'СЛУЖЕБНЫЙ РЕЕСТР')}</small><strong>${escapeHtml(p.heading || '')}</strong></header>
      <dl>${(p.fields || []).map((field) => `<div class="${field.emphasis ? 'is-emphasis' : ''}"><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(field.value)}</dd></div>`).join('')}</dl>
      ${p.note ? `<p>${escapeHtml(p.note)}</p>` : ''}
    </div>`;
  }

  function renderInterview(p) {
    const character = (definition.characters || []).find((item) => item.name === p.name);
    return `<div class="mli-ev-interview">
      <div class="mli-ev-interview-meta"><span class="mli-ev-avatar">${character?.portrait ? `<img src="${escapeHtml(character.portrait)}" alt="" width="96" height="120" loading="lazy" decoding="async">` : escapeHtml(p.initials || '—')}</span><div><small>ПОВТОРНЫЙ ОПРОС</small><strong>${escapeHtml(p.name || '')}</strong><span>${escapeHtml(p.role || '')}</span></div></div>
      <blockquote>${escapeHtml(p.quote || '')}</blockquote>
      ${p.context ? `<p>${escapeHtml(p.context)}</p>` : ''}
    </div>`;
  }

  function renderWeb(p) {
    return `<div class="mli-ev-browser">
      <div class="mli-ev-browser-bar"><span>‹</span><span>›</span><span>↻</span><div>${escapeHtml(p.url || 'kadr17.studio')}</div></div>
      <div class="mli-ev-webpage">
        <small>${escapeHtml(p.kicker || '')}</small>
        <h3>${escapeHtml(p.heading || '')}</h3>
        <p>${escapeHtml(p.lead || '')}</p>
        <div class="mli-ev-web-cards">${(p.cards || []).map((card) => `<article><strong>${escapeHtml(card.title)}</strong><span>${escapeHtml(card.text)}</span></article>`).join('')}</div>
      </div>
    </div>`;
  }

  function renderScreenshot(p) {
    return `<div class="mli-ev-screenshot">
      <div class="mli-ev-game-scene"><div class="mli-ev-game-horizon"></div><div class="mli-ev-game-panel"><span>REVIEW BUILD</span><strong>${escapeHtml(p.sceneTitle || 'PROJECT FRAME')}</strong></div><small>${escapeHtml(p.marker || '')}</small></div>
      ${p.caption ? `<p>${escapeHtml(p.caption)}</p>` : ''}
    </div>`;
  }

  function renderEmail(p) {
    return `<div class="mli-ev-email">
      <header><div><small>FROM</small><strong>${escapeHtml(p.from || '')}</strong></div><div><small>TO</small><strong>${escapeHtml(p.to || '')}</strong></div><time>${escapeHtml(p.time || '')}</time></header>
      <h3>${escapeHtml(p.subject || '')}</h3>
      ${(p.paragraphs || []).map((text) => `<p>${escapeHtml(text)}</p>`).join('')}
      ${(p.attachments || []).length ? `<div class="mli-ev-attachments">${p.attachments.map((item) => `<span>▤ ${escapeHtml(item)}</span>`).join('')}</div>` : ''}
      ${p.forward ? `<div class="mli-ev-forward"><small>ПЕРЕСЛАННЫЙ ФРАГМЕНТ</small><p>${escapeHtml(p.forward)}</p></div>` : ''}
    </div>`;
  }

  function renderComparison(p) {
    return `<div class="mli-ev-compare">
      <div><small>${escapeHtml(p.leftLabel || '')}</small><strong>${escapeHtml(p.leftValue || '')}</strong><code>${escapeHtml(p.leftHash || '')}</code></div>
      <span class="mli-ev-compare-mark">=</span>
      <div><small>${escapeHtml(p.rightLabel || '')}</small><strong>${escapeHtml(p.rightValue || '')}</strong><code>${escapeHtml(p.rightHash || '')}</code></div>
      <p>${escapeHtml(p.note || '')}</p>
    </div>`;
  }

  function renderDocument(p) {
    return `<div class="mli-ev-document">
      <header><small>${escapeHtml(p.office || '')}</small><strong>${escapeHtml(p.heading || '')}</strong><span>${escapeHtml(p.number || '')}</span></header>
      <dl>${(p.fields || []).map((field) => `<div><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(field.value)}</dd></div>`).join('')}</dl>
      ${p.note ? `<p>${escapeHtml(p.note)}</p>` : ''}
      <div class="mli-ev-stamp">${escapeHtml(p.stamp || 'ПРИНЯТО')}</div>
    </div>`;
  }

  function renderScene(p) {
    return `<div class="mli-ev-scene">
      ${p.image ? `<div class="mli-ev-office-photo"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.imageAlt || '')}" width="1440" height="810" loading="lazy" decoding="async"></div>` : `<div class="mli-ev-office-plan">
        <div class="mli-ev-office-desk"><span>DEMO-04</span><strong>${escapeHtml(p.monitor || 'ON')}</strong></div>
        <div class="mli-ev-office-phone"><span>телефон Павла</span><strong>▯</strong></div>
        <div class="mli-ev-office-orbit"><span>ORBIT-2</span><strong>пустой футляр</strong></div>
        <div class="mli-ev-office-release"><span>RELEASE</span><strong>не найден</strong></div>
      </div>`}
      <div class="mli-ev-scene-notes">${(p.notes || []).map((note) => `<span>${escapeHtml(note)}</span>`).join('')}</div>
    </div>`;
  }

  function renderStatements(p) {
    return `<div class="mli-ev-statements">${(p.items || []).map((item) => {
      const character = (definition.characters || []).find((candidate) => candidate.name === item.name);
      return `<article><span class="mli-ev-avatar">${character?.portrait ? `<img src="${escapeHtml(character.portrait)}" alt="" width="96" height="120" loading="lazy" decoding="async">` : escapeHtml(item.initials)}</span><div><small>${escapeHtml(item.role || '')}</small><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.text)}</p></div></article>`;
    }).join('')}</div>`;
  }

  const renderers = {
    message: renderMessage,
    receipt: renderReceipt,
    terminal: renderTerminal,
    access: renderAccess,
    registry: renderRegistry,
    interview: renderInterview,
    web: renderWeb,
    screenshot: renderScreenshot,
    email: renderEmail,
    comparison: renderComparison,
    document: renderDocument,
    scene: renderScene,
    statements: renderStatements,
  };

  function enhanceDialog() {
    const body = dialog.querySelector('.mli-document-body');
    const titleNode = dialog.querySelector('h2');
    if (!body || !titleNode || body.dataset.evidenceEnhanced === 'true') return;

    const material = (definition.materials || []).find((candidate) => candidate.title === titleNode.textContent.trim());
    const presentation = material?.presentation;
    const renderer = presentation && renderers[presentation.kind];
    if (!renderer) return;

    body.dataset.evidenceEnhanced = 'true';
    body.innerHTML = `<div class="mli-evidence-frame" data-evidence-kind="${escapeHtml(presentation.kind)}">${renderer(presentation)}</div>`;
    dialog.querySelector('.mli-dialog-card')?.classList.add('is-evidence');
  }

  const observer = new MutationObserver(enhanceDialog);
  observer.observe(dialog, { childList: true, subtree: true });
  enhanceDialog();

  root.MysteryLogicEvidenceRenderers = Object.freeze({ renderers, enhanceDialog });
})(typeof globalThis !== 'undefined' ? globalThis : window);
