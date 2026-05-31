import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPool } from '../../db.js';
import { createTestApp } from '../helpers/app.js';
import type { FastifyInstance } from 'fastify';

const skip = !process.env.DB_HOST;

describe.skipIf(skip)('GET /api/recipes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = createTestApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await getPool().end();
  });

  it('returns a list of recipes', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/recipes' });
    expect(res.statusCode).toBe(200);
    const body = res.json<unknown[]>();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    const first = body[0] as Record<string, unknown>;
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('name');
  });

  it('returns recipe detail with ingredients and outputs', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/recipes' });
    const recipes = list.json<Record<string, unknown>[]>();
    const id = recipes[0].id as number;

    const res = await app.inject({ method: 'GET', url: `/api/recipes/${id}` });
    expect(res.statusCode).toBe(200);
    const body = res.json<Record<string, unknown>>();
    expect(body).toHaveProperty('recipe');
    expect(body).toHaveProperty('ingredients');
    expect(body).toHaveProperty('outputs');
    expect(Array.isArray(body.ingredients)).toBe(true);
    expect(Array.isArray(body.outputs)).toBe(true);
  });

  it('returns 404 for unknown recipe id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/recipes/999999999' });
    expect(res.statusCode).toBe(404);
  });
});
