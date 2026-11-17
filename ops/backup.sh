#!/usr/bin/env sh
set -eu
umask 077
backup_dir=${1:?Provide an encrypted backup directory outside the application checkout}
mkdir -p "$backup_dir"
docker compose exec -T db pg_dump -U formair -d formair -Fc > "$backup_dir/formair-$(date -u +%Y%m%dT%H%M%SZ).dump"
