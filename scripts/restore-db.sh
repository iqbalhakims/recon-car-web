#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Restore carcrm database from a backup file
# Usage: ./restore-db.sh /opt/backups/carcrm/carcrm_2026-05-26_03-00-00.sql.gz
#        ./restore-db.sh latest    ← restores the most recent backup
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

CONTAINER="car-sales-crm-db-1"
DB_NAME="carcrm"
BACKUP_DIR="/opt/backups/carcrm"

# ── Resolve file ──────────────────────────────────────────────────────────────
if [[ "${1:-}" == "latest" || -z "${1:-}" ]]; then
  FILEPATH=$(ls -t "$BACKUP_DIR"/carcrm_*.sql.gz 2>/dev/null | head -1)
  if [[ -z "$FILEPATH" ]]; then
    echo "ERROR: No backups found in $BACKUP_DIR"
    exit 1
  fi
  echo "Using latest backup: $FILEPATH"
else
  FILEPATH="$1"
fi

if [[ ! -f "$FILEPATH" ]]; then
  echo "ERROR: File not found: $FILEPATH"
  exit 1
fi

# ── Confirm ───────────────────────────────────────────────────────────────────
echo ""
echo "⚠️  This will DROP and recreate the '$DB_NAME' database."
echo "    File: $FILEPATH"
echo "    Size: $(du -sh "$FILEPATH" | cut -f1)"
echo ""
read -p "Type YES to continue: " CONFIRM
if [[ "$CONFIRM" != "YES" ]]; then
  echo "Aborted."
  exit 0
fi

# ── Read DB password ──────────────────────────────────────────────────────────
DB_PASS=$(docker exec "$CONTAINER" printenv MYSQL_ROOT_PASSWORD)

# ── Drop + recreate DB ────────────────────────────────────────────────────────
echo "[$(date)] Dropping and recreating database..."
docker exec "$CONTAINER" sh -c \
  "mysql -u root -p\"${DB_PASS}\" -e \"DROP DATABASE IF EXISTS ${DB_NAME}; CREATE DATABASE ${DB_NAME};\""

# ── Restore ───────────────────────────────────────────────────────────────────
echo "[$(date)] Restoring from backup..."
gunzip -c "$FILEPATH" | docker exec -i "$CONTAINER" sh -c \
  "mysql -u root -p\"${DB_PASS}\" ${DB_NAME}"

# ── Verify ────────────────────────────────────────────────────────────────────
echo "[$(date)] Verifying tables..."
docker exec "$CONTAINER" sh -c \
  "mysql -u root -p\"${DB_PASS}\" ${DB_NAME} -e \"SHOW TABLES;\""

echo ""
echo "[$(date)] ✅ Restore complete. Restart the backend:"
echo "    docker restart car-sales-crm-backend-1"
