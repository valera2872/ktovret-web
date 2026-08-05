(() => {
  'use strict';

  const root = document.querySelector('[data-ktv-root]');
  if (!root) return;

  const options = { childList: true, subtree: true };
  let observer;
  let scheduled = false;

  const setText = (node, value) => {
    if (node && node.textContent !== value) node.textContent = value;
  };

  const adapt = () => {
    // The adapter changes text nodes itself. Disconnect while applying those
    // changes so the observer cannot react to its own mutations forever.
    observer.disconnect();

    try {
      setText(
        root.querySelector('.ktv-cover-lead'),
        'Сопоставьте материалы и все показания. Только одна версия не выдерживает логической проверки.',
      );
      setText(
        root.querySelector('.ktv-hero-copy > p:last-child'),
        'Восстановите единственную картину событий и проверьте каждое показание по подтверждённым фактам.',
      );
      setText(
        root.querySelector('#ktv-testimony .ktv-section-title, #ktv-testimony h2'),
        'Показания свидетелей',
      );

      root.querySelectorAll('.ktv-option-copy small').forEach((node) => {
        setText(node, 'Свидетель');
      });

      const confrontation = root.querySelector('.ktv-confrontation');
      if (confrontation) {
        const labels = confrontation.querySelectorAll('div > span');
        setText(labels[0], 'Материалы');
        setText(labels[1], 'Показание');
      }

      const resultTitle = root.querySelector('#ktv-result h2');
      if (resultTitle && resultTitle.textContent !== 'Чистое раскрытие') {
        setText(resultTitle, 'Противоречие доказано');
      }
    } finally {
      observer.observe(root, options);
    }
  };

  const scheduleAdapt = () => {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      adapt();
    });
  };

  observer = new MutationObserver(scheduleAdapt);
  observer.observe(root, options);
  scheduleAdapt();
})();
