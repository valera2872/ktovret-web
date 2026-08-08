import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_SITE_ORIGIN = 'https://valera2872.github.io/ktovret-web/';
const here = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.resolve(here, '..', '..', 'site-origin.json');
const fileConfig = fs.existsSync(configPath)
  ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
  : { origin: DEFAULT_SITE_ORIGIN, environment: 'staging', customDomainReady: false };

const normalizeOrigin = (value) => {
  const raw = String(value || DEFAULT_SITE_ORIGIN).trim();
  if (!/^https?:\/\//i.test(raw)) throw new Error(`Некорректный public site origin: ${raw}`);
  return raw.endsWith('/') ? raw : `${raw}/`;
};

export const STAGING_ORIGIN = DEFAULT_SITE_ORIGIN;
export const SITE_ORIGIN = normalizeOrigin(process.env.MYSTERYLOGIC_SITE_ORIGIN || fileConfig.origin);
export const SITE_ENVIRONMENT = String(fileConfig.environment || (SITE_ORIGIN === STAGING_ORIGIN ? 'staging' : 'production'));
export const CUSTOM_DOMAIN_READY = fileConfig.customDomainReady === true;
export const siteUrl = (route = '') => new URL(String(route || '').replace(/^\/+/, ''), SITE_ORIGIN).href;
export const isStagingOrigin = SITE_ORIGIN === STAGING_ORIGIN;
