# Integrations

Viva uses hosted checkout, backend transaction retrieval and database event idempotency. The webhook registration key is not treated as a notification signature. Only verified amount, order code, currency and final transaction state can settle an order. Configure the provider return URL to `/el/checkout/return` and webhook to `/api/payments/webhook`. Never infer payment from a browser redirect. Restrict webhook ingress using the provider's current documented network guidance.

Official references inspected:
- https://developer.viva.com/smart-checkout/smart-checkout-integration/
- https://developer.viva.com/webhooks-for-payments/setting-up-webhooks/
- https://developer.viva.com/tutorials/payments/issue-a-refund/
- https://boxnow.gr/en/docs/api/partner-api/request-a-delivery
- https://boxnow.gr/en/docs/api/partner-api/list-all-available-destinations

BOX NOW supports server-fetched locker selection, delivery request creation, labels and operator-triggered tracking refresh. Confirm response contracts, parcel sizes/weights and merchant-origin settings against your partner sandbox before activation. Tracking callbacks are not yet implemented.

No real provider credentials were supplied. Tests use fixtures/local mock providers, not successful Viva/BOX NOW sandbox calls. Refunds are full refunds only; uncertain writes stay blocked for manual reconciliation. Do not automatically retry an ambiguous provider timeout.

For local test commerce use APP_ENV=test/development, ALLOW_TEST_COMMERCE=true, PAYMENT_PROVIDER=mock and SHIPPING_PROVIDER=mock, then owner-select TEST and explicitly add test inventory. Mock providers cannot run in production. LIVE additionally requires server approval, provider configuration, store declarations and per-product compliance checks. The seed never grants these approvals.
