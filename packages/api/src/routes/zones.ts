import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db.js';
import { getQuestsForZone } from '../quests.js';

export async function zoneRoutes(app: FastifyInstance) {
  // List zones
  app.get<{ Querystring: { search?: string; sort?: string; dir?: string; page?: string } }>(
    '/api/zones',
    async (req) => {
      const search = req.query.search?.trim() ?? '';
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = 50;
      const offset = (page - 1) * limit;

      const ZONE_SORT: Record<string, string> = {
        id: 'zoneidnumber', name: 'long_name', short_name: 'short_name',
        expansion: 'expansion', min_level: 'min_level',
      };
      const sortCol = ZONE_SORT[req.query.sort ?? ''] ?? 'long_name';
      const sortDir = req.query.dir === 'desc' ? 'DESC' : 'ASC';

      const conditions: string[] = [];
      const params: (string | number)[] = [];
      if (search) {
        conditions.push('(long_name LIKE ? OR short_name LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      return query(
        `SELECT zoneidnumber AS id, short_name, long_name, expansion, min_level, hotzone
         FROM zone
         ${where}
         ORDER BY ${sortCol} ${sortDir}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );
    }
  );

  // Zone detail
  app.get<{ Params: { id: string } }>('/api/zones/:id', async (req, reply) => {
    const raw = req.params.id;
    const numericId = parseInt(raw, 10);

    // Accept either a numeric zone ID or a short_name string.
    const zone = await queryOne<Record<string, unknown>>(
      `SELECT z.*, g.x AS grav_x, g.y AS grav_y, g.z AS grav_z
       FROM zone z
       LEFT JOIN graveyard g ON g.id = z.graveyard_id
       WHERE ${!isNaN(numericId) ? 'z.zoneidnumber = ?' : 'z.short_name = ?'}`,
      [!isNaN(numericId) ? numericId : raw]
    );
    if (!zone) return reply.status(404).send({ error: 'Zone not found' });

    const short_name = zone.short_name as string;

    const [npcs, zonePoints, quests] = await Promise.all([
      // NPCs that spawn in this zone (via spawn2)
      query(
        `SELECT DISTINCT n.id, n.name, n.level, n.class, n.race, n.hp,
                s2.x, s2.y, s2.z
         FROM npc_types n
         JOIN spawnentry se ON se.npcid = n.id
         JOIN spawngroup sg ON sg.id = se.spawngroupid
         JOIN spawn2 s2 ON s2.spawngroupid = sg.id
         WHERE s2.zone = ?
         ORDER BY n.name
         LIMIT 500`,
        [short_name]
      ),
      // Zone connections
      query(
        `SELECT zp.id, zp.zone, zp.target_zone_id, z2.short_name AS dest_short,
                z2.long_name AS dest_long
         FROM zone_points zp
         LEFT JOIN zone z2 ON z2.zoneidnumber = zp.target_zone_id
         WHERE zp.zone = ?`,
        [short_name]
      ),
      // Quests from parsed JSON
      getQuestsForZone(short_name),
    ]);

    return { zone, npcs, zone_points: zonePoints, quests };
  });
}
