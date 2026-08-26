import fs from 'node:fs';

const read=(file)=>fs.readFileSync(file,'utf8');
const must=(condition,message)=>{if(!condition) throw new Error(message);};
const has=(source,text,label)=>must(source.includes(text),`Missing ${label}: ${text}`);
const lacks=(source,text,label)=>must(!source.includes(text),`Forbidden ${label}: ${text}`);

const app=read('ktovret-game/assets/app.js');
const review=read('ktovret-game/assets/review-discount.js');
const statsClient=read('ktovret-game/assets/global-stats-client.js');
const storefront=read('assets/case-aria-storefront.js');
const checkout=read('supabase/functions/create-checkout-last-aria/index.ts');
const status=read('supabase/functions/payment-status-last-aria/index.ts');
const commerce=read('supabase/functions/_shared/last-aria-commerce.ts');
const discount=read('supabase/functions/_shared/last-aria-review-discount.ts');
const endpoint=read('supabase/functions/review-discount/index.ts');
const migration=read('supabase/migrations/20260826010500_review_discount_rewards.sql');

has(app,'review-discount.js?v=${assetVersion}','shared short-case review loader');
has(review,'За <strong>любой честный отзыв</strong>','rating-neutral reward copy');
has(review,"trim().length < 20",'client review threshold');
has(review,"publicationConsent: Boolean",'separate publication consent');
has(review,"mysterylogic:last-aria:review-reward:v1",'reward handoff storage');
has(review,"const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key'",'shared completion identity');
has(statsClient,"const CLIENT_KEY_STORAGE = 'mysterylogic:challenge:client-key'",'case-stats completion identity');
has(review,'browserKey: browserKey()','completion key submitted with review');
lacks(review,'reviewerToken: reviewerToken()','detached reviewer identity');

has(endpoint,'if (!BROWSER_KEY_RE.test(browserKey))','server browser-key validation');
has(endpoint,".from('case_first_results')",'server completion lookup');
has(endpoint,".eq('case_id', caseId)",'completion case binding');
has(endpoint,".eq('player_key_hash', reviewerKeyHash)",'completion browser binding');
has(endpoint,"if (!completion?.completed_at) return json(409, { error: 'case_completion_required' }",'reward blocked without completion');
has(endpoint,'if (!Number.isInteger(rating) || rating < 1 || rating > 5)','server rating validation');
has(endpoint,'if (comment.length < 20)','server substantive review threshold');
has(endpoint,"publication_consent: publicationConsent",'server publication consent storage');
has(endpoint,'REVIEW_DISCOUNT_RUB','server reward amount');
lacks(endpoint,'rating >= 4','positive-rating incentive');
lacks(endpoint,'rating > 3','positive-rating incentive');

has(storefront,'const PRICE_RUB = 299','public list price');
has(storefront,'const REVIEW_PRICE_RUB = 249','review price');
has(storefront,"reviewDiscountCode: reward?.code || ''",'checkout promo handoff');
has(storefront,'Купить дело — ${checkoutPrice} ₽','discounted purchase CTA');

has(checkout,'LAST_ARIA_PRICE_RUB !== 299','server list-price invariant');
has(checkout,'REVIEW_DISCOUNT_RUB !== 50','server discount invariant');
has(checkout,'REVIEW_DISCOUNT_PRICE_RUB !== 249','server discounted-price invariant');
has(checkout,'reserveReviewDiscount(admin, reviewDiscountCode, orderId, customerEmailHash)','server coupon reservation');
has(checkout,'Amount: amount','provider amount from server calculation');
lacks(checkout,'body.amount','client-controlled amount');
lacks(checkout,'body.price','client-controlled price');

has(discount,"RELEASEABLE_ORDER_STATUSES = new Set(['failed', 'canceled', 'refunded'])",'reservation release contract');
has(discount,'settleReviewDiscountForOrder','confirmed-payment coupon settlement');
has(commerce,'await settleReviewDiscountForOrder(admin, order);','settlement before entitlement');
has(commerce,'await releaseReviewDiscountReservation(admin, order.id);','canceled-payment coupon release');
has(status,'amountRub: Number(order.amount_value)','charged amount status');

has(migration,'alter table public.case_reviews enable row level security','review RLS');
has(migration,'alter table public.review_discount_rewards enable row level security','reward RLS');
has(migration,'revoke all on table public.case_reviews from public, anon, authenticated','review direct-access revoke');
has(migration,'revoke all on table public.review_discount_rewards from public, anon, authenticated','reward direct-access revoke');
has(migration,'reviewer_key_hash text not null unique','one reward per completion browser');
has(migration,'claimed_email_hash text null','email claim lock');

console.log('Review discount funnel contract PASS');
