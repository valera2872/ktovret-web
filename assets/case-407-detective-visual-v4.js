(() => {
  'use strict';

  const root = document.querySelector('[data-case407-app]');
  if (!root) return;

  const style = document.createElement('style');
  style.dataset.case407DetectiveV4 = '1';
  style.textContent = `
    .case407-lab-footer{gap:8px}.case407-lab-footer span{min-width:0}
    @media(max-width:760px){
      .case407-network-grid{grid-template-columns:1fr 24px 1fr 24px 1fr!important;grid-template-rows:auto auto!important}
      .case407-device.phone{grid-column:1!important;grid-row:1!important}
      .case407-device.watch{grid-column:1!important;grid-row:2!important}
      .case407-network-grid>.arrow:nth-of-type(1){grid-column:2!important;grid-row:2!important;display:block!important}
      .case407-network-grid>.case407-node:not(.hot){grid-column:3!important;grid-row:2!important}
      .case407-network-grid>.arrow:nth-of-type(2){grid-column:4!important;grid-row:2!important;display:block!important}
      .case407-network-grid>.case407-node.hot{grid-column:5!important;grid-row:2!important}
      .case407-code-line{grid-template-columns:auto minmax(48px,1fr) auto minmax(78px,1fr)!important;gap:6px!important}
      .case407-code-line b{font-size:14px!important;letter-spacing:.1em!important;white-space:nowrap!important}
      .case407-code-line strong{font-size:14px!important;white-space:nowrap!important;padding-inline:4px!important}
      .case407-lab-footer{flex-direction:column;align-items:flex-start}
    }
  `;
  document.head.appendChild(style);

  const mark = (node, key) => {
    if (!node || node.dataset[key] === '1') return false;
    node.dataset[key] = '1';
    return true;
  };

  const patchManual = (scope) => {
    scope.querySelectorAll('.case407-manual').forEach((manual) => {
      if (!mark(manual, 'detectiveV4')) return;
      const copy = manual.querySelector('.case407-manual-copy');
      const intro = copy?.querySelector('p');
      if (intro) intro.textContent = 'Для скрытого сигнала используйте действительный PIN, изменив только последнюю цифру на +1. Если последняя цифра 9, используйте 0.';
      const line = manual.querySelector('.case407-code-line');
      if (line) {
        const span = line.querySelector('span');
        const masked = line.querySelector('b');
        const arrow = line.querySelector('i');
        const variant = line.querySelector('strong');
        if (span) span.textContent = 'ОБЫЧНЫЙ PIN';
        if (masked) masked.textContent = '•••••6';
        if (arrow) arrow.textContent = '→';
        if (variant) variant.textContent = '•••••7';
      }
      const warning = manual.querySelector('.case407-warning');
      if (warning) warning.textContent = 'Duress-вариант открывает сейф штатно и одновременно отправляет тихий сигнал. Сам сигнал не доказывает отсутствие внешнего принуждения.';
    });
  };

  const patchNetwork = (scope) => {
    scope.querySelectorAll('.case407-network').forEach((network) => {
      if (!mark(network, 'detectiveV4')) return;
      const foot = network.querySelector('.case407-network-foot');
      if (!foot) return;
      const span = foot.querySelector('span');
      const strong = foot.querySelector('b');
      if (span) span.textContent = 'телефон остаётся в зоне WEST-4';
      if (strong) strong.textContent = 'часы: WEST-4 → STAFF-4 → LOADING-B1';
    });
  };

  const patchCartLab = (scope) => {
    scope.querySelectorAll('.case2317-evidence').forEach((card) => {
      const title = card.querySelector(':scope > h3')?.textContent || '';
      if (!title.includes('Тележка №6')) return;
      const lab = card.querySelector('.case407-lab');
      if (!lab || !mark(lab, 'detectiveV4')) return;
      const sample = lab.querySelector('.case407-lab-sample');
      if (sample) {
        const strong = sample.querySelector('strong');
        const span = sample.querySelector('span');
        if (strong) strong.textContent = 'BR-220 / NS-17';
        if (span) span.textContent = 'подкладка / ювелирный воск / контрольная пломба';
      }
      const footer = lab.querySelector('.case407-lab-footer span');
      if (footer) footer.textContent = '23:50: сапфир запечатан в BR-220 пломбой NS-17 · фрагмент NS-17 найден в тележке';
    });
  };

  const patchAccess = (scope) => {
    scope.querySelectorAll('.case407-access').forEach((access) => {
      if (!mark(access, 'detectiveV4')) return;
      const note = access.querySelector('.case407-access-note');
      if (note) note.textContent = '01:14:26 камера C4 одновременно показывает Елену рядом с Зориным. Значит, HK-44 у SVC-407 держал другой человек: токен был передан заранее.';
      const cameraFrames = access.querySelectorAll('.case407-access-camera .case407-cctv-meta span');
      if (cameraFrames[1]) cameraFrames[1].textContent = 'NIGHT-MGR / ER-02 · maintenance · 94 sec';
    });
  };

  const patchCar = (scope) => {
    scope.querySelectorAll('.case407-car').forEach((car) => {
      if (!mark(car, 'detectiveV4')) return;
      const blocks = car.querySelectorAll('.case407-car-dash > div');
      if (blocks[1]) {
        const small = blocks[1].querySelector('small');
        const strong = blocks[1].querySelector('strong');
        const span = blocks[1].querySelector('span');
        if (small) small.textContent = 'ДАТЧИК СИДЕНЬЯ';
        if (strong) strong.textContent = 'АКТИВЕН';
        if (span) span.textContent = 'не идентифицирует человека';
      }
      const road = car.querySelector('.case407-road');
      if (road) {
        const spans = road.querySelectorAll('span');
        const strong = road.querySelector('b');
        if (spans[0]) spans[0].textContent = 'CAM G1 · 01:26';
        if (spans[1]) spans[1].textContent = 'ВОДИТЕЛЬ: E. RAEVA';
        if (strong) strong.textContent = 'MO-W1: OFFLINE 01:27';
      }
      if (!car.querySelector('[data-driver-proof]')) {
        const proof = document.createElement('div');
        proof.className = 'case407-access-note';
        proof.dataset.driverProof = '1';
        proof.textContent = '01:31 · городская камера повторно фиксирует Елену за рулём. Часы Марты теряют сеть отеля сразу после выезда машины; это согласуется с вывозом, но не является самостоятельной идентификацией пассажира.';
        car.appendChild(proof);
      }
    });
  };

  const patchChat = (scope) => {
    scope.querySelectorAll('.case407-chat').forEach((chat) => {
      if (!mark(chat, 'detectiveV4')) return;
      const head = chat.querySelector('.case407-artifact-head');
      if (head) {
        const span = head.querySelector('span');
        const strong = head.querySelector('b');
        if (span) span.textContent = 'УДАЛЁННАЯ ПЕРЕПИСКА';
        if (strong) strong.textContent = 'СЕРВЕРНЫЙ ИНДЕКС';
      }
      const top = chat.querySelector('.case407-phone-top');
      if (top) {
        const strong = top.querySelector('b');
        if (strong) strong.textContent = 'удалено для всех';
      }
    });
  };

  const scan = (scope = root) => {
    if (!(scope instanceof Element)) return;
    patchManual(scope);
    patchNetwork(scope);
    patchCartLab(scope);
    patchAccess(scope);
    patchCar(scope);
    patchChat(scope);
  };

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) if (node instanceof Element) scan(node.matches('[data-case407-app]') ? node : root);
    }
  }).observe(root, { childList: true, subtree: true });
  scan();
})();