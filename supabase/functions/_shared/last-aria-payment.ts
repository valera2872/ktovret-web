import { createClient } from 'npm:@supabase/supabase-js@2';

export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
export const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'https://mysterylogic.com,https://valera2872.github.io')
  .split(',')
  .map((value) => value.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const adminClient = () => createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const cleanOrigin = (value = '') => value.trim().replace(/\/$/, '');
export const isAllowedOrigin = (origin = '') => !origin || configuredOrigins.includes(cleanOrigin(origin));

export const corsHeaders = (origin = '') => ({
  ...(origin && isAllowedOrigin(origin) ? { 'access-control-allow-origin': cleanOrigin(origin) } : {}),
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-max-age': '600',
  'vary': 'Origin',
});

export const json = (status: number, body: unknown, origin = '') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'private, no-store, max-age=0',
    ...corsHeaders(origin),
  },
});

const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes))
  .map((value) => value.toString(16).padStart(2, '0'))
  .join('');

export const sha256 = async (value: string) => hex(await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(value),
));

export const validAccessToken = (value: string) => /^ml_[a-z0-9]+_[A-Za-z0-9_-]{32,160}$/.test(value);
export const validUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

export const formatAmount = (value: unknown) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return '';
  return number.toFixed(2);
};
