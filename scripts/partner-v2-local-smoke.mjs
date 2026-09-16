#!/usr/bin/env node

const localEndpoint = String(
  process.env.LOCAL_PARTNER_V2_ENDPOINT || 'http://127.0.0.1:54321/functions/v1/coop-case-v2'
).trim().replace(/\/$/, '');

if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+\/functions\/v1\/coop-case-v2$/i.test(localEndpoint)) {
  console.error(`Refusing unexpected local endpoint: ${localEndpoint}`);
  process.exit(2);
}

const syntheticEndpoint = 'https://partner-v2-local-ci.supabase.co/functions/v1/coop-case-v2';
const nativeFetch = globalThis.fetch;

globalThis.fetch = (input, init) => {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : String(input?.url || input);

  if (url.startsWith(syntheticEndpoint)) {
    const rewritten = `${localEndpoint}${url.slice(syntheticEndpoint.length)}`;
    return nativeFetch(rewritten, init);
  }

  return nativeFetch(input, init);
};

process.env.PARTNER_V2_ENDPOINT = syntheticEndpoint;
await import('./partner-v2-smoke.mjs');
