# Deployment

Use a separate checkout, Compose project, database, volume and virtual host. The example binds only `127.0.0.1:3107`; it does not modify SKANARE.

1. Copy `.env.example` to `.env`, set a URL-safe random POSTGRES_PASSWORD, DATABASE_URL, APP_URL and BETTER_AUTH_SECRET. Use APP_ENV=staging initially, no live approval.
2. `docker compose up -d db`
3. `docker compose --profile tools run --rm migrate`
4. `docker compose --profile tools run --rm migrate npm run db:seed`
5. Provision the owner with the tools image and ephemeral ADMIN_EMAIL/ADMIN_PASSWORD variables.
6. `docker compose up -d --build app`
7. Configure a separate Nginx virtual host from ops/nginx.conf, substitute your domain, provision valid TLS and run `nginx -t` before reload. Set APP_URL to that exact HTTPS origin and TRUST_PROXY=true only behind the supplied proxy which overwrites X-Real-IP.
8. Check `/api/health`; run staging acceptance before any live switch.

No automatic deployment is configured. GitHub Actions validates PRs and can manually publish a versioned GHCR image.

SMTP variables enable immediate delivery attempts for queued signup/authentication messages. `docker compose --profile tools run --rm jobs` processes retries, expires reservations and cleans transient data. Reservations also expire opportunistically during checkout: there is no idle stock polling. Arrange explicit retry/cleanup execution operationally. A crashed SENDING email or uncertain provider write needs operator reconciliation; never blindly replay payment/refund/shipment creation.

## Backup and recovery

Run `ops/backup.sh /encrypted/backup/path`, copy the dump to access-controlled off-host storage, and back up private S3 objects separately. Test restores on an isolated database. To restore: stop the app, create a clean database, and pipe a reviewed dump into `docker compose exec -T db pg_restore -U formair -d formair --no-owner`. Restore matching application version and secrets before starting. Do not overwrite production without a verified recovery plan.

Production secrets: DATABASE_URL, APP_URL, BETTER_AUTH_SECRET, APP_ENV, SMTP_HOST/PORT/SECURE/USER/PASSWORD, EMAIL_FROM; Viva and BOX NOW values documented in .env.example; private object storage requires S3_ENDPOINT/REGION/BUCKET/ACCESS_KEY_ID/SECRET_ACCESS_KEY.
