import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db.js';
import { EFFECT_LABELS } from './spells.js';

// TAKP AA tables:
//   altadv_vars  — AA definitions (skill_id PK, name, classes, cost, max_level, spellid)
//   aa_actions   — per-rank action data (aaid+rank PK, spell_id, reuse_time, …)
//   aa_effects   — per-AA effect entries (aaid+slot unique, effectid, base1, base2)

export async function aaRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { search?: string; class?: string; level?: string; effect?: string; sort?: string; dir?: string; page?: string } }>(
    '/api/aas',
    async (req) => {
      const search = req.query.search?.trim() ?? '';
      const classId = req.query.class ? parseInt(req.query.class, 10) : null;
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = 50;
      const offset = (page - 1) * limit;

      const levelMax = req.query.level ? parseInt(req.query.level, 10) : null;
      const effectId = req.query.effect ? parseInt(req.query.effect, 10) : null;

      const conditions: string[] = [];
      const params: (string | number | null)[] = [];
      if (search) {
        conditions.push('a.name LIKE ?');
        params.push(`%${search}%`);
      }
      if (classId !== null && !isNaN(classId)) {
        conditions.push('(a.classes & ?) != 0');
        params.push(1 << classId);
      }
      if (levelMax !== null && !isNaN(levelMax) && levelMax > 0) {
        conditions.push('(a.class_type = 0 OR a.class_type <= ?)');
        params.push(levelMax);
      }
      if (effectId !== null && !isNaN(effectId)) {
        conditions.push(
          `EXISTS (
            SELECT 1 FROM aa_effects ae
            WHERE ae.aaid BETWEEN a.skill_id AND a.skill_id + GREATEST(a.max_level, 1) - 1
              AND ae.effectid = ?
          )`
        );
        params.push(effectId);
      }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const AA_SORT: Record<string, string> = {
        id: 'a.skill_id', name: 'a.name', type: 'a.type',
      };
      const sortCol = AA_SORT[req.query.sort ?? ''] ?? 'a.name';
      const sortDir = req.query.dir === 'desc' ? 'DESC' : 'ASC';

      return query(
        `SELECT a.skill_id AS id, a.name, a.type, a.classes, a.aa_expansion,
                a.max_level, a.cost, a.prereq_skill, a.prereq_minpoints
         FROM altadv_vars a ${where}
         ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`,
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

    const maxLevel = (aa.max_level as number) || 1;

    // Per-rank action data (aa_actions.aaid = base skill_id; rank is 0-indexed)
    const actions = await query<Record<string, unknown>>(
      `SELECT \`rank\`, reuse_time, spell_id, \`target\`,
              nonspell_action, nonspell_mana, nonspell_duration,
              redux_aa, redux_rate, redux_aa2, redux_rate2
       FROM aa_actions
       WHERE aaid = ?
       ORDER BY \`rank\``,
      [id]
    );

    // Effects for ALL ranks (aa_effects.aaid = skill_id + rank - 1)
    const rawEffects = await query<Record<string, unknown>>(
      `SELECT aaid, slot, effectid, base1, base2
       FROM aa_effects
       WHERE aaid BETWEEN ? AND ?
       ORDER BY aaid, slot`,
      [id, id + maxLevel - 1]
    );
    // Group effects by 1-indexed rank number
    const effectsByRank: Record<number, Record<string, unknown>[]> = {};
    for (const e of rawEffects) {
      const rankNum = (e.aaid as number) - id + 1;
      if (!effectsByRank[rankNum]) effectsByRank[rankNum] = [];
      effectsByRank[rankNum].push({
        slot: e.slot,
        effectid: e.effectid,
        effect_name: EFFECT_LABELS[e.effectid as number] ?? `Effect ${e.effectid}`,
        base1: e.base1,
        base2: e.base2,
      });
    }

    // Prereq AA name lookup
    let prereq_name: string | null = null;
    const prereqSkill = aa.prereq_skill as number;
    if (prereqSkill && prereqSkill !== 0 && prereqSkill !== 4294967295) {
      const prereqAa = await queryOne<{ name: string }>(
        'SELECT name FROM altadv_vars WHERE skill_id = ?',
        [prereqSkill]
      );
      prereq_name = prereqAa?.name ?? null;
    }

    // Linked spells: from altadv_vars.spellid and from per-rank spell_id
    const spellIds = new Set<number>();
    const avSpellId = aa.spellid as number;
    if (avSpellId && avSpellId > 0 && avSpellId < 4294967295) spellIds.add(avSpellId);
    for (const a of actions) {
      const sid = a.spell_id as number;
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

    return { aa, actions, effects_by_rank: effectsByRank, prereq_name, linked_spells: linkedSpells };
  });
}
