(() => {
  'use strict';

  // Public launch stays OFF until explicit release approval.
  const PUBLIC_LAUNCH = false;
  const PREVIEW_PARAM = 'ai01_preview';
  const PREVIEW_KEY = 'mysterylogic:ai01-launch-preview:v1';
  const DISMISS_KEY = 'mysterylogic:ai01-promo-dismissed:v1';
  const METRIKA_ID = 111664459;

  const siteHref = (path) => {
    const prefix = String(location.pathname || '').startsWith('/ktovret-web/') ? '/ktovret-web' : '';
    return `${prefix}${path}`;
  };
  const sendMetrika = (goal, params = {}) => {
    try { if (typeof window.ym === 'function') window.ym(METRIKA_ID, 'reachGoal', goal, params); } catch {}
  };
  const sendFunnel = (eventName, metadata = {}, target = '') => {
    try { window.MysteryLogicFunnel?.track?.(eventName, metadata, target); } catch {}
  };

  const params = new URLSearchParams(location.search);
  if (params.get(PREVIEW_PARAM) === '1') {
    try { sessionStorage.setItem(PREVIEW_KEY, '1'); sessionStorage.removeItem(DISMISS_KEY); } catch {}
  } else if (params.get(PREVIEW_PARAM) === '0') {
    try { sessionStorage.removeItem(PREVIEW_KEY); sessionStorage.removeItem(DISMISS_KEY); } catch {}
  }

  let preview = false;
  let dismissed = false;
  try {
    preview = sessionStorage.getItem(PREVIEW_KEY) === '1';
    dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {}

  const enabled = PUBLIC_LAUNCH || preview;
  if (!enabled || dismissed) return;
  const path = String(location.pathname || '/');
  if (path.includes('/admin/') || /\/detektivnaya-igra-s-ii\/?$/.test(path)) return;
  if (document.querySelector('[data-ai01-launch-promo]')) return;

  const aside = document.createElement('aside');
  aside.className = 'ml-ai01-launch-promo';
  aside.dataset.ai01LaunchPromo = preview && !PUBLIC_LAUNCH ? 'preview' : 'public';
  aside.innerHTML = `
    <button class="ml-ai01-launch-close" type="button" aria-label="Скрыть предложение">×</button>
    <div class="ml-ai01-launch-copy">
      <span class="ml-ai01-launch-kicker">Новое · AI-расследование · бесплатно</span>
      <strong>Допрашивайте подозреваемых своими словами.</strong>
      <p>«Восемь минут без камеры»: три фигуранта, улики, свободный допрос и ваша собственная версия дела.</p>
    </div>
    <a class="ml-ai01-launch-cta" href="${siteHref('/detektivnaya-igra-s-ii/')}${preview && !PUBLIC_LAUNCH ? '?ai01_preview=1' : ''}" data-ai01-launch-cta>Принять дело →</a>`;

  aside.querySelector('.ml-ai01-launch-close')?.addEventListener('click', () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch {}
    aside.remove();
    sendFunnel('ai01_promo_dismissed', { placement: 'sitewide', preview }, '');
  });
  aside.querySelector('[data-ai01-launch-cta]')?.addEventListener('click', () => {
    sendFunnel('ai01_promo_clicked', { placement: 'sitewide', preview }, '/detektivnaya-igra-s-ii/');
    sendMetrika('ml_ai01_promo_click', { placement: 'sitewide', preview: preview ? 1 : 0 });
  });

  document.body.appendChild(aside);
  sendFunnel('ai01_promo_viewed', { placement: 'sitewide', preview }, '/detektivnaya-igra-s-ii/');
  sendMetrika('ml_ai01_promo_view', { placement: 'sitewide', preview: preview ? 1 : 0 });
})();