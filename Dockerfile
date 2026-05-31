# Build from the takp-wiki/ directory:
#   docker build -t takp-wiki .

# ─── Stage 1: Clone quest Lua sources ────────────────────────────────────────
# Isolated so re-builds triggered by wiki code changes never re-clone.
FROM node:20-alpine AS quest-clone
ARG QUESTS_REPO=https://github.com/EQMacEmu/quests.git
RUN apk add --no-cache git \
 && git clone --depth=1 "$QUESTS_REPO" /quests

# ─── Stage 2: Clone and build the quest parser ───────────────────────────────
# Also isolated — only invalidated when PARSER_REPO changes.
FROM node:20-alpine AS quest-parser
ARG PARSER_REPO=https://github.com/mathieugallant/takp-wiki-quest-parser.git
RUN apk add --no-cache git \
 && git clone --depth=1 "$PARSER_REPO" /parser
WORKDIR /parser
RUN npm ci && npm run build

# ─── Stage 3: Parse quest data ───────────────────────────────────────────────
# Runs the built parser against the cloned quests; output is baked into the image.
FROM node:20-alpine AS quest-data
COPY --from=quest-parser /parser /parser
COPY --from=quest-clone  /quests /tmp/quests
RUN mkdir -p /data/quests \
 && node /parser/dist/index.js --quests /tmp/quests --out /data/quests

# ─── Stage 4: Install wiki npm dependencies ──────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/api/package.json ./packages/api/
COPY packages/web/package.json ./packages/web/
RUN npm ci

# ─── Stage 5: Build API and web ──────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build --workspace=packages/api \
 && npm run build --workspace=packages/web

# ─── Stage 6: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder    /app/packages/api/dist        ./packages/api/dist
COPY --from=builder    /app/packages/web/dist        ./packages/web/dist
COPY --from=builder    /app/node_modules             ./node_modules
# Parser binary + its own node_modules (for runtime re-parsing via entrypoint.sh)
COPY --from=quest-parser /parser/dist                ./packages/parser/dist
COPY --from=quest-parser /parser/node_modules        ./packages/parser/node_modules
# Quest JSON baked in at build time
COPY --from=quest-data   /data/quests                ./data/quests
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# If a quests volume is mounted at /app/quests, entrypoint.sh re-parses it on
# startup, overwriting the baked-in data with fresh content.
ENV QUEST_DATA_DIR=/app/data/quests
ENV QUEST_SOURCE_DIR=/app/quests
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
