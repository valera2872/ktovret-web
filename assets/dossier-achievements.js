(() => {
  'use strict';

  const currentScript = document.currentScript;
  if (!currentScript?.src) return;

  let waitAttempts = 0;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const firstCompletionFor = (record) => {
    const state = record?.state || {};
    if (state.solved !== true) return { completed: false, hints: 0, clean: false };

    const achievement = record?.achievement || {};
    const hasPermanentRecord = Boolean(achievement.firstCompletionAt)
      || Object.prototype.hasOwnProperty.call(achievement, 'firstCompletionClean');
    const attempts = Math.max(1, Number(
      hasPermanentRecord ? achievement.firstCompletionAttempts : state.attempts,
    ) || 1);
    const hints = Math.max(0, Number(
      hasPermanentRecord ? achievement.firstCompletionHints : state.hintsUsed,
    ) || 0);
    const clean = hasPermanentRecord
      ? achievement.firstCompletionClean === true
      : state.firstAnswerCorrect === true && attempts === 1 && hints === 0;

    return { completed: true, hints, clean };
  };

  const start = () => {
    const model = window.MysteryLogicDossier;
    if (!model || document.querySelector('[data-ml-achievements]')) return Boolean(model);

    let records;
    try {
      records = model.readRecords(localStorage);
    } catch {
      records = model.readRecords();
    }

    const summary = model.summarize(records);
    const completions = records.map(firstCompletionFor).filter((item) => item.completed);
    const noHintCount = completions.filter((item) => item.hints === 0).length;
    const tokens = summary.solvedCount + summary.cleanCount;
    const maxTokens = summary.totalCases * 2;
    const definitions = [
      { id: 'first_case', icon: 'I', title: 'Первое дело', description: 'Раскрыть первое расследование.', current: summary.solvedCount, target: 1 },
      { id: 'first_clean', icon: '✓', title: 'Чистая версия', description: 'Раскрыть дело с первой попытки без подсказок.', current: summary.cleanCount, target: 1 },
      { id: 'three_cases', icon: 'III', title: 'Серия расследований', description: 'Раскрыть три дела.', current: summary.solvedCount, target: 3 },
      { id: 'three_no_hints', icon: '◇', title: 'Холодная голова', description: 'Три первых прохождения без подсказок.', current: noHintCount, target: 3 },
      { id: 'dossier_complete', icon: '★', title: 'Архив закрыт', description: 'Раскрыть все дела первого досье.', current: summary.solvedCount, target: summary.totalCases },
      { id: 'perfect_dossier', icon: '✦', title: 'Безупречное досье', description: 'Раскрыть все дела чисто с первой попытки.', current: summary.cleanCount, target: summary.totalCases },
    ].map((item) => ({
      ...item,
      unlocked: item.current >= item.target,
      progress: Math.min(1, item.current / item.target),
    }));

    const unlocked = definitions.filter((item) => item.unlocked);
    const next = definitions.find((item) => !item.unlocked) || null;
    const siteRoot = new URL('../', currentScript.src);
    const archiveUrl = new URL('dela/', siteRoot).href;

    const style = document.createElement('style');
    style.dataset.mlAchievementStyles = 'true';
    style.textContent = `
      .ml-achievements{display:grid;gap:18px;margin:0 0 34px;padding:22px;border:1px solid rgba(214,177,109,.22);border-radius:24px;background:linear-gradient(145deg,rgba(16,38,60,.96),rgba(7,18,30,.98));box-shadow:0 22px 60px rgba(0,0,0,.2)}
      .ml-achievements-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.ml-achievements-copy{display:grid;gap:5px}.ml-achievements-copy small{color:var(--ml-gold-2);font-size:.72rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.ml-achievements-copy h2{margin:0;font-size:clamp(1.45rem,4vw,2rem)}.ml-achievements-copy p{max-width:680px;margin:0;color:var(--ml-muted)}
      .ml-token-badge{display:grid;justify-items:end;gap:2px;min-width:118px;padding:11px 13px;border:1px solid rgba(214,177,109,.26);border-radius:16px;background:rgba(214,177,109,.09)}.ml-token-badge strong{color:var(--ml-gold-2);font-size:1.35rem}.ml-token-badge span{color:var(--ml-muted);font-size:.68rem}
      .ml-achievement-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.ml-achievement{display:grid;grid-template-columns:auto 1fr;gap:11px;align-items:start;padding:15px;border:1px solid var(--ml-line);border-radius:17px;background:rgba(255,255,255,.025)}.ml-achievement.is-unlocked{border-color:rgba(130,183,150,.36);background:linear-gradient(145deg,rgba(130,183,150,.1),rgba(255,255,255,.025))}.ml-achievement-icon{display:grid;place-items:center;width:38px;height:38px;border:1px solid var(--ml-line);border-radius:50%;color:#8795a3;background:rgba(255,255,255,.035);font-size:.75rem;font-weight:950}.ml-achievement.is-unlocked .ml-achievement-icon{border-color:rgba(130,183,150,.4);color:#c6e3d0;background:rgba(130,183,150,.12)}.ml-achievement-copy{display:grid;gap:4px}.ml-achievement-copy strong{font-size:.9rem}.ml-achievement-copy p{margin:0;color:var(--ml-muted);font-size:.72rem;line-height:1.4}.ml-achievement-progress{color:#9dabb8;font-size:.66rem;font-weight:850}.ml-achievement.is-unlocked .ml-achievement-progress{color:#b7d7c2}
      .ml-next-achievement{display:grid;gap:8px;padding:14px 15px;border:1px solid rgba(214,177,109,.18);border-radius:16px;background:rgba(214,177,109,.055)}.ml-next-achievement-head{display:flex;justify-content:space-between;gap:12px;color:#dce5ed;font-size:.78rem}.ml-next-achievement-head span{color:var(--ml-muted)}.ml-next-track{height:7px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.07)}.ml-next-track span{display:block;width:var(--achievement-progress);height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--ml-gold),var(--ml-gold-2))}
      .ml-reward-summary{display:flex;flex-wrap:wrap;justify-content:space-between;gap:14px;align-items:center;max-width:680px;margin-top:14px;padding:16px 18px;border:1px solid rgba(214,177,109,.2);border-radius:18px;background:rgba(214,177,109,.06)}.ml-reward-summary strong,.ml-reward-summary span{display:block}.ml-reward-summary strong{color:var(--ml-gold-2)}.ml-reward-summary span{margin-top:3px;color:var(--ml-muted);font-size:.76rem}.ml-reward-summary a{color:#eef3f7;font-weight:850;text-underline-offset:4px}
      @media(max-width:900px){.ml-achievement-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:620px){.ml-achievements-head{display:grid}.ml-token-badge{justify-items:start}.ml-achievement-grid{grid-template-columns:1fr}.ml-reward-summary{display:grid}}
    `;
    document.head.appendChild(style);

    const catalogProfile = document.querySelector('.catalog-bar ~ .ml-investigator-card');
    if (catalogProfile) {
      const section = document.createElement('section');
      section.className = 'ml-achievements';
      section.dataset.mlAchievements = 'true';
      section.setAttribute('aria-label', 'Знаки отличия');
      section.innerHTML = `
        <div class="ml-achievements-head">
          <div class="ml-achievements-copy">
            <small>Поощрения первого досье</small>
            <h2>Знаки отличия</h2>
            <p>Один жетон начисляется за раскрытое дело и ещё один — за чистое первое прохождение. Повторные попытки не переписывают награды.</p>
          </div>
          <div class="ml-token-badge"><strong>${tokens}/${maxTokens}</strong><span>детективных жетонов</span></div>
        </div>
        <div class="ml-achievement-grid">
          ${definitions.map((item) => `
            <article class="ml-achievement ${item.unlocked ? 'is-unlocked' : ''}">
              <span class="ml-achievement-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
              <div class="ml-achievement-copy">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.description)}</p>
                <span class="ml-achievement-progress">${item.unlocked ? 'Получено' : `${item.current} из ${item.target}`}</span>
              </div>
            </article>
          `).join('')}
        </div>
        ${next ? `
          <div class="ml-next-achievement">
            <div class="ml-next-achievement-head"><strong>Следующая награда: ${escapeHtml(next.title)}</strong><span>${next.current}/${next.target}</span></div>
            <div class="ml-next-track"><span style="--achievement-progress:${next.progress * 100}%"></span></div>
          </div>
        ` : '<div class="ml-next-achievement"><div class="ml-next-achievement-head"><strong>Все знаки отличия получены</strong><span>6/6</span></div></div>'}
      `;
      catalogProfile.insertAdjacentElement('afterend', section);
      return true;
    }

    const productProfile = document.querySelector('.ml-product-profile');
    if (productProfile) {
      const summaryCard = document.createElement('section');
      summaryCard.className = 'ml-reward-summary';
      summaryCard.dataset.mlAchievements = 'true';
      summaryCard.innerHTML = `
        <div><strong>${tokens} из ${maxTokens} жетонов</strong><span>${unlocked.length} из ${definitions.length} знаков отличия получено</span></div>
        <a href="${archiveUrl}">Открыть награды в архиве</a>
      `;
      productProfile.insertAdjacentElement('afterend', summaryCard);
      return true;
    }

    return false;
  };

  const waitForModel = () => {
    if (start()) return;
    waitAttempts += 1;
    if (waitAttempts < 80) setTimeout(waitForModel, 50);
  };

  waitForModel();
})();
