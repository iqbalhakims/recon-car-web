#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Daily MySQL backup for car-sales-crm
# Saves compressed dump to /opt/backups/carcrm/ and keeps last 7 days.
# Optionally uploads to DigitalOcean Spaces (set DO_SPACES_* vars below).
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
CONTAINER="car-sales-crm-db-1"
DB_NAME="carcrm"
BACKUP_DIR="/opt/backups/carcrm"
KEEP_DAYS=7
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="carcrm_${DATE}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

# DigitalOcean Spaces (optional — leave blank to skip upload)
DO_SPACES_BUCKET=""        # e.g. my-bucket
DO_SPACES_REGION=""        # e.g. sgp1
DO_SPACES_KEY=""           # access key
DO_SPACES_SECRET=""        # secret key

# ── Create backup dir ─────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ── Read DB password from container env ──────────────────────────────────────
DB_PASS=$(docker exec "$CONTAINER" printenv MYSQL_ROOT_PASSWORD)

# ── Dump + compress ───────────────────────────────────────────────────────────
echo "[$(date)] Starting backup → $FILEPATH"

docker exec "$CONTAINER" sh -c \
  "mysqldump -u root -p\"${DB_PASS}\" --single-transaction --routines --triggers ${DB_NAME}" \
  | gzip > "$FILEPATH"

SIZE=$(du -sh "$FILEPATH" | cut -f1)
echo "[$(date)] Backup complete. Size: $SIZE"

# ── Upload to DO Spaces (optional) ───────────────────────────────────────────
if [[ -n "$DO_SPACES_BUCKET" && -n "$DO_SPACES_KEY" ]]; then
  ENDPOINT="https://${DO_SPACES_REGION}.digitaloceanspaces.com"
  DEST="s3://${DO_SPACES_BUCKET}/backups/carcrm/${FILENAME}"

  # Install s3cmd if missing
  if ! command -v s3cmd &>/dev/null; then
    apt-get install -y s3cmd -qq
  fi

  s3cmd put "$FILEPATH" "$DEST" \
    --access_key="$DO_SPACES_KEY" \
    --secret_key="$DO_SPACES_SECRET" \
    --host="$ENDPOINT" \
    --host-bucket="%(bucket)s.${DO_SPACES_REGION}.digitaloceanspaces.com" \
    --no-progress \
    && echo "[$(date)] Uploaded to Spaces: $DEST" \
    || echo "[$(date)] WARNING: Spaces upload failed (backup still saved locally)"
fi

# ── Delete backups older than KEEP_DAYS ──────────────────────────────────────
find "$BACKUP_DIR" -name "carcrm_*.sql.gz" -mtime "+${KEEP_DAYS}" -delete
REMAINING=$(ls "$BACKUP_DIR" | wc -l)
echo "[$(date)] Cleanup done. $REMAINING backup(s) retained."

# ── List current backups ──────────────────────────────────────────────────────
echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR"
