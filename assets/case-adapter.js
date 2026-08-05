(() => {
  const root = document.querySelector('[data-ktv-root]');
  if (!root) return;
  const adapt = () => {
    const coverLead = root.querySelector('.ktv-cover-lead');
    if (coverLead) coverLead.textContent = 'Сопоставьте материалы и все показания. Только одна версия не выдерживает логической проверки.';
    const heroLead = root.querySelector('.ktv-hero-copy > p:last-child');
    if (heroLead) heroLead.textContent = 'Восстановите единственную картину событий и проверьте каждое показание по подтверждённым фактам.';
    const testimonyTitle = root.querySelector('#ktv-testimony .ktv-section-title, #ktv-testimony h2');
    if (testimonyTitle) testimonyTitle.textContent = 'Показания свидетелей';
    root.querySelectorAll('.ktv-option-copy small').forEach((node) => { node.textContent = 'Свидетель'; });
    const confrontation = root.querySelector('.ktv-confrontation');
    if (confrontation) {
      const labels = confrontation.querySelectorAll('div > span');
      if (labels[0]) labels[0].textContent = 'Материалы';
      if (labels[1]) labels[1].textContent = 'Показание';
    }
    const resultTitle = root.querySelector('#ktv-result h2');
    if (resultTitle && resultTitle.textContent !== 'Чистое раскрытие') resultTitle.textContent = 'Противоречие доказано';
  };
  new MutationObserver(adapt).observe(root, { childList: true, subtree: true });
  adapt();
})();
