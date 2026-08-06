(() => {
  'use strict';

  const currentScript = document.currentScript;
  const model = window.MysteryLogicDossier;
  if (!currentScript?.src || !model) return;

  const siteRoot = new URL('../', currentScript.src);
  const records = model.readRecords(localStorage);
  const summary = model.summarize(records);

  const randomValue = (() => {
    try {
      if (crypto?.getRandomValues) {
        const value = new Uint32Array(1);
        crypto.getRandomValues(value);
        return value[0] / 4294967296;
      }
    } catch {
      // Fall back to Math.random in restrictive browsers.
    }
    return Math.random();
  })();

  const randomCase = model.pickRandomCase(records, randomValue);
  const nextCase = summary.nextCase;
  const archiveUrl = new URL('dela/', siteRoot).href;
  const nextUrl = nextCase ? new URL(nextCase.path, siteRoot).href : archiveUrl;
  const randomUrl = randomCase ? new URL(randomCase.path, siteRoot).href : archiveUrl;
  const nextLabel = summary.allSolved
    ? 'Все дела раскрыты — открыть архив'
    : summary.activeCase
      ? `Продолжить дело №${nextCase.number}`
      : `Начать дело №${nextCase.number}`;

  const style = document.createElement('style');
  style.dataset.dossierProgressStyles = 'true';
  style.textContent = `
    .ml-dossier-progress{display:grid;gap:16px;margin:20px 0 18px;padding:20px;border:1px solid rgba(214,177,109,.26);border-radius:22px;background:linear-gradient(145deg,rgba(214,177,109,.1),rgba(255,255,255,.025))}
    .ml-dossier-progress-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.ml-dossier-progress-copy{display:grid;gap:4px}.ml-dossier-progress-copy small{color:var(--ml-gold-2);font-weight:900;letter-spacing:.1em;text-transform:uppercase}.ml-dossier-progress-copy strong{font-size:1.15rem}.ml-dossier-progress-copy span{color:var(--ml-muted);font-size:.86rem}
    .ml-dossier-track{overflow:hidden;height:8px;border-radius:999px;background:rgba(255,255,255,.08)}.ml-dossier-track span{display:block;width:var(--dossier-progress);height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--ml-gold),var(--ml-gold-2));transition:width .35s ease}
    .ml-dossier-continue,.ml-profile-action{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 16px;border:1px solid transparent;border-radius:14px;font-weight:900;text-decoration:none;cursor:pointer;font:inherit}.ml-dossier-continue,.ml-profile-action-primary{background:linear-gradient(145deg,var(--ml-gold-2),var(--ml-gold));color:var(--ml-ink)}.ml-profile-action-secondary{border-color:var(--ml-line);background:rgba(255,255,255,.035);color:#e5edf4}.ml-profile-action-quiet{border-color:transparent;background:transparent;color:var(--ml-muted);text-decoration:underline;text-underline-offset:4px}
    .case-card{position:relative}.case-card.is-solved{border-color:rgba(130,183,150,.4);box-shadow:inset 0 0 0 1px rgba(130,183,150,.08),0 18px 52px rgba(0,0,0,.2)}.case-card.is-active{border-color:rgba(214,177,109,.58)}
    .case-state{display:inline-flex;align-items:center;gap:6px;margin-left:auto;padding:6px 9px;border-radius:999px;font-size:.68rem;font-weight:900}.case-state.is-new{color:#c8d3de;background:rgba(255,255,255,.06)}.case-state.is-active{color:var(--ml-gold-2);background:rgba(214,177,109,.12)}.case-state.is-solved{color:#b7d7c2;background:rgba(130,183,150,.12)}
    .case-result-note{margin:-6px 0 0!important;color:#aebbc7!important;font-size:.74rem!important}
    .ml-investigator-card{position:relative;display:grid;gap:18px;margin:0 0 30px;padding:22px;overflow:hidden;border:1px solid rgba(214,177,109,.24);border-radius:24px;background:linear-gradient(145deg,rgba(18,42,65,.98),rgba(7,18,30,.98));box-shadow:0 22px 60px rgba(0,0,0,.22)}
    .ml-investigator-card.is-complete{border-color:rgba(130,183,150,.42);background:radial-gradient(circle at 88% 12%,rgba(130,183,150,.17),transparent 30%),linear-gradient(145deg,rgba(18,42,65,.98),rgba(7,18,30,.98))}.ml-investigator-seal{position:absolute;right:-18px;top:-20px;display:grid;place-items:center;width:112px;height:112px;border:1px solid rgba(214,177,109,.25);border-radius:50%;color:rgba(214,177,109,.16);font-size:2rem;font-weight:950;transform:rotate(9deg)}
    .ml-investigator-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;position:relative}.ml-investigator-copy{display:grid;gap:5px}.ml-investigator-copy small{color:var(--ml-gold-2);font-size:.72rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.ml-investigator-copy h2{margin:0;font-size:clamp(1.45rem,4vw,2rem)}.ml-investigator-copy p{max-width:650px;margin:0;color:var(--ml-muted)}.ml-rank-badge{padding:9px 12px;border:1px solid rgba(214,177,109,.25);border-radius:999px;background:rgba(214,177,109,.09);color:var(--ml-gold-2);font-size:.72rem;font-weight:900;white-space:nowrap}
    .ml-profile-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;overflow:hidden;border:1px solid var(--ml-line);border-radius:18px;background:var(--ml-line)}.ml-profile-stats div{padding:15px;background:rgba(7,18,30,.82)}.ml-profile-stats strong,.ml-profile-stats span{display:block}.ml-profile-stats strong{color:#fff;font-size:1.35rem}.ml-profile-stats span{margin-top:3px;color:var(--ml-muted);font-size:.68rem}
    .ml-profile-actions{display:flex;flex-wrap:wrap;gap:9px;align-items:center}.ml-product-progress{max-width:680px;margin-top:18px}
    @media(max-width:760px){.ml-profile-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ml-profile-stats div:last-child{grid-column:1/-1}.ml-investigator-head{display:grid}.ml-rank-badge{justify-self:start}}
    @media(max-width:620px){.ml-dossier-progress-head{display:grid}.ml-dossier-continue,.ml-profile-action{width:100%}.ml-profile-actions{display:grid}.ml-investigator-seal{opacity:.55}}
    @media(prefers-reduced-motion:reduce){.ml-dossier-track span{transition:none}}
  `;
  document.head.appendChild(style);

  document.querySelectorAll('.ml-nav-cta, .ml-button-primary').forEach((link) => {
    link.href = summary.allSolved ? archiveUrl : nextUrl;
    link.textContent = nextLabel;
  });

  document.querySelectorAll('.case-card').forEach((card) => {
    const link = card.querySelector('a[href]');
    if (!link) return;

    const record = records.find((item) => link.href === new URL(item.path, siteRoot).href);
    if (!record) return;

    const solved = record.state.solved === true;
    const active = record.state.accepted === true && !solved;
    card.classList.toggle('is-solved', solved);
    card.classList.toggle('is-active', active);

    const status = document.createElement('span');
    status.className = `case-state ${solved ? 'is-solved' : active ? 'is-active' : 'is-new'}`;
    status.textContent = solved ? '✓ Раскрыто' : active ? '● В работе' : '○ Новое';
    card.querySelector('.case-head')?.appendChild(status);

    link.textContent = solved ? 'Открыть снова' : active ? 'Продолжить дело' : 'Открыть дело';

    if (solved) {
      const note = document.createElement('p');
      note.className = 'case-result-note';
      const attempts = Number(record.state.attempts || 0);
      const hints = Number(record.state.hintsUsed || 0);
      const minutes = model.elapsedMinutes(record.state);
      note.textContent = `${attempts} ${attempts === 1 ? 'попытка' : 'попытки'} · ${hints} подсказок${minutes ? ` · ${minutes} мин` : ''}`;
      link.before(note);
    }
  });

  const buildProgressPanel = (extraClass = '') => {
    const panel = document.createElement('section');
    panel.className = `ml-dossier-progress ${extraClass}`.trim();
    panel.innerHTML = `
      <div class="ml-dossier-progress-head">
        <div class="ml-dossier-progress-copy">
          <small>Прогресс на этом устройстве</small>
          <strong>${summary.solvedCount} из ${summary.totalCases} дел раскрыто</strong>
          <span>${summary.allSolved ? 'Открытый архив завершён.' : summary.activeCase ? `В работе: дело №${nextCase.number}.` : `Следующее: дело №${nextCase.number}.`}</span>
        </div>
        <a class="ml-dossier-continue" href="${summary.allSolved ? archiveUrl : nextUrl}">${nextLabel}</a>
      </div>
      <div class="ml-dossier-track" aria-label="Раскрыто ${summary.solvedCount} из ${summary.totalCases} дел"><span style="--dossier-progress:${(summary.solvedCount / summary.totalCases) * 100}%"></span></div>
    `;
    return panel;
  };

  const buildProfile = (extraClass = '') => {
    const card = document.createElement('section');
    card.className = `ml-investigator-card ${summary.allSolved ? 'is-complete' : ''} ${extraClass}`.trim();
    card.setAttribute('aria-label', 'Карточка следователя');
    card.innerHTML = `
      <div class="ml-investigator-seal" aria-hidden="true">ML</div>
      <div class="ml-investigator-head">
        <div class="ml-investigator-copy">
          <small>${summary.allSolved ? 'Первое досье завершено' : 'Карточка следователя'}</small>
          <h2>${summary.rank}</h2>
          <p>${summary.allSolved ? 'Все доступные расследования раскрыты. Результат сохранён в этом браузере.' : 'Ранг повышается по мере раскрытия дел. Чистое раскрытие — верный ответ с первой попытки без подсказок.'}</p>
        </div>
        <span class="ml-rank-badge">${summary.solvedCount}/${summary.totalCases} раскрыто</span>
      </div>
      <div class="ml-profile-stats">
        <div><strong>${summary.solvedCount}</strong><span>раскрыто</span></div>
        <div><strong>${summary.cleanCount}</strong><span>чистых</span></div>
        <div><strong>${summary.totalAttempts}</strong><span>попыток</span></div>
        <div><strong>${summary.totalHints}</strong><span>подсказок</span></div>
        <div><strong>${summary.totalMinutes || '—'}</strong><span>${summary.totalMinutes ? 'минут' : 'время'}</span></div>
      </div>
      <div class="ml-profile-actions">
        <a class="ml-profile-action ml-profile-action-primary" href="${summary.allSolved ? archiveUrl : nextUrl}">${summary.allSolved ? 'Открыть завершённый архив' : nextLabel}</a>
        <a class="ml-profile-action ml-profile-action-secondary" href="${randomUrl}">${summary.allSolved ? 'Случайное дело' : 'Случайное нераскрытое дело'}</a>
        <button class="ml-profile-action ml-profile-action-secondary" type="button" data-dossier-action="share">Поделиться результатом</button>
        <button class="ml-profile-action ml-profile-action-quiet" type="button" data-dossier-action="reset">Сбросить прогресс</button>
      </div>
    `;
    return card;
  };

  const catalogBar = document.querySelector('.catalog-bar');
  if (catalogBar && !document.querySelector('.ml-dossier-progress')) {
    const progress = buildProgressPanel();
    catalogBar.insertAdjacentElement('afterend', progress);
    progress.insertAdjacentElement('afterend', buildProfile());
  }

  const productActions = document.querySelector('.product .ml-actions');
  if (productActions && !document.querySelector('.ml-product-progress')) {
    const progress = buildProgressPanel('ml-product-progress');
    productActions.insertAdjacentElement('afterend', progress);
    progress.insertAdjacentElement('afterend', buildProfile('ml-product-profile'));
  }

  const shareResult = async () => {
    const text = model.buildShareText(summary);
    const url = archiveUrl;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Первое досье Mystery Logic', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Результат и ссылка скопированы.');
    } catch (error) {
      if (error?.name !== 'AbortError') prompt('Скопируйте результат:', `${text}\n${url}`);
    }
  };

  document.addEventListener('click', async (event) => {
    const control = event.target.closest('[data-dossier-action]');
    if (!control) return;

    if (control.dataset.dossierAction === 'share') {
      await shareResult();
      return;
    }

    if (control.dataset.dossierAction === 'reset') {
      const confirmed = confirm('Сбросить прогресс всех шести дел на этом устройстве? Это действие нельзя отменить.');
      if (!confirmed) return;
      model.clearProgress(localStorage);
      location.reload();
    }
  });
})();
