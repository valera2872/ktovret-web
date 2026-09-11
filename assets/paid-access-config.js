window.MysteryLogicPaidAccessConfig={
  version:'2.1.0',
  endpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/case-access',
  checkoutEnabled:true,
  checkoutEndpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/create-checkout',
  paymentStatusEndpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/payment-status',
  productId:'volume1',
  products:{volume1:{label:'Полный архив «Кто врёт?»',priceRub:199,caseCount:85}},
  tokenStorageKey:'mysterylogic:volume1:access-token',
  orderStorageKey:'mysterylogic:volume1:last-order-id',
  requestStorageKey:'mysterylogic:volume1:checkout-request-id'
};
