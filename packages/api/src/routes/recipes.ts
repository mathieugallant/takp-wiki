import type { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db.js';

const TRADESKILL_NAMES: Record<number, string> = {
  55: 'Alchemy',
  60: 'Baking',
  45: 'Blacksmithing',
  63: 'Brewing',
  50: 'Fletching',
  56: 'Jewelry Making',
  64: 'Make Poison',
  65: 'Pottery',
  59: 'Research',
  52: 'Tailoring',
  58: 'Tinkering',
};

export async function recipeRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { search?: string; skill?: string; page?: string } }>(
    '/api/recipes',
    async (req) => {
      const search = req.query.search?.trim() ?? '';
      const skill = req.query.skill ? parseInt(req.query.skill, 10) : null;
      const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
      const limit = 50;
      const offset = (page - 1) * limit;

      const conditions: string[] = ['r.enabled = 1'];
      const params: (string | number | null)[] = [];

      if (search) {
        conditions.push('r.name LIKE ?');
        params.push(`%${search}%`);
      }
      if (skill !== null && !isNaN(skill)) {
        conditions.push('r.tradeskill = ?');
        params.push(skill);
      }

      return query(
        `SELECT r.id, r.name, r.tradeskill, r.trivial, r.skillneeded
         FROM tradeskill_recipe r
         WHERE ${conditions.join(' AND ')}
         ORDER BY r.name LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );
    }
  );

  app.get<{ Params: { id: string } }>('/api/recipes/:id', async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.status(400).send({ error: 'Invalid recipe id' });

    const recipe = await queryOne<Record<string, unknown>>(
      'SELECT * FROM tradeskill_recipe WHERE id = ?',
      [id]
    );
    if (!recipe) return reply.status(404).send({ error: 'Recipe not found' });

    const entries = await query<Record<string, unknown>>(
      `SELECT tre.item_id, tre.componentcount, tre.successcount, tre.failcount,
              tre.iscontainer, i.Name AS item_name, i.icon
       FROM tradeskill_recipe_entries tre
       JOIN items i ON i.id = tre.item_id
       WHERE tre.recipe_id = ?`,
      [id]
    );

    const ingredients = entries.filter(
      (e) => (e.iscontainer as number) === 0 && (e.successcount as number) === 0
    );
    const outputs = entries.filter(
      (e) => (e.iscontainer as number) === 0 && (e.successcount as number) > 0
    );
    const containers = entries.filter((e) => (e.iscontainer as number) === 1);

    const tradeskillName = TRADESKILL_NAMES[recipe.tradeskill as number] ?? `Skill ${recipe.tradeskill}`;

    return {
      recipe: { ...recipe, tradeskill_name: tradeskillName },
      ingredients,
      outputs,
      containers,
    };
  });
}
