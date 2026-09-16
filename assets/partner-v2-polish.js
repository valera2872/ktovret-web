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

  const apply = () => {
    scheduled = false;
    addThirdPhotoObservation();
    regroupEvidence();
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
