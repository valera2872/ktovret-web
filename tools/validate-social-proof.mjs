import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const server = read('supabase/functions/social-proof/index.ts');
const client = read('assets/social-proof.js');
const feedback = read('supabase/functions/player-feedback/index.ts');
const injector = read('tools/import-mobile/funnel-analytics-postprocess.mjs');
const funnel = read('assets/funnel-analytics.js');

const requireText = (source, token, label) => {
  if (!source.includes(token)) throw new Error(`Social proof contract missing: ${label}`);
};

requireText(server, ".eq('feedback_version', 'v2')", 'clean v2 player-rating cohort');
requireText(server, "row.moderation_status !== 'rejected'", 'rejected ratings excluded');
requireText(server, "row.moderation_status === 'approved'", 'text reviews require approval');
requireText(server, 'row.publication_consent === true', 'text reviews require publication consent');
requireText(server, '/^audit_/i', 'CI audit review exclusion');
requireText(server, 'ratingCount', 'rating count exposed separately from review count');
requireText(server, 'reviews: publicReviews', 'moderated public review excerpts');
requireText(server, "from('site_funnel_events')", 'clean browser completion source');
requireText(server, "event_name', 'game_complete'", 'confirmed browser completion filter');
requireText(server, "from('duel_room_players')", 'authoritative co-op completion source');
requireText(server, "from('duel_rooms')", 'co-op room mapping');
requireText(server, "/^(?:CI|RG)\\b/i", 'automated co-op player exclusion');
requireText(server, 'ratingThreshold: 1', 'rating appears from first genuine rating');
requireText(server, 'playerThreshold: 1', 'confirmed completions are visible immediately');

requireText(feedback, "feedback_version: 'v2'", 'new feedback cohort version');
requireText(feedback, 'ratingPublishedToAggregate: true', 'rating aggregate disclosure');

requireText(funnel, 'navigator.webdriver', 'browser automation excluded from clean funnel');
requireText(funnel, "window.addEventListener('ml:solo_complete'", 'Solo 407 completion hook');

requireText(client, 'ratings > 0', 'stars shown from first genuine rating');
requireText(client, 'players > 0', 'completion count shown from first confirmed player');
requireText(client, '☆ Оценок пока нет', 'visible empty-rating state');
requireText(client, 'data-ml-current-proof', 'individual case page proof');
requireText(client, 'Отзывы игроков', 'individual case public-review section');
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

console.log('Social proof release contract OK: genuine ratings, consented reviews, confirmed completions, individual pages and cards.');
