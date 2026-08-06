(() => {
  'use strict';

  const currentScript = document.currentScript;
  if (!currentScript?.src) return;

  const siteRoot = new URL('../', currentScript.src);
  const cases = [
    { number: '001', title: 'Четыре входа в архив', storageKey: 'ktovret:web:demo:v4:first_r3_001_four_archive_entries', path: 'delo/chetyre-vhoda-v-arhiv/' },
    { number: '002', title: 'Три несинхронных журнала', storageKey: 'ktovret:web:demo:v4:first_r3_002_unsynced_logs', path: 'delo/tri-nesinhronnyh-zhurnala/' },
    { number: '003', title: 'Пять папок и пустое место', storageKey: 'ktovret:web:demo:v4:first_r3_003_five_folders_gap', path: 'delo/pyat-papok-i-pustoe-mesto/' },
    { number: '004', title: 'Ноутбук у двух выходов', storageKey: 'ktovret:web:demo:v4:first_r3_004_laptop_two_exits', path: 'delo/noutbuk-u-dvuh-vyhodov/' },
    { number: '005', title: 'Карта, телефон и восемь минут', storageKey: 'ktovret:web:demo:v4:first_r3_005_card_phone_route', path: 'delo/karta-telefon-i-vosem-minut/' },
    { number: '066', title: 'Запись до вскрытия контейнера', storageKey: 'ktovret:web:demo:v3:volume1_066', path: 'delo/zapis-do-vskrytiya-konteynera/' },
  ];

  const readState = (storageKey) => {
    try {
      const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return state && typeof state === 'object' ? state : {};
    } catch {
      return {};
    }
  };

  const records = cases.map((item) => ({ ...item, state: readState(item.storageKey) }));
  const solvedCount = records.filter((item) => item.state.solved === true).length;
  const activeCase = records.find((item) => item.state.accepted === true && item.state.solved !== true);
  const nextCase = activeCase || records.find((item) => item.state.solved !== true) || records[0];
  const allSolved = solvedCount === records.length;

  const style = document.createElement('style');
  style.dataset.dossierProgressStyles = 'true';
  style.textContent = `
    .ml-dossier-progress{display:grid;gap:16px;margin:20px 0 30px;padding:20px;border:1px solid rgba(214,177,109,.26);border-radius:22px;background:linear-gradient(145deg,rgba(214,177,109,.1),rgba(255,255,255,.025))}
    .ml-dossier-progress-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.ml-dossier-progress-copy{display:grid;gap:4px}.ml-dossier-progress-copy small{color:var(--ml-gold-2);font-weight:900;letter-spacing:.1em;text-transform:uppercase}.ml-dossier-progress-copy strong{font-size:1.15rem}.ml-dossier-progress-copy span{color:var(--ml-muted);font-size:.86rem}
    .ml-dossier-track{overflow:hidden;height:8px;border-radius:999px;background:rgba(255,255,255,.08)}.ml-dossier-track span{display:block;width:var(--dossier-progress);height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--ml-gold),var(--ml-gold-2))}
    .ml-dossier-continue{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 16px;border-radius:14px;background:linear-gradient(145deg,var(--ml-gold-2),var(--ml-gold));color:var(--ml-ink);font-weight:900;text-decoration:none}
    .case-card{position:relative}.case-card.is-solved{border-color:rgba(130,183,150,.4);box-shadow:inset 0 0 0 1px rgba(130,183,150,.08),0 18px 52px rgba(0,0,0,.2)}.case-card.is-active{border-color:rgba(214,177,109,.58)}
    .case-state{display:inline-flex;align-items:center;gap:6px;margin-left:auto;padding:6px 9px;border-radius:999px;font-size:.68rem;font-weight:900}.case-state.is-new{color:#c8d3de;background:rgba(255,255,255,.06)}.case-state.is-active{color:var(--ml-gold-2);background:rgba(214,177,109,.12)}.case-state.is-solved{color:#b7d7c2;background:rgba(130,183,150,.12)}
    .ml-product-progress{max-width:640px;margin-top:18px}@media(max-width:620px){.ml-dossier-progress-head{display:grid}.ml-dossier-continue{width:100%}}
  `;
  document.head.appendChild(style);

  const nextUrl = new URL(nextCase.path, siteRoot).href;
  const nextLabel = allSolved
    ? 'Все дела раскрыты — открыть архив'
    : activeCase
      ? `Продолжить дело №${nextCase.number}`
      : `Начать дело №${nextCase.number}`;

  document.querySelectorAll('.ml-nav-cta, .ml-button-primary').forEach((link) => {
    link.href = allSolved ? new URL('dela/', siteRoot).href : nextUrl;
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
  });

  const buildProgressPanel = (extraClass = '') => {
    const panel = document.createElement('section');
    panel.className = `ml-dossier-progress ${extraClass}`.trim();
    panel.innerHTML = `
      <div class="ml-dossier-progress-head">
        <div class="ml-dossier-progress-copy">
          <small>Прогресс на этом устройстве</small>
          <strong>${solvedCount} из ${records.length} дел раскрыто</strong>
          <span>${allSolved ? 'Открытый архив завершён.' : activeCase ? `В работе: дело №${nextCase.number}.` : `Следующее: дело №${nextCase.number}.`}</span>
        </div>
        <a class="ml-dossier-continue" href="${allSolved ? new URL('dela/', siteRoot).href : nextUrl}">${nextLabel}</a>
      </div>
      <div class="ml-dossier-track" aria-label="Раскрыто ${solvedCount} из ${records.length} дел"><span style="--dossier-progress:${(solvedCount / records.length) * 100}%"></span></div>
    `;
    return panel;
  };

  const catalogBar = document.querySelector('.catalog-bar');
  if (catalogBar && !document.querySelector('.ml-dossier-progress')) {
    catalogBar.insertAdjacentElement('afterend', buildProgressPanel());
  }

  const productActions = document.querySelector('.product .ml-actions');
  if (productActions && !document.querySelector('.ml-product-progress')) {
    productActions.insertAdjacentElement('afterend', buildProgressPanel('ml-product-progress'));
  }
})();
