#!/bin/sh
set -e

QUESTS_DIR="${QUEST_SOURCE_DIR:-/app/quests}"
OUT_DIR="${QUEST_DATA_DIR:-/app/data/quests}"

if [ -d "$QUESTS_DIR" ]; then
  echo "==> Running quest parser (source: $QUESTS_DIR)"
  node /app/packages/parser/dist/index.js --quests "$QUESTS_DIR" --out "$OUT_DIR"
else
  echo "==> Quest source not mounted at $QUESTS_DIR, skipping parser (quest data may be empty)"
fi

echo "==> Starting TAKP Wiki API"
exec node /app/packages/api/dist/index.js
