import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db.js';
import { getQuestsForItem } from '../quests.js';

export async function itemRoutes(app: FastifyInstance) {
  // List / search items
  app.get<{ Querystring: { search?: string; class?: string; race?: string; type?: string; level?: string; effect?: string; sort?: string; dir?: string; page?: string } }>(
    '/api/items',
    async (req) => {
      const search = req.query.search?.trim() ?? '';
      const classId = req.query.class ? parseInt(req.query.class, 10) : null;
      const raceId = req.query.race ? parseInt(req.query.race, 10) : null;
      const itemType = req.query.type !== undefined && req.query.type !== '' ? parseInt(req.query.type, 10) : null;
      const maxLevel = req.query.level ? parseInt(req.query.level, 10) : null;
      const effectId = req.query.effect ? parseInt(req.query.effect, 10) : null;
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = 50;
      const offset = (page - 1) * limit;

      const conditions: string[] = [];
      const params: (string | number)[] = [];

      if (search) {
        conditions.push('(Name LIKE ? OR lore LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
      if (classId !== null && !isNaN(classId) && classId >= 1 && classId <= 15) {
        conditions.push('(classes & ?) != 0');
        params.push(1 << (classId - 1));
      }
      if (raceId !== null && !isNaN(raceId) && raceId >= 1 && raceId <= 14) {
        conditions.push('(races & ?) != 0');
        params.push(1 << (raceId - 1));
      }
      if (itemType !== null && !isNaN(itemType)) {
        conditions.push('itemtype = ?');
        params.push(itemType);
      }
      if (maxLevel !== null && !isNaN(maxLevel) && maxLevel > 0) {
        conditions.push('(reqlevel = 0 OR reqlevel <= ?)');
        params.push(maxLevel);
      }
      if (effectId !== null && !isNaN(effectId)) {
        // Match items whose click/worn/proc/focus/scroll spell has this effect
        conditions.push(
          `EXISTS (
            SELECT 1 FROM spells_new s
            WHERE s.id IN (clickeffect, worneffect, proceffect, focuseffect, scrolleffect)
              AND s.id > 0
              AND (s.effectid1 = ? OR s.effectid2 = ? OR s.effectid3 = ?
                OR s.effectid4 = ? OR s.effectid5 = ? OR s.effectid6 = ?
                OR s.effectid7 = ? OR s.effectid8 = ? OR s.effectid9 = ?
                OR s.effectid10 = ? OR s.effectid11 = ? OR s.effectid12 = ?)
          )`
        );
        for (let i = 0; i < 12; i++) params.push(effectId);
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const ITEM_SORT: Record<string, string> = {
        id: 'id', name: 'Name', itemtype: 'itemtype', ac: 'ac',
        damage: 'CASE WHEN delay > 0 THEN damage / delay ELSE 0 END',
      };
      const sortCol = ITEM_SORT[req.query.sort ?? ''] ?? 'Name';
      const sortDir = req.query.dir === 'desc' ? 'DESC' : 'ASC';

      return query(
        `SELECT id, Name AS name, icon, itemtype, ac, damage, delay, weight, magic, nodrop, norent, slots
         FROM items
         ${where}
         ORDER BY ${sortCol} ${sortDir}
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );
    }
  );

  // Item detail
  app.get<{ Params: { id: string } }>('/api/items/:id', async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.status(400).send({ error: 'Invalid item id' });

    const item = await queryOne<Record<string, unknown>>(
      'SELECT *, Name AS name FROM items WHERE id = ?',
      [id]
    );
    if (!item) return reply.status(404).send({ error: 'Item not found' });

    const [
      clickSpell,
      wornSpell,
      procSpell,
      focusSpell,
      scrollSpell,
      merchants,
      recipesProducing,
      recipesConsuming,
      lootSources,
      quests,
    ] = await Promise.all([
      // Click/worn/proc/focus spell effects
      item.clickeffect && (item.clickeffect as number) > 0
        ? queryOne('SELECT id, name, mana, cast_time, `range` FROM spells_new WHERE id = ?', [item.clickeffect as number])
        : Promise.resolve(null),
      item.worneffect && (item.worneffect as number) > 0
        ? queryOne('SELECT id, name, mana, cast_time, `range` FROM spells_new WHERE id = ?', [item.worneffect as number])
        : Promise.resolve(null),
      item.proceffect && (item.proceffect as number) > 0
        ? queryOne('SELECT id, name, mana, cast_time, `range` FROM spells_new WHERE id = ?', [item.proceffect as number])
        : Promise.resolve(null),
      item.focuseffect && (item.focuseffect as number) > 0
        ? queryOne('SELECT id, name, mana, cast_time, `range` FROM spells_new WHERE id = ?', [item.focuseffect as number])
        : Promise.resolve(null),
      item.scrolleffect && (item.scrolleffect as number) > 0
        ? queryOne('SELECT id, name, mana, cast_time, `range` FROM spells_new WHERE id = ?', [item.scrolleffect as number])
        : Promise.resolve(null),
      // Merchants who sell this item
      query(
        `SELECT n.id AS npc_id, n.name AS npc_name, ml.slot, ml.quantity, ml.faction_required,
                (SELECT s2.zone FROM spawnentry se
                 JOIN spawngroup sg ON sg.id = se.spawngroupid
                 JOIN spawn2 s2 ON s2.spawngroupid = sg.id
                 WHERE se.npcid = n.id LIMIT 1) AS zone
         FROM merchantlist ml
         JOIN npc_types n ON n.merchant_id = ml.merchantid
         WHERE ml.item = ?
         ORDER BY n.name`,
        [id]
      ),
      // Recipes that produce this item
      query(
        `SELECT r.id, r.name AS recipe_name, r.tradeskill, r.trivial, r.skillneeded,
                tre.successcount AS qty
         FROM tradeskill_recipe_entries tre
         JOIN tradeskill_recipe r ON r.id = tre.recipe_id
         WHERE tre.item_id = ? AND tre.iscontainer = 0 AND tre.successcount > 0`,
        [id]
      ),
      // Recipes that consume this item as an ingredient
      query(
        `SELECT r.id, r.name AS recipe_name, r.tradeskill, r.trivial, r.skillneeded,
                tre.componentcount AS qty
         FROM tradeskill_recipe_entries tre
         JOIN tradeskill_recipe r ON r.id = tre.recipe_id
         WHERE tre.item_id = ? AND tre.iscontainer = 0 AND tre.successcount = 0`,
        [id]
      ),
      // NPCs that drop this item (reversed loot chain)
      query(
        `SELECT n.id AS npc_id, n.name AS npc_name,
                lde.chance AS drop_chance, lte.probability AS table_probability,
                ROUND(lte.probability * lde.chance / 100, 4) AS final_pct,
                (SELECT s2.zone FROM spawnentry se
                 JOIN spawngroup sg ON sg.id = se.spawngroupid
                 JOIN spawn2 s2 ON s2.spawngroupid = sg.id
                 WHERE se.npcid = n.id LIMIT 1) AS zone
         FROM lootdrop_entries lde
         JOIN lootdrop ld ON ld.id = lde.lootdrop_id
         JOIN loottable_entries lte ON lte.lootdrop_id = ld.id
         JOIN loottable lt ON lt.id = lte.loottable_id
         JOIN npc_types n ON n.loottable_id = lt.id
         WHERE lde.item_id = ?
         ORDER BY final_pct DESC
         LIMIT 100`,
        [id]
      ),
      // Quest references from JSON
      getQuestsForItem(id),
    ]);

    return {
      item,
      spells: {
        click: clickSpell,
        worn: wornSpell,
        proc: procSpell,
        focus: focusSpell,
        scroll: scrollSpell,
      },
      merchants,
      recipes_producing: recipesProducing,
      recipes_consuming: recipesConsuming,
      loot_sources: lootSources,
      quests,
    };
  });
}
