import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db.js';

export async function factionRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { search?: string; page?: string } }>(
    '/api/factions',
    async (req) => {
      const search = req.query.search?.trim() ?? '';
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = 50;
      const offset = (page - 1) * limit;

      if (search) {
        return query(
          `SELECT id, name, base, min_cap, max_cap
           FROM faction_list WHERE name LIKE ?
           ORDER BY name LIMIT ? OFFSET ?`,
          [`%${search}%`, limit, offset]
        );
      }
      return query(
        `SELECT id, name, base, min_cap, max_cap FROM faction_list
         ORDER BY name LIMIT ? OFFSET ?`,
        [limit, offset]
      );
    }
  );

  app.get<{ Params: { id: string } }>('/api/factions/:id', async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.status(400).send({ error: 'Invalid faction id' });

    const faction = await queryOne('SELECT * FROM faction_list WHERE id = ?', [id]);
    if (!faction) return reply.status(404).send({ error: 'Faction not found' });

    const npcs = await query(
      `SELECT n.id, n.name, n.level, n.class
       FROM npc_types n
       JOIN npc_faction nf ON nf.id = n.npc_faction_id
       WHERE nf.primaryfaction = ?
       ORDER BY n.name LIMIT 200`,
      [id]
    );

    return { faction, npcs };
  });
}
