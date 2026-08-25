create index if not exists review_discount_used_order_idx
  on public.review_discount_rewards (used_order_id)
  where used_order_id is not null;
