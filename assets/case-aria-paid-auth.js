(() => {
  'use strict';

  if (window.__MLLastAriaPaidFetchInstalled) return;
  window.__MLLastAriaPaidFetchInstalled = true;

  const nativeFetch = window.fetch.bind(window);
  const endpoint = '/functions/v1/coop-last-aria';

  window.fetch = (input, init = {}) => {
    let url = '';
    try { url = typeof input === 'string' ? input : String(input?.url || ''); } catch {}
    const token = String(window.MLLastAriaAccessToken || '').trim();
    if (!url.includes(endpoint) || !token) return nativeFetch(input, init);

    const headers = new Headers(init.headers || (typeof input !== 'string' ? input?.headers : undefined) || {});
    headers.set('authorization', `Bearer ${token}`);
    return nativeFetch(input, { ...init, headers });
  };
})();
