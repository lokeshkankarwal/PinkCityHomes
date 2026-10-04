#!/usr/bin/env bash
# ==============================================================================
# PinkCityHomes — Safe Local to MongoDB Atlas Migration Script
# ==============================================================================
set -euo pipefail

# Configuration
LOCAL_URI="${LOCAL_MONGODB_URI:-mongodb://127.0.0.1:27017/pinkcityhomes}"
TARGET_DB="pinkcityhomes"
BACKUP_DIR="./backup-pinkcityhomes"

echo "=========================================================="
echo " PinkCityHomes — MongoDB Atlas Migration"
echo "=========================================================="
echo "Source Local URI:  $LOCAL_URI"
echo "Target Database:   $TARGET_DB"
echo "Backup Directory:  $BACKUP_DIR"
echo "=========================================================="

if [ -z "${MONGODB_URI:-}" ]; then
  if [ -f .env ]; then
    export $(grep -v '^#' .env | grep '^MONGODB_URI=' | xargs || true)
  elif [ -f server/.env ]; then
    export $(grep -v '^#' server/.env | grep '^MONGODB_URI=' | xargs || true)
  fi
fi

if [ -z "${MONGODB_URI:-}" ]; then
  echo "ERROR: MONGODB_URI environment variable is not set."
  echo "Please set your Atlas connection string:"
  echo "  export MONGODB_URI=\"mongodb+srv://<user>:<password>@cluster.mongodb.net/pinkcityhomes?retryWrites=true&w=majority\""
  echo "Then rerun this script."
  exit 1
fi

# Step 1: Dump local database
echo ""
echo "--> [1/2] Creating local dump of database '$TARGET_DB'..."
mkdir -p "$BACKUP_DIR"
mongodump --uri="$LOCAL_URI" --out="$BACKUP_DIR"

echo "Local dump completed successfully in $BACKUP_DIR."

# Step 2: Restore exclusively the target database to Atlas
echo ""
echo "--> [2/2] Restoring '$TARGET_DB' to MongoDB Atlas..."
echo "(Note: Only namespace '$TARGET_DB.*' will be restored; sample datasets and other databases are untouched.)"

mongorestore \
  --uri="$MONGODB_URI" \
  --nsInclude="${TARGET_DB}.*" \
  "$BACKUP_DIR"

echo ""
echo "=========================================================="
echo "✓ Migration completed successfully!"
echo "  All collections in '$TARGET_DB' have been safely migrated to Atlas."
echo "=========================================================="
