import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const must = (condition, message) => {
  if (!condition) throw new Error(message);
};

const bonus = read('bonus/index.html');
const rewardClient = read('assets/reward-access.js');
const rewardCss = read('assets/reward-access.css');
const admin = read('admin/rewards/index.html');
const adminClient = read('assets/reward-admin.js');
const rewardAccess = read('supabase/functions/reward-access/index.ts');
const rewardAdmin = read('supabase/functions/reward-admin/index.ts');
const caseAccess = read('supabase/functions/case-access/index.ts');
const paidClient = read('assets/paid-access-client.js');
const ariaStorefront = read('assets/case-aria-storefront.js');
const robots = read('robots.txt');
const sitemap = read('sitemap.xml');

must(bonus.includes('noindex,follow,noarchive'), 'bonus page must remain noindex');
must(bonus.includes('data-reward-code') && bonus.includes('data-feedback-form'), 'bonus activation and feedback UI missing');
must(rewardCss.length > 3000, 'bonus page styling unexpectedly small');
must(rewardClient.includes('/functions/v1/reward-access'), 'bonus client endpoint missing');
must(rewardClient.includes('mysterylogic:reward:case:${reward.caseId}'), 'case-scoped reward storage missing');
must(rewardClient.includes("mysterylogic:reward:last-aria"), 'Last Aria reward storage must be separate from paid token');
must(!rewardClient.includes("localStorage.setItem(LAST_ARIA_TOKEN_KEY"), 'reward must not overwrite paid Last Aria token');

must(admin.includes('noindex,nofollow,noarchive'), 'reward admin must remain noindex');
must(admin.includes('data-reward-create-form') && admin.includes('data-reward-list'), 'reward admin controls missing');
must(admin.includes('Копировать готовое сообщение'), 'reward admin ready-message affordance missing');
must(adminClient.includes('/functions/v1/reward-admin'), 'reward admin endpoint missing');
must(adminClient.includes('assets/generated/cases-index.json'), 'reward admin must load generated premium catalog');

must(rewardAccess.includes("metadata?.source !== 'player_reward'"), 'public reward endpoint must reject ordinary purchase entitlements');
must(rewardAccess.includes("crypto.subtle.digest"), 'public reward endpoint must hash codes');
must(rewardAccess.includes(".from('case_reviews')"), 'reward feedback must flow into case_reviews');
must(rewardAccess.includes("moderation_status: 'pending'"), 'reward feedback must enter moderation');
must(rewardAccess.includes("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"), 'service role key must come from server environment');

must(rewardAdmin.includes(".from('review_moderation_access')"), 'reward admin must reuse owner authorization');
must(rewardAdmin.includes("source: 'player_reward'"), 'reward entitlement source marker missing');
must(rewardAdmin.includes("allowed_case_ids: [caseId]"), 'single-case reward scope missing');
must(rewardAdmin.includes("token_hash: tokenHash"), 'reward admin must persist only token hash');
must(rewardAdmin.includes("code_hint"), 'reward admin history must use masked code hint');
must(!rewardAdmin.includes('metadata,\n      code,'), 'plaintext code must not be written into entitlement metadata');

must(caseAccess.includes("metadata?.source === 'player_reward'"), 'case-access must recognize reward entitlement');
must(caseAccess.includes("reward_wrong_case"), 'case-access must reject reward token on another case');
must(paidClient.includes('mysterylogic:reward:case:${page.caseId}'), 'paid case client must restore only its own reward token');
must(paidClient.includes("accessSource: REWARD_TOKEN_RE.test"), 'paid case client reward access source missing');

must(ariaStorefront.includes("mysterylogic:reward:last-aria"), 'Last Aria storefront reward key missing');
must(ariaStorefront.includes('/functions/v1/reward-access'), 'Last Aria storefront reward validation endpoint missing');
must(ariaStorefront.includes('restorePlayerReward().then'), 'Last Aria reward restore flow missing');
must(ariaStorefront.indexOf('restorePlayerReward().then') < ariaStorefront.indexOf('restore().then((restored)'), 'Last Aria reward must be tried before paid-order restore');

must(robots.includes('Disallow: /admin/'), 'admin robots disallow missing');
must(!sitemap.includes('/bonus/'), 'bonus must not enter sitemap');
must(!sitemap.includes('/admin/'), 'admin must not enter sitemap');

console.log(JSON.stringify({
  ok: true,
  surface: ['bonus', 'admin-rewards', 'volume1-single-case', 'last-aria', 'feedback'],
  security: ['sha256-at-rest', 'owner-auth', 'case-scope', 'expiry', 'revocation', 'noindex'],
}, null, 2));
