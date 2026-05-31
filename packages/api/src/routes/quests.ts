import type { FastifyInstance } from 'fastify';
import { getQuestIndex, getQuestData, type QuestData } from '../quests.js';

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
      const data = await getQuestData(relPath);
      if (!data) {
        // Try encounters subdir
        const encPath = `${zone}/encounters/${npc}.lua`;
        const encData = await getQuestData(encPath);
        if (!encData) return reply.status(404).send({ error: 'Quest not found' });
        return encData;
      }
      return data;
    }
  );
}
