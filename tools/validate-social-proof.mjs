import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const server = read('supabase/functions/social-proof/index.ts');
const client = read('assets/social-proof.js');
const injector = read('tools/import-mobile/funnel-analytics-postprocess.mjs');

const requireText = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`Social proof contract missing: ${label}`);
};

requireText(server, ".eq('moderation_status', 'approved')", 'approved-only review filter');
requireText(server, '/^audit_/i', 'CI audit review exclusion');
requireText(server, "event_name', 'game_complete'", 'confirmed long-game completion source');
requireText(server, "from('case_first_results')", 'confirmed short-case completion source');
requireText(server, "ratingThreshold: 3", 'rating sample threshold');
requireText(server, "playerThreshold: 10", 'completion sample threshold');

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

if (/moderation_status[^\n]{0,80}(pending|rejected)/.test(server) && !server.includes(".eq('moderation_status', 'approved')")) {
  throw new Error('Public rating source can include unapproved reviews');
}

console.log('Social proof release contract OK: moderated ratings, real completion counts, production injection.');
