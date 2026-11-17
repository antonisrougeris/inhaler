# Remaining acceptance work

The repository implements the primary storefront and transactional backbone. The full master specification is not yet fully accepted.

- Run browser E2E, mobile visual/accessibility and performance review in CI or an unrestricted browser environment. Local Chromium and managed preview were blocked by execution infrastructure.
- Run Docker build and deployment smoke checks; no Docker daemon was available locally.
- Validate Viva payment creation, retrieval, duplicate/failed/late notifications, full refunds and reconciliation with merchant sandbox credentials. Automated failed-payment and reversal event processing needs expansion; pending reservations currently expire safely.
- Validate BOX NOW actual destination, shipment, PDF and tracking contracts. Add shipment callbacks and verified delivery email handling.
- Add final supplier photography/CAD, SKU specifications, compositions, instructions, manufacturer/importer details and reviewed compliance documents. Illustrations are concepts, not measured product designs.
- Complete legal/controller/business information, retention decisions and approved sales/returns content before public data collection or commerce.
- Expand admin relationship selectors/pagination, public verified-purchase review submission, customer address management, full image gallery and media publishing, homepage copy editing beyond stored FAQ/editorial content, and consent-filtered launch campaign tools.
- Expand translations in administrative/provider-generated order details and transactional emails; add complete per-route SEO metadata/structured data and final social preview assets.
- SMTP and private S3 require credentials and delivery/storage verification. Marketing campaigns and optional analytics are not active.

No production-ready, certification, product safety, stock availability or provider-live-testing claim is made.
