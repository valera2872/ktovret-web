(() => {
  'use strict';

  const root = document.querySelector('[data-ktv-root]');
  const caseData = window.KtoVretWeb?.case || {};
  if (!root || !caseData) return;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const witnessLabel = (count) => {
    const n = Number(count) || 0;
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n} свидетель`;
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return `${n} свидетеля`;
    return `${n} свидетелей`;
  };

  const enhance = () => {
    const cover = root.querySelector('.ktv-cover');
    if (!cover || cover.dataset.caseEntryReference === 'true') return;

    const fileLine = cover.querySelector('.ktv-file-line');
    const eyebrow = cover.querySelector('.ktv-cover-copy > .ktv-eyebrow');
    const lead = cover.querySelector('.ktv-cover-lead');
    const button = cover.querySelector('[data-action="accept"]');
    const actionNote = cover.querySelector('.ktv-cover-actions > span');
    const grid = cover.querySelector('.ktv-cover-grid');

    if (fileLine) {
      const parts = fileLine.querySelectorAll('span');
      if (parts[0]) parts[0].textContent = `Досье ${caseData.caseNumber || ''}`.trim();
      if (parts[1]) parts[1].textContent = 'Статус: не раскрыто';
    }
    if (eyebrow) eyebrow.textContent = 'Новое дело · вам поручено расследование';
    if (lead) lead.textContent = 'Изучите материалы и показания, восстановите картину событий и найдите версию, которая не выдерживает проверки фактами.';
    if (button) button.textContent = 'Открыть материалы дела';
    if (actionNote) actionNote.textContent = `Без регистрации · около ${caseData.estimatedMinutes || 7} минут`;

    if (grid && !grid.querySelector('.ktv-cover-dossier')) {
      const dossier = document.createElement('aside');
      dossier.className = 'ktv-cover-dossier';
      dossier.setAttribute('aria-label', 'Задача следователя');
      dossier.innerHTML = `
        <small>Задача следователя</small>
        <h2>${escapeHtml(caseData.question || 'Кто говорит неправду?')}</h2>
        <p>Все данные для решения уже находятся в деле. Не угадывайте — проверяйте каждую версию по материалам.</p>
        <div class="ktv-entry-checklist">
          <span><b>01</b> Откройте материалы дела</span>
          <span><b>02</b> Сопоставьте показания</span>
          <span><b>03</b> Докажите противоречие</span>
        </div>
        <div class="ktv-entry-foot"><span>${escapeHtml(witnessLabel(caseData.witnessCount))}</span><span>${escapeHtml(caseData.difficulty || 'Логическое дело')}</span></div>
      `;
      grid.appendChild(dossier);
    }

    cover.dataset.caseEntryReference = 'true';
  };

  const observer = new MutationObserver(enhance);
  observer.observe(root, { childList: true, subtree: true });
  enhance();
})();
