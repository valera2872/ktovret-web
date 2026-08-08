(() => {
  'use strict';

  const currentScript = document.currentScript;
  const root = document.querySelector('[data-ktv-root]');
  const cfg = window.KtoVretWeb || {};
  const model = window.MysteryLogicDossier;
  const catalog = window.KtoVretCatalog;
  if (!root || !currentScript?.src || !cfg.case || !model) return;

  const siteRoot = new URL('../../', currentScript.src);
  const archiveUrl = new URL('dela/', siteRoot).href;
  const freeCollectionUrl = new URL('ru/besplatnye-detektivnye-dela/', siteRoot).href;

  const style = document.createElement('style');
  style.dataset.ktvDossierStyles = 'true';
  style.textContent = `
    .ktv-dossier-next{display:grid;gap:15px;margin-top:26px;padding:22px;border:1px solid rgba(214,177,109,.34);border-radius:20px;background:linear-gradient(145deg,rgba(214,177,109,.12),rgba(8,22,36,.48));text-align:left}
    .ktv-dossier-next.is-complete{border-color:rgba(130,183,150,.46);background:radial-gradient(circle at 90% 10%,rgba(130,183,150,.18),transparent 32%),linear-gradient(145deg,rgba(14,43,47,.82),rgba(8,22,36,.58))}
    .ktv-dossier-next-copy{display:grid;gap:6px}.ktv-dossier-next-copy small{color:#d6b16d;font-size:.72rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.ktv-dossier-next-copy strong{color:#fff;font-size:1.22rem}.ktv-dossier-next-copy p{margin:0;color:rgba(255,255,255,.7)}
    .ktv-dossier-rank{display:flex;flex-wrap:wrap;gap:8px}.ktv-dossier-rank span{padding:7px 10px;border:1px solid rgba(255,255,255,.12);border-radius:999px;color:rgba(255,255,255,.76);font-size:.72rem}.ktv-dossier-rank span:first-child{border-color:rgba(214,177,109,.28);color:#f0d9a0;background:rgba(214,177,109,.08)}
    .ktv-dossier-next-actions{display:flex;flex-wrap:wrap;gap:10px}.ktv-dossier-link{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 16px;border:1px solid transparent;border-radius:14px;font-weight:900;text-decoration:none}.ktv-dossier-link-primary{background:linear-gradient(145deg,#f0d9a0,#d6b16d);color:#142231}.ktv-dossier-link-secondary{border-color:rgba(255,255,255,.14);color:rgba(255,255,255,.86);background:rgba(255,255,255,.04)}
    @media(max-width:620px){.ktv-dossier-next-actions{display:grid}.ktv-dossier-link{width:100%}}
  `;
  document.head.appendChild(style);

  const enhance = () => {
    const result = root.querySelector('#ktv-result');
    if (!result || result.dataset.dossierEnhanced === 'true') return;

    const records = model.readRecords(localStorage);
    const currentRecord = records.find((item) => item.id === cfg.case.id);
    if (!currentRecord) return;

    const summary = model.summarize(records);
    const nextCase = model.nextUnsolvedAfter(records, cfg.case.id);
    const currentMeta = Array.isArray(catalog?.cases) ? catalog.cases.find((item) => item.id === cfg.case.id) : null;
    const relatedIds = Array.isArray(currentMeta?.relatedCaseIds) ? currentMeta.relatedCaseIds : [];
    const relatedCases = relatedIds
      .map((id) => catalog?.cases?.find((item) => item.id === id))
      .filter((item) => item && item.access === 'free' && item.id !== nextCase?.id)
      .slice(0, 2);
    result.dataset.dossierEnhanced = 'true';

    const section = document.createElement('section');
    section.className = `ktv-dossier-next ${summary.allSolved ? 'is-complete' : ''}`;
    section.setAttribute('aria-label', 'Продолжение первого досье');

    const copy = document.createElement('div');
    copy.className = 'ktv-dossier-next-copy';
    copy.innerHTML = `
      <small>${summary.allSolved ? 'Первое досье завершено' : `Первое досье · ${summary.solvedCount} из ${summary.totalCases} раскрыто`}</small>
      <strong>${nextCase ? 'Следующее расследование готово' : 'Открытый архив пройден'}</strong>
      <p>${nextCase ? `Дело №${nextCase.number}: «${nextCase.title}».` : `Все ${summary.totalCases} доступных расследований раскрыты. Карточка следователя обновлена.`}</p>
    `;

    const rank = document.createElement('div');
    rank.className = 'ktv-dossier-rank';
    rank.innerHTML = `<span>${summary.rank}</span><span>${summary.cleanCount} чистых раскрытий</span><span>${summary.totalHints} подсказок</span>`;

    const actions = document.createElement('div');
    actions.className = 'ktv-dossier-next-actions';

    const primary = document.createElement('a');
    primary.className = 'ktv-dossier-link ktv-dossier-link-primary';
    primary.href = nextCase ? new URL(nextCase.path, siteRoot).href : archiveUrl;
    primary.textContent = nextCase ? `Перейти к делу №${nextCase.number}` : 'Открыть карточку следователя';
    actions.appendChild(primary);

    for (const related of relatedCases) {
      const link = document.createElement('a');
      link.className = 'ktv-dossier-link ktv-dossier-link-secondary';
      link.href = new URL(related.path, siteRoot).href;
      link.textContent = `Похожее: ${related.title}`;
      actions.appendChild(link);
    }

    const collection = document.createElement('a');
    collection.className = 'ktv-dossier-link ktv-dossier-link-secondary';
    collection.href = freeCollectionUrl;
    collection.textContent = '15 бесплатных дел';
    actions.appendChild(collection);

    if (nextCase) {
      const archive = document.createElement('a');
      archive.className = 'ktv-dossier-link ktv-dossier-link-secondary';
      archive.href = archiveUrl;
      archive.textContent = 'Все дела и прогресс';
      actions.appendChild(archive);
    }

    section.append(copy, rank, actions);
    result.appendChild(section);
  };

  new MutationObserver(enhance).observe(root, { childList: true, subtree: true });
  enhance();
})();
