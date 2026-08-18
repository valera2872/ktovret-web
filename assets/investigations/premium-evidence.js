(function (root) {
  'use strict';

  const definition = root.MysteryLogicInvestigationCase;
  const dialog = document.querySelector('[data-mli-dialog]');
  if (!definition || !dialog) return;

  const byId = new Map((definition.materials || []).map((material) => [material.id, material]));
  let pendingMaterialId = null;

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const caption = (text) => text ? `<p class="mli-ev-caption">${esc(text)}</p>` : '';
  const meta = (items) => `<div class="mli-ev-meta">${items.filter(Boolean).map((item) => `<span>${esc(item)}</span>`).join('')}</div>`;

  function renderChat(p) {
    return `<div class="mli-evidence-stage">${meta(p.meta || [])}<div class="mli-ev-chat"><div class="mli-ev-chat-head"><span class="mli-ev-chat-avatar">${esc(p.avatar || 'ML')}</span><div><strong>${esc(p.title || 'Переписка')}</strong><small>${esc(p.status || 'сохранённая копия')}</small></div></div><div class="mli-ev-chat-thread">${(p.messages || []).map((m) => `<div class="mli-ev-bubble${m.own ? ' is-own' : ''}"><b>${esc(m.author || '')}</b><span>${esc(m.text)}</span><time>${esc(m.time || '')}</time></div>`).join('')}</div></div>${caption(p.caption)}</div>`;
  }

  function renderReceipt(p) {
    return `<div class="mli-evidence-stage">${meta(p.meta || [])}<div class="mli-ev-receipt-wrap"><div class="mli-ev-receipt"><h3>${esc(p.place || 'РЕСТОРАН')}</h3><div class="sub">${esc(p.address || '')}</div><hr>${(p.rows || []).map((r) => `<div class="mli-ev-receipt-row"><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')}<hr><div class="mli-ev-receipt-row mli-ev-receipt-total"><span>ОПЛАТА</span><span>${esc(p.paidAt || '')}</span></div></div><div class="mli-ev-message-card"><small>${esc(p.messageTime || '')} · сообщение</small><p>${esc(p.message || '')}</p></div></div>${caption(p.caption)}</div>`;
  }

  function renderLog(p) {
    return `<div class="mli-evidence-stage">${meta(p.meta || [])}<div class="mli-ev-terminal"><div class="mli-ev-terminal-bar"><i></i><i></i><i></i><span>${esc(p.title || 'audit export')}</span></div><div class="mli-ev-log">${(p.rows || []).map((r) => `<div class="mli-ev-log-row${r.critical ? ' is-critical' : ''}${r.positive ? ' is-positive' : ''}"><time>${esc(r.time || '')}</time><b>${esc(r.event || '')}</b><span>${esc(r.detail || '')}</span></div>`).join('')}</div></div>${caption(p.caption)}</div>`;
  }

  function renderAccess(p) {
    return `<div class="mli-evidence-stage">${meta(p.meta || [])}<div class="mli-ev-access">${(p.rows || []).map((r) => `<div class="mli-ev-access-row${r.night ? ' is-night' : ''}"><time>${esc(r.time)}</time><span class="mli-ev-access-icon">${r.direction === 'out' ? '↗' : '↘'}</span><div><strong>${esc(r.subject)}</strong><small>${esc(r.detail || '')}</small></div><em>${esc(r.point || '')}</em></div>`).join('')}</div>${caption(p.caption)}</div>`;
  }

  function renderRegistry(p) {
    return `<div class="mli-evidence-stage">${meta(p.meta || [])}<div class="mli-ev-registry"><div class="mli-ev-registry-head"><strong>${esc(p.title || 'Реестр')}</strong><span>${esc(p.subtitle || 'служебная выгрузка')}</span></div><table class="mli-ev-table"><thead><tr>${(p.columns || []).map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${(p.rows || []).map((r) => `<tr class="${r.focus ? 'is-focus' : ''}">${r.cells.map((cell) => `<td>${cell.code ? `<code>${esc(cell.text)}</code>` : esc(cell.text)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${caption(p.caption)}</div>`;
  }

  function renderEmail(p) {
    return `<div class="mli-evidence-stage">${meta(p.meta || [])}<div class="mli-ev-email"><div class="mli-ev-email-head"><small>${esc(p.date || '')}</small><h3>${esc(p.subject || '')}</h3><div class="mli-ev-email-grid"><b>От</b><span>${esc(p.from || '')}</span><b>Кому</b><span>${esc(p.to || '')}</span></div></div><div class="mli-ev-email-body">${(p.paragraphs || []).map((x) => `<p>${esc(x)}</p>`).join('')}${p.attachment ? `<div class="mli-ev-attachment"><span>▧</span><span><strong>${esc(p.attachment.name)}</strong><small>${esc(p.attachment.note || '')}</small></span></div>` : ''}</div></div>${caption(p.caption)}</div>`;
  }

  function renderCompare(p) {
    return `<div class="mli-evidence-stage">${meta(p.meta || [])}<div class="mli-ev-compare"><div class="mli-ev-file"><small>${esc(p.left.label)}</small><strong>${esc(p.left.name)}</strong><code>${esc(p.left.hash)}</code></div><div class="mli-ev-equals">=</div><div class="mli-ev-file"><small>${esc(p.right.label)}</small><strong>${esc(p.right.name)}</strong><code>${esc(p.right.hash)}</code></div></div><div class="mli-ev-verdict">${esc(p.verdict)}</div>${caption(p.caption)}</div>`;
  }

  function renderDocument(p) {
    return `<div class="mli-evidence-stage">${meta(p.meta || [])}<div class="mli-ev-document"><h3>${esc(p.title || 'Документ')}</h3><dl>${(p.fields || []).map((f) => `<dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd>`).join('')}</dl></div>${caption(p.caption)}</div>`;
  }

  function renderPresentation(material) {
    const p = material.presentation;
    if (!p) return null;
    if (p.kind === 'chat') return renderChat(p);
    if (p.kind === 'receipt') return renderReceipt(p);
    if (p.kind === 'log') return renderLog(p);
    if (p.kind === 'access') return renderAccess(p);
    if (p.kind === 'registry') return renderRegistry(p);
    if (p.kind === 'email') return renderEmail(p);
    if (p.kind === 'compare') return renderCompare(p);
    if (p.kind === 'document') return renderDocument(p);
    return null;
  }

  function enhance(materialId) {
    const material = byId.get(materialId);
    if (!material) return;
    const body = dialog.querySelector('.mli-document-body');
    if (!body || body.dataset.premiumEnhanced === materialId) return;
    const html = renderPresentation(material);
    if (!html) return;
    body.innerHTML = html;
    body.dataset.premiumEnhanced = materialId;
    dialog.querySelector('.mli-dialog-card')?.classList.add('has-premium-evidence');
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest?.('[data-material]');
    if (!trigger) return;
    pendingMaterialId = trigger.dataset.material;
    requestAnimationFrame(() => enhance(pendingMaterialId));
    setTimeout(() => enhance(pendingMaterialId), 0);
  }, true);

  const observer = new MutationObserver(() => {
    if (pendingMaterialId) enhance(pendingMaterialId);
  });
  observer.observe(dialog, { childList: true, subtree: true });

  root.MysteryLogicPremiumEvidence = { renderPresentation };
})(typeof globalThis !== 'undefined' ? globalThis : window);