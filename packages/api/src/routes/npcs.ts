import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db.js';
import { getQuestsForNpc } from '../quests.js';

export async function npcRoutes(app: FastifyInstance) {
  // List / search NPCs
  app.get<{ Querystring: { search?: string; zone?: string; page?: string } }>(
    '/api/npcs',
    async (req) => {
      const search = req.query.search?.trim() ?? '';
      const zone = req.query.zone?.trim() ?? '';
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = 50;
      const offset = (page - 1) * limit;

      const conditions: string[] = [];
      const params: (string | number | null)[] = [];

      if (search) {
        conditions.push('(n.name LIKE ? OR n.lastname LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
      if (zone) {
        conditions.push('s2.zone = ?');
        params.push(zone);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const joinZone = zone
        ? `JOIN spawnentry se ON se.npcid = n.id
           JOIN spawngroup sg ON sg.id = se.spawngroupid
           JOIN spawn2 s2 ON s2.spawngroupid = sg.id`
        : '';

      return query(
        `SELECT DISTINCT n.id, n.name, n.lastname, n.level, n.class, n.race, n.hp
         FROM npc_types n ${joinZone}
         ${where}
         ORDER BY n.name
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );
    }
  );

  // NPC detail
  app.get<{ Params: { id: string } }>('/api/npcs/:id', async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.status(400).send({ error: 'Invalid NPC id' });

    const npc = await queryOne<Record<string, unknown>>(
      `SELECT n.*, f.name AS faction_name
       FROM npc_types n
       LEFT JOIN npc_faction nf ON nf.id = n.npc_faction_id
       LEFT JOIN faction_list f ON f.id = nf.primaryfaction
       WHERE n.id = ?`,
      [id]
    );
    if (!npc) return reply.status(404).send({ error: 'NPC not found' });

    const npcName = (npc.name as string) ?? '';

    const [spawnLocations, lootItems, merchantItems, spells, emotes, quests] =
      await Promise.all([
        // Zones where this NPC spawns
        query(
          `SELECT DISTINCT s2.zone, z.long_name, s2.x, s2.y, s2.z, s2.id AS spawn2_id
           FROM spawnentry se
           JOIN spawngroup sg ON sg.id = se.spawngroupid
           JOIN spawn2 s2 ON s2.spawngroupid = sg.id
           LEFT JOIN zone z ON z.short_name = s2.zone
           WHERE se.npcid = ?`,
          [id]
        ),
        // Loot: loottable → loottable_entries → lootdrop → lootdrop_entries → items
        query(
          `SELECT i.id, i.Name AS name, i.icon,
                  lde.chance AS drop_chance, lte.probability AS table_probability,
                  ROUND(lte.probability * lde.chance / 100, 4) AS final_pct
           FROM lootdrop_entries lde
           JOIN lootdrop ld ON ld.id = lde.lootdrop_id
           JOIN loottable_entries lte ON lte.lootdrop_id = ld.id
           JOIN loottable lt ON lt.id = lte.loottable_id
           JOIN npc_types n ON n.loottable_id = lt.id
           JOIN items i ON i.id = lde.item_id
           WHERE n.id = ?
           ORDER BY final_pct DESC`,
          [id]
        ),
        // Merchant inventory (only if merchant_id is set)
        query(
          `SELECT i.id, i.Name AS name, i.icon, ml.slot, ml.quantity,
                  ml.faction_required, ml.level_required, ml.classes_required
           FROM merchantlist ml
           JOIN items i ON i.id = ml.item
           WHERE ml.merchantid = (SELECT merchant_id FROM npc_types WHERE id = ?)
           ORDER BY ml.slot`,
          [id]
        ),
        // Spell set
        query(
          `SELECT s.id, s.name, nse.priority, nse.minlevel
           FROM npc_spells_entries nse
           JOIN spells_new s ON s.id = nse.spellid
           WHERE nse.npc_spells_id = (SELECT npc_spells_id FROM npc_types WHERE id = ?)
           ORDER BY nse.priority`,
          [id]
        ),
        // Emotes — joined via npc_types.emoteid
        query(
          `SELECT e.id, e.text, e.\`type\`, e.event_
           FROM npc_emotes e
           JOIN npc_types n ON n.emoteid = e.emoteid
           WHERE n.id = ? AND n.emoteid != 0
           ORDER BY e.id`,
          [id]
        ),
        // Quests from JSON
        getQuestsForNpc(npcName),
      ]);

    return {
      npc,
      spawn_locations: spawnLocations,
      loot: lootItems,
      merchant_inventory: merchantItems,
      spells,
      emotes,
      quests,
    };
  });
}
