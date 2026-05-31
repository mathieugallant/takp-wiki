import type { FastifyInstance } from 'fastify';
import { query } from '../db.js';

const SEARCHABLE: Array<{
  type: string;
  table: string;
  nameCol: string;
  idCol: string;
  extraCols?: string;
}> = [
  { type: 'npc', table: 'npc_types', nameCol: 'name', idCol: 'id', extraCols: 'level, class' },
  { type: 'item', table: 'items', nameCol: 'Name', idCol: 'id', extraCols: 'icon, itemtype' },
  { type: 'spell', table: 'spells_new', nameCol: 'name', idCol: 'id', extraCols: 'mana' },
  { type: 'zone', table: 'zone', nameCol: 'long_name', idCol: 'zoneidnumber', extraCols: 'short_name, expansion' },
  { type: 'faction', table: 'faction_list', nameCol: 'name', idCol: 'id', extraCols: undefined },
  { type: 'aa', table: 'altadv_vars', nameCol: 'name', idCol: 'skill_id', extraCols: 'type' },
  { type: 'recipe', table: 'tradeskill_recipe', nameCol: 'name', idCol: 'id', extraCols: 'tradeskill, trivial' },
];

export async function searchRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { q?: string; types?: string | string[] } }>(
    '/api/search',
    async (req, reply) => {
      const q = req.query.q?.trim() ?? '';
      if (q.length < 2) return reply.status(400).send({ error: 'Query must be at least 2 characters' });

      const typeFilter: string[] = [];
      if (req.query.types) {
        const raw = Array.isArray(req.query.types) ? req.query.types : [req.query.types];
        typeFilter.push(...raw.flatMap((t) => t.split(',')));
      }

      const targets = typeFilter.length
        ? SEARCHABLE.filter((s) => typeFilter.includes(s.type))
        : SEARCHABLE;

      const results: Record<string, unknown[]> = {};

      await Promise.all(
        targets.map(async ({ type, table, nameCol, idCol, extraCols }) => {
          const extra = extraCols ? `, ${extraCols}` : '';
          const rows = await query<Record<string, unknown>>(
            `SELECT ${idCol} AS id, ${nameCol} AS name${extra}
             FROM ${table}
             WHERE ${nameCol} LIKE ?
             ORDER BY ${nameCol}
             LIMIT 20`,
            [`%${q}%`]
          );
          results[type] = rows.map((r) => Object.assign({}, r, { _type: type }));
        })
      );

      return results;
    }
  );
}
