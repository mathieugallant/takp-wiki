import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db.js';

// TAKP AA tables:
//   altadv_vars  — AA definitions (skill_id PK, name, classes, cost, max_level, spellid)
//   aa_actions   — per-rank action data (aaid+rank PK, spell_id, reuse_time, …)
//   aa_effects   — per-AA effect entries (aaid+slot unique, effectid, base1, base2)

export async function aaRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { search?: string; class?: string; page?: string } }>(
    '/api/aas',
    async (req) => {
      const search = req.query.search?.trim() ?? '';
      const classId = req.query.class ? parseInt(req.query.class, 10) : null;
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = 50;
      const offset = (page - 1) * limit;

      const conditions: string[] = [];
      const params: (string | number | null)[] = [];
      if (search) {
        conditions.push('a.name LIKE ?');
        params.push(`%${search}%`);
      }
      if (classId !== null && !isNaN(classId)) {
        conditions.push('(a.classes & ?) != 0');
        params.push(1 << (classId - 1));
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      return query(
        `SELECT a.skill_id AS id, a.name, a.type, a.classes, a.aa_expansion,
                a.max_level, a.cost, a.prereq_skill, a.prereq_minpoints
         FROM altadv_vars a ${where}
         ORDER BY a.name LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );
    }
  );

  app.get<{ Params: { id: string } }>('/api/aas/:id', async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.status(400).send({ error: 'Invalid AA id' });

    const aa = await queryOne<Record<string, unknown>>(
      'SELECT * FROM altadv_vars WHERE skill_id = ?',
      [id]
    );
    if (!aa) return reply.status(404).send({ error: 'AA not found' });

    // Per-rank action data
    const ranks = await query<Record<string, unknown>>(
      `SELECT \`rank\`, reuse_time, spell_id, \`target\`,
              nonspell_action, nonspell_mana, nonspell_duration
       FROM aa_actions
       WHERE aaid = ?
       ORDER BY \`rank\``,
      [id]
    );

    // Effects for this AA
    const effects = await query(
      `SELECT slot, effectid, base1, base2
       FROM aa_effects
       WHERE aaid = ?
       ORDER BY slot`,
      [id]
    );

    // Linked spells: from altadv_vars.spellid and from per-rank spell_id
    const spellIds = new Set<number>();
    const avSpellId = aa.spellid as number;
    if (avSpellId && avSpellId > 0 && avSpellId < 4294967295) spellIds.add(avSpellId);
    for (const r of ranks) {
      const sid = r.spell_id as number;
      if (sid && sid > 0 && sid < 65535) spellIds.add(sid);
    }
    const spellIdArr = [...spellIds];
    const linkedSpells =
      spellIdArr.length > 0
        ? await query(
            `SELECT id, name FROM spells_new WHERE id IN (${spellIdArr.map(() => '?').join(',')})`,
            spellIdArr
          )
        : [];

    return { aa, ranks, effects, linked_spells: linkedSpells };
  });
}
