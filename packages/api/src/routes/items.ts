import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db.js';
import { getQuestsForItem } from '../quests.js';

export async function itemRoutes(app: FastifyInstance) {
  // List / search items
  app.get<{ Querystring: { search?: string; page?: string } }>(
    '/api/items',
    async (req) => {
      const search = req.query.search?.trim() ?? '';
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = 50;
      const offset = (page - 1) * limit;

      if (search) {
        return query(
          `SELECT id, Name AS name, icon, itemtype, ac, damage, delay, weight, magic, nodrop, norent
           FROM items
           WHERE Name LIKE ? OR lore LIKE ?
           ORDER BY Name
           LIMIT ? OFFSET ?`,
          [`%${search}%`, `%${search}%`, limit, offset]
        );
      }
      return query(
        `SELECT id, Name AS name, icon, itemtype, ac, damage, delay, weight, magic, nodrop, norent
         FROM items
         ORDER BY Name
         LIMIT ? OFFSET ?`,
        [limit, offset]
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
      // Merchants who sell this item
      query(
        `SELECT n.id AS npc_id, n.name AS npc_name, ml.slot, ml.quantity, ml.faction_required
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
                ROUND(lte.probability * lde.chance / 100, 4) AS final_pct
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
      },
      merchants,
      recipes_producing: recipesProducing,
      recipes_consuming: recipesConsuming,
      loot_sources: lootSources,
      quests,
    };
  });
}
