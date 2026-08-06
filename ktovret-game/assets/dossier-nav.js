(() => {
  'use strict';

  const currentScript = document.currentScript;
  const root = document.querySelector('[data-ktv-root]');
  const cfg = window.KtoVretWeb || {};
  if (!root || !currentScript?.src || !cfg.case) return;

  const siteRoot = new URL('../../', currentScript.src);
  const cases = [
    { id: 'first_r3_001_four_archive_entries', number: '001', title: 'Четыре входа в архив', storageKey: 'ktovret:web:demo:v4:first_r3_001_four_archive_entries', path: 'delo/chetyre-vhoda-v-arhiv/' },
    { id: 'first_r3_002_unsynced_logs', number: '002', title: 'Три несинхронных журнала', storageKey: 'ktovret:web:demo:v4:first_r3_002_unsynced_logs', path: 'delo/tri-nesinhronnyh-zhurnala/' },
    { id: 'first_r3_003_five_folders_gap', number: '003', title: 'Пять папок и пустое место', storageKey: 'ktovret:web:demo:v4:first_r3_003_five_folders_gap', path: 'delo/pyat-papok-i-pustoe-mesto/' },
    { id: 'first_r3_004_laptop_two_exits', number: '004', title: 'Ноутбук у двух выходов', storageKey: 'ktovret:web:demo:v4:first_r3_004_laptop_two_exits', path: 'delo/noutbuk-u-dvuh-vyhodov/' },
    { id: 'first_r3_005_card_phone_route', number: '005', title: 'Карта, телефон и восемь минут', storageKey: 'ktovret:web:demo:v4:first_r3_005_card_phone_route', path: 'delo/karta-telefon-i-vosem-minut/' },
    { id: 'volume1_066', number: '066', title: 'Запись до вскрытия контейнера', storageKey: 'ktovret:web:demo:v3:volume1_066', path: 'delo/zapis-do-vskrytiya-konteynera/' },
  ];

  const readState = (storageKey) => {
    try {
      const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return state && typeof state === 'object' ? state : {};
    } catch {
      return {};
    }
  };

  const style = document.createElement('style');
  style.dataset.ktvDossierStyles = 'true';
  style.textContent = `
    .ktv-dossier-next{display:grid;gap:15px;margin-top:26px;padding:22px;border:1px solid rgba(214,177,109,.34);border-radius:20px;background:linear-gradient(145deg,rgba(214,177,109,.12),rgba(8,22,36,.48));text-align:left}
    .ktv-dossier-next-copy{display:grid;gap:6px}.ktv-dossier-next-copy small{color:#d6b16d;font-size:.72rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.ktv-dossier-next-copy strong{color:#fff;font-size:1.22rem}.ktv-dossier-next-copy p{margin:0;color:rgba(255,255,255,.7)}
    .ktv-dossier-next-actions{display:flex;flex-wrap:wrap;gap:10px}.ktv-dossier-link{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 16px;border:1px solid transparent;border-radius:14px;font-weight:900;text-decoration:none}.ktv-dossier-link-primary{background:linear-gradient(145deg,#f0d9a0,#d6b16d);color:#142231}.ktv-dossier-link-secondary{border-color:rgba(255,255,255,.14);color:rgba(255,255,255,.86);background:rgba(255,255,255,.04)}
  `;
  document.head.appendChild(style);

  const enhance = () => {
    const result = root.querySelector('#ktv-result');
    if (!result || result.dataset.dossierEnhanced === 'true') return;

    const currentIndex = cases.findIndex((item) => item.id === cfg.case.id);
    if (currentIndex < 0) return;

    result.dataset.dossierEnhanced = 'true';
    const solvedCount = cases.filter((item) => readState(item.storageKey).solved === true).length;
    const followingCases = [...cases.slice(currentIndex + 1), ...cases.slice(0, currentIndex)];
    const nextCase = followingCases.find((item) => readState(item.storageKey).solved !== true) || null;
    const archiveUrl = new URL('dela/', siteRoot).href;

    const section = document.createElement('section');
    section.className = 'ktv-dossier-next';
    section.setAttribute('aria-label', 'Продолжение первого досье');

    const copy = document.createElement('div');
    copy.className = 'ktv-dossier-next-copy';
    copy.innerHTML = `<small>Первое досье · ${solvedCount} из ${cases.length} раскрыто</small><strong>${nextCase ? 'Следующее расследование готово' : 'Открытый архив пройден'}</strong><p>${nextCase ? `Дело №${nextCase.number}: «${nextCase.title}».` : 'Все шесть доступных расследований раскрыты. Результат сохранён на этом устройстве.'}</p>`;

    const actions = document.createElement('div');
    actions.className = 'ktv-dossier-next-actions';

    const primary = document.createElement('a');
    primary.className = 'ktv-dossier-link ktv-dossier-link-primary';
    primary.href = nextCase ? new URL(nextCase.path, siteRoot).href : archiveUrl;
    primary.textContent = nextCase ? `Перейти к делу №${nextCase.number}` : 'Открыть архив';
    actions.appendChild(primary);

    if (nextCase) {
      const archive = document.createElement('a');
      archive.className = 'ktv-dossier-link ktv-dossier-link-secondary';
      archive.href = archiveUrl;
      archive.textContent = 'Все дела и прогресс';
      actions.appendChild(archive);
    }

    section.append(copy, actions);
    result.appendChild(section);
  };

  new MutationObserver(enhance).observe(root, { childList: true, subtree: true });
  enhance();
})();
