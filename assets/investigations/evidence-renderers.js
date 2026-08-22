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
    const sceneTitle = escapeHtml(p.sceneTitle || 'Закрытый игровой уровень');
    const marker = escapeHtml(p.marker || 'R-03');
    return `<div class="mli-ev-screenshot">
      <svg class="mli-ev-game-shot" viewBox="0 0 1280 720" role="img" aria-label="Скриншот компьютерной игры: тёмный промышленный уровень с игровым интерфейсом и служебной меткой ${marker}" style="display:block;width:100%;height:auto;border-radius:14px;background:#07111b;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)">
        <defs>
          <linearGradient id="mliGameSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101f2c"/><stop offset="1" stop-color="#071018"/></linearGradient>
          <linearGradient id="mliGameFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#203342"/><stop offset="1" stop-color="#0a141d"/></linearGradient>
          <linearGradient id="mliGameDoor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#84d7db" stop-opacity=".85"/><stop offset="1" stop-color="#2b6972" stop-opacity=".18"/></linearGradient>
          <radialGradient id="mliGameGlow"><stop offset="0" stop-color="#b9f4ed" stop-opacity=".5"/><stop offset="1" stop-color="#6dd0d1" stop-opacity="0"/></radialGradient>
          <filter id="mliGameBlur"><feGaussianBlur stdDeviation="18"/></filter>
        </defs>
        <rect width="1280" height="720" fill="url(#mliGameSky)"/>
        <ellipse cx="640" cy="275" rx="320" ry="180" fill="url(#mliGameGlow)" filter="url(#mliGameBlur)"/>
        <polygon points="0,0 330,0 500,295 0,560" fill="#182b39"/>
        <polygon points="1280,0 950,0 780,295 1280,560" fill="#132532"/>
        <polygon points="0,720 0,560 500,295 780,295 1280,560 1280,720" fill="url(#mliGameFloor)"/>
        <g opacity=".34" stroke="#8db9c0" stroke-width="2">
          <line x1="640" y1="300" x2="260" y2="720"/><line x1="640" y1="300" x2="420" y2="720"/><line x1="640" y1="300" x2="860" y2="720"/><line x1="640" y1="300" x2="1020" y2="720"/>
          <line x1="105" y1="605" x2="1175" y2="605"/><line x1="225" y1="505" x2="1055" y2="505"/><line x1="350" y1="415" x2="930" y2="415"/>
        </g>
        <rect x="518" y="118" width="244" height="245" rx="6" fill="#0b1720" stroke="#487984" stroke-width="5"/>
        <rect x="545" y="145" width="190" height="218" fill="url(#mliGameDoor)"/>
        <rect x="574" y="172" width="132" height="191" fill="#112632" opacity=".7"/>
        <path d="M610 363 L625 230 L655 230 L671 363 Z" fill="#061015" opacity=".72"/>
        <circle cx="640" cy="215" r="18" fill="#081218" opacity=".85"/>
        <g transform="translate(110 455)">
          <rect width="205" height="112" rx="5" fill="#263d49" stroke="#55717b" stroke-width="3"/>
          <path d="M0 28 H205 M52 0 V112 M154 0 V112" stroke="#667f88" stroke-width="3" opacity=".65"/>
          <rect x="75" y="42" width="55" height="26" rx="3" fill="#d3a95d" opacity=".85"/>
          <text x="102" y="60" fill="#17222b" font-size="14" font-weight="900" text-anchor="middle">CARGO</text>
        </g>
        <g transform="translate(950 470)">
          <rect width="170" height="96" rx="4" fill="#213844" stroke="#54727b" stroke-width="3"/>
          <path d="M0 24 H170 M44 0 V96 M127 0 V96" stroke="#66808a" stroke-width="3" opacity=".65"/>
        </g>
        <g opacity=".85">
          <rect x="75" y="90" width="250" height="86" rx="12" fill="#07121b" fill-opacity=".72" stroke="#7797a5" stroke-opacity=".38"/>
          <text x="98" y="118" fill="#9fbac4" font-size="15" font-family="Inter,Arial,sans-serif" font-weight="700" letter-spacing="2">ВЕРСИЯ ДЛЯ ОЗНАКОМЛЕНИЯ</text>
          <text x="98" y="151" fill="#ffffff" font-size="24" font-family="Inter,Arial,sans-serif" font-weight="800">${sceneTitle}</text>
        </g>
        <g transform="translate(75 618)">
          <rect width="265" height="48" rx="10" fill="#07121b" fill-opacity=".7"/>
          <text x="18" y="19" fill="#9fbac4" font-size="12" font-family="Inter,Arial,sans-serif" font-weight="700">ЗАДАЧА</text>
          <text x="18" y="38" fill="#ffffff" font-size="16" font-family="Inter,Arial,sans-serif" font-weight="800">Найти вход в лабораторию</text>
        </g>
        <g transform="translate(1002 82)" opacity=".88">
          <circle cx="82" cy="82" r="68" fill="#07121b" fill-opacity=".62" stroke="#7495a1" stroke-opacity=".45" stroke-width="3"/>
          <path d="M36 84 L68 55 L94 72 L126 42 M58 112 L90 91 L120 104" fill="none" stroke="#7fd1cd" stroke-width="4" opacity=".65"/>
          <circle cx="83" cy="82" r="6" fill="#e1b966"/>
        </g>
        <g stroke="#e6eff2" stroke-width="2" opacity=".78">
          <line x1="620" y1="360" x2="660" y2="360"/><line x1="640" y1="340" x2="640" y2="380"/>
          <circle cx="640" cy="360" r="11" fill="none"/>
        </g>
        <g transform="translate(950 630)">
          <rect width="225" height="38" rx="8" fill="#07121b" fill-opacity=".65"/>
          <rect x="12" y="12" width="142" height="14" rx="7" fill="#203541"/>
          <rect x="12" y="12" width="106" height="14" rx="7" fill="#85c6af"/>
          <text x="168" y="25" fill="#dbe7ea" font-size="13" font-family="Inter,Arial,sans-serif" font-weight="800">76%</text>
        </g>
        <text x="1225" y="696" fill="#d7e0e3" fill-opacity=".72" font-size="15" font-family="ui-monospace,monospace" font-weight="700" text-anchor="end">${marker}</text>
      </svg>
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
    const items = p.items || [];
    return `<section class="mli-ev-statements" data-statement-viewer>
      <header class="mli-ev-statements-head">
        <div><small>ПРОТОКОЛ ПЕРВИЧНЫХ ОПРОСОВ</small><strong>Участники дела</strong></div>
        <span>${escapeHtml(p.date || '')}<br>${escapeHtml(p.place || '')}</span>
      </header>
      ${p.lead ? `<p class="mli-ev-statements-lead">${escapeHtml(p.lead)}</p>` : ''}
      <div class="mli-ev-statements-layout">
        <div class="mli-ev-statement-tabs" role="tablist" aria-label="Выберите участника для опроса">
          ${items.map((item, index) => {
            const character = (definition.characters || []).find((candidate) => candidate.id === item.id || candidate.name === item.name);
            return `<button type="button" role="tab" class="${index === 0 ? 'is-active' : ''}" data-statement-person="${escapeHtml(item.id || String(index))}" aria-selected="${index === 0 ? 'true' : 'false'}" aria-controls="mli-statement-${escapeHtml(item.id || String(index))}">
              <span class="mli-ev-avatar">${character?.portrait ? `<img src="${escapeHtml(character.portrait)}" alt="" width="96" height="120" loading="lazy" decoding="async">` : escapeHtml(item.initials)}</span>
              <span><small>ОПРОС ${escapeHtml(item.number || String(index + 1).padStart(2, '0'))}</small><strong>${escapeHtml(item.name)}</strong><em>${escapeHtml(item.relationship || item.role || '')}</em></span>
            </button>`;
          }).join('')}
        </div>
        <div class="mli-ev-statement-panels">
          ${items.map((item, index) => {
            const character = (definition.characters || []).find((candidate) => candidate.id === item.id || candidate.name === item.name);
            return `<article id="mli-statement-${escapeHtml(item.id || String(index))}" role="tabpanel" data-statement-panel="${escapeHtml(item.id || String(index))}" ${index === 0 ? '' : 'hidden'}>
              <header>
                <span class="mli-ev-statement-portrait">${character?.portrait ? `<img src="${escapeHtml(character.portrait)}" alt="Портрет: ${escapeHtml(item.name)}" width="180" height="224" loading="lazy" decoding="async">` : escapeHtml(item.initials)}</span>
                <div><small>ОПРОС ${escapeHtml(item.number || String(index + 1).padStart(2, '0'))} · ПЕРВИЧНЫЙ</small><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.role || '')}</p><span>${escapeHtml(item.relationship || '')}</span></div>
              </header>
              <div class="mli-ev-transcript">
                <div class="mli-ev-question"><small>Следователь</small><p>${escapeHtml(p.identityQuestion || 'Представьтесь и объясните, как вы связаны с делом.')}</p></div>
                <blockquote><small>${escapeHtml(item.name)}</small><p>${escapeHtml(item.introduction || '')}</p></blockquote>
                <div class="mli-ev-question"><small>Следователь</small><p>${escapeHtml(item.eventsQuestion || 'Что вам известно о событиях вечера?')}</p></div>
                <blockquote class="is-statement"><small>${escapeHtml(item.name)} · первоначальные показания</small><p>${escapeHtml(item.text || '')}</p></blockquote>
              </div>
            </article>`;
          }).join('')}
        </div>
      </div>
    </section>`;
  }

  function bindStatementViewer(scope) {
    const viewer = scope.querySelector('[data-statement-viewer]');
    if (!viewer) return;
    const tabs = [...viewer.querySelectorAll('[data-statement-person]')];
    const panels = [...viewer.querySelectorAll('[data-statement-panel]')];
    for (const tab of tabs) {
      tab.addEventListener('click', () => {
        const personId = tab.dataset.statementPerson;
        for (const candidate of tabs) {
          const active = candidate === tab;
          candidate.classList.toggle('is-active', active);
          candidate.setAttribute('aria-selected', active ? 'true' : 'false');
        }
        for (const panel of panels) {
          panel.hidden = panel.dataset.statementPanel !== personId;
        }
      });
    }
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
    bindStatementViewer(body);
  }

  const observer = new MutationObserver(enhanceDialog);
  observer.observe(dialog, { childList: true, subtree: true });
  enhanceDialog();

  root.MysteryLogicEvidenceRenderers = Object.freeze({ renderers, enhanceDialog });
})(typeof globalThis !== 'undefined' ? globalThis : window);
