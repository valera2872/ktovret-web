(() => {
  'use strict';

  const currentScript = document.currentScript;
  const root = document.querySelector('[data-ktv-root]');
  if (!root || !currentScript?.src) return;

  if (!document.querySelector('[data-ktv-feedback-styles]')) {
    const style = document.createElement('style');
    style.dataset.ktvFeedbackStyles = 'true';
    style.textContent = `
      .ktv-feedback {
        display: grid !important;
        grid-template-columns: 42px minmax(0, 1fr) !important;
        gap: 13px !important;
        align-items: start !important;
        margin: 18px 0 4px !important;
        padding: 17px 18px !important;
        border: 1px solid rgba(225, 126, 91, .76) !important;
        border-radius: 17px !important;
        outline: none !important;
        background: linear-gradient(135deg, rgba(179, 69, 48, .31), rgba(207, 130, 100, .13)) !important;
        box-shadow: inset 4px 0 0 #e17e5b, 0 14px 38px rgba(85, 23, 14, .36) !important;
        color: #f9d8ca !important;
        animation: ktv-feedback-in .34s ease both !important;
      }
      .ktv-feedback-icon {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border: 1px solid rgba(255, 226, 214, .44);
        border-radius: 50%;
        background: rgba(225, 126, 91, .24);
        color: #fff3ed;
        font-size: 1.25rem;
        font-weight: 950;
      }
      .ktv-feedback strong {
        display: block;
        color: #fff !important;
        font-size: 1.04rem;
        letter-spacing: .01em;
      }
      .ktv-feedback p { margin: 4px 0 0 !important; }
      .ktv-feedback small {
        display: block;
        margin-top: 9px;
        color: rgba(255, 232, 223, .8);
        font-size: .78rem;
      }
      .ktv-cover-seal { display: none !important; }
      .ktv-cover-grid { grid-template-columns: minmax(0, 1fr) !important; }
      .ktv-cover h1 { max-width: 860px; }
      @keyframes ktv-feedback-in {
        from { opacity: 0; transform: translateY(-8px) scale(.985); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .ktv-feedback { animation: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  const enhanceAnswerState = () => {
    const submit = root.querySelector('[data-action="submit"]');
    if (submit && submit.textContent.trim() === 'Передать заключение') {
      submit.textContent = 'Проверить версию';
    }

    const feedback = root.querySelector('.ktv-feedback');
    if (!feedback || feedback.dataset.enhanced === 'true') return;

    feedback.dataset.enhanced = 'true';
    feedback.setAttribute('role', 'alert');
    feedback.setAttribute('aria-live', 'assertive');
    feedback.setAttribute('tabindex', '-1');

    const content = document.createElement('div');
    while (feedback.firstChild) content.appendChild(feedback.firstChild);

    const instruction = document.createElement('small');
    instruction.textContent = 'Выберите другой вариант и проверьте версию ещё раз.';
    content.appendChild(instruction);

    const icon = document.createElement('span');
    icon.className = 'ktv-feedback-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '!';

    feedback.append(icon, content);

    const options = root.querySelector('.ktv-options');
    if (options) options.before(feedback);

    requestAnimationFrame(() => {
      feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
      feedback.focus({ preventScroll: true });
    });
  };

  const observer = new MutationObserver(enhanceAnswerState);
  observer.observe(root, { childList: true, subtree: true });

  const loadDossierNavigation = () => {
    const dossierNav = document.createElement('script');
    dossierNav.src = new URL('dossier-nav.js?v=0.6.1', currentScript.src).href;
    document.head.appendChild(dossierNav);
  };

  if (window.MysteryLogicDossier) {
    loadDossierNavigation();
  } else {
    const dossierModel = document.createElement('script');
    dossierModel.src = new URL('../../assets/dossier-model.js?v=0.6.1', currentScript.src).href;
    dossierModel.onload = loadDossierNavigation;
    document.head.appendChild(dossierModel);
  }

  const loadCore = () => {
    const core = document.createElement('script');
    core.src = new URL('app-core.js?v=0.6.1', currentScript.src).href;
    core.onload = enhanceAnswerState;
    core.onerror = () => {
      root.innerHTML = '<p style="padding:24px;color:#fff">Не удалось загрузить игровое дело. Обновите страницу.</p>';
    };
    document.head.appendChild(core);
  };

  const performance = document.createElement('script');
  performance.src = new URL('performance.js?v=0.6.1', currentScript.src).href;
  performance.onload = loadCore;
  performance.onerror = loadCore;
  document.head.appendChild(performance);
})();
