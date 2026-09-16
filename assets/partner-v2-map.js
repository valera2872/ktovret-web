(() => {
  'use strict';

  const root = document.querySelector('[data-partner-v2-app]');
  if (!root) return;

  const mapHtml = () => `
    <figure class="partner-v2-vector-map" data-vector12-map>
      <div class="partner-v2-vector-map-head">
        <span>СХЕМА УЧАСТКА / ВЕКТОР-12</span>
        <small>служебная схема · не в масштабе</small>
      </div>
      <svg viewBox="0 0 760 360" role="img" aria-label="Схема железнодорожного узла Вектор-12: главный путь, петля Б, промышленная ветка, техническая площадка Б, сервисный бокс 3 и сервисные ворота">
        <defs>
          <pattern id="pv2-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="currentColor" stroke-opacity=".08" stroke-width="1"/>
          </pattern>
          <marker id="pv2-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="currentColor"/>
          </marker>
        </defs>
        <rect x="0" y="0" width="760" height="360" class="pv2-grid-fill"/>

        <g class="pv2-track pv2-main-track">
          <path d="M28 178 H730"/>
          <path d="M28 188 H730"/>
        </g>
        <text x="32" y="158" class="pv2-label pv2-label-main">ГЛАВНЫЙ ПУТЬ</text>

        <g class="pv2-track pv2-loop-track">
          <path d="M208 178 C258 178 258 94 326 94 H520 C590 94 594 178 642 178"/>
          <path d="M208 188 C258 188 258 104 326 104 H520 C590 104 594 188 642 188"/>
        </g>
        <text x="378" y="80" class="pv2-label pv2-label-accent">ПЕТЛЯ Б</text>

        <g class="pv2-track pv2-industrial-track">
          <path d="M292 188 C330 226 360 250 420 286 H700"/>
          <path d="M286 195 C324 234 355 258 416 296 H700"/>
        </g>
        <text x="486" y="322" class="pv2-label">ПРОМЫШЛЕННАЯ ВЕТКА</text>

        <g class="pv2-switches">
          <circle cx="208" cy="183" r="7"/><text x="174" y="216" class="pv2-tiny">12А</text>
          <circle cx="291" cy="191" r="7"/><text x="272" y="224" class="pv2-tiny">12Б</text>
          <circle cx="642" cy="183" r="7"/><text x="628" y="216" class="pv2-tiny">14</text>
        </g>

        <g class="pv2-tech-zone">
          <rect x="342" y="116" width="186" height="50" rx="7"/>
          <text x="435" y="137" class="pv2-zone-title" text-anchor="middle">ТЕХНИЧЕСКАЯ ПЛОЩАДКА Б</text>
          <text x="435" y="153" class="pv2-tiny" text-anchor="middle">контейнерная техника / R-4</text>
        </g>

        <g class="pv2-service-box">
          <rect x="554" y="20" width="116" height="58" rx="5"/>
          <path d="M565 67 V39 H659 V67"/>
          <text x="612" y="39" class="pv2-zone-title" text-anchor="middle">СЕРВИСНЫЙ</text>
          <text x="612" y="54" class="pv2-zone-title" text-anchor="middle">БОКС 3</text>
        </g>

        <g class="pv2-service-road">
          <path d="M528 140 C594 132 676 116 720 82" marker-end="url(#pv2-arrow)"/>
          <text x="598" y="111" class="pv2-tiny">служебная дорога</text>
          <rect x="684" y="48" width="54" height="27" rx="3"/>
          <text x="711" y="65" class="pv2-gate-label" text-anchor="middle">ВОРОТА 2</text>
        </g>

        <g class="pv2-train">
          <rect x="354" y="174" width="38" height="28" rx="2"/>
          <rect x="396" y="174" width="38" height="28" rx="2"/>
          <rect x="438" y="174" width="38" height="28" rx="2" class="is-car-6"/>
          <rect x="480" y="174" width="38" height="28" rx="2"/>
          <text x="457" y="193" class="pv2-car-label" text-anchor="middle">06</text>
          <text x="435" y="232" class="pv2-tiny" text-anchor="middle">состав №214 · остановка 02:06–02:22</text>
        </g>

        <g class="pv2-map-note">
          <line x1="451" y1="115" x2="457" y2="168"/>
          <circle cx="451" cy="115" r="4"/>
          <text x="305" y="55" class="pv2-note-text">Площадка Б примыкает к петле:</text>
          <text x="305" y="70" class="pv2-note-text">контейнер можно снять с вагона,</text>
          <text x="305" y="85" class="pv2-note-text">не уводя состав на другую ветку.</text>
        </g>
      </svg>
      <figcaption>
        <span><i class="is-main"></i> железнодорожные пути</span>
        <span><i class="is-tech"></i> техническая зона</span>
        <span><i class="is-road"></i> сервисный выезд</span>
      </figcaption>
    </figure>`;

  const render = () => {
    const card = root.querySelector('.partner-v2-evidence[data-evidence-id="M01"]');
    if (!card || card.querySelector('[data-vector12-map]')) return;
    const placeholder = card.querySelector('.partner-v2-map-mini');
    if (!placeholder) return;
    placeholder.outerHTML = mapHtml();
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      render();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  schedule();
  window.addEventListener('beforeunload', () => observer.disconnect());
})();
