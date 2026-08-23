(() => {
  'use strict';

  const IDENTIFIERS = [
    { legacy: 'H-409', public: 'H-7C4' },
    { legacy: 'L-409', public: 'L-6B2' },
    { legacy: 'L-407', public: 'L-4A8' },
    { legacy: 'S-407', public: 'S-8D1' }
  ];
  const PHRASES = [
    { legacy: 'верный код Марты + осознанная цифра 9', public: 'штатная duress-вариация персонального PIN Марты' },
    { legacy: 'цифру 9', public: 'duress-вариацию PIN' },
    { legacy: 'цифра 9', public: 'duress-вариант PIN' },
    { legacy: 'BR-220: волокна футляра и ювелирный воск в бельевой тележке', public: 'BR-220 + NS-17: материал футляра и фрагмент уникальной пломбы в тележке' },
    { legacy: 'NIGHT-MGR + ER-02: камера B1 заранее отключена устройством Елены', public: 'CAM G1 + NIGHT-MGR: Елена лично за рулём после управляемого окна камеры B1' },
    { legacy: 'Удалённый черновик + два билета: Марта и Елена согласовали время побега', public: 'Переписка до 01:12 + два билета: Марта и Елена заранее согласовали временное окно' },
    { legacy: 'По служебному маршруту вынесли именно футляр сапфира', public: 'По служебному маршруту прошёл опломбированный футляр сапфира' },
    { legacy: 'BR-220 — контрольный образец подкладки настоящего футляра. Его волокна в тележке превращают маршрут часов и HK-44 из маршрута человека в доказанный путь украденного футляра.', public: 'BR-220 был опломбирован вместе с сапфиром пломбой NS-17. Материал футляра и фрагмент именно NS-17 в тележке связывают служебный маршрут с опломбированным футляром, а не просто с человеком.' }
  ];
  const root = document.querySelector('[data-case407-app]');

  const replaceInValue = (value) => {
    if (typeof value !== 'string') return value;
    const withIds = IDENTIFIERS.reduce((text, pair) => text.replaceAll(pair.legacy, pair.public), value);
    return PHRASES.reduce((text, pair) => text.replaceAll(pair.legacy, pair.public), withIds);
  };
  const migrateStory = (value, seen = new WeakSet()) => {
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return value;
    seen.add(value);
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (typeof value[index] === 'string') value[index] = replaceInValue(value[index]);
        else migrateStory(value[index], seen);
      }
      return value;
    }
    for (const key of Object.keys(value)) {
      if (typeof value[key] === 'string') value[key] = replaceInValue(value[key]);
      else migrateStory(value[key], seen);
    }
    return value;
  };

  if (window.MLCase407) migrateStory(window.MLCase407);
  if (!root) return;

  const normalize = (value = '') => String(value).trim().toUpperCase().replace(/[–—−]/g, '-').replace(/\s+/g, '');
  const publicToLegacy = new Map(IDENTIFIERS.map((pair) => [pair.public, pair.legacy]));
  const translateInputForLegacyRuntime = (event) => {
    const input = event.target?.closest?.('[data-handoff-input][data-handoff-key="stage1"]')
      || root.querySelector('[data-handoff-input][data-handoff-key="stage1"]');
    if (!input) return;
    const legacy = publicToLegacy.get(normalize(input.value));
    if (legacy) input.value = legacy;
  };

  root.addEventListener('click', (event) => {
    if (event.target?.closest?.('[data-action="handoff"][data-handoff-key="stage1"]')) translateInputForLegacyRuntime(event);
  }, true);
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target?.matches?.('[data-handoff-input][data-handoff-key="stage1"]')) translateInputForLegacyRuntime(event);
  }, true);

  const sanitizeRegistry = (scope) => {
    if (!(scope instanceof Element)) return;
    const registries = scope.matches('.case407-registry') ? [scope] : [...scope.querySelectorAll('.case407-registry')];
    for (const registry of registries) {
      registry.querySelectorAll('.case407-registry-row:not(.head)').forEach((row) => {
        row.classList.remove('focus');
        const physicalNode = row.querySelector(':scope > b');
        if (physicalNode) physicalNode.textContent = 'LOCKED';
      });
      const physicalHeader = registry.querySelector('.case407-registry-row.head > span:first-child');
      if (physicalHeader) physicalHeader.textContent = 'PHY NODE';
      const note = registry.querySelector('.case407-registry-note');
      if (note) note.textContent = 'Физический узел скрыт до перекрёстной сверки. Для запроса нужен заводской H-код с таблички; один LOCK ID не раскрывает номер комнаты.';
    }
  };

  const maskLegacyText = (node) => {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = replaceInValue(node.nodeValue || '');
      return;
    }
    if (!(node instanceof Element)) return;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();
    while (textNode) {
      textNode.nodeValue = replaceInValue(textNode.nodeValue || '');
      textNode = walker.nextNode();
    }
    sanitizeRegistry(node);
  };

  new MutationObserver((mutations) => {
    for (const mutation of mutations) for (const node of mutation.addedNodes) maskLegacyText(node);
  }).observe(root, { childList: true, subtree: true });
  maskLegacyText(root);

  window.ML407PlaqueCode = Object.freeze({
    plaqueCode: 'H-7C4',
    lockCodes: Object.freeze({ room407: 'L-4A8', room409: 'L-6B2' }),
    safeCode: 'S-8D1',
    legacyAliasesHidden: true
  });
})();