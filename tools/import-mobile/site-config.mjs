const DEFAULT_SITE_ORIGIN = 'https://valera2872.github.io/ktovret-web/';

const normalizeOrigin = (value) => {
  const raw = String(value || DEFAULT_SITE_ORIGIN).trim();
  if (!/^https?:\/\//i.test(raw)) throw new Error(`Некорректный MYSTERYLOGIC_SITE_ORIGIN: ${raw}`);
  return raw.endsWith('/') ? raw : `${raw}/`;
};

export const SITE_ORIGIN = normalizeOrigin(process.env.MYSTERYLOGIC_SITE_ORIGIN);
export const STAGING_ORIGIN = DEFAULT_SITE_ORIGIN;
export const siteUrl = (route = '') => new URL(String(route || '').replace(/^\/+/, ''), SITE_ORIGIN).href;
export const isStagingOrigin = SITE_ORIGIN === STAGING_ORIGIN;
