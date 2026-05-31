/**
 * Builds a Fastify test app with all API routes registered.
 * Does NOT register static-file serving or start a TCP listener.
 * Use app.inject() for in-process HTTP requests in tests.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import { aaRoutes } from '../../routes/aas.js';
import { factionRoutes } from '../../routes/factions.js';
import { itemRoutes } from '../../routes/items.js';
import { npcRoutes } from '../../routes/npcs.js';
import { questRoutes } from '../../routes/quests.js';
import { recipeRoutes } from '../../routes/recipes.js';
import { searchRoutes } from '../../routes/search.js';
import { spellRoutes } from '../../routes/spells.js';
import { zoneRoutes } from '../../routes/zones.js';

export function createTestApp(): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(zoneRoutes);
  app.register(npcRoutes);
  app.register(itemRoutes);
  app.register(spellRoutes);
  app.register(factionRoutes);
  app.register(aaRoutes);
  app.register(recipeRoutes);
  app.register(questRoutes);
  app.register(searchRoutes);
  return app;
}
