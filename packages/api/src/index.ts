import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import { zoneRoutes } from './routes/zones.js';
import { npcRoutes } from './routes/npcs.js';
import { itemRoutes } from './routes/items.js';
import { spellRoutes } from './routes/spells.js';
import { factionRoutes } from './routes/factions.js';
import { aaRoutes } from './routes/aas.js';
import { recipeRoutes } from './routes/recipes.js';
import { questRoutes } from './routes/quests.js';
import { searchRoutes } from './routes/search.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

const app = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } });

await app.register(cors, { origin: true });

// Serve built frontend from packages/web/dist if it exists
const webDistPath = path.resolve(__dirname, '../../web/dist');
const webDistExists = fs.existsSync(webDistPath);

if (webDistExists) {
  await app.register(staticFiles, {
    root: webDistPath,
    prefix: '/',
    // Keep decorateReply enabled (default) so reply.sendFile works in the SPA fallback
  });
}

// Register all route modules
await app.register(searchRoutes);
await app.register(zoneRoutes);
await app.register(npcRoutes);
await app.register(itemRoutes);
await app.register(spellRoutes);
await app.register(factionRoutes);
await app.register(aaRoutes);
await app.register(recipeRoutes);
await app.register(questRoutes);

// Health check
app.get('/api/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

// SPA fallback — must be registered after all API routes so it only catches
// unmatched requests, and after staticFiles so reply.sendFile is decorated.
app.setNotFoundHandler((_req, reply) => {
  if (webDistExists) {
    return reply.sendFile('index.html', webDistPath);
  }
  return reply.status(404).send({ error: 'Not found' });
});

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`TAKP Wiki API listening on http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
