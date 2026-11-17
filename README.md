# FORM AIR

Independent Next.js / TypeScript storefront for a Greek flavored-air brand. Default state: **PRELAUNCH**, zero stock, illustrative concept products. No production deployment or live payment activation has been performed.

## Development

Use Node 24 and PostgreSQL 18.

```sh
npm ci
cp .env.example .env
# Set DATABASE_URL, APP_URL and a random BETTER_AUTH_SECRET.
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Alternatively set `USE_EMBEDDED_DB=true` in a local `.env` to run development PostgreSQL with the app. This is development-only. Provision an owner using `ADMIN_EMAIL` and `ADMIN_PASSWORD` (16+ characters) for `npm run admin:create`; remove bootstrap variables afterwards. Never commit credentials.

## Implemented

- Greek/English storefront, responsive editorial layout, GSAP reveals and parallax, reduced-motion support, original labeled SVG concept art, optional lazy React Three Fiber viewer.
- Catalog, categories, variants, aromas, kit builder, wishlist, database carts, checkout quote, VAT-inclusive integer-cent pricing and coupon validation.
- PostgreSQL/Prisma migrations, stock reservations in serializable transactions, exact bundle component deductions, duplicate checkout/payment protection and late-payment review.
- Better Auth accounts, email verification/reset, owner/admin authorization, persistent admin forms, inventory adjustments, content, compliance records, private document upload and audit history.
- Waitlist consent records, confirmation/unsubscribe, surveys, CSV export and SMTP email queue.
- Viva sandbox/live adapter and BOX NOW adapter behind provider interfaces; explicitly labeled local test providers.
- Docker, isolated Compose services, Nginx example, CI and manually triggered image publishing (no server deployment).

## Tests

```sh
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Integration tests require a **dedicated test database** with migrations and seed applied. They modify stock and store mode. `LOCAL_DB_DIR=.test-db node --import tsx scripts/with-db.ts verify:db` provisions an isolated local test database.

Verification: typecheck, lint without warnings, 8 unit tests and 13 PostgreSQL integration tests passed, including the final database constraints. Production build was verified before and after the final changes. Browser tests were attempted but this workspace rejected Chromium Unix sockets; managed preview also failed. Do not interpret those attempts as passing visual/mobile QA. Docker is not installed in the execution workspace; its build is delegated to CI.

## Deployment and operational limits

See [deployment](docs/deployment.md), [integration notes](docs/integrations.md) and [remaining acceptance work](docs/acceptance.md). This is a reviewable implementation, **not a declaration of production readiness**.
