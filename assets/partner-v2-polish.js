(() => {
  'use strict';

  const root = document.querySelector('[data-partner-v2-app]');
  if (!root) return;

  const chapterMeta = {
    2: { title: '16 минут', kicker: 'Глава 2' },
    3: { title: 'ТК-0', kicker: 'Глава 3' },
    4: { title: 'Операция', kicker: 'Глава 4' },
    5: { title: 'Кто создал схему', kicker: 'Глава 5' },
  };

  const evidenceChapter = {
    M04: 2, M05: 2, G04: 2,
    M06: 3, G05: 3, G06: 3,
    M07: 4, M08: 4, G07: 4, G08: 4, G09: 4,
    M09: 5, M10: 5, G10: 5, G11: 5, G12: 5,
  };

  const editorialFacts = {
    M09: [
      'ТК-0 находился в сервисном боксе 3 за три дня до происшествия',
      'Инициатор перемещения в бокс: I. MARKOVA',
      '01:32 — ТК-0 выдан D. RYBAKOV'
    ],
    G10: [
      'I. MARKOVA открывала карточку CAXU за три дня и повторно в ночь происшествия',
      'После первого просмотра оформлено перемещение ТК-0 в сервисный бокс 3'
    ],
    G12: [
      'После предъявления телеметрии Рыбаков изменил объяснение операции',
      'R-4 дважды зафиксировал нагрузку около 8,4 т'
    ]
  };

  let scheduled = false;

  const addThirdPhotoObservation = () => {
    const gate = root.querySelector('[data-partner-v2-gate][data-checkpoint="photo_observation"]');
    if (!gate || gate.querySelector('[data-photo-field="door_deformation"]')) return;

    const grid = gate.querySelector('.partner-v2-observation-grid');
    if (!grid) return;

    const row = document.createElement('label');
    row.className = 'partner-v2-observation-row';
    row.innerHTML = `
      <span>Деформация правой створки двери</span>
      <select data-photo-field="door_deformation">
        <option value="">Выберите</option>
        <option value="present">Есть</option>
        <option value="absent">Нет</option>
        <option value="unsure">Не уверен</option>
      </select>`;
    grid.appendChild(row);
  };

  const fixPhotoInstructionCopy = () => {
    const gate = root.querySelector('[data-partner-v2-gate][data-checkpoint="photo_observation"]');
    if (!gate) return;
    for (const node of gate.querySelectorAll('.partner-v2-gate-notice')) {
      if (node.textContent?.includes('Отметьте оба признака')) {
        node.textContent = 'Отметьте все три признака перед фиксацией.';
      }
    }
  };

  const forensicPhotoHtml = (id) => {
    const departure = id === 'G02';
    const sceneClass = departure ? 'is-departure' : 'is-arrival';
    const camera = departure ? 'NORTH / CONTROL C-04' : 'SOUTH / GATE CAM 04';
    const time = departure ? '00:39:51' : '03:07:41';
    const frame = departure ? 'FRAME 118204' : 'FRAME 044719';
    const patch = departure ? '<i class="partner-v2-weld-patch" aria-hidden="true"></i>' : '';
    const scratch = departure ? '<i class="partner-v2-body-scratch" aria-hidden="true"></i>' : '';
    const deformation = departure ? '' : '<i class="partner-v2-door-deformation" aria-hidden="true"></i>';

    return `<figure class="partner-v2-forensic-photo ${sceneClass}" data-forensic-photo="${id}">
      <div class="partner-v2-photo-meta"><span>${camera}</span><span>${time}</span></div>
      <div class="partner-v2-photo-yard">
        <div class="partner-v2-container-body">
          <i class="partner-v2-door-seam" aria-hidden="true"></i>
          <i class="partner-v2-lockbar b1" aria-hidden="true"></i>
          <i class="partner-v2-lockbar b2" aria-hidden="true"></i>
          <i class="partner-v2-lockbar b3" aria-hidden="true"></i>
          <i class="partner-v2-lockbar b4" aria-hidden="true"></i>
          <span class="partner-v2-container-number"><small>CAXU</small>771204<br>2</span>
          ${patch}${scratch}${deformation}
        </div>
      </div>
      <figcaption class="partner-v2-photo-caption"><span>${frame}</span><span>ARCHIVE / READ ONLY</span></figcaption>
    </figure>`;
  };

  const renderForensicPhotos = () => {
    for (const id of ['G02', 'M05']) {
      const card = root.querySelector(`.partner-v2-evidence[data-evidence-id="${id}"]`);
      if (!card || card.querySelector('[data-forensic-photo]')) continue;
      const placeholder = card.querySelector('.partner-v2-photo-placeholder');
      if (!placeholder) continue;
      placeholder.outerHTML = forensicPhotoHtml(id);
    }
  };

  const neutralizeEditorialFacts = () => {
    for (const [id, facts] of Object.entries(editorialFacts)) {
      const card = root.querySelector(`.partner-v2-evidence[data-evidence-id="${id}"]`);
      const box = card?.querySelector('.partner-v2-facts');
      if (!box || box.dataset.editorialNeutral === '1') continue;
      box.innerHTML = facts.map((fact) => `<span>${fact}</span>`).join('');
      box.dataset.editorialNeutral = '1';
    }
  };

  const enrichSealMechanic = () => {
    const card = root.querySelector('.partner-v2-evidence[data-evidence-id="G10"]');
    if (!card || card.querySelector('[data-partner-v2-seal-note]')) return;
    const facts = card.querySelector('.partner-v2-facts');
    const note = document.createElement('p');
    note.dataset.partnerV2SealNote = '1';
    note.innerHTML = '<strong>Контроль пломбы:</strong> при приёмке сверяется читаемый номер с карточкой груза. Отдельной проверки уникальности физической пломбы система не выполняет.';
    if (facts) card.insertBefore(note, facts);
    else card.appendChild(note);
  };

  const regroupEvidence = () => {
    const packet = root.querySelector('.partner-v2-new-packet');
    if (!packet) return;

    const cards = [...packet.querySelectorAll('.partner-v2-evidence[data-evidence-id]')];
    if (!cards.length) return;

    const signature = cards.map((card) => card.dataset.evidenceId || '').join('|');
    if (packet.dataset.chapterGroups === signature && packet.querySelector('[data-partner-v2-chapter-packet]')) return;

    const buckets = new Map();
    for (const card of cards) {
      const chapter = evidenceChapter[card.dataset.evidenceId || ''];
      if (!chapter) continue;
      if (!buckets.has(chapter)) buckets.set(chapter, []);
      buckets.get(chapter).push(card);
    }

    if (!buckets.size) return;

    packet.innerHTML = '';
    packet.dataset.chapterGroups = signature;

    for (const chapter of [...buckets.keys()].sort((a, b) => a - b)) {
      const meta = chapterMeta[chapter] || { title: `Глава ${chapter}`, kicker: `Глава ${chapter}` };
      const section = document.createElement('section');
      section.className = 'partner-v2-chapter-packet';
      section.dataset.partnerV2ChapterPacket = String(chapter);

      const heading = document.createElement('div');
      heading.className = 'partner-v2-chapter-packet-head';
      heading.innerHTML = `<p class="partner-v2-kicker">${meta.kicker}</p><h2>${meta.title}</h2>`;

      const grid = document.createElement('div');
      grid.className = 'partner-v2-evidence-grid';
      for (const card of buckets.get(chapter)) grid.appendChild(card);

      section.append(heading, grid);
      packet.appendChild(section);
    }
  };

  const mountDebrief = () => {
    const solved = root.querySelector('.partner-v2-final.is-solved');
    if (!solved || solved.querySelector('[data-partner-v2-debrief]')) return;

    solved.insertAdjacentHTML('beforeend', `
      <section class="partner-v2-debrief" data-partner-v2-debrief>
        <p class="partner-v2-kicker">Разбор ложных следов</p>
        <h3>Почему ложь не равнялась вине</h3>
        <p>Несколько людей скрывали важные обстоятельства. Но только совокупность независимых следов связывает подготовку, временное окно и физическую подмену в одну операцию.</p>
        <div class="partner-v2-debrief-grid">
          <div class="partner-v2-debrief-item"><b>Николай Савельев</b><span>Солгал о GUEST-07, поэтому выглядел причастным. Но поздние материалы не связывают этот визит ни с ТК-0, ни с Вектором-12, ни с R-4.</span></div>
          <div class="partner-v2-debrief-item"><b>Анна Волкова</b><span>Скрыла ручной HOLD и сослалась на автоматику. Это объясняет возможность остановки, но не подготовку двойника и не доступ к параметрам цели.</span></div>
          <div class="partner-v2-debrief-item"><b>Павел Нестеров</b><span>Работал через OPS.SHARED и L-14, но его сессии не покрывают 01:47–01:49, а карточку CAXU он не открывал.</span></div>
          <div class="partner-v2-debrief-item"><b>Денис Рыбаков</b><span>Менял объяснение после предъявления телеметрии и физически участвовал в операции. Но след предварительной подготовки и выбора цели начинается раньше и ведёт не к нему.</span></div>
        </div>
      </section>`);
  };

  const apply = () => {
    scheduled = false;
    addThirdPhotoObservation();
    fixPhotoInstructionCopy();
    regroupEvidence();
    renderForensicPhotos();
    neutralizeEditorialFacts();
    enrichSealMechanic();
    mountDebrief();
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(apply);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  schedule();

  window.addEventListener('beforeunload', () => observer.disconnect());
})();
