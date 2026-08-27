import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const server = read('supabase/functions/social-proof/index.ts');
const client = read('assets/social-proof.js');
const injector = read('tools/import-mobile/funnel-analytics-postprocess.mjs');
const funnel = read('assets/funnel-analytics.js');

const requireText = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`Social proof contract missing: ${label}`);
};

requireText(server, ".eq('moderation_status', 'approved')", 'approved-only review filter');
requireText(server, '/^audit_/i', 'CI audit review exclusion');
requireText(server, "from('site_funnel_events')", 'clean browser completion source');
requireText(server, "event_name', 'game_complete'", 'confirmed browser completion filter');
requireText(server, "from('duel_room_players')", 'authoritative co-op completion source');
requireText(server, "from('duel_rooms')", 'co-op room mapping');
requireText(server, "/^(?:CI|RG)\\b/i", 'automated co-op player exclusion');
requireText(server, "ratingThreshold: 3", 'rating sample threshold');
requireText(server, "playerThreshold: 10", 'completion sample threshold');

requireText(funnel, 'navigator.webdriver', 'browser automation excluded from clean funnel');
requireText(funnel, "window.addEventListener('ml:solo_complete'", 'Solo 407 completion hook');

requireText(client, 'reviews >= 3', 'stars hidden below three approved reviews');
requireText(client, 'players >= 10', 'completion count hidden below ten players');
requireText(client, 'Оценки публикуются после модерации', 'moderation disclosure');
requireText(client, '[data-case-id]', 'short-case cards');
requireText(client, '/detektivnye-igry-dlya-odnogo/407/', 'solo 407 mapping');
requireText(client, '/detektivnye-igry-dlya-dvoih/2317/', '23:17 mapping');
requireText(client, '/detektivnye-igry-dlya-dvoih/407/', 'co-op 407 mapping');
requireText(client, '/detektivnye-igry-dlya-dvoih/poslednyaya-ariya/', 'Last Aria mapping');

requireText(injector, 'data-ml-social-proof-client', 'production HTML injection');
requireText(injector, 'assets/social-proof.js', 'social-proof asset production requirement');

if (server.includes("from('case_first_results')")) {
  throw new Error('Public completion counts must not use legacy case_first_results because historical CI rows are not distinguishable');
}

console.log('Social proof release contract OK: owner-moderated ratings, clean human completions, CI exclusion, production injection.');
