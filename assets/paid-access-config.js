window.MysteryLogicPaidAccessConfig={
  version:'2.0.0',
  endpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/case-access',
  checkoutEnabled:true,
  checkoutEndpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/create-checkout',
  paymentStatusEndpoint:'https://orknvuwknvsedjgqcfwc.supabase.co/functions/v1/payment-status',
  productId:'volume1',
  products:{
    volume1:{label:'Том I',priceRub:199,caseCount:50},
    volume2:{label:'Том II',priceRub:199,caseCount:50},
    volume_bundle_1_2:{label:'Том I + Том II',priceRub:299,caseCount:100,bestValue:true}
  },
  // Keep the historical key so an existing Volume I browser token continues to work.
  // The same opaque token can now carry entitlements for several products.
  tokenStorageKey:'mysterylogic:volume1:access-token',
  orderStorageKey:'mysterylogic:who-lied:last-order-id',
  requestStorageKey:'mysterylogic:who-lied:checkout-request-id'
};
