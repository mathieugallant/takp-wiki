import type { FastifyInstance } from 'fastify';
import { getQuestIndex, getQuestData, type QuestData } from '../quests.js';
import { query } from '../db.js';

export async function questRoutes(app: FastifyInstance) {
  // All quests (index)
  app.get('/api/quests', async () => {
    return getQuestIndex();
  });

  // Quests by zone
  app.get<{ Params: { zone: string } }>('/api/quests/:zone', async (req, reply) => {
    const index = await getQuestIndex();
    const paths = index.by_zone[req.params.zone];
    if (!paths) return reply.status(404).send({ error: 'Zone not found in quest data' });
    const results = await Promise.all(paths.map(getQuestData));
    return results.filter((d): d is QuestData => d !== null);
  });

  // Single quest: zone + npc name
  app.get<{ Params: { zone: string; npc: string } }>(
    '/api/quests/:zone/:npc',
    async (req, reply) => {
      const { zone, npc } = req.params;
      const relPath = `${zone}/${npc}.lua`;
      let data = await getQuestData(relPath);
      if (!data) {
        const encPath = `${zone}/encounters/${npc}.lua`;
        data = await getQuestData(encPath);
        if (!data) return reply.status(404).send({ error: 'Quest not found' });
      }

      // Look up the NPC's spawn location in the DB using the cleaned name
      // NPC file names use underscores instead of spaces; try both forms.
      const npcNameDb = data.npc_name.replace(/_/g, ' ');
      const spawnLocations = await query<{
        npc_id: number; x: number; y: number; z: number;
      }>(
        `SELECT DISTINCT n.id AS npc_id, s2.x, s2.y, s2.z
         FROM npc_types n
         JOIN spawnentry se ON se.npcid = n.id
         JOIN spawngroup sg ON sg.id = se.spawngroupid
         JOIN spawn2 s2 ON s2.spawngroupid = sg.id
         WHERE (n.name = ? OR n.name = ?) AND s2.zone = ?
         LIMIT 5`,
        [data.npc_name, npcNameDb, zone]
      );

      return { ...data, npc_spawn: spawnLocations };
    }
  );
}
