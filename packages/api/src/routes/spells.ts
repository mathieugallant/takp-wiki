import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db.js';

// Spell effect type labels (EQEmu constants, partial)
const EFFECT_LABELS: Record<number, string> = {
  0: 'Current HP',
  1: 'Armor Class',
  2: 'Attack',
  3: 'Movement Speed',
  4: 'STR',
  5: 'DEX',
  6: 'AGI',
  7: 'STA',
  8: 'INT',
  9: 'WIS',
  10: 'CHA',
  11: 'Haste',
  14: 'Mana',
  15: 'Max HP',
  55: 'Charm',
  57: 'Fear',
  85: 'Resurrect',
  94: 'Summon',
};

function describeEffect(effectid: number, base: number): string {
  const label = EFFECT_LABELS[effectid];
  if (!label) return `Effect ${effectid} (${base})`;
  const sign = base >= 0 ? '+' : '';
  return `${label}: ${sign}${base}`;
}

export async function spellRoutes(app: FastifyInstance) {
  // List / search spells
  app.get<{ Querystring: { search?: string; page?: string } }>(
    '/api/spells',
    async (req) => {
      const search = req.query.search?.trim() ?? '';
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = 50;
      const offset = (page - 1) * limit;

      if (search) {
        return query(
          `SELECT id, name, mana, cast_time, \`range\`, targettype, resisttype
           FROM spells_new
           WHERE name LIKE ?
           ORDER BY name
           LIMIT ? OFFSET ?`,
          [`%${search}%`, limit, offset]
        );
      }
      return query(
        `SELECT id, name, mana, cast_time, \`range\`, targettype, resisttype
         FROM spells_new
         ORDER BY name
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
    }
  );

  // Spell detail
  app.get<{ Params: { id: string } }>('/api/spells/:id', async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.status(400).send({ error: 'Invalid spell id' });

    const spell = await queryOne<Record<string, unknown>>(
      'SELECT * FROM spells_new WHERE id = ?',
      [id]
    );
    if (!spell) return reply.status(404).send({ error: 'Spell not found' });

    // Build human-readable effect list from effect1-12 / effectbasevalue1-12
    const effects: { label: string; base: number }[] = [];
    for (let i = 1; i <= 12; i++) {
      const effectid = spell[`effectid${i}`] as number;
      const base = spell[`effect_base_value${i}`] as number;
      if (effectid && effectid !== 254 && effectid !== 0) {
        effects.push({ label: describeEffect(effectid, base), base });
      }
    }

    // Reagent components (component1-4 field in spells_new)
    const reagentIds = [1, 2, 3, 4]
      .map((n) => spell[`component${n}`] as number)
      .filter((id) => id && id > 0);

    const [reagents, npcCasters, itemsWithSpell] = await Promise.all([
      reagentIds.length > 0
        ? query(
            `SELECT id, Name AS name, icon FROM items WHERE id IN (${reagentIds.map(() => '?').join(',')})`,
            reagentIds
          )
        : Promise.resolve([]),
      // NPCs that have this spell in their spell sets
      query(
        `SELECT DISTINCT n.id, n.name, n.level, n.class
         FROM npc_spells_entries nse
         JOIN npc_types n ON n.npc_spells_id = nse.npc_spells_id
         WHERE nse.spellid = ?
         ORDER BY n.name
         LIMIT 200`,
        [id]
      ),
      // Items that reference this spell (click/worn/proc/focus)
      query(
        `SELECT id, Name AS name, icon,
                CASE
                  WHEN clickeffect = ? THEN 'click'
                  WHEN worneffect = ? THEN 'worn'
                  WHEN proceffect = ? THEN 'proc'
                  WHEN focuseffect = ? THEN 'focus'
                  WHEN scrolleffect = ? THEN 'scroll'
                END AS effect_type
         FROM items
         WHERE clickeffect = ? OR worneffect = ? OR proceffect = ? OR focuseffect = ? OR scrolleffect = ?
         ORDER BY Name`,
        [id, id, id, id, id, id, id, id, id, id]
      ),
    ]);

    return { spell, effects, reagents, npc_casters: npcCasters, items: itemsWithSpell };
  });
}
