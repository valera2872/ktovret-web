(() => {
  'use strict';

  const TOKEN_KEY = 'mysterylogic:guided-preview-token:v1';
  const CASE_ID = 'ML0512_PREVIEW_CB6B46A0DADA7B5188CC65DEC92B0642';
  const SESSION_KEY = `mysterylogic:solo-guided-session:${CASE_ID}`;
  const PUBLIC_TOKEN = 'MLPREVIEW-PUBLIC';
  const SOLO_PATH = '/functions/v1/solo-session-v2';
  const PRIVATE_INTERROGATION_PATH = '/functions/v1/solo-guided-interrogate-v1';
  const PUBLIC_INTERROGATION_PATH = '/functions/v1/solo-guided-interrogate-public-v1';

  try { sessionStorage.setItem(TOKEN_KEY, PUBLIC_TOKEN); } catch {}

  const nativeFetch = window.fetch.bind(window);

  function requestUrl(input) {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    if (input instanceof Request) return input.url;
    return String(input || '');
  }

  function mutableHeaders(input, init) {
    const source = init?.headers || (input instanceof Request ? input.headers : undefined);
    return new Headers(source || {});
  }

  async function publicReset(url, input, init, headers) {
    let body = {};
    try { body = JSON.parse(String(init?.body || '{}')); } catch {}
    if (String(body.action || '').toUpperCase() !== 'RESET') return null;

    try { localStorage.removeItem(SESSION_KEY); } catch {}

    const nextBody = {
      action: 'START',
      case_id: CASE_ID,
    };
    headers.delete('authorization');

    const response = await nativeFetch(url, {
      ...init,
      method: 'POST',
      headers,
      body: JSON.stringify(nextBody),
    });
    if (!response.ok) return response;

    const data = await response.json().catch(() => ({}));
    return new Response(JSON.stringify({
      ...data,
      resume: {
        ...(data?.resume || {}),
        viaSessionToken: true,
        viaEntitlement: false,
        reset: true,
      },
    }), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  window.fetch = async function publicPreviewFetch(input, init = {}) {
    let url = requestUrl(input);
    const headers = mutableHeaders(input, init);
    const auth = headers.get('authorization') || '';
    const isPublicMarker = auth === `Bearer ${PUBLIC_TOKEN}`;

    if (url.includes(SOLO_PATH) && isPublicMarker) {
      const resetResponse = await publicReset(url, input, init, headers);
      if (resetResponse) return resetResponse;
      headers.delete('authorization');
      return nativeFetch(url, { ...init, headers });
    }

    if (url.includes(PRIVATE_INTERROGATION_PATH) && isPublicMarker) {
      url = url.replace(PRIVATE_INTERROGATION_PATH, PUBLIC_INTERROGATION_PATH);
      headers.delete('authorization');
      return nativeFetch(url, { ...init, headers });
    }

    return nativeFetch(input, init);
  };
})();
