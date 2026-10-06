-- AI-02 "Нулевая копия" production product alignment.
-- Idempotent: preserves entitlement UUIDs/sessions and only replaces the legacy preview product id.
update public.paid_case_payloads
set product_id = 'ai02-zero-copy',
    updated_at = now()
where case_id in ('AI02-NK-EASY','AI02-NK-STANDARD','AI02-NK-HARD')
  and product_id = 'ai02-nk-preview';

update public.access_entitlements
set product_id = 'ai02-zero-copy',
    updated_at = now()
where product_id = 'ai02-nk-preview'
  and not exists (
    select 1
    from public.access_entitlements target
    where target.token_hash = access_entitlements.token_hash
      and target.product_id = 'ai02-zero-copy'
      and target.id <> access_entitlements.id
  );
